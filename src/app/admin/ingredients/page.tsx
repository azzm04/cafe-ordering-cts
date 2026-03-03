import Link from "next/link";
import { cookies } from "next/headers";
import { getAdminCookieName } from "@/lib/admin-auth";
import { Button } from "@/components/ui/button";
import IngredientsList from "@/components/admin/IngredientsList";
import { Plus, ChevronLeft } from "lucide-react"; // Pastikan install lucide-react
import BackgroundDecorations from "@/components/shared/BackgroundDecorations";

export const dynamic = "force-dynamic";

// ... (Biarkan type dan function getIngredients SAMA seperti kode lama Anda) ...
type StockStatus = "out_of_stock" | "low_stock" | "normal";

type IngredientListItem = {
  id: string;
  name: string;
  unit: string;
  current_stock: number;
  min_stock: number;
  stock_status: StockStatus;
  used_in_menu_count: number;
  active_alerts: number;
};

type GetIngredientsResponse = {
  items: IngredientListItem[];
};

async function getIngredients(q: string, status: string): Promise<GetIngredientsResponse> {
  const cookieStore = await cookies();
  const token = cookieStore.get(getAdminCookieName())?.value ?? "";

  const qs = new URLSearchParams();
  if (q) qs.set("q", q);
  if (status) qs.set("status", status);

  // Pastikan URL absolute jika fetch server-side
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"; 
  const res = await fetch(`${baseUrl}/api/admin/ingredients?${qs.toString()}`, {
    headers: { Cookie: `${getAdminCookieName()}=${token}` },
    cache: "no-store",
  });

  if (!res.ok) {
    return { items: [] }; // Fallback aman
  }

  const json = await res.json();
  return json as GetIngredientsResponse;
}

export default async function IngredientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const status = (sp.status ?? "").trim();

  const data = await getIngredients(q, status);

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden">
      <BackgroundDecorations />
      <div className="relative z-10 p-4 sm:p-8 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Bahan Baku</h1>
            <p className="text-muted-foreground">
              Kelola stok inventory, monitoring, dan restock bahan.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/admin/menu">
              <Button variant="outline" size="sm" className="h-9">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Menu
              </Button>
            </Link>

            <Link href="/admin/ingredients/add">
              <Button size="sm" className="h-9 shadow-sm">
                <Plus className="mr-2 h-4 w-4" />
                Tambah Bahan
              </Button>
            </Link>
          </div>
        </div>
      </div>
      {/* Main Content */}
      <IngredientsList initialItems={data.items} initialQ={q} initialStatus={status} />
    </main>
  );
}