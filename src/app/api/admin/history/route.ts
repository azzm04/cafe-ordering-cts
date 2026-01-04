// src/app/api/admin/history/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth-server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type PaymentStatus = "pending" | "paid" | "failed" | "expired";
type OrderStatus = "received" | "served" | "completed";

type TableEmbed = { table_number: number };

type Row = {
  id: string;
  order_number: string;
  total_amount: number;
  payment_status: PaymentStatus;
  payment_method: string | null;
  order_status: OrderStatus;
  created_at: string;
  completed_at: string | null;
  tables: TableEmbed | TableEmbed[] | null;
};

function pickTable(embed: Row["tables"]): TableEmbed | null {
  if (!embed) return null;
  if (Array.isArray(embed)) return embed[0] ?? null;
  return embed; // object
}

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
  if (guard instanceof NextResponse) return guard;

  const { searchParams } = new URL(req.url);

  const q = (searchParams.get("q") ?? "").trim();
  const tableStr = (searchParams.get("table") ?? "").trim();
  const paymentStatus = (searchParams.get("payment_status") ?? "").trim() as
    | PaymentStatus
    | "";
  const orderStatus = (searchParams.get("order_status") ?? "").trim() as
    | OrderStatus
    | "";
  const paymentMethod = (searchParams.get("payment_method") ?? "").trim();
  const from = (searchParams.get("from") ?? "").trim(); // YYYY-MM-DD
  const to = (searchParams.get("to") ?? "").trim(); // YYYY-MM-DD

  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const pageSize = Math.min(
    50,
    Math.max(5, Number(searchParams.get("pageSize") ?? "10"))
  );
  const fromIndex = (page - 1) * pageSize;
  const toIndex = fromIndex + pageSize - 1;

  const useTableFilter = tableStr.length > 0 && !Number.isNaN(Number(tableStr));

  const selectStr = useTableFilter
    ? `
      id,
      order_number,
      total_amount,
      payment_status,
      payment_method,
      order_status,
      created_at,
      completed_at,
      tables!inner(table_number)
    `
    : `
      id,
      order_number,
      total_amount,
      payment_status,
      payment_method,
      order_status,
      created_at,
      completed_at,
      tables(table_number)
    `;

  let query = supabaseAdmin
    .from("orders")
    .select(selectStr, { count: "exact" })
    .order("created_at", { ascending: false });

  if (q) query = query.ilike("order_number", `%${q}%`);
  if (paymentStatus) query = query.eq("payment_status", paymentStatus);
  if (orderStatus) query = query.eq("order_status", orderStatus);
  if (paymentMethod) query = query.eq("payment_method", paymentMethod);

  if (useTableFilter) {
    query = query.eq("tables.table_number", Number(tableStr));
  }

  if (from) query = query.gte("created_at", `${from}T00:00:00.000Z`);
  if (to) query = query.lte("created_at", `${to}T23:59:59.999Z`);

  const { data, error, count } = await query.range(fromIndex, toIndex);

  if (error) return jsonNoStore({ message: error.message }, { status: 500 });

  const rows = (data ?? []) as Row[];

  const items = rows.map((r) => ({
    ...r,
    tables: pickTable(r.tables),
  }));

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return jsonNoStore({
    items,
    page,
    pageSize,
    total,
    totalPages,
  });
}
