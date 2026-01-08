"use client";

import type { TabKey } from "@/components/menu/constants";

export default function MenuTabs({
  activeTab,
  onChange,
}: {
  activeTab: TabKey;
  onChange: (v: TabKey) => void;
}) {
  return (
    <div className="rounded-xl bg-muted p-1 flex gap-1">
      <button
        type="button"
        onClick={() => onChange("makanan")}
        className={`flex-1 rounded-lg px-3 sm:px-4 py-2.5 text-sm sm:text-base font-semibold transition-all ${
          activeTab === "makanan" ? "bg-card shadow-md text-primary" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        🍲 Makanan
      </button>

      <button
        type="button"
        onClick={() => onChange("minuman")}
        className={`flex-1 rounded-lg px-3 sm:px-4 py-2.5 text-sm sm:text-base font-semibold transition-all ${
          activeTab === "minuman" ? "bg-card shadow-md text-primary" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        🥤 Minuman
      </button>
    </div>
  );
}
