# Integrare Meta Marketing API — document tehnic

> Scop: fixează exact ce se poate face prin Meta API, ce permisiuni și review
> sunt necesare, cum gestionăm token-urile, rate limiting-ul și erorile.
> **Nu implementăm pe presupuneri.** Orice capabilitate neconfirmată e marcată
> ca atare.

Versiune API țintă: **v19.0** (fixată în `lib/meta/client.ts`). Upgrade-urile se
fac controlat — Meta scoate versiuni la ~un an și le deprecază după ~2 ani.

---

## 1. Fluxul de autentificare

- **OAuth (Facebook Login for Business)**: `GET /api/auth/meta` → dialog Meta →
  `GET /api/auth/meta/callback`. State CSRF verificat în callback (cookie
  httpOnly `meta_oauth_state`). Workspace-ul curent e transmis prin cookie
  `meta_oauth_ws` ca să știm pe ce workspace legăm conexiunea.
- **Schimb token**: `code` → short-lived token → `fb_exchange_token` →
  long-lived token (~60 zile).
- **Stocare**: token-ul se criptează AES-256-GCM (`encryptToken`) și se salvează
  în `meta_connections` (o conexiune per workspace). Nu se loghează niciodată.

### Permisiuni (scopes) cerute
| Scope | Pentru ce | Necesită App Review |
|---|---|---|
| `ads_read` | citire campanii, insights | Da (Advanced Access) |
| `ads_management` | pause/buget/creare campanii/reclame | Da (Advanced Access) |
| `business_management` | acces Business Manager, conturi | Da |
| `pages_manage_ads` | reclame legate de Pagini | Da |

În **Development Mode** aceste scope-uri funcționează doar pentru useri cu rol în
app (admin/dev/tester) — maxim 25 testeri. Pentru producție reală (clienți
externi) e nevoie de **App Review + Business Verification**.

---

## 2. Ce se poate face prin API vs. ce necesită servicii externe

### ✅ Direct prin Marketing API
- Citire: `/me/adaccounts`, `/{account}/campaigns`, `/adsets`, `/ads`,
  `/adcreatives`, `/customaudiences`, `/{account}/insights` (toate metricile:
  spend, impressions, reach, frequency, CPM, CTR, CPC, actions,
  `cost_per_action_type`, `purchase_roas`, `video_*` pentru hook/hold rate).
- Scriere: `status` (ACTIVE/PAUSED) pe campanie/adset/ad, `daily_budget` /
  `lifetime_budget`, creare campanii/adset/ad, duplicare (`/copies`).
- Upload creative: imagini `/{account}/adimages`, video `/{account}/advideos`
  (async, resumable), apoi `/adcreatives` care le referențiază.
- Istoric modificări: `/{account}/activities` — **limitat** ca detaliu; păstrăm
  audit propriu.

### ⚠️ Necesită servicii externe (NU Meta)
- Generare **imagini** și **video**: modele externe. Meta doar stochează
  asset-ul după ce îl urcăm.
- Copy: Anthropic Claude (deja integrat).

### ❌ Ce NU putem garanta
1. Aprobarea reclamelor — Meta le trece prin review propriu, le poate respinge.
2. Rollback real — Meta nu are tranzacții/undo; reversăm manual din starea
   salvată. Resetul de learning phase la modificări mari nu se poate anula.
3. Atribuire cauzală — ferestre de atribuire (1d/7d), întârzieri de raportare
   (până la ~72h), sezonalitate. De aici regula: volum minim de date înainte de
   decizie.
4. Automatizare pe orice cont — special ad categories (credit, angajare,
   politic, imobiliare, social) au restricții; industrii reglementate limitate.
5. Webhook pentru performanță — **nu există**. Insights se obțin prin polling.

---

## 3. Token-uri
- Long-lived ~60 zile. Stocăm `token_expires_at`.
- **Refresh**: re-exchange periodic (`ensureFreshToken`) + job zilnic
  `GET /api/cron/refresh-tokens` (protejat cu `CRON_SECRET`). Dacă refresh-ul
  eșuează (permisiuni retrase / token invalidat), marcăm `needs_reauth = true`
  și notificăm userul să reconecteze.
- **System User tokens** (Business Manager) = token-uri non-expirante,
  recomandate pentru agenții. Necesită Business Verification. Etapă ulterioară.

---

## 4. Rate limiting
- Meta aplică **Business Use Case (BUC) rate limits** per app + per ad account.
- Headerul `X-Business-Use-Case-Usage` (și `X-App-Usage`) raportează procentul
  consumat. La throttling Meta întoarce coduri `4`, `17`, `613`, `80004`.
- Strategie în `MetaAPIClient`: retry cu backoff exponențial pe codurile
  tranzitorii, respectând semnalul din header. Peste un prag oprim și raportăm.
- Rate limiting intern al platformei: 60 req/min/user pe `/api/meta/*`.

---

## 5. Tratarea erorilor Meta
- Toate erorile trec prin `MetaAPIError.getUserMessage()` → mesaj în română.
- Coduri cheie: `190` token expirat/invalid → `needs_reauth`; `200`/`10`
  permisiuni; `4`/`17`/`613` rate limit; `100` parametru invalid.
- Nu expunem `fbtrace_id` sau detalii interne clientului; se loghează server-side.

---

## 6. Ce necesită App Review / Business Verification (rezumat)
- **App Review**: `ads_read`, `ads_management`, `business_management`,
  `pages_manage_ads` pentru acces în afara testerilor.
- **Business Verification**: pentru System Users și volume mari.
- Plan de lansare: dezvoltăm pe conturi proprii/testeri → depunem App Review în
  paralel → activăm clienți externi după aprobare.

---

## 7. Riscuri
- Tehnice: rate limits, expirare token, întârzieri raportare, lipsă webhook
  insights (polling), rollback imperfect.
- Juridice: App Review, Business Verification, GDPR (date clienți RO), special
  ad categories.
- Financiare: acțiunile mișcă bugete reale → limite hard + approval gates +
  kill switch obligatorii (Etapele 5 & 8).
