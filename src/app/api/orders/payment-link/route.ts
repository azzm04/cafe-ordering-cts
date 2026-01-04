// src/app/api/orders/payment-link/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type PaymentStatus = "pending" | "paid" | "failed" | "expired";

type Row = {
  order_number: string;
  payment_status: PaymentStatus;
  midtrans_redirect_url: string | null;
  midtrans_snap_token: string | null;
};

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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const orderNumber = (searchParams.get("orderNumber") ?? "").trim();

  if (!orderNumber) return jsonNoStore({ message: "orderNumber required" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("order_number, payment_status, midtrans_redirect_url, midtrans_snap_token")
    .eq("order_number", orderNumber)
    .single<Row>();

  if (error || !data) {
    return jsonNoStore({ message: error?.message ?? "Order not found" }, { status: 404 });
  }

  // kalau sudah paid, link tidak perlu
  if (data.payment_status === "paid") {
    return jsonNoStore({ ok: true, status: "paid", redirectUrl: null });
  }

  if (!data.midtrans_redirect_url) {
    // Ini yang selama ini bikin "Response invalid"
    return jsonNoStore(
      { message: "Payment link not ready", redirectUrl: null },
      { status: 409 }
    );
  }

  return jsonNoStore({
    ok: true,
    status: data.payment_status,
    redirectUrl: data.midtrans_redirect_url,
  });
}
