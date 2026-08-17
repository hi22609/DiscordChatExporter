-- ============================================================
-- Referral / invite-graph system
-- "You need to know someone to get in" — but frictionless if you do.
-- Every member gets a personal, shareable code with a limited number
-- of invites. Using someone's code links you to them (referral graph).
-- ============================================================

-- Each member's personal code + who invited them
alter table public.profiles
  add column referral_code text unique,
  add column invited_by    uuid references public.profiles(id) on delete set null;

create index profiles_invited_by on public.profiles(invited_by);
create index profiles_referral_code on public.profiles(referral_code);

-- How many invites each new member gets to hand out
create or replace function public.default_invite_allowance()
returns int language sql immutable as $$ select 5; $$;

-- Generate a branded, collision-checked personal code, e.g. "MOVE7K2Q"
create or replace function public.generate_referral_code()
returns text language plpgsql security definer set search_path = ''
as $$
declare
  chars   text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- no ambiguous chars
  suffix  text;
  candidate text;
  i int;
begin
  loop
    suffix := '';
    for i in 1..4 loop
      suffix := suffix || substr(chars, floor(random() * length(chars))::int + 1, 1);
    end loop;
    candidate := 'MOVE' || suffix;                    -- 8 chars, matches code_format
    exit when not exists (select 1 from public.invite_codes where code = candidate)
          and not exists (select 1 from public.profiles where referral_code = candidate);
  end loop;
  return candidate;
end;
$$;

-- Replace the signup handler:
--   1. consume the invite code that got this person in (if any) -> referral graph
--   2. mint the new member their own shareable code with a limited allowance
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  v_code_id   uuid;
  v_inviter   uuid;
  v_referral  text;
begin
  v_code_id := nullif(new.raw_user_meta_data->>'invite_code_id', '')::uuid;

  -- Atomically burn one use of the invite code and find who owns it.
  if v_code_id is not null then
    update public.invite_codes
      set use_count = use_count + 1,
          used_by   = coalesce(used_by, new.id)
      where id = v_code_id and use_count < max_uses
      returning created_by into v_inviter;
  end if;

  v_referral := public.generate_referral_code();

  insert into public.profiles (id, username, display_name, invited_by, referral_code)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)),
    coalesce(new.raw_user_meta_data->>'display_name', ''),
    v_inviter,
    v_referral
  );

  -- The new member's personal invite code lives in invite_codes,
  -- so the existing validate-invite Edge Function works for it unchanged.
  insert into public.invite_codes (code, created_by, max_uses)
  values (v_referral, new.id, public.default_invite_allowance());

  return new;
end;
$$;

-- Current member's shareable code + how many invites remain.
create or replace function public.get_my_invite()
returns table (
  code           text,
  max_uses       int,
  use_count      int,
  invites_left   int
)
language sql stable security definer set search_path = ''
as $$
  select
    c.code,
    c.max_uses,
    c.use_count,
    greatest(0, c.max_uses - c.use_count) as invites_left
  from public.invite_codes c
  where c.created_by = auth.uid()
  order by c.created_at asc
  limit 1;
$$;

-- People this member has brought into the club.
create or replace function public.get_my_referrals()
returns table (
  id            uuid,
  username      text,
  display_name  text,
  avatar_url    text,
  joined_at     timestamptz
)
language sql stable security definer set search_path = ''
as $$
  select p.id, p.username, p.display_name, p.avatar_url, p.created_at
  from public.profiles p
  where p.invited_by = auth.uid()
  order by p.created_at desc
  limit 100;
$$;
