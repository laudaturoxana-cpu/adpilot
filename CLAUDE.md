@AGENTS.md

---

# CLAUDE.md — Reguli specifice proiectului AdPilot

---

## Proiectul

**AdPilot** — SaaS AI-powered de management Meta Ads, construit pentru agenția DoMarketing.ro și clienții săi din România.

Lucrezi **exclusiv** pe fișierele din acest proiect. Nu atingi alte proiecte din directorul părinte (`/Desktop/Claude code site-uri si app-uri/`).

**Foldere care nu se ating fără instrucțiune explicită:**
- `node_modules/` — niciodată
- `.next/` — generat automat
- `supabase/migrations/` — migrațiile existente nu se modifică niciodată, se adaugă doar migrații noi cu număr secvențial

---

## Înainte de orice push

Rulezi obligatoriu, în ordine:

```bash
npx tsc --noEmit              # zero erori TypeScript
npm run build                 # build de producție reușit
npm audit --audit-level=high  # zero vulnerabilități HIGH sau CRITICAL
git status                    # verifici că nu apare niciun .env în lista de modificări
```

Dacă oricare din comenzi eșuează, nu faci push. Rezolvi eroarea mai întâi.

**SEMNAL DE ALARMĂ:** dacă `git status` arată orice fișier care conține `.env` (ex: `.env.local`, `.env.production`), oprești imediat și verifici `.gitignore` înainte de orice altceva.

---

## Stack tehnic exact

| Strat | Tehnologie | Versiune confirmată |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.6 |
| Runtime | React | 19.2.4 |
| Limbaj | TypeScript | `strict: true` |
| Stilizare | Tailwind CSS 4 + CSS variables custom | ^4 |
| UI components | shadcn/ui + componente custom în `components/adpilot/` | via `components.json` |
| Animații | Framer Motion | ^12.39.0 |
| Grafice | Recharts | ^3.8.1 |
| Bază de date | Supabase (PostgreSQL) | `@supabase/supabase-js` ^2.106.1 |
| Supabase SSR | `@supabase/ssr` | ^0.10.3 |
| Auth | Supabase Auth | inclus în supabase-js |
| AI | Anthropic Claude API (`claude-sonnet-4-20250514`) | SDK `@anthropic-ai/sdk` ^0.97.1 |
| Meta API | Meta Marketing API v19.0 | client custom în `lib/meta/` |
| Deploy | Vercel | - |
| Notificări UI | Sonner | ^2.0.7 |
| Iconuri | Lucide React | ^1.16.0 |
| Utilitare CSS | clsx + tailwind-merge | incluse |

**Nu există în acest proiect:** Stripe, NextAuth (ca framework de auth), Prisma, tRPC, Redis, Upstash, Google Ads, niciun framework de testare.

**Notă `NEXTAUTH_SECRET`:** această variabilă nu are legătură cu NextAuth ca framework — e folosită exclusiv ca sursă pentru derivarea cheii AES-256-GCM de criptat token-urile Meta (`lib/meta/auth.ts` → `crypto.scryptSync`).

---

## Reguli specifice Next.js 16

- **`proxy.ts`**, nu `middleware.ts` — deprecat în Next.js 16. Funcția exportată se numește `proxy`, nu `middleware`.
- Înainte de orice feature nou care implică routing, layouts, sau server actions, citești documentația din `node_modules/next/dist/docs/`.
- Server Components implicit pentru pagini și layouts. `"use client"` doar unde e strict necesar.
- `useSearchParams()` se învelește obligatoriu în `<Suspense>` — Next.js 16 aruncă eroare la build fără.
- `next.config.ts` are `remotePatterns` explicit pentru `graph.facebook.com` — nu se adaugă hostname-uri arbitrare.

---

## Reguli specifice Supabase

- **Client browser:** `lib/supabase/client.ts` → `createClient()` — se importă în componente `"use client"`.
- **Client server:** `lib/supabase/server.ts` → `createClient()` (async, folosește `cookies()`) — se importă în Server Components și API routes.
- **Client service role:** `lib/supabase/server.ts` → `createServiceClient()` — **exclusiv** server-side, doar pentru operații administrative. Niciodată în componente client sau API routes accesibile fără autentificare.
- RLS verificată de două ori: o dată în policy Supabase, o dată în query (defense in depth).
- Schema curentă are 5 tabele: `profiles`, `meta_connections`, `insights_cache`, `generated_copy`, `ai_analyses`. Orice tabelă nouă primește migrație în `supabase/migrations/` cu prefix numeric secvențial (ex: `002_`, `003_`).
- `supabase.auth.getUser()` pe server, niciodată `getSession()`.

---

## Reguli specifice Meta API

- Clientul Meta este `lib/meta/client.ts` — clasa `MetaAPIClient`. **Nu se fac request-uri directe la Meta în afara acestei clase.**
- API version: `v19.0` — nu se schimbă fără testare.
- Token-urile Meta se stochează **criptat AES-256-GCM** prin `encryptToken()` din `lib/meta/auth.ts`. Nu se stochează și nu se loghează niciodată în clar.
- Erori Meta se procesează prin `MetaAPIError.getUserMessage()` din `lib/meta/types.ts` — returnează mesaj în română.
- Aplicația funcționează în **Meta Development Mode** — maximum 25 testeri adăugați manual.
- OAuth flow: `GET /api/auth/meta` → Meta → `GET /api/auth/meta/callback`. Nu se modifică flow-ul fără testare completă. State CSRF verificat în callback.
- Ad account ID-ul se stochează în `meta_connections.selected_ad_account_id` și se folosește pentru toate query-urile Meta.

---

## Reguli specifice Anthropic / Claude API

