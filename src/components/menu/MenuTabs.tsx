"use client";

import { memo } from "react";
import type { TabKey } from "@/components/menu/constants";
import { UtensilsCrossed, Coffee } from "lucide-react";

type MenuTabsProps = {
  activeTab: TabKey;
  onChange: (v: TabKey) => void;
};

function MenuTabs({ activeTab, onChange }: MenuTabsProps) {
  return (
    <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
      {/* Tab Makanan */}
      <button
        type="button"
        onClick={() => onChange("makanan")}
        className={`relative flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold transition-all duration-200 ${
          activeTab === "makanan"
            ? "bg-background text-primary shadow-sm ring-1 ring-black/5"
            : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
        }`}
      >
        <UtensilsCrossed className="h-4 w-4" />
        <span>Makanan</span>
      </button>

      {/* Tab Minuman */}
      <button
        type="button"
        onClick={() => onChange("minuman")}
        className={`relative flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold transition-all duration-200 ${
          activeTab === "minuman"
            ? "bg-background text-primary shadow-sm ring-1 ring-black/5"
            : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
        }`}
      >
        <Coffee className="h-4 w-4" />
        <span>Minuman</span>
      </button>
    </div>
  );
}

export default memo(MenuTabs);