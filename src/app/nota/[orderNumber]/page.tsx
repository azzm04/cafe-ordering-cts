import { notFound } from "next/navigation";
import NotaHeader from "@/components/nota/NotaHeader";
import CashPendingAlert from "@/components/nota/CashPendingAlert";
import NotaSummaryCard from "@/components/nota/NotaSummaryCard";
import NotaActions from "@/components/nota/NotaActions";
import { getNotaData } from "@/services/nota/getNotaData";
import { deriveEffectiveFulfillmentStatus, isCashPending } from "@/lib/nota/status";

export const dynamic = "force-dynamic";

type Params = { orderNumber: string };

export default async function NotaPage({ params }: { params: Promise<Params> }) {
  const { orderNumber } = await params;

  const data = await getNotaData(orderNumber);
  if (!data) return notFound();

  const { order, items } = data;

  const tableNumber = order.tables?.table_number ?? null;

  const effectiveFulfillmentStatus = deriveEffectiveFulfillmentStatus({
    fulfillment_status: order.fulfillment_status,
    completed_at: order.completed_at,
  });

  const cashPending = isCashPending({
    payment_method: order.payment_method,
    payment_status: order.payment_status,
  });

  const isPaid = order.payment_status === "paid";

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 lg:p-8 pb-20">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background pointer-events-none" />
      <div className="max-w-2xl mx-auto relative z-10">
        <NotaHeader
          orderNumber={order.order_number}
          paymentStatus={order.payment_status}
          effectiveFulfillmentStatus={effectiveFulfillmentStatus}
        />

        {cashPending ? <CashPendingAlert orderNumber={order.order_number} /> : null}

        <NotaSummaryCard
          orderNumber={order.order_number}
          tableNumber={tableNumber}
          paymentMethod={order.payment_method}
          createdAt={order.created_at}
          completedAt={order.completed_at}
          isPaid={isPaid}
          effectiveFulfillmentStatus={effectiveFulfillmentStatus}
          items={items}
          totalAmount={order.total_amount}
        />

        <NotaActions
          orderNumber={order.order_number}
          tableNumber={tableNumber}
          totalAmount={order.total_amount}
          paymentStatus={order.payment_status}
          paymentMethod={order.payment_method}
        />
      </div>
    </main>
  );
}
