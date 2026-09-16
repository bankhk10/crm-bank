/**
 * Application Layer: Normalized Plan Input Mapper
 *
 * Maps incoming raw/form payloads into strictly normalized data structures
 * ready for repository persistence.
 *
 * Guarantees:
 * - NO ActivityPlanItem is ever generated
 * - Store arrays are 1-row-per-store (even for TYPE_11)
 * - Product arrays are typed and normalized
 * - Marketing and promotion items are normalized
 * - Pure data transformation with customer/product lookup resolver hooks
 */

import { z } from "zod";
import { activityPlanSchema, type ActivityPlanFormValues } from "./validations";
import {
  calculateMarketingBudget,
  calculatePromotionBudget,
  calculateTotalBudget,
  isPriceOverridden,
} from "../domain/budget-calculator";

export interface NormalizedPlanData {
  title: string;
  startDate: Date;
  endDate: Date;
  activityTypeId: string;
  workTypeCodes: string[];
  location: string | null;
  province: string | null;
  district: string | null;
  objective: string;
  description: string | null;
  notes: string | null;
  targetAttendeesCount: number | null;
  targetBookingSales: number | null;
  demoPlotId: string | null;
  salesPromotionBudgetRequested: number | null;
  marketingBudgetRequested: number | null;
  totalBudgetRequested: number;
  planStores: Array<{
    workTypeCode: string;
    visitPurpose?: "FARMER" | "STORE" | null;
    storeId?: string | null;
    storeName?: string | null;
    province?: string | null;
    isUnregisteredFarmer?: boolean;
    unregisteredFarmerName?: string | null;
    unregisteredFarmerPhone?: string | null;
    targetAmount?: number | null;
    subDealerStore?: string | null;
    remarks?: string | null;
    notes?: string | null;
  }>;
  planProducts: Array<{
    workTypeCode: string;
    storeId?: string | null;
    productId: string;
    productName?: string | null;
    masterPrice?: number | null;
    unitPrice?: number | null;
    isPriceOverridden: boolean;
    targetQuantity?: number | null;
    targetAmount?: number | null;
    notes?: string | null;
  }>;
  marketingItems: Array<{
    category: string;
    materialName: string;
    unit?: string | null;
    unitPrice: number;
    quantity: number;
    totalAmount: number;
  }>;
  promotionItems: Array<{
    budgetType: string;
    detail: string;
    amount: number;
  }>;
  tourData: {
    tourType: "CENTRAL" | "STORE";
    tourSize?: "SMALL" | "LARGE" | null;
    country?: string | null;
    storeId?: string | null;
    destination?: string | null;
  } | null;
  demoPlotData?: {
    id?: string | null;
    name: string;
    customerId?: string | null;
    ownerName: string;
    cropCategory: string;
    cropName: string;
    customCropName?: string | null;
    areaRai?: number | null;
    treeCount?: number | null;
    location?: string | null;
    province?: string | null;
    district?: string | null;
    chemicalGroupId?: string | null;
    objective?: string | null;
  } | null;
  helperEmployeeIds: string[];
}

export interface LookupResolvers {
  findCustomerIdByName?: (name: string) => string | undefined;
  findProductIdByName?: (
    name: string,
  ) => { id: string; price?: number | null } | undefined;
}

/**
 * Normalizes input payload into strictly typed target structure
 */
