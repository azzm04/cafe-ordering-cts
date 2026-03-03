import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = process.env.ADMIN_COOKIE_NAME ?? "cts_admin";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip untuk halaman login
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  // Proteksi semua route /admin/*
  if (pathname.startsWith("/admin")) {
    const token = req.cookies.get(COOKIE_NAME)?.value ?? "";

    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }

    // Tambah headers untuk disable browser cache
    const response = NextResponse.next();
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    response.headers.set("Surrogate-Control", "no-store");
    
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};