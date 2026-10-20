import type { Type6UnplannedItem } from "../types/unplanned.types";

/**
 * Hydrate Type 6 Unplanned data from initial plan/actual data
 */
export function hydrateType6UnplannedData(initialData: any): Type6UnplannedItem[] {
  if (!initialData) return [];

  if (Array.isArray(initialData.type6UnplannedItems) && initialData.type6UnplannedItems.length > 0) {
    return initialData.type6UnplannedItems;
  }

  // Hydrate from type6Targets & actual results
  if (Array.isArray(initialData.type6Targets) && initialData.type6Targets.length > 0) {
    const actualResults = Array.isArray(initialData.type6ActualIssues)
      ? initialData.type6ActualIssues
      : Array.isArray(initialData.targetActualResults)
        ? initialData.targetActualResults
        : [];

    return initialData.type6Targets.map((t: any, index: number) => {
      const match = actualResults.find((a: any) => a.id === t.id) || actualResults[index] || {};

      return {
        id: t.id || `type6-item-${Date.now()}-${index}`,
        isManualCustomer: Boolean(t.isManualCustomer),
        storeId: t.storeId || null,
        customerName: t.customerName || t.store || t.storeName || "",
        manualCustomerName: t.manualCustomerName || "",
        manualCustomerAddress: t.manualCustomerAddress || "",
        manualCustomerPhone: t.manualCustomerPhone || "",
        issueType: t.issueType || match.issueType || "สินค้าหรือบรรจุภัณฑ์ชำรุด / เสียหาย",
        detail: t.detail || t.notes || match.detail || "",
        purchaseChannel: match.purchaseChannel || "ร้านค้าตัวแทนจำหน่าย",
        productId: match.productId || t.productId || null,
        productName: match.productName || t.product || "",
        lotNumber: match.lotNumber || "",
        status: (match.status as any) || "เสร็จสิ้น",
        images: match.images || [],
      };
    });
  }

  return [];
}

/**
 * Map Type 6 Unplanned Items to server payload
 * Generates both targets and actual issue outcomes
 */
export function mapType6UnplannedToPayload(items: Type6UnplannedItem[]) {
  const type6Targets = items.map((item) => ({
    id: item.id,
    isManualCustomer: Boolean(item.isManualCustomer),
    storeId: item.isManualCustomer ? null : item.storeId || null,
    customerName: item.isManualCustomer ? item.manualCustomerName || "" : item.customerName || "",
    storeName: item.isManualCustomer ? item.manualCustomerName || "" : item.customerName || "",
    store: item.isManualCustomer ? item.manualCustomerName || "" : item.customerName || "",
    manualCustomerName: item.manualCustomerName || "",
    manualCustomerAddress: item.manualCustomerAddress || "",
    manualCustomerPhone: item.manualCustomerPhone || "",
    issueType: item.issueType,
    detail: item.detail || "",
    notes: item.detail || "",
  }));

  const actualIssues = items.map((item) => ({
    id: item.id,
    purchaseChannel: item.purchaseChannel || "ร้านค้าตัวแทนจำหน่าย",
    storeId: item.isManualCustomer ? null : item.storeId || null,
    storeName: item.isManualCustomer ? item.manualCustomerName || "" : item.customerName || "",
    productId: item.productId || null,
    productName: item.productName || "",
    lotNumber: item.lotNumber || "",
    issueType: item.issueType,
    detail: item.detail || "",
    status: item.status || "เสร็จสิ้น",
    images: item.images || [],
  }));

  return {
    type6Targets,
    type6ActualIssues: actualIssues,
    targetActualResults: actualIssues,
    type6UnplannedItems: items,
  };
}
