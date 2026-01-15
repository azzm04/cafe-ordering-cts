import { redirect } from "next/navigation";
import { getAdminRolePage } from "@/lib/admin-auth-page";

export default async function AdminIndexPage() {
  const role = await getAdminRolePage();

  if (role === "owner") redirect("/admin/owner");
  if (role === "kasir") redirect("/admin/kasir");

  redirect("/admin/login");
}
