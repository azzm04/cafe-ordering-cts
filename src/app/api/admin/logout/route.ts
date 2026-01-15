import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAdminCookieName } from "@/lib/admin-auth";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.set(getAdminCookieName(), "", { path: "/", maxAge: 0 });
  return NextResponse.json({ ok: true });
}
