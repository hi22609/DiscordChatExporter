-- Enable PostGIS for geo queries
create extension if not exists postgis;
-- Enable pg_trgm for fuzzy text search
create extension if not exists pg_trgm;
-- Enable uuid generation
create extension if not exists "uuid-ossp";
