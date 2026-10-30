import fs from "fs";
import path from "path";
import { format } from "date-fns";
import { th } from "date-fns/locale";

let cachedBase64Logo: string | null = null;

/**
 * Returns Base64 data URL for the company PDF logo
 */
export function getBase64Logo(): string {
  if (cachedBase64Logo) return cachedBase64Logo;

  try {
    const logoPath = path.join(process.cwd(), "public", "images", "logo_pdf.png");
    if (fs.existsSync(logoPath)) {
      const bitmap = fs.readFileSync(logoPath);
      cachedBase64Logo = `data:image/png;base64,${bitmap.toString("base64")}`;
      return cachedBase64Logo;
    }
  } catch (err) {
    console.error("Failed to read logo_pdf.png:", err);
  }
  return "";
}

/**
 * Formats a Date or date string to Thai formatted string (e.g. "15 พ.ย. 2569" or "15/11/2026")
 */
export function formatDateThai(
  date?: Date | string | null,
  formatPattern: string = "d MMM yyyy",
): string {
  if (!date) return "-";
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return String(date);
    return format(d, formatPattern, { locale: th });
  } catch {
    return String(date);
  }
}

/**
 * Formats a number to currency format (e.g. "1,500.00")
 */
export function formatMoney(amount?: number | string | null): string {
  if (amount === undefined || amount === null || isNaN(Number(amount))) return "0.00";
  return Number(amount).toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Formats an integer or quantity
 */
export function formatQty(qty?: number | string | null): string {
  if (qty === undefined || qty === null || isNaN(Number(qty))) return "0";
  return Number(qty).toLocaleString("th-TH");
}

/**
 * Safe HTML escape
 */
export function safeHtml(value?: string | number | null): string {
  if (value === undefined || value === null) return "-";
  const s = String(value).trim();
  if (!s) return "-";
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
