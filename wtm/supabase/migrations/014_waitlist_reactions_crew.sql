-- ═══════════════════════════════════════════
-- 014 WAITLIST · HYPE REACTIONS · CREW GOING
-- ═══════════════════════════════════════════

-- ── 1. Waitlist status ────────────────────────────────────────────────────
-- `rsvps.status` is the rsvp_status ENUM from 005 ('going','maybe','left').
-- The 'waitlist' value is added to the type in 014a_rsvp_status_waitlist.sql,
-- which must be a separate migration: Postgres will not let a transaction use
-- an enum value it added itself. A CHECK constraint cannot substitute for that.
-- (Previously this file tried `check (status in (...,'waitlist',...))`, which
-- fails at apply time because the literal is coerced to the enum.)

-- waitlist_position() — returns caller's 1-indexed position on the waitlist
create or replace function waitlist_position(p_move_id uuid)
returns int language sql stable security definer as $$
  select row_number::int
  from (
    select user_id,
           row_number() over (order by created_at asc) as row_number
    from rsvps
    where move_id = p_move_id and status = 'waitlist'
  ) sub
  where user_id = auth.uid()
  limit 1;
$$;

-- promote_from_waitlist() — called whenever a going-RSVP is removed
create or replace function promote_from_waitlist(p_move_id uuid)
returns void language plpgsql security definer as $$
declare
  v_max  int;
  v_going int;
  v_next  uuid;
begin
  select max_attendees into v_max from moves where id = p_move_id;
  if v_max is null then return; end if;  -- unlimited cap

  select count(*) filter (where status = 'going') into v_going
  from rsvps where move_id = p_move_id;

  if v_going >= v_max then return; end if;  -- still at or above cap

  select user_id into v_next
  from rsvps
  where move_id = p_move_id and status = 'waitlist'
  order by created_at asc
  limit 1;

  if v_next is null then return; end if;

  update rsvps set status = 'going'
  where move_id = p_move_id and user_id = v_next;

  -- Activity notification: "You're off the waitlist 🎉"
  insert into activity_feed(user_id, type, move_id)
  values (v_next, 'waitlist_promoted', p_move_id)
  on conflict do nothing;
end;
$$;

-- Trigger: after any RSVP delete or status→not-going, try to promote
create or replace function trg_promote_waitlist()
returns trigger language plpgsql as $$
begin
  if TG_OP = 'DELETE' and OLD.status = 'going' then
    perform promote_from_waitlist(OLD.move_id);
  elsif TG_OP = 'UPDATE' and OLD.status = 'going' and NEW.status <> 'going' then
    perform promote_from_waitlist(NEW.move_id);
  end if;
  return coalesce(NEW, OLD);
end;
$$;

drop trigger if exists promote_waitlist_trg on rsvps;
create trigger promote_waitlist_trg
  after update or delete on rsvps
  for each row execute function trg_promote_waitlist();

-- Add 'waitlist_promoted' to activity_feed type constraint
alter table activity_feed drop constraint if exists activity_feed_type_check;
alter table activity_feed add constraint activity_feed_type_check
  check (type in (
    'rsvp_on_your_move',
    'squad_confirmed',
    'move_trending',
    'move_starting_soon',
    'waitlist_promoted'
  ));

