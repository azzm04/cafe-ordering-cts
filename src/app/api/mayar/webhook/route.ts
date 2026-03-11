// src/app/api/mayar/webhook/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { verifyMayarSignature } from "@/lib/mayar";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-callback-token") ?? "";

    // 1. Verifikasi signature (skip jika MAYAR_API_SECRET belum di-set)
    if (process.env.MAYAR_API_SECRET) {
      const valid = verifyMayarSignature(rawBody, signature);
      if (!valid) {
        console.warn("[webhook] Invalid signature");
        return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
      }
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

    // 6. Cari order — 3 lapis fallback
    let order: { id: string; payment_status: string; table_id: string } | null = null;

    // Lapis 1: cari via mayar_payment_id
    if (transactionId) {
      const { data: found } = await supabaseAdmin
        .from("orders")
        .select("id, payment_status, table_id")
        .eq("mayar_payment_id", transactionId)
        .maybeSingle();
      order = found;
      if (order) console.log("[webhook] Found order via mayar_payment_id");
    }

    // Lapis 2: cari via referenceId / order_number
    if (!order && referenceId) {
      const { data: found } = await supabaseAdmin
        .from("orders")
        .select("id, payment_status, table_id")
        .eq("order_number", referenceId)
        .maybeSingle();
      order = found;
      if (order) console.log("[webhook] Found order via referenceId");
    }

    // Lapis 3: parse order number dari productDescription "Order CTS-XXXXX"
    if (!order && description) {
      const match = description.match(/(?:CTS|ORD)-[\w-]+/);
      if (match) {
        const { data: found } = await supabaseAdmin
          .from("orders")
          .select("id, payment_status, table_id")
          .eq("order_number", match[0])
          .maybeSingle();
        order = found;
        if (order) console.log("[webhook] Found order via productDescription:", match[0]);
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

    // 9. Jika paid → update order_status ke "received" jika masih pending
    if (internalStatus === "paid") {
      await supabaseAdmin
        .from("orders")
        .update({ order_status: "received" })
        .eq("id", order.id)
        .eq("order_status", "pending");
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
    return NextResponse.json({ message: "ok" });
  } catch (err) {
    console.error("[webhook] Error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}