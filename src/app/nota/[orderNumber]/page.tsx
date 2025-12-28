import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatRupiah } from "@/lib/utils";

type Params = { orderNumber: string };

type OrderWithTable = {
  id: string;
  order_number: string;
  total_amount: number;
  payment_status: "pending" | "paid" | "failed" | "expired";
  payment_method: string | null;
  created_at: string;
  completed_at: string | null;
  tables?: { table_number: number } | null;
};

type OrderItemWithMenu = {
  id: string;
  menu_item_id: string;
  quantity: number;
  price: number;
  subtotal: number;
  notes?: string | null;
  menu_items?: { name: string } | null;
};

export default async function NotaPage({ params }: { params: Promise<Params> }) {
  const { orderNumber } = await params;

  const { data: order } = await supabaseServer
    .from("orders")
    .select("id, order_number, total_amount, payment_status, payment_method, created_at, completed_at, tables(table_number)")
    .eq("order_number", orderNumber)
    .single<OrderWithTable>();

  if (!order) {
    return (
      <main className="mx-auto min-h-screen max-w-md p-6 space-y-3">
        <p>Order tidak ditemukan.</p>
        <Link href="/">
          <Button>Kembali</Button>
        </Link>
      </main>
    );
  }

  const { data: items } = await supabaseServer
    .from("order_items")
    .select("id, menu_item_id, quantity, price, subtotal, notes, menu_items(name)")
    .eq("order_id", order.id)
    .returns<OrderItemWithMenu[]>();

  const tableNumber = order.tables?.table_number;

  const isCash = order.payment_method === "cash";
  const isCashPending = isCash && order.payment_status === "pending";

  return (
    <main className="mx-auto min-h-screen max-w-md p-6 space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Nota Digital</h2>
        <p className="text-sm opacity-80">Simpan untuk referensi.</p>
      </div>

      {isCashPending ? (
        <Card className="p-3 text-sm">
          <div className="font-semibold">Menunggu pembayaran tunai</div>
          <div className="opacity-80">
            Silakan bayar ke kasir dan tunjukkan nomor order: <span className="font-medium">{order.order_number}</span>
          </div>
        </Card>
      ) : null}

      <Card className="p-4 space-y-3">
        <div className="space-y-1">
          <div className="text-xs opacity-70">Order Number</div>
          <div className="font-bold">{order.order_number}</div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="opacity-80">Meja</span>
          <span className="font-semibold">{tableNumber ?? "-"}</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="opacity-80">Metode</span>
          <span className="font-semibold">{order.payment_method ?? "midtrans"}</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="opacity-80">Status</span>
          <span className="font-semibold">{order.payment_status}</span>
        </div>

        <Separator />

        <div className="space-y-2">
          {(items ?? []).map((it) => (
            <div key={it.id} className="flex items-start justify-between gap-3">
              <div className="text-sm">
                <div className="font-medium">{it.menu_items?.name ?? it.menu_item_id}</div>
                <div className="opacity-70">
                  {it.quantity} × {formatRupiah(it.price)}
                </div>
                {it.notes ? <div className="opacity-70">Catatan: {it.notes}</div> : null}
              </div>
              <div className="text-sm font-semibold">{formatRupiah(it.subtotal)}</div>
            </div>
          ))}
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <span className="text-sm opacity-80">Total</span>
          <span className="text-lg font-bold">{formatRupiah(order.total_amount)}</span>
        </div>

        <Link href="/menu">
          <Button className="w-full">Pesan Lagi</Button>
        </Link>
      </Card>
    </main>
  );
}
