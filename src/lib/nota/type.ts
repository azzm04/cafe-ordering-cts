export type PaymentStatus = "pending" | "paid" | "failed" | "expired";
export type FulfillmentStatus = "received" | "preparing" | "served" | "completed";

export type OrderWithTable = {
  id: string;
  order_number: string;
  total_amount: number;
  payment_status: PaymentStatus;
  payment_method: string | null;
  fulfillment_status: FulfillmentStatus;
  created_at: string;
  completed_at: string | null;
  tables?: { table_number: number } | null;
  original_amount?: number;
  discount_amount?: number;
  voucher_code?: string | null;
};

export type OrderItemWithMenu = {
  id: string;
  menu_item_id: string;
  quantity: number;
  price: number;
  subtotal: number;
  notes: string | null;
  menu_items: { name: string } | null;
};

export type NotaData = {
  order: OrderWithTable;
  items: OrderItemWithMenu[];
};
