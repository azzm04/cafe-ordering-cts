export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

type TableRow = {
  id: string;
  table_number: number;
  status: "available" | "occupied" | "reserved";
};

type ActiveTableRef = {
  table_id: string;
};

type FulfillmentStatus = "received" | "preparing" | "served" | "completed";
type PaymentStatus = "pending" | "paid" | "failed" | "expired";

type ActiveOrder = {
  id: string;
  order_number: string;
  total_amount: number;
  payment_status: PaymentStatus;
  payment_method: string | null;
  fulfillment_status: FulfillmentStatus;
  created_at: string;
  completed_at: string | null;
  table_id: string;
  tables?: { table_number: number } | null;
};

export async function GET() {
  try {
    // 1. Fetch all tables
    const { data: tables, error: tErr } = await supabaseServer
      .from("tables")
      .select("id, table_number, status")
      .order("table_number", { ascending: true })
      .returns<TableRow[]>();

    if (tErr) {
      console.error("Error fetching tables:", tErr);
      return NextResponse.json(
        { message: tErr.message },
        { status: 500 }
      );
    }

    const { data: activeRefs, error: aErr } = await supabaseServer
      .from("orders")
      .select("table_id")
      .eq("payment_status", "paid")
      .is("completed_at", null)
      .returns<ActiveTableRef[]>();

    if (aErr) {
      console.error("Error fetching active orders:", aErr);
      return NextResponse.json(
        { message: aErr.message },
        { status: 500 }
      );
    }

    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();

    const { data: expiredOrders } = await supabaseServer
      .from("orders")
      .select("id, table_id")
      .eq("payment_status", "pending")
      .lt("created_at", fifteenMinutesAgo);

    if (expiredOrders && expiredOrders.length > 0) {
      const expiredOrderIds = expiredOrders.map((o) => o.id);
      const expiredTableIds = expiredOrders.map((o) => o.table_id);

      await supabaseServer
        .from("orders")
        .update({
          payment_status: "expired",
          completed_at: new Date().toISOString(),
        })
        .in("id", expiredOrderIds);

      await supabaseServer
        .from("tables")
        .update({ status: "available" })
        .in("id", expiredTableIds);

      console.log(`Auto-expired ${expiredOrders.length} orders`);
    }

    const occupiedSet = new Set((activeRefs ?? []).map((x) => x.table_id));

    const mergedTables = (tables ?? []).map((t) => ({
      ...t,
      status: occupiedSet.has(t.id) ? ("occupied" as const) : t.status,
    }));

    const { data: activeOrders, error: ordersErr } = await supabaseServer
      .from("orders")
      .select(`
        id,
        order_number,
        total_amount,
        payment_status,
        payment_method,
        fulfillment_status,
        created_at,
        completed_at,
        table_id,
        tables!inner (
          table_number
        )
      `)
      .is("completed_at", null)
      .order("created_at", { ascending: false })
      .returns<ActiveOrder[]>();

    if (ordersErr) {
      console.error("Error fetching active orders:", ordersErr);
      return NextResponse.json(
        { message: ordersErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      tables: mergedTables,
      activeOrders: activeOrders ?? [],
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("Unexpected error in GET /api/admin/overview:", error);
    return NextResponse.json(
      {
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}