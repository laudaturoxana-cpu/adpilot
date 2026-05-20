import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Rate limiting — max 10 req/min per user
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + 60000 });
    return true;
  }
  if (entry.count >= 10) return false;
  entry.count++;
  return true;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Neautentificat" }, { status: 401 });

  if (!checkRateLimit(user.id)) {
    return NextResponse.json({ error: "Prea multe cereri. Încearcă din nou în 1 minut." }, { status: 429 });
  }

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
          .eq("user_id", user.id)
          .single();

        await supabase.from("ai_analyses").insert({
          user_id: user.id,
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
