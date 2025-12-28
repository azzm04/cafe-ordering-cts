import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

type Body = {
  tableNumber: number;
  items: Array<{ menu_item_id: string; quantity: number; price: number; notes?: string }>;
};

function generateOrderNumber() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  const rand = Math.random().toString(16).slice(2, 6).toUpperCase();
  return `CTS-${y}${m}${day}-${hh}${mm}${ss}-${rand}`;
}

export async function POST(req: Request) {
  const body = (await req.json()) as Body;

  if (!body.tableNumber) return NextResponse.json({ message: "tableNumber required" }, { status: 400 });
  if (!body.items?.length) return NextResponse.json({ message: "items required" }, { status: 400 });

  const { data: table, error: tableErr } = await supabaseServer
    .from("tables")
    .select("*")
    .eq("table_number", body.tableNumber)
    .single();

  if (tableErr || !table) return NextResponse.json({ message: "Table not found" }, { status: 404 });
  if (table.status !== "available") return NextResponse.json({ message: "Table not available" }, { status: 409 });

  const total_amount = body.items.reduce((acc, it) => acc + it.price * it.quantity, 0);
  const order_number = generateOrderNumber();

  const { data: order, error: orderErr } = await supabaseServer
    .from("orders")
    .insert({
      table_id: table.id,
      order_number,
      total_amount,
      payment_status: "pending",
      order_status: "received",
    })
    .select("*")
    .single();

  if (orderErr || !order) return NextResponse.json({ message: orderErr?.message ?? "Failed create order" }, { status: 500 });

  const orderItemsPayload = body.items.map((it) => ({
    order_id: order.id,
    menu_item_id: it.menu_item_id,
    quantity: it.quantity,
    price: it.price,
    subtotal: it.price * it.quantity,
    notes: it.notes ?? null,
  }));

  const { error: itemsErr } = await supabaseServer.from("order_items").insert(orderItemsPayload);
  if (itemsErr) return NextResponse.json({ message: itemsErr.message }, { status: 500 });

  await supabaseServer.from("tables").update({ status: "occupied" }).eq("id", table.id);

  return NextResponse.json({ order });
}
