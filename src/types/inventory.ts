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

export type GetIngredientResponse = {
  ingredient: Ingredient;
};

export type GetIngredientsResponse = {
  items: IngredientSummary[];
};


export type IngredientRow = {
  id: string;
  name: string;
  unit: string;
  current_stock: number | string;
  min_stock: number | string;
};

export type MenuItemRow = {
  id: string;
  name: string;
  price: number;
  is_available: boolean;
  is_archived: boolean;
};

export type MenuRecipeRow = {
  id: string;
  menu_item_id: string;
  ingredient_id: string;
  quantity_needed: number;
  ingredients?: IngredientRow | null;
};
