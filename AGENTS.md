<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# AGENTS.md — Reguli non-negociabile AdPilot

Orice programator (uman sau AI) care scrie sau verifică cod în acest proiect respectă toate regulile de mai jos fără excepție. Nu există derogări fără aprobare explicită din partea owner-ului proiectului.

---

## 1. Secrete și variabile de mediu

- Niciun secret (API key, token, parolă, connection string) nu intră niciodată în cod sursă sau în git history.
- Toate secretele se citesc exclusiv din `process.env`. Niciun fallback hard-codat în producție.
- `.env.local` și `.env.production` sunt în `.gitignore` și nu se commit niciodată.
- Singurul fișier permis în git este `.env.local.example` cu valori goale (`=`).
- Variabilele prefixate `NEXT_PUBLIC_` sunt expuse clientului — niciun secret nu primește acest prefix.
- Meta access token-urile se stochează în DB **criptat AES-256-GCM**. Nu se loghează niciodată în clar.
- `SUPABASE_SERVICE_ROLE_KEY` se folosește **exclusiv** în server-side code. Niciodată în client sau expus în răspunsuri.

---

## 2. Bază de date — Supabase / PostgreSQL

- **Row Level Security (RLS) este obligatorie** pe fiecare tabel. Nicio tabelă fără policy activă.
- Orice tabelă nouă primește imediat: `ALTER TABLE x ENABLE ROW LEVEL SECURITY;` + cel puțin o policy.
- Politicile RLS verifică `auth.uid() = user_id` — niciodată `USING (true)` fără condiție.
- Orice câmp căutat frecvent (`user_id`, `ad_account_id`, `created_at`) primește index explicit.
- Operațiile care modifică mai multe tabele se fac în tranzacție.
- Niciun query dinamic construit prin concatenare de string-uri — se folosesc parametri Supabase.
- Migrațiile sunt **aditive** — nu șterg coloane sau tabele fără plan de rollback documentat.
- Nicio migrație nu rulează direct pe producție fără testare prealabilă.
- Cache-ul (`insights_cache`) se invalidează corect — `expires_at` se verifică înainte de a returna date cached.

---

## 3. Autentificare și autorizare

- Orice API route care accesează date returnează **401** dacă sesiunea lipsește, **403** dacă userul nu are drept.
- Verificarea sesiunii se face cu `supabase.auth.getUser()` — **niciodată** `getSession()` (nu verifică JWT pe server).
- Ownership check obligatoriu: după ce ai user-ul, verifici că resursa îi aparține prin query cu `user_id`.
- Ownership check-ul se face întotdeauna **server-side** — niciodată doar pe client.
- Cookie-urile de sesiune au: `httpOnly: true`, `secure: true` (producție), `sameSite: 'lax'`.
- OAuth state parameter (CSRF) se verifică înainte de a procesa orice callback Meta.
- Parolele nu se loghează, nu se returnează în răspunsuri, nu se stochează în clar.
- La logout se invalidează sesiunea pe server (`supabase.auth.signOut()`), nu doar local.

---

## 4. Input și output

- **Niciun query SQL construit prin concatenare** — Supabase client folosește parametri întotdeauna.
- `dangerouslySetInnerHTML` este interzis fără sanitizare explicită a conținutului.
- Validare server-side obligatorie pentru orice POST/PUT — nu te baza pe validarea din client.
- URL-urile furnizate de useri se validează înainte de orice request HTTP (anti-SSRF).
- Răspunsurile API nu includ niciodată: `access_token`, `service_role_key`, stack traces, date interne DB.
- Răspunsurile de eroare au mesaj clar pentru user, fără detalii tehnice interne.

---

## 5. API design

- Status codes corecte: `200` succes, `201` creat, `400` input invalid, `401` neautentificat, `403` fără permisiune, `404` negăsit, `429` rate limit, `500` eroare internă.
- Fiecare răspuns de eroare are forma: `{ "error": "mesaj în română pentru user" }`.
- Niciodată `{ "error": null }` pentru succes — se omite câmpul sau se returnează `{ "data": ... }`.
- Listele suportă paginare — nu se returnează liste nelimitate din DB.
- Rutele AI (`/api/ai/analyze`, `/api/ai/copy`) au rate limiting: **max 10 req/minut per user**.

---

## 6. Security headers și CORS

- În producție, `next.config.ts` include:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- CORS: API routes nu acceptă origin-uri arbitrare. Se whitelist-uiesc doar domeniile cunoscute.

---

## 7. Rate limiting

- Rutele AI au limită de **10 req/minut per user_id**.
- Rutele Meta API au limită de **60 req/minut per user_id**.
- Depășirea limitei returnează `429` cu header `Retry-After`.
- Rate limiting-ul se bazează pe `user_id` din sesiune, nu pe IP.
- În producție, rate limiting-ul se mută la edge (Vercel / Upstash) — nu in-memory.

---

## 8. Cod curat

- O funcție = un singur scop. Dacă descrii ce face și folosești "și", o spargi în două.
- Maxim **40 linii** per funcție. Dacă depășești, refactorizezi.
- Fără magic numbers sau magic strings — se definesc constante cu nume descriptiv.
- Fără dead code: cod comentat, funcții nefolosite, importuri nefolosite.
- Fără `console.log` rămas din debugging în producție.
- Nicio duplicare — dacă copiezi mai mult de 3 linii identice, extragi o funcție.
- Naming: `camelCase` pentru variabile/funcții, `PascalCase` pentru componente, `UPPER_SNAKE_CASE` pentru constante globale, `kebab-case` pentru fișiere.

