export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth-server";
import { supabaseAdmin } from "@/lib/supabase/admin";

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

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const { id } = await ctx.params;

  const { data, error } = await supabaseAdmin
    .from("ingredients")
    .select(
      "id, name, unit, current_stock, min_stock, cost_per_unit, notes, created_at, updated_at"
    )
    .eq("id", id)
    .single<IngredientRow>();

  if (error || !data) {
    return jsonNoStore(
      { message: error?.message ?? "Ingredient not found" },
      { status: 404 }
    );
  }

  return jsonNoStore({ ingredient: data });
}

type PatchBody = {
  name?: string;
  unit?: string;
  min_stock?: number;
  cost_per_unit?: number | null;
  notes?: string | null;
};

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const { id } = await ctx.params;
  const body = (await req.json()) as PatchBody;

  const payload: PatchBody = {};
  if (typeof body.name === "string") payload.name = body.name.trim();
  if (typeof body.unit === "string") payload.unit = body.unit.trim();
  if (typeof body.min_stock === "number") payload.min_stock = body.min_stock;
  if (typeof body.cost_per_unit === "number" || body.cost_per_unit === null)
    payload.cost_per_unit = body.cost_per_unit;
  if (typeof body.notes === "string" || body.notes === null) payload.notes = body.notes;

  const { data, error } = await supabaseAdmin
    .from("ingredients")
    .update(payload)
    .eq("id", id)
    .select(
      "id, name, unit, current_stock, min_stock, cost_per_unit, notes, created_at, updated_at"
    )
    .single<IngredientRow>();

  if (error || !data) {
    return jsonNoStore({ message: error?.message ?? "Failed update" }, { status: 500 });
  }

  return jsonNoStore({ ingredient: data });
}
