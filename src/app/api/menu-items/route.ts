import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category_id = searchParams.get("category_id");

  let query = supabaseServer
    .from("menu_items")
    .select("*")
    .eq("is_available", true)
    .order("name", { ascending: true });

  if (category_id) query = query.eq("category_id", category_id);

  const { data, error } = await query;
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  return NextResponse.json({ menu_items: data });
}
