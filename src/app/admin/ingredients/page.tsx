import Link from "next/link";
import { cookies } from "next/headers";
import { getAdminCookieName } from "@/lib/admin-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import IngredientsList from "@/components/admin/IngredientsList";

export const dynamic = "force-dynamic";

async function getIngredients(q: string, status: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get(getAdminCookieName())?.value ?? "";

  const qs = new URLSearchParams();
  if (q) qs.set("q", q);
  if (status) qs.set("status", status);

  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/ingredients?${qs.toString()}`, {
    headers: { Cookie: `${getAdminCookieName()}=${token}` },
    cache: "no-store",
  });

  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j?.message ?? "Failed fetch ingredients");
  }
  return (await res.json()) as {
    items: Array<{
      id: string;
      name: string;
      unit: string;
      current_stock: number;
      min_stock: number;
      stock_status: "out_of_stock" | "low_stock" | "normal";
      used_in_menu_count: number;
      active_alerts: number;
    }>;
  };
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
    <main className="p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kelola Bahan Baku</h1>
          <p className="text-sm text-muted-foreground">
            Monitor stok bahan baku & lakukan restock.
          </p>
        </div>
        <Link href="/admin">
          <Button>Kembali</Button>
        </Link>
        <Link href="/admin/ingredients/add">
          <Button>+ Tambah Bahan</Button>
        </Link>
      </div>

      <Card className="p-4">
        <IngredientsList initialItems={data.items} initialQ={q} initialStatus={status} />
      </Card>
    </main>
  );
}
