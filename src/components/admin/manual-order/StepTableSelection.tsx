"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Loader2, AlertCircle, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import type { Table } from "@/types/manual-order";

interface Props {
  selectedTable: Table | null;
  onSelectTable: (table: Table) => void;
  onNext: () => void;
}

export function StepTableSelection({ selectedTable, onSelectTable, onNext }: Props) {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTables = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/overview?t=${Date.now()}`, { cache: "no-store" });
      const json = await res.json();
      if (res.ok) setTables(json.tables ?? []);
    } catch (e) {
      toast.error("Gagal memuat data meja");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const availableTables = tables.filter((t) => t.status === "available");

  return (
    <div className="space-y-6">
      <Card className="p-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <h2 className="text-lg font-bold flex items-center gap-2 mb-6">
          <MapPin className="w-5 h-5 text-amber-600" /> Pilih Meja Kosong
        </h2>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-amber-600" /></div>
        ) : availableTables.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/20">
            <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p>Tidak ada meja kosong</p>
            <Button variant="outline" className="mt-4" onClick={fetchTables}>Refresh</Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {availableTables.map((table) => (
              <button
                key={table.id}
                onClick={() => onSelectTable(table)}
                className={`p-6 rounded-2xl border-2 transition-all duration-200 text-center ${
                  selectedTable?.id === table.id
                    ? "bg-gradient-to-br from-amber-100 to-amber-50 border-amber-500 shadow-lg scale-105"
                    : "bg-white border-border hover:border-amber-300 hover:shadow-md"
                }`}
              >
                <span className="text-xs text-muted-foreground font-medium">Meja</span>
                <p className="text-4xl font-bold text-foreground my-2">{table.table_number}</p>
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-0">Kosong</Badge>
              </button>
            ))}
          </div>
        )}
      </Card>

      {selectedTable && (
        <Card className="p-4 border-0 shadow-lg bg-gradient-to-r from-amber-50 to-orange-50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-amber-700 text-white flex items-center justify-center">
              <span className="text-2xl font-bold">{selectedTable.table_number}</span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Meja dipilih</p>
              <p className="text-xl font-bold text-amber-800">Meja {selectedTable.table_number}</p>
            </div>
          </div>
          <Button onClick={onNext} size="lg" className="bg-amber-700 hover:bg-amber-800 text-white shadow-md">
            Lanjut Pilih Menu <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Card>
      )}
    </div>
  );
}