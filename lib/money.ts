// Spec 007 — KD money helpers. KD has 3 decimal places (fils). Totals are backend-authoritative;
// the client formats and verifies. Never use floating display math for the chargeable total.

/** Format a KD amount with exactly 3 decimals, localized. e.g. formatKD(12.5,'en') → "KD 12.500". */
export function formatKD(amount: number, locale: 'ar' | 'en'): string {
  const value = Number(amount).toLocaleString(locale === 'ar' ? 'ar-KW' : 'en-KW', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
  return locale === 'ar' ? `${value} د.ك` : `KD ${value}`;
}

/** Signed variant for wallet credits/debits and refunds. */
export function formatKDSigned(amount: number, locale: 'ar' | 'en'): string {
  const sign = amount < 0 ? '−' : '+';
  return `${sign}${formatKD(Math.abs(amount), locale)}`;
}

/**
 * Fils-safe sum used only to verify a displayed invoice total equals the sum of its lines
 * (FR-002). Avoids floating-point drift at the thousandths place.
 */
export function sumLinesFils(amounts: number[]): number {
  return amounts.reduce((acc, a) => acc + Math.round(a * 1000), 0) / 1000;
}
