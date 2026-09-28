import { describe, expect, it } from "vitest";
import { ConceptsRequestSchema, TimelineItemSchema } from "./domain";

describe("timeline contracts", () => {
  it("accepts a valid source-linked item", () => {
    const item = TimelineItemSchema.parse({
      id: "a47b925f-e86f-4506-8c59-4eaa3cb090e9",
      type: "video",
      trackId: "video-main",
      timelineStart: 0,
      timelineEnd: 10,
      sourceAssetId: "4f336bbd-dfcb-48c4-9700-aa5a75bb0c67",
      sourceStart: 35,
      sourceEnd: 45,
    });
    expect(item.volume).toBe(1);
  });

  it("rejects inverted ranges", () => {
    expect(() => TimelineItemSchema.parse({
      id: "a47b925f-e86f-4506-8c59-4eaa3cb090e9",
      type: "video",
      trackId: "main",
      timelineStart: 9,
      timelineEnd: 2,
    })).toThrow(/Timeline end/);
  });

  it("caps transcript and duration inputs before model use", () => {
    expect(() => ConceptsRequestSchema.parse({ objective: "Make a reel", transcript: "too short", desiredDuration: 999 })).toThrow();
  });
});
