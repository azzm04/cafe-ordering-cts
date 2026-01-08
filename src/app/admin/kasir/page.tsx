import { getAdminRolePage } from "@/lib/admin-auth-page";
import { redirect } from "next/navigation";
import AdminKasirDashboardClient from "./ui";

export default async function KasirPage() {
  const role = await getAdminRolePage();
  if (!role) redirect("/admin/login");

  return <AdminKasirDashboardClient />;
}
