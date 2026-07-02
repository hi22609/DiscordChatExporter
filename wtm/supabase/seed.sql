-- Development seed data for Pittsburgh

-- Invite codes for beta
insert into public.invite_codes (code, max_uses) values
  ('PITTSB01', 50),
  ('PITTSB02', 50),
  ('STEEL412', 50),
  ('YINZER22', 25),
  ('DEVBETA1', 100);

-- Note: Move and spot seeds require auth users — run these after creating test accounts via Supabase dashboard
-- Example spot inserts (replace created_by with real UUID). Pittsburgh classics:
-- insert into public.spots (created_by, name, description, category, location_point, city, best_time) values
-- ('YOUR_USER_UUID', 'Mount Washington Overlook', 'The postcard view of the skyline. Grandview Ave near the incline.', 'view', ST_SetSRID(ST_MakePoint(-80.0134, 40.4322), 4326), 'Pittsburgh', 'sunset'),
-- ('YOUR_USER_UUID', 'Carrie Furnace', 'Massive abandoned blast furnace. Official tours exist; the graffiti is unreal.', 'urbex', ST_SetSRID(ST_MakePoint(-79.8890, 40.4113), 4326), 'Pittsburgh', 'weekend tours'),
-- ('YOUR_USER_UUID', 'The Wheel Mill trails', 'Best legal spot to session. Indoor park for rain days too.', 'skate', ST_SetSRID(ST_MakePoint(-79.9080, 40.4550), 4326), 'Pittsburgh', 'weekday mornings');
-- Example move insert (replace creator_id with real UUID):
-- insert into public.moves (creator_id, title, description, category, location_name, location_point, address, city, starts_at, max_attendees) values
-- ('YOUR_USER_UUID', 'Bar Crawl - South Side', 'Starting at Smiling Moose, ending at the Warhol Bar.', 'bars', 'Smiling Moose', ST_SetSRID(ST_MakePoint(-79.9705, 40.4247), 4326), '1306 E Carson St, Pittsburgh, PA', 'Pittsburgh', now() + interval '4 hours', 20),
-- ('YOUR_USER_UUID', 'Pickup Basketball - Frick Park', 'Need 4 more. Full court. Bring your A game.', 'sports', 'Frick Park - Diamond Field', ST_SetSRID(ST_MakePoint(-79.9082, 40.4302), 4326), 'Frick Park, Pittsburgh, PA', 'Pittsburgh', now() + interval '2 hours', 10);
