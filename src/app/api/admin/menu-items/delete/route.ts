export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type Body = { id: string };

export async function POST(req: Request) {
  const body = (await req.json()) as Body;
  const id = (body.id ?? "").trim();

  if (!id) return NextResponse.json({ message: "id required" }, { status: 400 });

  const { error } = await supabaseAdmin.from("menu_items").delete().eq("id", id);

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
