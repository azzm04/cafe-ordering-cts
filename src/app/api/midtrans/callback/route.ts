export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sha512Hex } from "@/lib/midtrans-signature";

type MidtransNotif = {
  order_id: string; // CTS-...
  transaction_status: string; // settlement/capture/pending/deny/cancel/expire/failure
  payment_type?: string;
  transaction_id?: string;
  fraud_status?: string;
  status_code?: string;
  gross_amount?: string;
  signature_key?: string;
};

type PaymentStatus = "pending" | "paid" | "failed" | "expired";

function mapStatus(ms: string): PaymentStatus {
  const s = ms.toLowerCase();
  if (s === "settlement" || s === "capture") return "paid";
  if (s === "expire") return "expired";
  if (s === "deny" || s === "cancel" || s === "failure") return "failed";
  return "pending";
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
    const notif = (await req.json()) as MidtransNotif;

    console.log("=== MIDTRANS CALLBACK ===");
    console.log(JSON.stringify(notif, null, 2));

    const payment_status = mapStatus(notif.transaction_status);

    // cari order by order_number (order_id midtrans = order_number kita)
    const { data: order, error: findErr } = await supabaseAdmin
      .from("orders")
      .select("id, table_id, order_number")
      .eq("order_number", notif.order_id)
      .single();

    if (findErr || !order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    // validasi signature_key
    const serverKey = process.env.MIDTRANS_SERVER_KEY ?? "";
    const raw = `${notif.order_id}${notif.status_code ?? ""}${
      notif.gross_amount ?? ""
    }${serverKey}`;
    const expected = await sha512Hex(raw);

    if (!notif.signature_key || notif.signature_key !== expected) {
      return NextResponse.json(
        { message: "Invalid signature" },
        { status: 401 }
      );
    }

    // update order status
    const { error: updErr } = await supabaseAdmin
      .from("orders")
      .update({
        payment_status,
        payment_method: notif.payment_type ?? null,
        midtrans_transaction_id: notif.transaction_id ?? null,
        completed_at: null, // selesai makan tetap via kasir
      })
      .eq("id", order.id);

    if (updErr) {
      return NextResponse.json({ message: updErr.message }, { status: 500 });
    }

    // kalau gagal/expired, release meja
    if (payment_status === "failed" || payment_status === "expired") {
      await supabaseAdmin
        .from("tables")
        .update({ status: "available" })
        .eq("id", order.table_id);
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json(
      { message: "Callback error", details: getErrorMessage(e) },
      { status: 500 }
    );
  }
}
