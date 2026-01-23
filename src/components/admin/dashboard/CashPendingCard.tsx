"use client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wallet, CheckCircle2, Tag } from "lucide-react";
import type { ActiveOrder } from "@/lib/admin-services/overview";

// Extend type untuk mendukung discount_amount
type ActiveOrderWithDiscount = ActiveOrder & {
  discount_amount?: number;
};

export function CashPendingCard({
  items,
  onConfirm,
  onDiscount,
}: {
  items: ActiveOrderWithDiscount[];
  onConfirm: (orderNumber: string) => void;
  onDiscount?: (order: ActiveOrderWithDiscount) => void;
}) {
  return (
    <Card className="overflow-hidden border-none shadow-md bg-white/50 backdrop-blur-sm dark:bg-card/40 ring-1 ring-border/50 rounded-2xl">
      <div className="p-6 border-b border-border/40 bg-orange-50/50 dark:bg-orange-950/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-100 text-orange-600 rounded-xl">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                Tunai Pending
              </h2>
              <p className="text-xs text-muted-foreground">
                Menunggu pembayaran di kasir
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="bg-orange-100 text-orange-700 border-orange-200 px-3 py-1 rounded-full font-medium"
          >
            {items.length} Pending
          </Badge>
        </div>
      </div>

      <div className="p-6">
        {items.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-muted rounded-xl bg-muted/20">
            <p className="text-sm text-muted-foreground font-medium">
              Tidak ada pembayaran tunai yang pending.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((o) => (
              <div
                key={o.id}
                className="group relative bg-card border border-border/60 hover:border-primary/40 p-5 rounded-xl shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-bold mb-2">
                      Meja {o.tables?.table_number ?? "-"}
                    </span>
                    <h3 className="font-bold text-lg font-mono tracking-tight text-foreground">
                      {o.order_number}
                    </h3>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-orange-100 text-orange-700 hover:bg-orange-100"
                  >
                    Tunai
                  </Badge>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="py-3 px-4 bg-muted/30 rounded-lg border border-border/50">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                      Total Tagihan
                    </p>
                    <div className="flex items-end justify-between">
                      <p className="text-2xl font-black text-primary">
                        Rp {Number(o.total_amount).toLocaleString("id-ID")}
                      </p>
                      {/* Tampilkan info diskon jika ada */}
                      {o.discount_amount != null && o.discount_amount > 0 && (
                        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 mb-1">
                          Hemat {o.discount_amount.toLocaleString("id-ID")}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {/* TOMBOL BERI DISKON (Hanya muncul jika onDiscount dipassing) */}
                    {onDiscount && (
                      <Button
                        variant="outline"
                        onClick={() => onDiscount(o)}
                        className="flex-1 bg-background hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200"
                      >
                        <Tag className="w-4 h-4 mr-2" />
                        Diskon
                      </Button>
                    )}

                    <Button
                      onClick={() => onConfirm(o.order_number)}
                      className={`shadow-sm transition-all active:scale-95 ${onDiscount ? "flex-1" : "w-full"}`}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Lunas
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
