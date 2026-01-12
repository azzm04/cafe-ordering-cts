"use client";

// Link sudah tidak dibutuhkan lagi karena kita menggunakan window.open
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner"; // Tambahkan import ini
import type { ActiveOrder, FulfillmentStatus } from "@/lib/admin-services/overview";
import { formatWaktuID, timeAgoShort } from "@/lib/time";

export function OrderPreparingCard({
  items,
  onSetStatus,
}: {
  items: ActiveOrder[];
  onSetStatus: (orderId: string, status: FulfillmentStatus) => void;
}) {
  
  // Logic handlePrint ditambahkan di sini
  const handlePrint = (url: string, type: 'kitchen' | 'bar') => {
    const printWindow = window.open(
      url,
      '_blank',
      'width=800,height=600,menubar=no,toolbar=no,location=no'
    );
    
    if (printWindow) {
      toast.success(`Membuka halaman print ${type === 'kitchen' ? 'dapur' : 'bar'}...`);
    } else {
      toast.error('Gagal membuka halaman print. Periksa popup blocker.');
    }
  };

  return (
    <Card className="p-4 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Sedang Dibuat</h2>
        <Badge variant="secondary" className="w-fit">
          Dalam Proses
        </Badge>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Tidak ada order yang sedang dibuat.</p>
      ) : (
        <div className="space-y-3">
          {items.map((o) => (
            <Card key={o.id} className="p-3 sm:p-4 space-y-3 border-l-4 border-l-secondary">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <div>
                  <div className="font-semibold">{o.order_number}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    {formatWaktuID(o.created_at)} • {timeAgoShort(o.created_at)}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                    Meja {o.tables?.table_number ?? "-"} • {o.payment_method === "cash" ? "Tunai" : "Midtrans"}
                  </div>
                </div>
                <div className="text-lg sm:text-xl font-bold text-primary">
                  Rp {Number(o.total_amount).toLocaleString("id-ID")}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                {/* Button Print Dapur diperbarui */}
                <Button 
                  variant="secondary" 
                  className="flex-1 text-xs sm:text-sm"
                  onClick={() => handlePrint(`/admin/print/kitchen/${o.order_number}`, 'kitchen')}
                >
                  🍳 Print Dapur
                </Button>

                {/* Button Print Bar diperbarui */}
                <Button 
                  variant="secondary" 
                  className="flex-1 text-xs sm:text-sm"
                  onClick={() => handlePrint(`/admin/print/bar/${o.order_number}`, 'bar')}
                >
                  🍹 Print Bar
                </Button>

                <Button onClick={() => onSetStatus(o.id, "served")} className="flex-1">
                  Sudah Selesai
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Card>
  );
}