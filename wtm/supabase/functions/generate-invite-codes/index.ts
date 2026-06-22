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
  if (authHeader !== `Bearer ${Deno.env.get('ADMIN_SECRET')}`) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders });
  }

  const { count = 10, maxUses = 1, expiresInDays } = await req.json();

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
