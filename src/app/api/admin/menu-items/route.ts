// src/app/api/admin/menu-items/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth-server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type CategoryRow = {
  id: string;
  name: string;
  parent_id: string | null;
};

type MenuItemRow = {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  is_archived: boolean; 
  created_at: string;
  variant_group: string | null;
};

type MenuItemWithCategory = MenuItemRow & {
  categories: CategoryRow[]; // sesuai yang kamu pakai
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

export async function GET(req: Request) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;


  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const availableParam = searchParams.get("available"); // "1" | "0" | null

  const archivedParam = searchParams.get("archived"); // "1" | "0" | null

  let query = supabaseAdmin
    .from("menu_items")
    .select(
      `
      id,
      category_id,
      name,
      description,
      price,
      image_url,
      is_available,
      is_archived,
      created_at,
      variant_group,
      categories!menu_items_category_id_fkey (
        id,
        name,
        parent_id
      )
    `
    )
    .order("created_at", { ascending: false });

  // default: hanya yang is_archived = false
  if (archivedParam === "1") {
    query = query.eq("is_archived", true);
  } else if (archivedParam === "0") {
    query = query.eq("is_archived", false);
  } else {
    query = query.eq("is_archived", false);
  }

  if (availableParam === "1") query = query.eq("is_available", true);
  if (availableParam === "0") query = query.eq("is_available", false);

  if (q.length > 0) query = query.ilike("name", `%${q}%`);

  const { data, error } = await query;

  if (error) return jsonNoStore({ message: error.message }, { status: 500 });

  const items = (data ?? []) as MenuItemWithCategory[];
  return jsonNoStore({ items });
}
