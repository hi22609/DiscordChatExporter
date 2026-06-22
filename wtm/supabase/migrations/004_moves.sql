create type public.move_category as enum (
  'bars',
  'sports',
  'food',
  'music',
  'outdoor',
  'gaming',
  'art',
  'social',
  'other'
);

create table public.moves (
  id              uuid primary key default gen_random_uuid(),
  creator_id      uuid not null references public.profiles(id) on delete cascade,
  title           text not null,
  description     text,
  category        public.move_category not null,
  location_name   text not null,
  location_point  geography(Point, 4326) not null,
  address         text,
  city            text not null default 'Pittsburgh',
  starts_at       timestamptz not null,
  ends_at         timestamptz,
  max_attendees   int,
  cover_image_url text,
  is_public       boolean not null default true,
  is_cancelled    boolean not null default false,
  cancellation_reason text,
  vibes           text[] default '{}',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint title_length check (char_length(title) between 3 and 100),
  constraint max_attendees_positive check (max_attendees is null or max_attendees > 0),
  constraint ends_after_starts check (ends_at is null or ends_at > starts_at),
  constraint not_past check (starts_at > created_at - interval '1 minute')
);

-- Spatial index (critical for ST_DWithin performance)
create index moves_location_gist on public.moves using gist(location_point);
-- Time-based feed queries
create index moves_starts_at on public.moves(starts_at);
-- Creator lookups
create index moves_creator_id on public.moves(creator_id);
-- City-scoped queries
create index moves_city on public.moves(city);
-- Active moves only
create index moves_active on public.moves(is_cancelled, is_public, starts_at)
  where is_cancelled = false and is_public = true;

-- Text search
create index moves_title_trgm on public.moves using gin(title gin_trgm_ops);

-- Updated at trigger
create trigger moves_updated_at
  before update on public.moves
  for each row execute procedure public.update_updated_at();

-- Increment profile move count on create
create or replace function public.increment_moves_created()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  update public.profiles
  set moves_created = moves_created + 1
  where id = new.creator_id;
  return new;
end;
$$;

create trigger on_move_created
  after insert on public.moves
  for each row execute procedure public.increment_moves_created();

alter table public.moves enable row level security;

create policy "moves_public_read" on public.moves
  for select using (is_public = true or creator_id = auth.uid());

create policy "moves_authenticated_insert" on public.moves
  for insert to authenticated with check (creator_id = auth.uid());

create policy "moves_creator_update" on public.moves
  for update using (creator_id = auth.uid());

create policy "moves_creator_delete" on public.moves
  for delete using (creator_id = auth.uid());

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
