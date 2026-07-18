import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { MetaAPIError } from "@/lib/meta/types";
import { MetaNotConnectedError } from "@/lib/meta/connection";
import { UnauthenticatedError, ForbiddenError } from "@/lib/auth/errors";

/**
 * Logging structurat server-side. Nu logăm niciodată token-uri, chei sau PII
 * în afara necesității stricte (AGENTS.md §15).
 */
export function logError(message: string, error: unknown, userId?: string): void {
  const detail = error instanceof Error ? error.message : String(error);
  console.error(
    JSON.stringify({
      level: "error",
      message,
      detail,
      userId,
      timestamp: new Date().toISOString(),
    })
  );
}

/**
 * Transformă orice eroare într-un răspuns API sigur:
 * - erorile Meta → mesaj în română din getUserMessage() (400)
 * - orice altceva → mesaj generic în română (500), fără detalii tehnice
 *
 * Detaliul intern se loghează server-side; clientul nu vede niciodată
 * stack trace-uri sau mesaje interne (AGENTS.md §4, §14).
 */
export function handleApiError(
  context: string,
  error: unknown,
  userId?: string
): NextResponse {
  if (error instanceof MetaAPIError) {
    logError(`${context} (Meta)`, error, userId);
    return NextResponse.json({ error: error.getUserMessage() }, { status: 400 });
  }

  // Eroare de configurare așteptată (Meta neconectat) — mesaj clar, 400,
  // fără logare ca eroare internă.
  if (error instanceof MetaNotConnectedError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Erori de autorizare — 401/403 cu mesaj în română, fără logare ca eroare
  // internă (sunt fluxuri așteptate).
  if (error instanceof UnauthenticatedError || error instanceof ForbiddenError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  // Validare eșuată (Zod) — input invalid, 400, fără detalii tehnice.
  if (error instanceof ZodError) {
    return NextResponse.json({ error: "Date invalide în cerere." }, { status: 400 });
  }

  logError(context, error, userId);
  return NextResponse.json(
    { error: "A apărut o eroare internă. Te rugăm să încerci din nou." },
    { status: 500 }
  );
}
