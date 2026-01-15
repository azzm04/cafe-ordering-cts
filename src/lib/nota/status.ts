import type { FulfillmentStatus, PaymentStatus } from "@/lib/nota/type";

export function deriveEffectiveFulfillmentStatus(input: {
  fulfillment_status: FulfillmentStatus;
  completed_at: string | null;
}): FulfillmentStatus {
  return input.completed_at ? "completed" : input.fulfillment_status;
}

export function isFailedPayment(s: PaymentStatus) {
  return s === "failed" || s === "expired";
}

export function isCashPending(input: {
  payment_method: string | null;
  payment_status: PaymentStatus;
}) {
  return input.payment_method === "cash" && input.payment_status === "pending";
}
