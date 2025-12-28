export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getAdminCookieName, getExpectedCookieValue, hashPin } from "@/lib/admin-auth";

type Body = { pin: string };

export async function POST(req: Request) {
  const body = (await req.json()) as Body;
  const pin = (body?.pin ?? "").trim();

  if (!process.env.ADMIN_PIN) {
    return NextResponse.json({ message: "ADMIN_PIN not set" }, { status: 500 });
  }

  const expected = await getExpectedCookieValue();
  const hashed = await hashPin(pin);

  if (hashed !== expected) {
    return NextResponse.json({ message: "PIN salah" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: getAdminCookieName(),
    value: expected,
    httpOnly: true,
    sameSite: "lax",
    secure: false, // true di production https
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return res;
}
