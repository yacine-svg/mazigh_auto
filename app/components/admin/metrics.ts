import type { Car } from "@/app/data/cars";
import type { CarFinance } from "@/app/data/car-finances";

export const MONTHS_SHORT = ["Janv.", "Févr.", "Mars", "Avr.", "Mai", "Juin", "Juil.", "Août", "Sept.", "Oct.", "Nov.", "Déc."];

/** YYYY-MM-DD for a date as seen in Algiers. */
export function dateKeyInAlgiers(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Algiers",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function stockDays(car: Pick<Car, "created_at" | "statut">, finance?: CarFinance | null) {
  const startedAt = dateKeyInAlgiers(car.created_at);
  const endedAt =
    car.statut === "vendue" && finance?.date_vente ? finance.date_vente.slice(0, 10) : dateKeyInAlgiers(new Date());
  if (!startedAt || !endedAt) return null;
  const start = Date.parse(`${startedAt}T00:00:00Z`);
  const end = Date.parse(`${endedAt}T00:00:00Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
  return Math.max(0, Math.floor((end - start) / 86_400_000));
}

export function saleProfit(finance: CarFinance | null | undefined): number | null {
  if (!finance || finance.prix_vente == null || finance.prix_achat == null || finance.frais == null) return null;
  return finance.prix_vente - finance.prix_achat - finance.frais;
}

export function formatCompact(value: number) {
  return new Intl.NumberFormat("fr-FR", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("fr-DZ", { maximumFractionDigits: 0 }).format(value);
}
