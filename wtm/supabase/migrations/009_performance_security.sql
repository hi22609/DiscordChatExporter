-- ============================================================
-- Performance + security hardening
--
-- 1. nearby_moves returns the caller's own RSVP status inline,
--    eliminating the N+1 my_rsvp_status() call per feed card.
-- 2. invite_codes RLS tightened: the old policy let any member
--    SELECT the whole table and enumerate valid codes. Members
--    may now only read their own codes; validation goes through
--    the validate-invite Edge Function (service role).
-- 3. Per-user daily creation limits enforced at the DB level.
-- 4. reports table for community moderation.
-- ============================================================

-- ---- 1. Feed query returns my_status (kills N+1) ----
drop function if exists public.nearby_moves(float8,float8,int,text,int,int);
create or replace function public.nearby_moves(
  lat         float8,
  lng         float8,
  radius_m    int     default 8047,
  filter_cat  text    default null,
  page_offset int     default 0,
  page_size   int     default 20
)
returns table (
  id              uuid,
  creator_id      uuid,
  title           text,
  description     text,
  category        public.move_category,
  location_name   text,
  address         text,
  city            text,
  starts_at       timestamptz,
  ends_at         timestamptz,
  max_attendees   int,
  cover_image_url text,
  is_public       boolean,
  is_cancelled    boolean,
  vibes           text[],
  created_at      timestamptz,
  updated_at      timestamptz,
  attendee_count  int,
  spots_left      int,
  is_full         boolean,
  latitude        float8,
  longitude       float8,
  distance_m      float8,
  my_status       text
)
language sql stable security definer
as $$
  select
    m.id, m.creator_id, m.title, m.description, m.category,
    m.location_name, m.address, m.city, m.starts_at, m.ends_at,
    m.max_attendees, m.cover_image_url, m.is_public, m.is_cancelled,
    m.vibes, m.created_at, m.updated_at,
    m.attendee_count, m.spots_left, m.is_full,
    ST_Y(m.location_point::geometry) as latitude,
    ST_X(m.location_point::geometry) as longitude,
    ST_Distance(m.location_point, ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography) as distance_m,
    (select r.status::text from public.rsvps r
      where r.move_id = m.id and r.user_id = auth.uid() limit 1) as my_status
  from public.moves_with_counts m
  where
    m.is_cancelled = false
    and m.is_public = true
    and m.starts_at >= now() - interval '1 hour'
    and m.starts_at <= now() + interval '48 hours'
    and ST_DWithin(
      m.location_point,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
      radius_m
    )
    and (filter_cat is null or m.category::text = filter_cat)
  order by m.starts_at asc
  limit page_size
  offset page_offset;
$$;

-- ---- 2. Close the invite-code enumeration hole ----
drop policy if exists "invite_codes_authenticated_read" on public.invite_codes;
create policy "invite_codes_own_read" on public.invite_codes
  for select to authenticated using (created_by = auth.uid());

-- ---- 3. Per-user daily creation limits ----
create or replace function public.enforce_daily_limit()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  v_count int;
  v_limit int;
  v_owner uuid;
begin
  if tg_table_name = 'moves' then
    v_limit := 10; v_owner := new.creator_id;
    select count(*) into v_count from public.moves
      where creator_id = v_owner and created_at > now() - interval '24 hours';
  else
    v_limit := 20; v_owner := new.created_by;
    select count(*) into v_count from public.spots
      where created_by = v_owner and created_at > now() - interval '24 hours';
  end if;

  if v_count >= v_limit then
    raise exception 'daily_limit_reached' using errcode = 'P0002';
  end if;
  return new;
end;
$$;

create trigger moves_daily_limit
  before insert on public.moves
  for each row execute procedure public.enforce_daily_limit();

create trigger spots_daily_limit
  before insert on public.spots
  for each row execute procedure public.enforce_daily_limit();

-- ---- 4. Community reporting ----
create table public.reports (
  id           uuid primary key default gen_random_uuid(),
  reporter_id  uuid not null references public.profiles(id) on delete cascade,
  target_type  text not null check (target_type in ('move','spot','profile')),
  target_id    uuid not null,
  reason       text not null check (char_length(reason) between 3 and 500),
  created_at   timestamptz not null default now(),
  unique(reporter_id, target_type, target_id)
);

alter table public.reports enable row level security;

-- Insert-only for members; reading reports is an admin (service role) concern.
create policy "reports_member_insert" on public.reports
  for insert to authenticated with check (reporter_id = auth.uid());
