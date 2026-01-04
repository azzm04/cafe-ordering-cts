// src/app/api/admin/orders/complete/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type Body = {
  orderNumber: string;
};

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
    const body = (await req.json()) as Body;

    if (!body.orderNumber) {
      return NextResponse.json(
        { message: "orderNumber is required" },
        { status: 400 }
      );
    }

    // 1. Get order details
    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .select("id, table_id, payment_status, fulfillment_status, completed_at")
      .eq("order_number", body.orderNumber)
      .single();

    if (orderErr || !order) {
      return NextResponse.json(
        { message: "Order not found" },
        { status: 404 }
      );
    }

    // 2. Validate order can be completed
    if (order.payment_status !== "paid") {
      return NextResponse.json(
        { message: "Order must be paid before completion" },
        { status: 400 }
      );
    }

    if (order.completed_at) {
      return NextResponse.json(
        { message: "Order already completed" },
        { status: 400 }
      );
    }

    // 3. ✅ Complete the order - Update both fulfillment_status AND completed_at
    const { error: updateErr } = await supabaseAdmin
      .from("orders")
      .update({
        fulfillment_status: "completed",  // ← PENTING: Set jadi completed
        completed_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    if (updateErr) {
      console.error("Error completing order:", updateErr);
      return NextResponse.json(
        { message: updateErr.message },
        { status: 500 }
      );
    }

    // 4. Release the table
    const { error: tableErr } = await supabaseAdmin
      .from("tables")
      .update({ status: "available" })
      .eq("id", order.table_id);

    if (tableErr) {
      console.error("Error releasing table:", tableErr);
      // Order sudah completed, tapi table gagal release
      return NextResponse.json(
        {
          message: "Order completed but failed to release table",
          warning: tableErr.message,
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      message: "Order completed successfully",
      orderNumber: body.orderNumber,
      tableReleased: true,
    });

  } catch (error) {
    console.error("Unexpected error in POST /api/admin/orders/complete:", error);
    return NextResponse.json(
      {
        message: "Internal server error",
        error: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}