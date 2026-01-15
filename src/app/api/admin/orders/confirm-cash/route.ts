export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth-server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { deductStockForOrder } from "@/lib/inventory/index";

type Body = { orderNumber: string };

type OrderRow = {
  id: string;
  order_number: string;
  payment_method: string | null;
  payment_status: "pending" | "paid" | "failed" | "expired";
  fulfillment_status: "received" | "preparing" | "served" | "completed";
  completed_at: string | null;
};

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  if (isObject(e) && typeof e.message === "string") return e.message;
  return "Unknown error";
}

export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  try {
    const body = (await req.json()) as Body;
    const orderNumber = (body?.orderNumber ?? "").trim();
    if (!orderNumber) {
      return NextResponse.json({ message: "orderNumber required" }, { status: 400 });
    }
    // ambil order berdasarkan orderNumber
    const { data: order, error: findErr } = await supabaseAdmin
      .from("orders")
      .select("id, order_number, payment_method, payment_status, fulfillment_status, completed_at")
      .eq("order_number", orderNumber)
      .single<OrderRow>();

    if (findErr || !order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    if (order.completed_at) {
      return NextResponse.json({ message: "Order sudah completed" }, { status: 400 });
    }

    if (order.payment_method !== "cash") {
      return NextResponse.json({ message: "Order ini bukan pembayaran tunai" }, { status: 400 });
    }

    if (order.payment_status === "paid") {
      return NextResponse.json({ ok: true, alreadyPaid: true });
    }
    // cek apakah stock sudah dideduct untuk order ini
    const { data: existingMoves, error: moveErr } = await supabaseAdmin
      .from("stock_movements")
      .select("id")
      .eq("reference_id", order.id)
      .eq("reason", "order_deduction")
      .limit(1);

    if (moveErr) {
      return NextResponse.json({ message: moveErr.message }, { status: 500 });
    }

    // kalau belum, deduct stock sekarang juga
    const alreadyDeducted = (existingMoves?.length ?? 0) > 0;

    if (!alreadyDeducted) {
      try {
        await deductStockForOrder(order.id);
      } catch (err: unknown) {
        console.error("deductStockForOrder failed", err);
        const msg = getErrorMessage(err);
        // Return 400 so caller sees specific reason (e.g., missing recipe or insufficient stock)
        return NextResponse.json({ message: msg }, { status: 400 });
      }
    }

    const nextFulfillment =
      order.fulfillment_status === "received" ||
      order.fulfillment_status === "preparing" ||
      order.fulfillment_status === "served" ||
      order.fulfillment_status === "completed"
        ? order.fulfillment_status
        : "received";

    const { error: updErr } = await supabaseAdmin
      .from("orders")
      .update({
        payment_status: "paid",
        payment_method: "cash",
        fulfillment_status: nextFulfillment,
      })
      .eq("id", order.id);

    if (updErr) {
      return NextResponse.json({ message: updErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, deducted: !alreadyDeducted });
  } catch (e: unknown) {
    console.error("confirm-cash error", e);
    return NextResponse.json(
      { message: "Gagal konfirmasi tunai", details: getErrorMessage(e) },
      { status: 500 }
    );
  }
}
