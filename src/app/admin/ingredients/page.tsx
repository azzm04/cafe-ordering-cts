import Link from "next/link";
import { cookies } from "next/headers";
import { getAdminCookieName } from "@/lib/admin-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import IngredientsList from "@/components/admin/IngredientsList";

export const dynamic = "force-dynamic";

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

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const res = await fetch(`${baseUrl}/api/admin/ingredients?${qs.toString()}`, {
    headers: { Cookie: `${getAdminCookieName()}=${token}` },
    cache: "no-store",
  });

  if (!res.ok) {
    const j: unknown = await res.json().catch(() => ({}));
    const msg =
      typeof j === "object" && j !== null && "message" in j
        ? String((j as Record<string, unknown>).message)
        : "Failed fetch ingredients";
    throw new Error(msg);
  }

  const json: unknown = await res.json();

  // runtime guard ringan biar aman
  if (
    typeof json !== "object" ||
    json === null ||
    !("items" in json) ||
    !Array.isArray((json as Record<string, unknown>).items)
  ) {
    throw new Error("Invalid response from /api/admin/ingredients");
  }

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
    <main className="p-4 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Kelola Bahan Baku</h1>
          <p className="text-sm text-muted-foreground">
            Monitor stok bahan baku & lakukan restock.
          </p>
        </div>

        <div className="flex gap-2">
          <Link href="/admin/menu">
            <Button variant="outline" className="bg-transparent">
              Kembali
            </Button>
          </Link>

          <Link href="/admin/ingredients/add">
            <Button>+ Tambah Bahan</Button>
          </Link>
        </div>
      </div>

      <Card className="p-4">
        <IngredientsList initialItems={data.items} initialQ={q} initialStatus={status} />
      </Card>
    </main>
  );
}
