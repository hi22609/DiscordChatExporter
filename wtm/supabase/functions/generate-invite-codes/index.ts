import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Admin only — verify secret key
  const authHeader = req.headers.get('Authorization');
  // Fail closed. When ADMIN_SECRET is unset, Deno.env.get returns undefined and
  // the template literal became the string "Bearer undefined" — which anyone
  // could send to get in holding the service-role key.
  const adminSecret = Deno.env.get('ADMIN_SECRET');
  if (!adminSecret || authHeader !== `Bearer ${adminSecret}`) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders });
  }

  // Unvalidated, `count` went straight into Array.from({ length: count }) —
  // `{"count": 50000000}` either OOMs the isolate or fills the free-tier
  // database. Parsing is also moved inside the guarded path so a malformed body
  // returns 400 instead of an unhandled rejection.
  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const count = Math.min(Math.max(1, Number(body?.count) || 10), 100);
  const maxUses = Math.min(Math.max(1, Number(body?.maxUses) || 1), 50);
  const expiresInDays = body?.expiresInDays;

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const codes = Array.from({ length: count }, () => ({
    code: generateCode(),
    max_uses: maxUses,
    expires_at: expiresInDays
      ? new Date(Date.now() + expiresInDays * 86400000).toISOString()
      : null,
  }));

  const { data, error } = await supabase
    .from('invite_codes')
    .insert(codes)
    .select('code');

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }

  return new Response(
    JSON.stringify({ codes: data?.map((c) => c.code) }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