-- ── 2. Hype reactions ─────────────────────────────────────────────────────
create table move_reactions (
  move_id    uuid not null references moves(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  emoji      text not null,
  created_at timestamptz default now(),
  primary key (move_id, user_id, emoji),
  constraint emoji_check check (emoji in ('🔥','❤️','👀','💯','🙌'))
);

create index move_reactions_move on move_reactions(move_id);

alter table move_reactions enable row level security;

create policy "react_select" on move_reactions for select using (true);
create policy "react_insert" on move_reactions for insert with check (user_id = auth.uid());
create policy "react_delete" on move_reactions for delete using (user_id = auth.uid());

-- Denormalized reaction counts view
create or replace view move_reaction_counts as
  select
    move_id,
    emoji,
    count(*) as total,
    bool_or(user_id = auth.uid()) as i_reacted
  from move_reactions
  group by move_id, emoji;

-- ── 3. Crew-going social proof ────────────────────────────────────────────
-- Returns up to 3 users from the caller's invite tree who are going to a move.
-- "Invite tree" = users who share an invite chain link with the caller.
-- Used in feed cards: "Alex + 2 more from your crew are going"
create or replace function crew_going(p_move_id uuid)
returns table(user_id uuid, username text, avatar_url text)
language sql stable security definer as $$
  with my_tree as (
    -- People I directly invited
    select used_by as peer_id
    from invite_codes
    where created_by = auth.uid() and used_by is not null
    union
    -- Person who invited me
    select created_by as peer_id
    from invite_codes
    where used_by = auth.uid() and created_by is not null
  )
  select p.id, p.username, p.avatar_url
  from rsvps r
  join my_tree t  on t.peer_id = r.user_id
  join profiles p on p.id      = r.user_id
  where r.move_id = p_move_id
    and r.status  = 'going'
  order by r.created_at asc
  limit 3;
$$;

-- ── 4. Feed enrichment — expose waitlist_count + crew ────────────────────
-- Update nearby_moves to surface waitlist depth and crew-going list.
-- Callers can display "3 on waitlist" and "Alex is going".
-- This adds columns to the return table, and `create or replace` cannot change
-- a function's return type (error 42P13 covers parameter names, 42P13 also
-- rejects the new signature). Drop the exact 5-argument overload first.
-- Parameter names must still match 011, since the drop/create pair is what
-- makes the change legal, not a rename.
drop function if exists public.nearby_moves(float, float, int, text, uuid);

create or replace function public.nearby_moves(
  lat            float,
  lng            float,
  radius_meters  int     default 8047,
  filter_category text   default null,
  uid            uuid    default null
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
language sql stable security definer as $$
  select
    m.id, m.creator_id, m.title, m.description, m.category,
    m.location_name, m.address, m.city,
    m.starts_at, m.ends_at, m.max_attendees, m.cover_image_url,
    m.is_public, m.is_cancelled, m.cancellation_reason, m.vibes,
    m.created_at, m.updated_at,

    ST_Y(m.location_point::geometry)::float as latitude,
    ST_X(m.location_point::geometry)::float as longitude,
    ST_Distance(
      m.location_point,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
    )::float as distance_m,

    count(r.id) filter (where r.status = 'going')             as attendee_count,
    count(r.id) filter (where r.status = 'waitlist')          as waitlist_count,
    case
      when m.max_attendees is null then null
      else greatest(0, m.max_attendees - count(r.id) filter (where r.status = 'going'))
    end::int                                                    as spots_left,
    count(r.id) filter (where r.status = 'going') = 0          as is_empty,
    case
      when m.max_attendees is null then false
      else count(r.id) filter (where r.status = 'going') >= m.max_attendees
    end                                                         as is_full,

    m.hot_score,

    -- caller's own status
    max(case when r.user_id = coalesce(uid, auth.uid()) then r.status end) as my_status,

    -- up to 3 crew members going (invite-tree peers)
    coalesce((
      select jsonb_agg(jsonb_build_object('username', p2.username, 'avatar_url', p2.avatar_url))
      from rsvps r2
      join profiles p2 on p2.id = r2.user_id
      where r2.move_id = m.id
        and r2.status = 'going'
        and r2.user_id in (
          select used_by from invite_codes where created_by = coalesce(uid, auth.uid()) and used_by is not null
          union
          select created_by from invite_codes where used_by = coalesce(uid, auth.uid()) and created_by is not null
        )
      limit 3
    ), '[]'::jsonb)                                             as crew_going

  from moves m
  left join rsvps r on r.move_id = m.id
  left join profiles cr on cr.id = m.creator_id
  where
    ST_DWithin(
      m.location_point,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
      radius_meters
    )
    and m.is_cancelled = false
    and m.is_public    = true
    and m.starts_at   >= now()
    and m.starts_at   <= now() + interval '24 hours'
    and (filter_category is null or m.category::text = filter_category)
    and (cr.is_banned is null or cr.is_banned = false)
  group by m.id
  order by m.hot_score desc, m.starts_at asc;
$$;
