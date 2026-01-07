// src/app/api/admin/reports/summary/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/admin-auth-server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type SummaryResponse = {
  range: { from: string; to: string };
  totalOmzet: number;
  breakdown: { cash: number; nonCash: number };
  topMenus: Array<{
    menu_item_id: string;
    name: string;
    qty: number;
    omzet: number;
  }>;
};

function toJakartaRange(from: string, to: string) {
  // MVP: offset +07:00
  return {
    start: `${from}T00:00:00+07:00`,
    end: `${to}T23:59:59+07:00`,
  };
}

export async function GET(req: Request) {
  const guard = await requireOwner();
  if (guard instanceof NextResponse) return guard;
  const auth = await requireOwner();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json({ message: "from & to wajib (YYYY-MM-DD)" }, { status: 400 });
  }

  const { start, end } = toJakartaRange(from, to);

  // 1) Ambil semua order paid dalam range
  const { data: orders, error: e1 } = await supabaseAdmin
    .from("orders")
    .select("id,total_amount,payment_method")
    .eq("payment_status", "paid")
    .gte("created_at", start)
    .lte("created_at", end);

  if (e1) return NextResponse.json({ message: e1.message }, { status: 500 });

  const totalOmzet = (orders ?? []).reduce((a, o) => a + Number(o.total_amount ?? 0), 0);

  const cash = (orders ?? [])
    .filter((o) => String(o.payment_method ?? "").toLowerCase() === "cash")
    .reduce((a, o) => a + Number(o.total_amount ?? 0), 0);

  const nonCash = totalOmzet - cash;

  const orderIds = (orders ?? []).map((o) => o.id);
  if (orderIds.length === 0) {
    const empty: SummaryResponse = {
      range: { from, to },
      totalOmzet: 0,
      breakdown: { cash: 0, nonCash: 0 },
      topMenus: [],
    };
    return NextResponse.json(empty);
  }

  // 2) Ambil order items untuk order paid
  const { data: items, error: e2 } = await supabaseAdmin
    .from("order_items")
    .select("menu_item_id,quantity,subtotal,order_id")
    .in("order_id", orderIds);

  if (e2) return NextResponse.json({ message: e2.message }, { status: 500 });

  // agregasi qty + omzet per menu_item_id
  const agg = new Map<string, { qty: number; omzet: number }>();
  for (const it of items ?? []) {
    const id = String(it.menu_item_id);
    const prev = agg.get(id) ?? { qty: 0, omzet: 0 };
    prev.qty += Number(it.quantity ?? 0);
    prev.omzet += Number(it.subtotal ?? 0);
    agg.set(id, prev);
  }

  const menuIds = [...agg.keys()];
  const { data: menus, error: e3 } = await supabaseAdmin
    .from("menu_items")
    .select("id,name")
    .in("id", menuIds);

  if (e3) return NextResponse.json({ message: e3.message }, { status: 500 });

  const nameById = new Map<string, string>((menus ?? []).map((m) => [String(m.id), String(m.name)]));

  const topMenus = [...agg.entries()]
    .map(([id, v]) => ({
      menu_item_id: id,
      name: nameById.get(id) ?? "-",
      qty: v.qty,
      omzet: v.omzet,
    }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 10);

  const result: SummaryResponse = {
    range: { from, to },
    totalOmzet,
    breakdown: { cash, nonCash },
    topMenus,
  };

  return NextResponse.json(result);
}
