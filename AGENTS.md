<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

Key breaking change: `middleware.ts` este deprecat. Fișierul se numește `proxy.ts` și exportă funcția `proxy`, nu `middleware`.
<!-- END:nextjs-agent-rules -->

---

# AGENTS.md — Reguli non-negociabile AdPilot

Orice programator (uman sau AI) care scrie sau verifică cod în acest proiect respectă toate regulile de mai jos fără excepție. Nu există derogări fără aprobare explicită din partea owner-ului proiectului.

Stack confirmat din `package.json`: Next.js 16.2.6 · React 19 · TypeScript strict · Supabase · Anthropic Claude SDK · Meta Marketing API v19.0 · Tailwind CSS 4 · shadcn/ui · Framer Motion · Recharts · Sonner · Lucide React · Vercel

---

## 1. Secrete și variabile de mediu

- Niciun secret nu intră niciodată în cod sursă sau în git history.
- Toate secretele se citesc exclusiv din `process.env`. Niciun fallback hard-codat în producție.
- `.env.local` este în `.gitignore` (`/.env*`) și nu se commit niciodată.
- Singurul fișier permis în git este `.env.local.example` cu valori placeholder — documentează ce variabile sunt necesare fără să expună valorile reale.
- Variabilele prefixate `NEXT_PUBLIC_` sunt expuse clientului — niciun secret nu primește acest prefix.
  - `NEXT_PUBLIC_SUPABASE_URL` și `NEXT_PUBLIC_SUPABASE_ANON_KEY` sunt sigure pentru client (anon key nu e secret).
  - `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `META_APP_SECRET`, `NEXTAUTH_SECRET` — **exclusiv server-side, niciodată NEXT_PUBLIC_**.
- Meta access token-urile se stochează în DB **criptat AES-256-GCM** prin `encryptToken()` din `lib/meta/auth.ts`. Nu se loghează și nu se returnează niciodată în clar.
- `NEXTAUTH_SECRET` este cheia de derivare pentru criptarea AES — nu este legat de NextAuth ca framework. Se rotește dacă e compromis (toate token-urile Meta stocate devin invalide).

**SEMNAL DE ALARMĂ — înainte de orice push:**
Rulezi `git status` și verifici că nu apare niciun fișier `.env`, `.env.local`, `.env.production` sau variantă. Dacă apare — STOP, nu faci push, investighezi imediat. Odată ajuns public, un secret trebuie considerat compromis și rotat chiar dacă îl ștergi în secunde (boți scanează GitHub în timp real).

---

## 2. Bază de date — Supabase / PostgreSQL

- **Row Level Security (RLS) este obligatorie** pe fiecare tabel. Nicio tabelă fără policy activă. Policy default: deny all.
- Politicile RLS verifică `auth.uid() = user_id` — niciodată `USING (true)` fără condiție.
- Orice câmp căutat frecvent (`user_id`, `ad_account_id`, `created_at`) primește index explicit.
- Orice tabelă nouă primește imediat: `ALTER TABLE x ENABLE ROW LEVEL SECURITY;` + cel puțin o policy.
- Operațiile care modifică mai multe tabele se fac în tranzacție.
- Niciun query dinamic construit prin concatenare de string-uri — se folosesc parametri Supabase (`.eq()`, `.filter()` etc.).
- Migrațiile sunt **aditive** — nu șterg coloane sau tabele fără plan de rollback documentat.
- Nicio migrație nu rulează direct pe producție fără testare prealabilă.
- Cache-ul (`insights_cache`) se invalidează corect — `expires_at` se verifică înainte de a returna date cached.
- Niciodată `SELECT *` sau query fără `LIMIT` pe tabele care pot crește nelimitat.

---

## 3. Autentificare și autorizare

- Verificarea sesiunii se face cu `supabase.auth.getUser()` — **niciodată** `getSession()` (nu verifică JWT pe server).
- Orice API route care accesează date returnează **401** dacă sesiunea lipsește, **403** dacă userul nu are drept.
- Ownership check obligatoriu: după ce ai user-ul, verifici că resursa îi aparține prin query cu `user_id`. Ownership check-ul se face întotdeauna **server-side**.
- Cookie-urile de sesiune au: `httpOnly: true`, `secure: true` (producție), `sameSite: 'lax'`.
- OAuth state parameter (CSRF) se verifică înainte de a procesa orice callback Meta — implementat în `app/api/auth/meta/callback/route.ts`.
- La logout se invalidează sesiunea pe server (`supabase.auth.signOut()`), nu doar local.
- Parolele nu se loghează, nu se returnează în răspunsuri, nu se stochează în clar.

---

## 4. Input și output

- **Niciun query SQL construit prin concatenare** — Supabase client folosește parametri întotdeauna.
- `dangerouslySetInnerHTML` este interzis fără sanitizare explicită. Dacă e necesar, instalezi `dompurify` și sanitizezi înainte.
- Validare server-side obligatorie pentru orice POST/PUT — nu te baza pe validarea din client.
- URL-urile furnizate de useri se validează înainte de orice request HTTP (anti-SSRF).
- Răspunsurile API nu includ niciodată: `access_token`, `service_role_key`, stack traces, date interne DB.
- Răspunsurile de eroare au mesaj clar pentru user în română, fără detalii tehnice interne.

---

## 5. API design

- Status codes corecte: `200` succes, `201` creat, `400` input invalid, `401` neautentificat, `403` fără permisiune, `404` negăsit, `429` rate limit, `500` eroare internă.
- Fiecare răspuns de eroare are forma: `{ "error": "mesaj în română pentru user" }`.
- Niciodată `200` cu body de eroare. Niciodată `{ "error": null }` pentru succes — se omite câmpul sau se returnează `{ "data": ... }`.
- Listele suportă paginare — nu se returnează liste nelimitate din DB.
- Rutele AI (`/api/ai/analyze`, `/api/ai/copy`) au rate limiting: **max 10 req/minut per user_id**.
- Rutele Meta API au rate limiting: **max 60 req/minut per user_id**.
- Depășirea limitei returnează `429` cu header `Retry-After`.

---

## 6. Security headers și CORS

- În producție, `next.config.ts` include headers de securitate:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains`
- CORS: API routes nu acceptă origin-uri arbitrare. Se whitelist-uiesc doar domeniile cunoscute.
- `next/image` este configurat cu `remotePatterns` explicit — nu se adaugă `hostname: '*'`.

