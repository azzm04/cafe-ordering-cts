import AdminDashboardClient from "./AdminDashboardClient";
import { getAdminRolePage } from "@/lib/admin-auth-page";

export default async function AdminPage() {
  const role = await getAdminRolePage();
  return <AdminDashboardClient role={role} />;
}
