export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { notFound } from "next/navigation"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { formatWaktuID } from "@/lib/date"
import { PrintAuto } from "@/components/PrintAuto"

type OrderRow = {
  id: string
  order_number: string
  created_at: string
  payment_status: "pending" | "paid" | "failed" | "expired"
  payment_method: string | null
  tables: { table_number: number } | null
}

type ItemRow = {
  id: string
  quantity: number
  notes: string | null
  menu_items: { name: string; category_id: string } | null
}

type CategoryRow = { id: string; name: string }

function getCategoryName(map: Map<string, string>, categoryId: string) {
  return (map.get(categoryId) ?? "").toLowerCase()
}

export default async function PrintBarPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>
}) {
  const { orderNumber } = await params

  const { data: order, error: orderErr } = await supabaseAdmin
    .from("orders")
    .select("id,order_number,created_at,payment_status,payment_method,tables(table_number)")
    .eq("order_number", orderNumber)
    .single<OrderRow>()

  if (orderErr || !order) return notFound()

  const [{ data: items, error: itemsErr }, { data: cats, error: catsErr }] = await Promise.all([
    supabaseAdmin
      .from("order_items")
      .select("id,quantity,notes,menu_items(name,category_id)")
      .eq("order_id", order.id)
      .returns<ItemRow[]>(),
    supabaseAdmin.from("categories").select("id,name").returns<CategoryRow[]>(),
  ])

  if (itemsErr || catsErr) return notFound()

  const catMap = new Map<string, string>((cats ?? []).map((c) => [c.id, c.name]))

  const barItems =
    (items ?? []).filter((it) => {
      const catId = it.menu_items?.category_id
      if (!catId) return false
      return getCategoryName(catMap, catId) === "minuman"
    }) ?? []

  return (
    <main className="mx-auto p-4 print:p-0" style={{ width: "80mm" }}>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; padding: 0; }
        }
      `}</style>

      <PrintAuto />

      <div className="space-y-3 text-sm">
        <div className="text-center border-b-2 border-solid pb-3">
          <div className="font-bold text-lg tracking-wide">Coklat Tepi Sawah</div>
          <div className="text-xs font-semibold uppercase tracking-widest opacity-70">Struk Bar</div>
        </div>

        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="opacity-70">Order</span>
            <span className="font-bold">{order.order_number}</span>
          </div>
          <div className="flex justify-between">
            <span className="opacity-70">Meja</span>
            <span className="font-bold">{order.tables?.table_number ?? "-"}</span>
          </div>
          <div className="flex justify-between">
            <span className="opacity-70">Waktu</span>
            <span className="font-semibold">{formatWaktuID(order.created_at)}</span>
          </div>
        </div>

        <div className="border-t border-dashed opacity-50" />

        {barItems.length === 0 ? (
          <div className="text-xs opacity-60 text-center py-3">Tidak ada item minuman.</div>
        ) : (
          <div className="space-y-3">
            {barItems.map((it) => (
              <div key={it.id} className="border-l-2 border-amber-600 pl-2">
                <div className="text-sm font-bold">
                  {it.quantity}× {it.menu_items?.name ?? "Item"}
                </div>
                {it.notes && <div className="text-xs opacity-75 mt-1 italic">Catatan: {it.notes}</div>}
              </div>
            ))}
          </div>
        )}

        <div className="border-t border-dashed opacity-50 pt-2" />

        <div className="text-center text-[10px] opacity-60 pt-1">Prioritaskan berdasarkan waktu order</div>
      </div>
    </main>
  )
}
