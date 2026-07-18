-- Migrație aditivă. Nu modifică 001_initial.sql.
--
-- Problemă rezolvată: ruta /api/meta/insights făcea upsert fără onConflict,
-- deci insera rânduri duplicate la infinit (tabelul creștea nelimitat), iar
-- `level` (account/campaign) nu intra în cheia de cache - datele se
-- suprascriau reciproc. Codul nou scrie date_range = `${days}-${level}` și
-- face upsert cu onConflict pe (user_id, ad_account_id, date_range).
--
-- Această migrație curăță duplicatele existente și adaugă constraint-ul unic
-- de care depinde onConflict, plus un index de căutare.

-- 1. Elimină duplicatele existente, păstrând cel mai recent rând per cheie.
delete from public.insights_cache a
using public.insights_cache b
where a.user_id = b.user_id
  and a.ad_account_id = b.ad_account_id
  and a.date_range = b.date_range
  and a.cached_at < b.cached_at;

-- 2. Constraint unic necesar pentru upsert onConflict.
alter table public.insights_cache
  add constraint insights_cache_user_account_range_key
  unique (user_id, ad_account_id, date_range);

-- 3. Index explicit pe câmpurile de căutare frecventă (AGENTS.md §2).
create index if not exists insights_cache_lookup_idx
  on public.insights_cache (user_id, ad_account_id, date_range);
