-- ═══════════════════════════════════════════
-- 019  STOP PUBLISHING EVERY MEMBER'S PRIVATE COLUMNS
-- ═══════════════════════════════════════════
-- `profiles_public_read` was `using (true)`: no role restriction, no column
-- restriction. Anyone holding the anon key — which ships inside the app bundle,
-- so effectively anyone with the app — could read the whole table. For a 17-25
-- app that is every member's birthdate, Instagram handle and Expo push token.
--
-- Push tokens are the worst of the three. Expo's push endpoint needs no auth
-- for a token you already hold, so a world-readable token column means anyone
-- can push a notification to the entire install base under our icon.
--
-- 015 identified this and deliberately did not fix it, because every safe
-- repair breaks a read the client depends on and there was no database to
-- verify a fix against. There is one now: supabase/tests/run.sh.

-- ── 1. The row policy ─────────────────────────────────────────────────────
-- Own row only. This keeps `select('*')` working for your own profile, which
-- is what the age gate in app/_layout.tsx routes on, and what the edit screen
-- writes back.
drop policy if exists "profiles_public_read" on public.profiles;
drop policy if exists "profiles_read_own"    on public.profiles;
create policy "profiles_read_own" on public.profiles
  for select using (auth.uid() = id);

-- ── 2. The public projection ──────────────────────────────────────────────
-- Everything another member is allowed to see about you, and nothing else.
-- Banned accounts are filtered here rather than in the client, so no caller can
-- forget to.
--
-- This view is intentionally NOT security_invoker. That is the entire point of
-- it: it runs with the owner's rights so it can read past the own-row policy
-- above, and what makes that safe is the column list, which is the whole
-- security boundary. Every OTHER view in this schema must stay
-- security_invoker — 015 set them that way because they expose whole rows,
-- including private moves and their exact coordinates. The test asserts that,
-- with this view as the single named exception.
drop view if exists public.public_profiles;
create view public.public_profiles as
  select
    p.id,
    p.username,
    p.display_name,
    p.avatar_url,
    p.bio,
    p.city,
    p.follower_count,
    p.following_count,
    p.moves_created,
    p.created_at
  from public.profiles p
  where p.is_banned = false;

grant select on public.public_profiles to anon, authenticated;

-- ── 3. Chat needs author names without an embed ───────────────────────────
-- useMoveChat selected `*, profile:profiles(username, display_name,
-- avatar_url)`. PostgREST resolves an embed through RLS, so with the own-row
-- policy above every message except your own would render with a null author.
--
-- A function, rather than pointing the embed at public_profiles, because this
-- is verifiable: PostgREST's ability to infer an embeddable relationship
-- through a view depends on its version, and guessing at that is how the
-- overloaded nearby_moves shipped invisible for months.
--
-- The visibility rule is the same one msg_select enforces: you can read a
-- move's chat if you are going, or if it is your move.
create or replace function public.move_chat_page(
  p_move_id uuid,
  p_offset  int default 0,
  p_limit   int default 30
)
returns table (
  id           uuid,
  move_id      uuid,
  user_id      uuid,
  content      text,
  created_at   timestamptz,
  username     text,
  display_name text,
  avatar_url   text
)
language sql stable security definer set search_path = public, extensions as $$
  select
    m.id, m.move_id, m.user_id, m.content, m.created_at,
    p.username, p.display_name, p.avatar_url
  from public.move_messages m
  join public.profiles p on p.id = m.user_id
  where m.move_id = p_move_id
    and (
      exists (
        select 1 from public.rsvps r
        where r.move_id = p_move_id and r.user_id = auth.uid() and r.status = 'going'
      )
      or exists (
        select 1 from public.moves mv
        where mv.id = p_move_id and mv.creator_id = auth.uid()
      )
    )
  order by m.created_at desc
  limit least(p_limit, 100) offset p_offset;
$$;
