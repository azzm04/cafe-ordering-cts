// src/app/api/orders/status/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

type PaymentStatus = "pending" | "paid" | "failed" | "expired";
type FulfillmentStatus = "received" | "preparing" | "served" | "completed";

type OrderStatusRow = {
  order_number: string;
  payment_status: PaymentStatus;
  fulfillment_status: FulfillmentStatus;
  completed_at: string | null;
  updated_at?: string | null; // kalau kamu punya kolom updated_at, boleh dipakai
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

  if (!orderNumber) {
    return jsonNoStore({ message: "orderNumber required" }, { status: 400 });
  }

  const { data, error } = await supabaseServer
    .from("orders")
    .select("order_number, payment_status, fulfillment_status, completed_at")
    .eq("order_number", orderNumber)
    .single<OrderStatusRow>();

  if (error || !data) {
    return jsonNoStore({ message: error?.message ?? "Order not found" }, { status: 404 });
  }

  return jsonNoStore({
    orderNumber: data.order_number,
    payment_status: data.payment_status,
    fulfillment_status: data.fulfillment_status,
    completed_at: data.completed_at,
  });
}
