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
  created_at: string;
  variant_group: string | null;
};

type MenuItemWithCategory = MenuItemRow & {
  categories: CategoryRow [];
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
  if (guard) return guard;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const availableParam = searchParams.get("available"); // "1" | "0" | null

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

  // admin: tampilkan semua; tapi boleh filter kalau diminta
  if (availableParam === "1") query = query.eq("is_available", true);
  if (availableParam === "0") query = query.eq("is_available", false);

  if (q.length > 0) {
    // cari dari nama
    query = query.ilike("name", `%${q}%`);
  }

  const { data, error } = await query;

  if (error) return jsonNoStore({ message: error.message }, { status: 500 });

  const items: MenuItemWithCategory[] = (data ?? []) as MenuItemWithCategory[];

  return jsonNoStore({ items });
}
