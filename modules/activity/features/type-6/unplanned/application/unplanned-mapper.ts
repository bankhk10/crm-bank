import type { Type6UnplannedItem } from "../types/unplanned.types";

/**
 * Hydrate Type 6 Unplanned data from initial plan/actual data
 */
export function hydrateType6UnplannedData(initialData: any): Type6UnplannedItem[] {
  if (!initialData) return [];

  // 1. If already array in type6UnplannedItems
  if (
    Array.isArray(initialData.type6UnplannedItems) &&
    initialData.type6UnplannedItems.length > 0
  ) {
    return initialData.type6UnplannedItems;
  }

  // 2. Extract actual issue results
  const actualResults: any[] =
    Array.isArray(initialData.type6ActualIssues) &&
    initialData.type6ActualIssues.length > 0
      ? initialData.type6ActualIssues
      : Array.isArray(initialData.issueResults) &&
          initialData.issueResults.length > 0
        ? initialData.issueResults
        : Array.isArray(initialData.result?.issueResults) &&
            initialData.result.issueResults.length > 0
          ? initialData.result.issueResults
          : Array.isArray(initialData.targetActualResults) &&
              initialData.targetActualResults.length > 0
            ? initialData.targetActualResults
            : [];

  const allAttachments: any[] =
    Array.isArray(initialData.attachments) && initialData.attachments.length > 0
      ? initialData.attachments
      : Array.isArray(initialData.result?.attachments) &&
          initialData.result.attachments.length > 0
        ? initialData.result.attachments
        : [];

  const targets: any[] =
    Array.isArray(initialData.type6Targets) && initialData.type6Targets.length > 0
      ? initialData.type6Targets
      : [];

  const getImagesForItem = (item: any, dbId?: string) => {
    let itemAtts: any[] =
      Array.isArray(item.attachments) && item.attachments.length > 0
        ? item.attachments
        : [];

    if (itemAtts.length === 0 && allAttachments.length > 0) {
      itemAtts = allAttachments.filter((att: any) => {
        if (att.issueItemId && (att.issueItemId === item.id || att.issueItemId === dbId)) return true;
        if (att.issueItemId && att.issueItemId !== item.id && att.issueItemId !== dbId) return false;
        if (actualResults.length === 1) return true;
        return att.category === "ISSUE" || att.workTypeCode === "TYPE_6";
      });
    }

    if (Array.isArray(item.images) && item.images.length > 0) {
      return item.images;
    }

    return itemAtts.map((att: any) => ({
      id: att.id,
      url: att.fileUrl || att.url,
      name: att.fileName || att.name || "รูปถ่ายหลักฐานปัญหา",
      size: att.fileSize || att.size || undefined,
      type: att.mimeType || att.type || undefined,
    }));
  };

  // Case A: Targets exist
  if (targets.length > 0) {
    return targets.map((t: any, index: number) => {
      const match =
        actualResults.find(
          (a: any) => a.id === t.id || (t.storeId && a.storeId === t.storeId),
        ) ||
        actualResults[index] ||
        {};

      const customerName =
        t.customerName ||
        (typeof t.store === "string" ? t.store : t.store?.name) ||
        t.storeName ||
        "";

      const isManualCustomer =
        t.isManualCustomer !== undefined
          ? Boolean(t.isManualCustomer)
          : Boolean(t.manualCustomerName || !t.storeId);

      const images = getImagesForItem(match, t.id);

      return {
        id: t.id || `type6-item-${Date.now()}-${index}`,
        isManualCustomer,
        storeId: t.storeId || match.storeId || null,
        storeName:
          t.storeName ||
          match.storeName ||
          (typeof t.store === "string" ? t.store : t.store?.name) ||
          null,
        customerName: isManualCustomer ? "" : customerName,
        manualCustomerName: isManualCustomer
          ? t.manualCustomerName || customerName
          : "",
        manualCustomerAddress: t.manualCustomerAddress || "",
        manualCustomerPhone: t.manualCustomerPhone || "",
        issueType:
          t.issueType || match.issueType || "สินค้าหรือบรรจุภัณฑ์ชำรุด / เสียหาย",
        detail: t.detail || t.notes || match.detail || match.problemFound || "",
        purchaseChannel:
          match.purchaseChannel === "ช่องทางออนไลน์"
            ? "ออนไลน์"
            : match.purchaseChannel || "ร้านค้าตัวแทนจำหน่าย",
        productId: match.productId || t.productId || null,
        productName:
          match.productName ||
          (typeof match.product === "object" ? match.product?.name : match.product) ||
          t.product ||
          "",
        lotNumber: match.lotNumber || "",
        status: (match.status === "รอติดตาม" ? "รอติดตาม" : "เสร็จสิ้น") as
          | "เสร็จสิ้น"
          | "รอติดตาม",
        images,
      };
    });
  }

  // Case B: No targets, but actualResults (issues) exist
  if (actualResults.length > 0) {
    return actualResults.map((iss: any, index: number) => {
      const customerName =
        iss.customerName ||
        iss.storeName ||
        (typeof iss.store === "string" ? iss.store : iss.store?.name) ||
        "";

      const isManualCustomer = Boolean(iss.isManualCustomer || !iss.storeId);
      const images = getImagesForItem(iss, iss.id);

      return {
        id: iss.id || `type6-item-${Date.now()}-${index}`,
        isManualCustomer,
        storeId: iss.storeId || null,
        storeName: iss.storeName || null,
        customerName: isManualCustomer ? "" : customerName,
        manualCustomerName: isManualCustomer
          ? iss.manualCustomerName || customerName
          : "",
        manualCustomerAddress: iss.manualCustomerAddress || "",
        manualCustomerPhone: iss.manualCustomerPhone || "",
        issueType: iss.issueType || "สินค้าหรือบรรจุภัณฑ์ชำรุด / เสียหาย",
        detail: iss.detail || iss.problemFound || "",
        purchaseChannel:
          iss.purchaseChannel === "ช่องทางออนไลน์"
            ? "ออนไลน์"
            : iss.purchaseChannel || "ร้านค้าตัวแทนจำหน่าย",
        productId: iss.productId || null,
        productName:
          iss.productName ||
          (typeof iss.product === "object" ? iss.product?.name : iss.product) ||
          "",
        lotNumber: iss.lotNumber || "",
        status: (iss.status === "รอติดตาม" ? "รอติดตาม" : "เสร็จสิ้น") as
          | "เสร็จสิ้น"
          | "รอติดตาม",
        images,
      };
    });
  }

  // Case C: Fallback to generic stores if any
  const genericStores: any[] = (
    initialData.stores ||
    initialData.planStores ||
    []
  ).filter(
    (s: any) =>
      !s.workTypeCode ||
      s.workTypeCode === "TYPE_6" ||
      s.workTypeCode === "ตรวจสอบเรื่องร้องเรียน / แก้ปัญหา",
  );
  if (genericStores.length > 0) {
    return genericStores.map((st: any, index: number) => ({
      id: st.id || `type6-item-${Date.now()}-${index}`,
      isManualCustomer: Boolean(st.isUnregisteredFarmer || !st.storeId),
      storeId: st.storeId || null,
      storeName: st.storeName || null,
      customerName: st.isUnregisteredFarmer ? "" : st.storeName || "",
      manualCustomerName: st.isUnregisteredFarmer ? st.storeName || "" : "",
      manualCustomerAddress: "",
      manualCustomerPhone: "",
      issueType: st.remarks || "สินค้าหรือบรรจุภัณฑ์ชำรุด / เสียหาย",
      detail: st.notes || "",
      purchaseChannel: "ร้านค้าตัวแทนจำหน่าย",
      productId: null,
      productName: "",
      lotNumber: "",
      status: "เสร็จสิ้น",
      images: [],
    }));
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
    customerName: item.isManualCustomer
      ? item.manualCustomerName || ""
      : item.customerName || "",
    storeName: item.isManualCustomer
      ? item.manualCustomerName || ""
      : item.customerName || "",
    store: item.isManualCustomer
      ? item.manualCustomerName || ""
      : item.customerName || "",
    manualCustomerName: item.manualCustomerName || "",
    manualCustomerAddress: item.manualCustomerAddress || "",
    manualCustomerPhone: item.manualCustomerPhone || "",
    issueType: item.issueType,
    detail: item.detail || "",
    notes: item.detail || "",
  }));

  const actualIssues = items.map((item) => ({
    id: item.id,
    purchaseChannel:
      item.purchaseChannel === "ช่องทางออนไลน์"
        ? "ออนไลน์"
        : item.purchaseChannel || "ร้านค้าตัวแทนจำหน่าย",
    storeId: item.isManualCustomer ? null : item.storeId || null,
    storeName:
      item.storeName ||
      (item.isManualCustomer
        ? item.manualCustomerName || ""
        : item.customerName || ""),
    productId: item.productId || null,
    productName: item.productName || "",
    lotNumber: item.lotNumber || "",
    issueType: item.issueType,
    detail: item.detail || "",
    problemFound: item.detail || null,
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
