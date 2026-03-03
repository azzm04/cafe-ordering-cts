export interface Category {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  is_available: boolean;
  created_at: string;
  variant_group?: string | null; 
}

export interface Table {
  id: string;
  table_number: number;
  status: "tersedia" | "terisi" | "dipesan"; 
  created_at: string;
}

export interface Order {
  id: string;
  table_id: string;
  order_number: string;
  total_amount: number;
  payment_status: "pending" | "paid" | "failed" | "expired";
  payment_method?: string;
  midtrans_order_id?: string;
  midtrans_transaction_id?: string;
  order_status: "received" | "served" | "completed";
  created_at: string;
  completed_at?: string;
}


export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  price: number;
  subtotal: number;
  notes?: string;
}


