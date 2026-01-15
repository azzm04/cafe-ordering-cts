import { supabaseAdmin } from "@/lib/supabase/admin";
import { 
  CartIngredientRow, CartRecipeRow, CartItem, IngredientRow, 
  RecipeRow, RecipeWithIngredientRow 
} from "./types";
import { toNumber, toNumberSafe } from "./utils";

// --- LOGIKA UPDATE STATUS MENU (Sync Availability) ---
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
        const { error: updErr2 } = await supabaseAdmin
          .from("menu_items")
          .update({ is_available: false })
          .eq("id", menuId);
        if (updErr2) console.error("Failed mark unavailable", menuId, updErr2);
        continue;
      }

      const ingIds = recipe.map((r) => r.ingredient_id);
      const { data: ings, error: ingsErr } = await supabaseAdmin
        .from("ingredients")
        .select("id, current_stock")
        .in("id", ingIds)
        .returns<IngredientRow[]>();

      if (ingsErr) {
        console.error("Failed load ingredients", menuId, ingsErr);
        continue;
      }

      const stockMap = new Map(ings.map((i) => [i.id, toNumber(i.current_stock)]));
      let available = true;

      for (const r of recipe) {
        const need = toNumber(r.quantity_needed);
        const stock = stockMap.get(r.ingredient_id) ?? 0;
        if (stock < need) {
          available = false;
          break;
        }
      }

      const { data: mi, error: miErr } = await supabaseAdmin
        .from("menu_items")
        .select("id, is_available")
        .eq("id", menuId)
        .single<{ id: string; is_available: boolean }>();

      if (miErr || !mi) continue;

      if (mi.is_available !== available) {
        await supabaseAdmin
          .from("menu_items")
          .update({ is_available: available })
          .eq("id", menuId);
          
        console.log(`menu_items(${menuId}) is_available -> ${available}`);
      }
    }
  } catch (err: unknown) {
    console.error("updateMenuAvailabilityForIngredient: unexpected error", err);
  }
}

// --- LOGIKA HITUNG MAX PORSI (UI Display) ---
export async function computeMaxPortionsForMenus(
  menuIds: string[]
): Promise<Map<string, number | null>> {
  const result = new Map<string, number | null>();
  if (!menuIds || menuIds.length === 0) return result;

  const { data: recipes, error } = await supabaseAdmin
    .from("menu_recipes")
    .select("menu_item_id, quantity_needed, ingredients:ingredient_id (id, current_stock)")
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
      result.set(id, null);
      continue;
    }

    let minPortions = Number.POSITIVE_INFINITY;
    let invalid = false;

    for (const r of recs) {
      if (!r.ingredients) { invalid = true; break; }
      const need = toNumberSafe(r.quantity_needed);
      const stock = toNumberSafe(r.ingredients.current_stock);

      if (!Number.isFinite(need) || need <= 0 || !Number.isFinite(stock)) {
        invalid = true; break;
      }
      const portions = Math.floor(stock / need);
      if (portions < minPortions) minPortions = portions;
    }

    if (invalid || !Number.isFinite(minPortions)) result.set(id, 0);
    else result.set(id, Math.max(0, minPortions));
  }
  return result;
}

// --- LOGIKA CEK CART (Validasi sebelum bayar) ---
export async function checkCartAvailability(
  items: CartItem[]
): Promise<{
  ok: boolean;
  shortages: Array<{ ingredient_id: string; needed: number; available: number }>;
  perMenuAllowed: Record<string, { allowed_additional: number; max_total: number }>;
}> {
  const qtyMap = new Map<string, number>();
  for (const it of items) qtyMap.set(it.menu_item_id, (qtyMap.get(it.menu_item_id) ?? 0) + Number(it.quantity));

  const menuIds = [...new Set(items.map((i) => i.menu_item_id))];

  const { data: recipes, error: recErr } = await supabaseAdmin
    .from("menu_recipes")
    .select("menu_item_id, ingredient_id, quantity_needed")
    .in("menu_item_id", menuIds)
    .returns<CartRecipeRow[]>();

  if (recErr) return { ok: true, shortages: [], perMenuAllowed: {} };

  const ingIds = Array.from(new Set((recipes ?? []).map((r) => r.ingredient_id)));
  const { data: ings, error: ingErr } = await supabaseAdmin
    .from("ingredients")
    .select("id, current_stock")
    .in("id", ingIds)
    .returns<CartIngredientRow[]>();

  if (ingErr) return { ok: true, shortages: [], perMenuAllowed: {} };

  const stockMap = new Map(ings?.map((i) => [i.id, toNumberSafe(i.current_stock ?? 0)]));
  const neededMap = new Map<string, number>();

  for (const r of recipes ?? []) {
    const qtyMenu = qtyMap.get(r.menu_item_id) ?? 0;
    const needPerPortion = toNumberSafe(r.quantity_needed);
    if (!Number.isFinite(needPerPortion) || needPerPortion <= 0) continue;
    neededMap.set(r.ingredient_id, (neededMap.get(r.ingredient_id) ?? 0) + (needPerPortion * qtyMenu));
  }

  const shortages: Array<{ ingredient_id: string; needed: number; available: number }> = [];
  for (const [ingId, needed] of neededMap.entries()) {
    const avail = stockMap.get(ingId) ?? 0;
    if (needed > avail) shortages.push({ ingredient_id: ingId, needed, available: avail });
  }

  const perMenuAllowed: Record<string, { allowed_additional: number; max_total: number }> = {};
  // ... (Logic perMenuAllowed sama persis seperti sebelumnya) ...
  // Saya singkat disini agar jawaban tidak terlalu panjang, tapi salin logic perulangan 'for (const menuId of menuIds)' kesini sepenuhnya.
  
  // (Paste logic perMenuAllowed dari kode original disini)
  for (const menuId of menuIds) {
    const recs = (recipes ?? []).filter((r) => r.menu_item_id === menuId);
    const currentQty = qtyMap.get(menuId) ?? 0;
    if (!recs || recs.length === 0) {
      perMenuAllowed[menuId] = { allowed_additional: 0, max_total: currentQty };
      continue;
    }
    let minAdd = Number.POSITIVE_INFINITY;
    for (const r of recs) {
      const need = toNumberSafe(r.quantity_needed);
      if (!Number.isFinite(need) || need <= 0) { minAdd = 0; break; }
      const ingStock = stockMap.get(r.ingredient_id) ?? 0;
      const totalNeededNow = neededMap.get(r.ingredient_id) ?? 0;
      const remaining = ingStock - (totalNeededNow - (need * currentQty));
      const allowedByThis = Math.max(0, Math.floor(remaining / need));
      if (allowedByThis < minAdd) minAdd = allowedByThis;
    }
    if (!Number.isFinite(minAdd) || minAdd === Number.POSITIVE_INFINITY) minAdd = 0;
    perMenuAllowed[menuId] = { allowed_additional: Math.max(0, minAdd), max_total: currentQty + Math.max(0, minAdd) };
  }

  return { ok: shortages.length === 0, shortages, perMenuAllowed };
}