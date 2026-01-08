import OwnerDashboardClient from "./OwnerDashboardClient";
import { getAdminRolePage } from "@/lib/admin-auth-page";
import { redirect } from "next/navigation";

export default async function OwnerPage() {
  const role = await getAdminRolePage();
  if (role !== "owner") redirect("/admin/kasir");
  return <OwnerDashboardClient />;
}
