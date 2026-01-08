"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import MenuHeader from "@/components/menu/MenuHeader";
import MenuTabs from "@/components/menu/MenuTabs";
import MenuSearch from "@/components/menu/MenuSearch";
import MenuGroupList from "@/components/menu/MenuGroupList";
import { CATEGORY, type TabKey } from "@/components/menu/constants";
import { useMenuItems } from "@/components/menu/useMenuItems";

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

  const {
    loading,
    items,
    expandedGroups,
    toggleGroup,
    refresh,
  } = useMenuItems({
    categoryId: CATEGORY[activeTab],
    query,
  });

  if (tableNumber == null) {
    return (
      <main className="mx-auto min-h-screen max-w-4xl px-4 sm:px-6 py-6">
        <p className="text-sm opacity-80">Mengarahkan ke pilih meja...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 sm:px-6 py-6 space-y-4 sm:space-y-6">
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
        onAddItem={(it) => {
          addItem({
            id: it.id,
            name: it.name,
            price: it.price,
            quantity: 1,
            image_url: it.image_url ?? undefined,
          });
        }}
      />
    </main>
  );
}
