import type { Category, MenuItemRow, MeResponse } from "@/types/admin/menu";

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function safeMessage(json: unknown, fallback: string) {
  if (isObject(json) && "message" in json) return String(json.message);
  return fallback;
}

export async function fetchAdminMe(): Promise<MeResponse | null> {
  const res = await fetch(`/api/admin/me?t=${Date.now()}`, { cache: "no-store" });
  if (res.status === 401) return null;
  const json: unknown = await res.json().catch(() => null);
  if (!res.ok) return null;

  if (!isObject(json)) return null;
  const role = json.role;
  if (role === "kasir" || role === "owner") return { role };
  return null;
}

export async function fetchMenuItems(): Promise<MenuItemRow[]> {
  const res = await fetch(`/api/admin/menu-items?t=${Date.now()}`, { cache: "no-store" });
  const json: unknown = await res.json().catch(() => null);

  if (!res.ok) throw new Error(safeMessage(json, "Gagal load menu"));

  if (!isObject(json) || !Array.isArray(json.items)) return [];
  return json.items as MenuItemRow[];
}

export async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(`/api/admin/categories?t=${Date.now()}`, { cache: "no-store" });
  const json: unknown = await res.json().catch(() => null);

  if (!res.ok) throw new Error(safeMessage(json, "Gagal load kategori"));

  if (!isObject(json) || !Array.isArray(json.categories)) return [];
  return json.categories as Category[];
}

export async function apiCreateMenu(payload: {
  categoryId: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  isAvailable: boolean;
}) {
  const res = await fetch("/api/admin/menu-items/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json: unknown = await res.json().catch(() => null);
  if (!res.ok) throw new Error(safeMessage(json, "Gagal create menu"));
}

export async function apiUpdateMenu(payload: {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  isAvailable: boolean;
}) {
  const res = await fetch("/api/admin/menu-items/update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json: unknown = await res.json().catch(() => null);
  if (!res.ok) throw new Error(safeMessage(json, "Gagal update menu"));
}

export async function apiArchiveMenu(id: string) {
  const res = await fetch("/api/admin/menu-items/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
    cache: "no-store",
  });
  const json: unknown = await res.json().catch(() => null);
  if (!res.ok) throw new Error(safeMessage(json, "Gagal arsip menu"));
}
