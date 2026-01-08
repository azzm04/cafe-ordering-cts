export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { checkCartAvailability, type CartItem } from "@/lib/inventory/index";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { items?: CartItem[] };
    const items = Array.isArray(body?.items) ? body.items : [];

    if (items.length === 0) {
      return NextResponse.json({ message: "items required" }, { status: 400 });
    }

    const res = await checkCartAvailability(items);

    return NextResponse.json(res);
  } catch (e: unknown) {
    return NextResponse.json({ message: "Server error", details: String(e) }, { status: 500 });
  }
}