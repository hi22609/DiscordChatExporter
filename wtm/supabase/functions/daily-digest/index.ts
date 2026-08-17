/**
 * daily-digest
 *
 * Schedule: 5:00 PM Eastern every day (22:00 UTC, or 21:00 UTC during EDT).
 * Sends one push notification per user with a push_token summarizing
 * what's happening tonight near them. This is the #1 daily-active-user driver
 * for a local events app — it creates the habit loop of opening WTM at 5PM.
 *
 * Deploy:
 *   supabase functions deploy daily-digest
 *
 * Invoke (cron):
 *   In Supabase dashboard → Edge Functions → Schedules → new schedule
 *   Cron expression: 0 22 * * *   (5PM EST / 10PM UTC)
 *   Or set up via pg_cron in a migration:
 *     select cron.schedule('daily-digest', '0 22 * * *',
 *       $$select net.http_post(url:='https://<ref>.supabase.co/functions/v1/daily-digest',
 *                headers:='{"Authorization":"Bearer <anon_key>"}'::jsonb)$$);
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

// Pittsburgh default coords for city-wide digest
const PITTSBURGH = { lat: 40.4406, lng: -79.9959 };

interface PushToken {
  push_token: string;
  username: string;
}

interface NearbyMoveRow {
  title: string;
  starts_at: string;
  attendee_count: number;
  hot_score: number;
}

Deno.serve(async (req) => {
  // Accept cron trigger (GET) or manual POST
  if (req.method !== 'GET' && req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    // 1. Count tonight's moves city-wide
    const { data: moves, error: movesErr } = await supabase.rpc('nearby_moves', {
      lat: PITTSBURGH.lat,
      lng: PITTSBURGH.lng,
      radius_meters: 32186, // 20-mile city-wide radius for the digest
    }) as { data: NearbyMoveRow[] | null; error: unknown };

    if (movesErr) throw movesErr;

    const totalMoves  = moves?.length ?? 0;
    const hotMoves    = moves?.filter((m) => m.hot_score >= 1.5).length ?? 0;
    const topMove     = moves?.sort((a, b) => b.hot_score - a.hot_score)[0] ?? null;

    if (totalMoves === 0) {
      return new Response(JSON.stringify({ sent: 0, reason: 'no moves tonight' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Build notification copy
    let title: string;
    let body: string;

    if (hotMoves > 0 && topMove) {
      title = `${hotMoves} move${hotMoves > 1 ? 's' : ''} filling up fast 🔥`;
      body  = `"${topMove.title}" + ${totalMoves - 1} more tonight. Pull up.`;
    } else {
      title = `${totalMoves} move${totalMoves > 1 ? 's' : ''} tonight in Pittsburgh`;
      body  = totalMoves === 1
        ? `"${topMove!.title}" is happening. Don't miss it.`
        : `Tap to see what's moving tonight.`;
    }

    // 3. Fetch all users with push tokens
    const { data: users, error: usersErr } = await supabase
      .from('profiles')
      .select('push_token, username')
      .not('push_token', 'is', null)
      .eq('is_banned', false) as { data: PushToken[] | null; error: unknown };

    if (usersErr) throw usersErr;
    if (!users?.length) {
      return new Response(JSON.stringify({ sent: 0, reason: 'no push tokens' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 4. Send in batches of 100 (Expo limit per request)
    const messages = users.map((u) => ({
      to: u.push_token,
      title,
      body,
      data: { type: 'daily_digest', move_count: totalMoves },
      sound: 'default',
      badge: totalMoves,
    }));

    const BATCH = 100;
    let sent = 0;

    for (let i = 0; i < messages.length; i += BATCH) {
      const batch = messages.slice(i, i + BATCH);
      const res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(batch),
      });

      if (res.ok) sent += batch.length;
    }

    return new Response(JSON.stringify({ sent, totalMoves, hotMoves }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('daily-digest error', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
