import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FulfillmentTimeline } from "@/components/FulfillmentTimeline";
import { formatDateTimeID } from "@/lib/nota/format";
import type { FulfillmentStatus } from "@/lib/nota/type";
import NotaItemsList from "@/components/nota/NotaItemsList";
import NotaTotalBox from "@/components/nota/NotaTotalBox";

export default function NotaSummaryCard({
  orderNumber,
  tableNumber,
  paymentMethod,
  createdAt,
  completedAt,
  isPaid,
  effectiveFulfillmentStatus,
  items,
  totalAmount,
}: {
  orderNumber: string;
  tableNumber: number | null;
  paymentMethod: string | null;
  createdAt: string;
  completedAt: string | null;
  isPaid: boolean;
  effectiveFulfillmentStatus: FulfillmentStatus;
  items: Parameters<typeof NotaItemsList>[0]["items"];
  totalAmount: number;
}) {
  return (
    <Card className="p-4 sm:p-8 space-y-4 sm:space-y-6 border border-border shadow-sm">
      {isPaid ? (
        <div className="mb-0 sm:mb-2">
          <FulfillmentTimeline currentStatus={effectiveFulfillmentStatus} />
        </div>
      ) : null}

      <div className="bg-muted/50 p-4 sm:p-6 rounded-lg border border-border">
        <div className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1 sm:mb-2">
          Nomor Order
        </div>
        <div className="text-2xl sm:text-4xl font-bold text-primary font-mono tracking-tight break-all">
          {orderNumber}
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-3 sm:gap-6">
        <div className="space-y-1 sm:space-y-2">
          <div className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Nomor Meja
          </div>
          <div className="text-xl sm:text-2xl font-bold text-foreground">
            {tableNumber ?? "-"}
          </div>
        </div>

        <div className="space-y-1 sm:space-y-2">
          <div className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Pembayaran
          </div>
          <div className="text-sm sm:text-lg font-semibold text-foreground capitalize truncate">
            {paymentMethod === "cash" ? "Tunai" : paymentMethod || "Online"}
          </div>
        </div>

        <div className="space-y-1 sm:space-y-2">
          <div className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Waktu Pesan
          </div>
          <div className="text-xs sm:text-sm font-semibold text-foreground">
            {formatDateTimeID(createdAt)}
          </div>
        </div>

        {completedAt ? (
          <div className="space-y-1 sm:space-y-2">
            <div className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Selesai
            </div>
            <div className="text-xs sm:text-sm font-semibold text-foreground">
              {formatDateTimeID(completedAt)}
            </div>
          </div>
        ) : null}
      </div>

      <NotaItemsList items={items} />
      <Separator />
      <NotaTotalBox total={totalAmount} />
    </Card>
  );
}
