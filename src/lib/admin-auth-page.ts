// src/lib/admin-auth-page.ts
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminCookieName, verifyAdminSession } from "@/lib/admin-auth";

export async function requireOwnerPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(getAdminCookieName())?.value ?? "";
  const session = await verifyAdminSession(token);

  if (!session) redirect("/admin/login");
  if (session.role !== "owner") redirect("/admin"); // kasir balik ke dashboard admin

  return { role: "owner" as const };
}

export async function getAdminRolePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(getAdminCookieName())?.value ?? "";
  const session = await verifyAdminSession(token);
  return session?.role ?? null;
}
