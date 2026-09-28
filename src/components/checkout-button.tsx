"use client";

import { useState } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

async function loadCheckout() {
  if (window.Razorpay) return;
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(); script.onerror = () => reject(new Error("Could not load secure checkout"));
    document.head.appendChild(script);
  });
}

export function CheckoutButton() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const checkout = async () => {
    setLoading(true); setError("");
    try {
      await loadCheckout();
      const response = await fetch("/api/billing/subscription", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({email}) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Payments are not configured yet.");
      const razorpay = new window.Razorpay({
        key: data.keyId,
        subscription_id: data.subscriptionId,
        name: "FramePilot",
        description: "Creator AI — monthly",
        prefill: { email },
        theme: { color: "#7657ff" },
        handler: async (result: Record<string,string>) => {
          const verified = await fetch("/api/billing/verify", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(result) });
          if (!verified.ok) { setError("Payment received, but verification is pending. We will email you shortly."); return; }
          router.push("/studio?upgraded=1");
        },
      });
      razorpay.open();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Checkout could not start."); }
    finally { setLoading(false); }
  };

  return <div><div className="flex flex-col gap-2 sm:flex-row"><input type="email" required value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="you@creator.com" className="h-12 min-w-0 flex-1 rounded-full border border-white/12 bg-black/20 px-5 text-sm outline-none focus:border-lime/50"/><button onClick={checkout} disabled={loading || !email.includes("@")} className="button-primary h-12 px-6 text-sm disabled:opacity-35">{loading?<LoaderCircle className="animate-spin" size={16}/>:<>Start Creator AI <ArrowRight size={16}/></>}</button></div>{error&&<p className="mt-3 text-xs leading-5 text-amber-200">{error}</p>}</div>;
}
