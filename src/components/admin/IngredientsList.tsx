"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import RestockModal from "@/components/admin/RestockModal";

type Item = {
  id: string;
  name: string;
  unit: string;
  current_stock: number;
  min_stock: number;
  stock_status: "out_of_stock" | "low_stock" | "normal";
  used_in_menu_count: number;
  active_alerts: number;
};

export default function IngredientsList({
  initialItems,
  initialQ,
  initialStatus,
}: {
  initialItems: Item[];
  initialQ: string;
  initialStatus: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState(initialQ);
  const [status, setStatus] = useState(initialStatus);
  const [openRestock, setOpenRestock] = useState<null | { id: string; name: string; unit: string; current: number }>(null);
  const [isPending, startTransition] = useTransition();

  const items = useMemo(() => initialItems, [initialItems]);

  function applyFilter() {
    const sp = new URLSearchParams();
    if (q.trim()) sp.set("q", q.trim());
    if (status) sp.set("status", status);
    startTransition(() => router.push(`/admin/ingredients?${sp.toString()}`));
  }

  function statusBadge(s: Item["stock_status"]) {
    if (s === "out_of_stock") return <Badge variant="destructive">Habis</Badge>;
    if (s === "low_stock") return <Badge variant="secondary">Menipis</Badge>;
    return <Badge variant="outline">Aman</Badge>;
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <Input
          placeholder="Cari bahan…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        <select
          className="h-10 rounded-md border bg-background px-3 text-sm"
          value={status}
          aria-label="select"
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">Semua Status</option>
          <option value="normal">Aman</option>
          <option value="low_stock">Menipis</option>
          <option value="out_of_stock">Habis</option>
        </select>

        <Button onClick={applyFilter} disabled={isPending}>
          {isPending ? "Memuat..." : "Filter"}
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Stok</TableHead>
              <TableHead>Min</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Dipakai di menu</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  Belum ada bahan.
                </TableCell>
              </TableRow>
            ) : (
              items.map((it) => (
                <TableRow key={it.id}>
                  <TableCell className="font-semibold">{it.name}</TableCell>
                  <TableCell>
                    {it.current_stock} {it.unit}
                  </TableCell>
                  <TableCell>
                    {it.min_stock} {it.unit}
                  </TableCell>
                  <TableCell>{statusBadge(it.stock_status)}</TableCell>
                  <TableCell>{it.used_in_menu_count}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="outline"
                      onClick={() =>
                        setOpenRestock({ id: it.id, name: it.name, unit: it.unit, current: it.current_stock })
                      }
                    >
                      Restock
                    </Button>
                    <Link href={`/admin/ingredients/${it.id}/edit`}>
                      <Button variant="secondary">Edit</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Restock modal */}
      <RestockModal
        open={!!openRestock}
        ingredient={openRestock}
        onClose={() => setOpenRestock(null)}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
