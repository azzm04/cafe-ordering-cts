"use client";

import { useMemo, memo } from "react";
import type { MenuItemRow } from "@/components/menu/constants";
import MenuGroup from "@/components/menu/MenuGroup";
import { Package, Loader2 } from "lucide-react";

type MenuGroupListProps = {
  loading: boolean;
  items: MenuItemRow[];
  expandedGroups: Set<string>;
  onToggleGroup: (group: string) => void;
  onAddItem: (item: MenuItemRow) => void;
};

function MenuGroupList({
  loading,
  items,
  expandedGroups,
  onToggleGroup,
  onAddItem,
}: MenuGroupListProps) {
  // Memoize grouping logic agar tidak re-calc setiap render
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
      <div className="flex flex-col items-center justify-center py-20 space-y-4 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">Memuat menu...</p>
      </div>
    );
  }

  if (grouped.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/10 py-16 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Package className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-bold">Menu Kosong</h3>
        <p className="text-sm text-muted-foreground">Belum ada menu yang tersedia saat ini.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
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

export default memo(MenuGroupList);