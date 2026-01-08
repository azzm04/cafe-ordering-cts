"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { fetchAdminOverview } from "@/lib/admin-services/overview";
import type { ActiveOrder, TableRow } from "@/lib/admin-services/overview";

export function useAdminOverview() {
  const [tables, setTables] = useState<TableRow[]>([]);
  const [orders, setOrders] = useState<ActiveOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminOverview();
      setTables(data.tables);
      setOrders(data.activeOrders);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const cashPending = useMemo(
    () => orders.filter((o) => o.payment_method === "cash" && o.payment_status === "pending" && o.completed_at === null),
    [orders]
  );

  const receivedPaid = useMemo(
    () => orders.filter((o) => o.payment_status === "paid" && o.fulfillment_status === "received" && o.completed_at === null),
    [orders]
  );

  const preparing = useMemo(
    () => orders.filter((o) => o.payment_status === "paid" && o.fulfillment_status === "preparing" && o.completed_at === null),
    [orders]
  );

  const activeServed = useMemo(
    () => orders.filter((o) => o.fulfillment_status === "served" && o.completed_at === null),
    [orders]
  );

  return {
    tables,
    orders,
    loading,
    refresh,
    cashPending,
    receivedPaid,
    preparing,
    activeServed,
  };
}
