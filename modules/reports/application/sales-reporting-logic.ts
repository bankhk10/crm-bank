import { format } from "date-fns";

export type SalesDocumentType = "Invoice" | "Sales Note";

/**
 * Single Source of Truth for determining Document Type (Invoice vs Sales Note).
 * Shared across Reports (เปรียบเทียบยอดขายรายเดือน) and Exports (ศูนย์ส่งออกข้อมูล).
 *
 * Rules:
 * - Status IN ['DELIVERY_COMPLETED', 'PAID', 'COMPLETED'] -> "Invoice"
 * - Or has active delivered/in-transit shipment -> "Invoice"
 * - Others -> "Sales Note"
 */
export function resolveDocumentType(sale: {
  status: string;
  shipments?: Array<{ status: string }>;
}): SalesDocumentType {
  if (
    sale.status === "DELIVERY_COMPLETED" ||
    sale.status === "PAID" ||
    sale.status === "COMPLETED"
  ) {
    return "Invoice";
  }

  if (sale.shipments && sale.shipments.length > 0) {
    const hasDeliveredShipment = sale.shipments.some((s) =>
      ["DELIVERED", "IN_TRANSIT", "COMPLETED"].includes(s.status),
    );
    if (hasDeliveredShipment) {
      return "Invoice";
    }
  }

  return "Sales Note";
}

/**
 * Single Source of Truth for extracting the Invoice Date (Inv) from a Sale record.
 * Matches Report Priority:
 * 1. Shipment actualDate / scheduledDate (for non-cancelled shipments)
 * 2. Sale actualDeliveryDate / deliveryDate / requestedDeliveryDate
 */
export function resolveInvoiceDate(sale: any): Date | null {
  if (!sale) return null;

  // 1. Shipment-based date
  if (sale.shipments && sale.shipments.length > 0) {
    const activeShipment = sale.shipments.find((s: any) =>
      s.status !== "CANCELLED" && (s.actualDate || s.scheduledDate),
    );
    if (activeShipment) {
      const raw = activeShipment.actualDate || activeShipment.scheduledDate;
      const d = raw instanceof Date ? raw : new Date(raw);
      if (!isNaN(d.getTime())) return d;
    }
  }

  // 2. Sale-based delivery date
  const saleDeliveryRaw =
    sale.actualDeliveryDate ||
    sale.deliveryDate ||
    sale.requestedDeliveryDate;

  if (saleDeliveryRaw) {
    const d = saleDeliveryRaw instanceof Date ? saleDeliveryRaw : new Date(saleDeliveryRaw);
    if (!isNaN(d.getTime())) return d;
  }

  return null;
}

/**
 * Single Source of Truth for extracting the Sales Note Date from a Sale record.
 */
export function resolveSalesNoteDate(sale: any): Date | null {
  if (!sale?.saleDate) return null;
  const d = sale.saleDate instanceof Date ? sale.saleDate : new Date(sale.saleDate);
  return !isNaN(d.getTime()) ? d : null;
}

/**
 * Single Source of Truth for extracting the Effective Reporting Date for a Sale record:
 * - If Invoice: returns Invoice Date (resolveInvoiceDate(sale))
 * - If Sales Note: returns Sales Note Date (resolveSalesNoteDate(sale))
 */
export function resolveSalesReportingDate(sale: any): Date | null {
  const docType = resolveDocumentType(sale);
  if (docType === "Invoice") {
    return resolveInvoiceDate(sale) || resolveSalesNoteDate(sale);
  }
  return resolveSalesNoteDate(sale);
}

/**
 * Formats the effective month string (e.g. "MMM") for a Sale record according to its document type.
 */
export function resolveSalesMonthFormatted(sale: any, pattern = "MMM"): string {
  const effectiveDate = resolveSalesReportingDate(sale);
  return effectiveDate ? format(effectiveDate, pattern) : "";
}

/**
 * Formats the effective year string (e.g. "yyyy") for a Sale record according to its document type.
 */
export function resolveSalesYearFormatted(sale: any): string {
  const effectiveDate = resolveSalesReportingDate(sale);
  return effectiveDate ? format(effectiveDate, "yyyy") : "";
}

/**
 * Pro-rates the target total amount across items based on their individual totalPrice,
 * guaranteeing that SUM(result) === targetTotal to 0 tolerance.
 */
export function allocateNetItemAmounts(
  items: Array<{ totalPrice?: number | string | null }>,
  targetTotal: number,
): number[] {
  if (items.length === 0) return [];
  if (items.length === 1) return [targetTotal];

  const numericPrices = items.map((it) => Number(it.totalPrice || 0));
  const subtotal = numericPrices.reduce((s, p) => s + p, 0);

  if (subtotal === 0) {
    const equalShare = Math.round((targetTotal / items.length) * 100) / 100;
    return items.map((_, i) =>
      i === items.length - 1
        ? Math.round((targetTotal - equalShare * (items.length - 1)) * 100) / 100
        : equalShare,
    );
  }

  let allocatedSum = 0;
  const result: number[] = [];
  for (let i = 0; i < items.length; i++) {
    if (i === items.length - 1) {
      // Last item gets exact remainder to guarantee exact sum
      const lastAmount = Math.round((targetTotal - allocatedSum) * 100) / 100;
      result.push(lastAmount);
    } else {
      const share = Math.round((numericPrices[i] / subtotal) * targetTotal * 100) / 100;
      allocatedSum += share;
      result.push(share);
    }
  }
  return result;
}

/**
 * Extract reporting date for a Shipment matching Report findMonthlyInvoiceSalesByYear
 */
export function resolveShipmentReportingDate(shipment: any, sale?: any): Date | null {
  const raw =
    shipment?.scheduledDate ||
    shipment?.actualDate ||
    sale?.requestedDeliveryDate ||
    shipment?.sale?.requestedDeliveryDate;
  if (!raw) return null;
  const d = raw instanceof Date ? raw : new Date(raw);
  return !isNaN(d.getTime()) ? d : null;
}

/**
 * Extract reporting date for a Legacy Sale (no shipment) matching Report findMonthlyInvoiceSalesByYear
 */
export function resolveLegacyInvoiceReportingDate(sale: any): Date | null {
  const raw = sale?.deliveryDate || sale?.requestedDeliveryDate || sale?.saleDate;
  if (!raw) return null;
  const d = raw instanceof Date ? raw : new Date(raw);
  return !isNaN(d.getTime()) ? d : null;
}
