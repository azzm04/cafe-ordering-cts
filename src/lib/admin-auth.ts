// src/lib/admin-auth.ts
export type AdminRole = "kasir" | "owner";

const cookieName = process.env.ADMIN_COOKIE_NAME ?? "cts_admin";
const pinKasir = process.env.ADMIN_PIN_KASIR ?? "";
const pinOwner = process.env.ADMIN_PIN_OWNER ?? "";
const secret = process.env.ADMIN_AUTH_SECRET ?? "";

export function getAdminCookieName() {
  return cookieName;
}

export function getRoleByPin(pin: string): AdminRole | null {
  const p = pin.trim();
  if (pinKasir && p === pinKasir) return "kasir";
  if (pinOwner && p === pinOwner) return "owner";
  return null;
}

function bufToHex(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacSha256Hex(key: string, msg: string) {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(msg));
  return bufToHex(sig);
}

export async function signAdminSession(input: { role: AdminRole }) {
  if (!secret) throw new Error("ADMIN_AUTH_SECRET belum diset di env");

  const payloadObj = { role: input.role, iat: Date.now() };
  const payload = Buffer.from(JSON.stringify(payloadObj)).toString("base64url");
  const sig = await hmacSha256Hex(secret, payload);
  return `${payload}.${sig}`;
}

export async function verifyAdminSession(
  token: string
): Promise<{ role: AdminRole } | null> {
  if (!secret) return null;

  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;

  const expected = await hmacSha256Hex(secret, payload);
  if (expected !== sig) return null;

  try {
    const json = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    ) as { role: AdminRole; iat: number };

    if (json.role !== "kasir" && json.role !== "owner") return null;

    // expire 7 hari
    const maxAgeMs = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - json.iat > maxAgeMs) return null;

    return { role: json.role };
  } catch {
    return null;
  }
}
