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

    // Update menu availability for menus that depend on this ingredient (per-portion logic)
    try {
      await updateMenuAvailabilityForIngredient(ingredientId);
    } catch (err: unknown) {
      console.error("updateMenuAvailabilityForIngredient failed", err);
      // don't fail the deduction if availability update fails
    }
  }
}

export async function updateMenuAvailabilityForIngredient(ingredientId: string) {
  try {
    const { data: uses, error: usesErr } = await supabaseAdmin
      .from("menu_recipes")
      .select("menu_item_id")
      .eq("ingredient_id", ingredientId)
      .returns<{ menu_item_id: string }[]>();

    if (usesErr) {
      console.error("updateMenuAvailabilityForIngredient: menu_recipes query failed", usesErr);
      return;
    }
    if (!uses || uses.length === 0) return;

    const menuIds = Array.from(new Set(uses.map((u) => u.menu_item_id)));

    for (const menuId of menuIds) {
      const { data: recipe, error: recipeErr } = await supabaseAdmin
        .from("menu_recipes")
        .select("ingredient_id, quantity_needed")
        .eq("menu_item_id", menuId)
        .returns<RecipeRow[]>();

      if (recipeErr) {
        console.error("updateMenuAvailabilityForIngredient: failed to load recipe", menuId, recipeErr);
        continue;
      }
      if (!recipe || recipe.length === 0) {
        // mark unavailable if no recipe
        const { error: updErr2 } = await supabaseAdmin
          .from("menu_items")
          .update({ is_available: false })
          .eq("id", menuId);
        if (updErr2)
          console.error(
            "updateMenuAvailabilityForIngredient: failed to mark menu unavailable",
            menuId,
            updErr2
          );
        continue;
      }

      const ingIds = recipe.map((r) => r.ingredient_id);
      const { data: ings, error: ingsErr } = await supabaseAdmin
        .from("ingredients")
        .select("id, current_stock")
        .in("id", ingIds)
        .returns<IngredientRow[]>();

      if (ingsErr) {
        console.error("updateMenuAvailabilityForIngredient: failed to load ingredients", menuId, ingsErr);
        continue;
      }

      const stockMap = new Map(ings.map((i) => [i.id, toNumber(i.current_stock)]));

      let available = true;
      let failingIngredient: { id: string; stock: number; need: number } | null = null;
      try {
        for (const r of recipe) {
          const need = toNumber(r.quantity_needed);
          const stock = stockMap.get(r.ingredient_id) ?? 0;
          if (stock < need) {
            available = false;
            failingIngredient = { id: r.ingredient_id, stock, need };
            break;
          }
        }
      } catch (err: unknown) {
        console.error("updateMenuAvailabilityForIngredient: numeric parse error for menu", menuId, err);
        continue;
      }

      const { data: mi, error: miErr } = await supabaseAdmin
        .from("menu_items")
        .select("id, is_available")
        .eq("id", menuId)
        .single<{ id: string; is_available: boolean }>();

      if (miErr || !mi) {
        console.error("updateMenuAvailabilityForIngredient: failed to get menu_item", menuId, miErr);
        continue;
      }

      if (mi.is_available !== available) {
        const { error: updMiErr } = await supabaseAdmin
          .from("menu_items")
          .update({ is_available: available })
          .eq("id", menuId);

        if (updMiErr) {
          console.error("updateMenuAvailabilityForIngredient: failed to update menu availability", menuId, updMiErr);
        } else {
          if (!available && failingIngredient) {
            console.log(
              `menu_items(${menuId}) is_available -> ${available} (failing ingredient: ${failingIngredient.id}, stock=${failingIngredient.stock}, need=${failingIngredient.need})`
            );
          } else {
            console.log(`menu_items(${menuId}) is_available -> ${available}`);
          }
        }
      }
    }
  } catch (err) {
    console.error("updateMenuAvailabilityForIngredient: unexpected error", err);
  }
}

type RecipeWithIngredientRow = {
  menu_item_id: string;
  quantity_needed: number | string; // numeric di DB bisa string
  ingredients: {
    id: string;
    current_stock: number | string; // numeric bisa string
  } | null;
};

function toNumberSafe(v: number | string): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : NaN;
}

export async function computeMaxPortionsForMenus(
  menuIds: string[]
): Promise<Map<string, number | null>> {
  const result = new Map<string, number | null>();
  if (!menuIds || menuIds.length === 0) return result;

  const { data: recipes, error } = await supabaseAdmin
    .from("menu_recipes")
    .select(
      "menu_item_id, quantity_needed, ingredients:ingredient_id (id, current_stock)"
    )
    .in("menu_item_id", menuIds)
    .returns<RecipeWithIngredientRow[]>();

  if (error) {
    console.error("computeMaxPortionsForMenus: failed to load recipes", error);
    for (const id of menuIds) result.set(id, null);
    return result;
  }

  const grouped = new Map<string, RecipeWithIngredientRow[]>();
  for (const r of recipes ?? []) {
    grouped.set(r.menu_item_id, [...(grouped.get(r.menu_item_id) ?? []), r]);
  }

  for (const id of menuIds) {
    const recs = grouped.get(id) ?? [];
    if (recs.length === 0) {
      // menu belum punya resep -> null (policy kamu)
      result.set(id, null);
      continue;
    }

    let minPortions = Number.POSITIVE_INFINITY;
    let invalid = false;

    for (const r of recs) {
      // join ingredient bisa null
      if (!r.ingredients) {
        invalid = true;
        break;
      }

      const need = toNumberSafe(r.quantity_needed);
      const stock = toNumberSafe(r.ingredients.current_stock);

      if (!Number.isFinite(need) || need <= 0) {
        invalid = true;
        break;
      }
      if (!Number.isFinite(stock)) {
        invalid = true;
        break;
      }

      const portions = Math.floor(stock / need);
      if (portions < minPortions) minPortions = portions;
    }

    if (invalid || !Number.isFinite(minPortions)) result.set(id, 0);
    else result.set(id, Math.max(0, minPortions));
  }

  return result;
}
