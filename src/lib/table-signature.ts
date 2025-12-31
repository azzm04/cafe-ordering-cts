import crypto from "crypto";

const SECRET = process.env.TABLE_QR_SECRET ?? "";

export function signTable(tableNumber: number): string {
  return crypto
    .createHmac("sha256", SECRET)
    .update(String(tableNumber))
    .digest("hex");
}

export function verifyTableSignature(
  tableNumber: number,
  signature: string
): boolean {
  const expected = signTable(tableNumber);
  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signature)
  );
}
