import { Separator } from "@/components/ui/separator";
import { formatRupiah } from "@/lib/utils";
import type { OrderItemWithMenu } from "@/lib/nota/type";

export default function NotaItemsList({ items }: { items: OrderItemWithMenu[] }) {
  return (
    <>
      <Separator />

      <div className="space-y-3 sm:space-y-4">
        <div className="text-xs sm:text-sm font-bold text-muted-foreground uppercase tracking-wide">
          Detail Pesanan
        </div>

        <div className="space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              Tidak ada item.
            </div>
          ) : (
            items.map((it) => (
              <div
                key={it.id}
                className="flex items-start justify-between gap-3 pb-3 sm:pb-4 border-b border-muted last:border-0 last:pb-0"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-foreground text-sm sm:text-base leading-snug">
                    {it.menu_items?.name ?? it.menu_item_id}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    {it.quantity}x {formatRupiah(it.price)}
                  </div>
                  {it.notes ? (
                    <div className="text-xs text-muted-foreground mt-1.5 italic bg-muted/50 p-1.5 sm:p-2 rounded border border-border/50">
                      Catatan: {it.notes}
                    </div>
                  ) : null}
                </div>

                <div className="text-sm sm:text-base font-bold text-primary text-right whitespace-nowrap">
                  {formatRupiah(it.subtotal)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
