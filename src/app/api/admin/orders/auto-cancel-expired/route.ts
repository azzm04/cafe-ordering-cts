// src/app/api/admin/orders/auto-cancel-expired/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Endpoint untuk auto-cancel order cash yang pending lebih dari 1 jam
 * Jalankan dengan cron job atau scheduler
 */
export async function POST() {
  try {
    // Hitung waktu 1 jam yang lalu
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    const oneHourAgoISO = oneHourAgo.toISOString();

    // Cari order cash yang masih pending dan sudah lebih dari 1 jam
    const { data: expiredOrders, error: fetchError } = await supabaseAdmin
      .from("orders")
      .select("id, order_number, table_id, created_at")
      .eq("payment_method", "cash")
      .eq("payment_status", "pending")
      .lt("created_at", oneHourAgoISO);

    if (fetchError) {
      console.error("Error fetching expired orders:", fetchError);
      return NextResponse.json(
        { message: "Failed to fetch expired orders", error: fetchError.message },
        { status: 500 }
      );
    }

    if (!expiredOrders || expiredOrders.length === 0) {
      return NextResponse.json({
        message: "No expired orders found",
        cancelled: 0,
      });
    }

    const cancelledOrders: string[] = [];
    const releasedTables: string[] = [];

    // Cancel setiap order yang expired
    for (const order of expiredOrders) {
      // Update order status ke expired
      const { error: updateError } = await supabaseAdmin
        .from("orders")
        .update({
          payment_status: "expired",
          order_status: "cancelled",
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id);

      if (updateError) {
        console.error(`Failed to cancel order ${order.order_number}:`, updateError);
        continue;
      }

      cancelledOrders.push(order.order_number);

      // Release table jika ada
      if (order.table_id) {
        const { error: tableError } = await supabaseAdmin
          .from("tables")
          .update({ status: "available" })
          .eq("id", order.table_id);

        if (tableError) {
          console.error(`Failed to release table for order ${order.order_number}:`, tableError);
        } else {
          releasedTables.push(order.table_id);
        }
      }
    }

    return NextResponse.json({
      message: "Expired orders cancelled successfully",
      cancelled: cancelledOrders.length,
      orders: cancelledOrders,
      tablesReleased: releasedTables.length,
    });
  } catch (error) {
    console.error("Auto-cancel error:", error);
    return NextResponse.json(
      { message: "Internal server error", error: String(error) },
      { status: 500 }
    );
  }
}

// Optional: GET endpoint untuk check berapa order yang akan expired
export async function GET() {
  try {
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    const oneHourAgoISO = oneHourAgo.toISOString();

    const { data, error } = await supabaseAdmin
      .from("orders")
      .select("order_number, created_at, table_id")
      .eq("payment_method", "cash")
      .eq("payment_status", "pending")
      .lt("created_at", oneHourAgoISO);

    if (error) {
      return NextResponse.json(
        { message: "Failed to fetch", error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      count: data?.length ?? 0,
      orders: data ?? [],
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Internal server error", error: String(error) },
      { status: 500 }
    );
  }
}