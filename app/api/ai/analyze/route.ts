import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { resolveWorkspaceContext } from "@/lib/auth/current-workspace";
import { handleApiError } from "@/lib/api/errors";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const AI_RATE_LIMIT = 10;

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  let user, workspaceId;
  try {
    ({ user, workspaceId } = await resolveWorkspaceContext(supabase, "view_data"));
  } catch (err) {
    return handleApiError("POST /api/ai/analyze", err);
  }

  const rl = checkRateLimit(`ai:${user.id}`, AI_RATE_LIMIT);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterSeconds);

  const { insights, clientName = "client", period = 7 } = await request.json();

  const prompt = `Ești un expert Meta Ads senior care lucrează pentru agenția DoMarketing.ro din România.
Analizezi datele reale ale clientului: ${clientName}

DATE CAMPANII (ultimele ${period} zile):
${JSON.stringify(insights, null, 2)}

Oferă o analiză structurată:

## 🎯 Sumar Executiv
[2-3 fraze despre starea generală a contului]

## ✅ Ce merge bine
[Campanii performante cu cifre concrete și de ce funcționează]

## ⚠️ Probleme identificate
[Campanii cu probleme, cu cifre concrete și impact financiar estimat]

## 🚀 Recomandări prioritare
1. [Acțiune concretă cu impact estimat]
2. [Acțiune concretă cu impact estimat]
3. [Acțiune concretă cu impact estimat]

## 💰 Optimizare buget
[Unde să mute banii și de ce, cu cifre]

Răspunde în limba română. Fii direct, folosește cifre reale din date.
Nu inventa date care nu există în raport.`;

  const encoder = new TextEncoder();
  let fullText = "";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await anthropic.messages.stream({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2000,
          messages: [{ role: "user", content: prompt }],
        });

        for await (const chunk of response) {
          if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
            fullText += chunk.delta.text;
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }

        // Save to DB after streaming completes
        const { data: connection } = await supabase
          .from("meta_connections")
          .select("selected_ad_account_id")
          .eq("workspace_id", workspaceId)
          .maybeSingle();

        await supabase.from("ai_analyses").insert({
          user_id: user.id,
          workspace_id: workspaceId,
          ad_account_id: connection?.selected_ad_account_id ?? "unknown",
          period_days: period,
          raw_data: insights,
          analysis_text: fullText,
        });

        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
