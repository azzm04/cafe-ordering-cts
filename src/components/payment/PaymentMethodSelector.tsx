import { QrCode, Banknote, ShieldCheck, Receipt, Wallet } from "lucide-react";
import type { PaymentMethod } from "@/hooks/usePaymentLogic";

interface Props {
  method: PaymentMethod;
  setMethod: (m: PaymentMethod) => void;
  loading: boolean;
}

export function PaymentMethodSelector({ method, setMethod, loading }: Props) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <Wallet className="h-4 w-4 text-primary" />
        Metode Pembayaran
      </h3>

      <div className="grid gap-3 sm:grid-cols-2">
        {/* Online (Mayar) */}
        <SelectionCard
          active={method === "online"}
          onClick={() => setMethod("online")}
          loading={loading}
          icon={<QrCode className="h-5 w-5" />}
          title="Mayar-ID"
          desc="Transfer, E-Wallet"
        />

        {/* Cash */}
        <SelectionCard
          active={method === "cash"}
          onClick={() => setMethod("cash")}
          loading={loading}
          icon={<Banknote className="h-5 w-5" />}
          title="Tunai"
          desc="Bayar di kasir"
        />
      </div>

      {/* Info Box */}
      <div className="rounded-xl bg-muted/30 p-4 text-xs text-muted-foreground border border-border/50 flex gap-3 items-start">
        <div className="mt-0.5 shrink-0">
          {method === "online" ? (
            <ShieldCheck className="h-4 w-4 text-primary" />
          ) : (
            <Receipt className="h-4 w-4 text-primary" />
          )}
        </div>
        <p className="leading-relaxed">
          {method === "online"
            ? "Pembayaran diproses aman via Mayar-ID. Mendukung Transfer Bank, GCash, Dana, dan E-Wallet lainnya."
            : "Silakan menuju kasir setelah membuat pesanan untuk melakukan pembayaran tunai. Pesanan akan diproses setelah dikonfirmasi."}
        </p>
      </div>
    </div>
  );
}

interface SelectionCardProps {
  active: boolean;
  onClick: () => void;
  loading: boolean;
  icon: React.ReactNode;
  title: string;
  desc: string;
}

function SelectionCard({ active, onClick, loading, icon, title, desc }: SelectionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`group relative flex flex-col items-start gap-3 rounded-2xl border p-4 text-left transition-all hover:shadow-md ${
        active
          ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary"
          : "border-border/50 bg-background/50 hover:border-primary/50 hover:bg-background"
      }`}
    >
      <div className={`rounded-full p-2 transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
      }`}>
        {icon}
      </div>
      <div>
        <span className={`block font-bold ${active ? "text-primary" : "text-foreground"}`}>
          {title}
        </span>
        <span className="text-xs text-muted-foreground mt-0.5 block">{desc}</span>
      </div>
      {active && (
        <div className="absolute top-4 right-4 h-3 w-3 rounded-full bg-primary shadow-sm ring-2 ring-background" />
      )}
    </button>
  );
}