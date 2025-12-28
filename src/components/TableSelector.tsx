"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Table } from "@/types";

export function TableSelector({
  tables,
  onSelect,
}: {
  tables: Table[];
  onSelect: (tableNumber: number) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {tables.map((t) => {
        const disabled = t.status !== "available";
        return (
          <Card key={t.id} className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs opacity-70">Meja</div>
                <div className="text-2xl font-bold">{t.table_number}</div>
                <div className="text-xs opacity-70">Status: {t.status}</div>
              </div>
              <Button disabled={disabled} onClick={() => onSelect(t.table_number)}>
                Pilih
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
