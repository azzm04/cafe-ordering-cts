export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth-server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type RestoreBody = { id: string };

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
  if (guard) return guard;

  let body: RestoreBody;
  try {
    body = (await req.json()) as RestoreBody;
  } catch {
    return jsonNoStore({ message: "Body JSON tidak valid" }, { status: 400 });
  }

  const id = (body.id ?? "").trim();
  if (!id) return jsonNoStore({ message: "id wajib diisi" }, { status: 400 });

  const { error } = await supabaseAdmin
    .from("menu_items")
    .update({ is_archived: false, is_available: false })
    .eq("id", id);

  if (error) {
    return jsonNoStore({ message: error.message }, { status: 500 });
  }

  return jsonNoStore({ ok: true });
}
