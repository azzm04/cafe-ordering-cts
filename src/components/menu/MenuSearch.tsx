"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw, Search } from "lucide-react";

export default function MenuSearch({
  query,
  onChange,
  onRefresh,
  loading,
}: {
  query: string;
  onChange: (v: string) => void;
  onRefresh: () => void;
  loading: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Cari menu..."
          className="pl-10 bg-card border-muted"
        />
      </div>

      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading} className="bg-card">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>
    </div>
  );
}
