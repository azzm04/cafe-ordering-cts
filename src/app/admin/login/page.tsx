"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LockKeyhole, Loader2, ChefHat, ArrowRight } from "lucide-react";

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

  const onSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault(); // Handle form submit
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
      const meRes = await fetch(`/api/admin/me?t=${Date.now()}`, {
        cache: "no-store",
      });
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
    <main className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none z-0"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none z-0"></div>

      <div className="relative z-10 w-full max-w-md px-6">
        <Card className="overflow-hidden border-none shadow-2xl bg-white/80 backdrop-blur-xl dark:bg-card/50 ring-1 ring-border/50 rounded-3xl">
          {/* Header Section */}
          <div className="pt-8 pb-6 px-8 text-center bg-gradient-to-b from-muted/50 to-transparent">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 shadow-sm ring-1 ring-primary/20">
              <LockKeyhole className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Selamat Datang
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Silakan masukkan PIN untuk mengakses sistem manajemen Coklat Tepi
              Sawah.
            </p>
          </div>

          {/* Form Section */}
          <div className="p-8 pt-2">
            <form onSubmit={onSubmit} className="space-y-6">
              <div className="space-y-2">
                <Input
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="• • • • • •"
                  type="password"
                  inputMode="numeric"
                  className="text-center text-2xl tracking-[0.5em] h-14 rounded-xl bg-background/50 focus:bg-background border-border/60 focus:ring-2 focus:ring-primary/20 transition-all font-mono placeholder:text-muted-foreground/30 placeholder:tracking-widest"
                  autoFocus
                />
              </div>

              {err && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-sm text-center font-medium animate-in fade-in slide-in-from-top-1">
                  {err}
                </div>
              )}

              <Button
                className="w-full h-12 text-base font-semibold rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
                onClick={() => onSubmit()}
                disabled={loading || pin.length === 0}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    Masuk Dashboard <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-border/40 text-center">
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/60">
                <ChefHat className="w-3 h-3" />
                <span>Coklat Tepi Sawah Management System</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
