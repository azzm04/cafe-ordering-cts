"use client";

import { useMemo } from "react";
import type { MenuItemRow } from "@/components/menu/constants";
import MenuGroup from "@/components/menu/MenuGroup";

export default function MenuGroupList({
  loading,
  items,
  expandedGroups,
  onToggleGroup,
  onAddItem,
}: {
  loading: boolean;
  items: MenuItemRow[];
  expandedGroups: Set<string>;
  onToggleGroup: (group: string) => void;
  onAddItem: (item: MenuItemRow) => void;
}) {
  const grouped = useMemo(() => {
    const map = new Map<string, MenuItemRow[]>();
    for (const it of items) {
      const key = (it.variant_group ?? "Lainnya").trim() || "Lainnya";
      const arr = map.get(key) ?? [];
      arr.push(it);
      map.set(key, arr);
    }
    return Array.from(map.entries()).map(([groupName, groupItems]) => ({
      groupName,
      groupItems,
    }));
  }, [items]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 sm:py-16">
        <div className="inline-flex h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary mb-4"></div>
        <p className="text-sm sm:text-base text-muted-foreground">Loading menu...</p>
      </div>
    );
  }

  if (grouped.length === 0) {
    return (
      <div className="rounded-xl border border-muted bg-card p-8 text-center">
        <p className="text-lg font-medium text-muted-foreground">Menu kosong / tidak tersedia.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-6">
      {grouped.map(({ groupName, groupItems }) => (
        <MenuGroup
          key={groupName}
          groupName={groupName}
          groupItems={groupItems}
          expanded={expandedGroups.has(groupName)}
          onToggle={() => onToggleGroup(groupName)}
          onAddItem={onAddItem}
        />
      ))}
    </div>
  );
}
