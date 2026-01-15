"use client";

import { useEffect, useState, memo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCartStore } from "@/store/cartStore";
import MenuHeader from "@/components/menu/MenuHeader";
import MenuTabs from "@/components/menu/MenuTabs";
import MenuSearch from "@/components/menu/MenuSearch";
import MenuGroupList from "@/components/menu/MenuGroupList";
import { CATEGORY, type TabKey } from "@/components/menu/constants";
import { useMenuItems } from "@/components/menu/useMenuItems";
import BackgroundDecorations from "@/components/shared/BackgroundDecorations";

export default function MenuPage() {
  const router = useRouter();

  const tableNumber = useCartStore((s) => s.tableNumber);
  const addItem = useCartStore((s) => s.addItem);
  const itemCount = useCartStore((s) => s.getItemCount());

  const [activeTab, setActiveTab] = useState<TabKey>("makanan");
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (tableNumber == null) router.replace("/pilih-meja");
  }, [tableNumber, router]);

  const { loading, items, expandedGroups, toggleGroup, refresh } = useMenuItems(
    {
      categoryId: CATEGORY[activeTab],
      query,
    }
  );

  if (tableNumber == null) {
    return (
      <main className="relative min-h-screen w-full overflow-x-hidden">
        <BackgroundDecorations />
        <div className="relative z-10 flex min-h-screen items-center justify-center">
           <p className="text-sm font-medium text-muted-foreground animate-pulse">Mengarahkan ke pilih meja...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden">
      <BackgroundDecorations />

      <div className="relative z-10 container max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-6">
        
        <MenuHeader
          tableNumber={tableNumber}
          itemCount={itemCount}
          onGoCart={() => router.push("/keranjang")}
        />

        <MenuTabs activeTab={activeTab} onChange={setActiveTab} />

        <MenuSearch
          query={query}
          onChange={setQuery}
          onRefresh={refresh}
          loading={loading}
        />

        <MenuGroupList
          loading={loading}
          items={items}
          expandedGroups={expandedGroups}
          onToggleGroup={toggleGroup}
          onAddItem={async (it) => {
            // --- Logika Add Item (Tetap Sama) ---
            const state = useCartStore.getState();
            const currentItems = state.items.map((x) => ({
              menu_item_id: x.id,
              quantity: x.quantity,
            }));

            const proposed = [...currentItems];
            const idx = proposed.findIndex((x) => x.menu_item_id === it.id);
            if (idx >= 0) proposed[idx].quantity = proposed[idx].quantity + 1;
            else proposed.push({ menu_item_id: it.id, quantity: 1 });

            try {
              const res = await fetch("/api/cart/availability", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ items: proposed }),
              });
              const json = await res.json();
              if (!res.ok || !json?.ok) {
                if (json?.items && Array.isArray(json.items)) {
                  toast.error("Batas pesanan tercapai", {
                    description: `Maaf, Anda hanya bisa memesan maksimal ${
                      json.items[0]?.maxAvailable ?? "terbatas"
                    } porsi untuk menu ini.`,
                  });
                } else if (json?.shortages && json.shortages.length > 0) {
                  toast("Yah, stok menipis 😔", {
                    description: `Mohon maaf, stok bahan untuk membuat "${it.name}" saat ini tidak mencukupi untuk menambah porsi lagi.`,
                    action: {
                      label: "Oke",
                      onClick: () => console.log("User acknowledged"),
                    },
                  });
                } else {
                  toast.error("Gagal menambah menu", {
                    description: "Terjadi kesalahan saat mengecek ketersediaan stok.",
                  });
                }
                return;
              }

              addItem({
                id: it.id,
                name: it.name,
                price: it.price,
                quantity: 1,
                image_url: it.image_url ?? undefined,
                max_portions: it.max_portions ?? null,
              });
              toast.success(`${it.name} ditambahkan`);
            } catch (err) {
              console.error("availability check failed", err);
              toast.error("Gagal cek stok");
            }
          }}
        />
      </div>
    </main>
  );
}