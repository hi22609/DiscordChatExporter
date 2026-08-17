-- ═══════════════════════════════════════════════════════════════════════════
-- 015  SECURITY HARDENING
-- ═══════════════════════════════════════════════════════════════════════════
-- Closes the data-exposure and runaway-cost findings from the overnight audit.
-- Every statement here is free-tier compatible: no extensions, no scheduled
-- jobs, no new infrastructure.
--
-- Apply order matters. This must run after 014.
-- ═══════════════════════════════════════════════════════════════════════════


-- ── 1. Views must not bypass RLS ───────────────────────────────────────────
-- A view created without security_invoker executes as its owner, which holds
-- BYPASSRLS. Supabase grants SELECT on new public views to anon, so
-- `GET /rest/v1/moves_with_counts` returned every private move, and its exact
-- location_point, to anyone holding the anon key that ships in the app bundle.
alter view public.moves_with_counts    set (security_invoker = on);
alter view public.move_reaction_counts set (security_invoker = on);


-- ── 2. profiles read exposure — DELIBERATELY NOT CHANGED HERE ──────────────
-- `profiles_public_read using (true)` publishes every column of every row,
-- including push_token, birthdate and social_handle. That is a real and serious
-- exposure (audit C2), but every safe repair — restricting to own-row, or
-- revoking column SELECT — breaks reads the client depends on:
--   * app/user/[id].tsx:78          reads another member's profile
--   * useMoveChat.ts:21             embeds profiles(...) to label messages
--   * useSession.ts:34              uses select('*'), which needs whole-table SELECT
-- PostgREST cannot embed a replacement view across a foreign key without extra
-- setup, so this needs client changes verified against a live database. RAW has
-- no Supabase project provisioned, so it cannot be verified tonight and is not
-- being changed blind.
-- The exact SQL and the exact client edits are written up in
-- WTM_REPORTS/DECISIONS_FOR_MICHAEL.md. Do this before any public launch.

-- ── 3. Users must not be able to edit their own moderation state ───────────
-- profiles_owner_update had no WITH CHECK and no column restriction, so a
-- banned user could PATCH is_banned=false on their own row. Column-level
-- privileges are evaluated independently of RLS, which makes this airtight.
-- This only narrows UPDATE, so it cannot affect any read path.
revoke update on public.profiles from authenticated;
grant update (display_name, avatar_url, bio, city, push_token, social_handle, birthdate)
  on public.profiles to authenticated;

-- Re-assert the row scope, now with a WITH CHECK so a row cannot be moved to
-- another owner.
drop policy if exists "profiles_owner_update" on public.profiles;
create policy "profiles_owner_update" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);


-- ── 4. The invite gate has to be enforced server-side ──────────────────────
-- handle_new_user read invite_code_id out of raw_user_meta_data (which the
-- caller controls) and skipped the check entirely when it was absent, so
-- POST /auth/v1/signup with no code minted a full member account.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_code_id  uuid;
  v_inviter  uuid;
  v_used_id  uuid;
begin
  v_code_id := (new.raw_user_meta_data ->> 'invite_code_id')::uuid;

  if v_code_id is null then
    raise exception 'invite_required'
      using hint = 'Sign-up requires a valid invite code.';
  end if;

  -- Burn one use atomically. Test existence on the row's own id, not on
  -- created_by: admin-seeded codes legitimately have a null creator, and
  -- keying the check on created_by rejected every one of them.
  update public.invite_codes
     set use_count = use_count + 1
   where id = v_code_id
     and use_count < max_uses
  returning id, created_by into v_used_id, v_inviter;

  if v_used_id is null then
    raise exception 'invite_invalid_or_exhausted';
  end if;

  insert into public.profiles (id, username, invited_by)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', 'member_' || left(new.id::text, 8)),
    v_inviter
  );

  -- used_by references profiles(id), so it can only be set once the profile
  -- exists. Setting it in the UPDATE above violated that foreign key and broke
  -- signup outright.
  update public.invite_codes
     set used_by = coalesce(used_by, new.id)
   where id = v_code_id;

  return new;
end;
$$;


-- ── 5. mark_activity_read was an IDOR ──────────────────────────────────────
-- It took the target user id as an argument and never compared it to
-- auth.uid(), while running as owner — so any caller could clear anyone's
-- notifications. The caller is now derived server-side.
drop function if exists public.mark_activity_read(uuid);

create or replace function public.mark_activity_read()
returns void
language sql
security definer
set search_path = ''
as $$
  update public.activity_feed
     set read = true
   where user_id = auth.uid()
     and read = false;
$$;


-- ── 6. promote_from_waitlist must not be callable directly ─────────────────
-- PostgREST exposes every public function as an RPC. This one is SECURITY
-- DEFINER, takes only a move id, and unconditionally flips someone else's RSVP
-- to 'going'. It is only ever meant to run from its trigger.
revoke execute on function public.promote_from_waitlist(uuid) from anon, authenticated;


