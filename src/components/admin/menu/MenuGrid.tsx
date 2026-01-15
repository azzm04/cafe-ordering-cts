"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { MenuItemRow } from "@/types/admin/menu";
import MenuCard from "@/components/admin/menu/MenuCard";

export default function MenuGrid({
  loading,
  items,
  groupedItems,
  isOwner,
  onToggleAvailability,
  onEdit,
  onArchive,
}: {
  loading: boolean;
  items: MenuItemRow[];
  groupedItems: Record<string, MenuItemRow[]>;
  isOwner: boolean;
  onToggleAvailability: (id: string, next: boolean) => void;
  onEdit: (it: MenuItemRow) => void;
  onArchive: (id: string) => void;
}) {
  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">Loading...</p>
      </Card>
    );
  }

  if (Object.keys(groupedItems).length === 0) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">
          {items.length === 0 ? "Tidak ada menu." : "Tidak ada menu yang sesuai pencarian."}
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {Object.entries(groupedItems).map(([categoryName, categoryItems]) => (
        <div key={categoryName} className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{categoryName}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {categoryItems.length} item{categoryItems.length !== 1 ? "s" : ""}
              </p>
            </div>

            <Badge variant="outline" className="text-sm">
              {categoryItems.filter((x) => x.is_available).length} / {categoryItems.length} Tersedia
            </Badge>
          </div>

          <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {categoryItems.map((it) => (
              <MenuCard
                key={it.id}
                it={it}
                isOwner={isOwner}
                onToggleAvailability={onToggleAvailability}
                onEdit={onEdit}
                onArchive={onArchive}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
