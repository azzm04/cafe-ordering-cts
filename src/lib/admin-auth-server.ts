// src/lib/admin-auth-server.ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAdminCookieName, getExpectedCookieValue } from "@/lib/admin-auth";

export async function isAdminAuthed(): Promise<boolean> {
  const store = await cookies(); // ✅ penting: await
  const cookieName = getAdminCookieName();
  const value = store.get(cookieName)?.value ?? "";

  const expected = await getExpectedCookieValue();
  if (!expected) return false;

  return value === expected;
}

/**
 * Dipakai di route handler admin:
 *   if (!(await requireAdmin())) return NextResponse.json(..., {status:401})
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  const ok = await isAdminAuthed();
  if (ok) return null;

  return NextResponse.json({ message: "Unauthorized (admin only)" }, { status: 401 });
}
