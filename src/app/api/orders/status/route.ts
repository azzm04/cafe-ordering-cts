export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

type PaymentStatus = "pending" | "paid" | "failed" | "expired";

type OrderRow = {
  payment_status: PaymentStatus;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const orderNumber = (searchParams.get("order_number") ?? "").trim();

  if (!orderNumber) {
    return NextResponse.json({ ok: false, message: "order_number required" }, { status: 400 });
  }

  const { data, error } = await supabaseServer
    .from("orders")
    .select("payment_status")
    .eq("order_number", orderNumber)
    .single<OrderRow>();

  if (error || !data) {
    return NextResponse.json({ ok: false, message: "Order not found" }, { status: 404 });
  }

  return NextResponse.json(
    { ok: true, payment_status: data.payment_status },
    { headers: { "Cache-Control": "no-store" } }
  );
}
