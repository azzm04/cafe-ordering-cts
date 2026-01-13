// src/app/api/admin/menu-items/update/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth-server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type Body = {
  id: string;
  categoryId?: string;
  name?: string;
  description?: string | null;
  price?: number;
  hpp?: number; 
  imageUrl?: string | null;
  isAvailable?: boolean;
  variantGroup?: string | null;
};

type UpdatePayload = {
  category_id?: string;
  name?: string;
  description?: string | null;
  price?: number;
  hpp?: number; 
  image_url?: string | null;
  is_available?: boolean;
  variant_group?: string | null;
};

export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ message: "Body JSON tidak valid" }, { status: 400 });
  }

  const id = (body.id ?? "").trim();
  if (!id) return NextResponse.json({ message: "id required" }, { status: 400 });

  const patch: UpdatePayload = {};

  if (typeof body.categoryId === "string") {
    const v = body.categoryId.trim();
    if (!v) return NextResponse.json({ message: "categoryId required" }, { status: 400 });
    patch.category_id = v;
  }

  if (typeof body.name === "string") {
    const v = body.name.trim();
    if (!v) return NextResponse.json({ message: "name required" }, { status: 400 });
    patch.name = v;
  }

  if (body.description !== undefined) {
    const v = typeof body.description === "string" ? body.description.trim() : "";
    patch.description = v ? v : null;
  }

  if (body.imageUrl !== undefined) {
    const v = typeof body.imageUrl === "string" ? body.imageUrl.trim() : "";
    patch.image_url = v ? v : null;
  }

  if (body.price !== undefined) {
    const price = Number(body.price);
    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json({ message: "price invalid" }, { status: 400 });
    }
    patch.price = price;
  }

  if (body.hpp !== undefined) {
    const hpp = Number(body.hpp);
    if (!Number.isFinite(hpp) || hpp < 0) {
      return NextResponse.json({ message: "hpp invalid" }, { status: 400 });
    }
    patch.hpp = hpp;
  }

  if (body.isAvailable !== undefined) {
    patch.is_available = Boolean(body.isAvailable);
  }

  if (body.variantGroup !== undefined) {
    const v = typeof body.variantGroup === "string" ? body.variantGroup.trim() : "";
    patch.variant_group = v ? v : null; 
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ message: "no fields to update" }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("menu_items").update(patch).eq("id", id);

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}