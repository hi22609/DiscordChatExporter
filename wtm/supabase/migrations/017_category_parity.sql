-- ═══════════════════════════════════════════
-- 017  CATEGORY PARITY WITH THE DEMO
-- ═══════════════════════════════════════════
-- The demo is built around two categories that do not exist in RAW's enum:
--
--   just_us    small and private. A few people, someone's place, no crowd.
--   the_scene  nightlife. Bars, shows, wherever the room is already full.
--
-- Every screen in BETA sorts by them, so a member who sees the demo and then
-- opens the app finds neither. Adding enum values is additive: no existing row
-- changes, no query breaks.
--
-- This file contains nothing but ALTER TYPE on purpose. Postgres will not let a
-- transaction use an enum value it added itself, and Supabase runs each
-- migration file in one transaction, so anything that references 'just_us' has
-- to land in a later file.

alter type public.move_category add value if not exists 'just_us';
alter type public.move_category add value if not exists 'the_scene';
