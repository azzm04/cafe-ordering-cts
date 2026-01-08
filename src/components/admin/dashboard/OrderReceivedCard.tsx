"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ActiveOrder, FulfillmentStatus } from "@/lib/admin-services/overview";
import { formatWaktuID, timeAgoShort } from "@/lib/time";

export function OrderReceivedCard({
  items,
  onSetStatus,
}: {
  items: ActiveOrder[];
  onSetStatus: (orderId: string, status: FulfillmentStatus) => void;
}) {
  return (
    <Card className="p-4 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Order Baru Masuk</h2>
        <Badge variant="secondary" className="w-fit">
          Belum Mulai
        </Badge>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Tidak ada order baru masuk.</p>
      ) : (
        <div className="space-y-3">
          {items.map((o) => (
            <Card key={o.id} className="p-3 sm:p-4 space-y-3 border-l-4 border-l-accent">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <div>
                  <div className="font-semibold">{o.order_number}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    {formatWaktuID(o.created_at)} • {timeAgoShort(o.created_at)}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                    Meja {o.tables?.table_number ?? "-"} • {o.payment_method === "cash" ? "Tunai" : "Midtrans"}
                  </div>
                </div>
                <div className="text-lg sm:text-xl font-bold text-primary">
                  Rp {Number(o.total_amount).toLocaleString("id-ID")}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Link href={`/admin/print/kitchen/${o.order_number}`} target="_blank" className="flex-1">
                  <Button variant="secondary" className="w-full text-xs sm:text-sm">
                    Print Dapur
                  </Button>
                </Link>

                <Link href={`/admin/print/bar/${o.order_number}`} target="_blank" className="flex-1">
                  <Button variant="secondary" className="w-full text-xs sm:text-sm">
                    Print Bar
                  </Button>
                </Link>

                <Button onClick={() => onSetStatus(o.id, "preparing")} className="flex-1">
                  Mulai Buat
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Card>
  );
}
