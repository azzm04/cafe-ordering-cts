export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

type TableRow = {
  id: string;
  table_number: number;
  status: "available" | "occupied" | "reserved";
};

type ActiveTableRef = { table_id: string };

export async function GET() {
  const { data: tables, error: tErr } = await supabaseServer
    .from("tables")
    .select("id, table_number, status")
    .order("table_number", { ascending: true })
    .returns<TableRow[]>();

  if (tErr) return NextResponse.json({ message: tErr.message }, { status: 500 });

  const { data: activeRefs, error: aErr } = await supabaseServer
    .from("orders")
    .select("table_id")
    .is("completed_at", null)
    .returns<ActiveTableRef[]>();

  if (aErr) return NextResponse.json({ message: aErr.message }, { status: 500 });

  const occupiedSet = new Set((activeRefs ?? []).map((x) => x.table_id));

  const merged = (tables ?? []).map((t) => ({
    ...t,
    status: occupiedSet.has(t.id) ? ("occupied" as const) : t.status,
  }));

  return NextResponse.json({ tables: merged });
}
