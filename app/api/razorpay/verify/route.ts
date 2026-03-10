import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hmacSha256Hex, timingSafeEqualHex } from "@/lib/razorpay";

type Body = {
  internal_order_id: string; // orders.id
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

function mustGetEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var ${name}`);
  return v;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const { internal_order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = body ?? ({} as any);

    if (!internal_order_id || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const keySecret = mustGetEnv("RAZORPAY_KEY_SECRET");
    const expected = hmacSha256Hex(keySecret, `${razorpay_order_id}|${razorpay_payment_id}`);
    const ok = timingSafeEqualHex(expected, razorpay_signature);

    const supabase = createSupabaseAdminClient();

    if (!ok) {
      await supabase
        .from("orders")
        .update({
          status: "payment_verification_failed",
          provider_payment_id: razorpay_payment_id,
          provider_signature: razorpay_signature,
        })
        .eq("id", internal_order_id);

      return NextResponse.json({ verified: false }, { status: 400 });
    }

    const { error } = await supabase
      .from("orders")
      .update({
        status: "paid",
        provider_payment_id: razorpay_payment_id,
        provider_signature: razorpay_signature,
      })
      .eq("id", internal_order_id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ verified: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}
