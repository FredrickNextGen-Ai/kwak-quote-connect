/**
 * Single source of truth for brand + contact configuration.
 * Values can be overridden per-environment with VITE_ variables.
 */
const env = import.meta.env as Record<string, string | undefined>;

export const siteConfig = {
  name: "KWAK AUTO SPARE",
  shortName: "KWAK",
  tagline: "Find the Right Spare Parts. Request a Quote.",
  whatsappNumber: env["VITE_WHATSAPP_NUMBER"] ?? "254741455116",
  phoneDisplay: env["VITE_CONTACT_PHONE"] ?? "0741 455 116",
  email: env["VITE_CONTACT_EMAIL"] ?? "murigifred892@gmail.com",
  addressLine: env["VITE_CONTACT_ADDRESS"] ?? "Kirinyaga Road, Nairobi, Kenya",
  hours: env["VITE_CONTACT_HOURS"] ?? "Every day, 8:30am - 10:00pm",
  currency: "KES",
} as const;

export const CONDITIONS = ["New", "Used", "Refurbished"] as const;
export const AVAILABILITIES = ["Available", "In Stock", "On Order", "Out of Stock"] as const;
export const QUOTATION_STATUSES = [
  "Pending",
  "Reviewing",
  "Quoted",
  "Completed",
  "Cancelled",
] as const;

export type QuotationStatus = (typeof QUOTATION_STATUSES)[number];

export function whatsappLink(message: string) {
  return `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

export function formatPrice(price: number | null | undefined) {
  if (price === null || price === undefined) return "Price on request";
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: siteConfig.currency,
    maximumFractionDigits: 0,
  }).format(price);
}

export function vehicleLine(p: {
  make?: string | null;
  model?: string | null;
  year_from?: number | null;
  year_to?: number | null;
}) {
  const years =
    p.year_from && p.year_to
      ? `${p.year_from}\u2013${p.year_to}`
      : (p.year_from ?? p.year_to ?? null);
  return [p.make, p.model, years].filter(Boolean).join(" \u00b7 ");
}
