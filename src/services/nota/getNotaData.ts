import { supabaseServer } from "@/lib/supabase/server";
import type { NotaData, OrderItemWithMenu, OrderWithTable } from "@/lib/nota/type";

export async function getNotaData(orderNumber: string): Promise<NotaData | null> {
  const { data: order, error: orderErr } = await supabaseServer
    .from("orders")
    .select(
      "id, order_number, total_amount, payment_status, payment_method, fulfillment_status, created_at, completed_at, tables(table_number)"
    )
    .eq("order_number", orderNumber)
    .single<OrderWithTable>();

  if (orderErr || !order) return null;

  const { data: items } = await supabaseServer
    .from("order_items")
    .select("id, menu_item_id, quantity, price, subtotal, notes, menu_items(name)")
    .eq("order_id", order.id)
    .returns<OrderItemWithMenu[]>();

  return { order, items: items ?? [] };
}