- Model: `claude-sonnet-4-20250514` — nu se schimbă fără instrucțiune explicită.
- `/api/ai/analyze` folosește **streaming** (`anthropic.messages.stream()`) — răspunsul se trimite chunk cu chunk la client prin `ReadableStream`.
- `/api/ai/copy` generează **JSON structurat** — răspunsul se parsează și se validează înainte de a fi returnat.
- Prompturile sunt definite **exact** în `app/api/ai/analyze/route.ts` și `app/api/ai/copy/route.ts`. Nu se modifică fără testare.
- Rate limiting: 10 req/minut per user — implementat cu `rateLimitMap` in-memory. **Pentru producție multi-instanță Vercel: se migrează la Upstash Redis sau Vercel KV.**
- Analiza se salvează în `ai_analyses` după ce streaming-ul e complet.
- Copy-ul generat se salvează în `generated_copy` după parsare reușită.

---

## Reguli specifice design system

- **Zero culori hardcodate** în componente sau pagini. Toate culorile vin din CSS variables definite în `app/globals.css`.
- Variables obligatorii: `--brand-primary`, `--brand-accent`, `--bg-base`, `--bg-surface`, `--bg-elevated`, `--text-primary`, `--text-secondary`.
- Componente custom AdPilot sunt în `components/adpilot/`: `MetricCard`, `StatusBadge`, `AIPanel`, `GlowButton`. Nu se recreează inline variante ale acestora.
- Logo-ul este în `components/brand/Logo.tsx` — `LogoFull`, `LogoSymbol`, `LogoLight`. Nu se recreează inline.
- Fonturi: `Space Grotesk` (headings/display), `Inter` (body), `JetBrains Mono` (numere/metrici/cod). Definite în `app/layout.tsx`. Nu se importă din altă parte.
- Animații: `fadeSlideUp`, `shimmer`, `pulse-dot`, `spin-slow` sunt definite în `globals.css`. Nu se adaugă duplicate.
- shadcn/ui components sunt în `components/ui/` — nu se modifică manual. Se regenerează cu CLI-ul shadcn dacă e nevoie.

---

## Reguli specifice responsive

- Sidebar-ul folosește clasa CSS `sidebar-desktop` + `open` pentru mobile. Nu se modifică logica de toggle fără a testa pe mobile.
- Breakpoint principal: `768px`. Tot ce e sub este considerat mobile.
- Clase utilitare mobile definite în `globals.css`: `.hide-mobile`, `.show-mobile`, `.mobile-full`, `.mobile-stack`, `.mobile-scroll-x`.
- Touch targets minimum **44px** pe toate elementele interactive.
- Textele folosesc `clamp()` pentru scalare fluidă — nu valori fixe în px pentru headings.

---

## Environments — unde merge ce

| Variabilă | `.env.local` (dev) | Vercel dashboard (prod) | Notă |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | ✅ | Sigur pentru client |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | ✅ | Sigur pentru client |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | ✅ | Server-side only |
| `ANTHROPIC_API_KEY` | ✅ | ✅ | Server-side only |
| `META_APP_ID` | ✅ | ✅ | Server-side only |
| `META_APP_SECRET` | ✅ | ✅ | Server-side only |
| `META_REDIRECT_URI` | localhost URL | URL producție | Diferit per env |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | URL producție | Diferit per env |
| `NEXTAUTH_SECRET` | ✅ | ✅ | Cheie AES-256-GCM |

Referință: `.env.local.example` în root — commituit în git, valori placeholder.

---

## Structura fișierelor — unde se pune ce

```
app/
  (auth)/          → pagini de login/register (fără sidebar)
  (dashboard)/     → pagini cu sidebar (protejate de auth)
  api/
    auth/meta/     → OAuth flow Meta (initiere + callback)
    meta/          → campanii, insights, adaccounts
    ai/            → analyze (streaming), copy (JSON)
  globals.css      → design system complet (CSS variables, animații)
  layout.tsx       → root layout, fonturi, Toaster

components/
  adpilot/         → MetricCard, StatusBadge, AIPanel, GlowButton
  brand/           → Logo (LogoFull, LogoSymbol, LogoLight)
  layout/          → Sidebar, Navbar
  ui/              → shadcn/ui (nu se modifică manual)

lib/
  meta/            → client.ts (MetaAPIClient), auth.ts (AES encrypt), types.ts
  supabase/        → client.ts (browser), server.ts (server + service), middleware.ts
  utils.ts         → utilitare generale

types/
  index.ts         → toate tipurile TypeScript ale proiectului

supabase/
  migrations/      → SQL migrations (aditive, niciodată modificate)

proxy.ts           → Next.js 16 proxy (nu middleware.ts)
next.config.ts     → config Next.js (remotePatterns, headers)
```

---

## Comportamente non-negociabile

1. **Niciodată** nu ștergi sau modifici fișierele din `supabase/migrations/` — migrațiile aplicate sunt imuabile.
2. **Niciodată** nu expui `SUPABASE_SERVICE_ROLE_KEY` în client sau în răspunsuri API.
3. **Niciodată** nu stochezi token-uri Meta în clar — întotdeauna prin `encryptToken()` din `lib/meta/auth.ts`.
4. **Niciodată** nu faci request-uri Meta API direct în componente — exclusiv prin `MetaAPIClient`.
5. Orice mesaj de eroare afișat userului este **în română**.
6. Orice analiză AI se face cu datele reale din Meta — nu se inventează date.
7. Înainte de orice modificare la `proxy.ts` sau la Supabase client, citești documentația relevantă din `node_modules/next/dist/docs/`.
8. Rate limiting-ul in-memory din rutele AI **nu este suficient pentru producție pe Vercel** (multiple instanțe). La scalare, se migrează la Upstash Redis.
