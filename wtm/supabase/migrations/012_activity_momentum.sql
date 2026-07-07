-- 012: Real-time activity feed + move momentum (hot score)
-- These two mechanics drive daily opens and FOMO conversion.

-- ---- 1. Hot score — RSVP velocity ----
-- Measures how fast a move is filling relative to time until it starts.
-- Moves filling quickly close to start time score highest → "Trending 🔥" badge.
alter table public.moves
  add column if not exists hot_score numeric not null default 0;

create or replace function public.recalc_hot_score(p_move_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_count int;
  v_cap   int;
  v_hours float;
begin
  select
    count(*) filter (where r.status = 'going'),
    m.max_attendees,
    greatest(0.25, extract(epoch from (m.starts_at - now())) / 3600.0)
  into v_count, v_cap, v_hours
  from public.moves m
  left join public.rsvps r on r.move_id = m.id
  where m.id = p_move_id
  group by m.max_attendees, m.starts_at;

  update public.moves
  set hot_score = (
    v_count::numeric / v_hours
    * case when v_cap > 0 then (1.0 + v_count::numeric / v_cap) else 1.0 end
  )
  where id = p_move_id;
end;
$$;

create or replace function public.trigger_recalc_hot_score()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform public.recalc_hot_score(coalesce(new.move_id, old.move_id));
  return coalesce(new, old);
end;
$$;

drop trigger if exists rsvp_hot_score on public.rsvps;
create trigger rsvp_hot_score
  after insert or delete on public.rsvps
  for each row execute function public.trigger_recalc_hot_score();

-- ---- 2. Activity feed — the social signal layer ----
-- Every notification that drives someone back to the app lives here.
-- Types mirror exactly what makes users re-open social apps:
--   • Someone joined YOUR move (your move is working → pride → share it)
--   • A squad confirmed their crew (social proof on a move you're watching)
--   • A move is trending (FOMO → join before it fills)
create table if not exists public.activity_feed (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references public.profiles(id) on delete cascade,
  type       text        not null check (type in (
    'rsvp_on_your_move',
    'squad_confirmed',
    'move_trending',
    'move_starting_soon'
  )),
  actor_id   uuid        references public.profiles(id) on delete set null,
  move_id    uuid        references public.moves(id) on delete cascade,
  read       boolean     not null default false,
  created_at timestamptz not null default now()
);

create index if not exists activity_feed_user_unread
  on public.activity_feed(user_id, read, created_at desc);

alter table public.activity_feed enable row level security;

create policy "activity_own" on public.activity_feed
  for all to authenticated using (user_id = auth.uid());

-- ---- 3. Trigger: RSVP → notify move creator ----
create or replace function public.notify_rsvp_to_creator()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_creator uuid;
begin
  select creator_id into v_creator from public.moves where id = new.move_id;
  -- Notify creator when someone else joins (not themselves)
  if v_creator is not null and v_creator != new.user_id and new.status = 'going' then
    insert into public.activity_feed(user_id, type, actor_id, move_id)
    values (v_creator, 'rsvp_on_your_move', new.user_id, new.move_id);
  end if;
  return new;
end;
$$;

drop trigger if exists notify_creator_on_rsvp on public.rsvps;
create trigger notify_creator_on_rsvp
  after insert on public.rsvps
  for each row execute function public.notify_rsvp_to_creator();

-- ---- 4. Trigger: squad RSVP → notify squad members ----
-- When someone RSVPs with squad_with set, notify the squad members they've been
-- tagged as rolling together (social accountability + awareness).
create or replace function public.notify_squad_members()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_member uuid;
begin
  if new.squad_with is null or array_length(new.squad_with, 1) is null then
    return new;
  end if;
  foreach v_member in array new.squad_with loop
    insert into public.activity_feed(user_id, type, actor_id, move_id)
    values (v_member, 'squad_confirmed', new.user_id, new.move_id)
    on conflict do nothing;
  end loop;
  return new;
end;
$$;

drop trigger if exists notify_squad_on_rsvp on public.rsvps;
create trigger notify_squad_on_rsvp
  after insert on public.rsvps
  for each row
  when (new.squad_with is not null and array_length(new.squad_with, 1) > 0)
  execute function public.notify_squad_members();

-- ---- 5. Helper: mark all activity read ----
create or replace function public.mark_activity_read(uid uuid)
returns void language sql security definer set search_path = '' as $$
  update public.activity_feed set read = true
  where user_id = uid and read = false;
$$;
