export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth-server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// 1. Definisikan tipe data hasil query
// Karena kita men-select menu_items(name), bentuknya adalah nested object
type MenuRecipeResult = {
  menu_items: {
    name: string;
  } | null;
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

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  // Await params in Next.js 15+
  const params = await context.params;
  const { id } = params;

  if (!id) {
    return jsonNoStore({ message: "Missing ingredient id" }, { status: 400 });
  }

  // find menu names that use this ingredient via menu_recipes -> menu_items
  const { data, error } = await supabaseAdmin
    .from("menu_recipes")
    .select("menu_items(name)")
    .eq("ingredient_id", id);

  if (error) {
    return jsonNoStore({ message: error.message }, { status: 500 });
  }

  // 2. Casting 'data' ke tipe array yang sudah kita buat
  const rows = data as unknown as MenuRecipeResult[];

  const names = Array.isArray(rows)
    ? rows
        .map((r) => r.menu_items?.name)
        // 3. Type Guard: Pastikan hasil filter dianggap sebagai string oleh TS
        .filter((n): n is string => Boolean(n))
        // Dedupe
        .filter((v, i, a) => a.indexOf(v) === i)
    : [];

  return jsonNoStore({ menu_names: names });
}