"use client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCheck, Coffee, Receipt, ArrowRight } from "lucide-react";
import type { ActiveOrder } from "@/lib/admin-services/overview";

export function OrderServedCard({
  items,
  onComplete,
}: {
  items: ActiveOrder[];
  onComplete: (orderNumber: string) => void;
}) {
  return (
    <Card className="overflow-hidden border-none shadow-md bg-white/50 backdrop-blur-sm dark:bg-card/40 ring-1 ring-border/50 rounded-2xl">
      <div className="p-6 border-b border-border/40 bg-emerald-50/50 dark:bg-emerald-950/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                Order Aktif (Disajikan)
              </h2>
              <p className="text-xs text-muted-foreground">
                Pelanggan sedang menikmati pesanan
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="bg-emerald-100 text-emerald-700 border-emerald-200 px-3 py-1 rounded-full font-medium"
          >
            {items.length} Meja
          </Badge>
        </div>
      </div>

      <div className="p-6">
        {items.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-muted rounded-xl bg-muted/20">
            <p className="text-sm text-muted-foreground font-medium">
              Tidak ada order aktif.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((o) => (
              <div
                key={o.id}
                className="group flex flex-col bg-card border border-border/60 hover:border-emerald-300 p-0 rounded-xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md"
              >
                <div className="p-4 flex items-center justify-between bg-muted/30 border-b border-border/40 group-hover:bg-emerald-50/30 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                      {o.tables?.table_number ?? "-"}
                    </div>
                    <span className="font-semibold text-sm">Meja</span>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-background/80 backdrop-blur text-[10px] border border-border/50"
                  >
                    {o.payment_method === "cash" ? "Tunai" : "Online"}
                  </Badge>
                </div>

                <div className="p-4 flex-1 flex flex-col gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      Total Tagihan
                    </p>
                    <p className="text-lg font-bold text-primary">
                      Rp {Number(o.total_amount).toLocaleString("id-ID")}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      {o.order_number}
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => onComplete(o.order_number)}
                    className="w-full mt-auto border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 transition-all"
                  >
                    Selesai & Lepas Meja{" "}
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
