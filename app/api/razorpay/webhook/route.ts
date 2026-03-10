import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hmacSha256Hex, timingSafeEqualHex } from "@/lib/razorpay";

function mustGetEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var ${name}`);
  return v;
}

export async function POST(req: Request) {
  try {
    const webhookSecret = mustGetEnv("RAZORPAY_WEBHOOK_SECRET");
    const sig = req.headers.get("x-razorpay-signature") ?? "";
    const rawBody = await req.text();

    const expected = hmacSha256Hex(webhookSecret, rawBody);
    const ok = timingSafeEqualHex(expected, sig);
    if (!ok) return NextResponse.json({ error: "Invalid signature" }, { status: 400 });

    const event = JSON.parse(rawBody) as any;
    const entity = event?.payload?.payment?.entity ?? null;

    const razorpayOrderId: string | null = entity?.order_id ?? null;
    const razorpayPaymentId: string | null = entity?.id ?? null;
    const paymentStatus: string | null = entity?.status ?? null;

    if (!razorpayOrderId) return NextResponse.json({ ok: true, ignored: true });

    const supabase = createSupabaseAdminClient();

    const nextStatus =
      paymentStatus === "captured" ? "paid" :
      paymentStatus === "failed" ? "failed" :
      "pending_payment";

    await supabase
      .from("orders")
      .update({ status: nextStatus, provider_payment_id: razorpayPaymentId })
      .eq("provider_order_id", razorpayOrderId);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}
