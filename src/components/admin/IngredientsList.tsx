"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Search,
  Filter,
  Package,
  AlertTriangle,
  Archive,
  Pencil,
  ChevronDown,
  Trash2,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import RestockModal from "@/components/admin/RestockModal";

type Item = {
  id: string;
  name: string;
  unit: string;
  current_stock: number;
  min_stock: number;
  stock_status: "out_of_stock" | "low_stock" | "normal";
  used_in_menu_count: number;
  menu_names?: string[];
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
  const [openRestock, setOpenRestock] = useState<null | {
    id: string;
    name: string;
    unit: string;
    current: number;
  }>(null);
  const [deleteDialog, setDeleteDialog] = useState<null | {
    id: string;
    name: string;
  }>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [, startTransition] = useTransition();

  const items = useMemo(() => initialItems, [initialItems]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // cache for fetched menu names by ingredient id
  const [menuNamesMap, setMenuNamesMap] = useState<Record<string, string[]>>(
    {},
  );
  const [menuLoading, setMenuLoading] = useState<Record<string, boolean>>({});
  const [menuError, setMenuError] = useState<Record<string, string>>({});

  const fetchMenuNames = async (id: string) => {
    // already loaded or loading
    if (menuNamesMap[id] || menuLoading[id]) return;
    setMenuLoading((p) => ({ ...p, [id]: true }));
    try {
      const res = await fetch(`/api/admin/ingredients/${id}/menus`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error((await res.text()) || res.statusText);
      const json = await res.json();
      setMenuNamesMap((p) => ({ ...p, [id]: json.menu_names ?? [] }));
    } catch (err) {
      setMenuError((p) => ({ ...p, [id]: (err as Error).message ?? "Gagal" }));
    } finally {
      setMenuLoading((p) => ({ ...p, [id]: false }));
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/ingredients/${deleteDialog.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || res.statusText);
      }

      router.refresh();
      setDeleteDialog(null);
    } catch (err) {
      alert(`Gagal menghapus bahan: ${(err as Error).message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Stats
  const stats = useMemo(() => {
    return {
      total: items.length,
      low: items.filter((i) => i.stock_status === "low_stock").length,
      out: items.filter((i) => i.stock_status === "out_of_stock").length,
    };
  }, [items]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const sp = new URLSearchParams();
      if (q.trim()) sp.set("q", q.trim());
      if (status) sp.set("status", status);
      const qs = sp.toString();
      const url = qs ? `/admin/ingredients?${qs}` : "/admin/ingredients";
      startTransition(() => router.replace(url));
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [q, status, router]);

  function StatusBadge({ s }: { s: Item["stock_status"] }) {
    if (s === "out_of_stock")
      return (
        <Badge
          variant="destructive"
          className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200 shadow-none whitespace-nowrap"
        >
          Habis
        </Badge>
      );
    if (s === "low_stock")
      return (
        <Badge
          variant="secondary"
          className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200 shadow-none whitespace-nowrap"
        >
          Menipis
        </Badge>
      );
    return (
      <Badge
        variant="outline"
        className="bg-emerald-50 text-emerald-700 border-emerald-200 shadow-none whitespace-nowrap"
      >
        Aman
      </Badge>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards - Responsive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Total Item */}
        <Card className="shadow-sm border-border">
          <div className="p-4 flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Total Item
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-foreground">
                  {stats.total}
                </span>
                <span className="text-sm text-muted-foreground">
                  bahan terdaftar
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Card 2: Stok Menipis */}
        <Card className="shadow-sm border-border">
          <div className="p-4 flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-50">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Stok Menipis
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-foreground">
                  {stats.low}
                </span>
                <span className="text-sm text-muted-foreground">
                  perlu perhatian
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Card 3: Stok Habis */}
        <Card className="shadow-sm border-border">
          <div className="p-4 flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-50">
              <Archive className="h-6 w-6 text-red-600" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Stok Habis
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-foreground">
                  {stats.out}
                </span>
                <span className="text-sm text-muted-foreground">
                  restock sekarang
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="shadow-sm border-border">
        {/* Toolbar - Responsive Flex */}
        <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b">
          <div className="relative flex-1 w-full sm:max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama bahan..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9 h-9 w-full"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              aria-label="select"
              className="h-9 flex-1 sm:flex-none rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">Semua Status</option>
              <option value="normal">Aman</option>
              <option value="low_stock">Menipis</option>
              <option value="out_of_stock">Habis</option>
            </select>
          </div>
        </div>

        {/* Tabel - Responsive Columns */}
        <div className="relative w-full overflow-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-[35%] sm:w-[30%]">Nama Bahan</TableHead>
                <TableHead className="w-[20%] sm:w-[15%]">Stok</TableHead>
                {/* Min Stok Hidden on Mobile */}
                <TableHead className="hidden sm:table-cell w-[15%]">
                  Min. Stok
                </TableHead>
                <TableHead className="w-[20%] sm:w-auto">Status</TableHead>
                {/* Menu Terkait Hidden on Mobile/Tablet */}
                <TableHead className="hidden md:table-cell w-[20%]">
                  Menu Terkait
                </TableHead>
                <TableHead className="text-right w-[25%] sm:w-auto">
                  Aksi
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground/50">
                      <Package className="h-10 w-10 mb-2 opacity-20" />
                      <p>Tidak ada bahan ditemukan.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((it) => (
                  <TableRow key={it.id} className="hover:bg-muted/5">
                    <TableCell className="font-medium align-top sm:align-middle">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm">{it.name}</span>
                        {/* Mobile Only Min Stock Display */}
                        <span className="text-[10px] text-muted-foreground sm:hidden">
                          Min: {it.min_stock} {it.unit}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="align-top sm:align-middle">
                      <div className="font-medium text-sm">
                        {it.current_stock}{" "}
                        <span className="text-muted-foreground text-xs font-normal">
                          {it.unit}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className="text-muted-foreground text-sm">
                        {it.min_stock} {it.unit}
                      </span>
                    </TableCell>
                    <TableCell className="align-top sm:align-middle">
                      <StatusBadge s={it.stock_status} />
                    </TableCell>

                    {/* Menu Popover - Desktop Only */}
                    <TableCell className="hidden md:table-cell">
                      {it.used_in_menu_count > 0 ? (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs font-normal gap-1 px-2 hover:bg-muted"
                              onClick={() => fetchMenuNames(it.id)}
                            >
                              {it.used_in_menu_count} Menu
                              <ChevronDown className="h-3 w-3 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-60 p-3" align="start">
                            <div className="space-y-2">
                              <h4 className="font-medium text-xs text-muted-foreground border-b pb-1">
                                Digunakan di menu:
                              </h4>

                              {menuLoading[it.id] ? (
                                <p className="text-sm text-muted-foreground">
                                  Memuat...
                                </p>
                              ) : menuError[it.id] ? (
                                <p className="text-sm text-destructive">
                                  Gagal memuat: {menuError[it.id]}
                                </p>
                              ) : (menuNamesMap[it.id] &&
                                  menuNamesMap[it.id].length > 0) ||
                                (it.menu_names && it.menu_names.length > 0) ? (
                                <ul className="text-sm space-y-1 max-h-50 overflow-y-auto">
                                  {(
                                    menuNamesMap[it.id] ??
                                    it.menu_names ??
                                    []
                                  ).map((menuName: string, idx: number) => (
                                    <li
                                      key={idx}
                                      className="flex items-start gap-2 text-foreground"
                                    >
                                      <span className="block w-1.5 h-1.5 mt-1.5 rounded-full bg-primary/40 shrink-0" />
                                      {menuName}
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-xs text-muted-foreground italic">
                                  List detail menu belum tersedia.
                                </p>
                              )}
                            </div>
                          </PopoverContent>
                        </Popover>
                      ) : (
                        <span className="text-muted-foreground text-xs pl-2">
                          -
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="text-right align-top sm:align-middle">
                      <div className="flex flex-col sm:flex-row justify-end items-end sm:items-center gap-2 sm:gap-1">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-7 sm:h-8 text-[10px] sm:text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 shadow-sm w-full sm:w-auto"
                          onClick={() =>
                            setOpenRestock({
                              id: it.id,
                              name: it.name,
                              unit: it.unit,
                              current: it.current_stock,
                            })
                          }
                        >
                          Restock
                        </Button>
                        <div className="flex items-center gap-1">
                          <Link href={`/admin/ingredients/${it.id}/edit`}>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-muted"
                              title="Edit Bahan"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-red-50"
                            title="Hapus Bahan"
                            onClick={() =>
                              setDeleteDialog({ id: it.id, name: it.name })
                            }
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <RestockModal
        open={!!openRestock}
        ingredient={openRestock}
        onClose={() => setOpenRestock(null)}
        onSuccess={() => router.refresh()}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteDialog}
        onOpenChange={(open) => !open && setDeleteDialog(null)}
      >
        <AlertDialogContent className="w-[90%] sm:max-w-lg rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Bahan?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda yakin ingin menghapus bahan{" "}
              <strong>{deleteDialog?.name}</strong>?
              <br />
              <span className="text-destructive font-medium mt-2 block">
                Tindakan ini tidak dapat dibatalkan dan akan menghapus semua
                data terkait.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 justify-end sm:gap-0">
            <AlertDialogCancel
              disabled={isDeleting}
              className="flex-1 sm:flex-none mt-0"
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90 flex-1 sm:flex-none"
            >
              {isDeleting ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
