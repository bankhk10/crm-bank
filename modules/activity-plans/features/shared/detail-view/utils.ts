import type { ActivityPlanWithRelations } from "../../../types";
import { WORK_TYPES } from "../../../constants";
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
  const type1Stores = stores.filter((s) => s.workTypeCode === "TYPE_1");
  const t1Line = objectiveLines.find(
    (l) =>
      l.includes("[เข้าพบร้านค้า") ||
      l.includes("เข้าพบร้านค้า") ||
      l.includes("Key Farmer"),
  );
  if (type1Stores.length > 0 || t1Line) {
    const list = type1Stores.map((s) => ({
      title: s.storeName || plan.location || "ลูกค้า/ร้านค้า",
      subtitle: s.remarks ? `หัวข้อเป้าหมาย: ${s.remarks}` : undefined,
      details: s.notes || undefined,
    }));
    sections.push({
      typeIndex: 1,
      title: WORK_TYPES[0],
      badge: "เข้าพบ",
      items: list,
      rawSummary: t1Line ? t1Line.replace(/^\[.*?\]\s*/, "") : undefined,
    });
  }

  // ── 2. ติดตามผลการใช้สินค้า ────────────────────────────
  const type2Products = products.filter((pr) => pr.workTypeCode === "TYPE_2");
  const type2Stores = stores.filter((s) => s.workTypeCode === "TYPE_2");
  const t2Line = objectiveLines.find(
    (l) =>
      l.includes("[ติดตามผลการใช้สินค้า]") ||
      l.includes("ติดตามผลการใช้สินค้า"),
  );
  if (type2Products.length > 0 || type2Stores.length > 0 || t2Line) {
    const list = type2Products.map((pr) => ({
      title: pr.productName || "สินค้า",
      subtitle: type2Stores[0]?.storeName
        ? `เกษตรกร/ร้านค้า: ${type2Stores[0].storeName}`
        : undefined,
      details: undefined,
    }));
    sections.push({
      typeIndex: 2,
      title: WORK_TYPES[1],
      badge: "ติดตามผล",
      items: list,
      rawSummary: t2Line ? t2Line.replace(/^\[.*?\]\s*/, "") : undefined,
    });
  }

  // ── 3. เสนอขายสินค้า ───────────────────────────────────
  const type3Products = products.filter((pr) => pr.workTypeCode === "TYPE_3");
  const type3Stores = stores.filter((s) => s.workTypeCode === "TYPE_3");
  const t3Line = objectiveLines.find(
    (l) => l.includes("[เสนอขายสินค้า]") || l.includes("เสนอขายสินค้า"),
  );
  if (type3Products.length > 0 || type3Stores.length > 0 || t3Line) {
    const list = type3Products.map((pr) => {
      const matchedStore =
        type3Stores.find(
          (s) => s.storeId && pr.storeId && s.storeId === pr.storeId,
        ) || type3Stores[0];
      const isSub = Boolean(matchedStore?.subDealerStore);
      const storeDisplay = isSub
        ? `${matchedStore?.subDealerStore} (Dealer: ${matchedStore?.storeName || "-"})`
        : matchedStore?.storeName || "-";

      const extraFields: Array<{ label: string; value: string }> = [];
      if (pr.targetQuantity != null) {
        extraFields.push({
          label: "จำนวนเป้าหมาย",
          value: `${pr.targetQuantity} หน่วย`,
        });
      }
      if (pr.notes || matchedStore?.notes) {
        extraFields.push({
          label: "รายละเอียด",
          value: pr.notes || matchedStore?.notes || "",
        });
      }
      return {
        title: pr.productName || "สินค้า",
        subtitle: `ร้านค้า: ${storeDisplay}`,
        extraFields: extraFields.length > 0 ? extraFields : undefined,
      };
    });
    sections.push({
      typeIndex: 3,
      title: WORK_TYPES[2],
      badge: "เสนอขาย",
      items: list,
      rawSummary: t3Line ? t3Line.replace(/^\[.*?\]\s*/, "") : undefined,
    });
  }

  // ── 4. วางบิล / เก็บเงิน ────────────────────────────────
  const type4Stores = stores.filter((s) => s.workTypeCode === "TYPE_4");
  const t4Line = objectiveLines.find(
    (l) =>
      l.includes("[วางบิล") ||
      l.includes("วางบิล / เก็บเงิน") ||
      l.includes("วางบิล/เก็บเงิน"),
  );
  if (type4Stores.length > 0 || t4Line) {
    const list = type4Stores.map((s) => {
      const extraFields: Array<{ label: string; value: string }> = [];
      if (s.targetAmount != null) {
        extraFields.push({
          label: "เป้าหมายการเก็บเงิน",
          value: `${Number(s.targetAmount).toLocaleString()} บาท`,
        });
      }
      return {
        title: s.storeName || plan.location || "ลูกค้า/ร้านค้า",
        details: s.notes || undefined,
        extraFields: extraFields.length > 0 ? extraFields : undefined,
      };
    });
    sections.push({
      typeIndex: 4,
      title: WORK_TYPES[3],
      badge: "เก็บเงิน",
      items: list,
      rawSummary: t4Line ? t4Line.replace(/^\[.*?\]\s*/, "") : undefined,
    });
  }

  // ── 5. สำรวจตลาดคู่แข่ง ──────────────────────────────────
  const type5Products = products.filter((pr) => pr.workTypeCode === "TYPE_5");
  const type5Stores = stores.filter((s) => s.workTypeCode === "TYPE_5");
  const t5Line = objectiveLines.find(
    (l) => l.includes("[สำรวจตลาด") || l.includes("สำรวจตลาด"),
  );
  if (type5Products.length > 0 || type5Stores.length > 0 || t5Line) {
    const list = type5Products.map((pr) => ({
      title: pr.productName || "สินค้า",
      subtitle: type5Stores[0]?.storeName
        ? `ร้านค้า: ${type5Stores[0].storeName}`
        : undefined,
    }));
    sections.push({
      typeIndex: 5,
      title: WORK_TYPES[4],
      badge: "สำรวจตลาด",
      items: list,
      rawSummary: t5Line ? t5Line.replace(/^\[.*?\]\s*/, "") : undefined,
    });
  }

  // ── 6. ตรวจสอบเรื่องร้องเรียน / แก้ปัญหา ─────────────────────
  const type6Stores = stores.filter((s) => s.workTypeCode === "TYPE_6");
  const t6Line = objectiveLines.find(
    (l) =>
      l.includes("[ตรวจสอบเรื่องร้องเรียน") ||
      l.includes("ตรวจสอบเรื่องร้องเรียน"),
  );
  if (type6Stores.length > 0 || t6Line) {
    const list = type6Stores.map((s) => ({
      title:
        (s as any).store?.name ||
        s.storeName ||
        plan.location ||
        "ลูกค้า/ร้านค้า",
      subtitle: s.remarks ? `ประเภทปัญหา: ${s.remarks}` : undefined,
      details: s.notes || undefined,
    }));
    sections.push({
      typeIndex: 6,
      title: WORK_TYPES[5],
      badge: "ร้องเรียน/ปัญหา",
      items: list,
      rawSummary: t6Line ? t6Line.replace(/^\[.*?\]\s*/, "") : undefined,
    });
  }

  // ── 7. แปลงสาธิต ───────────────────────────────────────
  const demoVisits = plan.demoPlotVisits || [];
  const t7Line = objectiveLines.find(
    (l) =>
      l.includes("[ติดตามแปลงสาธิต") ||
      l.includes("ทำแปลงสาธิต") ||
      l.includes("แปลงสาธิต"),
  );
  if (demoVisits.length > 0 || t7Line) {
    const list = demoVisits.map((v) => {
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
    sections.push({
      typeIndex: 7,
      title: WORK_TYPES[6],
      badge: "แปลงสาธิต",
      items: list,
      rawSummary: t7Line ? t7Line.replace(/^\[.*?\]\s*/, "") : undefined,
    });
  }

  // ── 8. จัดประชุม ────────────────────────────────
  const type8Products = products.filter((pr) => pr.workTypeCode === "TYPE_8");
  const type8PromoProducts = products.filter(
    (pr) => pr.workTypeCode === "TYPE_8_PROMOTION",
  );
  const type8Stores = stores.filter((s) => s.workTypeCode === "TYPE_8");
  const t8Line = objectiveLines.find(
    (l) => l.includes("[จัดประชุม") || l.includes("ประชุม"),
  );
  if (
    type8Products.length > 0 ||
    type8PromoProducts.length > 0 ||
    type8Stores.length > 0 ||
    plan.targetAttendeesCount ||
    t8Line
  ) {
    const extraFields: Array<{ label: string; value: string }> = [];
    if (type8Stores.length > 0) {
      const storeStr = type8Stores
        .map((s) =>
          s.subDealerStore
            ? `${s.subDealerStore} (Dealer: ${s.storeName || "-"})`
            : s.storeName,
        )
        .filter(Boolean)
        .join(", ");
      if (storeStr) {
        extraFields.push({
          label: "ร้านค้า / ตัวแทนจำหน่าย",
          value: storeStr,
        });
      }
    }
    if (plan.targetAttendeesCount) {
      extraFields.push({
        label: "ผู้เข้าร่วมเป้าหมาย",
        value: `${plan.targetAttendeesCount} คน`,
      });
    }
    if (type8Products.length > 0) {
      extraFields.push({
        label: "สินค้าเป้าหมาย",
        value: type8Products.map((p) => p.productName).join(", "),
      });
    }
    if (type8PromoProducts.length > 0) {
      extraFields.push({
        label: "รายการสินค้าโปรโมชัน",
        value: type8PromoProducts
          .map(
            (p) =>
              `${p.productName || "สินค้า"} (${p.targetQuantity ?? 1} ชิ้น${
                p.notes ? ` - ${p.notes}` : ""
              })`,
          )
          .join(", "),
      });
    }
    sections.push({
      typeIndex: 8,
      title: WORK_TYPES[7],
      badge: "ประชุม",
      items: [
        {
          title: plan.title || "จัดประชุม",
          extraFields: extraFields.length > 0 ? extraFields : undefined,
        },
      ],
      rawSummary: t8Line ? t8Line.replace(/^\[.*?\]\s*/, "") : undefined,
    });
  }

  // ── 9. กิจกรรมหน้าร้าน ──────────────────────────────────
  const type9Stores = stores.filter((s) => s.workTypeCode === "TYPE_9");
  const type9Products = products.filter((pr) => pr.workTypeCode === "TYPE_9");
  const t9Line = objectiveLines.find(
    (l) => l.includes("[กิจกรรมหน้าร้าน") || l.includes("กิจกรรมหน้าร้าน"),
  );
  if (type9Stores.length > 0 || type9Products.length > 0 || t9Line) {
    const list = type9Products.map((pr) => ({
      title: pr.productName || "สินค้า",
      subtitle: type9Stores[0]?.storeName
        ? `ร้านค้า: ${type9Stores[0].storeName}`
        : undefined,
      extraFields: [
        ...(pr.targetQuantity != null
          ? [{ label: "จำนวน", value: `${pr.targetQuantity} ลัง` }]
          : []),
        ...(pr.targetAmount != null
          ? [
              {
                label: "ยอดขายเป้าหมาย",
                value: `${Number(pr.targetAmount).toLocaleString()} บาท`,
              },
            ]
          : []),
      ],
    }));
    sections.push({
      typeIndex: 9,
      title: WORK_TYPES[8],
      badge: "กิจกรรมหน้าร้าน",
      items: list,
      rawSummary: t9Line ? t9Line.replace(/^\[.*?\]\s*/, "") : undefined,
    });
  }

  // ── 10. Field Day ───────────────────────────────────────
  const t10Line = objectiveLines.find(
    (l) => l.includes("[Field Day") || l.includes("Field Day"),
  );
  const isType10 =
    plan.workTypes?.some((wt) => wt.activityType?.code === "TYPE_10") ||
    Boolean(t10Line);
  if (isType10) {
    const extraFields: Array<{ label: string; value: string }> = [];
    if (plan.targetAttendeesCount) {
      extraFields.push({
        label: "ผู้เข้าร่วมเป้าหมาย",
        value: `${plan.targetAttendeesCount} คน`,
      });
    }
    if (plan.targetBookingSales) {
      extraFields.push({
        label: "เป้ายอดจอง",
        value: `${Number(plan.targetBookingSales).toLocaleString()} บาท`,
      });
    }
    sections.push({
      typeIndex: 10,
      title: WORK_TYPES[9],
      badge: "Field Day",
      items: [
        {
          title: plan.location || "งาน Field Day",
          extraFields: extraFields.length > 0 ? extraFields : undefined,
        },
      ],
      rawSummary: t10Line ? t10Line.replace(/^\[.*?\]\s*/, "") : undefined,
    });
  }

  // ── 11. ตรวจเช็กสต็อกหน้าร้าน ────────────────────────────
  const type11Stores = stores.filter((s) => s.workTypeCode === "TYPE_11");
  const t11Line = objectiveLines.find(
    (l) => l.includes("[ตรวจเช็กสต็อก") || l.includes("ตรวจเช็กสต็อก"),
  );
  if (type11Stores.length > 0 || t11Line) {
    const list = type11Stores.map((s) => ({
      title: s.storeName || "ร้านค้า",
      details: s.remarks || s.notes || undefined,
    }));
    sections.push({
      typeIndex: 11,
      title: WORK_TYPES[10],
      badge: "เช็กสต็อก",
      items: list,
      rawSummary: t11Line ? t11Line.replace(/^\[.*?\]\s*/, "") : undefined,
    });
  }

  // ── 12. ทัวร์ ───────────────────────────────────────────
  const tour = plan.tour;
  const t12Line = objectiveLines.find(
    (l) => l.includes("[ทัวร์") || l.includes("ทัวร์"),
  );
  if (tour || t12Line) {
    const extraFields: Array<{ label: string; value: string }> = [];
    if (tour?.tourType)
      extraFields.push({
        label: "ประเภททัวร์",
        value: tour.tourType === "STORE" ? "ทัวร์ร้านค้า" : "ทัวร์กลาง",
      });
    if (tour?.country)
      extraFields.push({ label: "ประเทศ/ปลายทาง", value: tour.country });
    if (tour?.destination)
      extraFields.push({ label: "สถานที่", value: tour.destination });
    sections.push({
      typeIndex: 12,
      title: WORK_TYPES[11] || "ทัวร์",
      badge: "ทัวร์",
      items: [
        {
          title: tour?.destination || tour?.country || "ทัวร์",
          extraFields: extraFields.length > 0 ? extraFields : undefined,
        },
      ],
      rawSummary: t12Line ? t12Line.replace(/^\[.*?\]\s*/, "") : undefined,
    });
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
