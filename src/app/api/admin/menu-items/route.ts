export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

type MenuRow = {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  created_at: string;
  categories: { name: string } | null;
};

export async function GET() {
  const { data, error } = await supabaseServer
    .from("menu_items")
    .select("id, category_id, name, description, price, image_url, is_available, created_at, categories(name)")
    .eq("is_available", true)
    .order("created_at", { ascending: false })
    .returns<MenuRow[]>();

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  return NextResponse.json({ items: data ?? [] });
}
