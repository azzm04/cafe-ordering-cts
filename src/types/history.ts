export type PaymentStatus = "pending" | "paid" | "failed" | "expired";
export type OrderStatus = "received" | "served" | "completed";
export type PaymentMethod = "cash" | "qris";

export type HistoryOrderRow = {
  id: string;
  order_number: string;
  created_at: string;
  completed_at: string | null;
  total_amount: number;
  payment_method: PaymentMethod | null;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  tables: { table_number: number } | null;
};

export type HistoryResponse = {
  items: HistoryOrderRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages?: number;
  message?: string;
};

export type HistoryFilters = {
  q: string;
  table: string;
  paymentStatus: "all" | PaymentStatus;
  orderStatus: "all" | OrderStatus;
  paymentMethod: "all" | PaymentMethod;
  from: string;
  to: string;
  page: number;
  pageSize: number;
};