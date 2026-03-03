"use client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Printer, ChefHat, Clock, CreditCard, Banknote } from "lucide-react";
import type {
  ActiveOrder,
  FulfillmentStatus,
} from "@/lib/admin-services/overview";
import { formatWaktuID, timeAgoShort } from "@/lib/time";

export function OrderReceivedCard({
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
      <div className="p-6 border-b border-border/40 bg-blue-50/50 dark:bg-blue-950/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                Order Baru Masuk
              </h2>
              <p className="text-xs text-muted-foreground">
                Segera proses pesanan ini
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="bg-blue-100 text-blue-700 border-blue-200 px-3 py-1 rounded-full font-medium"
          >
            {items.length} Antrian
          </Badge>
        </div>
      </div>

      <div className="p-6">
        {items.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-muted rounded-xl bg-muted/20">
            <p className="text-sm text-muted-foreground font-medium">
              Tidak ada order baru masuk.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {items.map((o) => (
              <div
                key={o.id}
                className="flex flex-col bg-card border border-border/60 hover:border-blue-300 p-0 rounded-xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md h-full"
              >
                {/* Card Header */}
                <div className="p-4 bg-muted/30 border-b border-border/40 flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold font-mono text-base">
                        {o.order_number.slice(-6)}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[10px] h-5 px-1.5 bg-background"
                      >
                        {o.payment_method === "cash" ? (
                          <Banknote className="w-3 h-3 mr-1" />
                        ) : (
                          <CreditCard className="w-3 h-3 mr-1" />
                        )}
                        {o.payment_method === "cash" ? "Tunai" : "Midtrans"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {formatWaktuID(o.created_at)}
                      <span className="font-medium text-foreground ml-1">
                        ({timeAgoShort(o.created_at)})
                      </span>
                    </div>
                  </div>
                  <div className="bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm">
                    Meja {o.tables?.table_number ?? "-"}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 flex-1 flex flex-col justify-between gap-4">
                  <div className="flex justify-between items-center px-3 py-2 bg-muted/20 rounded-lg">
                    <span className="text-xs font-medium text-muted-foreground">
                      Total Nilai
                    </span>
                    <span className="font-bold text-primary">
                      Rp {Number(o.total_amount).toLocaleString("id-ID")}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 bg-background hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                        onClick={() =>
                          handlePrint(
                            `/admin/print/kitchen/${o.order_number}`,
                            "kitchen",
                          )
                        }
                      >
                        <Printer className="w-3.5 h-3.5 mr-1.5" /> Dapur
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 bg-background hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200"
                        onClick={() =>
                          handlePrint(
                            `/admin/print/bar/${o.order_number}`,
                            "bar",
                          )
                        }
                      >
                        <Printer className="w-3.5 h-3.5 mr-1.5" /> Bar
                      </Button>
                    </div>

                    <Button
                      onClick={() => onSetStatus(o.id, "preparing")}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                    >
                      <ChefHat className="w-4 h-4 mr-2" />
                      Mulai Buat
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
