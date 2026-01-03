// src/app/api/admin/login/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAdminCookieName, getRoleByPin, signAdminSession } from "@/lib/admin-auth";

type LoginBody = { pin?: unknown };

export async function POST(req: Request) {
  const body: LoginBody = await req.json().catch(() => ({}));
  const pin = typeof body.pin === "string" ? body.pin : "";

  const role = getRoleByPin(pin);
  if (!role) {
    return NextResponse.json({ message: "PIN salah" }, { status: 401 });
  }

  const token = await signAdminSession({ role });

  const cookieStore = await cookies();
  cookieStore.set(getAdminCookieName(), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 hari
  });

  return NextResponse.json({ ok: true, role });
}
