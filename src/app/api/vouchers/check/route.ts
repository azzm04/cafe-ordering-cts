// src/app/api/vouchers/check/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { code, totalAmount } = await req.json();

    if (!code) {
      return NextResponse.json({ message: "Kode voucher harus diisi" }, { status: 400 });
    }

    const { data: voucher, error } = await supabaseAdmin
      .from("vouchers")
      .select("*")
      .eq("code", code.toUpperCase()) // Case insensitive
      .eq("is_active", true)
      .single();

    if (error || !voucher) {
      return NextResponse.json({ 
        message: "Kode voucher tidak ditemukan. Coba cek ejaannya lagi ya!" 
      }, { status: 404 });
    }

    if (totalAmount < (voucher.min_order_amount || 0)) {
      const kurang = (voucher.min_order_amount || 0) - totalAmount;
      return NextResponse.json({ 
        message: `Kurang Rp ${kurang.toLocaleString("id-ID")} lagi untuk pakai voucher ini.` 
      }, { status: 400 });
    }

    let discountAmount = 0;
    if (voucher.type === "percentage") {
      discountAmount = (totalAmount * voucher.value) / 100;
      // Cek Max Discount (Cap)
      if (voucher.max_discount && discountAmount > voucher.max_discount) {
        discountAmount = voucher.max_discount;
      }
    } else {
      // Fixed amount
      discountAmount = voucher.value;
    }

    if (discountAmount > totalAmount) {
      discountAmount = totalAmount;
    }

    return NextResponse.json({
      success: true,
      code: voucher.code,
      discountAmount: discountAmount,
      finalAmount: totalAmount - discountAmount,
      message: "Voucher berhasil dipasang!"
    });

  } catch (error) {
    console.error("Error checking voucher:", error);
    return NextResponse.json({ message: "Terjadi kesalahan server" }, { status: 500 });
  }
}