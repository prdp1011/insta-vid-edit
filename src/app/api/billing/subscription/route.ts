import { NextResponse } from "next/server";
import { z } from "zod";
import { env, requireEnv } from "@/lib/env";
import { razorpayAuth } from "@/lib/billing";

const RequestSchema = z.object({ email: z.string().email().max(254) });

export async function POST(request: Request) {
  try {
    requireEnv("RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET", "RAZORPAY_PLAN_ID");
    const { email } = RequestSchema.parse(await request.json());
    const response = await fetch("https://api.razorpay.com/v1/subscriptions", {
      method: "POST",
      headers: { Authorization: razorpayAuth(), "Content-Type": "application/json" },
      body: JSON.stringify({ plan_id: env.RAZORPAY_PLAN_ID, total_count: 120, quantity: 1, customer_notify: 1, notes: { email: email.toLowerCase(), product: "framepilot_creator_ai" } }),
      cache: "no-store",
    });
    const data = await response.json();
    if (!response.ok) return NextResponse.json({ error: "PAYMENT_PROVIDER_ERROR" }, { status: 502 });
    return NextResponse.json({ subscriptionId: data.id, keyId: env.RAZORPAY_KEY_ID, email });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "INVALID_EMAIL" }, { status: 400 });
    const message = error instanceof Error ? error.message : "Billing setup failed";
    return NextResponse.json({ error: "BILLING_NOT_CONFIGURED", message }, { status: 503 });
  }
}
