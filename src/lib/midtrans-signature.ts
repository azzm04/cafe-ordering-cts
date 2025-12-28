function toHex(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function sha512Hex(input: string) {
  const enc = new TextEncoder();
  const hash = await crypto.subtle.digest("SHA-512", enc.encode(input));
  return toHex(hash);
}
