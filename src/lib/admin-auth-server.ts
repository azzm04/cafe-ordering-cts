// src/lib/admin-auth-server.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAdminCookieName, verifyAdminSession, type AdminRole } from "@/lib/admin-auth";

export async function requireAdmin(): Promise<{ role: AdminRole } | NextResponse> {
  const cookieStore = await cookies();
  const token = cookieStore.get(getAdminCookieName())?.value ?? "";
  const session = await verifyAdminSession(token);

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  return { role: session.role };
}

export async function requireOwner(): Promise<{ role: "owner" } | NextResponse> {
  const res = await requireAdmin();
  if (res instanceof NextResponse) return res;

  if (res.role !== "owner") {
    return NextResponse.json({ message: "Forbidden (owner only)" }, { status: 403 });
  }

  return { role: "owner" };
}
