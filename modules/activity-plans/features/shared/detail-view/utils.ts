import type { ActivityPlanWithRelations } from "../../../types";
import { WORK_TYPES } from "../../../constants";
import { mapType1StoresToSectionItems } from "@/modules/activity-plans/features/type-1";
import { mapType2ToSectionItems } from "@/modules/activity-plans/features/type-2";
import { mapType3ToSectionItems } from "@/modules/activity-plans/features/type-3";
import { mapType4ToSectionItems } from "@/modules/activity-plans/features/type-4";
import { mapType5ToSectionItems } from "@/modules/activity-plans/features/type-5";
import { mapType7aToSectionItems } from "@/modules/activity-plans/features/type-7a";
import { mapType7bToSectionItems } from "@/modules/activity-plans/features/type-7b";
import {
  decodeType8StoreNotes,
  mapType8ToSectionItems,
} from "@/modules/activity-plans/features/type-8";
import { mapType9ToSectionItems } from "@/modules/activity-plans/features/type-9";
import { mapType10ToSectionItems } from "@/modules/activity-plans/features/type-10";
import { mapType11ToSectionItems } from "@/modules/activity-plans/features/type-11";
import { mapType12ToSectionItems } from "@/modules/activity-plans/features/type-12";
import type {
  ParsedWorkTypeSection,
  MarketingProductDetail,
  SalesPromotionDetail,
  RequisitionDetail,
} from "./types";

