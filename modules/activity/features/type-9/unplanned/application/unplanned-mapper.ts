import type { Type9UnplannedItem } from "../types/unplanned.types";
import { WORK_TYPE_CODE, WORK_TYPE_NAME } from "../../shared/constants";
import type { Type9ImageFile, Type9ProductItem, Type9ProductSaleDetail } from "../../shared/types";

function toImage(att: any): Type9ImageFile {
  return {
    id: att.id,
    url: att.fileUrl || att.url,
    name: att.fileName || att.name || "รูปภาพหน้าร้าน",
    size: att.fileSize ?? att.size ?? undefined,
    type: att.fileType ?? att.mimeType ?? undefined,
  };
}

/**
 * Hydrates Type 9 Unplanned Form Items from initial state or pre-existing data
 * Supports dedicated tables (activity_type_9_targets, products, result) with legacy fallback.
 */
export function hydrateType9UnplannedData(initialData: any): Type9UnplannedItem[] {
  if (!initialData) return [];

  // 1. Direct form items state
  if (
    Array.isArray(initialData.type9UnplannedItems) &&
    initialData.type9UnplannedItems.length > 0
  ) {
    return initialData.type9UnplannedItems;
  }

  // 2. Dedicated Relational Storage (type9Targets & type9Products & type9Results)
  if (Array.isArray(initialData.type9Targets) && initialData.type9Targets.length > 0) {
    const images: Type9ImageFile[] = Array.isArray(initialData.attachments)
      ? initialData.attachments
          .filter((a: any) => a.workTypeCode === WORK_TYPE_CODE || a.workTypeCode === "จัดกิจกรรมส่งเสริมการขายหน้าร้าน")
          .map(toImage)
      : [];

    return initialData.type9Targets.map((t: any, idx: number) => {
      const allProds: any[] = t.products || (initialData.type9Products || []).filter((p: any) => p.targetId === t.id);

      const products: Type9ProductItem[] = allProds.map((p: any) => ({
        id: p.id,
        productId: p.productId || "",
        productName: p.productName || p.product?.name || "",
        quantityCases: p.targetQuantity != null ? Number(p.targetQuantity) : 0,
        pricePerCase: p.targetUnitPrice != null ? Number(p.targetUnitPrice) : 0,
      }));

      const salesDetails: Type9ProductSaleDetail[] = allProds
        .filter((p: any) => p.actualQuantity != null || p.actualTotal != null)
        .map((p: any) => ({
          id: p.id,
          targetId: t.id,
          productId: p.productId || "",
          productName: p.productName || p.product?.name || "",
          productRole: p.productRole || "TARGET",
          actualQuantityCases: p.actualQuantity != null ? Number(p.actualQuantity) : "",
          pricePerCase: p.actualUnitPrice != null ? Number(p.actualUnitPrice) : (p.targetUnitPrice != null ? Number(p.targetUnitPrice) : 0),
          actualSales: p.actualTotal != null ? Number(p.actualTotal) : "",
          actualNotes: p.actualNotes || undefined,
        }));

      const result = t.result || (initialData.type9Results || []).find((r: any) => r.targetId === t.id) || (initialData.type9Results || [])[idx];

      const actSales = result?.actualTotalSales != null
        ? String(result.actualTotalSales)
        : salesDetails.length > 0
          ? String(salesDetails.reduce((sum, s) => sum + (Number(s.actualSales) || 0), 0))
          : "";

      const actAttendees = result?.actualAttendeesCount != null
        ? String(result.actualAttendeesCount)
        : initialData.actualAttendeesCount != null
          ? String(initialData.actualAttendeesCount)
          : "";

      return {
        id: t.id || String(idx + 1),
        isUnregisteredSubdealer: Boolean(t.isUnregisteredSubdealer),
        subdealerId: t.subdealerId || "",
        subdealerName: t.subdealer?.name || t.subdealerName || "",
        subDealerStore: t.subDealerStore || "",
        province: t.province || "",
        district: t.district || "",
        parentDealerId: t.dealerId || "",
        parentDealerName: t.dealer?.name || t.dealerName || "",
        targetSales: t.targetSales != null ? Number(t.targetSales) : 0,
        actualSales: actSales,
        actualAttendees: actAttendees,
        products,
        productSalesDetails: salesDetails,
        notes: t.notes || "",
        salesRatio: t.salesRatio != null ? Number(t.salesRatio) : undefined,
        images: idx === 0 ? images : [],
      };
    });
  }

  // 3. Legacy Fallback (type9 or type9Data)
  const t9 = initialData.type9 || initialData.type9Data;
  if (!t9) return [];

  const rawStores: any[] = t9.stores || (t9.subdealerId || t9.subDealerStore ? [t9] : []);

  if (rawStores.length > 0) {
    return rawStores.map((item, idx) => ({
      id: item.id || String(idx + 1),
      isUnregisteredSubdealer: Boolean(item.isUnregisteredSubdealer),
      subdealerId: item.subdealerId || item.storeId || "",
      subdealerName: item.subdealerName || item.storeName || "",
      subDealerStore: item.subDealerStore || "",
      province: item.province || "",
      district: item.district || "",
      parentDealerId: item.parentDealerId || "",
      parentDealerName: item.parentDealerName || "",
      targetSales: item.targetSales != null ? Number(item.targetSales) : 0,
      actualSales: item.actualSales ? String(item.actualSales) : "",
      actualAttendees: item.actualAttendees ? String(item.actualAttendees) : "",
      products: item.products || [],
      productSalesDetails: item.productSalesDetails || [],
      notes: item.notes || "",
      images: item.images || [],
    }));
  }

  return [];
}