---

## 9. TypeScript

- **Niciun `any`** — dacă nu știi tipul, folosești `unknown` + type narrowing explicit.
- **Niciun `!` (non-null assertion)** fără comentariu care justifică de ce e sigur.
- `strict: true` în `tsconfig.json` rămâne activ permanent.
- Tipurile Meta API sunt în `lib/meta/types.ts`, tipurile generale în `types/index.ts` — nu se redefinesc inline.
- Niciodată `@ts-ignore` sau `@ts-expect-error` fără explicație.
- Înainte de orice commit: `npx tsc --noEmit` trece fără erori.

---

## 10. React și Next.js 16

- **Citește `node_modules/next/dist/docs/` înainte de orice feature nou** — Next.js 16 are breaking changes (ex: `middleware` redenumit `proxy`, noi convenții App Router).
- Server Components pentru tot ce nu necesită interactivitate.
- `"use client"` doar când ai nevoie de hooks, event handlers, sau browser APIs.
- Nu se pune `"use client"` la nivel de pagină dacă doar o mică parte e interactivă.
- `useEffect` cleanup obligatoriu pentru subscriptions, timers, event listeners.
- `key` unic și stabil pe liste — niciodată `index` pentru liste care se reordonează.
- Imagini prin `next/image`, link-uri interne prin `next/link`, fonturi prin `next/font/google`.
- `useSearchParams()` se învelește obligatoriu în `<Suspense>`.
- Fișierul proxy este `proxy.ts`, nu `middleware.ts` (deprecat în Next.js 16).

---

## 11. Performanță

- **Niciun N+1 query** — dacă ai un loop cu query în interior, restructurezi.
- Cache-ul pentru insights Meta are TTL de 1 oră — nu se bypass-uiește.
- Componente grele (grafice Recharts) se lazy-load cu `dynamic(() => import(...), { ssr: false })`.
- Nicio dependență nouă fără verificarea impactului asupra bundle size (`npm run build`).
- Server Components fac fetch direct — nu prin API routes intermediare inutile.

---

## 12. Accesibilitate WCAG 2.1 AA

- Elementele interactive fără text vizibil (butoane icon-only) au `aria-label`.
- Contrast minim: text normal **4.5:1**, text mare **3:1** față de fundal.
- Navigare completă cu tastatură — focus vizibil clar pe toate elementele interactive.
- Formularele au `<label>` asociat fiecărui `<input>`.
- HTML semantic: `<nav>`, `<main>`, `<header>`, `<button>` — niciodată `<div onClick>`.
- Erorile de formular sunt anunțate cu `role="alert"` sau `aria-describedby`.

---

## 13. Gestionarea erorilor

- **Niciun `catch` gol** — fiecare eroare se loghează cel puțin pe server.
- **Niciun stack trace în răspunsurile client** — eroarea internă se loghează server-side, clientul primește mesaj generic.
- Erorile Meta API se mapează la mesaje în română prin `MetaAPIError.getUserMessage()`.
- Error boundaries obligatorii în jurul secțiunilor majore ale dashboard-ului.
- `try/catch` în toate API routes — nicio rută fără error handling.

---

## 14. Logging

- **Niciodată** nu se loghează: parole, tokens, chei API, PII (email, nume) în afara necesității stricte.
- Log-urile server-side sunt structurate: `{ level, message, userId?, timestamp }`.
- `console.log` în client doar în development (`process.env.NODE_ENV === 'development'`).

---

## 15. Dependențe

- `package-lock.json` se commit-uiește întotdeauna.
- `npm audit` se rulează înainte de orice release. Vulnerabilitățile critice/high se rezolvă înainte de push.
- Nicio dependență nouă fără justificare documentată.
- Dependențele dev nu ajung în bundle de producție.

---

## 16. Git și review

- **Commit-uri atomice**: un commit = o schimbare logică.
- Mesaje de commit: `type: descriere scurtă` (ex: `feat: add Meta OAuth callback`).
- **Niciodată force-push pe `main`**.
- PR-urile au maxim **400 linii modificate**. Dacă e mai mare, se sparge.
- Niciun secret sau fișier generat (`.next/`, `node_modules/`) nu intră în git.
- Orice schimbare în schema Supabase vine cu migrația în `supabase/migrations/`.

---

## 17. SSRF

- Niciun request HTTP la URL-uri furnizate direct de utilizator fără validare strictă.
- URL-urile de callback se validează să fie în whitelist (`graph.facebook.com`).
- Se blochează request-urile la IP-uri private: `10.x.x.x`, `172.16.x.x`, `192.168.x.x`, `127.x.x.x`, `169.254.x.x`.

---

## 18. Testare

- Testele verifică **comportament**, nu implementare internă.
- Testele sunt **deterministe** — fără dependență de timp real sau date externe.
- Rutele protejate au teste care verifică că returnează 401 fără token valid.
- Niciun test nu face request-uri reale la API externe — se mock-uiesc.

---

## 19. Documentație și comentarii

- Comentariile explică **DE CE**, niciodată **CE**.
- Exemple bune: `// Meta returnează budgetul în cenți`, `// State CSRF — verificat în callback`
- Exemple interzise: `// Funcție care returnează campaniile`, `// Setăm starea`
- Niciun TODO sau FIXME în cod de producție — se rezolvă sau se creează issue.
