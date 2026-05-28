import { randomBytes } from "crypto";

const PREFIX = "zion";

export function generateTxRef(purpose: "wallet" | "escrow"): string {
  const stamp = Date.now().toString(36);
  const rand = randomBytes(6).toString("hex");
  return `${PREFIX}_${purpose}_${stamp}_${rand}`;
}

export function generateLedgerReference(prefix: string): string {
  const rand = randomBytes(8).toString("hex");
  return `${PREFIX}_${prefix}_${Date.now().toString(36)}_${rand}`;
}

export function generateIdempotencyKey(scope: string): string {
  return `${PREFIX}_idem_${scope}_${randomBytes(10).toString("hex")}`;
}
