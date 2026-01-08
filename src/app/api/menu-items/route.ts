// src/app/api/menu-items/route.ts
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { computeMaxPortionsForMenus } from "@/lib/inventory/stock-manager";

type Category = {
  id: string;
  name: string;
  parent_id: string | null;
};

type MenuItemDbRow = {
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
  categories: Category[] | null;
};

type MenuItemRaw = Omit<MenuItemDbRow, "categories"> & {
  categories: Category | null;
};

type MenuItemEnriched = Omit<MenuItemRaw, "categories"> & {
  categories:
    | (Category & {
        parent_category: { name: string } | null;
      })
    | null;
  max_portions?: number | null;
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
    .eq("is_available", true)
    .eq("is_archived", false)
    .order("created_at", { ascending: false });

  if (parentCategoryId) {
    const { data: childCategories, error: childErr } = await supabaseServer
      .from("categories")
      .select("id")
      .eq("parent_id", parentCategoryId)
      .returns<Array<{ id: string }>>();

    if (childErr) {
      return jsonNoStore<{ message: string }>({ message: childErr.message }, 500);
    }

    if (childCategories.length > 0) {
      const childIds = childCategories.map((c) => c.id);
      query = query.in("category_id", childIds);
    } else {
      return jsonNoStore<{ items: MenuItemEnriched[] }>({ items: [] });
    }
  }

  if (variant) query = query.eq("variant_group", variant);
  if (q && q.trim().length > 0) query = query.ilike("name", `%${q.trim()}%`);

  const { data, error } = await query.returns<MenuItemDbRow[]>();

  if (error) {
    console.error("Supabase error:", error);
    return jsonNoStore<{ message: string }>({ message: error.message }, 500);
  }

  const dbRows = data ?? [];

  const rawData: MenuItemRaw[] = dbRows.map((row) => ({
    ...row,
    categories: row.categories?.[0] ?? null,
  }));

  // compute max_portions for menus to show to customers
  const menuIds = rawData.map((r) => r.id);
  let maxMap = new Map<string, number | null>();
  try {
    maxMap = await computeMaxPortionsForMenus(menuIds);
  } catch (err) {
    console.error("menu-items: computeMaxPortionsForMenus failed", err);
  }

  if (rawData.length > 0) {
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
        .in("id", parentIds)
        .returns<Array<{ id: string; name: string }>>();

      if (parentErr) {
        return jsonNoStore<{ message: string }>({ message: parentErr.message }, 500);
      }

      const parentMap = new Map(parents.map((p) => [p.id, p.name] as const));

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
        max_portions: maxMap.get(item.id) ?? null,
      }));

      return jsonNoStore<{ items: MenuItemEnriched[] }>({ items: enrichedData });
    }
  }

  const fallbackData: MenuItemEnriched[] = rawData.map((item) => ({
    ...item,
    categories: item.categories
      ? { ...item.categories, parent_category: null }
      : null,
    max_portions: maxMap.get(item.id) ?? null,
  }));

  return jsonNoStore<{ items: MenuItemEnriched[] }>({ items: fallbackData });
}
