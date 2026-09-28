import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { creativeProvider } from "@/lib/ai/provider";

export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const concepts = await creativeProvider().generateConcepts(await request.json());
    return NextResponse.json({ concepts });
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: "INVALID_REQUEST", details: error.issues }, { status: 400 });
    const message = error instanceof Error ? error.message : "Concept generation failed";
    const configurationError = message.includes("not configured");
    return NextResponse.json({ error: configurationError ? "AI_NOT_CONFIGURED" : "CONCEPT_GENERATION_FAILED", message }, { status: configurationError ? 503 : 500 });
  }
}
