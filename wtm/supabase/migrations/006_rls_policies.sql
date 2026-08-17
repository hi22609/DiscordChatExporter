-- Additional RLS policies and helper functions

-- Check if current user has RSVPd to a move
create or replace function public.my_rsvp_status(p_move_id uuid)
returns text
language sql stable security definer
as $$
  select status::text
  from public.rsvps
  where move_id = p_move_id and user_id = auth.uid()
  limit 1;
$$;

-- Get moves a user is attending (upcoming)
create or replace function public.get_my_upcoming_moves()
returns table (
  id              uuid,
  creator_id      uuid,
  title           text,
  category        public.move_category,
  location_name   text,
  city            text,
  starts_at       timestamptz,
  cover_image_url text,
  attendee_count  int,
  rsvp_status     text
)
language sql stable security definer
as $$
  select
    m.id, m.creator_id, m.title, m.category,
    m.location_name, m.city, m.starts_at,
    m.cover_image_url, m.attendee_count,
    r.status::text as rsvp_status
  from public.rsvps r
  join public.moves_with_counts m on m.id = r.move_id
  where
    r.user_id = auth.uid()
    and r.status = 'going'
    and m.is_cancelled = false
    and m.starts_at >= now() - interval '2 hours'
  order by m.starts_at asc
  limit 50;
$$;

-- Get moves created by a user
create or replace function public.get_user_moves(
  p_user_id uuid,
  include_past boolean default false
)
returns setof public.moves_with_counts
language sql stable security definer
as $$
  select *
  from public.moves_with_counts
  where
    creator_id = p_user_id
    and is_public = true
    and (include_past or starts_at >= now() - interval '2 hours')
  order by starts_at desc
  limit 50;
$$;