// ────────────────────────────────────────────────────────
// Helper function to extract structured work type cards
// ────────────────────────────────────────────────────────
export function extractWorkTypeSections(
  plan: ActivityPlanWithRelations,
): ParsedWorkTypeSection[] {
  const sections: ParsedWorkTypeSection[] = [];
  const objectiveText = plan.objective || "";
  const objectiveLines = objectiveText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const stores = plan.stores || [];
  const products = plan.products || [];

  // ── 1. เข้าพบร้านค้า / Key Farmer ──────────────────────
  const rawType1Stores: any[] =
    (plan as any).type1Stores && (plan as any).type1Stores.length > 0
      ? (plan as any).type1Stores
      : stores.filter((s) => s.workTypeCode === "TYPE_1");
  const t1Line = objectiveLines.find(
    (l) =>
      l.includes("[เข้าพบร้านค้า") ||
      l.includes("เข้าพบร้านค้า") ||
      l.includes("Key Farmer"),
  );
  if (rawType1Stores.length > 0 || t1Line) {
    const list = mapType1StoresToSectionItems(rawType1Stores, plan.location);
    sections.push({
      typeIndex: 1,
      title: WORK_TYPES[0],
      badge: "เข้าพบ",
      items: list,
      rawSummary: t1Line ? t1Line.replace(/^\[.*?\]\s*/, "") : undefined,
    });
  }

  // ── 2. ติดตามผลการใช้สินค้า (Delegated to Type 2 Feature Slice) ──
  const t2Line = objectiveLines.find(
    (l) =>
      l.includes("[ติดตามผลการใช้สินค้า]") ||
      l.includes("ติดตามผลการใช้สินค้า"),
  );
  const type2Items = mapType2ToSectionItems(stores, products);
  if (type2Items.length > 0 || t2Line) {
    sections.push({
      typeIndex: 2,
      title: WORK_TYPES[1],
      badge: "ติดตามผล",
      items: type2Items,
      rawSummary: t2Line ? t2Line.replace(/^\[.*?\]\s*/, "") : undefined,
    });
  }

  // ── 3. เสนอขายสินค้า ───────────────────────────────────
  const t3Line = objectiveLines.find(
    (l) => l.includes("[เสนอขายสินค้า]") || l.includes("เสนอขายสินค้า"),
  );
  const type3Items = mapType3ToSectionItems(stores, products);
  if (type3Items.length > 0 || t3Line) {
    sections.push({
      typeIndex: 3,
      title: WORK_TYPES[2],
      badge: "เสนอขาย",
      items: type3Items,
      rawSummary: t3Line ? t3Line.replace(/^\[.*?\]\s*/, "") : undefined,
    });
  }

  // ── 4. วางบิล / เก็บเงิน (Delegated to Type 4 Feature Slice) ──
  const rawType4Stores: any[] =
    (plan as any).type4Targets && (plan as any).type4Targets.length > 0
      ? (plan as any).type4Targets
      : stores.filter((s) => s.workTypeCode === "TYPE_4");
  const t4Line = objectiveLines.find(
    (l) =>
      l.includes("[วางบิล") ||
      l.includes("วางบิล / เก็บเงิน") ||
      l.includes("วางบิล/เก็บเงิน"),
  );
  const type4Items = mapType4ToSectionItems(rawType4Stores);
  if (type4Items.length > 0 || t4Line) {
    sections.push({
      typeIndex: 4,
      title: WORK_TYPES[3],
      badge: "เก็บเงิน",
      items: type4Items,
      rawSummary: t4Line ? t4Line.replace(/^\[.*?\]\s*/, "") : undefined,
    });
  }

  // ── 5. สำรวจตลาดคู่แข่ง (Delegated to Type 5 Feature Slice) ──
  const rawType5Targets: any[] =
    (plan as any).type5Targets && (plan as any).type5Targets.length > 0
      ? (plan as any).type5Targets
      : stores.filter((s) => s.workTypeCode === "TYPE_5");
  const t5Line = objectiveLines.find(
    (l) => l.includes("[สำรวจตลาด") || l.includes("สำรวจตลาด"),
  );
  const type5Items = mapType5ToSectionItems(rawType5Targets, products);
  if (type5Items.length > 0 || t5Line) {
    sections.push({
      typeIndex: 5,
      title: WORK_TYPES[4],
      badge: "สำรวจตลาด",
      items: type5Items,
      rawSummary: t5Line ? t5Line.replace(/^\[.*?\]\s*/, "") : undefined,
    });
  }

  // ── 6. ตรวจสอบเรื่องร้องเรียน / แก้ปัญหา ─────────────────────
  const type6Targets: any[] = plan.type6Targets || [];
  const type6Stores = stores.filter((s) => s.workTypeCode === "TYPE_6");
  const t6Line = objectiveLines.find(
    (l) =>
      l.includes("[ตรวจสอบเรื่องร้องเรียน") ||
      l.includes("ตรวจสอบเรื่องร้องเรียน"),
  );
  if (type6Targets.length > 0 || type6Stores.length > 0 || t6Line) {
    let list: any[] = [];
    if (type6Targets.length > 0) {
      list = type6Targets.map((t: any) => ({
        title:
          t.customerName ||
          t.store?.name ||
          t.store?.storeName ||
          (t.isManualCustomer ? "ลูกค้าทั่วไป / เกษตรกร" : "ร้านค้าตัวแทนจำหน่าย"),
        subtitle: t.issueType ? `ประเภทปัญหา: ${t.issueType}` : undefined,
        details: t.detail || undefined,
      }));
    } else {
      list = type6Stores.map((s) => ({
        title:
          (s as any).store?.name ||
          s.storeName ||
          plan.location ||
          "ลูกค้า/ร้านค้า",
        subtitle: s.remarks ? `ประเภทปัญหา: ${s.remarks}` : undefined,
        details: s.notes || undefined,
      }));
    }
    sections.push({
      typeIndex: 6,
      title: WORK_TYPES[5],
      badge: "ร้องเรียน/ปัญหา",
      items: list,
      rawSummary: t6Line ? t6Line.replace(/^\[.*?\]\s*/, "") : undefined,
    });
  }

  // ── 7. แปลงสาธิต ───────────────────────────────────────
  const type7aPlots = (plan as any).type7aPlots || [];
  const type7bRecord = (plan as any).type7b || (plan as any).type7bData;
  const demoVisits = plan.demoPlotVisits || [];
  const t7Line = objectiveLines.find(
    (l) =>
      l.includes("[ติดตามแปลงสาธิต") ||
      l.includes("ทำแปลงสาธิต") ||
      l.includes("แปลงสาธิต"),
  );
  if (type7bRecord || type7aPlots.length > 0 || demoVisits.length > 0 || t7Line) {
    let list: any[] = [];
    if (type7bRecord) {
      list = mapType7bToSectionItems(type7bRecord, demoVisits);
    } else if (type7aPlots.length > 0) {
      list = mapType7aToSectionItems(type7aPlots);
    } else {
      list = demoVisits.map((v) => {
        const dp = v.demoPlot;
        const extraFields: Array<{ label: string; value: string }> = [];
        if (dp?.cropName)
          extraFields.push({ label: "พืชเป้าหมาย", value: dp.cropName });
        if (dp?.primaryProductName)
          extraFields.push({
            label: "สินค้าสาธิต",
            value: dp.primaryProductName,
          });
        if (dp?.areaRai)
          extraFields.push({
            label: "ขนาดแปลง",
            value: `${Number(dp.areaRai)} ไร่`,
          });
        return {
          title: dp?.name || dp?.ownerName || "แปลงสาธิต",
          subtitle: dp?.ownerName ? `เจ้าของ: ${dp.ownerName}` : undefined,
          details: dp?.objective || undefined,
          extraFields: extraFields.length > 0 ? extraFields : undefined,
        };
      });
    }
    sections.push({
      typeIndex: 7,
      title: WORK_TYPES[6],
      badge: "แปลงสาธิต",
      items: list,
      rawSummary: t7Line ? t7Line.replace(/^\[.*?\]\s*/, "") : undefined,
    });
  }

  // ── 8. จัดประชุม (Delegated to Type 8 Feature Slice) ────────────
  const type8Stores = stores.filter(
    (s) =>
      s.workTypeCode === "TYPE_8" ||
      s.workTypeCode === "จัดประชุม" ||
      s.workTypeCode === "จัดประชุมการเกษตร",
  );
  const type8Products = products.filter(
    (pr) => pr.workTypeCode === "TYPE_8" || pr.workTypeCode === "TYPE_8_PROMOTION",
  );
  const t8Line = objectiveLines.find(
    (l) => l.includes("[จัดประชุม") || l.includes("ประชุม"),
  );
  if (
    type8Stores.length > 0 ||
    type8Products.length > 0 ||
    plan.targetAttendeesCount ||
    t8Line
  ) {
    const list = mapType8ToSectionItems(
      type8Stores,
      products,
      plan.targetAttendeesCount,
    );
    sections.push({
      typeIndex: 8,
      title: WORK_TYPES[7],
      badge: "ประชุม",
      items:
        list.length > 0
          ? list
          : [
              {
                title: plan.title || "จัดประชุม",
              },
            ],
      rawSummary: t8Line ? t8Line.replace(/^\[.*?\]\s*/, "") : undefined,
    });
  }

  // ── 9. กิจกรรมหน้าร้าน ──────────────────────────────────
  const type9Stores = stores.filter((s) => s.workTypeCode === "TYPE_9");
  const type9Products = products.filter((pr) => pr.workTypeCode === "TYPE_9");
  const t9Section = mapType9ToSectionItems(
    type9Stores,
    type9Products,
    objectiveLines,
  );
  if (t9Section) {
    sections.push(t9Section);
  }

  // ── 10. Field Day ───────────────────────────────────────
  const t10Section = mapType10ToSectionItems(plan, objectiveLines);
  if (t10Section) {
    sections.push(t10Section);
  }

  // ── 11. ตรวจเช็กสต็อกหน้าร้าน ────────────────────────────
  const type11Stores = stores.filter((s) => s.workTypeCode === "TYPE_11");
  const t11Section = mapType11ToSectionItems(type11Stores, objectiveLines);
  if (t11Section) {
    sections.push(t11Section);
  }

  // ── 12. ทัวร์ ───────────────────────────────────────────
  const t12Section = mapType12ToSectionItems(plan.tour, objectiveLines);
  if (t12Section) {
    sections.push(t12Section);
  }

  return sections;
}

