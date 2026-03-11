// src/app/api/mayar/create-transaction/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createMayarPayment } from "@/lib/mayar";
import { supabaseAdmin } from "@/lib/supabase/admin";

type Body = {
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
function generateOrderNumber() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const rand = Math.random().toString(16).slice(2, 6).toUpperCase();
  return `CTS-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}-${rand}`;
}

function json(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: {
      "Cache-Control": "no-store",
      ...(init?.headers ?? {}),
    },
  });
}

function errMsg(err: unknown): string {
  if (err instanceof Error) return err.message;
  try { return JSON.stringify(err); } catch { return "Unknown error"; }
}

// ─── POST /api/mayar/create-transaction ───────────────────────────────────────
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    if (!body.tableNumber || !body.items?.length) {
      return json({ message: "tableNumber & items required" }, { status: 400 });
    }

    // 1. Cek meja
    const { data: table, error: tableErr } = await supabaseAdmin
      .from("tables")
      .select("id, status, table_number")
      .eq("table_number", body.tableNumber)
      .single();

    if (tableErr || !table)
      return json({ message: "Table not found" }, { status: 404 });

    if (table.status !== "available")
      return json({ message: "Table not available" }, { status: 409 });

    // 2. Hitung amount
    const originalAmount = body.items.reduce(
      (acc, it) => acc + it.price * it.quantity,
      0
    );

    let discountAmount = 0;
    let finalAmount = originalAmount;
    let validVoucherCode: string | null = null;

    if (body.voucherCode) {
      const { data: voucher } = await supabaseAdmin
        .from("vouchers")
        .select("*")
        .eq("code", body.voucherCode.toUpperCase())
        .eq("is_active", true)
        .single();

      if (voucher && originalAmount >= (voucher.min_order_amount ?? 0)) {
        if (voucher.type === "percentage") {
          discountAmount = (originalAmount * voucher.value) / 100;
          if (voucher.max_discount) discountAmount = Math.min(discountAmount, voucher.max_discount);
        } else {
          discountAmount = voucher.value;
        }
        discountAmount = Math.min(discountAmount, originalAmount);
        finalAmount = originalAmount - discountAmount;
        validVoucherCode = voucher.code as string;
      }
    }

    const orderNumber = generateOrderNumber();

    // 3. Cek stok inventory
    try {
      const menuIds = [...new Set(body.items.map((it) => it.menu_item_id))];
      const { computeMaxPortionsForMenus } = await import("@/lib/inventory/index");
      const maxMap = await computeMaxPortionsForMenus(menuIds);

      const problems = body.items
        .filter((it) => {
          const max = maxMap.get(it.menu_item_id) ?? null;
          return typeof max === "number" && it.quantity > max;
        })
        .map((it) => ({
          menu_item_id: it.menu_item_id,
          requested: it.quantity,
          maxAvailable: maxMap.get(it.menu_item_id) ?? null,
        }));

      if (problems.length > 0)
        return json({ message: "Stok tidak cukup", items: problems }, { status: 400 });
    } catch (err) {
      console.error("[create-transaction] inventory check failed:", err);
    }

    // 4. Insert order (status pending)
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
        mayar_order_id: orderNumber,
        fulfillment_status: "received",
      })
      .select("id, order_number")
      .single<{ id: string; order_number: string }>();

    if (orderErr || !order)
      return json({ message: orderErr?.message ?? "Failed to create order" }, { status: 500 });

    // 5. Insert order items
    const { error: itemsErr } = await supabaseAdmin.from("order_items").insert(
      body.items.map((it) => ({
        order_id: order.id,
        menu_item_id: it.menu_item_id,
        quantity: it.quantity,
        price: it.price,
        subtotal: it.price * it.quantity,
        notes: it.notes ?? null,
      }))
    );
    if (itemsErr)
      return json({ message: itemsErr.message }, { status: 500 });

    // 5b. Kurangi stok inventory
    // Stok dikurangi saat order dibuat (bukan saat payment confirmed)
    // Jika payment failed/expired → stok dikembalikan via rollback di bawah
    try {
      for (const item of body.items) {
        await supabaseAdmin.rpc("decrement_stock", {
          menu_id: item.menu_item_id,
          qty: item.quantity,
        });
      }
      console.log(`[create-transaction] Stock decremented for order ${orderNumber}`);
    } catch (stockErr) {
      // Jangan gagalkan order — stok bisa dikoreksi manual oleh owner
      console.error("[create-transaction] Stock decrement failed:", stockErr);
    }

    // 6. Lock meja
    const { error: lockErr } = await supabaseAdmin
      .from("tables")
      .update({ status: "occupied" })
      .eq("id", table.id);
    if (lockErr)
      return json({ message: lockErr.message }, { status: 500 });

    // 7. Buat payment di Mayar
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

    try {
      const mayar = await createMayarPayment({
        orderNumber: order.order_number,
        amount: finalAmount,
        buyerName: `Table ${body.tableNumber}`,
        buyerEmail: "customer@order.local",
        redirectUrl: `${appUrl}/nota/${order.order_number}`,
      });

      // 8. Simpan semua ID Mayar ke order
      await supabaseAdmin
        .from("orders")
        .update({
          mayar_payment_id: mayar.paymentId,
          mayar_transaction_id: mayar.transactionId,
          mayar_payment_url: mayar.paymentUrl,
        })
        .eq("id", order.id);

      console.log(
        `[create-transaction] Order ${order.order_number} | mayar_payment_id: ${mayar.paymentId} | transactionId: ${mayar.transactionId}`
      );

      return json({
        orderNumber: order.order_number,
        paymentUrl: mayar.paymentUrl,
        transactionId: mayar.transactionId,
        paymentId: mayar.paymentId,
      });
    } catch (mayarErr) {
      // Rollback: tandai order failed + kembalikan stok
      await supabaseAdmin
        .from("orders")
        .update({ payment_status: "failed" })
        .eq("id", order.id);

      try {
        for (const item of body.items) {
          await supabaseAdmin.rpc("increment_stock", {
            menu_id: item.menu_item_id,
            qty: item.quantity,
          });
        }
        console.log(`[create-transaction] Stock restored after Mayar failure for ${orderNumber}`);
      } catch (restoreErr) {
        console.error("[create-transaction] Stock restore failed:", restoreErr);
      }

      console.error("[create-transaction] Mayar failed:", mayarErr);
      return json(
        { message: `Mayar payment initialization failed: ${errMsg(mayarErr)}` },
        { status: 500 }
      );
    }
  } catch (e) {
    return json({ message: "Server error", details: errMsg(e) }, { status: 500 });
  }
}