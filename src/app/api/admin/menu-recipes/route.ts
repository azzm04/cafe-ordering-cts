// src/app/api/admin/menu-recipes/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireOwner } from "@/lib/admin-auth-server";

type IngredientRow = {
  id: string;
  name: string;
  unit: string;
  current_stock: number;
  min_stock: number;
};

type MenuRecipeRow = {
  id: string;
  menu_item_id: string;
  ingredient_id: string;
  quantity_needed: number;
  ingredients: IngredientRow[];
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

function asNumber(x: unknown): number | null {
  if (typeof x === "number" && Number.isFinite(x)) return x;
  if (typeof x === "string" && x.trim() !== "") {
    const n = Number(x);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

export async function GET(req: Request) {
  const guard = await requireOwner();
  if (guard instanceof NextResponse) return guard;

  const { searchParams } = new URL(req.url);
  const menuItemId = (searchParams.get("menuItemId") ?? "").trim();
  if (!menuItemId) return jsonNoStore({ message: "menuItemId required" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("menu_recipes")
    .select(
      `
      id,
      menu_item_id,
      ingredient_id,
      quantity_needed,
      ingredients:ingredient_id (
        id,
        name,
        unit,
        current_stock,
        min_stock
      )
    `
    )
    .eq("menu_item_id", menuItemId)
    .order("created_at", { ascending: true });

  if (error) return jsonNoStore({ message: error.message }, { status: 500 });

  return jsonNoStore({ recipes: (data ?? []) as MenuRecipeRow[] });
}

type UpsertBody = {
  menuItemId: string;
  ingredientId: string;
  quantityNeeded: number; // per porsi
};

export async function POST(req: Request) {
  const guard = await requireOwner();
  if (guard instanceof NextResponse) return guard;

  const body = (await req.json()) as Partial<UpsertBody>;

  const menuItemId = (body.menuItemId ?? "").trim();
  const ingredientId = (body.ingredientId ?? "").trim();
  const quantityNeeded = asNumber(body.quantityNeeded);

  if (!menuItemId || !ingredientId || quantityNeeded === null) {
    return jsonNoStore(
      { message: "menuItemId, ingredientId, quantityNeeded required" },
      { status: 400 }
    );
  }

  if (quantityNeeded <= 0) {
    return jsonNoStore({ message: "quantityNeeded must be > 0" }, { status: 400 });
  }

  // upsert by unique(menu_item_id, ingredient_id)
  const { error } = await supabaseAdmin
    .from("menu_recipes")
    .upsert(
      {
        menu_item_id: menuItemId,
        ingredient_id: ingredientId,
        quantity_needed: quantityNeeded,
      },
      { onConflict: "menu_item_id,ingredient_id" }
    );

  if (error) return jsonNoStore({ message: error.message }, { status: 500 });

  return jsonNoStore({ ok: true });
}

type DeleteBody = {
  menuItemId: string;
  ingredientId: string;
};

export async function DELETE(req: Request) {
  const guard = await requireOwner();
  if (guard instanceof NextResponse) return guard;

  const body = (await req.json()) as Partial<DeleteBody>;
  const menuItemId = (body.menuItemId ?? "").trim();
  const ingredientId = (body.ingredientId ?? "").trim();

  if (!menuItemId || !ingredientId) {
    return jsonNoStore({ message: "menuItemId & ingredientId required" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("menu_recipes")
    .delete()
    .eq("menu_item_id", menuItemId)
    .eq("ingredient_id", ingredientId);

  if (error) return jsonNoStore({ message: error.message }, { status: 500 });

  return jsonNoStore({ ok: true });
}
