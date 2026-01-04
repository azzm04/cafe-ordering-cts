export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth-server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type Body = { tableNumber?: unknown };

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

export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const body: Body = await req.json().catch(() => ({}));
  const raw = body.tableNumber;

  const tableNumber =
    typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : NaN;

  if (!Number.isFinite(tableNumber) || tableNumber < 1 || tableNumber > 100) {
    return jsonNoStore({ message: "tableNumber invalid" }, { status: 400 });
  }

  // 1) Ambil table_id berdasarkan table_number
  const { data: tableRow, error: tErr } = await supabaseAdmin
    .from("tables")
    .select("id, table_number")
    .eq("table_number", tableNumber)
    .maybeSingle();

  if (tErr) return jsonNoStore({ message: tErr.message }, { status: 500 });
  if (!tableRow) return jsonNoStore({ message: "Meja tidak ditemukan" }, { status: 404 });

  // 2) Set table available
  const { error: uErr } = await supabaseAdmin
    .from("tables")
    .update({ status: "available" })
    .eq("id", tableRow.id);

  if (uErr) return jsonNoStore({ message: uErr.message }, { status: 500 });

  const nowIso = new Date().toISOString();

  const { error: oErr } = await supabaseAdmin
    .from("orders")
    .update({ order_status: "completed", completed_at: nowIso })
    .eq("table_id", tableRow.id)
    .in("order_status", ["received", "served"]);

  if (oErr) {
    return jsonNoStore(
      { message: `Table updated but orders not updated: ${oErr.message}` },
      { status: 500 }
    );
  }

  return jsonNoStore({ ok: true, tableNumber });
}