---

## 7. Rate limiting

- Rate limiting-ul se bazează pe `user_id` din sesiune, nu pe IP.
- Implementare curentă: in-memory `rateLimitMap` — funcționează pe o singură instanță.
- **Pentru producție pe Vercel (multi-instanță)**: se migrează la Upstash Redis sau Vercel KV. In-memory nu e suficient pe serverless.
- Rate limits actuale:
  - `/api/ai/analyze`: 10 req/minut per user
  - `/api/ai/copy`: 10 req/minut per user
  - `/api/meta/*`: 60 req/minut per user (de implementat)

---

## 8. Plăți

**Stripe nu există în acest proiect.** Secțiunea nu se aplică. Dacă se adaugă Stripe în viitor: verificare semnătură webhook pe fiecare request, idempotență, niciodată prețul citit din client.

---

## 9. Cod curat

- O funcție = un singur scop. Dacă descrii ce face și folosești „și", o spargi în două.
- Maxim **40 linii** per funcție. Dacă depășești, refactorizezi.
- Nesting max 3 nivele — flatten cu early returns.
- Fără magic numbers sau magic strings — se definesc constante cu nume descriptiv.
- Fără dead code: cod comentat, funcții nefolosite, importuri nefolosite.
- Fără `console.log` rămas din debugging în producție.
- Nicio duplicare — dacă copiezi mai mult de 3 linii identice, extragi o funcție.
- Naming: `camelCase` pentru variabile/funcții, `PascalCase` pentru componente, `UPPER_SNAKE_CASE` pentru constante globale, `kebab-case` pentru fișiere.

---

## 10. TypeScript

- **Niciun `any`** — dacă nu știi tipul, folosești `unknown` + type narrowing explicit.
- **Niciun `!` (non-null assertion)** fără comentariu care justifică de ce e sigur. Preferi `?.` și `??`.
- `strict: true` în `tsconfig.json` rămâne activ permanent.
- Tipurile Meta API sunt în `lib/meta/types.ts`, tipurile generale în `types/index.ts` — nu se redefinesc inline.
- Niciodată `@ts-ignore` sau `@ts-expect-error` fără explicație.
- Înainte de orice commit: `npx tsc --noEmit` trece fără erori.

---

## 11. React și Next.js 16

- **Citești `node_modules/next/dist/docs/` înainte de orice feature nou** — Next.js 16 are breaking changes față de versiunile anterioare.
- **Fișierul proxy este `proxy.ts`, nu `middleware.ts`** (deprecat în Next.js 16). Funcția exportată se numește `proxy`.
- Server Components implicit pentru pagini și layouts. `"use client"` doar când ai nevoie de hooks, event handlers, sau browser APIs.
- Nu se pune `"use client"` la nivel de pagină dacă doar o mică parte e interactivă — izolezi componenta interactivă.
- `useEffect` cleanup obligatoriu pentru subscriptions, timers, event listeners.
- `key` unic și stabil pe liste — niciodată `index` pentru liste care se reordonează.
- Imagini prin `next/image` cu `width` și `height` explicite, link-uri interne prin `next/link`.
- `useSearchParams()` se învelește obligatoriu în `<Suspense>` — Next.js 16 aruncă eroare la build fără.
- Server Components fac fetch direct — nu prin API routes intermediare inutile.

---

## 12. Performanță

