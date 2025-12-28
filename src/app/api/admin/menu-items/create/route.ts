export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type Body = {
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  isAvailable: boolean;
};

export async function POST(req: Request) {
  const body = (await req.json()) as Body;

  const categoryId = (body.categoryId ?? "").trim();
  const name = (body.name ?? "").trim();

  if (!categoryId) return NextResponse.json({ message: "categoryId required" }, { status: 400 });
  if (!name) return NextResponse.json({ message: "name required" }, { status: 400 });

  const price = Number(body.price);
  if (!Number.isFinite(price) || price < 0) {
    return NextResponse.json({ message: "price invalid" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("menu_items")
    .insert({
      category_id: categoryId,
      name,
      description: body.description?.trim() ? body.description.trim() : null,
      price,
      image_url: body.imageUrl?.trim() ? body.imageUrl.trim() : null,
      is_available: Boolean(body.isAvailable),
    })
    .select("id")
    .single<{ id: string }>();

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, id: data.id });
}
