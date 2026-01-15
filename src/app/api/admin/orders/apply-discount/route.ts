// src/app/api/admin/orders/apply-discount/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth-server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type ApplyDiscountBody = {
  order_id: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  reason: string;
};

export async function POST(req: Request) {
  const guard = await requireAdmin();
if (guard instanceof NextResponse) return guard;

if (guard.role !== "owner") {
  return NextResponse.json({ message: "Akses ditolak. Hanya Owner yang bisa diskon." }, { status: 403 });
}

const admin = guard;

  try {
    const body = (await req.json()) as ApplyDiscountBody;

    if (!body.order_id || !body.discount_type || !body.discount_value || !body.reason) {
      return NextResponse.json({ message: "Field tidak lengkap" }, { status: 400 });
    }
    if (body.discount_value <= 0) {
      return NextResponse.json({ message: "Nilai diskon harus lebih dari 0" }, { status: 400 });
    }
    if (body.reason.trim().length < 5) {
      return NextResponse.json({ message: "Alasan diskon minimal 5 karakter" }, { status: 400 });
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", body.order_id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ message: "Order tidak ditemukan" }, { status: 404 });
    }

    if (order.payment_status === "paid") {
      return NextResponse.json({ message: "Tidak bisa memberi diskon pada order yang sudah dibayar" }, { status: 400 });
    }

    const originalAmount = order.original_amount || order.total_amount;
    let newDiscountAmount = 0;
    
    if (body.discount_type === "percentage") {
      newDiscountAmount = (originalAmount * body.discount_value) / 100;
    } else {
      newDiscountAmount = body.discount_value;
    }

    if (newDiscountAmount > originalAmount) {
      newDiscountAmount = originalAmount;
    }
    
    const finalAmount = originalAmount - newDiscountAmount;

    const { error: discountError } = await supabaseAdmin
      .from("manual_discounts")
      .insert({
        order_id: body.order_id,
        discount_type: body.discount_type,
        discount_value: body.discount_value,
        discount_amount: newDiscountAmount,
        reason: body.reason.trim(),
        
        applied_by: admin.id,     
        applied_by_role: admin.role,
      });

    if (discountError) {
      console.error("Failed to create discount record:", discountError);
      return NextResponse.json({ message: "Gagal menyimpan record diskon" }, { status: 500 });
    }

    const { error: updateError } = await supabaseAdmin
      .from("orders")
      .update({
        original_amount: originalAmount,
        discount_amount: newDiscountAmount,
        total_amount: finalAmount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", body.order_id);

    if (updateError) {
      console.error("Failed to update order:", updateError);
      return NextResponse.json({ message: "Gagal update order" }, { status: 500 });
    }

    return NextResponse.json({
      message: "Diskon berhasil diterapkan",
      original_amount: originalAmount,
      discount_amount: newDiscountAmount,
      final_amount: finalAmount,
    });

  } catch (error) {
    console.error("Apply discount error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}