"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TableRow } from "@/lib/admin-services/overview";

export function TablesCard({ tables }: { tables: TableRow[] }) {
  return (
    <Card className="p-4 sm:p-6 space-y-4">
      <h2 className="text-lg font-semibold">Status Meja</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
        {tables.map((t) => (
          <Card key={t.id} className="p-3 space-y-2 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center gap-2">
              <span className="font-medium text-sm">Meja {t.table_number}</span>
              <Badge variant={t.status === "occupied" ? "destructive" : "secondary"} className="text-xs">
                {t.status === "occupied" ? "Terisi" : "Kosong"}
              </Badge>
            </div>
          </Card>
        ))}
      </div>
    </Card>
  );
}
