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
  voucherCode?: string; 
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

    const { data: table, error: tableErr } = await supabaseAdmin
      .from("tables")
      .select("id, status, table_number")
      .eq("table_number", body.tableNumber)
      .single();

    if (tableErr || !table) return jsonNoStore({ message: "Table not found" }, { status: 404 });

    if (table.status !== "available") {
      return jsonNoStore({ message: "Table not available" }, { status: 409 });
    }

    const originalAmount = body.items.reduce((acc, it) => acc + it.price * it.quantity, 0);
    
    //  Logic Voucher
    let discountAmount = 0;
    let finalAmount = originalAmount;
    let validVoucherCode = null;

    if (body.voucherCode) {
      const { data: voucher } = await supabaseAdmin
        .from("vouchers")
        .select("*")
        .eq("code", body.voucherCode.toUpperCase())
        .eq("is_active", true)
        .single();

      if (voucher) {
        if (originalAmount >= (voucher.min_order_amount || 0)) {
          if (voucher.type === "percentage") {
            discountAmount = (originalAmount * voucher.value) / 100;
            if (voucher.max_discount && discountAmount > voucher.max_discount) {
              discountAmount = voucher.max_discount;
            }
          } else {
            discountAmount = voucher.value;
          }

          if (discountAmount > originalAmount) discountAmount = originalAmount;
          finalAmount = originalAmount - discountAmount;
          validVoucherCode = voucher.code;
        }
      }
    }

    const orderNumber = generateOrderNumber();

    // Validasi Stok Inventory (Optional but Recommended)
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
      console.error("midtrans:create-transaction: inventory check failed", err);
    }

    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .insert({
        table_id: table.id,
        order_number: orderNumber,
        original_amount: originalAmount,
        discount_amount: discountAmount,
        total_amount: finalAmount, 
        voucher_code: validVoucherCode,
        
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

    // Insert Order Items
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

    const { error: lockErr } = await supabaseAdmin
      .from("tables")
      .update({ status: "occupied" })
      .eq("id", table.id);

    if (lockErr) return jsonNoStore({ message: lockErr.message }, { status: 500 });

    // Create Midtrans Transaction
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const midtransItems: MidtransItemDetail[] = body.items.map((it) => ({
      id: it.menu_item_id,
      price: it.price,
      quantity: it.quantity,
      name: it.name.slice(0, 50),
    }));

    // Jika ada diskon, tambahkan item negatif agar totalnya cocok
    if (discountAmount > 0) {
      midtransItems.push({
        id: "DISCOUNT-VOUCHER",
        price: -discountAmount, // Negatif agar mengurangi total
        quantity: 1,
        name: `Voucher: ${validVoucherCode}`,
      });
    }

    const params: MidtransTransactionParams = {
      transaction_details: {
        order_id: order.order_number,
        gross_amount: finalAmount, // Harga setelah diskon
      },
      item_details: midtransItems,
      callbacks: {
        finish: `${appUrl}/nota/${order.order_number}`,
      },
    };

    const snapResp = (await snap.createTransaction(params)) as SnapCreateTransactionResponse;

    if (!snapResp?.token || !snapResp?.redirect_url) {
      return jsonNoStore({ message: "Failed to get token/redirect_url from Midtrans" }, { status: 500 });
    }

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