"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { HistoryOrderCard } from "./HistoryOrderCard";
import type { HistoryOrderRow } from "@/types/history";

type Props = {
  items: HistoryOrderRow[];
  loading: boolean;
  page: number;
  totalPages: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  onDelete?: (id: string) => Promise<void> | void; 
};

export function HistoryList({
  items,
  loading,
  page,
  totalPages,
  onPrevPage,
  onNextPage,
  onDelete,
}: Props) {
  return (
    <Card className="p-4 space-y-3">
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground mb-2">Tidak ada data.</p>
          <p className="text-xs text-muted-foreground">
            Coba ubah filter atau periode tanggal
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((order) => (
            <HistoryOrderCard 
                key={order.id} 
                order={order} 
                onDelete={onDelete ? () => onDelete(order.id) : undefined} 
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {items.length > 0 && (
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="text-xs text-muted-foreground">
            Page {page} / {totalPages}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onPrevPage}
              disabled={loading || page <= 1}
            >
              Prev
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onNextPage}
              disabled={loading || page >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}