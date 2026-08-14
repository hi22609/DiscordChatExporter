\set ON_ERROR_STOP off
\set QUIET on
\pset pager off
create temp table if not exists tkv(k text primary key, v uuid);
create or replace function t(label text, ok boolean) returns void language plpgsql as $$
begin raise notice '% %', case when ok then 'PASS' else 'FAIL' end, label; end $$;

-- ── seed ────────────────────────────────────────────────────────────────────
insert into public.invite_codes(code, max_uses) values ('SEEDAA', 5), ('BURNED', 1), ('CREWAA', 5);
update public.invite_codes set use_count = 1 where code = 'BURNED';

-- H1  signup with a valid admin-seeded code (null created_by)
do $$
declare v_id uuid := gen_random_uuid(); v_code uuid;
begin
  select id into v_code from public.invite_codes where code='SEEDAA';
  insert into auth.users(id, email, raw_user_meta_data)
  values (v_id, 'a@x.com', jsonb_build_object('invite_code_id', v_code::text, 'username','alex'));
  perform t('H1 signup with admin-seeded code creates profile',
            exists(select 1 from public.profiles where id=v_id and username='alex'));
  perform t('H1 code use_count burned',
            (select use_count from public.invite_codes where id=v_code) = 1);
  perform t('H1 used_by set after profile exists',
            (select used_by from public.invite_codes where id=v_code) = v_id);
exception when others then perform t('H1 signup ('||sqlerrm||')', false);
end $$;

-- H2  signup with no code is rejected
do $$
begin
  insert into auth.users(id, email, raw_user_meta_data) values (gen_random_uuid(),'b@x.com','{}'::jsonb);
  perform t('H2 codeless signup rejected', false);
exception when others then perform t('H2 codeless signup rejected ('||sqlerrm||')', sqlerrm like '%invite_required%');
end $$;

-- H3  signup with an exhausted code is rejected
do $$
declare v_code uuid;
begin
  select id into v_code from public.invite_codes where code='BURNED';
  insert into auth.users(id, email, raw_user_meta_data)
  values (gen_random_uuid(),'c@x.com', jsonb_build_object('invite_code_id', v_code::text));
  perform t('H3 exhausted code rejected', false);
exception when others then perform t('H3 exhausted code rejected', sqlerrm like '%exhausted%');
end $$;

-- more members, all invited by alex so they form her crew
do $$
declare v_alex uuid; v_code uuid; i int; v_new uuid;
begin
  select id into v_alex from public.profiles where username='alex';
  for i in 1..4 loop
    insert into public.invite_codes(code, created_by, max_uses)
    values ('CREW0'||i, v_alex, 1) returning id into v_code;
    v_new := gen_random_uuid();
    insert into auth.users(id, email, raw_user_meta_data)
    values (v_new, 'm'||i||'@x.com', jsonb_build_object('invite_code_id', v_code::text, 'username','member'||i));
  end loop;
  perform t('H4 invite chain: 4 members invited by alex',
            (select count(*) from public.profiles where invited_by = v_alex) = 4);
end $$;

-- H5  age gate
do $$
declare v_id uuid;
begin
  select id into v_id from public.profiles where username='member1';
  begin
    update public.profiles set birthdate = current_date - interval '16 years' where id = v_id;
    perform t('H5 age gate blocks 16-year-old', false);
  exception when others then perform t('H5 age gate blocks 16-year-old', sqlerrm like '%age_out_of_range%');
  end;
  update public.profiles set birthdate = current_date - interval '19 years' where id = v_id;
  perform t('H5 age_range derived for 19-year-old',
            (select age_range from public.profiles where id=v_id) = '17-20');
end $$;

-- a move, capacity 2, in Lawrenceville, starting in 3h
do $$
declare v_alex uuid; v_move uuid;
begin
  select id into v_alex from public.profiles where username='alex';
  insert into public.moves(creator_id, title, category, location_name, location_point,
                           address, starts_at, max_attendees)
  values (v_alex, 'Rooftop at Arsenal', 'just_us', 'Arsenal Park',
          st_setsrid(st_makepoint(-79.9573, 40.4712), 4326)::geography,
          '4700 Butler St, Pittsburgh, PA 15201', now() + interval '3 hours', 2)
  returning id into v_move;
  insert into tkv values ('move', v_move) on conflict (k) do update set v = excluded.v;
end $$;

-- H6  capacity trigger
do $$
declare v_move uuid := (select v from tkv where k='move'); ids uuid[];
begin
  select array_agg(id order by username) into ids from public.profiles where username like 'member%';
  insert into public.rsvps(move_id, user_id, status) values (v_move, ids[1], 'going');
  insert into public.rsvps(move_id, user_id, status) values (v_move, ids[2], 'going');
  begin
    insert into public.rsvps(move_id, user_id, status) values (v_move, ids[3], 'going');
    perform t('H6 capacity trigger blocks 3rd going RSVP at cap 2', false);
  exception when others then perform t('H6 capacity trigger blocks 3rd going RSVP at cap 2', true);
  end;
  insert into public.rsvps(move_id, user_id, status) values (v_move, ids[3], 'waitlist');
  perform t('H6 waitlist RSVP accepted past cap',
            (select count(*) from public.rsvps where move_id=v_move and status='waitlist') = 1);
end $$;

-- H7  squad_with cap of 2
do $$
declare v_move uuid := (select v from tkv where k='move'); ids uuid[]; n int;
begin
  select array_agg(id order by username) into ids from public.profiles where username like 'member%';
  update public.rsvps set squad_with = ids[2:3] where move_id=v_move and user_id=ids[1];
  get diagnostics n = row_count;
  perform t('H7 squad of 2 accepted (rows updated='||n||')', n = 1);
  begin
    update public.rsvps set squad_with = ids[2:4] where move_id=v_move and user_id=ids[1];
    get diagnostics n = row_count;
    perform t('H7 squad of 3 rejected (rows updated='||n||')', false);
  exception when others then perform t('H7 squad of 3 rejected', true);
  end;
