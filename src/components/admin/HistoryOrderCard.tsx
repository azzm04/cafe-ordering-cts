// src/components/admin/HistoryOrderCard.tsx
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { HistoryOrderRow } from "@/types/history";
import {
  formatRupiah,
  formatDateTimeID,
  paymentBadgeVariant,
  orderBadgeVariant,
} from "@/lib/history-helpers";

type Props = {
  order: HistoryOrderRow;
};

export function HistoryOrderCard({ order }: Props) {
  return (
    <Card className="p-4 space-y-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="font-semibold">{order.order_number}</div>
          <div className="text-xs opacity-70">
            {formatDateTimeID(order.created_at)}
            {order.completed_at
              ? ` • selesai ${formatDateTimeID(order.completed_at)}`
              : ""}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <Badge variant="secondary">
            Meja {order.tables?.table_number ?? "-"}
          </Badge>
          <Badge variant={paymentBadgeVariant(order.payment_status)}>
            {order.payment_status}
          </Badge>
          <Badge variant={orderBadgeVariant(order.order_status)}>
            {order.order_status}
          </Badge>
          <Badge variant="outline">{order.payment_method ?? "midtrans"}</Badge>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="text-sm">
          Total:{" "}
          <span className="font-semibold">{formatRupiah(order.total_amount)}</span>
        </div>

        <div className="flex flex-wrap gap-2 justify-end">
          <Link href={`/nota/${order.order_number}`} target="_blank">
            <Button variant="outline" size="sm">
              Lihat Nota
            </Button>
          </Link>
          <Link
            href={`/admin/print/kitchen/${order.order_number}`}
            target="_blank"
          >
            <Button variant="secondary" size="sm">
              Reprint Dapur
            </Button>
          </Link>
          <Link href={`/admin/print/bar/${order.order_number}`} target="_blank">
            <Button variant="secondary" size="sm">
              Reprint Bar
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}