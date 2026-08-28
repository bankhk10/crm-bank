import { format } from "date-fns";
import { th } from "date-fns/locale";
import type { ActivityPlanWithRelations } from "../../../types";
import { WORK_TYPES, WORK_TYPE_CONFIG, getWorkTypeName, isFieldDayItem } from "../../../constants";
import type { PlanSummaryData, ActualTargetsState } from "../types";

export interface ExtractedPlanData {
  planSummary: PlanSummaryData;
  resolvedWorkTypes: string[];
  targets: ActualTargetsState;
  t9Extra: {
    mainStore: string;
    isSubDealer: boolean;
    subDealerStore: string;
    productSummary: string;
    totalSales: number;
    items: any[];
  };
  t7StartDate?: string;
  t7PlotIdentifier?: string;
}

export function extractType2Customers(
  items: Array<{ customer?: string; customerName?: string }>,
  location?: string | null,
): { storeName: string; keyFarmer: string } {
  const customerNames = Array.from(
    new Set(
      items
        .map((i) => (i.customer || (i as any).customerName || "").trim())
        .filter(Boolean),
    ),
  );

  const stores: string[] = [];
  const farmers: string[] = [];

  for (const name of customerNames) {
    const isStore =
      name.startsWith("ร้าน") ||
      name.startsWith("บจก.") ||
      name.startsWith("บริษัท") ||
      name.startsWith("สหกรณ์") ||
      name.startsWith("วิสาหกิจ") ||
      name.includes("การค้า") ||
      name.includes("พาณิชย์");

    const isFarmer =
      name.startsWith("หจก.") ||
      name.startsWith("ห้างหุ้นส่วน") ||
      name.startsWith("นาย") ||
      name.startsWith("นาง") ||
      name.startsWith("น.ส.") ||
      name.startsWith("คุณ") ||
      name.includes("สวน") ||
      name.includes("ไร่") ||
      name.includes("แปลง") ||
      name.includes("เกษตรกร");

    if (isStore && !isFarmer) {
      stores.push(name);
    } else if (isFarmer && !isStore) {
      farmers.push(name);
    } else if (isStore) {
      stores.push(name);
    } else if (isFarmer) {
      farmers.push(name);
    } else {
      if (stores.length === 0) {
        stores.push(name);
      } else {
        farmers.push(name);
      }
    }
  }

  // If no store was found among items, but location is provided and has a store name
  if (stores.length === 0 && location && location.trim()) {
    const loc = location.trim();
    if (
      loc.startsWith("ร้าน") ||
      loc.startsWith("บจก.") ||
      loc.startsWith("บริษัท")
    ) {
      stores.push(loc);
    }
  }

  return {
    storeName: stores.join(", "),
    keyFarmer: farmers.join(", "),
  };
}

