import { NextResponse } from "next/server";

/**
 * Rate limiting per user_id, în fereastră fixă.
 *
 * ATENȚIE (AGENTS.md §7): implementarea in-memory funcționează doar pe o
 * singură instanță. Pe Vercel serverless (multi-instanță) se resetează la
 * fiecare cold start și nu se împarte între instanțe. Pentru producție se
 * migrează la Vercel KV / Upstash Redis păstrând aceeași semnătură `checkRateLimit`.
 */

const WINDOW_MS = 60_000;

interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

const store = new Map<string, { count: number; resetAt: number }>();

/**
 * @param key   identificator unic (ex: `ai:${userId}` sau `meta:${userId}`)
 * @param limit numărul maxim de cereri permise în fereastra de 1 minut
 */
export function checkRateLimit(key: string, limit: number): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (entry.count >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    };
  }

  entry.count++;
  return { allowed: true, retryAfterSeconds: 0 };
}

/** Răspuns 429 standard, cu header Retry-After (AGENTS.md §5). */
export function rateLimitResponse(retryAfterSeconds: number): NextResponse {
  return NextResponse.json(
    { error: "Prea multe cereri. Te rugăm să încerci din nou peste puțin timp." },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
  );
}
