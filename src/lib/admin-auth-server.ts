import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAdminCookieName, getExpectedCookieValue } from "@/lib/admin-auth";

export async function requireAdmin(): Promise<NextResponse | null> {
  const cookieStore = await cookies(); // <-- penting (karena Promise)
  const cookieName = getAdminCookieName();

  const expected = await getExpectedCookieValue();
  if (!expected) {
    return NextResponse.json(
      { message: "ADMIN_PIN belum diset di env" },
      { status: 500 }
    );
  }

  const current = cookieStore.get(cookieName)?.value ?? "";
  if (current !== expected) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  return null;
}
