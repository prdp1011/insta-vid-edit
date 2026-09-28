import { z } from "zod";

export const PlatformSchema = z.enum(["instagram_reels", "youtube_shorts", "tiktok", "linkedin"]);

export const TransformSchema = z.object({
  scale: z.number().positive().default(1),
  x: z.number().default(0),
  y: z.number().default(0),
  rotation: z.number().default(0),
  fit: z.enum(["cover", "contain"]).default("cover"),
});

export const TimelineItemSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(["video", "audio", "caption", "graphic", "broll", "music", "sfx"]),
  trackId: z.string(),
  timelineStart: z.number().nonnegative(),
  timelineEnd: z.number().positive(),
  sourceAssetId: z.string().uuid().optional(),
  sourceStart: z.number().nonnegative().optional(),
  sourceEnd: z.number().positive().optional(),
  transform: TransformSchema.optional(),
  volume: z.number().min(0).max(2).default(1),
  metadata: z.record(z.string(), z.unknown()).default({}),
}).refine((item) => item.timelineEnd > item.timelineStart, "Timeline end must follow start");

export const TimelineSchema = z.object({
  id: z.string().uuid(),
  version: z.number().int().positive(),
  platform: PlatformSchema,
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  fps: z.number().positive(),
  duration: z.number().positive(),
  items: z.array(TimelineItemSchema),
});

export const HookSchema = z.object({
  id: z.string(),
  type: z.enum(["direct", "curiosity", "question", "result", "contrarian", "problem", "story", "numeric"]),
  text: z.string().min(1).max(220),
  sourceStart: z.number().nonnegative(),
  sourceEnd: z.number().positive(),
});

export const ReelConceptSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(100),
  angle: z.string().min(1).max(300),
  estimatedDuration: z.number().min(10).max(180),
  hook: HookSchema,
  sourceStart: z.number().nonnegative(),
  sourceEnd: z.number().positive(),
  reasons: z.array(z.string().min(1).max(160)).min(1).max(5),
});

export const ConceptsRequestSchema = z.object({
  objective: z.string().min(3).max(800),
  transcript: z.string().min(20).max(120_000),
  platform: PlatformSchema.default("instagram_reels"),
  desiredDuration: z.number().min(10).max(180).default(30),
  style: z.enum(["natural", "balanced", "fast"]).default("balanced"),
});

export const ConceptsResponseSchema = z.object({ concepts: z.array(ReelConceptSchema).length(3) });

export type Timeline = z.infer<typeof TimelineSchema>;
export type ReelConcept = z.infer<typeof ReelConceptSchema>;

export const PLATFORM_PRESETS = {
  instagram_reels: { label: "Instagram Reels", width: 1080, height: 1920, maxDuration: 90 },
  youtube_shorts: { label: "YouTube Shorts", width: 1080, height: 1920, maxDuration: 180 },
  tiktok: { label: "TikTok", width: 1080, height: 1920, maxDuration: 180 },
  linkedin: { label: "LinkedIn", width: 1080, height: 1920, maxDuration: 600 },
} as const;
