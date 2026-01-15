export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/admin-auth-server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// 1. Definisikan tipe untuk Response
type ReportResponse = {
  range: { from: string; to: string };
  summary: {
    omzet: number;
    hpp: number;
    profit: number;
    transactions: number;
  };
  breakdown: { cash: number; nonCash: number };
  topMenus: Array<{
    name: string;
    qty: number;
    omzet: number;
  }>;
  hourlyStats: number[];
};

// 2. Definisikan tipe untuk Order Items dari database
type OrderItemRow = {
  quantity: number | null;
  subtotal: number | null;
  menu_item_id: string | null;
  menu_items: {
    id: string;
    name: string;
    hpp: number | null;
  } | null;
};

function toJakartaRange(from: string, to: string) {
  return {
    start: `${from}T00:00:00+07:00`,
    end: `${to}T23:59:59+07:00`,
  };
}

export async function GET(req: Request) {
  const guard = await requireOwner();
  if (guard instanceof NextResponse) return guard;

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json({ message: "Parameter tanggal wajib diisi" }, { status: 400 });
  }

  const { start, end } = toJakartaRange(from, to);

  try {
    // Ambil Data Order
    const { data: orders, error: e1 } = await supabaseAdmin
      .from("orders")
      .select("id, total_amount, payment_method, created_at")
      .eq("payment_status", "paid")
      .gte("created_at", start)
      .lte("created_at", end);

    if (e1) throw new Error(e1.message);

    const orderIds = (orders ?? []).map((o) => o.id);
    
    // Inisialisasi array dengan tipe yang jelas
    let items: OrderItemRow[] = [];
    
    if (orderIds.length > 0) {
        const { data: orderItems, error: e2 } = await supabaseAdmin
        .from("order_items")
        .select(`
            quantity, 
            subtotal,
            menu_item_id,
            menu_items ( id, name, hpp ) 
        `)
        .in("order_id", orderIds)
        .returns<OrderItemRow[]>(); // Type assertion aman dari Supabase
        
        if (e2) throw new Error(e2.message);
        items = orderItems || [];
    }

    // --- Kalkulasi ---
    let totalOmzet = 0;
    let cash = 0;
    let nonCash = 0;
    const hourlyStats = Array(24).fill(0);

    (orders ?? []).forEach((o) => {
      const amount = Number(o.total_amount ?? 0);
      totalOmzet += amount;

      if (String(o.payment_method ?? "").toLowerCase() === "cash") {
        cash += amount;
      } else {
        nonCash += amount;
      }

      const date = new Date(o.created_at);
      let hour = date.getUTCHours() + 7;
      if (hour >= 24) hour -= 24;
      if (hour >= 0 && hour < 24) hourlyStats[hour] += 1;
    });

    let totalHpp = 0;
    const menuMap = new Map<string, { name: string; qty: number; omzet: number }>();

    items.forEach((it) => {
        const qty = Number(it.quantity ?? 0);
        // Akses properti aman karena tipe sudah didefinisikan
        const hppUnit = Number(it.menu_items?.hpp ?? 0); 
        totalHpp += (qty * hppUnit);

        const name = it.menu_items?.name ?? "Unknown";
        const subtotal = Number(it.subtotal ?? 0);

        if(!menuMap.has(name)) {
            menuMap.set(name, { name, qty: 0, omzet: 0});
        }
        const curr = menuMap.get(name)!;
        curr.qty += qty;
        curr.omzet += subtotal;
    });

    const totalProfit = totalOmzet - totalHpp;
    
    const topMenus = Array.from(menuMap.values())
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 5);

    const result: ReportResponse = {
      range: { from, to },
      summary: {
        omzet: totalOmzet,
        hpp: totalHpp,
        profit: totalProfit,
        transactions: (orders ?? []).length,
      },
      breakdown: { cash, nonCash },
      topMenus,
      hourlyStats,
    };

    return NextResponse.json(result);

  } catch (err: unknown) { // Gunakan unknown, bukan any
    console.error("Report Error:", err);
    // Narrowing tipe error
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ message }, { status: 500 });
  }
}