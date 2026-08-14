-- ═══════════════════════════════════════════
-- 018  ACTUALLY REVOKE THE INTERNAL RPCs
-- ═══════════════════════════════════════════
-- 015 tried to take promote_from_waitlist away from the API with
--
--   revoke execute on function public.promote_from_waitlist(uuid)
--     from anon, authenticated;
--
-- and that did nothing. Postgres grants EXECUTE on every new function to PUBLIC
-- by default, and anon/authenticated were reaching it through that grant, not
-- through one of their own. Revoking a grant they never held is a no-op.
-- Verified against a live database: the ACL still read `=X/postgres`, meaning
-- PUBLIC, meaning anybody holding the anon key that ships inside the app bundle.
--
-- The exposure that leaves: promote_from_waitlist is SECURITY DEFINER, takes
-- only a move id, checks nothing about the caller, and flips a stranger's RSVP
-- from 'waitlist' to 'going'. PostgREST publishes every public function as an
-- RPC. So an anonymous caller could walk a move's waitlist into a full house.
--
-- recalc_hot_score has the same default grant. It cannot escalate anything (it
-- recomputes a derived number from rows that are already there) but it is an
-- unauthenticated way to make the server do work on demand, and nothing in the
-- client calls it.

-- ── 1. The waitlist trigger must not depend on the caller's rights ─────────
-- trg_promote_waitlist runs as whoever wrote the RSVP, and it calls
-- promote_from_waitlist. Once PUBLIC loses EXECUTE, that inner call fails for
-- ordinary members and deleting an RSVP starts erroring. Making the wrapper
-- SECURITY DEFINER moves the inner call to the owner's rights, which is what
-- the other trigger wrappers in this schema already do.
create or replace function public.trg_promote_waitlist()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if TG_OP = 'DELETE' and OLD.status = 'going' then
    perform public.promote_from_waitlist(OLD.move_id);
  elsif TG_OP = 'UPDATE' and OLD.status = 'going' and NEW.status <> 'going' then
    perform public.promote_from_waitlist(NEW.move_id);
  end if;
  return coalesce(NEW, OLD);
end;
$$;

-- ── 2. Take the default grant away, not an imaginary one ──────────────────
revoke execute on function public.promote_from_waitlist(uuid) from public;
revoke execute on function public.recalc_hot_score(uuid)      from public;
