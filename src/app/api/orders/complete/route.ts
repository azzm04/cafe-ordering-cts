// src/app/api/orders/complete/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

type CompleteOrderBody = {
  orderId: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CompleteOrderBody;

    if (!body.orderId) {
      return NextResponse.json(
        { message: "orderId is required" },
        { status: 400 }
      );
    }

    // 1. Get order details
    const { data: order, error: orderErr } = await supabaseServer
      .from("orders")
      .select("id, table_id, payment_status, completed_at")
      .eq("id", body.orderId)
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

    // 3. Complete the order
    const { error: updateErr } = await supabaseServer
      .from("orders")
      .update({
        completed_at: new Date().toISOString(),
        order_status: "completed",
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
    const { error: tableErr } = await supabaseServer
      .from("tables")
      .update({ status: "available" })
      .eq("id", order.table_id);

    if (tableErr) {
      console.error("Error releasing table:", tableErr);
      // Order sudah di-complete, tapi table gagal di-release
      // Tidak perlu rollback, cukup log error
      return NextResponse.json(
        { 
          message: "Order completed but failed to release table",
          warning: tableErr.message 
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      message: "Order completed successfully",
      orderId: order.id,
      tableReleased: true,
    });

  } catch (error) {
    console.error("Unexpected error in POST /api/orders/complete:", error);
    return NextResponse.json(
      {
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET endpoint untuk cek apakah order bisa di-complete
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");

    if (!orderId) {
      return NextResponse.json(
        { message: "orderId is required" },
        { status: 400 }
      );
    }

    const { data: order, error } = await supabaseServer
      .from("orders")
      .select(`
        id,
        order_number,
        payment_status,
        order_status,
        completed_at,
        tables (
          table_number,
          status
        )
      `)
      .eq("id", orderId)
      .single();

    if (error || !order) {
      return NextResponse.json(
        { message: "Order not found" },
        { status: 404 }
      );
    }

    const canComplete = 
      order.payment_status === "paid" && 
      !order.completed_at;

    return NextResponse.json({
      order,
      canComplete,
      reason: !canComplete 
        ? order.payment_status !== "paid"
          ? "Order not paid yet"
          : "Order already completed"
        : null,
    });

  } catch (error) {
    console.error("Unexpected error in GET /api/orders/complete:", error);
    return NextResponse.json(
      {
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}