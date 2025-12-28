export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth-server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { PostgrestError } from "@supabase/supabase-js";

type DeleteBody = { id: string };

export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (guard) return guard;

  let body: DeleteBody;
  try {
    body = (await req.json()) as DeleteBody;
  } catch {
    return NextResponse.json({ message: "Body JSON tidak valid" }, { status: 400 });
  }

  const id = (body.id ?? "").trim();
  if (!id) return NextResponse.json({ message: "id wajib diisi" }, { status: 400 });

  const used = await supabaseAdmin
    .from("order_items")
    .select("id")
    .eq("menu_item_id", id)
    .limit(1);

  if (used.error) {
    return NextResponse.json(
      { message: "Gagal cek relasi order_items", details: used.error.message },
      { status: 500 }
    );
  }

  const isUsed = (used.data?.length ?? 0) > 0;

  if (isUsed) {
    const upd = await supabaseAdmin
      .from("menu_items")
      .update({ is_available: false })
      .eq("id", id)
      .select("id")
      .single();

    if (upd.error) {
      return NextResponse.json(
        { message: "Gagal arsipkan menu", details: upd.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      mode: "soft",
      message: "Menu sudah pernah dipakai, jadi diarsipkan (set habis).",
    });
  }

  const del = await supabaseAdmin.from("menu_items").delete().eq("id", id);
  const err = del.error as PostgrestError | null;

  if (err) {
    return NextResponse.json({ message: "Gagal hapus menu", details: err.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, mode: "hard", message: "Menu dihapus permanen." });
}
