"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useSessionGuard() {
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch(`/api/admin/me?t=${Date.now()}`, {
          cache: "no-store",
          credentials: "include",
        });

        if (res.status === 401 || !res.ok) {
          // Session tidak valid, redirect ke login
          router.replace("/admin/login");
        }
      } catch {
        // Error fetch, redirect ke login
        router.replace("/admin/login");
      }
    };

    // Cek session saat mount
    checkSession();

    // Cek session saat window mendapat focus (user kembali ke tab/klik back)
    const handleFocus = () => {
      checkSession();
    };

    // Cek session saat visibility berubah (user kembali ke tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkSession();
      }
    };

    // Cek session saat popstate (user klik tombol back/forward)
    const handlePopState = () => {
      checkSession();
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("popstate", handlePopState);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("popstate", handlePopState);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [router]);
}