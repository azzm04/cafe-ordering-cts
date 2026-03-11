// src/app/api/mayar/webhook/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { verifyMayarSignature } from "@/lib/mayar";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { deductStockForOrder } from "@/lib/inventory/index";

export async function POST(req: Request) {
  console.log("[webhook] ========== WEBHOOK START ==========");
  console.log(`[webhook] Timestamp: ${new Date().toISOString()}`);
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-callback-token") ?? "";

    console.log("[webhook] Received webhook callback");
    console.log("[webhook] Headers:", Object.fromEntries(req.headers.entries()));
    console.log("[webhook] Body length:", rawBody.length);
    console.log("[webhook] Signature in header:", signature ? `present (${signature.substring(0, 20)}...)` : "missing");


    // 1. Verifikasi signature (skip jika MAYAR_API_SECRET belum di-set)
    if (process.env.MAYAR_API_SECRET) {
      if (!signature) {
        console.warn("[webhook] No signature provided in x-callback-token header");
        return NextResponse.json({ message: "Missing signature" }, { status: 401 });
      }

      const valid = verifyMayarSignature(rawBody, signature);
      if (!valid) {
        console.warn("[webhook] Invalid signature");
        return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
      }
      console.log("[webhook] Signature verified successfully");
    } else {
      console.warn("[webhook] MAYAR_API_SECRET not set, skipping signature verification");
    }

    // 2. Parse payload
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
    }

    console.log("[webhook] Mayar payload:", JSON.stringify(payload, null, 2));

    // 3. Support nested payload: { event, data: { ... } } atau flat { ... }
    const data = (
      payload.data && typeof payload.data === "object"
        ? payload.data
        : payload
    ) as Record<string, unknown>;

    // 4. Ambil field penting
    // Mayar mengirim transactionId di data.id / data.transactionId
    // Order number tersimpan di data.productDescription ("Order CTS-xxx")
    const transactionId = (data.id ?? data.transactionId ?? data.transaction_id) as string | undefined;
    const rawStatus = (data.status ?? data.payment_status ?? data.paymentStatus) as string | undefined;
    const referenceId = (data.reference_id ?? data.referenceId ?? data.order_id) as string | undefined;
    const description = (
      data.productDescription ?? // ← field utama dari Mayar
      data.description ??
      data.desc ??
      payload.description ??
      ""
    ) as string;

    console.log(`[webhook] Extracted fields:`);
    console.log(`  - transactionId (data.id): "${transactionId}"`);
    console.log(`  - rawStatus: "${rawStatus}"`);
    console.log(`  - referenceId: "${referenceId}"`);
    console.log(`  - description: "${description}"`);

    if (!rawStatus) {
      console.warn("[webhook] Missing status in payload", payload);
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    // 5. Map status Mayar → status internal
    const statusMap: Record<string, string> = {
      SUCCESS: "paid",
      PAID: "paid",
      SETTLING: "paid",
      SETTLEMENT: "paid",
      CAPTURE: "paid",
      PENDING: "pending",
      FAILED: "failed",
      FAILURE: "failed",
      EXPIRED: "expired",
      CANCELLED: "failed",
      CANCEL: "failed",
    };
    const internalStatus = statusMap[rawStatus.toUpperCase()] ?? "pending";
    console.log(`[webhook] Status mapping: "${rawStatus}" → "${internalStatus}"`);

    // 6. Cari order — 3 lapis fallback
    let order: { id: string; payment_status: string; table_id: string; stock_deducted_at: string | null } | null = null;

    console.log(`[webhook] Looking for order with transactionId="${transactionId}", referenceId="${referenceId}", description="${description}"`);

    // Lapis 1: cari via mayar_payment_id
    if (transactionId) {
      console.log(`[webhook] Layer 1: searching by mayar_payment_id="${transactionId}"`);
      const { data: found } = await supabaseAdmin
        .from("orders")
        .select("id, payment_status, table_id, stock_deducted_at")
        .eq("mayar_payment_id", transactionId)
        .maybeSingle();
      if (found) {
        order = found;
        console.log(`[webhook] ✓ Found order via mayar_payment_id: ${order.id}`);
      } else {
        console.log(`[webhook] ✗ No order found with mayar_payment_id="${transactionId}"`);
      }
    }

    // Lapis 2: cari via referenceId / order_number
    if (!order && referenceId) {
      console.log(`[webhook] Layer 2: searching by order_number="${referenceId}"`);
      const { data: found } = await supabaseAdmin
        .from("orders")
        .select("id, payment_status, table_id, stock_deducted_at")
        .eq("order_number", referenceId)
        .maybeSingle();
      if (found) {
        order = found;
        console.log(`[webhook] ✓ Found order via order_number: ${order.id}`);
      } else {
        console.log(`[webhook] ✗ No order found with order_number="${referenceId}"`);
      }
    }

    // Lapis 3: parse order number dari productDescription "Order CTS-XXXXX"
    if (!order && description) {
      const match = description.match(/(?:CTS|ORD)-[\w-]+/);
      if (match) {
        console.log(`[webhook] Layer 3: extracted order_number from description: "${match[0]}"`);
        const { data: found } = await supabaseAdmin
          .from("orders")
          .select("id, payment_status, table_id, stock_deducted_at")
          .eq("order_number", match[0])
          .maybeSingle();
        if (found) {
          order = found;
          console.log(`[webhook] ✓ Found order via description: ${order.id}`);
        } else {
          console.log(`[webhook] ✗ No order found with order_number="${match[0]}"`);
        }
      } else {
        console.log(`[webhook] Layer 3: no order number pattern found in description`);
      }
    }

    if (!order) {
      console.warn(
        "[webhook] Order not found.",
        "transactionId:", transactionId,
        "| referenceId:", referenceId,
        "| description:", description
      );
      // Return 200 agar Mayar tidak retry terus
      return NextResponse.json({ message: "Order not found" });
    }

    // 7. Skip jika status tidak berubah (idempoten)
    if (order.payment_status === internalStatus) {
      console.log(`[webhook] Status already ${internalStatus}, skipping update`);
      return NextResponse.json({ message: "ok" });
    }

    // 8. Update payment_status di orders
    const { error: updateError } = await supabaseAdmin
      .from("orders")
      .update({ payment_status: internalStatus })
      .eq("id", order.id);

    if (updateError) {
      console.error("[webhook] Failed to update order:", updateError);
      return NextResponse.json({ message: "DB update failed" }, { status: 500 });
    }

    // 9. Jika paid → kurangi stok (hanya sekali), update order_status ke "received"
    if (internalStatus === "paid" && !order.stock_deducted_at) {
      console.log(`[webhook] Processing stock deduction for order ${order.id}`);
      
      try {
        // Kurangi stok inventory menggunakan function helper
        console.log(`[webhook] Calling deductStockForOrder for order ${order.id}`);
        await deductStockForOrder(order.id);
        console.log(`[webhook] deductStockForOrder completed successfully for order ${order.id}`);

        // Mark bahwa stok sudah dikurangi
        const { error: markErr } = await supabaseAdmin
          .from("orders")
          .update({ stock_deducted_at: new Date().toISOString() })
          .eq("id", order.id);

        if (markErr) {
          console.error("[webhook] Failed to mark stock_deducted_at:", markErr);
          return NextResponse.json({ message: "Failed to mark stock deduction" }, { status: 500 });
        } else {
          console.log(`[webhook] Stock deducted and marked for order ${order.id}`);
        }
      } catch (stockErr) {
        console.error("[webhook] Error deducting stock:", stockErr);
        return NextResponse.json(
          { message: `Stock deduction failed: ${stockErr instanceof Error ? stockErr.message : String(stockErr)}` },
          { status: 500 }
        );
      }

      // Update order_status ke received
      const { error: statusErr } = await supabaseAdmin
        .from("orders")
        .update({ order_status: "received" })
        .eq("id", order.id)
        .eq("order_status", "pending");
      
      if (statusErr) {
        console.error("[webhook] Failed to update order_status:", statusErr);
      } else {
        console.log(`[webhook] Order status updated to received for order ${order.id}`);
      }
    }

    // 10. Jika gagal/expired → bebaskan meja
    if (internalStatus === "failed" || internalStatus === "expired") {
      await supabaseAdmin
        .from("tables")
        .update({ status: "available" })
        .eq("id", order.table_id);
      console.log(`[webhook] Table ${order.table_id} released`);
    }

    console.log(`[webhook] Order ${order.id} updated to ${internalStatus}`);
    console.log("[webhook] ========== WEBHOOK END ==========");
    return NextResponse.json({ message: "ok" });
  } catch (err) {
    console.error("[webhook] Error:", err);
    console.error("[webhook] ========== WEBHOOK END (ERROR) ==========");
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}