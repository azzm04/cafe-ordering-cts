"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AdminRole = "kasir" | "owner";

function getErrorMessage(err: unknown) {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  try {
    return JSON.stringify(err);
  } catch {
    return "Unknown error";
  }
}

function safeMessage(json: unknown, fallback: string) {
  if (typeof json === "object" && json !== null && "message" in json) {
    return String((json as Record<string, unknown>).message);
  }
  return fallback;
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function readRole(v: unknown): AdminRole | null {
  if (!isObject(v)) return null;
  const r = v.role;
  if (r === "owner" || r === "kasir") return r;
  return null;
}

export default function AdminLoginPage() {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  const onSubmit = async () => {
    setErr(null);
    setLoading(true);

    try {
      // 1) login -> set cookie
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });

      const json: unknown = await res.json().catch(() => null);
      if (!res.ok) throw new Error(safeMessage(json, "Login gagal"));

      // 2) cek role -> redirect sesuai role
      const meRes = await fetch(`/api/admin/me?t=${Date.now()}`, { cache: "no-store" });
      const meJson: unknown = await meRes.json().catch(() => null);
      const role = readRole(meJson);

      if (role === "owner") {
        router.replace("/admin/owner");
      } else if (role === "kasir") {
        router.replace("/admin/kasir");
      } else {
        // fallback
        router.replace("/admin");
      }
    } catch (e: unknown) {
      setErr(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto min-h-screen max-w-md p-6 flex items-center">
      <Card className="w-full p-5 space-y-3">
        <div>
          <h1 className="text-xl font-semibold">Admin Login</h1>
          <p className="text-sm opacity-70">Masukkan PIN untuk akses dashboard.</p>
        </div>

        <Input
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="PIN"
          type="password"
          inputMode="numeric"
        />

        {err ? <p className="text-sm text-red-600">{err}</p> : null}

        <Button className="w-full" onClick={onSubmit} disabled={loading || pin.length === 0}>
          {loading ? "Memproses..." : "Masuk"}
        </Button>
      </Card>
    </main>
  );
}
