export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type Body = {
  orderId: string;
  status: "received" | "preparing" | "served" | "completed";
};

export async function POST(req: Request) {
  const body = (await req.json()) as Body;

  if (!body.orderId || !body.status) {
    return NextResponse.json({ message: "orderId & status wajib" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("orders")
    .update({ fulfillment_status: body.status })
    .eq("id", body.orderId);

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
