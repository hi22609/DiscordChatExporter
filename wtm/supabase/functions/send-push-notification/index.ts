import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function sendExpoPushNotification(token: string, title: string, body: string, data?: object) {
  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: token,
      title,
      body,
      data: data ?? {},
      sound: 'default',
      priority: 'high',
    }),
  });
  return response.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { type, moveId, actorId } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    if (type === 'new_rsvp') {
      // Notify move creator that someone joined
      const { data: move } = await supabase
        .from('moves')
        .select('creator_id, title')
        .eq('id', moveId)
        .single();

      if (!move) return new Response('ok', { headers: corsHeaders });

      // Don't notify if creator RSVPd to their own move
      if (move.creator_id === actorId) return new Response('ok', { headers: corsHeaders });

      const { data: actor } = await supabase
        .from('profiles')
        .select('display_name, username')
        .eq('id', actorId)
        .single();

      const { data: creator } = await supabase
        .from('profiles')
        .select('push_token')
        .eq('id', move.creator_id)
        .single();

      if (!creator?.push_token) return new Response('ok', { headers: corsHeaders });

      const actorName = actor?.display_name || actor?.username || 'Someone';
      await sendExpoPushNotification(
        creator.push_token,
        `${actorName} joined your move!`,
        `"${move.title}" just got one more head`,
        { screen: 'move', moveId }
      );
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
