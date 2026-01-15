// src/app/api/admin/orders/mark-paid/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth-server";
import { deductStockForOrder } from "@/lib/inventory/index";

type Body = { orderNumber: string };

type OrderRow = {
  id: string; // UUID
  table_id: string;
  order_number: string;
  completed_at: string | null;
  payment_status: string;
  stock_deducted_at: string | null;
};

export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const body = (await req.json()) as Body;
  const orderNumber = (body?.orderNumber ?? "").trim();
  if (!orderNumber) return NextResponse.json({ message: "orderNumber required" }, { status: 400 });

  const { data: order, error: findErr } = await supabaseAdmin
    .from("orders")
    .select("id, table_id, order_number, completed_at, payment_status, stock_deducted_at")
    .eq("order_number", orderNumber)
    .single<OrderRow>();

  if (findErr || !order) return NextResponse.json({ message: "Order not found" }, { status: 404 });

  if (order.completed_at) {
    return NextResponse.json({ message: "Order sudah completed" }, { status: 400 });
  }

  // kalau sudah pernah deduct, jangan ulang
  if (!order.stock_deducted_at) {
    await deductStockForOrder(order.id);

    const { error: markErr } = await supabaseAdmin
      .from("orders")
      .update({ stock_deducted_at: new Date().toISOString() })
      .eq("id", order.id);

    if (markErr) return NextResponse.json({ message: markErr.message }, { status: 500 });
  }

  // set paid cash (sekalian rapihin)
  const { error: updErr } = await supabaseAdmin
    .from("orders")
    .update({
      payment_status: "paid",
      payment_method: "cash",
    })
    .eq("id", order.id);

  if (updErr) return NextResponse.json({ message: updErr.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
