import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { PROPERTIES } from "@/lib/properties";
import { ChatMessage } from "@/lib/types";

const SYSTEM_PROMPT = `You are a real estate agent at Circa Panama. Talk like a real person - casual, warm, but professional. Keep it short. No corporate fluff.

Here are the properties you can show:

${JSON.stringify(PROPERTIES, null, 2)}

How to talk to customers:
- Be direct. If someone asks "what do you have under 600K?" just show them what fits. No long intros.
- Keep responses short - 2-4 sentences per property recommendation, not essays.
- Ask follow-up questions naturally: "Are you looking for something near the beach or more up in the mountains?"
- When you recommend properties, highlight what makes each one special in plain language.
- Max 2-3 properties per message. Don't overwhelm them.
- Prices are in USD.

About generating presentations:
- ONLY after you've had a real conversation and recommended properties that the customer seems interested in, offer to put together a presentation for them.
- Say something natural like "Want me to put together a quick presentation with these properties so you can share it with your partner/review later?"
- If they say yes, ask for their name.
- ONLY after they confirm YES to a presentation AND give you their name, include this at the very end of your message:
  |||GENERATE_PPTX|||{"customerName": "Their Name", "propertyNames": ["Property1", "Property2"]}|||END_PPTX|||
- NEVER include the GENERATE_PPTX block unless the customer has explicitly said yes to getting a presentation. A customer asking a question or saying "sounds good" about a property is NOT a request for a presentation.`;

export async function POST(request: NextRequest) {
  try {
    const { messages } = (await request.json()) as { messages: ChatMessage[] };

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 1024,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ],
    });

    const content = response.choices[0]?.message?.content ?? "";

    return NextResponse.json({ content });
  } catch (error: unknown) {
    console.error("Chat API error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
