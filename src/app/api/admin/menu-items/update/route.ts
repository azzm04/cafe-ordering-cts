export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type Body = {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  isAvailable: boolean;
};

export async function POST(req: Request) {
  const body = (await req.json()) as Body;

  const id = (body.id ?? "").trim();
  const categoryId = (body.categoryId ?? "").trim();
  const name = (body.name ?? "").trim();

  if (!id) return NextResponse.json({ message: "id required" }, { status: 400 });
  if (!categoryId) return NextResponse.json({ message: "categoryId required" }, { status: 400 });
  if (!name) return NextResponse.json({ message: "name required" }, { status: 400 });

  const price = Number(body.price);
  if (!Number.isFinite(price) || price < 0) {
    return NextResponse.json({ message: "price invalid" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("menu_items")
    .update({
      category_id: categoryId,
      name,
      description: body.description?.trim() ? body.description.trim() : null,
      price,
      image_url: body.imageUrl?.trim() ? body.imageUrl.trim() : null,
      is_available: Boolean(body.isAvailable),
    })
    .eq("id", id);

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
