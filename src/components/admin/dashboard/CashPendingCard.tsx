"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ActiveOrder } from "@/lib/admin-services/overview";

export function CashPendingCard({
  items,
  onConfirm,
}: {
  items: ActiveOrder[];
  onConfirm: (orderNumber: string) => void;
}) {
  return (
    <Card className="p-4 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Tunai Pending</h2>
        <Badge variant="secondary" className="w-fit">
          Butuh Konfirmasi
        </Badge>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Tidak ada pembayaran tunai yang pending.</p>
      ) : (
        <div className="space-y-3">
          {items.map((o) => (
            <Card key={o.id} className="p-3 sm:p-4 space-y-3 border-l-4 border-l-destructive">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <div className="font-semibold">{o.order_number}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    Meja {o.tables?.table_number ?? "-"} • Tunai • Pending
                  </div>
                </div>
                <div className="text-lg sm:text-xl font-bold text-primary">
                  Rp {Number(o.total_amount).toLocaleString("id-ID")}
                </div>
              </div>

              <Button onClick={() => onConfirm(o.order_number)} className="w-full sm:w-auto">
                Konfirmasi Tunai
              </Button>
            </Card>
          ))}
        </div>
      )}
    </Card>
  );
}
