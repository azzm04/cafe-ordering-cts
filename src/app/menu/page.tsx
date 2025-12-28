"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import type { Category, MenuItem } from "@/types";
import { useCartStore } from "@/store/cartStore";
import { CategoryTabs } from "@/components/CategoryTabs";
import { MenuCard } from "@/components/MenuCard";
import { Button } from "@/components/ui/button";
import { FloatingCartButton } from "@/components/FloatingCartButton";

export default function MenuPage() {
  const tableNumber = useCartStore((s) => s.tableNumber);
  const itemCount = useCartStore((s) => s.getItemCount());

  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState("");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingMenu, setLoadingMenu] = useState(true);

  useEffect(() => {
    if (!tableNumber) return;

    (async () => {
      setLoadingCats(true);
      try {
        const res = await fetch("/api/categories");
        const json = await res.json();
        if (!res.ok) throw new Error(json?.message ?? "Gagal ambil kategori");
        const cats = json.categories ?? [];
        setCategories(cats);
        setActiveCategoryId(cats?.[0]?.id ?? "");
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Error";
        toast.error(message);
      } finally {
        setLoadingCats(false);
      }
    })();
  }, [tableNumber]);

  useEffect(() => {
    if (!activeCategoryId) return;

    (async () => {
      setLoadingMenu(true);
      try {
        const res = await fetch(
          `/api/menu-items?category_id=${activeCategoryId}`
        );
        const json = await res.json();
        if (!res.ok) throw new Error(json?.message ?? "Gagal ambil menu");
        setMenuItems(json.menu_items ?? []);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Error";
        toast.error(message);
      } finally {
        setLoadingMenu(false);
      }
    })();
  }, [activeCategoryId]);

  if (!tableNumber) {
    return (
      <main className="mx-auto min-h-screen max-w-md p-6 space-y-3">
        <p className="text-sm">Kamu belum memilih meja.</p>
        <Link href="/pilih-meja">
          <Button>Pilih Meja</Button>
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-md p-6 pb-24 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold">Menu</h2>
          <p className="text-sm opacity-80">Meja {tableNumber}</p>
        </div>
        <Link href="/keranjang">
          <Button variant="secondary">Keranjang ({itemCount})</Button>
        </Link>
      </div>

      {loadingCats ? (
        <p className="text-sm opacity-70">Loading kategori...</p>
      ) : (
        <CategoryTabs
          categories={categories}
          value={activeCategoryId}
          onChange={setActiveCategoryId}
        />
      )}

      {loadingMenu ? (
        <p className="text-sm opacity-70">Loading menu...</p>
      ) : menuItems.length === 0 ? (
        <p className="text-sm opacity-70">Menu kosong / tidak tersedia.</p>
      ) : (
        <div className="space-y-3">
          {menuItems.map((m) => (
            <MenuCard key={m.id} item={m} />
          ))}
        </div>
      )}

      <FloatingCartButton />
    </main>
  );
}
