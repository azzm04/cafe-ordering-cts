"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Percent, DollarSign, Tag } from "lucide-react";

type Order = {
  id: string;
  order_number: string;
  total_amount: number;
  original_amount?: number;
  discount_amount?: number;
};

type Props = {
  order: Order;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;

  /** LOGIKA ROLE (BARU) */
  adminRole: "kasir" | "owner";
};

export function ManualDiscountDialog({
  order,
  open,
  onClose,
  onSuccess,
  adminRole,
}: Props) {
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">(
    "percentage"
  );
  const [discountValue, setDiscountValue] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  /** =========================
   * PERHITUNGAN (TIDAK DIUBAH)
   * ========================= */
  const originalAmount = order.original_amount || order.total_amount;
  const currentDiscount = order.discount_amount || 0;

  let newDiscountAmount = 0;
  if (discountValue) {
    const value = parseFloat(discountValue);
    if (!isNaN(value)) {
      newDiscountAmount =
        discountType === "percentage" ? (originalAmount * value) / 100 : value;
    }
  }

  if (newDiscountAmount > originalAmount) {
    newDiscountAmount = originalAmount;
  }

  const finalAmount = originalAmount - newDiscountAmount;

  /** =========================
   * SUBMIT LOGIC (DIPERKETAT)
   * ========================= */
  const handleApplyDiscount = async () => {
    /** 🔐 ROLE CHECK (BARU) */
    if (adminRole !== "owner") {
      toast.error("Hanya owner yang boleh memberikan diskon");
      return;
    }

    if (!discountValue || parseFloat(discountValue) <= 0) {
      toast.error("Masukkan nilai diskon yang valid");
      return;
    }

    if (!reason.trim() || reason.trim().length < 5) {
      toast.error("Alasan minimal 5 karakter");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/admin/orders/apply-discount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          order_id: order.id,
          discount_type: discountType,
          discount_value: parseFloat(discountValue),
          reason: reason.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Gagal memberikan diskon");
      }

      toast.success("Diskon berhasil diterapkan!");
      onSuccess();
      onClose();

      setDiscountValue("");
      setReason("");
      setDiscountType("percentage");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal memberikan diskon"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /** =========================
   * RENDER (UI TIDAK DIUBAH)
   * ========================= */
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Berikan Diskon Manual</DialogTitle>
          <DialogDescription>Order: {order.order_number}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card className="p-3 bg-muted/50">
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium">
                  Rp {originalAmount.toLocaleString("id-ID")}
                </span>
              </div>

              {currentDiscount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Diskon saat ini:</span>
                  <span>- Rp {currentDiscount.toLocaleString("id-ID")}</span>
                </div>
              )}

              <div className="flex justify-between font-semibold border-t pt-1">
                <span>Total saat ini:</span>
                <span>Rp {order.total_amount.toLocaleString("id-ID")}</span>
              </div>
            </div>
          </Card>

          <div className="space-y-2">
            <Label>Jenis Diskon</Label>
            <Select
              value={discountType}
              onValueChange={(v) =>
                setDiscountType(v as "percentage" | "fixed")
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">
                  <div className="flex items-center gap-2">
                    <Percent className="h-4 w-4" />
                    <span>Persentase (%)</span>
                  </div>
                </SelectItem>
                <SelectItem value="fixed">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <span>Nominal (Rp)</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Nilai Diskon</Label>
            <Input
              type="number"
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              min="0"
              step={discountType === "percentage" ? "1" : "1000"}
            />
          </div>

          <div className="space-y-2">
            <Label>Alasan Diskon</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          {newDiscountAmount > 0 && (
            <Card className="p-3 bg-blue-50 border-blue-200">
              <div className="space-y-1 text-sm">
                <div className="flex justify-between font-bold">
                  <span>Total akhir:</span>
                  <span>Rp {finalAmount.toLocaleString("id-ID")}</span>
                </div>
              </div>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Batal
          </Button>
          <Button
            onClick={handleApplyDiscount}
            disabled={
              isSubmitting ||
              adminRole !== "owner" ||
              !discountValue ||
              !reason.trim()
            }
          >
            {isSubmitting ? "Memproses..." : "Terapkan Diskon"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
