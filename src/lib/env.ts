import { z } from "zod";

const schema = z.object({
  OPENAI_API_KEY: z.string().min(1).optional(),
  OPENAI_CREATIVE_MODEL: z.string().default("gpt-5.6-terra"),
  RAZORPAY_KEY_ID: z.string().min(1).optional(),
  RAZORPAY_KEY_SECRET: z.string().min(1).optional(),
  RAZORPAY_PLAN_ID: z.string().min(1).optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().min(1).optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  BLOB_READ_WRITE_TOKEN: z.string().min(1).optional(),
  WORKER_API_URL: z.string().url().optional(),
  WORKER_SIGNING_SECRET: z.string().min(24).optional(),
});

export const env = schema.parse(process.env);

export function requireEnv<K extends keyof typeof env>(...keys: K[]) {
  const missing = keys.filter((key) => !env[key]);
  if (missing.length) throw new Error(`Missing server configuration: ${missing.join(", ")}`);
}
