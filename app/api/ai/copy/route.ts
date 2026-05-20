import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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

  const { product, audience, objective, tone = "Profesionist", variants = 3 } = await request.json();

  if (!product || !audience || !objective) {
    return NextResponse.json({ error: "Produs, audiență și obiectiv sunt obligatorii" }, { status: 400 });
  }

  const prompt = `Ești copywriter expert în Facebook & Instagram Ads pentru piața din România.
Cunoști psihologia consumatorului român și scrii texte care convertesc.

BRIEF:
- Produs/Serviciu: ${product}
- Audiență: ${audience}
- Obiectiv campanie: ${objective}
- Ton dorit: ${tone}

Generează ${variants} variante DIFERITE ca abordare (nu doar reformulări).
Fiecare variantă să testeze un unghi diferit: rațional vs emoțional, problemă vs soluție, FOMO vs aspirație.

Răspunde EXCLUSIV cu JSON valid, fără text înainte sau după:
{
  "variants": [
    {
      "approach": "numele unghiului (ex: Durere → Soluție)",
      "primary_text": "text max 125 caractere",
      "headline": "titlu max 40 caractere",
      "description": "descriere max 30 caractere",
      "cta": "unul din: Learn More|Contact Us|Get Quote|Book Now|Sign Up|Shop Now",
      "emoji_hook": "primul emoji care captează atenția",
      "rationale": "de ce funcționează acest unghi pentru audiența dată"
    }
  ]
}`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== "text") throw new Error("Răspuns invalid de la Claude");

    let parsed: { variants: unknown[] };
    try {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Nu s-a găsit JSON în răspuns");
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      throw new Error("Eroare la parsarea răspunsului AI");
    }

    // Save to DB
    await supabase.from("generated_copy").insert({
      user_id: user.id,
      product,
      audience,
      objective,
      tone,
      variants: parsed.variants,
    });

    return NextResponse.json({ data: parsed.variants });

  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
