export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type Body = { orderNumber: string };

export async function POST(req: Request) {
  const body = (await req.json()) as Body;
  const orderNumber = (body?.orderNumber ?? "").trim();

  if (!orderNumber) {
    return NextResponse.json({ message: "orderNumber required" }, { status: 400 });
  }

  const { data: order, error: findErr } = await supabaseAdmin
    .from("orders")
    .select("id, completed_at")
    .eq("order_number", orderNumber)
    .single();

  if (findErr || !order) {
    return NextResponse.json({ message: "Order not found" }, { status: 404 });
  }

  if (order.completed_at) {
    return NextResponse.json({ message: "Order sudah completed" }, { status: 400 });
  }

  const { error: updErr } = await supabaseAdmin
    .from("orders")
    .update({ order_status: "served" })
    .eq("id", order.id);

  if (updErr) {
    return NextResponse.json({ message: updErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
