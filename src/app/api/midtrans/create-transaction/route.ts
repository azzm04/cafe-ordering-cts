// src/app/api/midtrans/create-transaction/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { snap } from "@/lib/midtrans";
import { supabaseAdmin } from "@/lib/supabase/admin";

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

type SnapCreateTransactionResponse = {
  token: string;
  redirect_url: string;
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

function jsonNoStore(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "CDN-Cache-Control": "no-store",
      "Vercel-CDN-Cache-Control": "no-store",
      ...(init?.headers ?? {}),
    },
  });
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
      return jsonNoStore({ message: "tableNumber & items required" }, { status: 400 });
    }

    // cek meja
    const { data: table, error: tableErr } = await supabaseAdmin
      .from("tables")
      .select("id, status, table_number")
      .eq("table_number", body.tableNumber)
      .single();

    if (tableErr || !table) return jsonNoStore({ message: "Table not found" }, { status: 404 });

    // kalau sudah occupied (misal order belum selesai), blok
    if (table.status !== "available") {
      return jsonNoStore({ message: "Table not available" }, { status: 409 });
    }

    const totalAmount = body.items.reduce((acc, it) => acc + it.price * it.quantity, 0);
    const orderNumber = generateOrderNumber();

    // validate requested quantities per menu
    try {
      const menuIds = [...new Set(body.items.map((it) => it.menu_item_id))];
      const { computeMaxPortionsForMenus } = await import("@/lib/inventory/index");
      const maxMap = await computeMaxPortionsForMenus(menuIds);

      const problems: Array<{ menu_item_id: string; requested: number; maxAvailable: number | null }> = [];
      for (const it of body.items) {
        const max = maxMap.get(it.menu_item_id) ?? null;
        if (typeof max === "number" && it.quantity > max) {
          problems.push({ menu_item_id: it.menu_item_id, requested: it.quantity, maxAvailable: max });
        }
      }

      if (problems.length > 0) return jsonNoStore({ message: "Stok tidak cukup", items: problems }, { status: 400 });
    } catch (err) {
      console.error("midtrans:create-transaction: computeMaxPortionsForMenus failed", err);
      // proceed without blocking if checker fails
    }

    // create order
    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .insert({
        table_id: table.id,
        order_number: orderNumber,
        total_amount: totalAmount,
        payment_status: "pending",
        payment_method: "online",
        midtrans_order_id: orderNumber,
        fulfillment_status: "received",
      })
      .select("id, order_number")
      .single<{ id: string; order_number: string }>();

    if (orderErr || !order) {
      return jsonNoStore({ message: orderErr?.message ?? "Failed create order" }, { status: 500 });
    }

    // insert order items
    const orderItemsPayload = body.items.map((it) => ({
      order_id: order.id,
      menu_item_id: it.menu_item_id,
      quantity: it.quantity,
      price: it.price,
      subtotal: it.price * it.quantity,
      notes: it.notes ?? null,
    }));

    const { error: itemsErr } = await supabaseAdmin.from("order_items").insert(orderItemsPayload);
    if (itemsErr) return jsonNoStore({ message: itemsErr.message }, { status: 500 });

    // lock meja jadi occupied
    const { error: lockErr } = await supabaseAdmin
      .from("tables")
      .update({ status: "occupied" })
      .eq("id", table.id);

    if (lockErr) return jsonNoStore({ message: lockErr.message }, { status: 500 });

    // create midtrans transaction
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const params: MidtransTransactionParams = {
      transaction_details: {
        order_id: order.order_number,
        gross_amount: totalAmount,
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
        finish: `${appUrl}/nota/${order.order_number}`,
      },
    };

    const snapResp = (await snap.createTransaction(params)) as SnapCreateTransactionResponse;

    if (!snapResp?.token || !snapResp?.redirect_url) {
      return jsonNoStore({ message: "Failed to get token/redirect_url from Midtrans" }, { status: 500 });
    }

    // simpan token + redirect_url ke DB
    const { error: saveErr } = await supabaseAdmin
      .from("orders")
      .update({
        midtrans_snap_token: snapResp.token,
        midtrans_redirect_url: snapResp.redirect_url,
      })
      .eq("id", order.id);

    if (saveErr) {
      return jsonNoStore({ message: saveErr.message }, { status: 500 });
    }

    return jsonNoStore({
      orderNumber: order.order_number,
      snapToken: snapResp.token,
      redirectUrl: snapResp.redirect_url,
    });
  } catch (e: unknown) {
    return jsonNoStore({ message: "Server crash", details: getErrorMessage(e) }, { status: 500 });
  }
}
