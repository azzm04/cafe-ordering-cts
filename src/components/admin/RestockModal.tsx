"use client";

import { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RestockModal({
  open,
  ingredient,
  onClose,
  onSuccess,
}: {
  open: boolean;
  ingredient: null | { id: string; name: string; unit: string; current: number };
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [qty, setQty] = useState<number>(0);
  const [reason, setReason] = useState<string>("restock");
  const [error, setError] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  async function submit() {
    if (!ingredient) return;
    setError("");

    if (!Number.isFinite(qty) || qty === 0) {
      setError("Jumlah harus angka dan tidak boleh 0.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/ingredients/restock", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ingredientId: ingredient.id,
            quantity: qty,
            reason: reason.trim() || "restock",
          }),
        });

        const j = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(j?.message ?? "Gagal restock");

        setQty(0);
        setReason("restock");
        onClose();
        onSuccess();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Restock Bahan</DialogTitle>
        </DialogHeader>

        {ingredient ? (
          <div className="space-y-3">
            <div className="text-sm">
              <div className="font-semibold">{ingredient.name}</div>
              <div className="text-muted-foreground">
                Stok saat ini: {ingredient.current} {ingredient.unit}
              </div>
            </div>

            {error ? <div className="text-sm text-red-600">{error}</div> : null}

            <div className="space-y-2">
              <div className="text-sm font-semibold">Jumlah (+ / -)</div>
              <Input type="number" value={qty} onChange={(e) => setQty(Number(e.target.value))} />
              <div className="text-xs text-muted-foreground">
                Pakai angka negatif untuk koreksi/pembuangan (sementara MVP).
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-semibold">Reason</div>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="restock harian / pembelian / waste" />
            </div>

            <Button onClick={submit} disabled={isPending} className="w-full">
              {isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
