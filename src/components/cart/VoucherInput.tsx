"use client";

import { useState } from "react";
import { Loader2, Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type Props = {
  totalAmount: number;
  onApply: (discount: number, code: string) => void;
  onRemove: () => void;
};

export function VoucherInput({ totalAmount, onApply, onRemove }: Props) {
  const [code, setCode] = useState("");
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleApply = async () => {
    if (!code.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/vouchers/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, totalAmount }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Gagal memasang voucher");
        return;
      }

      toast.success(`Hemat Rp ${data.discountAmount.toLocaleString("id-ID")}`);
      setAppliedCode(data.code);
      onApply(data.discountAmount, data.code);
    } catch (error) {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    setAppliedCode(null);
    setCode("");
    onRemove();
    toast.info("Voucher dilepas");
  };

  if (appliedCode) {
    return (
      <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-emerald-600" />
          <span className="font-medium text-emerald-700">{appliedCode}</span>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleRemove}
          className="h-6 w-6 p-0 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Input
        placeholder="Punya kode promo?"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="bg-background"
        disabled={loading}
      />
      <Button 
        onClick={handleApply} 
        disabled={loading || !code}
        variant="secondary"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Pakai"}
      </Button>
    </div>
  );
}