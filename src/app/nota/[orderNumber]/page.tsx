// src/app/nota/[orderNumber]/page.tsx

import { notFound } from "next/navigation";
import { getNotaData } from "@/services/nota/getNotaData";
import { deriveEffectiveFulfillmentStatus, isCashPending } from "@/lib/nota/status";
import BackgroundDecorations from "@/components/shared/BackgroundDecorations"; // Pastikan path ini benar

import NotaHeader from "@/components/nota/NotaHeader";
import CashPendingAlert from "@/components/nota/CashPendingAlert";
import NotaSummaryCard from "@/components/nota/NotaSummaryCard";
import NotaActions from "@/components/nota/NotaActions";

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
    <main className="relative min-h-screen w-full overflow-x-hidden">
      {/* 1. Background Consistency */}
      <BackgroundDecorations />

      <div className="relative z-10 mx-auto min-h-screen flex flex-col max-w-md md:max-w-2xl px-4 py-8 sm:py-12">
        
        {/* Header Section */}
        <NotaHeader
          orderNumber={order.order_number}
          paymentStatus={order.payment_status}
          effectiveFulfillmentStatus={effectiveFulfillmentStatus}
        />

        {/* Alerts */}
        {cashPending && <CashPendingAlert orderNumber={order.order_number} />}

        {/* Main Card */}
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

        {/* Action Buttons */}
        <div className="mt-8">
          <NotaActions
            orderNumber={order.order_number}
            tableNumber={tableNumber}
            totalAmount={order.total_amount}
            paymentStatus={order.payment_status}
            paymentMethod={order.payment_method}
          />
        </div>

      </div>
    </main>
  );
}