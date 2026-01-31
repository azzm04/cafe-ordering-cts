"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Table } from "@/types/index";

export function TableSelector({
  tables,
  onSelect,
}: {
  tables: Table[];
  onSelect: (tableNumber: number) => void;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {tables.map((t) => {
        const statusRaw = t.status.toString().toLowerCase();
        const isAvailable =
          statusRaw === "available" || statusRaw === "tersedia";
        const isOccupied = statusRaw === "occupied" || statusRaw === "terisi";

        let displayLabel = "Tersedia";
        if (isOccupied) displayLabel = "Terisi";
        if (!isAvailable && !isOccupied) displayLabel = "Dipesan";

        const getDotColor = () => {
          if (isAvailable) return "bg-emerald-500";
          if (isOccupied) return "bg-destructive";
          return "bg-secondary";
        };

        const getBorderColor = () => {
          if (isAvailable) return "hover:border-primary/50 border-border";
          if (isOccupied) return "border-destructive/30 bg-destructive/5";
          return "border-border";
        };

        return (
          <Card
            key={t.id}
            className={cn(
              "relative flex flex-col justify-between p-4 transition-all duration-300 border-2 rounded-xl shadow-sm", // rounded-xl mengikuti --radius
              getBorderColor(),
              isAvailable
                ? "bg-card cursor-pointer hover:shadow-md hover:-translate-y-1"
                : "opacity-90 cursor-not-allowed",
            )}
            onClick={() => isAvailable && onSelect(t.table_number)}
          >
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                MEJA
              </span>
              <div
                className={cn(
                  "w-2.5 h-2.5 rounded-full shadow-sm animate-pulse",
                  getDotColor(),
                )}
              />
            </div>

            <div className="mb-6">
              <span
                className={cn(
                  "text-4xl font-black tabular-nums tracking-tight",
                  isAvailable ? "text-foreground" : "text-destructive/80",
                )}
              >
                {t.table_number}
              </span>
              <p
                className={cn(
                  "text-[10px] uppercase font-bold mt-2 tracking-wider",
                  isAvailable ? "text-primary" : "text-muted-foreground",
                )}
              >
                {displayLabel}
              </p>
            </div>

            <Button
              disabled={!isAvailable}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(t.table_number);
              }}
              className={cn(
                "w-full font-bold shadow-none rounded-lg", // rounded-lg agar serasi dengan card
                "transition-all duration-300",
              )}
              variant={isAvailable ? "default" : "secondary"}
            >
              {isAvailable ? "Pilih" : "Tidak Tersedia"}
            </Button>
          </Card>
        );
      })}
    </div>
  );
}
