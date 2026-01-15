export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/admin-auth-server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type AlertType = "low_stock" | "out_of_stock";

type IngredientRow = {
  id: string;
  name: string;
  unit: string;
  current_stock: number | string;
  min_stock: number | string;
};

type AlertRow = {
  id: string;
  ingredient_id: string;
  alert_type: AlertType;
  status: "active" | "resolved";
  message: string | null;
  created_at: string;
  ingredient: IngredientRow | null;
};

type AlertItem = {
  id: string;
  alert_type: AlertType;
  created_at: string;
  message: string | null;
  ingredient: {
    id: string;
    name: string;
    unit: string;
    current_stock: number;
    min_stock: number;
  };
};

function toNumber(v: number | string): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
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

export async function GET() {
  const guard = await requireOwner();
  if (guard instanceof NextResponse) return guard;

  const { data, error } = await supabaseAdmin
    .from("stock_alerts")
    .select(
      `
      id,
      ingredient_id,
      alert_type,
      status,
      message,
      created_at,
      ingredient:ingredients!stock_alerts_ingredient_id_fkey (
        id,
        name,
        unit,
        current_stock,
        min_stock
      )
    `
    )
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .returns<AlertRow[]>();

  if (error) return jsonNoStore({ message: error.message }, { status: 500 });

  const rows = data ?? [];

  const items: AlertItem[] = rows
    .filter((r) => r.ingredient !== null)
    .map((r) => {
      const ing = r.ingredient!;
      return {
        id: r.id,
        alert_type: r.alert_type,
        created_at: r.created_at,
        message: r.message,
        ingredient: {
          id: ing.id,
          name: ing.name,
          unit: ing.unit,
          current_stock: toNumber(ing.current_stock),
          min_stock: toNumber(ing.min_stock),
        },
      };
    });

  // --- Menu-level alerts: identify menu items that are affected by low/out ingredient stock
  type MenuRecipeRow = {
    quantity_needed: number | string;
    ingredient: IngredientRow | null;
  };

  type MenuRow = {
    id: string;
    name: string;
    menu_recipes: MenuRecipeRow[] | null;
  };

  type MenuIngredient = {
    id: string;
    name: string;
    unit: string;
    current_stock: number;
    min_stock: number;
  };

  type MenuAlert = {
    id: string;
    name: string;
    status: AlertType; // low_stock | out_of_stock
    ingredients: MenuIngredient[];
  };

  const { data: menuRows, error: menuErr } = await supabaseAdmin
    .from("menu_items")
    .select(`
      id,
      name,
      menu_recipes (
        quantity_needed,
        ingredient:ingredients (
          id, name, unit, current_stock, min_stock
        )
      )
    `)
    .order("name", { ascending: true })
    .returns<MenuRow[]>();

  if (menuErr) return jsonNoStore({ message: menuErr.message }, { status: 500 });

  const menuAlerts: MenuAlert[] = (menuRows ?? [])
    .map((m) => {
      const recipes = m.menu_recipes ?? [];

      const ingList: MenuIngredient[] = recipes
        .map((r) => r.ingredient)
        .filter((ing): ing is IngredientRow => ing !== null)
        .map((ing) => ({
          id: ing.id,
          name: ing.name,
          unit: ing.unit,
          current_stock: toNumber(ing.current_stock),
          min_stock: toNumber(ing.min_stock),
        }));

      if (ingList.length === 0) return null;

      // If any ingredient is out_of_stock => menu is out_of_stock.
      const anyOut = ingList.some((i) => i.current_stock <= 0);
      const anyLow = ingList.some((i) => i.current_stock > 0 && i.current_stock <= i.min_stock);

      if (!anyOut && !anyLow) return null;

      return {
        id: m.id,
        name: m.name,
        status: anyOut ? "out_of_stock" : "low_stock",
        ingredients: ingList,
      };
    })
    .filter((x): x is MenuAlert => x !== null);

  return jsonNoStore({ count: items.length + menuAlerts.length, items, menuAlerts });
}
