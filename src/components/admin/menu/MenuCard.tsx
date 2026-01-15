"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { MenuItemRow } from "@/types/admin/menu";

export default function MenuCard({
  it,
  isOwner,
  onToggleAvailability,
  onEdit,
  onArchive,
}: {
  it: MenuItemRow;
  isOwner: boolean;
  onToggleAvailability: (id: string, next: boolean) => void;
  onEdit: (it: MenuItemRow) => void;
  onArchive: (id: string) => void;
}) {
  return (
    <Card className="p-4 space-y-3 flex flex-col hover:shadow-md transition-shadow border-l-4 border-l-primary">
      <div className="flex-1 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm">{it.name}</h3>
          <Badge variant={it.is_available ? "secondary" : "destructive"} className="text-xs">
            {it.is_available ? "Tersedia" : "Habis"}
          </Badge>
        </div>

        {it.description && <p className="text-xs text-muted-foreground line-clamp-2">{it.description}</p>}

        <p className="text-sm font-bold text-primary">Rp {Number(it.price).toLocaleString("id-ID")}</p>
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <div className="flex flex-col sm:flex-row gap-2">
          {it.is_available ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onToggleAvailability(it.id, false)}
              className="flex-1 text-xs"
            >
              Set Habis
            </Button>
          ) : (
            <Button size="sm" onClick={() => onToggleAvailability(it.id, true)} className="flex-1 text-xs">
              Aktifkan
            </Button>
          )}

          <Button variant="outline" size="sm" onClick={() => onEdit(it)} className="flex-1 text-xs">
            Edit
          </Button>

          <Button variant="destructive" size="sm" onClick={() => onArchive(it.id)} className="flex-1 text-xs">
            Arsip
          </Button>
        </div>

        {isOwner && (
          <Link href={`/admin/menu/${it.id}/recipe`} className="block">
            <Button variant="outline" size="sm" className="w-full text-xs">
              Atur Resep
            </Button>
          </Link>
        )}
      </div>
    </Card>
  );
}
