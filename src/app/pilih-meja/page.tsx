"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Table } from "@/types";
import { useCartStore } from "@/store/cartStore";
import { TableSelector } from "@/components/TableSelector";
import { Button } from "@/components/ui/button";

export default function PilihMejaPage() {
  const router = useRouter();
  const setTableNumber = useCartStore((s) => s.setTableNumber);

  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTables = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tables?t=${Date.now()}`, {
        cache: "no-store",
      });

      const json: unknown = await res.json();

      if (!res.ok) {
        const msg =
          typeof json === "object" && json !== null && "message" in json
            ? String((json as Record<string, unknown>).message)
            : "Gagal ambil data meja";
        throw new Error(msg);
      }

      const tablesData =
        typeof json === "object" && json !== null && "tables" in json
          ? (json as Record<string, unknown>).tables
          : [];

      setTables(Array.isArray(tablesData) ? (tablesData as Table[]) : []);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Error";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTables();
  }, []);

  return (
    <main className="mx-auto min-h-screen max-w-md p-6 space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Pilih Nomor Meja</h2>
        <p className="text-sm opacity-80">Pilih meja yang tersedia.</p>
      </div>

      <div className="flex justify-end">
        <Button variant="secondary" onClick={loadTables} disabled={loading}>
          Refresh
        </Button>
      </div>

      {loading ? (
        <p className="text-sm opacity-70">Loading meja...</p>
      ) : (
        <TableSelector
          tables={tables}
          onSelect={(n) => {
            setTableNumber(n);
            router.push("/menu");
          }}
        />
      )}
    </main>
  );
}
