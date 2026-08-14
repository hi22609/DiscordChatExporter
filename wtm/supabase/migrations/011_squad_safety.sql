-- 011: Squad RSVPs + age gate + safety hardening

-- ---- 1. Squad RSVP support ----
-- squad_with: up to 2 other member UUIDs rolling together with this person
alter table public.rsvps
  add column if not exists squad_with uuid[] not null default '{}';

-- ---- 2. Profile additions ----
alter table public.profiles
  add column if not exists birthdate        date,
  add column if not exists social_handle   text,        -- @instagram or snap — accountability anchor
  add column if not exists is_banned       boolean not null default false,
  add column if not exists photo_approved  boolean not null default false,
  add column if not exists age_range       text;        -- '17-20','21-25' — set from birthdate on insert

-- Validate age range on profile insert/update
create or replace function public.set_age_range()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_age int;
begin
  if new.birthdate is null then return new; end if;
  v_age := date_part('year', age(new.birthdate));
  if v_age < 17 or v_age > 25 then
    raise exception 'age_out_of_range' using errcode = 'P0003';
  end if;
  new.age_range := case when v_age <= 20 then '17-20' else '21-25' end;
  return new;
end;
$$;

create trigger profiles_set_age_range
  before insert or update of birthdate on public.profiles
  for each row execute function public.set_age_range();

-- ---- 3. Invite-chain accountability ----
-- When a user is banned, auto-create an admin review flag on whoever invited them.
create or replace function public.flag_inviter_on_ban()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.reports (reporter_id, target_type, target_id, reason)
  select
    new.id,
    'profile',
    p.invited_by,
    'chain_review: user you invited was subsequently banned'
  from public.profiles p
  where p.id = new.id and p.invited_by is not null
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_user_banned on public.profiles;
create trigger on_user_banned
  after update of is_banned on public.profiles
  for each row
  when (new.is_banned = true and old.is_banned = false)
  execute function public.flag_inviter_on_ban();

-- ---- 4. Exclude banned users from all feeds ----
-- Rewrite nearby_moves to filter out banned creators and blocked users together.
-- (Also adds squad_with to the rsvps join so client can display crew groupings.)
create or replace function public.nearby_moves(
  lat              float,
  lng              float,
  radius_meters    int     default 8047,
  filter_category  text    default null,
  uid              uuid    default null
) returns table (
  id              uuid,
  creator_id      uuid,
  title           text,
  description     text,
  category        text,
  location_name   text,
  location_point  geography,
  address         text,
  starts_at       timestamptz,
  ends_at         timestamptz,
  max_attendees   int,
  cover_image_url text,
  is_public       bool,
  is_cancelled    bool,
  created_at      timestamptz,
  attendee_count  bigint,
  spots_left      bigint,
  my_status       text,
  my_squad        uuid[]
) language sql stable security definer set search_path = public, extensions as $$
  select
    m.id, m.creator_id, m.title, m.description, m.category,
    m.location_name, m.location_point, m.address,
    m.starts_at, m.ends_at, m.max_attendees, m.cover_image_url,
    m.is_public, m.is_cancelled, m.created_at,
    count(r.id) filter (where r.status = 'going')                          as attendee_count,
    case when m.max_attendees is null then null
         else m.max_attendees - count(r.id) filter (where r.status = 'going')
    end                                                                     as spots_left,
    max(r.status::text) filter (where r.user_id = uid)                     as my_status,
    coalesce((
      select squad_with from public.rsvps
      where move_id = m.id and user_id = uid and status = 'going'
      limit 1
    ), '{}')                                                                as my_squad
  from public.moves m
  left join public.rsvps r on r.move_id = m.id
  join public.profiles creator on creator.id = m.creator_id
  where
    st_dwithin(m.location_point,
               st_setsrid(st_makepoint(lng, lat), 4326)::geography,
               radius_meters)
    and m.is_cancelled = false
    and m.is_public    = true
    and m.starts_at   >= now()
    and m.starts_at   <= now() + interval '24 hours'
    and (filter_category is null or m.category::text = filter_category)
    -- exclude banned creators
    and creator.is_banned = false
    -- exclude blocked-either-direction (reuse helper from migration 010)
    and not public.blocked_either(m.creator_id)
  group by m.id
  order by m.starts_at asc;
$$;

-- ---- 5. New-account move cooldown (24h) ----
-- First 24h after joining: can RSVP but can't create moves (prevents fresh predator accounts).
drop policy if exists "moves_insert" on public.moves;
create policy "moves_insert" on public.moves
  as restrictive for insert to authenticated
  with check (
    creator_id = auth.uid()
    and exists (
      select 1 from public.profiles
      where id = auth.uid()
        and created_at <= now() - interval '24 hours'
        and is_banned = false
    )
  );

-- ---- 6. RLS: banned users see nothing ----
-- RESTRICTIVE so it ANDs with the permissive policy in 004 rather than being
-- OR-ed away. It carries ONLY the ban check: visibility (public vs. own move,
-- cancelled or not) stays the job of `moves_public_read` in 004. Repeating the
-- visibility clause here would lock creators out of their own private moves.
drop policy if exists "moves_select_not_banned" on public.moves;
create policy "moves_select_not_banned" on public.moves
  as restrictive for select using (
    not exists (
      select 1 from public.profiles
      where id = auth.uid() and is_banned = true
    )
  );
