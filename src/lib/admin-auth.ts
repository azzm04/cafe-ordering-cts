// src/lib/admin-auth.ts
import { supabaseAdmin } from "@/lib/supabase/admin";

export type AdminRole = "kasir" | "owner";

export type AdminSessionData = {
  id: string;
  username: string;
  role: AdminRole;
  iat: number;
};

const cookieName = process.env.ADMIN_COOKIE_NAME ?? "cts_admin";
const secret = process.env.ADMIN_AUTH_SECRET ?? "";

export function getAdminCookieName() {
  return cookieName;
}

export async function getAdminByPin(pin: string) {
  //  Cari user yang PIN-nya cocok dan masih aktif
  const { data, error } = await supabaseAdmin
    .from("admin_users")
    .select("id, username, role")
    .eq("pin", pin)
    .eq("is_active", true)
    .single();

  if (error || !data) {
    return null;
  }

  // Return data user
  return {
    id: data.id,
    username: data.username,
    role: data.role as AdminRole,
  };
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

export async function signAdminSession(input: { id: string; username: string; role: AdminRole }) {
  if (!secret) throw new Error("ADMIN_AUTH_SECRET belum diset di env");

  const payloadObj: AdminSessionData = { 
    id: input.id, 
    username: input.username,
    role: input.role, 
    iat: Date.now() 
  };
  
  const payload = Buffer.from(JSON.stringify(payloadObj)).toString("base64url");
  const sig = await hmacSha256Hex(secret, payload);
  return `${payload}.${sig}`;
}

export async function verifyAdminSession(
  token: string
): Promise<AdminSessionData | null> {
  if (!secret) return null;

  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;

  const expected = await hmacSha256Hex(secret, payload);
  if (expected !== sig) return null;

  try {
    const json = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    ) as AdminSessionData;

    // Validasi dasar
    if (!json.id || !json.role) return null;
    if (json.role !== "kasir" && json.role !== "owner") return null;

    // Expire 7 hari
    const maxAgeMs = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - json.iat > maxAgeMs) return null;

    return json;
  } catch {
    return null;
  }
}