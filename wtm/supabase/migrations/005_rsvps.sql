create type public.rsvp_status as enum ('going', 'maybe', 'left');

create table public.rsvps (
  id          uuid primary key default gen_random_uuid(),
  move_id     uuid not null references public.moves(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  status      public.rsvp_status not null default 'going',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique(move_id, user_id)
);

create index rsvps_move_id on public.rsvps(move_id);
create index rsvps_user_id on public.rsvps(user_id);
create index rsvps_move_status on public.rsvps(move_id, status);

create trigger rsvps_updated_at
  before update on public.rsvps
  for each row execute procedure public.update_updated_at();

-- Enforce max_attendees at DB level
create or replace function public.check_move_capacity()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  v_max_attendees int;
  v_current_count int;
begin
  if new.status != 'going' then
    return new;
  end if;

  select max_attendees into v_max_attendees
  from public.moves where id = new.move_id;

  if v_max_attendees is null then
    return new; -- unlimited
  end if;

  select count(*) into v_current_count
  from public.rsvps
  where move_id = new.move_id and status = 'going'
    and (tg_op = 'INSERT' or id != new.id);

  if v_current_count >= v_max_attendees then
    raise exception 'move_full' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

create trigger enforce_move_capacity
  before insert or update on public.rsvps
  for each row execute procedure public.check_move_capacity();

alter table public.rsvps enable row level security;

create policy "rsvps_public_read" on public.rsvps
  for select using (true);

create policy "rsvps_authenticated_insert" on public.rsvps
  for insert to authenticated with check (user_id = auth.uid());

create policy "rsvps_owner_update" on public.rsvps
  for update using (user_id = auth.uid());

create policy "rsvps_owner_delete" on public.rsvps
  for delete using (user_id = auth.uid());

-- Get first N attendee avatars for a move
create or replace function public.get_move_attendees(
  p_move_id   uuid,
  p_limit     int default 5
)
returns table (
  user_id     uuid,
  username    text,
  display_name text,
  avatar_url  text
)
language sql stable security definer
as $$
  select p.id, p.username, p.display_name, p.avatar_url
  from public.rsvps r
  join public.profiles p on p.id = r.user_id
  where r.move_id = p_move_id and r.status = 'going'
  order by r.created_at asc
  limit p_limit;
$$;


-- ═══════════════════════════════════════════
-- MOVE VIEWS AND GEO FUNCTIONS
-- ═══════════════════════════════════════════
-- These live here, not in 004, because moves_with_counts selects from
-- public.rsvps and nearby_moves/search_moves read that view. In 004 they ran
-- before the rsvps table existed and the migration failed outright with
-- 'relation "public.rsvps" does not exist'. They are appended to 005 rather
-- than kept in a 005a file so the apply order cannot depend on how the shell
-- collates '_' against 'a'.

-- View with computed attendee counts
create view public.moves_with_counts as
  select
    m.*,
    coalesce(r.attendee_count, 0)::int as attendee_count,
    case
      when m.max_attendees is null then null
      else greatest(0, m.max_attendees - coalesce(r.attendee_count, 0))::int
    end as spots_left,
    coalesce(r.attendee_count, 0) = 0 as is_empty,
    case
      when m.max_attendees is null then false
      else coalesce(r.attendee_count, 0) >= m.max_attendees
    end as is_full
  from public.moves m
  left join (
    select move_id, count(*) as attendee_count
    from public.rsvps
    where status = 'going'
    group by move_id
  ) r on r.move_id = m.id;

-- Core geo query function — callable via supabase.rpc()
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
  distance_m      float8
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
    ST_Distance(m.location_point, ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography) as distance_m
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

-- Search moves by title
create or replace function public.search_moves(
  query       text,
  lat         float8 default null,
  lng         float8 default null,
  radius_m    int    default 80467
)
returns setof public.moves_with_counts
language sql stable security definer
as $$
  select m.*
  from public.moves_with_counts m
  where
    m.is_cancelled = false
    and m.is_public = true
    and m.starts_at >= now() - interval '1 hour'
    and m.title ilike '%' || query || '%'
    and (
      lat is null or lng is null
      or ST_DWithin(
        m.location_point,
        ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
        radius_m
      )
    )
  order by m.starts_at asc
  limit 50;
$$;

