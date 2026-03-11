/**
 * Mayar-ID Payment Gateway
 * Docs: https://documenter.getpostman.com/view/25084670/2s8Z6x1sr8
 *
 * Sandbox : https://api.mayar.club/hl/v1
 * Production: https://api.mayar.id/hl/v1
 */

import { createHmac } from "crypto";

// ─── Env ────────────────────────────────────────────────────────────────────
const API_KEY = process.env.MAYAR_API_KEY ?? "";
const API_SECRET = process.env.MAYAR_API_SECRET ?? "";
// Contoh nilai: https://api.mayar.id  (TANPA /hl/v1 dan TANPA trailing slash)
const BASE = (process.env.MAYAR_API_URL ?? "https://api.mayar.club").replace(/\/$/, "");

// ─── Types ───────────────────────────────────────────────────────────────────
export interface CreatePaymentParams {
  orderNumber: string;
  amount: number;
  buyerName: string;
  buyerEmail: string;
  redirectUrl: string;
  callbackUrl?: string;
}

export interface CreatePaymentResult {
  paymentId: string;     // data.id — ID payment link, dipakai webhook untuk lookup order
  transactionId: string; // data.transaction_id — ID transaksi internal Mayar
  paymentUrl: string;    // data.link — URL checkout Mayar
}

export type PaymentStatus =
  | "SUCCESS"
  | "PENDING"
  | "FAILED"
  | "EXPIRED"
  | "CANCELLED";

export interface CheckStatusResult {
  transactionId: string;
  status: PaymentStatus;
  amount: number;
}

// ─── Internal response shapes ─────────────────────────────────────────────
interface MayarError {
  status_code?: number;
  statusCode?: number;
  messages?: string | string[];
  message?: string;
}

interface MayarCreateData {
  id: string;             // ID payment link
  transaction_id: string; // ID transaksi (snake_case)
  transactionId: string;  // ID transaksi (camelCase — fallback)
  link: string;           // URL checkout
}

interface MayarCreateResponse extends MayarError {
  data?: MayarCreateData;
}

interface MayarStatusData {
  id: string;
  status: string;
  amount: number;
}

interface MayarStatusResponse extends MayarError {
  data?: MayarStatusData;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function extractError(json: MayarError, httpStatus: number): string {
  const msg = json.messages;
  return (
    (typeof msg === "string" ? msg : Array.isArray(msg) ? msg.join(", ") : "") ||
    json.message ||
    `HTTP ${httpStatus}`
  );
}

async function mayarFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ ok: boolean; status: number; json: T }> {
  if (!API_KEY) throw new Error("MAYAR_API_KEY tidak di-set di .env");

  const url = `${BASE}/hl/v1${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
      ...(options.headers ?? {}),
    },
  });

  const text = await res.text();

  let json: T;
  try {
    json = JSON.parse(text) as T;
  } catch {
    throw new Error(
      `Mayar mengembalikan non-JSON (${res.status}): ${text.slice(0, 200)}`
    );
  }

  return { ok: res.ok, status: res.status, json };
}

// ─── Create Payment ───────────────────────────────────────────────────────────
export async function createMayarPayment(
  params: CreatePaymentParams
): Promise<CreatePaymentResult> {
  const payload: Record<string, unknown> = {
    name: params.buyerName,
    email: params.buyerEmail,
    mobile: "08000000000",
    amount: params.amount,
    description: `Order ${params.orderNumber}`,
    redirectUrl: params.redirectUrl,
  };

  // Tambahkan callbackUrl jika disediakan
  if (params.callbackUrl) {
    payload.callbackUrl = params.callbackUrl;
  }

  console.log("[Mayar] POST /hl/v1/payment/create", payload);

  const { ok, status, json } = await mayarFetch<MayarCreateResponse>(
    "/payment/create",
    { method: "POST", body: JSON.stringify(payload) }
  );

  console.log("[Mayar] Response", status, JSON.stringify(json));

  if (!ok) {
    throw new Error(`Mayar error: ${extractError(json, status)}`);
  }

  // paymentId   = data.id           → ID unik payment link (yang Mayar kirim di webhook)
  // transactionId = data.transaction_id → ID transaksi internal Mayar
  const paymentId = json.data?.id;
  const transactionId = json.data?.transaction_id ?? json.data?.transactionId;
  const paymentUrl = json.data?.link;

  if (!paymentId || !transactionId || !paymentUrl) {
    throw new Error(`Mayar: response tidak lengkap — ${JSON.stringify(json)}`);
  }

  console.log(`[Mayar] paymentId: ${paymentId} | transactionId: ${transactionId}`);

  return { paymentId, transactionId, paymentUrl };
}

// ─── Check Status ─────────────────────────────────────────────────────────────
export async function checkMayarStatus(
  transactionId: string
): Promise<CheckStatusResult> {
  const { ok, status, json } = await mayarFetch<MayarStatusResponse>(
    `/payment/${transactionId}`
  );

  if (!ok) {
    throw new Error(`Mayar check status error: ${extractError(json, status)}`);
  }

  if (!json.data) {
    throw new Error(`Mayar: data tidak ada — ${JSON.stringify(json)}`);
  }

  return {
    transactionId: json.data.id,
    status: json.data.status as PaymentStatus,
    amount: json.data.amount,
  };
}

// ─── Webhook Signature ────────────────────────────────────────────────────────
export function verifyMayarSignature(
  rawBody: string,
  signature: string
): boolean {
  if (!API_SECRET) {
    console.error("[Mayar] MAYAR_API_SECRET tidak di-set");
    return false;
  }
  // Mayar mengirim Webhook Token langsung sebagai nilai header x-mayar-signature
  return signature === API_SECRET;
}