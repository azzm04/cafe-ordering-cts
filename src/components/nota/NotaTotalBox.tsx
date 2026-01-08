import { formatRupiah } from "@/lib/utils";

export default function NotaTotalBox({ total }: { total: number }) {
  return (
    <div className="bg-primary/10 p-4 sm:p-6 rounded-lg border border-primary/20">
      <div className="flex items-baseline justify-between">
        <span className="text-sm sm:text-lg font-bold text-muted-foreground uppercase tracking-wide">
          Total
        </span>
        <span className="text-2xl sm:text-4xl font-bold text-primary">
          {formatRupiah(total)}
        </span>
      </div>
    </div>
  );
}
