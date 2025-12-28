export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type TableRow = {
  id: string;
  table_number: number;
  status: "available" | "occupied" | "reserved";
};

type ActiveOrderRow = {
  id: string;
  order_number: string;
  total_amount: number;
  payment_status: "pending" | "paid" | "failed" | "expired";
  payment_method: string | null;
  created_at: string;
  completed_at: string | null;
  table_id: string;
  tables?: { table_number: number } | null;
  order_status: "received" | "served" | "completed";
};

type ActiveTableRef = { table_id: string };

export async function GET() {
  // 1) get all tables
  const { data: tables, error: tErr } = await supabaseAdmin
    .from("tables")
    .select("id, table_number, status")
    .order("table_number", { ascending: true })
    .returns<TableRow[]>();

  if (tErr)
    return NextResponse.json({ message: tErr.message }, { status: 500 });

  // 2) get active orders (not completed)
  const { data: activeOrders, error: oErr } = await supabaseAdmin
    .from("orders")
    .select(
      "id, order_number, total_amount, payment_status, payment_method, order_status, created_at, completed_at, table_id, tables(table_number)"
    )
    .is("completed_at", null)
    .order("created_at", { ascending: false })
    .returns<ActiveOrderRow[]>();

  if (oErr)
    return NextResponse.json({ message: oErr.message }, { status: 500 });

  // 3) get table_id with active orders
  const { data: activeTableRefs, error: aErr } = await supabaseAdmin
    .from("orders")
    .select("table_id")
    .is("completed_at", null)
    .returns<ActiveTableRef[]>();

  if (aErr)
    return NextResponse.json({ message: aErr.message }, { status: 500 });

  const occupiedSet = new Set((activeTableRefs ?? []).map((x) => x.table_id));

  // 4) computed table status
  const computedTables = (tables ?? []).map((t) => ({
    ...t,
    status: occupiedSet.has(t.id) ? ("occupied" as const) : t.status,
  }));

  return NextResponse.json({
    tables: computedTables,
    activeOrders: activeOrders ?? [],
  });
}
