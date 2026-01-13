// src/components/admin/HistoryOrderCard.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import type { HistoryOrderRow } from "@/types/history";
import {
  formatRupiah,
  formatDateTimeID,
  paymentBadgeVariant,
  orderBadgeVariant,
} from "@/lib/history-helpers";

type Props = {
  order: HistoryOrderRow;
  onDelete?: () => Promise<void> | void;
};

export function HistoryOrderCard({ order, onDelete }: Props) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteConfirm = async () => {
    if (!onDelete) return;

    setIsDeleting(true);
    try {
      await onDelete();
    } catch (error) {
      console.error("Gagal menghapus:", error);
      setIsDeleting(false);
    }
  };

  return (
    <Card className="p-4 space-y-2 relative overflow-hidden transition-all hover:bg-muted/5 border-border/60">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="font-semibold text-lg">{order.order_number}</div>
          </div>
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

      <div className="flex items-center justify-between gap-3 pt-3 border-t border-border/50 mt-2">
        <div className="text-sm">
          Total:{" "}
          <span className="font-semibold text-base">
            {formatRupiah(order.total_amount)}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 justify-end items-center">
          {onDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  title="Hapus Pesanan (Owner Only)"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Hapus Riwayat Pesanan?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tindakan ini permanen dan tidak dapat dikembalikan.
                    <br />
                    Data penjualan order <b>{order.order_number}</b> akan hilang
                    dari laporan.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>
                    Batal
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(e) => {
                      e.preventDefault();
                      handleDeleteConfirm();
                    }}
                    className="bg-destructive hover:bg-destructive/90"
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Menghapus...
                      </>
                    ) : (
                      "Ya, Hapus Permanen"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {onDelete && <div className="w-px h-4 bg-border mx-1"></div>}

          <Link href={`/nota/${order.order_number}`} target="_blank">
            <Button variant="outline" size="sm" className="h-8 text-xs">
              Lihat Nota
            </Button>
          </Link>
          <Link
            href={`/admin/print/kitchen/${order.order_number}`}
            target="_blank"
          >
            <Button variant="secondary" size="sm" className="h-8 text-xs">
              Reprint Dapur
            </Button>
          </Link>
          <Link href={`/admin/print/bar/${order.order_number}`} target="_blank">
            <Button variant="secondary" size="sm" className="h-8 text-xs">
              Reprint Bar
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}