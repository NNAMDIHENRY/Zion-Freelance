/** Pure string formatting — safe for client and server (no DB). */

export function budgetLabel(
  min: { toString(): string } | null | undefined,
  max: { toString(): string } | null | undefined,
  currency: string
) {
  if (!min && !max) return "—";
  const cur = currency || "USD";
  const a = min ? min.toString() : "?";
  if (!max || (min && max && min.toString() === max.toString())) return `${cur} ${a}`;
  const b = max.toString();
  return `${cur} ${a} – ${b}`;
}

export function statusLabel(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function moneyLabel(amount: { toString(): string }, currency: string) {
  const cur = currency || "USD";
  return `${cur} ${amount.toString()}`;
}
