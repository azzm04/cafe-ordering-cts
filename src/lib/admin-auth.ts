const cookieName = process.env.ADMIN_COOKIE_NAME ?? "cts_admin";
const adminPin = process.env.ADMIN_PIN ?? "";

export function getAdminCookieName() {
  return cookieName;
}

function bufToHex(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function hashPin(pin: string) {
  const enc = new TextEncoder();
  const data = enc.encode(pin);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return bufToHex(digest);
}

export async function getExpectedCookieValue() {
  if (!adminPin) return "";
  return hashPin(adminPin);
}
