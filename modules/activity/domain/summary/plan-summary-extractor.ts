import { format } from "date-fns";
import { th } from "date-fns/locale";
import type { ActivityPlanWithRelations } from "../../types";
import type { PlanSummaryData } from "./types";

/**
 * Domain Service: Core Plan Summary Extractor
 * Extracts common schedule, location, budget, materials, helpers, and store relations.
 */
export function extractCorePlanSummary(
  p: ActivityPlanWithRelations,
): PlanSummaryData {
  const start = p.startDate ? new Date(p.startDate) : new Date();
  const end = p.endDate ? new Date(p.endDate) : new Date();

  // Marketing Product Items from normalized relation
  const mktProductItems = (p.marketingItems || []).map((item) => ({
    id: item.id,
    productName: item.materialName || "สื่อส่งเสริมการขาย",
    quantityCases: item.quantity || 1,
    pricePerCase: item.unitPrice
      ? Number(item.unitPrice)
      : item.totalAmount
        ? Number(item.totalAmount)
        : 0,
  }));

  // Sales Promotion Items from normalized relation
  const salesPromoItems = (p.promotionItems || []).map((item) => ({
    id: item.id,
    detail: item.detail || "รายการส่งเสริมการขาย",
    amount: item.amount ? Number(item.amount) : 0,
    budgetType: item.budgetType || "งบส่งเสริมการขาย",
  }));

  // Helpers from normalized relation
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

  const t7Plot = ((p as any).type7aTargets?.[0] || (p as any).type7aPlots?.[0] || (p as any).demoPlot) as any;

  return {
    planNo: p.code || "TP-DRAFT",
    title: p.title || "แผนงานกิจกรรม",
    startDateStr: format(start, "d MMMM yyyy", { locale: th }),
    endDateStr: format(end, "d MMMM yyyy", { locale: th }),
    startTimeStr: format(start, "HH:mm"),
    endTimeStr: format(end, "HH:mm"),
    timeStr: `${format(start, "HH:mm")} - ${format(end, "HH:mm")} น.`,
    locationStr: p.location || "ไม่ระบุสถานที่",
    location: p.location || undefined,
    province: p.province || t7Plot?.province || undefined,
    district: p.district || t7Plot?.district || undefined,
    marketingBudget: p.marketingBudgetRequested
      ? Number(p.marketingBudgetRequested)
      : undefined,
    salesPromotionBudget: p.salesPromotionBudgetRequested
      ? Number(p.salesPromotionBudgetRequested)
      : undefined,
    targetSales: (() => {
      // คำนวณเป้ายอดขายรวมเฉพาะ Type 9 (จัดกิจกรรมหน้าร้าน) เท่านั้นตาม Business requirement
      const t9Targets = (p as any).type9Targets;
      if (t9Targets && Array.isArray(t9Targets) && t9Targets.length > 0) {
        const total = t9Targets.reduce((sum: number, t: any) => {
          const directTarget = t.targetSales != null ? Number(t.targetSales) : 0;
          const fromProducts = (t.products || []).reduce(
            (pSum: number, pr: any) =>
              pSum +
              (Number(pr.quantityCases ?? pr.targetQuantity) || 0) *
                (Number(pr.pricePerCase ?? pr.targetUnitPrice) || 0),
            0,
          );
          return sum + (fromProducts > 0 ? fromProducts : directTarget);
        }, 0);
        return total > 0 ? total : undefined;
      }
      return undefined;
    })(),
    isPromotionalMediaSelected: mktProductItems.length > 0,
    marketingProductItems: mktProductItems,
    isSalesPromotionSelected:
      salesPromoItems.length > 0 ||
      (p.salesPromotionBudgetRequested
        ? Number(p.salesPromotionBudgetRequested) > 0
        : false),
    salesPromotionItems: salesPromoItems,
    notes: p.notes || undefined,
    objective: p.objective || undefined,
    helpers: extractedHelpers.length > 0 ? extractedHelpers : undefined,
    helperEmployeeNames: helperNames,
    stores: ((p as any).stores || []).map((s: any) => ({
      storeId: s.storeId,
      storeName: s.storeName,
      workTypeCode: s.workTypeCode,
    })),
  };
}
