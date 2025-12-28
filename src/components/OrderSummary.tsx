"use client";

import { Card } from "@/components/ui/card";
import { formatRupiah } from "@/lib/utils";

export function OrderSummary({
  tableNumber,
  total,
}: {
  tableNumber: number;
  total: number;
}) {
  return (
    <Card className="p-4 space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="opacity-80">Nomor Meja</span>
        <span className="font-semibold">{tableNumber}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm opacity-80">Total</span>
        <span className="text-xl font-bold">{formatRupiah(total)}</span>
      </div>
    </Card>
  );
}
