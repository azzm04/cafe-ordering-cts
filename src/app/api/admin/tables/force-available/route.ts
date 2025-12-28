export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type Body = { tableNumber: number };

export async function POST(req: Request) {
  const body = (await req.json()) as Body;
  const tableNumber = body?.tableNumber;

  if (!tableNumber) return NextResponse.json({ message: "tableNumber required" }, { status: 400 });

  const { error } = await supabaseAdmin
    .from("tables")
    .update({ status: "available" })
    .eq("table_number", tableNumber);

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
