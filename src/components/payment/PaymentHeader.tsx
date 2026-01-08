import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export function PaymentHeader({ onBack }: { onBack: () => void }) {
  return (
    <div className="mb-6 flex items-center gap-4">
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={onBack}
        className="h-10 w-10 rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>
      <div>
        <h1 className="text-2xl font-bold leading-none">Pembayaran</h1>
        <p className="text-sm text-muted-foreground mt-1">Selesaikan pesanan Anda</p>
      </div>
    </div>
  );
}