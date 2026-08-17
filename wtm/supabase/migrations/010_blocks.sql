-- ============================================================
-- User blocking — required for App Store UGC compliance.
-- Blocking hides content in BOTH directions: you stop seeing
-- their moves/spots, and they stop seeing yours.
-- ============================================================

create table public.blocks (
  blocker_id  uuid not null references public.profiles(id) on delete cascade,
  blocked_id  uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint no_self_block check (blocker_id <> blocked_id)
);

create index blocks_blocked_id on public.blocks(blocked_id);

alter table public.blocks enable row level security;

create policy "blocks_own_read" on public.blocks
  for select to authenticated using (blocker_id = auth.uid());
create policy "blocks_own_insert" on public.blocks
  for insert to authenticated with check (blocker_id = auth.uid());
create policy "blocks_own_delete" on public.blocks
  for delete using (blocker_id = auth.uid());

-- True when either party has blocked the other.
create or replace function public.blocked_either(other_user uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.blocks
    where (blocker_id = auth.uid() and blocked_id = other_user)
       or (blocker_id = other_user and blocked_id = auth.uid())
  );
$$;

-- ---- Re-create feed functions with block filtering ----

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
    and not public.blocked_either(m.creator_id)
  order by m.starts_at asc
  limit page_size
  offset page_offset;
$$;

drop function if exists public.nearby_spots(float8,float8,int,text,int);
create or replace function public.nearby_spots(
  lat         float8,
  lng         float8,
  radius_m    int   default 16093,
  filter_cat  text  default null,
  page_size   int   default 100
)
returns table (
  id              uuid,
  created_by      uuid,
  name            text,
  description     text,
  category        public.spot_category,
  address         text,
  city            text,
  cover_image_url text,
  best_time       text,
  fire_count      int,
  save_count      int,
  created_at      timestamptz,
  latitude        float8,
  longitude       float8,
  distance_m      float8,
  i_fired         boolean,
  i_saved         boolean
)
language sql stable security definer
as $$
  select
    s.id, s.created_by, s.name, s.description, s.category,
    s.address, s.city, s.cover_image_url, s.best_time,
    s.fire_count, s.save_count, s.created_at,
    ST_Y(s.location_point::geometry) as latitude,
    ST_X(s.location_point::geometry) as longitude,
    ST_Distance(s.location_point, ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography) as distance_m,
    exists (select 1 from public.spot_fires f where f.spot_id = s.id and f.user_id = auth.uid()) as i_fired,
    exists (select 1 from public.spot_saves v where v.spot_id = s.id and v.user_id = auth.uid()) as i_saved
  from public.spots s
  where
    s.is_hidden = false
    and ST_DWithin(
      s.location_point,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
      radius_m
    )
    and (filter_cat is null or s.category::text = filter_cat)
    and not public.blocked_either(s.created_by)
  order by s.fire_count desc, distance_m asc
  limit page_size;
$$;

-- Attendee lists also respect blocks.
create or replace function public.get_move_attendees(
  p_move_id   uuid,
  p_limit     int default 5
)
returns table (
  user_id      uuid,
  username     text,
  display_name text,
  avatar_url   text
)
language sql stable security definer
as $$
  select p.id, p.username, p.display_name, p.avatar_url
  from public.rsvps r
  join public.profiles p on p.id = r.user_id
  where r.move_id = p_move_id
    and r.status = 'going'
    and not public.blocked_either(p.id)
  order by r.created_at asc
  limit p_limit;
$$;