-- ── 7. Pin search_path on every SECURITY DEFINER function ──────────────────
-- A mutable search_path lets any role that can create objects in a schema on
-- the path shadow a table and have owner-privileged code read or write it.
-- ALTER FUNCTION avoids re-declaring the bodies.
--
-- Every function gets `public, extensions`, not the empty path. The empty path
-- is stricter, but only for a body that qualifies every single name — and these
-- bodies do not. Most were written before this file existed and say `from
-- rsvps`, not `from public.rsvps`; the PostGIS ones reach for `geography` and
-- `st_dwithin` unqualified as well. Handing those an empty path does not harden
-- them, it breaks them at call time with "relation does not exist", and the
-- break is invisible until a member actually hits that path in production.
-- What closes the vulnerability is that the path stops being *mutable* — the
-- caller can no longer prepend a schema and shadow a table the owner-privileged
-- body reads. A fixed `public, extensions` does that just as completely.
do $$
declare
  fn record;
begin
  for fn in
    select p.oid, p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prosecdef                                    -- SECURITY DEFINER
      and not exists (
        select 1 from unnest(coalesce(p.proconfig, '{}')) c
        where c like 'search_path=%'
      )
  loop
    execute format('alter function %s set search_path = public, extensions', fn.sig);
  end loop;
end $$;


-- ── 8. Bound the fan-out vectors ───────────────────────────────────────────
-- rsvps.squad_with is uuid[] with no length limit, and notify_squad_members
-- inserts one activity row per element. One RSVP carrying 500k UUIDs writes
-- 500k rows. The comment on the column always claimed "up to 2".
alter table public.rsvps
  drop constraint if exists rsvps_squad_with_len;
alter table public.rsvps
  add constraint rsvps_squad_with_len
  check (squad_with is null or array_length(squad_with, 1) is null
         or array_length(squad_with, 1) <= 2);

-- NOTE: the `on conflict do nothing` in notify_squad_members (012:112) is inert
-- because activity_feed has no unique constraint to conflict on. A unique index
-- was considered and deliberately REJECTED: notify_creator_on_rsvp (012:86)
-- inserts WITHOUT an on-conflict clause, so a unique index would raise and abort
-- the entire RSVP transaction on a normal leave-then-rejoin. It would also
-- permanently swallow legitimate repeat notifications. The array-length cap
-- above is what actually closes the fan-out; duplicate rows are cosmetic.

-- Free-text columns had no length ceiling at all, so a member could store a
-- 100 MB description and fill the 500 MB free-tier database from inside the app.
alter table public.moves
  drop constraint if exists moves_description_len,
  add  constraint moves_description_len check (description is null or char_length(description) <= 2000);
alter table public.spots
  drop constraint if exists spots_description_len,
  add  constraint spots_description_len check (description is null or char_length(description) <= 2000);


-- ── 9. Chat needs a removal path ───────────────────────────────────────────
-- move_messages had SELECT and INSERT policies only. Under RLS an absent
-- policy denies, so nobody — not the author, not the move creator — could ever
-- delete a message. App Store guideline 1.2 requires a way to remove UGC.
drop policy if exists "msg_delete" on public.move_messages;
create policy "msg_delete" on public.move_messages
  for delete using (
    user_id = auth.uid()
    or exists (
      select 1 from public.moves m
      where m.id = move_id and m.creator_id = auth.uid()
    )
  );


-- ── 10. Indexes ────────────────────────────────────────────────────────────
-- Foreign keys with ON DELETE CASCADE and no index force a sequential scan of
-- the child table on every parent delete. Deleting one account scanned seven.
create index if not exists activity_feed_actor    on public.activity_feed (actor_id);
create index if not exists activity_feed_move     on public.activity_feed (move_id);
create index if not exists move_messages_user     on public.move_messages (user_id);
create index if not exists move_chat_reads_move   on public.move_chat_reads (move_id);
create index if not exists move_reactions_user    on public.move_reactions (user_id);
create index if not exists spot_fires_user        on public.spot_fires (user_id);
create index if not exists spot_saves_user        on public.spot_saves (user_id);
create index if not exists invite_codes_used_by   on public.invite_codes (used_by);

-- hot_score is the feed's ORDER BY key and had no index; fire_count is
-- nearby_spots' sort key and had none either.
create index if not exists moves_hot
  on public.moves (hot_score desc, starts_at)
  where is_cancelled = false and is_public = true;
create index if not exists spots_fire
  on public.spots (fire_count desc)
  where is_hidden = false;

-- Redundant: each duplicates a unique constraint or is a strict prefix of a
-- composite index that already exists. Pure write amplification.
drop index if exists public.invite_codes_code;   -- implied by `code text unique`
drop index if exists public.rsvps_move_id;       -- prefix of rsvps_move_status
drop index if exists public.move_reactions_move; -- prefix of the PK
