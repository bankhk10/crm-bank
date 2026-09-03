import type { ActivityPlanWithRelations } from "../../types";
import { WORK_TYPES, isFieldDayItem } from "../../constants";
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
  const items = (plan.items as any[]) || [];
  const objectiveText = plan.objective || "";
  const objectiveLines = objectiveText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  // ── 1. เข้าพบร้านค้า / Key Farmer ──────────────────────
  const type1DbItems = items.filter(
    (i) =>
      i.itemType === "TYPE_1" ||
      (i.visitTopic &&
        i.itemType !== "MARKETING_PRODUCT" &&
        i.itemType !== "SALES_PROMOTION" &&
        !i.followupProductName &&
        !i.saleProductName &&
        !i.collectAmount &&
        !i.surveyCompetitorProduct &&
        !i.plotActivityType &&
        !i.meetingTopic &&
        !i.storeProductName),
  );
  const t1Line = objectiveLines.find(
    (l) =>
      l.includes("[เข้าพบร้านค้า") ||
      l.includes("เข้าพบร้านค้า") ||
      l.includes("Key Farmer"),
  );
  if (type1DbItems.length > 0 || t1Line) {
    const list =
      type1DbItems.length > 0
        ? type1DbItems.map((i) => {
            const extraFields: Array<{ label: string; value: string }> = [];
            if (i.opportunity)
              extraFields.push({ label: "โอกาสการขาย", value: i.opportunity });
            if (i.nextMeetingDate)
              extraFields.push({
                label: "นัดหมายครั้งถัดไป",
                value: i.nextMeetingDate,
              });
            if (i.nextAction)
              extraFields.push({
                label: "สิ่งที่ต้องดำเนินการ",
                value: i.nextAction,
              });
            return {
              title: i.customerName || plan.location || "ลูกค้า/ร้านค้า",
              subtitle: i.visitTopic
                ? `หัวข้อเป้าหมาย: ${i.visitTopic}`
                : undefined,
              details: i.detail || undefined,
              extraFields: extraFields.length > 0 ? extraFields : undefined,
            };
          })
        : [];
    sections.push({
      typeIndex: 1,
      title: WORK_TYPES[0],
      badge: "เข้าพบ",
      items: list,
      rawSummary: t1Line ? t1Line.replace(/^\[.*?\]\s*/, "") : undefined,
    });
  }

  // ── 2. ติดตามผลการใช้สินค้า ────────────────────────────
  const type2DbItems = items.filter(
    (i) => i.itemType === "TYPE_2" || i.followupProductName,
  );
  const t2Line = objectiveLines.find(
    (l) =>
      l.includes("[ติดตามผลการใช้สินค้า]") ||
      l.includes("ติดตามผลการใช้สินค้า"),
  );
  if (type2DbItems.length > 0 || t2Line) {
    const list =
      type2DbItems.length > 0
        ? type2DbItems.map((i) => {
            const extraFields: Array<{ label: string; value: string }> = [];
            if (i.expectedResult)
              extraFields.push({
                label: "ผลที่คาดหวัง",
                value: i.expectedResult,
              });
            return {
              title: i.followupProductName || i.productName || "สินค้าติดตาม",
              subtitle: i.customerName
                ? `ลูกค้า/แปลง: ${i.customerName}`
                : undefined,
              details: i.detail || undefined,
              extraFields: extraFields.length > 0 ? extraFields : undefined,
            };
          })
        : [];
    sections.push({
      typeIndex: 2,
      title: WORK_TYPES[1],
      badge: "ติดตามผล",
      items: list,
      rawSummary: t2Line ? t2Line.replace(/^\[.*?\]\s*/, "") : undefined,
    });
  }

  // ── 3. เสนอขายสินค้า ────────────────────────────────────
  const type3DbItems = items.filter(
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
  const t3Line = objectiveLines.find(
    (l) => l.includes("[เสนอขายสินค้า]") || l.includes("เสนอขายสินค้า"),
  );
  if (type3DbItems.length > 0 || t3Line) {
    const totalSales = type3DbItems.reduce(
      (sum, i) => sum + Number(i.saleTotalPrice || 0),
      0,
    );
    const list =
      type3DbItems.length > 0
        ? type3DbItems.map((i) => {
            const qty = i.saleQuantity ? `${i.saleQuantity} หน่วย` : "";
            const price = i.saleUnitPrice
              ? `@ ฿${Number(i.saleUnitPrice).toLocaleString()}`
              : "";
            const total = i.saleTotalPrice
              ? `รวม ฿${Number(i.saleTotalPrice).toLocaleString()}`
              : "";
            return {
              title: i.saleProductName || "สินค้าเสนอขาย",
              subtitle: i.customerName
                ? `ลูกค้า/ร้านค้า: ${i.customerName}`
                : undefined,
              amount: total || undefined,
              details: [qty, price, i.detail].filter(Boolean).join(" | "),
            };
          })
        : [];
    const targetCards: Array<{
      label: string;
      value: string;
      highlight?: boolean;
    }> = [];
    if (totalSales > 0) {
      targetCards.push({
        label: "เป้ายอดขายรวม",
        value: `฿${totalSales.toLocaleString()}`,
        highlight: true,
      });
    }
    sections.push({
      typeIndex: 3,
      title: WORK_TYPES[2],
      badge: "เสนอขาย",
      items: list,
      rawSummary: t3Line ? t3Line.replace(/^\[.*?\]\s*/, "") : undefined,
      targetCards: targetCards.length > 0 ? targetCards : undefined,
    });
  }

  // ── 4. วางบิล / เก็บเงิน ─────────────────────────────────
  const type4DbItems = items.filter(
    (i) =>
      !isFieldDayItem(i) &&
      i.itemType !== "MARKETING_PRODUCT" &&
      i.itemType !== "SALES_PROMOTION" &&
      i.visitTopic !== "MARKETING_PRODUCT" &&
      i.visitTopic !== "SALES_PROMOTION" &&
      (i.itemType === "TYPE_4" || (i.collectAmount != null && !i.visitTopic)),
  );
  const t4Line = objectiveLines.find(
    (l) =>
      l.includes("[วางบิล") ||
      l.includes("วางบิล / เก็บเงิน") ||
      l.includes("วางบิล/เก็บเงิน"),
  );
  if (type4DbItems.length > 0 || t4Line) {
    const totalCollect = type4DbItems.reduce(
      (sum, i) => sum + Number(i.collectAmount || 0),
      0,
    );
    const list =
      type4DbItems.length > 0
        ? type4DbItems.map((i) => ({
            title: i.customerName || "ลูกค้า/ร้านค้า",
            amount: i.collectAmount
              ? `เป้าเก็บเงิน: ฿${Number(i.collectAmount).toLocaleString()}`
              : undefined,
            details:
              i.detail || i.orderNo
                ? [i.detail, i.orderNo ? `เลขบิล: ${i.orderNo}` : ""]
                    .filter(Boolean)
                    .join(" | ")
                : undefined,
          }))
        : [];
    const targetCards: Array<{
      label: string;
      value: string;
      highlight?: boolean;
    }> = [];
    if (totalCollect > 0) {
      targetCards.push({
        label: "เป้ายอดเก็บเงินรวม",
        value: `฿${totalCollect.toLocaleString()}`,
        highlight: true,
      });
    }
    sections.push({
      typeIndex: 4,
      title: WORK_TYPES[3],
      badge: "วางบิล",
      items: list,
      rawSummary: t4Line ? t4Line.replace(/^\[.*?\]\s*/, "") : undefined,
      targetCards: targetCards.length > 0 ? targetCards : undefined,
    });
  }

  // ── 5. สำรวจตลาดของคู่แข่ง ──────────────────────────────
  const type5DbItems = items.filter(
    (i) =>
      !isFieldDayItem(i) &&
      (i.itemType === "TYPE_5" || i.surveyCompetitorProduct || i.surveyStoreName),
  );
  const t5Line = objectiveLines.find(
    (l) =>
      l.includes("[สำรวจตลาด") ||
      l.includes("สำรวจตลาดของคู่แข่ง") ||
      l.includes("สำรวจตลาดคู่แข่ง"),
  );
  if (type5DbItems.length > 0 || t5Line) {
    const list =
      type5DbItems.length > 0
        ? type5DbItems.map((i) => {
            const extraFields: Array<{ label: string; value: string }> = [];
            if (i.surveyCompetitorBrand)
              extraFields.push({
                label: "แบรนด์คู่แข่ง",
                value: i.surveyCompetitorBrand,
              });
            return {
              title: i.surveyStoreName || "ร้านค้าสำรวจ",
              subtitle: i.surveyCompetitorProduct
                ? `สินค้าคู่แข่ง: ${i.surveyCompetitorProduct}`
                : undefined,
              details: i.detail || undefined,
              extraFields: extraFields.length > 0 ? extraFields : undefined,
            };
          })
        : [];
    sections.push({
      typeIndex: 5,
      title: WORK_TYPES[4],
      badge: "สำรวจคู่แข่ง",
      items: list,
      rawSummary: t5Line ? t5Line.replace(/^\[.*?\]\s*/, "") : undefined,
    });
  }

  // ── 6. แก้ปัญหา / รับเรื่องร้องเรียน ───────────────────
  const type6DbItems = items.filter(
    (i) => !isFieldDayItem(i) && (i.itemType === "TYPE_6" || i.issueType),
  );
  const t6Line = objectiveLines.find(
    (l) =>
      l.includes("[แก้ปัญหา") ||
      l.includes("แก้ปัญหา / รับเรื่องร้องเรียน") ||
      l.includes("แก้ปัญหา/ร้องเรียน"),
  );
  if (type6DbItems.length > 0 || t6Line) {
    const list =
      type6DbItems.length > 0
        ? type6DbItems.map((i) => {
            const extraFields: Array<{ label: string; value: string }> = [];
            if (i.targetStatus)
              extraFields.push({ label: "เป้าสถานะ", value: i.targetStatus });
            return {
              title: i.customerName || "ลูกค้า/เกษตรกร",
              badge: i.issueType || "ข้อร้องเรียน",
              details: i.detail || undefined,
              extraFields: extraFields.length > 0 ? extraFields : undefined,
            };
          })
        : [];
    sections.push({
      typeIndex: 6,
      title: WORK_TYPES[5],
      badge: "แก้ปัญหา",
      items: list,
      rawSummary: t6Line ? t6Line.replace(/^\[.*?\]\s*/, "") : undefined,
    });
  }

  // ── 7. ติดตามแปลงสาธิต / ทำแปลง ────────────────────────
  const type7DbItems = items.filter(
    (i) =>
      !isFieldDayItem(i) &&
      i.itemType !== "MARKETING_PRODUCT" &&
      i.itemType !== "SALES_PROMOTION" &&
      i.itemType !== "TYPE_10" &&
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
  const t7Line = objectiveLines.find(
    (l) =>
      l.includes("[ติดตามแปลงสาธิต") ||
      l.includes("ติดตามแปลงสาธิต / ทำแปลง") ||
      l.includes("ทำแปลงสาธิต") ||
      (l.includes("แปลงสาธิต") &&
        !l.includes("Field Day") &&
        !l.includes("[Field Day]")),
  );
  if (type7DbItems.length > 0 || t7Line) {
    const list =
      type7DbItems.length > 0
        ? type7DbItems.map((i) => {
            const mode =
              i.plotActivityType === "FOLLOW_UP"
                ? "ติดตามแปลงสาธิต"
                : i.plotActivityType === "NEW"
                  ? "ทำแปลงสาธิตใหม่"
                  : i.plotActivityType
                    ? i.plotActivityType
                    : "แปลงสาธิต";
            const crop = [i.plotCropCategory, i.plotCropName]
              .filter(Boolean)
              .join(" - ");
            const size = i.plotAreaRai
              ? `${Number(i.plotAreaRai)} ไร่`
              : i.plotTreeCount
                ? `${i.plotTreeCount} ต้น`
                : "";
            const extraFields: Array<{ label: string; value: string }> = [];
            if (i.plotProductName) {
              extraFields.push({ label: "สินค้า", value: i.plotProductName });
            }
            if (size) {
              extraFields.push({ label: "ขนาดแปลง", value: size });
            }
            if (i.growthStage) {
              extraFields.push({
                label: "ระยะการเจริญเติบโต",
                value: i.growthStage,
              });
            }
            if (i.targetCondition) {
              extraFields.push({
                label: "สภาพแปลงเป้าหมาย",
                value: i.targetCondition,
              });
            }

            return {
              title: i.plotOwnerName || i.plotCropName || "แปลงสาธิต",
              subtitle: crop || undefined,
              badge: mode,
              details: i.detail || undefined,
              extraFields: extraFields.length > 0 ? extraFields : undefined,
            };
          })
        : [];
    sections.push({
      typeIndex: 7,
      title: WORK_TYPES[6],
      badge: "แปลงสาธิต",
      items: list,
      rawSummary: t7Line ? t7Line.replace(/^\[.*?\]\s*/, "") : undefined,
    });
  }

  // ── 8. จัดประชุมการเกษตร / ดีลเลอร์ ─────────────────────
  const type8DbItems = items.filter(
    (i) =>
      !isFieldDayItem(i) &&
      i.itemType !== "MARKETING_PRODUCT" &&
      i.itemType !== "SALES_PROMOTION" &&
      (i.itemType === "TYPE_8" ||
        i.meetingTopic ||
        i.meetingTargetProducts ||
        (i.meetingAttendeesCount != null && !i.storeProductName)),
  );
  const t8Line = objectiveLines.find(
    (l) =>
      l.includes("[จัดประชุม") ||
      l.includes("จัดประชุมการเกษตร") ||
      l.includes("ประชุมการเกษตร"),
  );
  if (type8DbItems.length > 0 || t8Line) {
    const list =
      type8DbItems.length > 0
        ? type8DbItems.map((i) => {
            const extraFields: Array<{ label: string; value: string }> = [];
            if (i.meetingTargetProducts) {
              const prodStr = Array.isArray(i.meetingTargetProducts)
                ? i.meetingTargetProducts.join(", ")
                : String(i.meetingTargetProducts);
              extraFields.push({ label: "สินค้าเป้าหมาย", value: prodStr });
            }
            return {
              title: i.meetingTopic || "หัวข้อประชุม",
              badge: i.meetingAttendeesCount
                ? `เป้า ${i.meetingAttendeesCount} คน`
                : undefined,
              details: i.detail || undefined,
              extraFields: extraFields.length > 0 ? extraFields : undefined,
            };
          })
        : [];
    const totalAttendees = type8DbItems.reduce(
      (sum, i) => sum + Number(i.meetingAttendeesCount || 0),
      0,
    );
    const targetCards: Array<{
      label: string;
      value: string;
      highlight?: boolean;
    }> = [];
    if (totalAttendees > 0) {
      targetCards.push({
        label: "เป้าผู้เข้าร่วมรวม",
        value: `${totalAttendees} คน`,
        highlight: true,
      });
    }
    sections.push({
      typeIndex: 8,
      title: WORK_TYPES[7],
      badge: "จัดประชุม",
      items: list,
      rawSummary: t8Line ? t8Line.replace(/^\[.*?\]\s*/, "") : undefined,
      targetCards: targetCards.length > 0 ? targetCards : undefined,
    });
  }

  // ── 9. จัดกิจกรรมส่งเสริมการขายหน้าร้าน ─────────────────
  const type9DbItems = items.filter(
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
  const t9Line = objectiveLines.find(
    (l) =>
      l.includes("[กิจกรรมหน้าร้าน]") ||
      l.includes("จัดกิจกรรมส่งเสริมการขายหน้าร้าน") ||
      l.includes("ส่งเสริมการขายหน้าร้าน"),
  );
  if (type9DbItems.length > 0 || t9Line) {
    const totalStoreAmount = type9DbItems.reduce(
      (sum, i) => sum + Number(i.storeTotalAmount || 0),
      0,
    );
    const list =
      type9DbItems.length > 0
        ? type9DbItems.map((i) => {
            const extraFields: Array<{ label: string; value: string }> = [];
            if (i.storeQuantityCases) {
              extraFields.push({
                label: "จำนวน",
                value: `${i.storeQuantityCases} ลัง`,
              });
            }
            if (i.storePricePerCase) {
              extraFields.push({
                label: "ราคา/ลัง",
                value: `฿${Number(i.storePricePerCase).toLocaleString()}`,
              });
            }
            if (i.targetAttendees) {
              extraFields.push({
                label: "เป้าผู้เข้าร่วม",
                value: `${i.targetAttendees} คน`,
              });
            }
            return {
              title: i.storeProductName || "สินค้าโปรโมชันหน้าร้าน",
              subtitle:
                i.customerName || i.surveyStoreName
                  ? `ร้านค้า: ${i.customerName || i.surveyStoreName}`
                  : undefined,
              amount: i.storeTotalAmount
                ? `ยอดเงิน: ฿${Number(i.storeTotalAmount).toLocaleString()}`
                : undefined,
              details: i.detail || undefined,
              extraFields: extraFields.length > 0 ? extraFields : undefined,
            };
          })
        : [];
    const targetCards: Array<{
      label: string;
      value: string;
      highlight?: boolean;
    }> = [];
    if (totalStoreAmount > 0) {
      targetCards.push({
        label: "เป้ายอดขายรวม",
        value: `฿${totalStoreAmount.toLocaleString()}`,
        highlight: true,
      });
    }
    sections.push({
      typeIndex: 9,
      title: WORK_TYPES[8],
      badge: "กิจกรรมหน้าร้าน",
      items: list,
      rawSummary: t9Line ? t9Line.replace(/^\[.*?\]\s*/, "") : undefined,
      targetCards: targetCards.length > 0 ? targetCards : undefined,
    });
  }

  // ── 10. จัดงาน Field Day ─────────────────────────────────
  const type10DbItems = items.filter(
    (i) => i.itemType === "TYPE_10" || isFieldDayItem(i),
  );
  const t10Line = objectiveLines.find(
    (l) =>
      l.includes("[Field Day]") ||
      l.includes("Field Day") ||
      l.includes("จัดงาน Field Day"),
  );
  if (type10DbItems.length > 0 || t10Line) {
    const list =
      type10DbItems.length > 0
        ? type10DbItems.map((i) => {
            const extraFields: Array<{ label: string; value: string }> = [];
            if (i.plotCropName) {
              extraFields.push({ label: "พืชเป้าหมาย", value: i.plotCropName });
            }
            if (i.plotProductName) {
              extraFields.push({ label: "สินค้าโชว์", value: i.plotProductName });
            }
            if (i.targetAttendees || i.meetingAttendeesCount) {
              extraFields.push({
                label: "เป้าผู้เข้าร่วม",
                value: `${i.targetAttendees || i.meetingAttendeesCount} คน`,
              });
            }
            if (i.targetSales || i.saleTotalPrice) {
              extraFields.push({
                label: "เป้ายอดขาย/ยอดจอง",
                value: `฿${Number(i.targetSales || i.saleTotalPrice).toLocaleString()}`,
              });
            }
            return {
              title: i.customerName || i.plotOwnerName || "งาน Field Day",
              details: i.detail || undefined,
              extraFields: extraFields.length > 0 ? extraFields : undefined,
            };
          })
        : [];
    sections.push({
      typeIndex: 10,
      title: WORK_TYPES[9],
      badge: "Field Day",
      items: list,
      rawSummary: t10Line ? t10Line.replace(/^\[.*?\]\s*/, "") : undefined,
    });
  }

  // ── 11. ตรวจเช็กสต็อกหน้าร้าน ───────────────────────────
  const type11DbItems = items.filter(
    (i) =>
      !isFieldDayItem(i) &&
      (i.itemType === "TYPE_11" ||
        i.targetOpportunity ||
        (i.detail && i.detail.includes("ตรวจเช็กสต็อกหน้าร้าน"))),
  );
  const t11Line = objectiveLines.find(
    (l) =>
      l.includes("[ตรวจเช็กสต็อก") ||
      l.includes("ตรวจเช็กสต็อกหน้าร้าน") ||
      l.includes("เช็กสต็อก"),
  );
  if (type11DbItems.length > 0 || t11Line) {
    const list =
      type11DbItems.length > 0
        ? type11DbItems.map((i) => {
            const extraFields: Array<{ label: string; value: string }> = [];
            if (i.targetOpportunity)
              extraFields.push({
                label: "โอกาสสั่งซื้อ",
                value: i.targetOpportunity,
              });
            return {
              title: i.customerName || "ร้านค้าที่ตรวจเช็ก",
              details: i.detail || undefined,
              extraFields: extraFields.length > 0 ? extraFields : undefined,
            };
          })
        : [];
    sections.push({
      typeIndex: 11,
      title: WORK_TYPES[10],
      badge: "เช็กสต็อก",
      items: list,
      rawSummary: t11Line ? t11Line.replace(/^\[.*?\]\s*/, "") : undefined,
    });
  }

  // ── 12. ทัวร์ ───────────────────────────────────────────
  const type12DbItems = items.filter(
    (i) =>
      i.itemType === "TYPE_12" ||
      (i.detail && i.detail.includes("[ทัวร์")) ||
      (i.visitTopic &&
        (i.visitTopic === "ทัวร์กลาง" || i.visitTopic === "ทัวร์ร้านค้า")),
  );
  const t12Line = objectiveLines.find(
    (l) =>
      l.includes("[ทัวร์]") ||
      l.includes("[ทัวร์กลาง]") ||
      l.includes("[ทัวร์ร้านค้า]") ||
      l.includes("ทัวร์กลาง") ||
      l.includes("ทัวร์ร้านค้า"),
  );
  if (type12DbItems.length > 0 || t12Line) {
    const list =
      type12DbItems.length > 0
        ? type12DbItems.map((i) => {
            const extraFields: Array<{ label: string; value: string }> = [];
            const isStoreTour =
              i.visitTopic === "ทัวร์ร้านค้า" ||
              (i.detail && i.detail.includes("ทัวร์ร้านค้า"));
            const tourTypeLabel = isStoreTour ? "ทัวร์ร้านค้า" : "ทัวร์กลาง";

            extraFields.push({ label: "ประเภททัวร์", value: tourTypeLabel });

            if (i.detail) {
              const sizeMatch = i.detail.match(/ขนาดทัวร์:\s*([^|]+)/);
              if (sizeMatch) {
                extraFields.push({
                  label: "ขนาดทัวร์",
                  value: sizeMatch[1].trim(),
                });
              }
              const countryMatch = i.detail.match(/ประเทศ:\s*([^|]+)/);
              if (countryMatch) {
                extraFields.push({
                  label: "ประเทศ",
                  value: countryMatch[1].trim(),
                });
              }
              const destMatch = i.detail.match(/สถานที่จะไป:\s*([^|]+)/);
              if (destMatch) {
                extraFields.push({
                  label: "สถานที่จะไป",
                  value: destMatch[1].trim(),
                });
              }
            }

            return {
              title:
                isStoreTour
                  ? i.customerName || "ทัวร์ร้านค้า"
                  : `ทัวร์กลาง`,
              details: i.detail ? i.detail.replace(/^\[.*?\]\s*/, "") : undefined,
              extraFields: extraFields.length > 0 ? extraFields : undefined,
            };
          })
        : [];
    sections.push({
      typeIndex: 12,
      title: WORK_TYPES[11] || "ทัวร์",
      badge: "ทัวร์",
      items: list,
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
  const items = (plan.items as any[]) || [];

  // (A) From DB items with MARKETING_PRODUCT type
  const dbMkt = items.filter(
    (i) =>
      i.itemType === "MARKETING_PRODUCT" ||
      i.visitTopic === "MARKETING_PRODUCT",
  );
  if (dbMkt.length > 0) {
    return dbMkt.map((i) => ({
      category: i.plotCropCategory || i.category || "สื่อส่งเสริมการขาย",
      productName:
        i.storeProductName ||
        i.productName ||
        i.customerName ||
        "สื่อส่งเสริมการขาย",
      quantity: Number(i.storeQuantityCases || i.quantityCases || 1),
      unit: i.plotCropName || i.unit || "ชิ้น",
      pricePerUnit: Number(i.storePricePerCase || i.pricePerCase || 0),
      totalAmount: Number(
        i.storeTotalAmount ||
          (i.storeQuantityCases || i.quantityCases || 1) *
            (i.storePricePerCase || i.pricePerCase || 0),
      ),
    }));
  }

  // (B) From description text block
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
  const items = (plan.items as any[]) || [];

  // (A) From DB items with SALES_PROMOTION type
  const dbSp = items.filter(
    (i) =>
      i.itemType === "SALES_PROMOTION" || i.visitTopic === "SALES_PROMOTION",
  );
  if (dbSp.length > 0) {
    return dbSp.map((i) => ({
      budgetType: i.plotCropCategory || i.budgetType || "งบส่งเสริมการขาย",
      detail: i.detail || i.storeProductName || "รายการส่งเสริมการขาย",
      amount: Number(i.collectAmount || i.storeTotalAmount || i.amount || 0),
    }));
  }

  // (B) From description text block
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
  const items = (plan.items as any[]) || [];

  // (A) From DB items with REQUISITION type
  const dbReq = items.filter(
    (i) =>
      i.itemType === "REQUISITION" ||
      i.itemType === "REQUISITION_ITEM" ||
      i.visitTopic === "REQUISITION",
  );
  if (dbReq.length > 0) {
    return dbReq.map((i) => ({
      productName:
        i.productName || i.storeProductName || i.customerName || "รายการเบิก",
      quantity: Number(i.quantity || i.storeQuantityCases || 1),
      unit: i.unit || i.plotCropName || "รายการ",
      detail: i.detail || "",
    }));
  }

  // (B) From description text block
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
