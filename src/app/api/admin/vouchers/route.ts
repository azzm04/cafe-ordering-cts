// src/app/api/admin/vouchers/route.ts
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth-server"; 

// GET: Ambil daftar voucher
export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { data, error } = await supabaseAdmin
    .from("vouchers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  return NextResponse.json(data);
}

// POST: Tambah Voucher Baru
export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  // Pastikan hanya Owner yang bisa tambah voucher
  if (auth.role !== "owner") {
    return NextResponse.json({ message: "Akses ditolak. Hanya Owner bisa buat voucher." }, { status: 403 });
  }

  try {
    const body = await req.json();
    
    // Validasi input sederhana
    if (!body.code || !body.type || !body.value) {
      return NextResponse.json({ message: "Data tidak lengkap" }, { status: 400 });
    }

    // Insert ke DB
    const { data, error } = await supabaseAdmin
      .from("vouchers")
      .insert({
        code: body.code.toUpperCase(), // Paksa huruf besar
        type: body.type,
        value: Number(body.value),
        min_order_amount: Number(body.min_order_amount || 0),
        max_discount: body.max_discount ? Number(body.max_discount) : null,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      // Handle jika kode kembar
      if (error.code === "23505") { // Kode unique constraint violation di Postgres
        return NextResponse.json({ message: "Kode voucher sudah ada!" }, { status: 409 });
      }
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ message: "Terjadi kesalahan server" }, { status: 500 });
  }
}

// DELETE: Hapus Voucher
export async function DELETE(req: Request) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  
  if (auth.role !== "owner") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ message: "ID required" }, { status: 400 });

  const { error } = await supabaseAdmin.from("vouchers").delete().eq("id", id);
  
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  return NextResponse.json({ message: "Voucher dihapus" });
}