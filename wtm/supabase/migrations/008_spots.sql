-- ============================================================
-- Fire Spots — community-mapped permanent gems.
-- Unlike moves (time-bound events), spots don't expire: urbex
-- locations, skate spots, sunset views, swimming holes. Members
-- drop them on the map; others 🔥 them and save them.
-- ============================================================

create type public.spot_category as enum (
  'urbex',
  'skate',
  'sunset',
  'view',
  'swim',
  'chill',
  'photo',
  'other'
);

create table public.spots (
  id              uuid primary key default gen_random_uuid(),
  created_by      uuid not null references public.profiles(id) on delete cascade,
  name            text not null,
  description     text,
  category        public.spot_category not null,
  location_point  geography(Point, 4326) not null,
  address         text,
  city            text not null default 'Pittsburgh',
  cover_image_url text,
  best_time       text,                 -- free-form: "golden hour", "after rain", "weekday mornings"
  fire_count      int not null default 0,
  save_count      int not null default 0,
  is_hidden       boolean not null default false,   -- soft-hide (moderation)
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint spot_name_length check (char_length(name) between 3 and 80)
);

create index spots_location_gist on public.spots using gist(location_point);
create index spots_category on public.spots(category);
create index spots_created_by on public.spots(created_by);
create index spots_name_trgm on public.spots using gin(name gin_trgm_ops);

create trigger spots_updated_at
  before update on public.spots
  for each row execute procedure public.update_updated_at();

-- 🔥 votes — one per member per spot
create table public.spot_fires (
  spot_id     uuid not null references public.spots(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (spot_id, user_id)
);

-- Bookmarks
create table public.spot_saves (
  spot_id     uuid not null references public.spots(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (spot_id, user_id)
);

-- Keep denormalized counts in sync
create or replace function public.sync_spot_counts()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if tg_table_name = 'spot_fires' then
    update public.spots set fire_count = fire_count + (case when tg_op = 'INSERT' then 1 else -1 end)
    where id = coalesce(new.spot_id, old.spot_id);
  else
    update public.spots set save_count = save_count + (case when tg_op = 'INSERT' then 1 else -1 end)
    where id = coalesce(new.spot_id, old.spot_id);
  end if;
  return coalesce(new, old);
end;
$$;

create trigger on_spot_fire_change
  after insert or delete on public.spot_fires
  for each row execute procedure public.sync_spot_counts();

create trigger on_spot_save_change
  after insert or delete on public.spot_saves
  for each row execute procedure public.sync_spot_counts();

-- RLS
alter table public.spots enable row level security;
alter table public.spot_fires enable row level security;
alter table public.spot_saves enable row level security;

create policy "spots_public_read" on public.spots
  for select using (is_hidden = false or created_by = auth.uid());
create policy "spots_authenticated_insert" on public.spots
  for insert to authenticated with check (created_by = auth.uid());
create policy "spots_creator_update" on public.spots
  for update using (created_by = auth.uid());
create policy "spots_creator_delete" on public.spots
  for delete using (created_by = auth.uid());

create policy "spot_fires_public_read" on public.spot_fires for select using (true);
create policy "spot_fires_owner_insert" on public.spot_fires
  for insert to authenticated with check (user_id = auth.uid());
create policy "spot_fires_owner_delete" on public.spot_fires
  for delete using (user_id = auth.uid());

create policy "spot_saves_owner_read" on public.spot_saves for select using (user_id = auth.uid());
create policy "spot_saves_owner_insert" on public.spot_saves
  for insert to authenticated with check (user_id = auth.uid());
create policy "spot_saves_owner_delete" on public.spot_saves
  for delete using (user_id = auth.uid());

-- Geo query for the map layer. Ordered hottest-first within range.
create or replace function public.nearby_spots(
  lat         float8,
  lng         float8,
  radius_m    int   default 16093,   -- default 10 miles; spots are worth a drive
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
  order by s.fire_count desc, distance_m asc
  limit page_size;
$$;

-- Single spot with my vote state (detail screen)
create or replace function public.get_spot(p_spot_id uuid)
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
  i_fired         boolean,
  i_saved         boolean,
  creator_username text,
  creator_avatar   text
)
language sql stable security definer
as $$
  select
    s.id, s.created_by, s.name, s.description, s.category,
    s.address, s.city, s.cover_image_url, s.best_time,
    s.fire_count, s.save_count, s.created_at,
    ST_Y(s.location_point::geometry) as latitude,
    ST_X(s.location_point::geometry) as longitude,
    exists (select 1 from public.spot_fires f where f.spot_id = s.id and f.user_id = auth.uid()) as i_fired,
    exists (select 1 from public.spot_saves v where v.spot_id = s.id and v.user_id = auth.uid()) as i_saved,
    p.username as creator_username,
    p.avatar_url as creator_avatar
  from public.spots s
  join public.profiles p on p.id = s.created_by
  where s.id = p_spot_id and (s.is_hidden = false or s.created_by = auth.uid());
$$;
