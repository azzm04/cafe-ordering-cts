import { Separator } from "@/components/ui/separator";
import { FulfillmentTimeline } from "@/components/FulfillmentTimeline";
import { formatDateTimeID } from "@/lib/nota/format";
import type { FulfillmentStatus, OrderItemWithMenu } from "@/lib/nota/type";
import NotaItemsList from "@/components/nota/NotaItemsList";
import { formatRupiah } from "@/lib/utils";
import { Receipt, Calendar, CreditCard, Armchair, Tag } from "lucide-react"; // Tambahkan Tag icon

type NotaSummaryCardProps = {
  orderNumber: string;
  tableNumber: number | null;
  paymentMethod: string | null;
  createdAt: string;
  completedAt: string | null;
  isPaid: boolean;
  effectiveFulfillmentStatus: FulfillmentStatus;
  items: OrderItemWithMenu[];
  totalAmount: number;
  originalAmount?: number;
  discountAmount?: number;
  voucherCode?: string | null;
};

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
  originalAmount,
  discountAmount,
  voucherCode,
}: NotaSummaryCardProps) {

  const subtotal = originalAmount ?? totalAmount;
  const hasDiscount = (discountAmount || 0) > 0;

  return (
    <div className="rounded-3xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-xl shadow-primary/5 overflow-hidden">
      
      {/* Timeline Section */}
      {isPaid && (
        <div className="bg-background/50 border-b border-border/50 px-4 pt-4 pb-0">
          <FulfillmentTimeline currentStatus={effectiveFulfillmentStatus} />
        </div>
      )}

      <div className="p-6 sm:p-8 space-y-6">
        
        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
              <Receipt className="w-3 h-3" /> No. Order
            </span>
            <p className="text-sm font-mono font-bold truncate text-foreground/90" title={orderNumber}>
              {orderNumber}
            </p>
          </div>

          <div className="space-y-1 text-right">
            <span className="text-xs font-medium text-muted-foreground flex items-center justify-end gap-1.5 uppercase tracking-wider">
              Waktu <Calendar className="w-3 h-3" />
            </span>
            <p className="text-sm font-bold text-foreground/90">
              {formatDateTimeID(createdAt)}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
              <Armchair className="w-3 h-3" /> Meja
            </span>
            <p className="text-xl font-bold text-primary">
              {tableNumber ?? "-"}
            </p>
          </div>

          <div className="space-y-1 text-right">
            <span className="text-xs font-medium text-muted-foreground flex items-center justify-end gap-1.5 uppercase tracking-wider">
              Metode <CreditCard className="w-3 h-3" />
            </span>
            <p className="text-sm font-bold text-foreground capitalize">
              {paymentMethod === "cash" ? "Tunai" : paymentMethod || "Online"}
            </p>
          </div>
        </div>

        <Separator className="bg-border/60" />

        {/* Items List */}
        <NotaItemsList items={items} />

        <Separator className="bg-border/60" />

        {/* --- SECTION HARGA --- */}
        <div className="space-y-3">
          
          {/* Subtotal */}
          <div className="flex justify-between text-sm text-muted-foreground">
             <span>Subtotal</span>
             <span>{formatRupiah(subtotal)}</span>
          </div>

          {hasDiscount && (
             <div className="flex justify-between text-sm text-emerald-600 font-medium animate-in fade-in slide-in-from-top-1">
                <span className="flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" /> 
                  Diskon {voucherCode ? <span className="font-bold">({voucherCode})</span> : ""}
                </span>
                <span>- {formatRupiah(discountAmount!)}</span>
             </div>
          )}

          {/* Total Amount Box */}
          <div className="flex items-center justify-between bg-primary/5 p-4 rounded-xl border border-primary/10 mt-2">
            <span className="text-sm font-bold text-foreground uppercase tracking-wide">Total</span>
            <span className="text-2xl font-black text-primary">
              {formatRupiah(totalAmount)}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}