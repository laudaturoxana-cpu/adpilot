-- Migrație aditivă (Etapa 3 - Date Meta workspace-scoped). Nu modifică 001-003.
--
-- După ce 003 a adăugat workspace_id (cu backfill) pe tabelele de date, aici:
--  1. facem workspace_id NOT NULL pe ele
--  2. mutăm RLS-ul de la user-scoped la workspace-member
--  3. permitem o conexiune Meta per workspace (unique(workspace_id))
--  4. adăugăm tabelul ad_accounts (workspace-scoped)
--  5. adăugăm coloane pentru refresh-ul token-urilor
--
-- Necesită ca 003 să fi rulat (backfill workspace_id) înainte.

-- ─────────────────────────────────────────────────────────────────────────
-- 1. workspace_id NOT NULL pe tabelele de date
-- ─────────────────────────────────────────────────────────────────────────
alter table public.meta_connections alter column workspace_id set not null;
alter table public.insights_cache   alter column workspace_id set not null;
alter table public.generated_copy   alter column workspace_id set not null;
alter table public.ai_analyses      alter column workspace_id set not null;

-- ─────────────────────────────────────────────────────────────────────────
-- 2. O conexiune Meta per workspace (înlocuiește unique(user_id))
-- ─────────────────────────────────────────────────────────────────────────
alter table public.meta_connections drop constraint if exists meta_connections_user_id_key;
alter table public.meta_connections
  add constraint meta_connections_workspace_key unique (workspace_id);

-- Cache-ul de insights devine workspace-scoped: cheia unică trece de la
-- (user_id, ad_account_id, date_range) la (workspace_id, ad_account_id,
-- date_range), ca să existe un singur rând per workspace/cont/perioadă
-- indiferent care membru l-a populat.
alter table public.insights_cache drop constraint if exists insights_cache_user_account_range_key;
alter table public.insights_cache
  add constraint insights_cache_ws_account_range_key unique (workspace_id, ad_account_id, date_range);
create index if not exists insights_cache_ws_lookup_idx
  on public.insights_cache (workspace_id, ad_account_id, date_range);

-- ─────────────────────────────────────────────────────────────────────────
-- 3. Coloane pentru refresh token
-- ─────────────────────────────────────────────────────────────────────────
alter table public.meta_connections add column if not exists last_refreshed_at timestamptz;
alter table public.meta_connections add column if not exists needs_reauth boolean default false;

-- ─────────────────────────────────────────────────────────────────────────
-- 4. RLS: de la user-scoped la workspace-member
-- ─────────────────────────────────────────────────────────────────────────
drop policy if exists "Users manage own meta connection" on public.meta_connections;
drop policy if exists "Users see own cache" on public.insights_cache;
drop policy if exists "Users see own copy" on public.generated_copy;
drop policy if exists "Users see own analyses" on public.ai_analyses;

create policy "Members manage meta connection" on public.meta_connections
  for all using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy "Members manage insights cache" on public.insights_cache
  for all using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy "Members manage generated copy" on public.generated_copy
  for all using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy "Members manage ai analyses" on public.ai_analyses
  for all using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

-- ─────────────────────────────────────────────────────────────────────────
-- 5. ad_accounts - conturile publicitare importate în workspace
-- ─────────────────────────────────────────────────────────────────────────
create table public.ad_accounts (
  id uuid default uuid_generate_v4() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  meta_ad_account_id text not null,
  name text,
  currency text,
  timezone_name text,
  account_status integer,
  amount_spent text,
  is_selected boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (workspace_id, meta_ad_account_id)
);
create index ad_accounts_workspace_idx on public.ad_accounts(workspace_id);

alter table public.ad_accounts enable row level security;

create policy "Members read ad accounts" on public.ad_accounts
  for select using (public.is_workspace_member(workspace_id));
create policy "Buyers manage ad accounts" on public.ad_accounts
  for all using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'media_buyer']))
  with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'media_buyer']));
