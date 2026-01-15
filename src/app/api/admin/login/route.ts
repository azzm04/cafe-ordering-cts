// src/app/api/admin/login/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAdminCookieName, getAdminByPin, signAdminSession } from "@/lib/admin-auth";

type LoginBody = { pin?: unknown };

export async function POST(req: Request) {
  const body: LoginBody = await req.json().catch(() => ({}));
  const pin = typeof body.pin === "string" ? body.pin : "";

  // Cek PIN ke Database
  const adminUser = await getAdminByPin(pin);
  
  if (!adminUser) {
    return NextResponse.json({ message: "PIN salah atau akun tidak aktif" }, { status: 401 });
  }

  // Buat Session dengan Data Lengkap (ID & Username)
  const token = await signAdminSession({
    id: adminUser.id,
    username: adminUser.username,
    role: adminUser.role,
  });

  // Set Cookie
  const cookieStore = await cookies();
  cookieStore.set(getAdminCookieName(), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, 
  });

  return NextResponse.json({ ok: true, role: adminUser.role });
}