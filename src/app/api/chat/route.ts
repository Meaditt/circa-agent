import { NextRequest } from "next/server";
import Groq from "groq-sdk";
import { fetchPropertiesFromSheets, enrichPropertiesWithDriveImages } from "@/lib/google";
import { PROPERTIES } from "@/lib/properties";
import { ChatMessage, Property } from "@/lib/types";

let cachedProperties: Property[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000;

async function getProperties(): Promise<Property[]> {
  const now = Date.now();
  if (cachedProperties && now - cacheTimestamp < CACHE_TTL) {
    return cachedProperties;
  }

  const sheets = await fetchPropertiesFromSheets();
  const props = sheets || PROPERTIES;
  const enriched = await enrichPropertiesWithDriveImages(props);

  cachedProperties = enriched;
  cacheTimestamp = now;
  return enriched;
}

function buildSystemPrompt(properties: Property[]): string {
  return `You are an assistant for the Circa Panama real estate team. You help the team find the right properties to recommend to their buyer clients and prepare presentations.

Here is the full property inventory:

${JSON.stringify(properties, null, 2)}

How to help:
- Be direct and concise. When asked about properties, list the ones that match with key details.
- Prices are in USD.
- Respond in English or Spanish depending on how the user writes.
- You know all property details - prices, sizes, amenities, locations, developer info, ROI projections.
- When comparing properties, use a clear format showing the key differences.
- For projects with unitTypes (like Surf Lodge Residence), break down by unit type with sizes and price ranges.
- Mention ROI estimates, rental projections, and market pricing when relevant.
- Suggest which properties might work well together in a presentation based on the client's needs.
- Keep answers practical and useful - this is an internal tool, not a sales pitch.`;
}

export async function POST(request: NextRequest) {
  try {
    const { messages } = (await request.json()) as { messages: ChatMessage[] };

    const properties = await getProperties();
    const systemPrompt = buildSystemPrompt(properties);

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

    const stream = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 1024,
      stream: true,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ],
    });

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          console.error("Stream error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: unknown) {
    console.error("Chat API error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