export function normalizePlanInput(
  rawInput: ActivityPlanFormValues,
  resolvers?: LookupResolvers,
): NormalizedPlanData {
  const stores: NormalizedPlanData["planStores"] = (
    rawInput.planStores || []
  ).map((s) => ({
    ...s,
    visitPurpose: s.visitPurpose ?? null,
    province: s.province ?? null,
    isUnregisteredFarmer: Boolean(s.isUnregisteredFarmer),
    unregisteredFarmerName: s.unregisteredFarmerName ?? null,
    unregisteredFarmerPhone: s.unregisteredFarmerPhone ?? null,
    storeId: s.isUnregisteredFarmer ? null : (s.storeId ?? null),
  }));
  const products: NormalizedPlanData["planProducts"] = (
    rawInput.planProducts || []
  ).map((p) => ({
    ...p,
    isPriceOverridden: p.isPriceOverridden ?? false,
  }));
  const marketing: NormalizedPlanData["marketingItems"] = (
    rawInput.marketingItems || []
  ).map((m) => ({
    ...m,
    unitPrice: m.unitPrice ?? 0,
    quantity: m.quantity ?? 1,
    totalAmount: m.totalAmount ?? 0,
  }));
  const promotion: NormalizedPlanData["promotionItems"] = (
    rawInput.promotionItems || []
  ).map((p) => ({
    ...p,
    amount: p.amount ?? 0,
  }));

  let targetAttendees: number | null = rawInput.targetAttendeesCount ?? null;
  let targetBooking: number | null = rawInput.targetBookingSales ?? null;
  let demoPlot: string | null = rawInput.demoPlotId ?? null;

  // Process legacy/form items array if provided by current UI form
  if (Array.isArray(rawInput.items) && rawInput.items.length > 0) {
    for (const item of rawInput.items) {
      const wtCode = String(item.workTypeCode || item.workType || "");

      // Extract Attendees & Booking Sales (TYPE_8, TYPE_10)
      if (
        item.meetingAttendeesCount != null ||
        item.targetAttendees != null ||
        item.attendeesCount != null
      ) {
        targetAttendees =
          Number(
            item.meetingAttendeesCount ??
              item.targetAttendees ??
              item.attendeesCount,
          ) || targetAttendees;
      }
      if (item.bookingSales != null) {
        targetBooking = Number(item.bookingSales) || targetBooking;
      }
      if (item.existingPlotId || item.demoPlotId) {
        demoPlot = String(item.existingPlotId || item.demoPlotId);
      }

      // Extract Store relations
      const custName =
        item.customerName || item.storeName || item.surveyStoreName;
      if (
        custName &&
        typeof custName === "string" &&
        resolvers?.findCustomerIdByName
      ) {
        // Handle comma-separated stores (e.g. TYPE_11)
        const nameList = custName
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        for (const singleName of nameList) {
          const matchedStoreId = resolvers.findCustomerIdByName(singleName);
          if (
            matchedStoreId &&
            !stores.some(
              (s) => s.storeId === matchedStoreId && s.workTypeCode === wtCode,
            )
          ) {
            stores.push({
              workTypeCode: wtCode || "TYPE_1",
              storeId: matchedStoreId,
              storeName: singleName,
              targetAmount:
                item.collectAmount != null ? Number(item.collectAmount) : null,
              subDealerStore: item.subDealerStore || null,
              remarks: item.visitTopic || item.topic || item.issueType || null,
              notes: item.detail || null,
            });
          }
        }
      }

      // Extract Product relations
      const prodName =
        item.saleProductName ||
        item.productName ||
        item.followupProductName ||
        item.surveyCompetitorProduct;
      if (
        prodName &&
        typeof prodName === "string" &&
        resolvers?.findProductIdByName
      ) {
        const matchedProd = resolvers.findProductIdByName(prodName);
        if (
          matchedProd &&
          !products.some(
            (p) => p.productId === matchedProd.id && p.workTypeCode === wtCode,
          )
        ) {
          const qty =
            item.saleQuantity != null
              ? Number(item.saleQuantity)
              : item.quantity != null
                ? Number(item.quantity)
                : null;
          const uPrice =
            item.saleUnitPrice != null
              ? Number(item.saleUnitPrice)
              : item.unitPrice != null
                ? Number(item.unitPrice)
                : null;
          const tAmount =
            item.saleTotalPrice != null
              ? Number(item.saleTotalPrice)
              : qty != null && uPrice != null
                ? qty * uPrice
                : null;
          const mPrice = matchedProd.price ?? null;
          const overridden =
            uPrice != null ? isPriceOverridden(uPrice, mPrice) : false;

          products.push({
            workTypeCode: wtCode || "TYPE_3",
            productId: matchedProd.id,
            productName: prodName,
            masterPrice: mPrice,
            unitPrice: uPrice,
            isPriceOverridden: overridden,
            targetQuantity: qty,
            targetAmount: tAmount,
            notes: item.detail || item.notes || null,
          });
        }
      }

      // Extract marketing items from items compatibility
      if (item.materialName || item.category) {
        const qty = Number(item.quantity || item.quantityCases || 1);
        const price = Number(item.unitPrice || item.pricePerCase || 0);
        marketing.push({
          category: String(item.category || "สื่อทั่วไป"),
          materialName: String(
            item.materialName || item.productName || "สื่อส่งเสริมการขาย",
          ),
          unit: item.unit ? String(item.unit) : null,
          unitPrice: price,
          quantity: qty,
          totalAmount: qty * price,
        });
      }

      // Extract promotion items from items compatibility
      if (item.budgetType || (item.detail && item.amount != null)) {
        promotion.push({
          budgetType: String(item.budgetType || "MARKETING"),
          detail: String(item.detail || "งบส่งเสริมการขาย"),
          amount: Number(item.amount || 0),
        });
      }
    }
  }

  // Calculate budgets
  const marketingBudget = calculateMarketingBudget(marketing);
  const promotionBudget = calculatePromotionBudget(promotion);
  const totalBudget = calculateTotalBudget(
    rawInput.marketingBudgetRequested ?? marketingBudget,
    rawInput.salesPromotionBudgetRequested ?? promotionBudget,
  );

  return {
    title: rawInput.title,
    startDate: rawInput.startDate,
    endDate: rawInput.endDate,
    activityTypeId: rawInput.activityTypeId,
    workTypeCodes: rawInput.workTypeCodes || [],
    location: rawInput.location || null,
    province: rawInput.province || null,
    district: rawInput.district || null,
    objective: rawInput.objective || "",
    description: rawInput.description || null,
    notes: rawInput.notes || null,
    targetAttendeesCount: targetAttendees,
    targetBookingSales: targetBooking,
    demoPlotId: demoPlot,
    salesPromotionBudgetRequested:
      rawInput.salesPromotionBudgetRequested ??
      (promotionBudget > 0 ? promotionBudget : null),
    marketingBudgetRequested:
      rawInput.marketingBudgetRequested ??
      (marketingBudget > 0 ? marketingBudget : null),
    totalBudgetRequested: totalBudget,
    planStores: stores,
    planProducts: products,
    marketingItems: marketing,
    promotionItems: promotion,
    tourData: rawInput.tourData || null,
    demoPlotData: rawInput.demoPlotData || null,
    helperEmployeeIds: rawInput.helperEmployeeIds || [],
  };
}
