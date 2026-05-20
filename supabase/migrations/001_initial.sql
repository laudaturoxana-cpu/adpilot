create extension if not exists "uuid-ossp";

create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text,
  agency_name text,
  role text default 'user' check (role in ('admin', 'user')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.meta_connections (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  access_token text not null,
  token_expires_at timestamptz,
  meta_user_id text not null,
  meta_user_name text,
  selected_ad_account_id text,
  selected_ad_account_name text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id)
);

create table public.insights_cache (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  ad_account_id text not null,
  date_range text not null,
  data jsonb not null,
  cached_at timestamptz default now(),
  expires_at timestamptz default (now() + interval '1 hour')
);

create table public.generated_copy (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  product text not null,
  audience text not null,
  objective text not null,
  tone text,
  variants jsonb not null,
  is_favorite boolean default false,
  created_at timestamptz default now()
);

create table public.ai_analyses (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  ad_account_id text not null,
  period_days integer not null,
  raw_data jsonb not null,
  analysis_text text not null,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
alter table public.meta_connections enable row level security;
alter table public.insights_cache enable row level security;
alter table public.generated_copy enable row level security;
alter table public.ai_analyses enable row level security;

create policy "Users see own profile" on public.profiles for all using (auth.uid() = id);
create policy "Users manage own meta connection" on public.meta_connections for all using (auth.uid() = user_id);
create policy "Users see own cache" on public.insights_cache for all using (auth.uid() = user_id);
create policy "Users see own copy" on public.generated_copy for all using (auth.uid() = user_id);
create policy "Users see own analyses" on public.ai_analyses for all using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
