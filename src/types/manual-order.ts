export type TableStatus = "available" | "occupied" | "reserved";

export interface Table {
  id: string;
  table_number: number;
  status: TableStatus;
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
  max_portions?: number | null; // Optional karena data dari DB bisa null
  created_at?: string;
}

// CartItem mewarisi semua properti MenuItem ditambah quantity dan notes
export interface CartItem extends MenuItem {
  quantity: number;
  notes?: string;
}

// Tipe data untuk payload saat submit ke API (optional, tapi good practice)
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