export function extractPlanData(
  p: ActivityPlanWithRelations,
  prevTargets: ActualTargetsState,
): ExtractedPlanData {
  const start = p.startDate ? new Date(p.startDate) : new Date();
  const end = p.endDate ? new Date(p.endDate) : new Date();

  const mktProductItemsFromItems = p.items
    ? (p.items as any[])
        .filter(
          (item) =>
            item.visitTopic === "MARKETING_PRODUCT" ||
            item.itemType === "MARKETING_PRODUCT",
        )
        .map((item) => ({
          id: item.id,
          productName:
            item.storeProductName ||
            item.productName ||
            "สื่อส่งเสริมการขาย",
          quantityCases: item.storeQuantityCases || 1,
          pricePerCase: item.storePricePerCase
            ? Number(item.storePricePerCase)
            : 0,
        }))
    : [];

  const salesPromoItemsFromItems = p.items
    ? (p.items as any[])
        .filter(
          (item) =>
            item.visitTopic === "SALES_PROMOTION" ||
            item.itemType === "SALES_PROMOTION",
        )
        .map((item) => ({
          id: item.id,
          detail: item.detail || "รายการส่งเสริมการขาย",
          amount: item.collectAmount ? Number(item.collectAmount) : 0,
          budgetType: item.plotCropCategory || "งบการตลาด",
        }))
    : [];

  const extractedHelpers =
    p.helpers && Array.isArray(p.helpers)
      ? p.helpers
          .map((h: any) => {
            const emp = h.employee;
            const id = h.employeeId || emp?.id || h.id || "";
            const rawFullName =
              emp?.name?.trim() ||
              `${emp?.firstName || ""} ${emp?.lastName || ""}`.trim() ||
              h.name ||
              h.employeeName ||
              "";
            const dept =
              emp?.department?.name ||
              emp?.departmentName ||
              h.departmentName ||
              h.department ||
              "";
            const pos =
              emp?.position?.title ||
              emp?.positionTitle ||
              h.positionTitle ||
              h.position ||
              "";

            return {
              id,
              employeeId: id,
              name: rawFullName || "-",
              employeeName: rawFullName || "-",
              departmentName: dept,
              positionTitle: pos,
              status: h.status || "PENDING",
            };
          })
          .filter((h: any) => Boolean(h.name && h.name !== "-"))
      : [];

  const helperNames =
    extractedHelpers.length > 0
      ? extractedHelpers.map((h: any) => h.name)
      : undefined;

  const planSummary: PlanSummaryData = {
    planNo: p.code || "TP-DRAFT",
    title: p.title || "แผนงานกิจกรรม",
    startDateStr: format(start, "d MMMM yyyy", { locale: th }),
    endDateStr: format(end, "d MMMM yyyy", { locale: th }),
    startTimeStr: format(start, "HH:mm"),
    endTimeStr: format(end, "HH:mm"),
    timeStr: `${format(start, "HH:mm")} - ${format(end, "HH:mm")} น.`,
    locationStr: p.location || "ไม่ระบุสถานที่",
    location: p.location || undefined,
    province: p.province || undefined,
    district: p.district || undefined,
    marketingBudget: (p as any).marketingBudgetRequested
      ? Number((p as any).marketingBudgetRequested)
      : undefined,
    salesPromotionBudget: (p as any).salesPromotionBudgetRequested
      ? Number((p as any).salesPromotionBudgetRequested)
      : undefined,
    targetSales: (p as any).targetSales
      ? Number((p as any).targetSales)
      : undefined,
    isPromotionalMediaSelected: mktProductItemsFromItems.length > 0,
    marketingProductItems: mktProductItemsFromItems,
    isSalesPromotionSelected:
      salesPromoItemsFromItems.length > 0 ||
      ((p as any).salesPromotionBudgetRequested
        ? Number((p as any).salesPromotionBudgetRequested) > 0
        : false),
    salesPromotionItems: salesPromoItemsFromItems,
    notes: p.notes || undefined,
    objective: p.objective || undefined,
    helpers: extractedHelpers.length > 0 ? extractedHelpers : undefined,
    helperEmployeeNames: helperNames,
  };

  // 1. Detect ALL selected work types from the Trip Plan
  const detectedWorkTypes = new Set<string>();

  // (A) Priority 1: From normalized relations
  if ((p as any).workTypes && Array.isArray((p as any).workTypes) && (p as any).workTypes.length > 0) {
    for (const wt of (p as any).workTypes) {
      const typeName = wt.activityType?.name || getWorkTypeName(wt.activityTypeId || wt.workTypeCode);
      if (typeName && WORK_TYPES.includes(typeName)) {
        detectedWorkTypes.add(typeName);
      }
    }
  }

  if ((p as any).tour) {
    detectedWorkTypes.add("ทัวร์");
  }

  // (B) From activityType / activityTypeId (primary type)
  if (p.activityType) {
    if (typeof p.activityType === "object" && (p.activityType as any).name) {
      if (WORK_TYPES.includes((p.activityType as any).name)) {
        detectedWorkTypes.add((p.activityType as any).name);
      }
    } else if (
      typeof p.activityType === "object" &&
      (p.activityType as any).id
    ) {
      const idx =
        parseInt(
          String((p.activityType as any).id).replace("TYPE_", ""),
          10,
        ) - 1;
      if (idx >= 0 && idx < WORK_TYPES.length) {
        detectedWorkTypes.add(WORK_TYPES[idx]);
      }
    }
  } else if (p.activityTypeId) {
    const idx =
      parseInt(String(p.activityTypeId).replace("TYPE_", ""), 10) - 1;
    if (idx >= 0 && idx < WORK_TYPES.length) {
      detectedWorkTypes.add(WORK_TYPES[idx]);
    }
  }

  // (C) From objective / title (section headers / markers)
  const objectiveText = [p.objective, p.title].filter(Boolean).join("\n");

  if (objectiveText) {
    if (
      objectiveText.includes("[เข้าพบร้านค้า") ||
      objectiveText.includes("เข้าพบร้านค้า") ||
      objectiveText.includes("Key Farmer")
    ) {
      detectedWorkTypes.add(WORK_TYPES[0]);
    }
    if (
      objectiveText.includes("[ติดตามผลการใช้สินค้า]") ||
      objectiveText.includes("ติดตามผลการใช้สินค้า")
    ) {
      detectedWorkTypes.add(WORK_TYPES[1]);
    }
    if (
      objectiveText.includes("[เสนอขายสินค้า]") ||
      objectiveText.includes("เสนอขายสินค้า")
    ) {
      detectedWorkTypes.add(WORK_TYPES[2]);
    }
    if (
      objectiveText.includes("[วางบิล") ||
      objectiveText.includes("วางบิล / เก็บเงิน") ||
      objectiveText.includes("วางบิล/เก็บเงิน") ||
      objectiveText.includes("เป้ายอดเก็บเงิน")
    ) {
      detectedWorkTypes.add(WORK_TYPES[3]);
    }
    if (
      objectiveText.includes("[สำรวจตลาด") ||
      objectiveText.includes("สำรวจตลาดของคู่แข่ง") ||
      objectiveText.includes("สำรวจตลาดคู่แข่ง")
    ) {
      detectedWorkTypes.add(WORK_TYPES[4]);
    }
    if (
      objectiveText.includes("[แก้ปัญหา") ||
      objectiveText.includes("แก้ปัญหา / รับเรื่องร้องเรียน") ||
      objectiveText.includes("แก้ปัญหา/ร้องเรียน") ||
      objectiveText.includes("รับเรื่องร้องเรียน")
    ) {
      detectedWorkTypes.add(WORK_TYPES[5]);
    }
    if (
      objectiveText.includes("[ติดตามแปลงสาธิต") ||
      objectiveText.includes("ติดตามแปลงสาธิต / ทำแปลง") ||
      objectiveText.includes("ทำแปลงสาธิต") ||
      (objectiveText.includes("แปลงสาธิต") &&
        !objectiveText.includes("Field Day") &&
        !objectiveText.includes("[Field Day]"))
    ) {
      detectedWorkTypes.add(WORK_TYPES[6]);
    }
    if (
      objectiveText.includes("[จัดประชุม") ||
      objectiveText.includes("จัดประชุมการเกษตร") ||
      objectiveText.includes("ประชุมการเกษตร")
    ) {
      detectedWorkTypes.add(WORK_TYPES[7]);
    }
    if (
      objectiveText.includes("[กิจกรรมหน้าร้าน]") ||
      objectiveText.includes("จัดกิจกรรมส่งเสริมการขายหน้าร้าน")
    ) {
      detectedWorkTypes.add(WORK_TYPES[8]);
    }
    if (
      objectiveText.includes("[Field Day]") ||
      objectiveText.includes("Field Day") ||
      objectiveText.includes("จัดงาน Field Day")
    ) {
      detectedWorkTypes.add(WORK_TYPES[9]);
    }
    if (
      objectiveText.includes("[ตรวจเช็กสต็อก") ||
      objectiveText.includes("ตรวจเช็กสต็อกหน้าร้าน") ||
      objectiveText.includes("เช็กสต็อกหน้าร้าน") ||
      objectiveText.includes("สต็อกหน้าร้าน")
    ) {
      detectedWorkTypes.add(WORK_TYPES[10]);
    }
    if (
      objectiveText.includes("[ทัวร์]") ||
      objectiveText.includes("[ทัวร์กลาง]") ||
      objectiveText.includes("[ทัวร์ร้านค้า]") ||
      objectiveText.includes("ทัวร์กลาง") ||
      objectiveText.includes("ทัวร์ร้านค้า") ||
      objectiveText.includes("ทัวร์")
    ) {
      detectedWorkTypes.add(WORK_TYPES[11]);
    }
  }

  // (C) From DB items (excluding marketing & sales promo items)
  if (Array.isArray(p.items)) {
    const actualItems = (p.items as any[]).filter(
      (item) =>
        item.itemType !== "MARKETING_PRODUCT" &&
        item.itemType !== "SALES_PROMOTION" &&
        item.visitTopic !== "MARKETING_PRODUCT" &&
        item.visitTopic !== "SALES_PROMOTION",
    );

    for (const item of actualItems) {
      const isFD = isFieldDayItem(item);

      if (
        item.itemType === "TYPE_1" ||
        (item.visitTopic &&
          item.visitTopic !== "FOLLOWUP" &&
          item.visitTopic !== "MARKETING_PRODUCT" &&
          item.visitTopic !== "SALES_PROMOTION" &&
          item.visitTopic !== "ทัวร์กลาง" &&
          item.visitTopic !== "ทัวร์ร้านค้า" &&
          item.itemType !== "TYPE_12")
      ) {
        detectedWorkTypes.add(WORK_TYPES[0]);
      }
      if (
        item.itemType === "TYPE_2" ||
        item.visitTopic === "FOLLOWUP" ||
        item.followupProductName
      ) {
        detectedWorkTypes.add(WORK_TYPES[1]);
      }
      if (
        !isFD &&
        (item.itemType === "TYPE_3" ||
          item.saleProductName ||
          (item.saleQuantity != null && item.saleUnitPrice != null) ||
          (item.saleTotalPrice != null &&
            !item.storeTotalAmount &&
            !item.collectAmount &&
            item.meetingAttendeesCount == null))
      ) {
        detectedWorkTypes.add(WORK_TYPES[2]);
      }
      if (
        !isFD &&
        (item.itemType === "TYPE_4" ||
          (item.collectAmount != null &&
            item.visitTopic !== "SALES_PROMOTION"))
      ) {
        detectedWorkTypes.add(WORK_TYPES[3]);
      }
      if (
        item.itemType === "TYPE_5" ||
        item.surveyCompetitorProduct ||
        (item.surveyStoreName && item.itemType !== "TYPE_9")
      ) {
        detectedWorkTypes.add(WORK_TYPES[4]);
      }
      if (item.itemType === "TYPE_6" || item.issueType) {
        detectedWorkTypes.add(WORK_TYPES[5]);
      }
      if (
        !isFD &&
        (item.itemType === "TYPE_7" ||
          item.plotActivityType ||
          item.existingPlotId ||
          ((item.plotCropName ||
            item.plotOwnerName ||
            item.plotAreaRai != null ||
            item.plotTreeCount != null) &&
            !item.storePricePerCase))
      ) {
        detectedWorkTypes.add(WORK_TYPES[6]);
      }
      if (
        !isFD &&
        (item.itemType === "TYPE_8" ||
          item.meetingTopic ||
          item.meetingTargetProducts ||
          (item.meetingAttendeesCount != null && !item.storeProductName))
      ) {
        detectedWorkTypes.add(WORK_TYPES[7]);
      }
      if (
        !isFD &&
        (item.itemType === "TYPE_9" ||
          (item.storeProductName &&
            item.visitTopic !== "MARKETING_PRODUCT") ||
          (item.storeQuantityCases != null &&
            item.visitTopic !== "MARKETING_PRODUCT") ||
          (item.storePricePerCase != null &&
            item.visitTopic !== "MARKETING_PRODUCT") ||
          (item.storeTotalAmount != null &&
            item.visitTopic !== "MARKETING_PRODUCT"))
      ) {
        detectedWorkTypes.add(WORK_TYPES[8]);
      }
      if (isFD || item.itemType === "TYPE_10") {
        detectedWorkTypes.add(WORK_TYPES[9]);
      }
      if (
        item.itemType === "TYPE_11" ||
        item.targetOpportunity ||
        (item.detail && item.detail.includes("ตรวจเช็กสต็อกหน้าร้าน"))
      ) {
        detectedWorkTypes.add(WORK_TYPES[10]);
      }
      if (
        item.itemType === "TYPE_12" ||
        (item.detail && item.detail.includes("[ทัวร์")) ||
        (item.visitTopic &&
          (item.visitTopic === "ทัวร์กลาง" ||
            item.visitTopic === "ทัวร์ร้านค้า"))
      ) {
        detectedWorkTypes.add(WORK_TYPES[11]);
      }
    }
  }

  const resolvedWorkTypes = WORK_TYPES.filter((t: string) =>
    detectedWorkTypes.has(t),
  );

  // 2. Populate target cards from real DB items
  const targets: ActualTargetsState = { ...prevTargets };

  let t9MainStore = "";
  let t9IsSubDealer = false;
  let t9SubDealerStore = "";
  let t9ProductSummary = "";
  let t9TotalSales = 0;
  let t9ItemsFromDb: any[] = [];

  let t7StartDate: string | undefined;
  let t7PlotIdentifier: string | undefined;

  if (p.items && p.items.length > 0) {
    const allItems = p.items as any[];
    const allCustomers = Array.from(
      new Set(allItems.map((i: any) => i.customerName).filter(Boolean)),
    ).join(", ");

    const t1Item =
      allItems.find(
        (i) =>
          !isFieldDayItem(i) &&
          i.itemType !== "MARKETING_PRODUCT" &&
          i.itemType !== "SALES_PROMOTION" &&
          i.itemType !== "TYPE_12" &&
          i.visitTopic !== "ทัวร์กลาง" &&
          i.visitTopic !== "ทัวร์ร้านค้า" &&
          (i.itemType === "TYPE_1" ||
            (i.visitTopic &&
              i.visitTopic !== "FOLLOWUP" &&
              i.visitTopic !== "MARKETING_PRODUCT" &&
              i.visitTopic !== "SALES_PROMOTION" &&
              i.visitTopic !== "ทัวร์กลาง" &&
              i.visitTopic !== "ทัวร์ร้านค้า")),
      ) || (detectedWorkTypes.has(WORK_TYPES[0]) ? allItems[0] : undefined);

    const type2DbItems = allItems.filter(
      (i) =>
        !isFieldDayItem(i) &&
        i.itemType !== "MARKETING_PRODUCT" &&
        i.itemType !== "SALES_PROMOTION" &&
        (i.itemType === "TYPE_2" ||
          i.visitTopic === "FOLLOWUP" ||
          i.followupProductName),
    );
    const t2ItemsFromDb =
      type2DbItems.length > 0
        ? type2DbItems.map((item) => ({
            productName:
              item.followupProductName || item.productName || "สินค้า",
            customer: item.customerName || p.location || "",
            detail: item.detail || "",
            expectedResult: item.expectedResult || "พืชตอบสนองดี",
          }))
        : undefined;

    const type3DbItems = allItems.filter(
      (i) =>
        !isFieldDayItem(i) &&
        i.itemType !== "MARKETING_PRODUCT" &&
        i.itemType !== "SALES_PROMOTION" &&
        i.visitTopic !== "MARKETING_PRODUCT" &&
        i.visitTopic !== "SALES_PROMOTION" &&
        (i.itemType === "TYPE_3" ||
          i.saleProductName ||
          (i.saleQuantity != null && i.saleUnitPrice != null) ||
          (i.saleTotalPrice != null &&
            !i.storeTotalAmount &&
            !i.collectAmount &&
            i.meetingAttendeesCount == null)),
    );

    const t3ItemsFromDb =
      type3DbItems.length > 0
        ? type3DbItems.map((item) => {
            const productName =
              item.saleProductName || item.productName || "สินค้าเสนอขาย";
            const qtyVal =
              item.saleQuantity != null ? String(item.saleQuantity) : "";
            const uPriceVal =
              item.saleUnitPrice != null
                ? `${Number(item.saleUnitPrice).toLocaleString()} บาท`
                : "";
            const rawTotalPrice =
              item.saleTotalPrice != null
                ? Number(item.saleTotalPrice)
                : item.saleQuantity != null && item.saleUnitPrice != null
                  ? Number(item.saleQuantity) * Number(item.saleUnitPrice)
                  : null;

            const targetSalesVal =
              rawTotalPrice != null
                ? Number(rawTotalPrice).toLocaleString()
                : "";
            const totalPriceVal =
              rawTotalPrice != null
                ? `${Number(rawTotalPrice).toLocaleString()} บาท`
                : "";

            return {
              id: item.id,
              productName,
              customer: item.customerName || p.location || "",
              qty: qtyVal,
              unitPrice: uPriceVal,
              price: totalPriceVal,
              targetSales: targetSalesVal,
              detail: item.detail || "",
            };
          })
        : undefined;

    const t3Item = type3DbItems[0];
    const t3TotalSales = type3DbItems.reduce(
      (sum, item) =>
        sum +
        (item.saleTotalPrice != null
          ? Number(item.saleTotalPrice)
          : (Number(item.saleQuantity) || 0) *
            (Number(item.saleUnitPrice) || 0)),
      0,
    );
    const t3ProdNames = Array.from(
      new Set(
        type3DbItems
          .map((i) => i.saleProductName || i.productName)
          .filter(Boolean),
      ),
    ).join(", ");
    const t3TotalQty = type3DbItems.reduce(
      (sum, item) => sum + (Number(item.saleQuantity) || 0),
      0,
    );
    const t3SingleQty =
      t3Item?.saleQuantity != null
        ? String(t3Item.saleQuantity)
        : t3TotalQty > 0
          ? String(t3TotalQty)
          : "";
    const t3SingleUnitPrice =
      t3Item?.saleUnitPrice != null
        ? `${Number(t3Item.saleUnitPrice).toLocaleString()} บาท`
        : "";

    const t4Item = allItems.find(
      (i) =>
        !isFieldDayItem(i) &&
        i.itemType !== "MARKETING_PRODUCT" &&
        i.itemType !== "SALES_PROMOTION" &&
        (i.itemType === "TYPE_4" ||
          (i.collectAmount != null && i.visitTopic !== "SALES_PROMOTION")),
    );

    const type5DbItems = allItems.filter(
      (i) =>
        !isFieldDayItem(i) &&
        i.itemType !== "MARKETING_PRODUCT" &&
        i.itemType !== "SALES_PROMOTION" &&
        i.visitTopic !== "MARKETING_PRODUCT" &&
        i.visitTopic !== "SALES_PROMOTION" &&
        (i.itemType === "TYPE_5" ||
          i.surveyCompetitorProduct ||
          (i.surveyStoreName && i.itemType !== "TYPE_9")),
    );

    const t5ItemsFromDb =
      type5DbItems.length > 0
        ? type5DbItems.map((item) => ({
            id: item.id,
            store:
              item.surveyStoreName || item.customerName || p.location || "",
            product: item.surveyCompetitorProduct || "",
            detail: item.detail || "",
          }))
        : undefined;

    const t5Item =
      type5DbItems[0] ||
      allItems.find(
        (i) =>
          !isFieldDayItem(i) &&
          (i.itemType === "TYPE_5" ||
            i.surveyCompetitorProduct ||
            i.surveyStoreName),
      );

    const type6DbItems = allItems.filter(
      (i) =>
        !isFieldDayItem(i) &&
        i.itemType !== "MARKETING_PRODUCT" &&
        i.itemType !== "SALES_PROMOTION" &&
        i.visitTopic !== "MARKETING_PRODUCT" &&
        i.visitTopic !== "SALES_PROMOTION" &&
        (i.itemType === "TYPE_6" || i.issueType),
    );

    const t6ItemsFromDb =
      type6DbItems.length > 0
        ? type6DbItems.map((item) => ({
            customer: item.customerName || p.location || "",
            issueType: item.issueType || "เคลมของ",
            detail: item.detail || "",
          }))
        : undefined;

    const t6Item =
      type6DbItems[0] ||
      allItems.find(
        (i) => !isFieldDayItem(i) && (i.itemType === "TYPE_6" || i.issueType),
      );

    const type7DbItems = allItems.filter(
      (i) =>
        !isFieldDayItem(i) &&
        i.itemType !== "MARKETING_PRODUCT" &&
        i.itemType !== "SALES_PROMOTION" &&
        i.visitTopic !== "MARKETING_PRODUCT" &&
        i.visitTopic !== "SALES_PROMOTION" &&
        (i.itemType === "TYPE_7" ||
          i.plotActivityType ||
          i.existingPlotId ||
          ((i.plotCropName ||
            i.plotOwnerName ||
            i.plotAreaRai != null ||
            i.plotTreeCount != null) &&
            !i.storePricePerCase)),
    );

    const t7ItemsFromDb =
      type7DbItems.length > 0
        ? type7DbItems.map((item) => {
            let plotAreaStr = "";
            if (item.plotAreaRai != null && Number(item.plotAreaRai) > 0) {
              plotAreaStr = `${item.plotAreaRai} ไร่`;
            } else if (
              item.plotTreeCount != null &&
              item.plotTreeCount > 0
            ) {
              plotAreaStr = `${item.plotTreeCount} ต้น`;
            }

            const rawDetail = item.detail || "";
            const objMatch = rawDetail.match(
              /(?:วัตถุประสงค์ของแปลง|วัตถุประสงค์):\s*([^|]+)/,
            );
            const expMatch = rawDetail.match(
              /(?:รายละเอียด \/ วิธีการทดลอง|วิธีการทดลอง|รายละเอียดการทดลอง):\s*([^|]+)/,
            );

            const parsedObjective = objMatch
              ? objMatch[1].trim()
              : item.objective || "";
            let parsedExperiment = expMatch
              ? expMatch[1].trim()
              : item.experimentDetail || "";

            if (!objMatch && !expMatch && rawDetail) {
              if (item.plotActivityType === "CREATE") {
                parsedExperiment = rawDetail;
              }
            }

            return {
              activityType: item.plotActivityType || "CREATE",
              owner:
                item.plotOwnerName ||
                item.customerName ||
                p.location ||
                "",
              product: item.plotProductName || "",
              crop: item.plotCropName || "",
              plots: plotAreaStr,
              demoProductQuantity:
                item.plotCount != null && item.plotCount !== ""
                  ? String(item.plotCount)
                  : item.plotsCount != null && item.plotsCount !== ""
                    ? String(item.plotsCount)
                    : "-",
              objective: parsedObjective,
              experimentDetail: parsedExperiment,
              detail: rawDetail,
            };
          })
        : undefined;

    const t7Item =
      type7DbItems[0] ||
      allItems.find(
        (i) =>
          !isFieldDayItem(i) &&
          (i.itemType === "TYPE_7" ||
            i.plotActivityType ||
            i.plotCropName ||
            i.plotOwnerName ||
            i.plotAreaRai != null ||
            i.plotCount != null),
      );

    const type8DbItems = allItems.filter(
      (i) =>
        !isFieldDayItem(i) &&
        i.itemType !== "MARKETING_PRODUCT" &&
        i.itemType !== "SALES_PROMOTION" &&
        i.visitTopic !== "MARKETING_PRODUCT" &&
        i.visitTopic !== "SALES_PROMOTION" &&
        (i.itemType === "TYPE_8" ||
          i.meetingTopic ||
          i.meetingTargetProducts ||
          (i.meetingAttendeesCount != null && !i.storeProductName)),
    );

    const t8Item =
      type8DbItems[0] ||
      allItems.find(
        (i) =>
          !isFieldDayItem(i) &&
          (i.itemType === "TYPE_8" ||
            i.meetingTopic ||
            i.meetingAttendeesCount != null),
      );

    const type9DbItems = allItems.filter(
      (i) =>
        !isFieldDayItem(i) &&
        i.itemType !== "MARKETING_PRODUCT" &&
        i.itemType !== "SALES_PROMOTION" &&
        i.visitTopic !== "MARKETING_PRODUCT" &&
        i.visitTopic !== "SALES_PROMOTION" &&
        (i.itemType === "TYPE_9" ||
          (i.storeProductName && !i.plotCropCategory) ||
          (i.storeTotalAmount != null && !i.plotCropCategory)),
    );

    const t9Item =
      type9DbItems[0] ||
      allItems.find(
        (i) =>
          !isFieldDayItem(i) &&
          (i.itemType === "TYPE_9" ||
            i.storeProductName ||
            i.storeTotalAmount != null),
      );

    t9ItemsFromDb =
      type9DbItems.length > 0
        ? type9DbItems
            .filter((i) => i.storeProductName)
            .map((item, idx) => ({
              id: item.id || String(idx + 1),
              productName: item.storeProductName || "",
              quantityCases: item.storeQuantityCases
                ? Number(item.storeQuantityCases)
                : 0,
              pricePerCase: item.storePricePerCase
                ? Number(item.storePricePerCase)
                : 0,
              totalAmount: item.storeTotalAmount
                ? Number(item.storeTotalAmount)
                : (Number(item.storeQuantityCases) || 0) *
                  (Number(item.storePricePerCase) || 0),
            }))
        : [];

    const rawCustomerName =
      type9DbItems.find((i) => i.customerName)?.customerName ||
      t9Item?.customerName ||
      "";

    t9MainStore = rawCustomerName;
    t9IsSubDealer = false;
    t9SubDealerStore = "";

    const subDealerMatch = rawCustomerName.match(
      /^(.*?)\s*\((?:ร้าน\s*)?Sub Dealer:\s*(.*?)\)$/i,
    );
    if (subDealerMatch) {
      t9MainStore = subDealerMatch[1].trim();
      t9IsSubDealer = true;
      t9SubDealerStore = subDealerMatch[2].trim();
    } else if (p.objective) {
      const objMatch = p.objective.match(
        /\[กิจกรรมหน้าร้าน\].*?ร้านค้า:\s*([^|\n]+)/i,
      );
      if (objMatch) {
        const rawObjStore = objMatch[1].trim();
        const match = rawObjStore.match(
          /^(.*?)\s*\((?:ร้าน\s*)?Sub Dealer:\s*(.*?)\)$/i,
        );
        if (match) {
          if (!t9MainStore) t9MainStore = match[1].trim();
          t9IsSubDealer = true;
          t9SubDealerStore = match[2].trim();
        }
      }
    }

    t9TotalSales = type9DbItems.reduce(
      (sum, item) =>
        sum +
        (item.storeTotalAmount != null
          ? Number(item.storeTotalAmount)
          : (Number(item.storeQuantityCases) || 0) *
            (Number(item.storePricePerCase) || 0)),
      0,
    );

    t9ProductSummary = t9ItemsFromDb
      .map((prod) => `${prod.productName} (${prod.quantityCases} ลัง)`)
      .join(", ");

    const type10DbItems = allItems.filter(isFieldDayItem);
    const t10Item =
      type10DbItems[0] || allItems.find((i) => i.itemType === "TYPE_10");

    const type11DbItems = allItems.filter(
      (i) =>
        !isFieldDayItem(i) &&
        (i.itemType === "TYPE_11" ||
          i.targetOpportunity ||
          (i.detail && i.detail.includes("ตรวจเช็กสต็อกหน้าร้าน"))),
    );
    const t11Item = type11DbItems[0];

    targets.t1 = {
      ...prevTargets.t1,
      customer: t1Item?.customerName || allCustomers || p.location || "",
      topic: t1Item?.visitTopic || prevTargets.t1.topic,
      detail: t1Item?.detail || "",
    };

    const t2CustInfo = extractType2Customers(t2ItemsFromDb || [], p.location);

    targets.t2 = {
      ...prevTargets.t2,
      customer:
        (t2ItemsFromDb &&
          Array.from(
            new Set(t2ItemsFromDb.map((i) => i.customer).filter(Boolean)),
          ).join(", ")) ||
        allCustomers ||
        "",
      storeName: t2CustInfo.storeName,
      keyFarmer: t2CustInfo.keyFarmer,
      product:
        (t2ItemsFromDb &&
          t2ItemsFromDb.map((i) => i.productName).join(", ")) ||
        "",
      detail:
        (t2ItemsFromDb &&
          t2ItemsFromDb
            .map((i) => i.detail)
            .filter(Boolean)
            .join(" | ")) ||
        "",
      items: t2ItemsFromDb || [],
    };

    targets.t3 = {
      ...prevTargets.t3,
      customer:
        (t3ItemsFromDb &&
          Array.from(
            new Set(t3ItemsFromDb.map((i) => i.customer).filter(Boolean)),
          ).join(", ")) ||
        t3Item?.customerName ||
        allCustomers ||
        "",
      product: t3ProdNames || t3Item?.saleProductName || "",
      targetQty: t3SingleQty,
      unitPrice: t3SingleUnitPrice,
      detail:
        (t3ItemsFromDb &&
          t3ItemsFromDb
            .map((i) => i.detail)
            .filter(Boolean)
            .join(" | ")) ||
        t3Item?.detail ||
        "",
      targetSales:
        t3TotalSales > 0
          ? `${t3TotalSales.toLocaleString()} บาท`
          : t3Item?.saleTotalPrice
            ? `${Number(t3Item.saleTotalPrice).toLocaleString()} บาท`
            : "",
      items: t3ItemsFromDb || [],
    };

    targets.t4 = {
      ...prevTargets.t4,
      customer: t4Item?.customerName || allCustomers || "",
      targetCollect: t4Item?.collectAmount
        ? `${Number(t4Item.collectAmount).toLocaleString()} บาท`
        : "",
    };

    targets.t5 = {
      ...prevTargets.t5,
      store:
        (t5ItemsFromDb &&
          Array.from(
            new Set(t5ItemsFromDb.map((i) => i.store).filter(Boolean)),
          ).join(", ")) ||
        t5Item?.surveyStoreName ||
        allCustomers ||
        "",
      product:
        (t5ItemsFromDb &&
          t5ItemsFromDb
            .map((i) => i.product)
            .filter(Boolean)
            .join(", ")) ||
        t5Item?.surveyCompetitorProduct ||
        "",
      detail:
        (t5ItemsFromDb &&
          t5ItemsFromDb
            .map((i) => i.detail)
            .filter(Boolean)
            .join(" | ")) ||
        t5Item?.detail ||
        "",
      items: t5ItemsFromDb || [],
    };

    targets.t6 = {
      ...prevTargets.t6,
      customer:
        (t6ItemsFromDb &&
          Array.from(
            new Set(t6ItemsFromDb.map((i) => i.customer).filter(Boolean)),
          ).join(", ")) ||
        t6Item?.customerName ||
        allCustomers ||
        "",
      issueType:
        (t6ItemsFromDb &&
          t6ItemsFromDb
            .map((i) => i.issueType)
            .filter(Boolean)
            .join(", ")) ||
        t6Item?.issueType ||
        prevTargets.t6.issueType,
      detail:
        (t6ItemsFromDb &&
          t6ItemsFromDb
            .map((i) => i.detail)
            .filter(Boolean)
            .join(" | ")) ||
        t6Item?.detail ||
        "",
      items: t6ItemsFromDb || [],
    };

    targets.t7 = {
      ...prevTargets.t7,
      activityType:
        t7Item?.plotActivityType ||
        (t7ItemsFromDb && t7ItemsFromDb[0]?.activityType) ||
        "CREATE",
      owner:
        (t7ItemsFromDb &&
          Array.from(
            new Set(t7ItemsFromDb.map((i) => i.owner).filter(Boolean)),
          ).join(", ")) ||
        t7Item?.plotOwnerName ||
        allCustomers ||
        "",
      product:
        (t7ItemsFromDb &&
          Array.from(
            new Set(t7ItemsFromDb.map((i) => i.product).filter(Boolean)),
          ).join(", ")) ||
        t7Item?.plotProductName ||
        "",
      crop:
        (t7ItemsFromDb &&
          Array.from(
            new Set(t7ItemsFromDb.map((i) => i.crop).filter(Boolean)),
          ).join(", ")) ||
        t7Item?.plotCropName ||
        "",
      plots:
        (t7ItemsFromDb &&
          t7ItemsFromDb
            .map((i) => i.plots)
            .filter(Boolean)
            .join(", ")) ||
        (t7Item?.plotAreaRai != null && Number(t7Item.plotAreaRai) > 0
          ? `${t7Item.plotAreaRai} ไร่`
          : t7Item?.plotTreeCount != null && t7Item.plotTreeCount > 0
            ? `${t7Item.plotTreeCount} ต้น`
            : ""),
      demoProductQuantity:
        (t7ItemsFromDb &&
          t7ItemsFromDb
            .map((i) => i.demoProductQuantity)
            .filter((v) => v && v !== "-")
            .join(", ")) ||
        (t7Item?.plotCount != null && itemPlotCountStr(t7Item) !== ""
          ? itemPlotCountStr(t7Item)
          : "-"),
      objective:
        (t7ItemsFromDb &&
          t7ItemsFromDb
            .map((i) => i.objective)
            .filter(Boolean)
            .join(" | ")) ||
        "",
      experimentDetail:
        (t7ItemsFromDb &&
          t7ItemsFromDb
            .map((i) => i.experimentDetail)
            .filter(Boolean)
            .join(" | ")) ||
        "",
      detail:
        (t7ItemsFromDb &&
          t7ItemsFromDb
            .map((i) => i.detail)
            .filter(Boolean)
            .join(" | ")) ||
        t7Item?.detail ||
        "",
      items: t7ItemsFromDb || [],
    };

    targets.t8 = {
      ...prevTargets.t8,
      topic:
        type8DbItems
          .map((i) => i.meetingTopic)
          .filter(Boolean)
          .join(", ") ||
        t8Item?.meetingTopic ||
        "",
      products:
        type8DbItems
          .map((i) => i.meetingTargetProducts)
          .filter(Boolean)
          .join(", ") ||
        t8Item?.meetingTargetProducts ||
        "",
      targetAttendees:
        type8DbItems
          .map((i) =>
            i.meetingAttendeesCount ? `${i.meetingAttendeesCount} คน` : "",
          )
          .filter(Boolean)
          .join(", ") ||
        (t8Item?.meetingAttendeesCount
          ? `${t8Item.meetingAttendeesCount} คน`
          : ""),
    };

    targets.t9 = {
      ...prevTargets.t9,
      store:
        t9MainStore ||
        rawCustomerName ||
        t9Item?.surveyStoreName ||
        allCustomers ||
        "",
      isSubDealer: t9IsSubDealer,
      subDealerStore: t9SubDealerStore,
      product: t9ProductSummary || t9Item?.storeProductName || "",
      targetSales:
        t9TotalSales > 0
          ? `${t9TotalSales.toLocaleString()} บาท`
          : t9Item?.storeTotalAmount
            ? `${Number(t9Item.storeTotalAmount).toLocaleString()} บาท`
            : "",
      items: t9ItemsFromDb,
    };

    targets.t10 = {
      ...prevTargets.t10,
      plot:
        t10Item?.customerName ||
        t10Item?.plotOwnerName ||
        (detectedWorkTypes.has(WORK_TYPES[9]) && allCustomers
          ? allCustomers
          : ""),
      location: (() => {
        if (t10Item?.detail) {
          const match = t10Item.detail.match(/สถานที่:\s*([^|]+)/);
          if (match) return match[1].trim();
        }
        return p.location || prevTargets.t10.location || "";
      })(),
      showcase: (() => {
        if (t10Item?.plotProductName) return t10Item.plotProductName;
        if (t10Item?.detail) {
          const match = t10Item.detail.match(/สินค้าโชว์:\s*([^|]+)/);
          if (match) return match[1].trim();
        }
        return "";
      })(),
      targetAttendees: (() => {
        if (
          t10Item?.meetingAttendeesCount != null &&
          Number(t10Item.meetingAttendeesCount) > 0
        ) {
          return `${t10Item.meetingAttendeesCount} คน`;
        }
        if (
          t10Item?.targetAttendees != null &&
          Number(t10Item.targetAttendees) > 0
        ) {
          return `${t10Item.targetAttendees} คน`;
        }
        if (t10Item?.detail) {
          const match = t10Item.detail.match(/ผู้ร่วมงาน:\s*([^|]+)/);
          if (match) return match[1].trim();
        }
        const objMatch =
          objectiveText.match(/เป้าผู้ร่วมงาน:\s*([^|,\n]+)/) ||
          objectiveText.match(/ผู้ร่วมงาน:\s*([^|,\n]+)/);
        if (objMatch) return objMatch[1].trim();
        return prevTargets.t10.targetAttendees || "";
      })(),
      targetSales: (() => {
        if (
          t10Item?.saleTotalPrice != null &&
          Number(t10Item.saleTotalPrice) > 0
        ) {
          return `฿${Number(t10Item.saleTotalPrice).toLocaleString()}`;
        }
        if (
          t10Item?.targetSales != null &&
          Number(t10Item.targetSales) > 0
        ) {
          return `฿${Number(t10Item.targetSales).toLocaleString()}`;
        }
        if (t10Item?.detail) {
          const match = t10Item.detail.match(/เป้ายอดจอง:\s*([^|]+)/);
          if (match) return match[1].trim();
        }
        const objMatch = objectiveText.match(/เป้ายอดจอง:\s*([^|,\n]+)/);
        if (objMatch) return objMatch[1].trim();
        return prevTargets.t10.targetSales || "";
      })(),
    };

    const t11StoresFromDb =
      Array.from(
        new Set(
          type11DbItems
            .map((i) => i.customerName)
            .filter((c): c is string => Boolean(c))
            .flatMap((s: string) =>
              s.split(",").map((str: string) => str.trim()).filter(Boolean),
            ),
        ),
      ).join(", ") ||
      allCustomers ||
      "";

    targets.t11 = {
      ...prevTargets.t11,
      store: t11StoresFromDb || t11Item?.customerName || allCustomers || "",
      detail: t11Item?.detail || "",
    };

    if (p.startDate) {
      t7StartDate = new Date(p.startDate).toISOString().split("T")[0];
    }

    t7PlotIdentifier =
      t7Item?.existingPlotId ||
      t7Item?.plotOwnerName ||
      t7Item?.plotCropName ||
      "";
  }

  return {
    planSummary,
    resolvedWorkTypes,
    targets,
    t9Extra: {
      mainStore: t9MainStore,
      isSubDealer: t9IsSubDealer,
      subDealerStore: t9SubDealerStore,
      productSummary: t9ProductSummary,
      totalSales: t9TotalSales,
      items: t9ItemsFromDb,
    },
    t7StartDate,
    t7PlotIdentifier,
  };
}

function itemPlotCountStr(item: any): string {
  if (item?.plotCount != null && item?.plotCount !== "") {
    return String(item.plotCount);
  }
  if (item?.plotsCount != null && item?.plotsCount !== "") {
    return String(item.plotsCount);
  }
  return "";
}
