import type { Currency } from "./types";

const currencyLocales: Record<Currency, string> = {
  USD: "en-US",
  CAD: "en-CA",
  EUR: "de-DE",
  GBP: "en-GB",
};

export function formatMoney(amount: number, currency: Currency): string {
  return new Intl.NumberFormat(currencyLocales[currency], {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso + (iso.length === 10 ? "T12:00:00" : ""));
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function lineTotal(qty: number, rate: number): number {
  return Math.round(qty * rate * 100) / 100;
}

export function invoiceTotal(
  items: { quantity: number; rate: number }[]
): number {
  return Math.round(
    items.reduce((sum, i) => sum + lineTotal(i.quantity, i.rate), 0) * 100
  ) / 100;
}

export function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function daysFromNowISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function statusLabel(status: string): string {
  switch (status) {
    case "draft":
      return "Draft";
    case "sent":
      return "Sent";
    case "paid":
      return "Paid";
    default:
      return status;
  }
}
