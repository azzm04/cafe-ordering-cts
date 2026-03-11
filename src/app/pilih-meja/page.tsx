"use client";

import { useEffect, useState, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Table } from "@/types/index";
import { useCartStore } from "@/store/cartStore";
import { TableSelector } from "@/components/TableSelector";
import { Button } from "@/components/ui/button";
import { RefreshCw, Sparkles, ChevronRight } from "lucide-react";
import BackgroundDecorations from "@/components/shared/BackgroundDecorations";

const HeaderSection = memo(() => (
  <div className="relative space-y-4 sm:space-y-6 text-center sm:text-left">
    <div className="space-y-3">
      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight">
        <span className="bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
          Pilih Nomor Meja
        </span>
      </h1>
      <div className="flex items-center justify-center sm:justify-start gap-2 text-base sm:text-lg text-muted-foreground">
        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
        <p>Silakan pilih meja yang tersedia</p>
      </div>
    </div>
  </div>
));
HeaderSection.displayName = "HeaderSection";

export default function PilihMejaPage() {
  const router = useRouter();
  const setTableNumber = useCartStore((s) => s.setTableNumber);

  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTables = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tables?t=${Date.now()}`, {
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.message || "Gagal ambil data meja");
      }

      setTables(Array.isArray(json.tables) ? json.tables : []);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Error";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTables();
  }, [loadTables]);

  const availableCount = tables.filter(
  (t) => t.status === "tersedia" || t.status === "available"
).length;

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden">
      <BackgroundDecorations />

      <div className="relative z-10 container max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-8 sm:space-y-12">
        {/* Header */}
        <div className="pt-4">
          <HeaderSection />
        </div>

        {/* Action Bar (Status & Refresh) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-card/50 backdrop-blur-md border border-border/50 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div className="text-center sm:text-left">
              <p className="text-sm font-semibold text-foreground">
                {loading ? "Sinkronisasi data..." : `${tables.length} Meja Terdata`}
              </p>
              <p className="text-xs text-muted-foreground">
                {loading ? "..." : `${availableCount} meja kosong`}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={loadTables}
            disabled={loading}
            className="w-full sm:w-auto rounded-xl border-primary/20 hover:bg-primary/5 active:scale-95 transition-all"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Memuat..." : "Refresh Status"}
          </Button>
        </div>

        {/* Content Area */}
        <div className="min-h-75">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
              </div>
              <p className="text-sm text-muted-foreground animate-pulse">
                Sedang mengecek ketersediaan meja...
              </p>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <TableSelector
                tables={tables}
                onSelect={(n) => {
                  setTableNumber(n);
                  router.push("/menu");
                }}
              />

            </div>
          )}
        </div>
      </div>
    </main>
  );
}