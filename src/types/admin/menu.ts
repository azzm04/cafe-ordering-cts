export type AdminRole = "kasir" | "owner";

export type Category = { id: string; name: string };

export type MenuItemRow = {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  created_at: string;
  categories?: { name: string } | null;
};

export type MeResponse = { role: AdminRole };
