import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { env, requireEnv } from "@/lib/env";
import { saveSubscription } from "@/lib/billing";

export async function POST(request: Request) {
  try {
    requireEnv("RAZORPAY_WEBHOOK_SECRET");
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature") ?? "";
    const expected = createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET!).update(rawBody).digest("hex");
    if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return NextResponse.json({ error: "INVALID_SIGNATURE" }, { status: 401 });
    const event = JSON.parse(rawBody);
    const subscription = event.payload?.subscription?.entity;
    const email = subscription?.notes?.email;
    if (subscription?.id && typeof email === "string") {
      const currentEnd = subscription.current_end ? new Date(subscription.current_end * 1000).toISOString() : undefined;
      await saveSubscription({ email, subscriptionId: subscription.id, status: subscription.status, currentEnd });
    }
    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "WEBHOOK_FAILED" }, { status: 500 });
  }
}
