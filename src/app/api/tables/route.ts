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

type ExpiredOrder = {
  id: string;
  table_id: string;
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

    // 2. Fetch active orders (payment_status = 'paid' AND completed_at = null)
    // Ini adalah order yang sudah dibayar tapi belum selesai makan
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

    // 3. BONUS: Auto-expire orders yang pending lebih dari 15 menit
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    
    const { data: expiredOrders, error: expErr } = await supabaseServer
      .from("orders")
      .select("id, table_id")
      .eq("payment_status", "pending")
      .lt("created_at", fifteenMinutesAgo)
      .returns<ExpiredOrder[]>();

    if (expErr) {
      console.error("Error fetching expired orders:", expErr);
    }

    // Update expired orders dan release table
    if (expiredOrders && expiredOrders.length > 0) {
      const expiredOrderIds = expiredOrders.map((o) => o.id);
      const expiredTableIds = expiredOrders.map((o) => o.table_id);

      // Update order status to expired
      await supabaseServer
        .from("orders")
        .update({ 
          payment_status: "expired",
          completed_at: new Date().toISOString() 
        })
        .in("id", expiredOrderIds);

      // Release tables
      await supabaseServer
        .from("tables")
        .update({ status: "available" })
        .in("id", expiredTableIds);

      console.log(`Auto-expired ${expiredOrders.length} orders and released tables`);
    }

    // 4. Create set of occupied table IDs
    const occupiedSet = new Set((activeRefs ?? []).map((x) => x.table_id));

    // 5. Merge table status with active orders
    const merged = (tables ?? []).map((t) => ({
      ...t,
      status: occupiedSet.has(t.id) ? ("occupied" as const) : t.status,
    }));

    return NextResponse.json({ 
      tables: merged,
      timestamp: new Date().toISOString() 
    });

  } catch (error) {
    console.error("Unexpected error in GET /api/tables:", error);
    return NextResponse.json(
      { 
        message: "Internal server error", 
        error: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}

// Optional: POST endpoint untuk manual update table status (untuk kasir)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tableId, status } = body;

    if (!tableId || !status) {
      return NextResponse.json(
        { message: "tableId and status are required" },
        { status: 400 }
      );
    }

    if (!["available", "occupied", "reserved"].includes(status)) {
      return NextResponse.json(
        { message: "Invalid status. Must be: available, occupied, or reserved" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServer
      .from("tables")
      .update({ status })
      .eq("id", tableId)
      .select()
      .single();

    if (error) {
      console.error("Error updating table status:", error);
      return NextResponse.json(
        { message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message: "Table status updated successfully",
      table: data 
    });

  } catch (error) {
    console.error("Unexpected error in POST /api/tables:", error);
    return NextResponse.json(
      { 
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}