/**
 * Maps Type 9 Unplanned items to payload for saving plan & actual outcome together 2-in-1
 */
export function mapType9UnplannedToPayload(items: Type9UnplannedItem[]) {
  if (!items || items.length === 0) {
    return {
      type9Data: null,
      type9Targets: [],
      type9UnplannedItems: [],
      actualOutcome: null,
      planStores: [],
      planProducts: [],
      targets: [],
    };
  }

  const firstItem = items[0];

  const planStores = items.map((item) => {
    let storeId: string | null = null;
    let storeName: string | null = null;
    let subDealerStoreVal: string | null = null;
    let storeProvince: string | null = null;

    if (!item.isUnregisteredSubdealer && item.subdealerId) {
      storeId = item.subdealerId;
      storeName = item.subdealerName || null;
      subDealerStoreVal = null;
      storeProvince = item.province || null;
    } else {
      storeId = item.parentDealerId || null;
      storeName = item.parentDealerName || null;
      subDealerStoreVal = item.subDealerStore?.trim() || null;
      storeProvince = item.province?.trim() || null;
    }

    return {
      workTypeCode: WORK_TYPE_CODE,
      storeId,
      storeName,
      subDealerStore: subDealerStoreVal,
      province: storeProvince,
      targetAmount: item.targetSales != null ? Number(item.targetSales) : null,
    };
  });

  const planProducts: Array<{
    workTypeCode: string;
    storeId: string | null;
    productId: string;
    productName: string | null;
    targetQuantity: number;
    unitPrice: number;
    totalAmount: number;
    isPriceOverridden: boolean;
  }> = [];

  items.forEach((item) => {
    const storeId = (!item.isUnregisteredSubdealer ? item.subdealerId : item.parentDealerId) || null;
    (item.products || []).forEach((p) => {
      if (p.productName && p.productName.trim()) {
        const qty = p.quantityCases != null ? Number(p.quantityCases) : 0;
        const price = p.pricePerCase != null ? Number(p.pricePerCase) : 0;
        planProducts.push({
          workTypeCode: WORK_TYPE_CODE,
          storeId,
          productId: p.productId || "",
          productName: p.productName,
          targetQuantity: qty,
          unitPrice: price,
          totalAmount: qty * price,
          isPriceOverridden: false,
        });
      }
    });
  });

  const allProductSalesDetails = items.flatMap(
    (item) => item.productSalesDetails || [],
  );

  const targets = items.map((item) => {
    const storeDisplay = item.isUnregisteredSubdealer
      ? item.subDealerStore
      : item.subdealerName;

    return {
      title: storeDisplay ? `${WORK_TYPE_NAME} - ${storeDisplay}` : WORK_TYPE_NAME,
      subtitle: item.province ? `จังหวัด: ${item.province}` : undefined,
      store: storeDisplay,
      isSubDealer: true,
      subDealerStore: item.subDealerStore,
      province: item.province,
      district: item.district,
      targetSales: item.targetSales ? `${item.targetSales.toLocaleString()} บาท` : "",
      actualSales: item.actualSales ? `${item.actualSales} บาท` : "",
      items: item.products,
    };
  });

  // Build Actual Summary Text
  const summaryLines: string[] = [
    `บันทึกผลการจัดกิจกรรมส่งเสริมการขายหน้าร้าน (นอกแผน)`,
  ];

  if (firstItem.isUnregisteredSubdealer && firstItem.subDealerStore) {
    summaryLines.push(`ร้านค้า Sub Dealer: ${firstItem.subDealerStore} (ระบุเอง)`);
  } else if (firstItem.subdealerName) {
    summaryLines.push(`ร้านค้า Sub Dealer: ${firstItem.subdealerName}`);
  }

  if (firstItem.province) {
    summaryLines.push(`จังหวัด: ${firstItem.province}`);
  }
  if (firstItem.district) {
    summaryLines.push(`อำเภอ: ${firstItem.district}`);
  }
  if (firstItem.actualSales) {
    summaryLines.push(`ยอดขายหน้าร้านจริง: ${firstItem.actualSales}`);
  }
  if (firstItem.actualAttendees) {
    summaryLines.push(`ผู้เข้าร่วมหน้าร้านจริง: ${firstItem.actualAttendees} คน`);
  }

  const allImages = items.flatMap((i) => i.images || []);

  const allAttachments = allImages.map((img) => ({
    id: img.id,
    fileUrl: img.url,
    fileName: img.name || "store-event.jpg",
    fileSize: img.size,
    workTypeCode: WORK_TYPE_CODE,
  }));

  const actualOutcome = {
    resultStatus: "COMPLETED",
    resultSummary: summaryLines.join("\n"),
    attachments: allAttachments,
    type9Actual: {
      t9ActualSales: firstItem.actualSales,
      t9ActualAttendees: firstItem.actualAttendees,
      t9ProductSalesDetails: allProductSalesDetails,
      t9Images: allImages,
    },
    saleResults: allProductSalesDetails.map((s) => ({
      workTypeCode: WORK_TYPE_CODE,
      storeId: s.storeId || null,
      productId: s.productId || null,
      productName: s.productName,
      actualQuantity: s.actualQuantityCases ? Number(s.actualQuantityCases) : 0,
      actualUnitPrice: s.pricePerCase ? Number(s.pricePerCase) : null,
      actualTotal: s.actualSales ? Number(s.actualSales) : null,
    })),
  };

  return {
    type9Targets: items,
    type9UnplannedItems: items,
    type9Data: {
      stores: planStores,
      products: planProducts,
    },
    planStores,
    planProducts,
    actualOutcome,
    targets,
  };
}
