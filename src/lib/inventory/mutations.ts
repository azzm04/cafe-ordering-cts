import { supabaseAdmin } from "@/lib/supabase/admin";
import { IngredientRow, OrderItemRow, RecipeRow } from "./types";
import { assertPositive, toNumber } from "./utils";
import { updateMenuAvailabilityForIngredient } from "./availability"; // Import dari file availability

export async function deductStockForOrder(orderId: string) {
  const { data: items, error: itemsErr } = await supabaseAdmin
    .from("order_items")
    .select("menu_item_id, quantity")
    .eq("order_id", orderId)
    .returns<OrderItemRow[]>();

  if (itemsErr) throw new Error(itemsErr.message);
  if (!items || items.length === 0) return;

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
    if (!recipe || recipe.length === 0) {
      console.warn(`[stock] skip deduction: menu_item_id=${it.menu_item_id} belum punya resep`);
      continue;
    }

    for (const r of recipe) {
      const qtyNeedPerPortion = toNumber(r.quantity_needed);
      assertPositive(qtyNeedPerPortion, "Invalid recipe quantity_needed");
      const totalNeed = qtyNeedPerPortion * qtyMenu;
      neededMap.set(r.ingredient_id, (neededMap.get(r.ingredient_id) ?? 0) + totalNeed);
    }
  }

  if (neededMap.size === 0) return;

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
      throw new Error(`Stock tidak cukup untuk ingredient_id=${ingredientId}. Stock=${before}, butuh=${qtyNeed}`);
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
      reference_id: orderId,
    });

    if (mvErr) throw new Error(mvErr.message);

    try {
      // Panggil fungsi yang sudah dipisah tadi
      await updateMenuAvailabilityForIngredient(ingredientId);
    } catch (err: unknown) {
      console.error("updateMenuAvailabilityForIngredient failed", err);
    }
  }
}