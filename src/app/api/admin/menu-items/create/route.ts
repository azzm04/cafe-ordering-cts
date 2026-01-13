// src/app/api/admin/menu-items/create/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth-server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type CreateBody = {
  categoryId: string;
  name: string;
  price: number;
  hpp?: number; 
  description?: string;
  imageUrl?: string;
  isAvailable: boolean;
  variantGroup?: string | null;
};

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

function isCreateBody(x: unknown): x is CreateBody {
  if (typeof x !== "object" || x === null) return false;
  const r = x as Record<string, unknown>;
  return (
    typeof r.categoryId === "string" &&
    typeof r.name === "string" &&
    typeof r.price === "number" &&
    (r.hpp === undefined || typeof r.hpp === "number") && 
    typeof r.isAvailable === "boolean" &&
    (r.description === undefined || typeof r.description === "string") &&
    (r.imageUrl === undefined || typeof r.imageUrl === "string") &&
    (r.variantGroup === undefined ||
      r.variantGroup === null ||
      typeof r.variantGroup === "string")
  );
}

export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return jsonNoStore({ message: "Body JSON tidak valid" }, { status: 400 });
  }

  if (!isCreateBody(raw)) {
    return jsonNoStore({ message: "Body create tidak valid" }, { status: 400 });
  }

  const categoryId = raw.categoryId.trim();
  const name = raw.name.trim();
  const price = Number(raw.price);

  if (!categoryId) return jsonNoStore({ message: "categoryId required" }, { status: 400 });
  if (!name) return jsonNoStore({ message: "name required" }, { status: 400 });
  if (!Number.isFinite(price) || price < 0) {
    return jsonNoStore({ message: "price invalid" }, { status: 400 });
  }

  const insertPayload: {
    category_id: string;
    name: string;
    price: number;
    hpp: number; 
    description: string | null;
    image_url: string | null;
    is_available: boolean;
    variant_group: string | null;
  } = {
    category_id: categoryId,
    name,
    price,
    hpp: raw.hpp ? Number(raw.hpp) : 0, 
    description: raw.description?.trim() ? raw.description.trim() : null,
    image_url: raw.imageUrl?.trim() ? raw.imageUrl.trim() : null,
    is_available: Boolean(raw.isAvailable),
    variant_group: raw.variantGroup?.trim() ? raw.variantGroup.trim() : null,
  };

  const { data, error } = await supabaseAdmin
    .from("menu_items")
    .insert(insertPayload)
    .select("id")
    .single();

  if (error) return jsonNoStore({ message: error.message }, { status: 500 });

  return jsonNoStore({ ok: true, id: data.id });
}