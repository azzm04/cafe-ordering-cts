export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAdmin, requireOwner } from "@/lib/admin-auth-server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type StockStatus = "out_of_stock" | "low_stock" | "normal";

type StockSummaryRow = {
  id: string;
  name: string;
  unit: string;
  current_stock: number;
  min_stock: number;
  stock_status: StockStatus;
  used_in_menu_count: number;
  active_alerts: number;
};

type IngredientRow = {
  id: string;
  name: string;
  unit: string;
  current_stock: number;
  min_stock: number;
  cost_per_unit: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

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
  const status = (searchParams.get("status") ?? "").trim(); // out_of_stock|low_stock|normal

  let query = supabaseAdmin
    .from("v_stock_summary")
    .select("id, name, unit, current_stock, min_stock, stock_status, used_in_menu_count, active_alerts")
    .order("name", { ascending: true });

  if (q) query = query.ilike("name", `%${q}%`);
  if (status === "out_of_stock" || status === "low_stock" || status === "normal") {
    query = query.eq("stock_status", status);
  }

  const { data, error } = await query;
  if (error) return jsonNoStore({ message: error.message }, { status: 500 });

  return jsonNoStore({ items: (data ?? []) as StockSummaryRow[] });
}

type CreateBody = {
  name: string;
  unit: string;
  initial_stock?: number;
  min_stock?: number;
  cost_per_unit?: number;
  notes?: string | null;
};

export async function POST(req: Request) {
  // owner only (create ingredient)
  const guard = await requireOwner();
  if (guard instanceof NextResponse) return guard;

  const body = (await req.json()) as CreateBody;

  const name = (body?.name ?? "").trim();
  const unit = (body?.unit ?? "").trim();
  const initial_stock = Number(body?.initial_stock ?? 0);
  const min_stock = Number(body?.min_stock ?? 0);
  const cost_per_unit = body?.cost_per_unit == null ? null : Number(body.cost_per_unit);
  const notes = body?.notes ?? null;

  if (!name || !unit) {
    return jsonNoStore({ message: "name & unit required" }, { status: 400 });
  }

  // create ingredient
  const { data: ing, error: insErr } = await supabaseAdmin
    .from("ingredients")
    .insert({
      name,
      unit,
      current_stock: initial_stock,
      min_stock,
      cost_per_unit,
      notes,
    })
    .select("*")
    .single<IngredientRow>();

  if (insErr || !ing) return jsonNoStore({ message: insErr?.message ?? "Failed insert" }, { status: 500 });

  // create initial movement (optional, but recommended)
  if (initial_stock > 0) {
    const { error: mvErr } = await supabaseAdmin.from("stock_movements").insert({
      ingredient_id: ing.id,
      type: "in",
      quantity: initial_stock,
      stock_before: 0,
      stock_after: initial_stock,
      reason: "initial_stock",
      reference_id: null,
      created_by: null,
    });
    if (mvErr) {
      // tidak fatal untuk MVP
      console.error("stock_movements insert failed:", mvErr);
    }
  }

  return jsonNoStore({ ok: true, ingredient: ing });
}
