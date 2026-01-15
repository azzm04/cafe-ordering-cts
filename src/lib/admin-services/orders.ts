import type { FulfillmentStatus } from "@/lib/admin-services/overview";

function safeMessage(json: unknown, fallback: string) {
  if (typeof json === "object" && json !== null && "message" in json) {
    return String((json as Record<string, unknown>).message);
  }
  return fallback;
}

export async function confirmCashOrder(orderNumber: string) {
  const res = await fetch("/api/admin/orders/confirm-cash", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderNumber }),
  });
  const json = (await res.json()) as unknown;
  if (!res.ok) throw new Error(safeMessage(json, "Gagal konfirmasi tunai"));
}

export async function updateFulfillmentStatus(orderId: string, status: FulfillmentStatus) {
  const res = await fetch("/api/admin/orders/update-status", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId, status }),
    cache: "no-store",
  });
  const json = (await res.json()) as unknown;
  if (!res.ok) throw new Error(safeMessage(json, "Gagal update status"));
}

export async function completeOrder(orderNumber: string) {
  const res = await fetch("/api/admin/orders/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderNumber }),
  });
  const json = (await res.json()) as unknown;
  if (!res.ok) throw new Error(safeMessage(json, "Gagal menyelesaikan order"));
}
