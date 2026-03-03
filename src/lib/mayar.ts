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
// Contoh nilai: https://api.mayar.club  (TANPA /hl/v1 dan TANPA trailing slash)
const BASE = (process.env.MAYAR_API_URL ?? "https://api.mayar.club").replace(/\/$/, "");

// ─── Types ───────────────────────────────────────────────────────────────────
export interface CreatePaymentParams {
  orderNumber: string;
  amount: number;
  buyerName: string;
  buyerEmail: string;
  redirectUrl: string;
}

export interface CreatePaymentResult {
  transactionId: string; // id dari Mayar
  paymentUrl: string;    // link checkout Mayar
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
  id: string;
  transaction_id: string;
  transactionId: string;
  link: string;
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
  const payload = {
    name: params.buyerName,
    email: params.buyerEmail,
    mobile: "08000000000",
    amount: params.amount,
    description: `Order ${params.orderNumber}`,
    redirectUrl: params.redirectUrl,
  };

  console.log("[Mayar] POST /hl/v1/payment/create", payload);

  const { ok, status, json } = await mayarFetch<MayarCreateResponse>(
    "/payment/create",
    { method: "POST", body: JSON.stringify(payload) }
  );

  console.log("[Mayar] Response", status, JSON.stringify(json));

  if (!ok) {
    throw new Error(`Mayar error: ${extractError(json, status)}`);
  }

  const link = json.data?.link;
  const id = json.data?.transaction_id ?? json.data?.transactionId ?? json.data?.id;

  if (!link || !id) {
    throw new Error(`Mayar: response tidak lengkap — ${JSON.stringify(json)}`);
  }

  // Fix sandbox: link menggunakan mayar.shop, tapi sandbox ada di mayar.club
  // const isSandbox = (process.env.MAYAR_API_URL ?? "").includes("mayar.club");
  // const paymentUrl = isSandbox ? link.replace("mayar.shop", "mayar.club") : link;

  return { transactionId: id, paymentUrl: link };

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
  const hash = createHmac("sha256", API_SECRET)
    .update(rawBody)
    .digest("hex");
  return hash === signature;
}