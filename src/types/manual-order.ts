// src/types/manual-order.ts
export type TableStatus = "tersedia" | "terisi" | "dipesan";

export interface Table {
  id: string;
  table_number: number;
  status: TableStatus; // Indonesian: tersedia/terisi/dipesan
}

export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  variant_group: string | null;
  max_portions: number | null; 
  created_at?: string; // Optional for flexibility
}

export interface CartItem extends MenuItem {
  quantity: number;
  notes?: string;
}

export interface ManualOrderPayload {
  table_id: string;
  table_number: number;
  customer_name: string;
  payment_method: "cash" | "midtrans";
  notes: string;
  items: {
    menu_id: string;
    quantity: number;
    price: number;
    notes: string;
  }[];
  is_manual_order: boolean;
}