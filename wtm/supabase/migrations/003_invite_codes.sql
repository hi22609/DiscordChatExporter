create table public.invite_codes (
  id          uuid primary key default gen_random_uuid(),
  code        text unique not null,
  created_by  uuid references public.profiles(id) on delete set null,
  used_by     uuid references public.profiles(id) on delete set null,
  max_uses    int not null default 1,
  use_count   int not null default 0,
  expires_at  timestamptz,
  created_at  timestamptz not null default now(),
  constraint code_format check (code ~ '^[A-Z0-9]{6,12}$'),
  constraint use_count_valid check (use_count >= 0 and use_count <= max_uses)
);

create index invite_codes_code on public.invite_codes(code);
create index invite_codes_created_by on public.invite_codes(created_by);

alter table public.invite_codes enable row level security;

-- Authenticated users can check if a code exists (validation)
create policy "invite_codes_authenticated_read" on public.invite_codes
  for select to authenticated using (true);

-- Only service role can insert/update (done via Edge Functions)