- **Niciun N+1 query** — dacă ai un loop cu query în interior, restructurezi cu batch sau single query.
- Cache-ul pentru insights Meta are TTL de 1 oră în `insights_cache` — nu se bypass-uiește fără motiv.
- Componente grele (grafice Recharts) se lazy-load cu `dynamic(() => import(...), { ssr: false })`.
- Nicio dependență nouă fără verificarea impactului asupra bundle size (`npm run build` + analiza output).
- Niciodată `SELECT *` sau query fără `LIMIT`.

---

## 13. Accesibilitate WCAG 2.1 AA

- Elementele interactive fără text vizibil (butoane icon-only) au `aria-label`.
- Contrast minim: text normal **4.5:1**, text mare **3:1** față de fundal.
- Navigare completă cu tastatură — focus vizibil clar pe toate elementele interactive. Niciodată `outline: none` fără alternativă vizibilă.
- Formularele au `<label>` asociat fiecărui `<input>`.
- HTML semantic: `<nav>`, `<main>`, `<header>`, `<button>` — niciodată `<div onClick>`.
- Erorile de formular sunt anunțate cu `role="alert"` sau `aria-describedby`.
- `alt` pe orice `next/image` — descriptiv pentru imagini informative, `alt=""` pentru decorative.

---

## 14. Gestionarea erorilor

- **Niciun `catch` gol** — fiecare eroare se loghează cel puțin pe server.
- **Niciun stack trace în răspunsurile client** — eroarea internă se loghează server-side, clientul primește mesaj generic în română.
- Erorile Meta API se mapează la mesaje în română prin `MetaAPIError.getUserMessage()` din `lib/meta/types.ts`.
- Error boundaries obligatorii în jurul secțiunilor majore ale dashboard-ului.
- `try/catch` în toate API routes — nicio rută fără error handling.
- Erori așteptate gestionate explicit, cele neașteptate urcă la handler global.

---

## 15. Logging

- **Niciodată** nu se loghează: parole, tokens Meta, `ANTHROPIC_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, PII (email, nume) în afara necesității stricte.
- Log-urile server-side sunt structurate: `{ level, message, userId?, timestamp }`.
- `console.log` în client doar în development (`process.env.NODE_ENV === 'development'`).
- Debug mode dezactivat în producție.

---

## 16. Dependențe

- `package-lock.json` se commit-uiește întotdeauna.
- `npm audit --audit-level=high` se rulează înainte de orice release. Vulnerabilitățile critice/high se rezolvă înainte de push.
- Nicio dependență nouă fără justificare. Pachete > 50KB verificate dacă există alternativă nativă.
- Dependențele dev nu ajung în bundle de producție.
- `npm ci` în CI/CD, nu `npm install`.

---

## 17. Git și review

- **Commit-uri atomice**: un commit = o schimbare logică.
- Mesaje de commit în prezent imperativ: `feat: add Meta OAuth callback`, `fix: correct rate limit reset`, nu „fixed" sau „am adăugat".
- **Niciodată force-push pe `main`**.
- PR-urile au maxim **400 linii modificate**. Dacă e mai mare, se sparge.
- Niciun secret sau fișier generat (`.next/`, `node_modules/`, `.env*`) nu intră în git.
- Orice schimbare în schema Supabase vine cu migrație nouă în `supabase/migrations/` — migrațiile existente nu se modifică.

---

## 18. SSRF

- Niciun request HTTP la URL-uri furnizate direct de utilizator fără validare strictă.
- URL-urile de callback Meta se validează să fie în whitelist (`graph.facebook.com`).
- Se blochează request-urile la IP-uri private: `10.x.x.x`, `172.16.x.x`, `192.168.x.x`, `127.x.x.x`, `169.254.x.x`.
- `next.config.ts` are `remotePatterns` explicit pentru `next/image` — nu se adaugă hostname-uri arbitrare.

---

## 19. Testare

- Testele verifică **comportament**, nu implementare internă.
- Testele sunt **deterministe** — fără dependență de timp real sau date externe fără mock.
- Rutele protejate au teste care verifică că returnează 401 fără token valid.
- Niciun test nu face request-uri reale la API externe — se mock-uiesc.
- Un test care eșuează = bug, nu îl comentezi sau ștergi.
- **Notă:** Nu există framework de testare instalat în proiect momentan. La adăugarea lui, Vitest este recomandat față de Jest pentru compatibilitate cu ESM și Next.js 16.

---

## 20. Environments

- `.env.local` pentru development — niciodată commituit.
- Producția folosește variabile setate în **Vercel dashboard** (`Settings → Environment Variables`), nu fișiere `.env.production`.
- `.env.local.example` este commituit cu placeholder-e și comentarii — documentează ce variabile sunt necesare și de unde se obțin.
- Niciodată nu rulezi cu variabilele de producție local.

---

## 21. Când nu ești sigur

Dacă nu ești sigur de implementarea corectă pentru autentificare, criptare token-uri Meta, sau queries Supabase cu RLS — **OPREȘTI și întrebi**. Nu improvizezi niciodată în aceste zone. Plauzibil nu înseamnă corect. Aceste zone au consecințe de securitate directe.
