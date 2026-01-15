"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function DashboardHeader({
  title,
  subtitle,
  onRefresh,
  loading,
  rightSlot,
}: {
  title: string;
  subtitle: string;
  onRefresh: () => void;
  loading: boolean;
  rightSlot?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto items-stretch">
        <Button variant="secondary" onClick={onRefresh} disabled={loading} className="flex-1 sm:flex-none">
          {loading ? "Loading..." : "Refresh"}
        </Button>

        {rightSlot}

        <Link href="/admin/history" className="flex-1 sm:flex-none">
          <Button variant="outline" className="w-full sm:w-auto bg-transparent">
            History Pesanan
          </Button>
        </Link>

        <Button
          variant="outline"
          onClick={() => {
            document.cookie = "cts_admin=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
            location.href = "/admin/login";
          }}
          className="flex-1 sm:flex-none"
        >
          Logout
        </Button>
      </div>
    </div>
  );
}
