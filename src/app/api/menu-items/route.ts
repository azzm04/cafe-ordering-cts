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

type MenuItemEnriched = Omit<MenuItemRaw, "categories"> & {
  categories:
    | (Category & {
        parent_category: { name: string } | null;
      })
    | null;
};

function jsonNoStore<T>(data: T, init?: number | ResponseInit) {
  const responseInit: ResponseInit =
    typeof init === "number" ? { status: init } : init ?? {};

  return NextResponse.json(data, {
    ...responseInit,
    headers: {
      ...(responseInit.headers ?? {}),
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const parentCategoryId = searchParams.get("category_id");
  const q = searchParams.get("q");
  const variant = searchParams.get("variant");

  let query = supabaseServer
    .from("menu_items")
    .select(
      `
      *,
      categories!menu_items_category_id_fkey (
        id,
        name,
        parent_id
      )
    `
    )
    .eq("is_available", true)
    .order("created_at", { ascending: false });

  if (parentCategoryId) {
    const { data: childCategories, error: childErr } = await supabaseServer
      .from("categories")
      .select("id")
      .eq("parent_id", parentCategoryId);

    if (childErr) {
      return jsonNoStore<{ message: string }>({ message: childErr.message }, 500);
    }

    if (childCategories && childCategories.length > 0) {
      const childIds = childCategories.map((c) => c.id);
      query = query.in("category_id", childIds);
    } else {
      return jsonNoStore<{ items: MenuItemEnriched[] }>({ items: [] });
    }
  }

  if (variant) query = query.eq("variant_group", variant);
  if (q && q.trim().length > 0) query = query.ilike("name", `%${q.trim()}%`);

  const { data, error } = await query;

  if (error) {
    console.error("Supabase error:", error);
    return jsonNoStore<{ message: string }>({ message: error.message }, 500);
  }

  const rawData = data as MenuItemRaw[] | null;

  if (rawData && rawData.length > 0) {
    const parentIds = [
      ...new Set(
        rawData
          .map((item) => item.categories?.parent_id)
          .filter((id): id is string => id !== null && id !== undefined)
      ),
    ];

    if (parentIds.length > 0) {
      const { data: parents, error: parentErr } = await supabaseServer
        .from("categories")
        .select("id, name")
        .in("id", parentIds);

      if (parentErr) {
        return jsonNoStore<{ message: string }>({ message: parentErr.message }, 500);
      }

      const parentMap = new Map(
        ((parents ?? []) as Array<{ id: string; name: string }>).map((p) => [p.id, p.name])
      );

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

      return jsonNoStore<{ items: MenuItemEnriched[] }>({ items: enrichedData });
    }
  }

  const fallbackData: MenuItemEnriched[] = (rawData ?? []).map((item) => ({
    ...item,
    categories: item.categories
      ? {
          ...item.categories,
          parent_category: null,
        }
      : null,
  }));

  return jsonNoStore<{ items: MenuItemEnriched[] }>({ items: fallbackData });
}
