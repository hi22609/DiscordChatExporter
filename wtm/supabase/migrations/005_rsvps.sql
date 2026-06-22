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
