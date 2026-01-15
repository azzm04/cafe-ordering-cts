"use client";

import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw, Search, X } from "lucide-react";

type MenuSearchProps = {
  query: string;
  onChange: (v: string) => void;
  onRefresh: () => void;
  loading: boolean;
};

function MenuSearch({ query, onChange, onRefresh, loading }: MenuSearchProps) {
  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Cari menu..."
          className="h-10 pl-9 pr-8 transition-colors focus-visible:ring-primary"
        />
        {query && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Clear</span>
          </button>
        )}
      </div>

      <Button
        variant="outline"
        size="icon"
        onClick={onRefresh}
        disabled={loading}
        className="h-10 w-10 shrink-0"
        title="Refresh Menu"
      >
        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
      </Button>
    </div>
  );
}

export default memo(MenuSearch);