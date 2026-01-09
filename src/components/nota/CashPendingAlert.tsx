import { AlertTriangle } from "lucide-react";

export default function CashPendingAlert({ orderNumber }: { orderNumber: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-amber-50/50 border border-amber-200/60 p-4 sm:p-5 backdrop-blur-sm shadow-sm mb-6">
      <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-amber-100/50 rounded-full blur-xl" />
      
      <div className="relative flex gap-4">
        <div className="shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
          <AlertTriangle className="w-5 h-5" />
        </div>
        
        <div className="space-y-1">
          <h3 className="font-bold text-amber-900 text-sm sm:text-base">
            Menunggu Pembayaran Tunai
          </h3>
          <p className="text-xs sm:text-sm text-amber-800/80 leading-relaxed">
            Silakan menuju kasir dan sebutkan Order ID ini untuk menyelesaikan pembayaran.
          </p>
          <div className="mt-2 inline-block px-3 py-1 bg-amber-100 rounded-md border border-amber-200">
            <code className="text-sm font-mono font-bold text-amber-900">{orderNumber}</code>
          </div>
        </div>
      </div>
    </div>
  );
}