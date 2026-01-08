// src/lib/inventory/stock-manager.ts
import { supabaseAdmin } from "@/lib/supabase/admin";

type DbNumeric = number | string;

type RecipeRow = {
  ingredient_id: string;
  quantity_needed: DbNumeric; // numeric -> ini bisa aja string
};

type OrderItemRow = {
  menu_item_id: string;
  quantity: DbNumeric; // int4 -> biasanya tipenya number, tapi amanin
};

type IngredientRow = {
  id: string;
  current_stock: DbNumeric; // numeric -> bisa string
};

function toNumber(v: DbNumeric): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) throw new Error(`Invalid numeric value: ${String(v)}`);
  return n;
}

function assertPositive(n: number, msg: string) {
  if (!Number.isFinite(n) || n <= 0) throw new Error(msg);
}

export async function deductStockForOrder(orderId: string) {
  //  ambil order items
  const { data: items, error: itemsErr } = await supabaseAdmin
    .from("order_items")
    .select("menu_item_id, quantity")
    .eq("order_id", orderId)
    .returns<OrderItemRow[]>();

  if (itemsErr) throw new Error(itemsErr.message);
  if (!items || items.length === 0) return;

  // akumulasi kebutuhan ingredient: ingredient_id -> totalQtyNeeded
  const neededMap = new Map<string, number>();

  for (const it of items) {
    const qtyMenu = toNumber(it.quantity);
    assertPositive(qtyMenu, "Invalid order item quantity");

    const { data: recipe, error: recipeErr } = await supabaseAdmin
      .from("menu_recipes")
      .select("ingredient_id, quantity_needed")
      .eq("menu_item_id", it.menu_item_id)
      .returns<RecipeRow[]>();

    if (recipeErr) throw new Error(recipeErr.message);

    // kalau belum ada resep -> skip aja mennn
    if (!recipe || recipe.length === 0) {
      // log supaya tau menu mana yg belum ada resepnya
      console.warn(`[stock] skip deduction: menu_item_id=${it.menu_item_id} belum punya resep`);
      continue;
    }

    for (const r of recipe) {
      const qtyNeedPerPortion = toNumber(r.quantity_needed);
      // kalau ada resep tapi qty 0 / invalid => error, biar resepnya dibenerin
      assertPositive(qtyNeedPerPortion, "Invalid recipe quantity_needed");

      const totalNeed = qtyNeedPerPortion * qtyMenu;
      neededMap.set(r.ingredient_id, (neededMap.get(r.ingredient_id) ?? 0) + totalNeed);
    }
  }

  // kalau semua item ternyata skip (tidak ada resep), berarti tidak ada yang perlu dipotong
  if (neededMap.size === 0) return;

  // kurangi stok + catat stock_movements
  for (const [ingredientId, qtyNeed] of neededMap.entries()) {
    const { data: ing, error: ingErr } = await supabaseAdmin
      .from("ingredients")
      .select("id, current_stock")
      .eq("id", ingredientId)
      .single<IngredientRow>();

    if (ingErr || !ing) throw new Error(ingErr?.message ?? "Ingredient not found");

    const before = toNumber(ing.current_stock);
    const after = before - qtyNeed;

    if (after < 0) {
      throw new Error(
        `Stock tidak cukup untuk ingredient_id=${ingredientId}. Stock=${before}, butuh=${qtyNeed}`
      );
    }

    const { error: updErr } = await supabaseAdmin
      .from("ingredients")
      .update({ current_stock: after })
      .eq("id", ingredientId);

    if (updErr) throw new Error(updErr.message);

    const { error: mvErr } = await supabaseAdmin.from("stock_movements").insert({
      ingredient_id: ingredientId,
      type: "out",
      quantity: qtyNeed,
      stock_before: before,
      stock_after: after,
      reason: "order_deduction",
      reference_id: orderId, // INGET COY INI UUID order.id
    });

    if (mvErr) throw new Error(mvErr.message);
  }
}
