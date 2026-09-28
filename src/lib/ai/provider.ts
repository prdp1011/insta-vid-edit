import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { ConceptsRequestSchema, ConceptsResponseSchema, type ReelConcept } from "@/lib/domain";
import { env } from "@/lib/env";

export interface CreativeProvider {
  generateConcepts(input: unknown): Promise<ReelConcept[]>;
}

export class OpenAICreativeProvider implements CreativeProvider {
  private readonly client: OpenAI;
  constructor(apiKey: string) { this.client = new OpenAI({ apiKey }); }

  async generateConcepts(rawInput: unknown) {
    const input = ConceptsRequestSchema.parse(rawInput);
    const response = await this.client.responses.parse({
      model: env.OPENAI_CREATIVE_MODEL,
      input: [
        {
          role: "system",
          content: "You are a short-form creative director. Produce exactly three distinct, honest concepts grounded only in the supplied timestamped transcript. Never claim virality. Select coherent source ranges and explain each choice with concrete editorial reasons.",
        },
        {
          role: "user",
          content: JSON.stringify(input),
        },
      ],
      text: { format: zodTextFormat(ConceptsResponseSchema, "reel_concepts") },
    });
    if (!response.output_parsed) throw new Error("The creative model returned no valid concepts");
    return response.output_parsed.concepts;
  }
}

export function creativeProvider(): CreativeProvider {
  if (!env.OPENAI_API_KEY) throw new Error("AI features are not configured");
  return new OpenAICreativeProvider(env.OPENAI_API_KEY);
}
