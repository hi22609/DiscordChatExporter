create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  username      text unique not null,
  display_name  text,
  avatar_url    text,
  bio           text,
  city          text not null default 'Pittsburgh',
  push_token    text,
  follower_count  int not null default 0,
  following_count int not null default 0,
  moves_created   int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Username format: lowercase, alphanumeric + underscore, 3-20 chars
alter table public.profiles add constraint username_format
  check (username ~ '^[a-z0-9_]{3,20}$');

-- Auto-create profile when user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)),
    coalesce(new.raw_user_meta_data->>'display_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Update updated_at automatically
create or replace function public.update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.update_updated_at();

-- Enable RLS
alter table public.profiles enable row level security;

create policy "profiles_public_read" on public.profiles
  for select using (true);

create policy "profiles_owner_update" on public.profiles
  for update using (auth.uid() = id);

-- Text search index on username and display_name
create index profiles_username_trgm on public.profiles using gin(username gin_trgm_ops);
create index profiles_display_name_trgm on public.profiles using gin(display_name gin_trgm_ops);
