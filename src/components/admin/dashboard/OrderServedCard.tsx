"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ActiveOrder } from "@/lib/admin-services/overview";

export function OrderServedCard({
  items,
  onComplete,
}: {
  items: ActiveOrder[];
  onComplete: (orderNumber: string) => void;
}) {
  return (
    <Card className="p-4 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Order Aktif</h2>
        <Badge variant="secondary" className="w-fit">
          Menunggu
        </Badge>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Tidak ada order aktif.</p>
      ) : (
        <div className="space-y-3">
          {items.map((o) => (
            <Card key={o.id} className="p-3 sm:p-4 space-y-3 border-l-4 border-l-primary">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <div className="font-semibold">{o.order_number}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    Meja {o.tables?.table_number ?? "-"} • {o.payment_method === "cash" ? "Tunai" : "Midtrans"} • Sudah Disajikan
                  </div>
                </div>
                <div className="text-lg sm:text-xl font-bold text-primary">
                  Rp {Number(o.total_amount).toLocaleString("id-ID")}
                </div>
              </div>

              <Button variant="outline" onClick={() => onComplete(o.order_number)} className="w-full">
                Selesaikan & Lepas Meja
              </Button>
            </Card>
          ))}
        </div>
      )}
    </Card>
  );
}
