import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs) => twMerge(clsx(inputs));

export function money(amount, currency = "INR") {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "—";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: String(currency || "INR").toUpperCase(),
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `${currency} ${Math.round(n).toLocaleString()}`;
  }
}

export const mapsLink = (name, city) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${city || ""}`.trim())}`;

export const shortPlace = (label = "") => label.split(",")[0].trim();
