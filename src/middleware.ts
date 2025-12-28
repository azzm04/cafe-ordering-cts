import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminCookieName, getExpectedCookieValue } from "@/lib/admin-auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/admin/login") return NextResponse.next();

  if (pathname.startsWith("/admin")) {
    const cookie = req.cookies.get(getAdminCookieName())?.value ?? "";
    const expected = await getExpectedCookieValue();

    if (!expected || cookie !== expected) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
