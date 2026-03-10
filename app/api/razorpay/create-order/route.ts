import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type Body = {
  /** Your internal orders.id (uuid) created via create_shop_order RPC */
  order_id: string;
  currency?: string; // default INR
  receipt?: string;  // optional
};

function mustGetEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var ${name}`);
  return v;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    if (!body?.order_id) {
      return NextResponse.json({ error: "order_id is required" }, { status: 400 });
    }

    const keyId = mustGetEnv("NEXT_PUBLIC_RAZORPAY_KEY_ID");
    const keySecret = mustGetEnv("RAZORPAY_KEY_SECRET");

    const supabase = createSupabaseAdminClient();

    const { data: order, error: oerr } = await supabase
      .from("orders")
      .select("id, total_inr, status, provider_order_id")
      .eq("id", body.order_id)
      .maybeSingle();

    if (oerr) return NextResponse.json({ error: oerr.message }, { status: 500 });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    if (order.provider_order_id) {
      return NextResponse.json({
        razorpay_order_id: order.provider_order_id,
        amount_paise: Math.round(Number(order.total_inr ?? 0) * 100),
        currency: body.currency ?? "INR",
        key_id: keyId,
        internal_order_id: order.id,
      });
    }

    const amountPaise = Math.round(Number(order.total_inr ?? 0) * 100);
    if (!Number.isFinite(amountPaise) || amountPaise <= 0) {
      return NextResponse.json({ error: "Invalid order amount" }, { status: 400 });
    }

    const rzpOrderPayload = {
      amount: amountPaise,
      currency: body.currency ?? "INR",
      receipt: body.receipt ?? `clinic_${order.id}`,
      payment_capture: 1,
    };

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const resp = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(rzpOrderPayload),
    });

    const json = await resp.json();
    if (!resp.ok) {
      return NextResponse.json({ error: "Razorpay order create failed", details: json }, { status: 502 });
    }

    const razorpayOrderId = json.id as string;

    const { error: uerr } = await supabase
      .from("orders")
      .update({
        provider: "razorpay",
        provider_order_id: razorpayOrderId,
        status: "pending_payment",
      })
      .eq("id", order.id);

    if (uerr) return NextResponse.json({ error: uerr.message }, { status: 500 });

    return NextResponse.json({
      razorpay_order_id: razorpayOrderId,
      amount_paise: amountPaise,
      currency: rzpOrderPayload.currency,
      key_id: keyId,
      internal_order_id: order.id,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}
