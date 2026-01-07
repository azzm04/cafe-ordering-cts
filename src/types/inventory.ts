// src/types/inventory.ts

export type StockStatus = "out_of_stock" | "low_stock" | "normal";

export type Ingredient = {
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

export type IngredientSummary = {
  id: string;
  name: string;
  unit: string;
  current_stock: number;
  min_stock: number;
  stock_status: StockStatus;
  used_in_menu_count: number;
  active_alerts: number;
};

export type ApiErrorResponse = {
  message: string;
};

// ✅ ini yang kamu butuhkan untuk edit page
export type GetIngredientResponse = {
  ingredient: Ingredient;
};

// opsional, kalau kamu pakai untuk list
export type GetIngredientsResponse = {
  items: IngredientSummary[];
};
