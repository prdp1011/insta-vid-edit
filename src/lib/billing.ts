import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

export async function saveSubscription(input: { email: string; subscriptionId: string; status: string; currentEnd?: string }) {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return;
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await supabase.from("subscriptions").upsert({
    email: input.email.toLowerCase(),
    provider: "razorpay",
    provider_subscription_id: input.subscriptionId,
    status: input.status,
    plan: "creator_ai",
    current_period_end: input.currentEnd ?? null,
    updated_at: new Date().toISOString(),
  }, { onConflict: "provider_subscription_id" });
  if (error) throw new Error(`Could not save subscription: ${error.message}`);
}

export function razorpayAuth() {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) throw new Error("Razorpay is not configured");
  return `Basic ${Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString("base64")}`;
}
