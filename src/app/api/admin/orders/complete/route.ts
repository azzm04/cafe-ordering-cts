export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type Body = { orderNumber: string };

export async function POST(req: Request) {
  const body = (await req.json()) as Body;
  const orderNumber = (body?.orderNumber ?? "").trim();
  if (!orderNumber) return NextResponse.json({ message: "orderNumber required" }, { status: 400 });

  const { data: order, error: findErr } = await supabaseAdmin
    .from("orders")
    .select("id, table_id, completed_at")
    .eq("order_number", orderNumber)
    .single();

  if (findErr || !order) return NextResponse.json({ message: "Order not found" }, { status: 404 });

  const nowIso = new Date().toISOString();

  // set completed status + completed_at
  const { error: updErr } = await supabaseAdmin
    .from("orders")
    .update({ completed_at: nowIso, order_status: "completed" })
    .eq("id", order.id);

  if (updErr) return NextResponse.json({ message: updErr.message }, { status: 500 });

  // release table
  const { error: tableErr } = await supabaseAdmin
    .from("tables")
    .update({ status: "available" })
    .eq("id", order.table_id);

  if (tableErr) return NextResponse.json({ message: tableErr.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
