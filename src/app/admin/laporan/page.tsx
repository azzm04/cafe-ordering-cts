import { requireOwnerPage } from "@/lib/admin-auth-page";
import AdminLaporanClient from "@/components/admin/AdminLaporanClient";

export const dynamic = "force-dynamic";

export default async function AdminLaporanPage() {
  await requireOwnerPage(); 
  return <AdminLaporanClient />;
}
