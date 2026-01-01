export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth-server";
import { supabaseAdmin } from "@/lib/supabase/admin";

function jsonNoStore(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "CDN-Cache-Control": "no-store",
      "Vercel-CDN-Cache-Control": "no-store",
      ...(init?.headers ?? {}),
    },
  });
}

export async function GET(req: Request) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { searchParams } = new URL(req.url);
  const orderNumber = (searchParams.get("orderNumber") ?? "").trim();

  if (!orderNumber) return jsonNoStore({ message: "orderNumber wajib" }, { status: 400 });

  const { data: order, error: orderErr } = await supabaseAdmin
    .from("orders")
    .select(
      `
      id,
      order_number,
      total_amount,
      payment_status,
      payment_method,
      order_status,
      created_at,
      completed_at,
      tables(table_number)
    `
    )
    .eq("order_number", orderNumber)
    .single();

  if (orderErr || !order) return jsonNoStore({ message: "Order tidak ditemukan" }, { status: 404 });

  const { data: items, error: itemsErr } = await supabaseAdmin
    .from("order_items")
    .select(
      `
      id,
      quantity,
      price,
      subtotal,
      notes,
      menu_items(name, category_id)
    `
    )
    .eq("order_id", order.id);

  if (itemsErr) return jsonNoStore({ message: itemsErr.message }, { status: 500 });

  return jsonNoStore({ order, items: items ?? [] });
}
