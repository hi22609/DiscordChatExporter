-- ═══════════════════════════════════════════
-- 013 MOVE CHAT
-- Real-time group chat per move, visible only
-- to confirmed attendees (status = 'going').
-- ═══════════════════════════════════════════

create table move_messages (
  id         uuid primary key default gen_random_uuid(),
  move_id    uuid not null references moves(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  content    text not null,
  created_at timestamptz default now(),
  constraint content_length check (char_length(content) between 1 and 500)
);

create index move_messages_move_time on move_messages(move_id, created_at desc);

-- Unread chat count per user per move: stored in app state, not DB.
-- We do store a "last_read_at" per (user, move) to compute badge later.
create table move_chat_reads (
  user_id    uuid not null references profiles(id) on delete cascade,
  move_id    uuid not null references moves(id) on delete cascade,
  last_read  timestamptz not null default now(),
  primary key (user_id, move_id)
);

alter table move_messages   enable row level security;
alter table move_chat_reads enable row level security;

-- Attendees and creator can read chat
create policy "msg_select" on move_messages for select using (
  exists(
    select 1 from rsvps r
    where r.move_id = move_messages.move_id
      and r.user_id = auth.uid()
      and r.status = 'going'
  )
  or exists(
    select 1 from moves m
    where m.id = move_messages.move_id
      and m.creator_id = auth.uid()
  )
);

-- Attendees and creator can send
create policy "msg_insert" on move_messages for insert with check (
  user_id = auth.uid()
  and (
    exists(
      select 1 from rsvps r
      where r.move_id = move_messages.move_id
        and r.user_id = auth.uid()
        and r.status = 'going'
    )
    or exists(
      select 1 from moves m
      where m.id = move_messages.move_id
        and m.creator_id = auth.uid()
    )
  )
);

create policy "reads_own" on move_chat_reads
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Realtime
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;
alter publication supabase_realtime add table move_messages;
-- Unread count helper — returns msgs after last_read for caller
create or replace function chat_unread_count(p_move_id uuid)
returns bigint language sql stable security definer as $$
  select count(*)
  from move_messages m
  where m.move_id = p_move_id
    and m.user_id <> auth.uid()
    and m.created_at > coalesce(
      (select last_read from move_chat_reads
       where user_id = auth.uid() and move_id = p_move_id),
      '-infinity'::timestamptz
    );
$$;

-- Mark read helper
create or replace function mark_chat_read(p_move_id uuid)
returns void language sql security definer as $$
  insert into move_chat_reads(user_id, move_id, last_read)
  values (auth.uid(), p_move_id, now())
  on conflict (user_id, move_id) do update set last_read = now();
$$;