end $$;

-- H8  waitlist auto-promotion
do $$
declare v_move uuid := (select v from tkv where k='move'); ids uuid[];
begin
  select array_agg(id order by username) into ids from public.profiles where username like 'member%';
  delete from public.rsvps where move_id=v_move and user_id=ids[1];
  perform t('H8 waitlisted member auto-promoted to going',
            (select status from public.rsvps where move_id=v_move and user_id=ids[3]) = 'going');
  perform t('H8 promotion writes an activity notification',
            exists(select 1 from public.activity_feed where user_id=ids[3] and type='waitlist_promoted'));
end $$;

-- H9  nearby_moves: exactly one signature, and it returns the enriched row
do $$
declare n int; r record;
begin
  select count(*) into n from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and p.proname='nearby_moves';
  perform t('H9 exactly one nearby_moves signature (found '||n||')', n = 1);

  perform set_config('request.jwt.claim.sub', (select id::text from public.profiles where username='alex'), false);
  select * into r from public.nearby_moves(40.4712, -79.9573, 8047, null,
                                           (select id from public.profiles where username='alex'), 0, 20) limit 1;
  perform t('H9 move found within radius', r.id is not null);
  perform t('H9 address returned ('||coalesce(r.address,'null')||')',
            r.address = '4700 Butler St, Pittsburgh, PA 15201');
  perform t('H9 attendee_count correct (got '||r.attendee_count||')', r.attendee_count = 2);
  perform t('H9 waitlist_count present (got '||r.waitlist_count||')', r.waitlist_count = 0);
  perform t('H9 hot_score present (got '||r.hot_score||')', r.hot_score is not null);
  perform t('H9 crew_going populated (got '||r.crew_going::text||')', jsonb_array_length(r.crew_going) > 0);
  perform t('H9 distance_m ~0 (got '||round(r.distance_m::numeric,1)||')', r.distance_m < 5);
exception when others then perform t('H9 nearby_moves ('||sqlerrm||')', false);
end $$;

-- H10 banned creator drops out of the feed
do $$
declare n int;
begin
  update public.profiles set is_banned = true where username='alex';
  select count(*) into n from public.nearby_moves(40.4712, -79.9573, 8047, null,
                                                  (select id from public.profiles where username='member1'), 0, 20);
  perform t('H10 banned creator excluded from feed (rows='||n||')', n = 0);
  update public.profiles set is_banned = false where username='alex';

  -- alex has no inviter (admin-seeded code), so banning her cannot flag anyone.
  -- member4 was invited by alex, so banning member4 must open a review on alex.
  update public.profiles set is_banned = true where username='member4';
  perform t('H10 banning an invited member opens a chain review on their inviter',
            exists(select 1 from public.reports r
                    join public.profiles p on p.id = r.target_id
                   where r.reason like 'chain_review%' and p.username='alex'));
  update public.profiles set is_banned = false where username='member4';
end $$;

-- H11 authenticated cannot write is_banned, can write display_name
do $$
begin
  perform t('H11 authenticated cannot UPDATE profiles.is_banned',
            has_column_privilege('authenticated','public.profiles','is_banned','UPDATE') = false);
  perform t('H11 authenticated can UPDATE profiles.display_name',
            has_column_privilege('authenticated','public.profiles','display_name','UPDATE') = true);
  perform t('H11 promote_from_waitlist not callable by authenticated',
            has_function_privilege('authenticated','public.promote_from_waitlist(uuid)','EXECUTE') = false);
  perform t('H11 promote_from_waitlist not callable by anon',
            has_function_privilege('anon','public.promote_from_waitlist(uuid)','EXECUTE') = false);
  perform t('H11 recalc_hot_score not callable by anon',
            has_function_privilege('anon','public.recalc_hot_score(uuid)','EXECUTE') = false);
end $$;

-- H12 views run as invoker, no definer function has a mutable search_path
do $$
declare n int;
begin
  select count(*) into n from pg_class c join pg_namespace ns on ns.oid=c.relnamespace
   where ns.nspname='public' and c.relkind='v'
     and coalesce(array_to_string(c.reloptions,','),'') not like '%security_invoker=on%'
     and not exists (select 1 from pg_depend d where d.objid=c.oid and d.deptype='e');
  perform t('H12 every public view is security_invoker (offenders='||n||')', n = 0);

  select count(*) into n from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and p.prosecdef and p.proconfig is null;
  perform t('H12 no SECURITY DEFINER function with mutable search_path (offenders='||n||')', n = 0);
end $$;

-- H13 RLS on every app table
do $$
declare n int;
begin
  select count(*) into n from pg_class c join pg_namespace ns on ns.oid=c.relnamespace
   where ns.nspname='public' and c.relkind='r' and not c.relrowsecurity
     and not exists (select 1 from pg_depend d where d.objid=c.oid and d.deptype='e');
  perform t('H13 every public table has RLS enabled (offenders='||n||')', n = 0);
  select count(*) into n from pg_class c join pg_namespace ns on ns.oid=c.relnamespace
   where ns.nspname='public' and c.relkind='r' and c.relrowsecurity
     and not exists (select 1 from pg_policy p where p.polrelid=c.oid)
     and not exists (select 1 from pg_depend d where d.objid=c.oid and d.deptype='e');
  perform t('H13 no RLS table left with zero policies (offenders='||n||')', n = 0);
end $$;

drop function t(text, boolean);
drop table tkv;
