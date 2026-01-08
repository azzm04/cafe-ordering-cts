export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth-server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { updateMenuAvailabilityForIngredient } from "@/lib/inventory/stock-manager";

type IngredientRow = {
  id: string;
  current_stock: number;
};

type Body = {
  ingredientId: string;
  quantity: number;      // + untuk restock, boleh juga negatif untuk koreksi (MVP)
  reason?: string | null; // restock harian, pembelian, koreksi, dll
  referenceId?: string | null;
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

export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const body = (await req.json()) as Body;
  const ingredientId = (body?.ingredientId ?? "").trim();
  const qty = Number(body?.quantity ?? 0);

  if (!ingredientId) return jsonNoStore({ message: "ingredientId required" }, { status: 400 });
  if (!Number.isFinite(qty) || qty === 0) return jsonNoStore({ message: "quantity must be non-zero number" }, { status: 400 });

  // 1) read current stock
  const { data: ing, error: gErr } = await supabaseAdmin
    .from("ingredients")
    .select("id, current_stock")
    .eq("id", ingredientId)
    .single<IngredientRow>();

  if (gErr || !ing) return jsonNoStore({ message: gErr?.message ?? "Ingredient not found" }, { status: 404 });

  const before = Number(ing.current_stock ?? 0);
  const after = before + qty;

  // optional guard: no negative stock
  if (after < 0) return jsonNoStore({ message: "Stock cannot go below 0" }, { status: 400 });

  // 2) update stock
  const { error: uErr } = await supabaseAdmin
    .from("ingredients")
    .update({ current_stock: after })
    .eq("id", ingredientId);

  if (uErr) return jsonNoStore({ message: uErr.message }, { status: 500 });

  // 3) insert movement
  const movementType = qty > 0 ? "in" : "out";
  const { error: mErr } = await supabaseAdmin.from("stock_movements").insert({
    ingredient_id: ingredientId,
    type: movementType,
    quantity: Math.abs(qty),
    stock_before: before,
    stock_after: after,
    reason: body?.reason ?? "restock",
    reference_id: body?.referenceId ?? null,
    created_by: null, 
  });

  if (mErr) {
    // MVP: log dulu, nanti bisa dibuat RPC agar atomic
    console.error("movement insert failed:", mErr);
  }

  // After restock/adjustment, refresh availability of menus that depend on this ingredient
  try {
    await updateMenuAvailabilityForIngredient(ingredientId);
  } catch (err: unknown) {
    console.error("post-restock updateMenuAvailabilityForIngredient failed", err);
  }

  return jsonNoStore({ ok: true, stock_before: before, stock_after: after });
}
