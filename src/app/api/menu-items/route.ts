export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

type Category = {
  id: string;
  name: string;
  parent_id: string | null;
};

type MenuItemRaw = {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  created_at: string;
  variant_group?: string | null;
  categories: Category | null;
};

type MenuItemEnriched = Omit<MenuItemRaw, 'categories'> & {
  categories: (Category & {
    parent_category: { name: string } | null;
  }) | null;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("category_id");
  const q = searchParams.get("q");
  const variant = searchParams.get("variant");

  // ✅ Query dengan foreign key untuk mendapatkan category
  let query = supabaseServer
    .from("menu_items")
    .select(`
      *,
      categories!menu_items_category_id_fkey (
        id,
        name,
        parent_id
      )
    `)
    .eq("is_available", true)
    .order("created_at", { ascending: false });

  if (categoryId) query = query.eq("category_id", categoryId);
  if (variant) query = query.eq("variant_group", variant);
  if (q && q.trim().length > 0) query = query.ilike("name", `%${q.trim()}%`);

  const { data, error } = await query;

  if (error) {
    console.error("Supabase error:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  const rawData = data as MenuItemRaw[] | null;

  // ✅ Fetch parent categories untuk semua items
  if (rawData && rawData.length > 0) {
    const parentIds = [
      ...new Set(
        rawData
          .map((item) => item.categories?.parent_id)
          .filter((id): id is string => id !== null && id !== undefined)
      ),
    ];

    if (parentIds.length > 0) {
      const { data: parents } = await supabaseServer
        .from("categories")
        .select("id, name")
        .in("id", parentIds);

      const parentMap = new Map(
        (parents as Category[] | null)?.map((p) => [p.id, p.name]) ?? []
      );

      // ✅ Tambahkan parent_category name ke setiap item
      const enrichedData: MenuItemEnriched[] = rawData.map((item) => ({
        ...item,
        categories: item.categories
          ? {
              ...item.categories,
              parent_category: item.categories.parent_id
                ? { name: parentMap.get(item.categories.parent_id) ?? "" }
                : null,
            }
          : null,
      }));

      return NextResponse.json({ items: enrichedData });
    }
  }

  // Fallback jika tidak ada parent_id atau data kosong
  const fallbackData: MenuItemEnriched[] = (rawData ?? []).map((item) => ({
    ...item,
    categories: item.categories
      ? {
          ...item.categories,
          parent_category: null,
        }
      : null,
  }));

  return NextResponse.json({ items: fallbackData });
}