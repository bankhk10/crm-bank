/**
 * Utility functions for calculating and formatting product volume and weight
 * (Liters / Kilograms) across reports and exports.
 */

export interface VolumeCalculationProduct {
  packageSize?: number | string | null;
  packageSizeUnit?: string | null;
  packageSizePerBox?: number | string | null;
  totalPackageSizePerBox?: number | string | null;
  unit?: string | null;
}

export interface VolumeCalculationItem {
  quantity?: number | null;
  packageSize?: number | string | null;
  packageSizeUnit?: string | null;
  packageSizePerBox?: number | string | null;
  totalPackageSizePerBox?: number | string | null;
  unit?: string | null;
  product?: VolumeCalculationProduct | null;
}

export interface VolumeCalculationResult {
  litersOrKgPerUnit: number;
  totalLitersOrKg: number;
}

/**
 * Round a number to a specific number of decimal places using Number.EPSILON
 * to avoid floating point precision issues.
 */
export function roundNumber(num: number, decimals: number = 4): number {
  const factor = Math.pow(10, decimals);
  return Math.round((num + Number.EPSILON) * factor) / factor;
}

/**
 * Calculate volume/weight in Liters (L) or Kilograms (KG) per sales unit and total sold.
 * Source of Truth logic from Sales Admin Export.
 */
export function calculateLitersOrKg(item: VolumeCalculationItem): VolumeCalculationResult {
  const rawSize = item.packageSize ?? item.product?.packageSize ?? 0;
  const rawUnit = (
    item.packageSizeUnit ??
    item.product?.packageSizeUnit ??
    ""
  )
    .trim()
    .toUpperCase();
  const rawPerBox =
    item.packageSizePerBox ??
    item.product?.packageSizePerBox ??
    1;
  const rawTotalPerBox =
    item.totalPackageSizePerBox ??
    item.product?.totalPackageSizePerBox;

  const size = Number(rawSize) || 0;
  const perBox = Number(rawPerBox) || 1;

  let baseTotalPerBox = 0;
  if (rawTotalPerBox != null && !isNaN(Number(rawTotalPerBox))) {
    baseTotalPerBox = Number(rawTotalPerBox);
  } else {
    baseTotalPerBox = size * perBox;
  }

  let convertedPerUnit = 0;
  if (
    [
      "CC",
      "ซีซี",
      "ML",
      "มล.",
      "มิลลิลิตร",
      "G",
      "กรัม",
      "GM",
      "GR",
    ].includes(rawUnit)
  ) {
    convertedPerUnit = baseTotalPerBox / 1000;
  } else if (
    [
      "L",
      "KG",
      "กก.",
      "กก",
      "ลิตร",
      "กิโลกรัม",
      "L.",
      "KG.",
      "LTR",
      "LITER",
      "LITRE",
      "KILO",
      "KILOGRAM",
    ].includes(rawUnit)
  ) {
    convertedPerUnit = baseTotalPerBox;
  } else {
    convertedPerUnit = baseTotalPerBox;
  }

  const roundedPerUnit = roundNumber(convertedPerUnit, 4);
  const quantity = Number(item.quantity) || 0;
  const totalLitersOrKg = roundNumber(quantity * roundedPerUnit, 4);

  return {
    litersOrKgPerUnit: roundedPerUnit,
    totalLitersOrKg: totalLitersOrKg,
  };
}

/**
 * Format volume or weight (Liters/KG) for UI display matching Excel export format (#,##0.####):
 * - If integer: format without decimals (e.g. 6 -> "6", 120 -> "120")
 * - If decimal: format with up to 4 decimal places without trailing zeros (e.g. 1.2 -> "1.2", 0.3333 -> "0.3333")
 * - If null, undefined, NaN, or 0: format as "0"
 */
export function formatVolumeValue(val: number | null | undefined): string {
  if (val == null || isNaN(val) || val === 0) {
    return "0";
  }
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  }).format(val);
}
