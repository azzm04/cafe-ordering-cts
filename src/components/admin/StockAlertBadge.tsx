"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

type AlertsResponse = {
  count: number;
};

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function readCount(v: unknown): number {
  if (!isObject(v)) return 0;
  const c = v.count;
  return typeof c === "number" && Number.isFinite(c) ? c : 0;
}

export default function StockAlertBadge({
  refreshMs = 15000,
}: {
  refreshMs?: number;
}) {
  const [count, setCount] = useState(0);

  const load = async () => {
    const res = await fetch(`/api/admin/alerts?t=${Date.now()}`, {
      cache: "no-store",
    });
    if (!res.ok) return;
    const json: unknown = await res.json().catch(() => null);
    setCount(readCount(json));
  };

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), refreshMs);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (count <= 0) return null;

  return (
    <Badge variant="destructive" className="ml-2">
      {count}
    </Badge>
  );
}
