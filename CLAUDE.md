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
- `supabase/migrations/` — migrațiile existente nu se modifică, se adaugă doar migrații noi

---

## Înainte de orice push

Rulezi obligatoriu, în ordine:

```bash
npx tsc --noEmit          # zero erori TypeScript
npm run build             # build de producție reușit
```

Dacă oricare din comenzi eșuează, nu faci push. Rezolvi eroarea mai întâi.

---

## Stack tehnic exact

| Strat | Tehnologie | Versiune |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.6 |
| Limbaj | TypeScript | strict mode |
| Stilizare | Tailwind CSS + CSS variables custom | latest |
| UI components | shadcn/ui + componente custom în `components/adpilot/` | - |
| Animații | Framer Motion | 12.x |
| Grafice | Recharts | 3.x |
| Bază de date | Supabase (PostgreSQL) | - |
| Auth | Supabase Auth | - |
| AI | Anthropic Claude API (`claude-sonnet-4-20250514`) | SDK 0.97.x |
| Meta API | Meta Marketing API v19.0 | - |
| Deploy | Vercel | - |
| Notificări UI | Sonner | 2.x |
| Iconuri | Lucide React | 1.x |

**Nu există:** Stripe, Google Ads, NextAuth, Prisma, tRPC.

---

## Reguli specifice Next.js 16

- Fișierul de proxy/middleware se numește `proxy.ts` (nu `middleware.ts` — deprecat).
- Funcția exportată din `proxy.ts` se numește `proxy` (nu `middleware`).
- Înainte de orice feature nou care implică routing, layouts, sau server actions, citești documentația din `node_modules/next/dist/docs/`.
- Server Components implicit pentru pagini și layouts. `"use client"` doar unde e strict necesar.
- `useSearchParams()` se învelește obligatoriu în `<Suspense>` — Next.js 16 aruncă eroare la build fără.

---

## Reguli specifice Supabase

- Clientul browser: `lib/supabase/client.ts` — se importă cu `createClient()`.
- Clientul server: `lib/supabase/server.ts` — se importă cu `createClient()` (async, folosește `cookies()`).
- Clientul service role: `lib/supabase/server.ts` — `createServiceClient()` — **exclusiv** server-side, doar pentru operații administrative.
- Niciodată `createServiceClient()` în componente client sau API routes accesibile fără autentificare.
- RLS verificată de două ori: o dată în policy Supabase, o dată în query (defense in depth).
- Schema curentă are 5 tabele: `profiles`, `meta_connections`, `insights_cache`, `generated_copy`, `ai_analyses`. Orice tabelă nouă primește migrație în `supabase/migrations/`.

---

## Reguli specifice Meta API

- Clientul Meta este `lib/meta/client.ts` — clasa `MetaAPIClient`. Nu se fac request-uri directe la Meta în afara acestei clase.
- API version: `v19.0` — nu se schimbă fără testare.
- Token-urile Meta se stochează **criptat** (AES-256-GCM) prin funcțiile din `lib/meta/auth.ts`. Nu se stochează niciodată în clar.
- Erori Meta se procesează prin `MetaAPIError.getUserMessage()` care returnează mesaj în română.
- Aplicația funcționează în **Meta Development Mode** — maximum 25 testeri adăugați manual.
- Oauth flow: `GET /api/auth/meta` → Meta → `GET /api/auth/meta/callback`. Nu se modifică flow-ul fără testare completă.
- Ad account ID-ul se stochează în `meta_connections.selected_ad_account_id` și se folosește pentru toate query-urile Meta.

---

## Reguli specifice Anthropic / Claude API

- Model: `claude-sonnet-4-20250514` — nu se schimbă fără instrucțiune explicită.
- Rutele de analiză folosesc **streaming** (`anthropic.messages.stream()`) — răspunsul se trimite chunk cu chunk la client.
- Rutele de copy generează **JSON structurat** — răspunsul se parsează și se validează înainte de a fi returnat.
- Prompturile de analiză și copy sunt definite **exact** în `app/api/ai/analyze/route.ts` și `app/api/ai/copy/route.ts`. Nu se modifică fără testare.
- Rate limiting: 10 req/minut per user — implementat în fiecare rută AI cu `rateLimitMap` in-memory.
- Analiza se salvează în `ai_analyses` după ce streaming-ul e complet.
- Copy-ul generat se salvează în `generated_copy` după parsare reușită.

---

## Reguli specifice design system

- **Zero culori hardcodate** în componente sau pagini. Toate culorile vin din CSS variables definite în `app/globals.css`.
- Variables obligatorii: `--brand-primary`, `--brand-accent`, `--bg-base`, `--bg-surface`, `--bg-elevated`, `--text-primary`, `--text-secondary`.
- Componente custom AdPilot sunt în `components/adpilot/`: `MetricCard`, `StatusBadge`, `AIPanel`, `GlowButton`.
- Logo-ul este în `components/brand/Logo.tsx` — `LogoFull`, `LogoSymbol`, `LogoLight`. Nu se recreează inline.
- Fonturi: `Space Grotesk` (headings/display), `Inter` (body), `JetBrains Mono` (numere/metrici/cod). Definite în `app/layout.tsx`.
- Animații: `fadeSlideUp`, `shimmer`, `pulse-dot`, `spin-slow` sunt definite în `globals.css`. Nu se adaugă duplicate.

---

## Reguli specifice responsive

- Sidebar-ul folosește clasa CSS `sidebar-desktop` + `open` pentru mobile. Nu se modifică logica de toggle fără a testa pe mobile.
- Breakpoint principal: `768px`. Tot ce e sub este mobile.
- Clase utilitare mobile definite în `globals.css`: `.hide-mobile`, `.show-mobile`, `.mobile-full`, `.mobile-stack`, `.mobile-scroll-x`.
- Touch targets minimum **44px** pe toate elementele interactive.
- Textele folosesc `clamp()` pentru scalare fluidă — nu valori fixe în px pentru headings.

---

## Structura fișierelor — unde se pune ce

```
app/
  (auth)/          → pagini de login/register (fără sidebar)
  (dashboard)/     → pagini cu sidebar (protejate de auth)
  api/
    auth/meta/     → OAuth flow Meta
    meta/          → campanii, insights, adaccounts
    ai/            → analyze (streaming), copy (JSON)

components/
  adpilot/         → MetricCard, StatusBadge, AIPanel, GlowButton
  brand/           → Logo
  layout/          → Sidebar, Navbar
  ui/              → shadcn/ui (nu se modifică manual)

lib/
  meta/            → client.ts, auth.ts, types.ts
  supabase/        → client.ts, server.ts, middleware.ts
  utils.ts         → utilitare generale

types/
  index.ts         → toate tipurile TypeScript ale proiectului

supabase/
  migrations/      → SQL migrations (aditive, niciodată modificate)
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
