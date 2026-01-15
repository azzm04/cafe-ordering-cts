export type MenuItemRow = {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  created_at: string;
  variant_group: string | null;
  max_portions?: number | null;
};

export const CATEGORY = {
  makanan: "f3274eb8-d206-4591-a1f5-855981748ee0",
  minuman: "e045633e-b497-4169-9cc3-69aca2a42f31",
} as const;

export type TabKey = keyof typeof CATEGORY;

export function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}
