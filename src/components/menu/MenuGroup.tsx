"use client";

import { memo } from "react";
import { ChevronDown, Package } from "lucide-react";
import type { MenuItemRow } from "@/components/menu/constants";
import MenuItemCard from "@/components/menu/MenuItemCard";

type MenuGroupProps = {
  groupName: string;
  groupItems: MenuItemRow[];
  expanded: boolean;
  onToggle: () => void;
  onAddItem: (item: MenuItemRow) => void;
};

function MenuGroup({ groupName, groupItems, expanded, onToggle, onAddItem }: MenuGroupProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between bg-muted/30 px-4 py-3 text-left transition-colors hover:bg-muted/50"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Package className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold leading-none text-foreground sm:text-base">
              {groupName}
            </h3>
            <p className="mt-1 text-[10px] font-medium text-muted-foreground">
              {groupItems.length} item
            </p>
          </div>
        </div>

        <ChevronDown
          className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {expanded && (
        <div className="divide-y divide-border/50 border-t border-border/50 bg-background/50">
          {groupItems.map((it) => (
            <div key={it.id} className="p-3 sm:p-4">
              <MenuItemCard item={it} onAdd={() => onAddItem(it)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default memo(MenuGroup);