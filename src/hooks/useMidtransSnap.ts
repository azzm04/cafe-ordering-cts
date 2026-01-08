"use client";

import { useEffect, useState } from "react";

declare global {
  interface Window {
    snap: {
      pay: (snapToken: string, options: {
        onSuccess?: () => void;
        onPending?: () => void;
        onError?: () => void;
        onClose?: () => void;
      }) => void;
    };
  }
}

export function useMidtransSnap() {
  const [ready, setReady] = useState(() => typeof window !== "undefined" && !!window.snap);

  useEffect(() => {
    if (window.snap) return;

    const scriptId = "midtrans-snap-script";
    if (document.getElementById(scriptId)) return;

    const isProd = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true";

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = isProd
      ? "https://app.midtrans.com/snap/snap.js"
      : "https://app.sandbox.midtrans.com/snap/snap.js";
    script.async = true;
    script.setAttribute(
      "data-client-key",
      process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY!
    );

    script.onload = () => setReady(true);
    script.onerror = () => setReady(false);

    document.body.appendChild(script);
  }, []);

  return { snapReady: ready };
}