export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth-server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type Body = { id?: string };

function jsonNoStore(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "CDN-Cache-Control": "no-store",
      "Vercel-CDN-Cache-Control": "no-store",
      ...(init?.headers ?? {}),
    },
  });
}

export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return jsonNoStore({ message: "Body JSON tidak valid" }, { status: 400 });
  }

  const id = String(body.id ?? "").trim();
  if (!id) return jsonNoStore({ message: "id wajib diisi" }, { status: 400 });

  // Soft delete / archive
  const { data, error } = await supabaseAdmin
    .from("menu_items")
    .update({
      is_archived: true,
      is_available: false,
    })
    .eq("id", id)
    .select("id, is_archived, is_available")
    .single();

  if (error) {
    return jsonNoStore(
      { message: "Gagal arsipkan menu", details: error.message },
      { status: 500 }
    );
  }

  return jsonNoStore({
    ok: true,
    mode: "archive",
    item: data,
    message: "Menu berhasil diarsipkan.",
  });
}
