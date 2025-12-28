export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { MenuItem } from "@/types";

type Row = MenuItem & {
  categories?: { name: string } | null;
};

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("menu_items")
    .select("*, categories(name)")
    .order("created_at", { ascending: false })
    .returns<Row[]>();

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  return NextResponse.json({ items: data ?? [] });
}
