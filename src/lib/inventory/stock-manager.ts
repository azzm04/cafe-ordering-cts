import { supabaseAdmin } from "@/lib/supabase/admin";

type RecipeRow = {
  ingredient_id: string;
  quantity_needed: number; // per porsi
};

type OrderItemRow = {
  menu_item_id: string;
  quantity: number; // qty menu
};

function assertPositive(n: number, msg: string) {
  if (!Number.isFinite(n) || n <= 0) throw new Error(msg);
}

export async function deductStockForOrder(orderId: string) {
  // 1) ambil order items
  const { data: items, error: itemsErr } = await supabaseAdmin
    .from("order_items")
    .select("menu_item_id, quantity")
    .eq("order_id", orderId)
    .returns<OrderItemRow[]>();

  if (itemsErr) throw new Error(itemsErr.message);
  if (!items || items.length === 0) return;

  // 2) group kebutuhan ingredient: ingredient_id -> totalQtyNeeded
  const neededMap = new Map<string, number>();

  for (const it of items) {
    assertPositive(it.quantity, "Invalid order item quantity");

    const { data: recipe, error: recipeErr } = await supabaseAdmin
      .from("menu_recipes")
      .select("ingredient_id, quantity_needed")
      .eq("menu_item_id", it.menu_item_id)
      .returns<RecipeRow[]>();

    if (recipeErr) throw new Error(recipeErr.message);

    // kalau menu belum punya resep => untuk MVP: skip (atau throw)
    if (!recipe || recipe.length === 0) continue;

    for (const r of recipe) {
      assertPositive(r.quantity_needed, "Invalid recipe quantity_needed");

      const totalNeed = r.quantity_needed * it.quantity;
      neededMap.set(r.ingredient_id, (neededMap.get(r.ingredient_id) ?? 0) + totalNeed);
    }
  }

  if (neededMap.size === 0) return;

  // 3) lakukan pengurangan stok satu-satu + catat stock_movements
  // MVP: lakukan serial (paling aman dulu)
  for (const [ingredientId, qtyNeed] of neededMap.entries()) {
    const { data: ing, error: ingErr } = await supabaseAdmin
      .from("ingredients")
      .select("id, current_stock")
      .eq("id", ingredientId)
      .single<{ id: string; current_stock: number }>();

    if (ingErr || !ing) throw new Error(ingErr?.message ?? "Ingredient not found");

    const before = Number(ing.current_stock);
    const after = before - qtyNeed;

    // kalau mau strict: tolak kalau kurang
    if (after < 0) {
      throw new Error(`Stock tidak cukup untuk ingredient_id=${ingredientId}. Stock=${before}, butuh=${qtyNeed}`);
    }

    // update stok
    const { error: updErr } = await supabaseAdmin
      .from("ingredients")
      .update({ current_stock: after })
      .eq("id", ingredientId);

    if (updErr) throw new Error(updErr.message);

    // catat movement
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
  }
}
