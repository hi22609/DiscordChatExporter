-- ═══════════════════════════════════════════
-- 014a  Add 'waitlist' to the rsvp_status enum
-- ═══════════════════════════════════════════
-- Postgres will not allow a transaction to use an enum value it added itself,
-- so this has to be its own migration, applied before 014 references the value.
-- 014 originally tried to do it with a CHECK constraint, which cannot work:
-- the literal is coerced to rsvp_status and rejected at apply time.

alter type public.rsvp_status add value if not exists 'waitlist';
