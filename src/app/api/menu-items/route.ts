export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import type { MenuItem } from "@/types";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("category_id");

  const q = supabaseServer
    .from("menu_items")
    .select("*")
    .eq("is_available", true)
    .order("created_at", { ascending: false });

  const q2 = categoryId ? q.eq("category_id", categoryId) : q;

  const { data, error } = await q2.returns<MenuItem[]>();

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ items: data ?? [] });
}
