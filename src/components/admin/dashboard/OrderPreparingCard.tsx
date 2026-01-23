"use client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Printer, Utensils, Clock, CheckCircle, Flame } from "lucide-react";
import type {
  ActiveOrder,
  FulfillmentStatus,
} from "@/lib/admin-services/overview";
import { formatWaktuID, timeAgoShort } from "@/lib/time";

export function OrderPreparingCard({
  items,
  onSetStatus,
}: {
  items: ActiveOrder[];
  onSetStatus: (orderId: string, status: FulfillmentStatus) => void;
}) {
  const handlePrint = (url: string, type: "kitchen" | "bar") => {
    const printWindow = window.open(
      url,
      "_blank",
      "width=800,height=600,menubar=no,toolbar=no,location=no",
    );

    if (printWindow) {
      toast.success(
        `Membuka halaman print ${type === "kitchen" ? "dapur" : "bar"}...`,
      );
    } else {
      toast.error("Gagal membuka halaman print. Periksa popup blocker.");
    }
  };

  return (
    <Card className="overflow-hidden border-none shadow-md bg-white/50 backdrop-blur-sm dark:bg-card/40 ring-1 ring-border/50 rounded-2xl">
      <div className="p-6 border-b border-border/40 bg-amber-50/50 dark:bg-amber-950/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 text-amber-600 rounded-xl">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                Sedang Dibuat
              </h2>
              <p className="text-xs text-muted-foreground">
                Pesanan sedang diproses di dapur/bar
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="bg-amber-100 text-amber-700 border-amber-200 px-3 py-1 rounded-full font-medium"
          >
            {items.length} Proses
          </Badge>
        </div>
      </div>

      <div className="p-6">
        {items.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-muted rounded-xl bg-muted/20">
            <p className="text-sm text-muted-foreground font-medium">
              Tidak ada order yang sedang dibuat.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {items.map((o) => (
              <div
                key={o.id}
                className="flex flex-col bg-card border border-border/60 hover:border-amber-300 p-0 rounded-xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md h-full relative"
              >
                {/* Animated Pulse Indicator */}
                <div className="absolute top-0 right-0 p-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                  </span>
                </div>

                <div className="p-4 bg-muted/30 border-b border-border/40">
                  <div className="flex justify-between items-center mb-2 pr-4">
                    <span className="font-bold text-lg">
                      Meja {o.tables?.table_number ?? "-"}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">
                      {o.order_number.slice(-6)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 w-fit px-2 py-1 rounded-md border border-amber-100">
                    <Clock className="w-3 h-3" />
                    <span>Masuk {timeAgoShort(o.created_at)}</span>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-end gap-4">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-8 text-muted-foreground hover:text-foreground border border-border/40"
                      onClick={() =>
                        handlePrint(
                          `/admin/print/kitchen/${o.order_number}`,
                          "kitchen",
                        )
                      }
                    >
                      Reprint Dapur
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-8 text-muted-foreground hover:text-foreground border border-border/40"
                      onClick={() =>
                        handlePrint(`/admin/print/bar/${o.order_number}`, "bar")
                      }
                    >
                      Reprint Bar
                    </Button>
                  </div>

                  <Button
                    onClick={() => onSetStatus(o.id, "served")}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white font-medium shadow-sm"
                  >
                    <Utensils className="w-4 h-4 mr-2" />
                    Selesai Masak
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
