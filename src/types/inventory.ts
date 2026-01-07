// src/types/inventory.ts
export type IngredientRow = {
  id: string;
  name: string;
  unit: string;
  current_stock: number;
  min_stock: number;
};

export type MenuRecipeRow = {
  id: string;
  menu_item_id: string;
  ingredient_id: string;
  quantity_needed: number;
  ingredients: IngredientRow | null; // ✅ object, bukan array
};

export type MenuItemRow = {
  id: string;
  name: string;
  price: number;
  is_available: boolean;
  is_archived: boolean;
};
