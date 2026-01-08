"use client";

import { ChevronDown } from "lucide-react";
import type { MenuItemRow } from "@/components/menu/constants";
import MenuItemCard from "@/components/menu/MenuItemCard";

export default function MenuGroup({
  groupName,
  groupItems,
  expanded,
  onToggle,
  onAddItem,
}: {
  groupName: string;
  groupItems: MenuItemRow[];
  expanded: boolean;
  onToggle: () => void;
  onAddItem: (item: MenuItemRow) => void;
}) {
  return (
    <div className="rounded-xl border border-muted bg-card overflow-hidden transition-all">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 text-left hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-base sm:text-lg">{groupName}</h3>
          <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">
            {groupItems.length}
          </span>
        </div>

        <ChevronDown
          className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded ? (
        <div className="border-t border-muted divide-y divide-muted">
          {groupItems.map((it) => (
            <MenuItemCard key={it.id} item={it} onAdd={() => onAddItem(it)} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
