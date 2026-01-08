import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ContinuePaymentButton } from "@/components/ContinuePaymentButton";
import { ShareNotaActions } from "@/components/ShareNotaActions";

export default function NotaActions({
  orderNumber,
  tableNumber,
  totalAmount,
  paymentStatus,
  paymentMethod,
}: {
  orderNumber: string;
  tableNumber: number | null;
  totalAmount: number;
  paymentStatus: "pending" | "paid" | "failed" | "expired";
  paymentMethod: string | null;
}) {
  const isPaid = paymentStatus === "paid";

  return (
    <div className="flex flex-col gap-3 mt-6">
      <Link href="/menu" className="w-full">
        <Button className="w-full font-bold h-12 text-base shadow-md" size="lg">
          🛒 Pesan Lagi
        </Button>
      </Link>

      {paymentStatus === "pending" && paymentMethod !== "cash" ? (
        <ContinuePaymentButton orderNumber={orderNumber} />
      ) : null}

      {isPaid ? (
        <ShareNotaActions
          orderNumber={orderNumber}
          tableNumber={tableNumber}
          totalAmount={totalAmount}
        />
      ) : null}
    </div>
  );
}
