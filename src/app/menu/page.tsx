"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  variant_group?: string | null;
  categories: {
    name: string;
    parent_id: string | null;
    parent_category?: {
      name: string;
    } | null;
  } | null;
};

type Tab = "Makanan" | "Minuman";

// ✅ Hardcoded parent category IDs - cek di database Anda!
const PARENT_CATEGORY_ID = {
  Makanan: "f3274eb8-d206-4591-a1f5-855981748ee0",
  Minuman: "e045633e-b497-4169-9cc3-69aca2a42f31",
} as const;

export default function MenuPage() {
  const tableNumber = useCartStore((s) => s.tableNumber);
  const addItem = useCartStore((s) => s.addItem);
  const itemCount = useCartStore((s) => s.getItemCount());

  const [tab, setTab] = useState<Tab>("Makanan");
  const [items, setItems] = useState<MenuItemWithCategory[]>([]);
  const [allItems, setAllItems] = useState<MenuItemWithCategory[]>([]); // ✅ Simpan semua items
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [selectedVariant, setSelectedVariant] = useState("");

  const categoryId = PARENT_CATEGORY_ID[tab];

  async function loadMenu(params?: { search?: string; variant?: string }) {
    setLoading(true);
    try {
      const sp = new URLSearchParams();
      sp.set("category_id", categoryId);
      if (params?.search && params.search.trim().length > 0) {
        sp.set("q", params.search.trim());
      }
      if (params?.variant && params.variant.trim().length > 0) {
        sp.set("variant", params.variant.trim());
      }

      const res = await fetch(`/api/menu-items?${sp.toString()}`, { 
        cache: "no-store" 
      });
      
      const json: unknown = await res.json();

      if (!res.ok) {
        const msg =
          typeof json === "object" && json !== null && "message" in json
            ? String((json as { message: unknown }).message)
            : "Gagal ambil menu";
        throw new Error(msg);
      }

      const payload = json as { items: MenuItemWithCategory[] };
      const loadedItems = payload.items ?? [];
      
      setItems(loadedItems);
      
      // ✅ Simpan semua items jika tidak ada filter (untuk generate chip)
      if (!params?.search && !params?.variant) {
        setAllItems(loadedItems);
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  // Reload saat ganti tab
  useEffect(() => {
    setSelectedVariant("");
    setQ("");
    void loadMenu({ search: "", variant: "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // Reload saat search / variant berubah (debounce)
  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadMenu({ search: q, variant: selectedVariant });
    }, 250);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, selectedVariant]);

  // ✅ Ambil daftar variant_group dari SEMUA items (bukan yang ter-filter)
  const variantGroups = useMemo(() => {
    const set = new Set<string>();
    for (const item of allItems) {
      if (item.variant_group && item.variant_group.trim().length > 0) {
        set.add(item.variant_group.trim());
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [allItems]);

  return (
    <main className="mx-auto min-h-screen max-w-md p-6 space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Menu</h1>
          <p className="text-sm opacity-80">Meja {tableNumber ?? "-"}</p>
        </div>

        <Link href="/keranjang">
          <Button variant="secondary">Keranjang ({itemCount})</Button>
        </Link>
      </header>

      {/* Tabs utama: Makanan / Minuman */}
      <div className="rounded-xl bg-muted p-1 flex">
        <button
          type="button"
          onClick={() => setTab("Makanan")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
            tab === "Makanan" ? "bg-background shadow" : "opacity-80 hover:opacity-100"
          }`}
        >
          Makanan
        </button>
        <button
          type="button"
          onClick={() => setTab("Minuman")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
            tab === "Minuman" ? "bg-background shadow" : "opacity-80 hover:opacity-100"
          }`}
        >
          Minuman
        </button>
      </div>

      {/* Search */}
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Cari menu..."
      />

      {/* ✅ Chip Sub-kategori (variant_group) */}
      {variantGroups.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          <Button
            variant={selectedVariant === "" ? "default" : "secondary"}
            size="sm"
            onClick={() => setSelectedVariant("")}
          >
            Semua
          </Button>

          {variantGroups.map((vg) => (
            <Button
              key={vg}
              variant={selectedVariant === vg ? "default" : "secondary"}
              size="sm"
              onClick={() => setSelectedVariant(vg)}
            >
              {vg}
            </Button>
          ))}
        </div>
      )}

      {/* List Menu */}
      {loading ? (
        <p className="text-sm opacity-70">Loading menu...</p>
      ) : items.length === 0 ? (
        <p className="text-sm opacity-70">Menu kosong / tidak tersedia.</p>
      ) : (
        <div className="space-y-3">
          {items.map((it) => (
            <div key={it.id} className="rounded-xl border p-4 space-y-2">
              <div className="space-y-1">
                <div className="text-base font-semibold">{it.name}</div>
                
                {it.description && (
                  <div className="text-sm opacity-70">{it.description}</div>
                )}
                
                {it.variant_group && (
                  <div className="text-xs text-muted-foreground">
                    {it.variant_group}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">
                  {formatRupiah(it.price)}
                </div>

                <Button
                  onClick={() => {
                    addItem({
                      id: it.id,
                      name: it.name,
                      price: it.price,
                      quantity: 1,
                      image_url: it.image_url ?? undefined,
                    });
                    toast.success("Ditambahkan ke keranjang");
                  }}
                >
                  Tambah
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}