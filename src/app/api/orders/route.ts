import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

// Tambahkan voucherCode di tipe Body
type Body = {
  tableNumber: number;
  items: Array<{ menu_item_id: string; quantity: number; price: number; notes?: string }>;
  voucherCode?: string; // <--- BARU
};

function generateOrderNumber() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  const rand = Math.random().toString(16).slice(2, 6).toUpperCase();
  return `CTS-${y}${m}${day}-${hh}${mm}${ss}-${rand}`;
}

export async function POST(req: Request) {
  const body = (await req.json()) as Body;

  if (!body.tableNumber) return NextResponse.json({ message: "tableNumber required" }, { status: 400 });
  if (!body.items?.length) return NextResponse.json({ message: "items required" }, { status: 400 });

  // 1. Validasi Stok (Tetap Sama)
  try {
    const menuIds = [...new Set(body.items.map((it) => it.menu_item_id))];
    const { computeMaxPortionsForMenus } = await import("@/lib/inventory/index");
    const maxMap = await computeMaxPortionsForMenus(menuIds);
    const problems: Array<{ menu_item_id: string; requested: number; maxAvailable: number | null }> = [];
    for (const it of body.items) {
      const max = maxMap.get(it.menu_item_id) ?? null;
      if (typeof max === "number") {
        if (it.quantity > max) {
          problems.push({ menu_item_id: it.menu_item_id, requested: it.quantity, maxAvailable: max });
        }
      }
    }
    if (problems.length > 0) {
      return NextResponse.json({ message: "Stok tidak cukup", items: problems }, { status: 400 });
    }
  } catch (err) {
    console.error("orders: computeMaxPortionsForMenus failed", err);
  }

  // 2. Cek Meja (Tetap Sama)
  const { data: table, error: tableErr } = await supabaseServer
    .from("tables")
    .select("*")
    .eq("table_number", body.tableNumber)
    .single();

  if (tableErr || !table) return NextResponse.json({ message: "Table not found" }, { status: 404 });
  if (table.status !== "available") return NextResponse.json({ message: "Table not available" }, { status: 409 });

  // 3. Hitung Subtotal (Gross Amount)
  const original_amount = body.items.reduce((acc, it) => acc + it.price * it.quantity, 0);
  
  // 4. LOGIKA VOUCHER (BARU)
  let discount_amount = 0;
  let final_amount = original_amount;
  let validVoucherCode = null;

  if (body.voucherCode) {
    const { data: voucher } = await supabaseServer
      .from("vouchers")
      .select("*")
      .eq("code", body.voucherCode.toUpperCase())
      .eq("is_active", true)
      .single();

    if (voucher) {
      // Cek minimal order
      if (original_amount >= (voucher.min_order_amount || 0)) {
        if (voucher.type === "percentage") {
          discount_amount = (original_amount * voucher.value) / 100;
          if (voucher.max_discount && discount_amount > voucher.max_discount) {
            discount_amount = voucher.max_discount;
          }
        } else {
          discount_amount = voucher.value;
        }

        // Pastikan diskon tidak minus
        if (discount_amount > original_amount) discount_amount = original_amount;
        
        final_amount = original_amount - discount_amount;
        validVoucherCode = voucher.code;
      }
    }
  }

  const order_number = generateOrderNumber();

  // 5. Insert Order (Update kolom)
  const { data: order, error: orderErr } = await supabaseServer
    .from("orders")
    .insert({
      table_id: table.id,
      order_number,
      
      // Simpan rincian harga
      original_amount: original_amount,
      discount_amount: discount_amount,
      total_amount: final_amount, // Harga akhir yang harus dibayar
      voucher_code: validVoucherCode,

      payment_status: "pending",
      order_status: "received",
    })
    .select("*")
    .single();

  if (orderErr || !order) return NextResponse.json({ message: orderErr?.message ?? "Failed create order" }, { status: 500 });

  // 6. Insert Items (Tetap Sama)
  const orderItemsPayload = body.items.map((it) => ({
    order_id: order.id,
    menu_item_id: it.menu_item_id,
    quantity: it.quantity,
    price: it.price,
    subtotal: it.price * it.quantity,
    notes: it.notes ?? null,
  }));

  const { error: itemsErr } = await supabaseServer.from("order_items").insert(orderItemsPayload);
  if (itemsErr) return NextResponse.json({ message: itemsErr.message }, { status: 500 });

  await supabaseServer.from("tables").update({ status: "occupied" }).eq("id", table.id);

  return NextResponse.json({ order });
}