// ────────────────────────────────────────────────────────
// Helper function to extract promotional media from plan
// ────────────────────────────────────────────────────────
export function extractMarketingProducts(
  plan: ActivityPlanWithRelations,
): MarketingProductDetail[] {
  if (plan.marketingItems && plan.marketingItems.length > 0) {
    return plan.marketingItems.map((m) => ({
      category: m.category || "สื่อส่งเสริมการขาย",
      productName: m.materialName || "สื่อส่งเสริมการขาย",
      quantity: m.quantity || 1,
      unit: m.unit || "ชิ้น",
      pricePerUnit: Number(m.unitPrice) || 0,
      totalAmount: Number(m.totalAmount) || 0,
    }));
  }

  // Fallback from description text block if any
  const desc = plan.description || "";
  const match = desc.match(/\[สื่อส่งเสริมการขาย\]\s*([\s\S]*?)(?=\n\n\[|$)/);
  if (match && match[1]) {
    const lines = match[1]
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    return lines.map((line) => {
      const catMatch = line.match(/\[(.*?)\]/);
      const category = catMatch ? catMatch[1] : "สื่อส่งเสริมการขาย";
      const cleanLine = line.replace(/^\d+\.\s*/, "").replace(/\[.*?\]\s*/, "");
      return {
        category,
        productName: cleanLine,
        quantity: 1,
        unit: "ชิ้น",
        pricePerUnit: 0,
        totalAmount: 0,
      };
    });
  }
  return [];
}

// ────────────────────────────────────────────────────────
// Helper function to extract sales promotions from plan
// ────────────────────────────────────────────────────────
export function extractSalesPromotions(
  plan: ActivityPlanWithRelations,
): SalesPromotionDetail[] {
  if (plan.promotionItems && plan.promotionItems.length > 0) {
    return plan.promotionItems.map((p) => ({
      budgetType: p.budgetType || "งบส่งเสริมการขาย",
      detail: p.detail || "รายการส่งเสริมการขาย",
      amount: Number(p.amount) || 0,
    }));
  }

  // Fallback from description text block if any
  const desc = plan.description || "";
  const match = desc.match(/\[รายการส่งเสริมการขาย\]\s*([\s\S]*?)(?=\n\n\[|$)/);
  if (match && match[1]) {
    const lines = match[1]
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    return lines.map((line) => {
      const catMatch = line.match(/\[(.*?)\]/);
      const budgetType = catMatch ? catMatch[1] : "งบการตลาด";
      const amountMatch = line.match(/฿([\d,]+)/);
      const amount = amountMatch
        ? parseFloat(amountMatch[1].replace(/,/g, ""))
        : 0;
      const detail = line
        .replace(/^\d+\.\s*/, "")
        .replace(/\[.*?\]\s*/, "")
        .replace(/-\s*฿[\d,]+/, "")
        .trim();
      return {
        budgetType,
        detail,
        amount,
      };
    });
  }
  return [];
}

// ────────────────────────────────────────────────────────
// Helper function to extract general material requisitions
// ────────────────────────────────────────────────────────
export function extractRequisitions(
  plan: ActivityPlanWithRelations,
): RequisitionDetail[] {
  // From description text block
  const desc = plan.description || "";
  const match = desc.match(/\[รายการขอเบิกสินค้า\]\s*([\s\S]*?)(?=\n\n\[|$)/);
  if (match && match[1]) {
    const lines = match[1]
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    return lines.map((line) => ({
      productName: line.replace(/^\d+\.\s*/, ""),
      quantity: 1,
      unit: "รายการ",
      detail: "",
    }));
  }
  return [];
}
