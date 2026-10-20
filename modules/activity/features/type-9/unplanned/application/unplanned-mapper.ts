import type { Type9UnplannedItem } from "../types/unplanned.types";
import { WORK_TYPE_CODE, WORK_TYPE_NAME } from "../../shared/constants";

/**
 * Hydrates Type 9 Unplanned Form Items from initial state or pre-existing data
 */
export function hydrateType9UnplannedData(initialData: any): Type9UnplannedItem[] {
  if (!initialData) return [];

  if (
    Array.isArray(initialData.type9UnplannedItems) &&
    initialData.type9UnplannedItems.length > 0
  ) {
    return initialData.type9UnplannedItems;
  }

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
 * Maps Type 9 Unplanned items to payload for saving plan & actual outcome together
 */
export function mapType9UnplannedToPayload(items: Type9UnplannedItem[]) {
  if (!items || items.length === 0) {
    return {
      type9Data: null,
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
