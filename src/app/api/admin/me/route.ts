// src/app/api/admin/me/route.ts
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth-server";

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json({ role: auth.role });
}
