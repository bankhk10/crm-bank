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
