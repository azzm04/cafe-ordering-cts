import { Card } from "@/components/ui/card";

export default function CashPendingAlert({ orderNumber }: { orderNumber: string }) {
  return (
    <Card className="p-4 sm:p-6 mb-4 sm:mb-6 border border-border bg-amber-50/50 backdrop-blur-sm">
      <div className="flex gap-3 sm:gap-4 items-start">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-amber-100 shrink-0 flex items-center justify-center">
          <div className="text-base sm:text-lg font-bold text-amber-700">!</div>
        </div>
        <div className="flex-1">
          <div className="font-semibold text-amber-900 text-sm sm:text-base">
            Menunggu Pembayaran Tunai
          </div>
          <div className="text-xs sm:text-sm text-amber-800 mt-1">
            Bayar ke kasir dengan Order ID:{" "}
            <span className="font-mono font-bold block sm:inline mt-1 sm:mt-0">
              {orderNumber}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
