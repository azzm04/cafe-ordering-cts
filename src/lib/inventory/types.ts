export type DbNumeric = number | string;

export type RecipeRow = {
  ingredient_id: string;
  quantity_needed: DbNumeric;
};

export type OrderItemRow = {
  menu_item_id: string;
  quantity: DbNumeric;
};

export type IngredientRow = {
  id: string;
  current_stock: DbNumeric;
};

export type CartRecipeRow = {
  menu_item_id: string;
  ingredient_id: string;
  quantity_needed: DbNumeric;
};

export type CartIngredientRow = {
  id: string;
  current_stock: DbNumeric;
};

export type RecipeWithIngredientRow = {
  menu_item_id: string;
  quantity_needed: DbNumeric;
  ingredients: {
    id: string;
    current_stock: DbNumeric;
  } | null;
};

export type CartItem = { menu_item_id: string; quantity: number };