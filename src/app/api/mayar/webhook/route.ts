// src/app/api/mayar/webhook/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { verifyMayarSignature } from "@/lib/mayar";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Mayar Webhook
 * Mayar mengirim POST ke URL ini saat status transaksi berubah.
 * Daftarkan URL ini di dashboard Mayar → Settings → Webhook
 * Contoh URL: https://yourdomain.com/api/mayar/webhook
 */
export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-mayar-signature") ?? "";

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

    // 3. Ambil data penting dari payload
    // Mayar mengirim: { id, status, reference_id, amount, ... }
    const transactionId = (payload.id ?? payload.transaction_id) as string | undefined;
    const rawStatus = (payload.status ?? payload.payment_status) as string | undefined;
    const referenceId = (payload.reference_id ?? payload.referenceId) as string | undefined;

    if (!transactionId || !rawStatus) {
      console.warn("[webhook] Missing transactionId or status", payload);
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    // 4. Map status Mayar → status internal
    const statusMap: Record<string, string> = {
      SUCCESS: "paid",
      PAID: "paid",
      PENDING: "pending",
      FAILED: "failed",
      EXPIRED: "expired",
      CANCELLED: "failed",
    };
    const internalStatus = statusMap[rawStatus.toUpperCase()] ?? "pending";

    // 5. Cari order berdasarkan mayar_transaction_id atau order_number
    const query = supabaseAdmin.from("orders").select("id, payment_status, table_id");

    const { data: order } = transactionId
      ? await query.eq("mayar_transaction_id", transactionId).single()
      : referenceId
      ? await query.eq("order_number", referenceId).single()
      : { data: null };

    if (!order) {
      console.warn("[webhook] Order not found for transactionId:", transactionId);
      // Tetap return 200 agar Mayar tidak retry terus
      return NextResponse.json({ message: "Order not found" });
    }

    // 6. Update payment status
    await supabaseAdmin
      .from("orders")
      .update({ payment_status: internalStatus })
      .eq("id", order.id);

    // 7. Jika gagal/expired → bebaskan meja kembali
    if (internalStatus === "failed" || internalStatus === "expired") {
      await supabaseAdmin
        .from("tables")
        .update({ status: "available" })
        .eq("id", order.table_id);
    }

    console.log(`[webhook] Order ${transactionId} → ${internalStatus}`);
    return NextResponse.json({ message: "ok" });
  } catch (err) {
    console.error("[webhook] Error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}