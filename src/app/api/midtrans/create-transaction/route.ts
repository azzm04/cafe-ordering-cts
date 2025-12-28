export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { snap } from "@/lib/midtrans";
import { supabaseServer } from "@/lib/supabase/server";

type CreateTransactionBody = {
  tableNumber: number;
  items: Array<{
    menu_item_id: string;
    name: string;
    quantity: number;
    price: number;
    notes?: string;
  }>;
};

type MidtransItemDetail = {
  id: string;
  price: number;
  quantity: number;
  name: string;
};

type MidtransTransactionParams = {
  transaction_details: {
    order_id: string;
    gross_amount: number;
  };
  item_details: MidtransItemDetail[];
  callbacks?: {
    finish?: string;
  };
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

function getErrorMessage(err: unknown) {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  try {
    return JSON.stringify(err);
  } catch {
    return "Unknown error";
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CreateTransactionBody;

    if (!body.tableNumber || !body.items?.length) {
      return NextResponse.json(
        { message: "tableNumber & items required" },
        { status: 400 }
      );
    }

    const { data: table, error: tableErr } = await supabaseServer
      .from("tables")
      .select("id, status, table_number")
      .eq("table_number", body.tableNumber)
      .single();

    if (tableErr || !table)
      return NextResponse.json({ message: "Table not found" }, { status: 404 });
    if (table.status !== "available") {
      return NextResponse.json(
        { message: "Table not available" },
        { status: 409 }
      );
    }

    const total_amount = body.items.reduce(
      (acc, it) => acc + it.price * it.quantity,
      0
    );
    const order_number = generateOrderNumber();

    const { data: order, error: orderErr } = await supabaseServer
      .from("orders")
      .insert({
        table_id: table.id,
        order_number,
        total_amount,
        payment_status: "pending",
        midtrans_order_id: order_number, // konsisten
      })
      .select("id, order_number")
      .single();

    if (orderErr || !order) {
      return NextResponse.json(
        { message: orderErr?.message ?? "Failed create order" },
        { status: 500 }
      );
    }

    const orderItemsPayload = body.items.map((it) => ({
      order_id: order.id,
      menu_item_id: it.menu_item_id,
      quantity: it.quantity,
      price: it.price,
      subtotal: it.price * it.quantity,
      notes: it.notes ?? null,
    }));

    const { error: itemsErr } = await supabaseServer
      .from("order_items")
      .insert(orderItemsPayload);
    if (itemsErr)
      return NextResponse.json({ message: itemsErr.message }, { status: 500 });

    await supabaseServer
      .from("tables")
      .update({ status: "occupied" })
      .eq("id", table.id);

    const params: MidtransTransactionParams = {
      transaction_details: {
        order_id: order.order_number,
        gross_amount: total_amount,
      },
      item_details: body.items.map(
        (it): MidtransItemDetail => ({
          id: it.menu_item_id,
          price: it.price,
          quantity: it.quantity,
          name: it.name.slice(0, 50),
        })
      ),
      callbacks: {
        finish: `${process.env.NEXT_PUBLIC_APP_URL}/nota`,
      },
    };

    const snapResp = (await snap.createTransaction(params)) as unknown;
    const token =
      typeof snapResp === "object" && snapResp !== null && "token" in snapResp
        ? (snapResp as Record<string, unknown>).token
        : null;

    if (typeof token !== "string") {
      return NextResponse.json(
        { message: "Failed to get snap token from Midtrans" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      orderNumber: order.order_number,
      snapToken: token,
    });
  } catch (e: unknown) {
    return NextResponse.json(
      { message: "Server crash", details: getErrorMessage(e) },
      { status: 500 }
    );
  }
}
