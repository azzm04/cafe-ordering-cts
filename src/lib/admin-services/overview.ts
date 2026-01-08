export type TableRow = {
  id: string;
  table_number: number;
  status: "available" | "occupied" | "reserved";
};

export type FulfillmentStatus = "received" | "preparing" | "served" | "completed";
export type PaymentStatus = "pending" | "paid" | "failed" | "expired";

export type ActiveOrder = {
  id: string;
  order_number: string;
  total_amount: number;
  payment_status: PaymentStatus;
  payment_method: string | null;
  fulfillment_status: FulfillmentStatus;
  created_at: string;
  completed_at: string | null;
  table_id: string;
  tables?: { table_number: number } | null;
};

export type OverviewResponse = {
  tables: TableRow[];
  activeOrders: ActiveOrder[];
};

function safeMessage(json: unknown, fallback: string) {
  if (typeof json === "object" && json !== null && "message" in json) {
    return String((json as Record<string, unknown>).message);
  }
  return fallback;
}

export async function fetchAdminOverview(): Promise<OverviewResponse> {
  const res = await fetch(`/api/admin/overview?t=${Date.now()}`, { cache: "no-store" });
  const json = (await res.json()) as unknown;

  if (!res.ok) throw new Error(safeMessage(json, "Gagal load dashboard"));

  const data = json as OverviewResponse;
  return {
    tables: data.tables ?? [],
    activeOrders: data.activeOrders ?? [],
  };
}
