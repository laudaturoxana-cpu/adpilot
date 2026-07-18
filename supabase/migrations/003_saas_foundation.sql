-- Migrație aditivă (Etapa 2 - Fundament SaaS). Nu modifică 001/002.
--
-- Introduce multi-tenancy: workspaces, membri cu roluri, setări de business
-- (onboarding) și audit log append-only. RLS pe fiecare tabel nou, bazat pe
-- apartenența la workspace (defense in depth).
--
-- Tabelele existente user-scoped (meta_connections, insights_cache,
-- generated_copy, ai_analyses) primesc coloana workspace_id (nullable, cu
-- backfill) pentru a pregăti migrarea la acces workspace-scoped în Etapa 3.
-- RLS-ul lor NU se schimbă aici - rămâne user-scoped ca să nu rupem nimic.

-- ─────────────────────────────────────────────────────────────────────────
-- 1. Tabele noi
-- ─────────────────────────────────────────────────────────────────────────

create table public.workspaces (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  owner_id uuid references public.profiles(id) on delete restrict not null,
  plan text not null default 'free' check (plan in ('free', 'starter', 'agency', 'enterprise')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index workspaces_owner_idx on public.workspaces(owner_id);

create table public.workspace_members (
  id uuid default uuid_generate_v4() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text not null default 'viewer' check (
    role in ('owner', 'admin', 'media_buyer', 'strategist', 'creative', 'approver', 'client', 'viewer')
  ),
  created_at timestamptz default now(),
  unique (workspace_id, user_id)
);
create index workspace_members_user_idx on public.workspace_members(user_id);
create index workspace_members_workspace_idx on public.workspace_members(workspace_id);

create table public.business_profiles (
  id uuid default uuid_generate_v4() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  business_type text,
  main_objective text,
  products text,
  country text,
  currency text,
  monthly_budget numeric,
  target_cpa numeric,
  min_roas numeric,
  avg_order_value numeric,
  profit_margin numeric,
  conversion_events text[] default '{}',
  landing_pages text[] default '{}',
  brand_voice text,
  forbidden_words text[] default '{}',
  regulated_industry boolean default false,
  automation_level integer not null default 0 check (automation_level between 0 and 5),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (workspace_id)
);

-- Audit log append-only: fără UPDATE/DELETE prin RLS (imutabil).
create table public.audit_log (
  id uuid default uuid_generate_v4() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  actor_id uuid references public.profiles(id) on delete set null,
  actor_type text not null default 'user' check (actor_type in ('user', 'ai', 'system')),
  action text not null,
  entity_type text,
  entity_id text,
  before_state jsonb,
  after_state jsonb,
  reason text,
  created_at timestamptz default now()
);
create index audit_log_workspace_idx on public.audit_log(workspace_id, created_at desc);

-- ─────────────────────────────────────────────────────────────────────────
-- 2. Helpers RLS (SECURITY DEFINER pentru a evita recursivitatea policy-urilor
--    pe workspace_members)
-- ─────────────────────────────────────────────────────────────────────────

create or replace function public.is_workspace_member(ws_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = ws_id and user_id = auth.uid()
  );
$$ language sql security definer stable set search_path = public;

create or replace function public.has_workspace_role(ws_id uuid, roles text[])
returns boolean as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = ws_id and user_id = auth.uid() and role = any(roles)
  );
$$ language sql security definer stable set search_path = public;

-- Adevărat dacă userul curent împarte cel puțin un workspace cu other_user.
-- Folosit pentru a permite membrilor să vadă profilul co-membrilor (lista de
-- membri) fără a expune profiluri din afara workspace-urilor comune.
create or replace function public.shares_workspace_with(other_user uuid)
returns boolean as $$
  select exists (
    select 1
    from public.workspace_members m1
    join public.workspace_members m2 on m1.workspace_id = m2.workspace_id
    where m1.user_id = auth.uid() and m2.user_id = other_user
  );
$$ language sql security definer stable set search_path = public;

-- Creare atomică workspace + membership owner (evită chicken-and-egg cu RLS).
create or replace function public.create_workspace(ws_name text)
returns public.workspaces as $$
declare
  new_ws public.workspaces;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if ws_name is null or length(trim(ws_name)) = 0 then
    raise exception 'workspace name required';
  end if;

  insert into public.workspaces (name, owner_id)
  values (trim(ws_name), auth.uid())
  returning * into new_ws;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (new_ws.id, auth.uid(), 'owner');

  return new_ws;
end;
$$ language plpgsql security definer set search_path = public;

-- ─────────────────────────────────────────────────────────────────────────
-- 3. RLS
-- ─────────────────────────────────────────────────────────────────────────

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.business_profiles enable row level security;
alter table public.audit_log enable row level security;

-- profiles: pe lângă policy-ul existent din 001 (userul își vede propriul
-- profil), permitem citirea profilurilor co-membrilor de workspace.
create policy "Read co-member profiles" on public.profiles
  for select using (public.shares_workspace_with(id));

-- workspaces
create policy "Members read workspace" on public.workspaces
  for select using (public.is_workspace_member(id));
create policy "Users create own workspace" on public.workspaces
  for insert with check (owner_id = auth.uid());
create policy "Owners/admins update workspace" on public.workspaces
  for update using (public.has_workspace_role(id, array['owner', 'admin']));
create policy "Owner deletes workspace" on public.workspaces
  for delete using (owner_id = auth.uid());

-- workspace_members
create policy "Members read membership" on public.workspace_members
  for select using (public.is_workspace_member(workspace_id));
create policy "Owners/admins add members" on public.workspace_members
  for insert with check (public.has_workspace_role(workspace_id, array['owner', 'admin']));
create policy "Owners/admins update members" on public.workspace_members
  for update using (public.has_workspace_role(workspace_id, array['owner', 'admin']));
create policy "Owners/admins remove members" on public.workspace_members
  for delete using (public.has_workspace_role(workspace_id, array['owner', 'admin']));

-- business_profiles
create policy "Members read business profile" on public.business_profiles
  for select using (public.is_workspace_member(workspace_id));
create policy "Owners/admins upsert business profile" on public.business_profiles
  for insert with check (public.has_workspace_role(workspace_id, array['owner', 'admin']));
create policy "Owners/admins update business profile" on public.business_profiles
  for update using (public.has_workspace_role(workspace_id, array['owner', 'admin']));

-- audit_log (append-only: doar select + insert pentru membri)
create policy "Members read audit log" on public.audit_log
  for select using (public.is_workspace_member(workspace_id));
create policy "Members append audit log" on public.audit_log
  for insert with check (public.is_workspace_member(workspace_id));

-- ─────────────────────────────────────────────────────────────────────────
-- 4. Coloane workspace_id pe tabelele existente (nullable + backfill)
-- ─────────────────────────────────────────────────────────────────────────

alter table public.meta_connections add column workspace_id uuid references public.workspaces(id) on delete cascade;
alter table public.insights_cache  add column workspace_id uuid references public.workspaces(id) on delete cascade;
alter table public.generated_copy  add column workspace_id uuid references public.workspaces(id) on delete cascade;
alter table public.ai_analyses     add column workspace_id uuid references public.workspaces(id) on delete cascade;

-- ─────────────────────────────────────────────────────────────────────────
-- 5. Backfill: un workspace personal pentru fiecare user existent
-- ─────────────────────────────────────────────────────────────────────────

do $$
declare
  p record;
  ws_id uuid;
begin
  for p in select id, email, full_name, agency_name from public.profiles loop
    insert into public.workspaces (name, owner_id)
    values (
      coalesce(nullif(trim(p.agency_name), ''), nullif(trim(p.full_name), ''), split_part(p.email, '@', 1)) || ' Workspace',
      p.id
    )
    returning id into ws_id;

    insert into public.workspace_members (workspace_id, user_id, role)
    values (ws_id, p.id, 'owner');

    update public.meta_connections set workspace_id = ws_id where user_id = p.id and workspace_id is null;
    update public.insights_cache    set workspace_id = ws_id where user_id = p.id and workspace_id is null;
    update public.generated_copy    set workspace_id = ws_id where user_id = p.id and workspace_id is null;
    update public.ai_analyses       set workspace_id = ws_id where user_id = p.id and workspace_id is null;
  end loop;
end $$;

create index meta_connections_workspace_idx on public.meta_connections(workspace_id);
create index insights_cache_workspace_idx   on public.insights_cache(workspace_id);
create index generated_copy_workspace_idx   on public.generated_copy(workspace_id);
create index ai_analyses_workspace_idx       on public.ai_analyses(workspace_id);

-- ─────────────────────────────────────────────────────────────────────────
-- 6. Extinde handle_new_user: la înregistrare creează profil + workspace + owner
-- ─────────────────────────────────────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger as $$
declare
  ws_id uuid;
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');

  insert into public.workspaces (name, owner_id)
  values (
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)) || ' Workspace',
    new.id
  )
  returning id into ws_id;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (ws_id, new.id, 'owner');

  return new;
end;
$$ language plpgsql security definer set search_path = public;
