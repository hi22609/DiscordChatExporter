-- ═══════════════════════════════════════════
-- 016  COLLAPSE THE nearby_moves OVERLOADS
-- ═══════════════════════════════════════════
-- Two incompatible overloads of nearby_moves existed at once:
--
--   (lat, lng, radius_m,      filter_cat,      page_offset, page_size)  -- 010
--   (lat, lng, radius_meters, filter_category, uid)                     -- 014
--
-- Different arity means both survive, and PostgREST binds by the argument names
-- the client sends. The client sends radius_m/filter_cat/page_offset/page_size,
-- so every call bound the OLD one, which returns neither hot_score nor
-- crew_going nor waitlist_count.
--
-- The visible consequence: the "Trending" badge, the crew social-proof row and
-- the "N waitlisted" line are all built, all shipped, and all permanently
-- invisible in the app. Nothing in the client is wrong; it is calling a
-- function that cannot answer.
--
-- This collapses them into one canonical signature that keeps the pagination
-- the client already sends and returns the full row.

drop function if exists public.nearby_moves(float, float, int, text, int, int);
drop function if exists public.nearby_moves(float, float, int, text, uuid);

create function public.nearby_moves(
  lat          float,
  lng          float,
  radius_m     int     default 8047,
  filter_cat   text    default null,
  uid          uuid    default null,
  page_offset  int     default 0,
  page_size    int     default 50
)
returns table (
  id               uuid,
  creator_id       uuid,
  title            text,
  description      text,
  category         text,
  location_name    text,
  address          text,
  city             text,
  starts_at        timestamptz,
  ends_at          timestamptz,
  max_attendees    int,
  cover_image_url  text,
  is_public        bool,
  is_cancelled     bool,
  cancellation_reason text,
  vibes            text[],
  created_at       timestamptz,
  updated_at       timestamptz,
  latitude         float,
  longitude        float,
  distance_m       float,
  attendee_count   bigint,
  waitlist_count   bigint,
  spots_left       int,
  is_empty         bool,
  is_full          bool,
  hot_score        numeric,
  my_status        text,
  crew_going       jsonb
)
language sql stable security definer set search_path = public, extensions as $$
  select
    m.id, m.creator_id, m.title, m.description, m.category::text,
    m.location_name, m.address, m.city,
    m.starts_at, m.ends_at, m.max_attendees, m.cover_image_url,
    m.is_public, m.is_cancelled, m.cancellation_reason, m.vibes,
    m.created_at, m.updated_at,

    ST_Y(m.location_point::geometry)::float,
    ST_X(m.location_point::geometry)::float,
    ST_Distance(m.location_point,
                ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography)::float,

    count(r.id) filter (where r.status = 'going'),
    count(r.id) filter (where r.status = 'waitlist'),
    case when m.max_attendees is null then null
         else greatest(0, m.max_attendees - count(r.id) filter (where r.status = 'going'))::int
    end,
    count(r.id) filter (where r.status = 'going') = 0,
    case when m.max_attendees is null then false
         else count(r.id) filter (where r.status = 'going') >= m.max_attendees
    end,
    m.hot_score,
    max(r.status::text) filter (where r.user_id = coalesce(uid, auth.uid())),

    -- Friends of the caller who are already going, for the social-proof row.
    -- "Friends" is the invite tree: whoever invited you, plus everyone you
    -- invited. That is the only real social graph RAW has. Anyone you are
    -- already rolling with on this move counts too.
    coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', p.id, 'username', p.username,
               'display_name', p.display_name, 'avatar_url', p.avatar_url))
      from public.rsvps r2
      join public.profiles p on p.id = r2.user_id
      where r2.move_id = m.id
        and r2.status = 'going'
        and coalesce(uid, auth.uid()) is not null
        and r2.user_id <> coalesce(uid, auth.uid())
        and r2.user_id in (
          select ic.used_by from public.invite_codes ic
           where ic.created_by = coalesce(uid, auth.uid()) and ic.used_by is not null
          union
          select ic.created_by from public.invite_codes ic
           where ic.used_by = coalesce(uid, auth.uid()) and ic.created_by is not null
          union
          select unnest(r3.squad_with) from public.rsvps r3
           where r3.user_id = coalesce(uid, auth.uid()) and r3.move_id = m.id
        )
    ), '[]'::jsonb)

  from public.moves m
  left join public.rsvps r on r.move_id = m.id
  join public.profiles creator on creator.id = m.creator_id
  where
    ST_DWithin(m.location_point,
               ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
               radius_m)
    and m.is_cancelled = false
    and m.is_public    = true
    and m.starts_at   >= now()
    and m.starts_at   <= now() + interval '24 hours'
    and (filter_cat is null or m.category::text = filter_cat)
    and creator.is_banned = false
    and not public.blocked_either(m.creator_id)
  group by m.id
  order by m.hot_score desc, m.starts_at asc
  limit page_size offset page_offset;
$$;
