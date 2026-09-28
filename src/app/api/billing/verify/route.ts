import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { env, requireEnv } from "@/lib/env";
import { razorpayAuth, saveSubscription } from "@/lib/billing";

const Schema = z.object({
  razorpay_payment_id: z.string().min(1),
  razorpay_subscription_id: z.string().min(1),
  razorpay_signature: z.string().regex(/^[a-f0-9]{64}$/i),
});

export async function POST(request: Request) {
  try {
    requireEnv("RAZORPAY_KEY_SECRET");
    const body = Schema.parse(await request.json());
    const expected = createHmac("sha256", env.RAZORPAY_KEY_SECRET!).update(`${body.razorpay_payment_id}|${body.razorpay_subscription_id}`).digest("hex");
    if (!timingSafeEqual(Buffer.from(expected), Buffer.from(body.razorpay_signature))) return NextResponse.json({ error: "INVALID_SIGNATURE" }, { status: 401 });

    const providerResponse = await fetch(`https://api.razorpay.com/v1/subscriptions/${encodeURIComponent(body.razorpay_subscription_id)}`, { headers: { Authorization: razorpayAuth() }, cache: "no-store" });
    if (!providerResponse.ok) return NextResponse.json({ error: "VERIFICATION_FAILED" }, { status: 502 });
    const subscription = await providerResponse.json();
    const email = subscription.notes?.email;
    if (typeof email !== "string") return NextResponse.json({ error: "SUBSCRIBER_NOT_FOUND" }, { status: 422 });
    await saveSubscription({ email, subscriptionId: subscription.id, status: subscription.status });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
    return NextResponse.json({ error: "VERIFICATION_FAILED" }, { status: 500 });
  }
}
