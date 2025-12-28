"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCartStore } from "@/store/cartStore";
import { formatRupiah } from "@/lib/utils";

type MenuItemWithCategory = {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  created_at: string;
  categories: { name: string } | null;
};

export default function MenuPage() {
  const tableNumber = useCartStore((s) => s.tableNumber);
  const addItem = useCartStore((s) => s.addItem);
  const itemCount = useCartStore((s) => s.getItemCount());

  const [items, setItems] = useState<MenuItemWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"Makanan" | "Minuman">("Makanan");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/menu-items?t=${Date.now()}`, { cache: "no-store" });
      const text = await res.text();
      const json: unknown = text ? JSON.parse(text) : null;

      if (!res.ok) {
        const msg =
          typeof json === "object" && json !== null && "message" in json
            ? String((json as Record<string, unknown>).message)
            : "Gagal ambil menu";
        throw new Error(msg);
      }

      const payload = json as { items: MenuItemWithCategory[] };
      setItems(payload.items ?? []);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  // ✅ Filter berdasarkan nama kategori (bukan UUID)
  const filtered = useMemo(() => {
    const want = tab.toLowerCase();
    return items.filter((it) => (it.categories?.name ?? "").toLowerCase() === want);
  }, [items, tab]);

  return (
    <main className="mx-auto min-h-screen max-w-md p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold">Menu</h2>
          <p className="text-sm opacity-80">Meja {tableNumber ?? "-"}</p>
        </div>

        <Link href="/keranjang">
          <Button variant="secondary">Keranjang ({itemCount})</Button>
        </Link>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v === "Minuman" ? "Minuman" : "Makanan")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="Makanan">Makanan</TabsTrigger>
          <TabsTrigger value="Minuman">Minuman</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="space-y-3 mt-3">
          {loading ? (
            <p className="text-sm opacity-70">Loading menu...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm opacity-70">Menu kosong / tidak tersedia.</p>
          ) : (
            filtered.map((it) => (
              <Card key={it.id} className="p-4 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="font-semibold">{it.name}</div>
                  {it.description ? <div className="text-sm opacity-70">{it.description}</div> : null}
                  <div className="text-sm font-medium">{formatRupiah(it.price)}</div>
                </div>

                <Button
                  onClick={() =>
                    addItem({
                      id: it.id,
                      name: it.name,
                      price: it.price,
                      quantity: 1,
                      image_url: it.image_url ?? undefined,
                    })
                  }
                >
                  Tambah
                </Button>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </main>
  );
}
