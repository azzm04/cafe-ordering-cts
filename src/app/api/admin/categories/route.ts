export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type CategoryRow = { id: string; name: string; description: string | null; created_at: string };

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("categories")
    .select("id, name, description, created_at")
    .order("name", { ascending: true })
    .returns<CategoryRow[]>();

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  return NextResponse.json({ categories: data ?? [] });
}
