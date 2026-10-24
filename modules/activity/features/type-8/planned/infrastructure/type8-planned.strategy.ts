import { Prisma } from "@prisma/client";
import type {
  WorkTypeStrategy,
  PrismaTransaction,
  StrategyValidationResult,
} from "@/modules/activity/types/strategy.interface";
import { encodeType8StoreNotes } from "../../shared/notes";
import { findType8ByPlanId, saveType8ActualSales } from "./type8.repository";

export const type8PlannedStrategy: WorkTypeStrategy = {
  code: "TYPE_8",

  /**
   * Validate Type 8 Plan Data
   */
  async validatePlan(
    planData: any,
    _db: any,
  ): Promise<StrategyValidationResult> {
    const rawStores: any[] =
      planData.type8Stores ||
      (planData.planStores || []).filter(
        (s: any) => s.workTypeCode === "TYPE_8",
      );

    if (rawStores && rawStores.length > 0) {
      for (let i = 0; i < rawStores.length; i++) {
        const s = rawStores[i];
        if (!s.storeId && !s.subDealerStore && !s.storeName) {
          return {
            valid: false,
            error: `รายการประชุมที่ ${i + 1}: กรุณาระบุร้านค้าหรือสถานที่จัดประชุม`,
          };
        }
      }
    }

    return { valid: true };
  },

  /**
   * Save Type 8 Plan targets in ActivityPlanStore & ActivityPlanProduct
   */
  async savePlan(
    tx: PrismaTransaction,
    activityPlanId: string,
    planData: any,
  ): Promise<void> {
    // 1. Delete existing Type 8 stores and products for this plan
    await (tx as any).activityPlanStore.deleteMany({
      where: {
        activityPlanId,
        workTypeCode: "TYPE_8",
      },
    });

    await (tx as any).activityPlanProduct.deleteMany({
      where: {
        activityPlanId,
        OR: [
          { workTypeCode: "TYPE_8" },
          { workTypeCode: "TYPE_8_PROMOTION" },
        ],
      },
    });

    // 2. Extract meetings array
    const meetings: any[] =
      planData.type8Data?.meetings ||
      planData.type8Meetings ||
      planData.type8Items ||
      planData.type8Targets ||
      planData.type8UnplannedItems ||
      [];

    let totalAttendees = 0;

    if (meetings && Array.isArray(meetings) && meetings.length > 0) {
      for (let i = 0; i < meetings.length; i++) {
        const item = meetings[i];
        const attendees = Number(item.attendeesCount || 10);
        totalAttendees += attendees;

        const meetingTarget = item.meetingTarget || "FARMER";
        const farmerChannel = item.farmerChannel || "DEALER";
        const isUnregistered = Boolean(item.isUnregisteredSubdealer);
        const subDealerStore = item.subDealerStore?.trim() || null;

        let storeId: string | null = null;
        let storeName: string | null = null;

        if (meetingTarget === "SUBDEALER") {
          if (isUnregistered) {
            storeId = item.dealerId || null;
            storeName = item.dealerName || null;
          } else {
            storeId = item.subdealerId || null;
            storeName = item.subdealerName || item.storeName || null;
          }
        } else if (meetingTarget === "FARMER" && farmerChannel === "SUBDEALER") {
          if (isUnregistered) {
            storeId = item.dealerId || null;
            storeName = item.dealerName || null;
          } else {
            storeId = item.subdealerId || null;
            storeName = item.subdealerName || item.storeName || null;
          }
        } else {
          storeId = item.dealerId || null;
          storeName = item.dealerName || null;
        }

        // If storeName is missing but storeId exists, resolve from customer table
        if (storeId && !storeName) {
          const cust = await (tx as any).customer.findUnique({
            where: { id: storeId },
            select: { name: true },
          });
          if (cust) {
            storeName = cust.name;
          }
        }

        const promoNotes = (item.promotions || item.promotionProducts || [])
          .map((p: any) => (typeof p === "string" ? p : p.notes?.trim() || ""))
          .filter(Boolean);

        const encodedNotes = encodeType8StoreNotes(item.detail, promoNotes, {
          meetingTarget,
          farmerChannel,
          venueType: item.venueType || "STORE",
          isUnregisteredSubdealer: isUnregistered,
          subdealerId: item.subdealerId || undefined,
          subDealerStore: subDealerStore || undefined,
          dealerId: item.dealerId || undefined,
          dealerName: item.dealerName || undefined,
          attendeesCount: attendees,
        });

        await (tx as any).activityPlanStore.create({
          data: {
            activityPlanId,
            workTypeCode: "TYPE_8",
            visitPurpose: meetingTarget === "FARMER" ? "FARMER" : "STORE",
            storeId: storeId || null,
            storeName: storeName || null,
            subDealerStore: subDealerStore || null,
            remarks: item.topic?.trim() || null,
            notes: encodedNotes,
          },
        });

        // Save target products (up to 5)
        const targetProducts: string[] = item.targetProducts || [];
        const targetProductIds: string[] = item.targetProductIds || [];
        for (let pIdx = 0; pIdx < targetProducts.length; pIdx++) {
          const prodName = targetProducts[pIdx];
          let prodId = targetProductIds[pIdx];
          if (!prodId || prodId === prodName) {
            const dbProd = await (tx as any).product.findFirst({
              where: { OR: [{ id: prodName }, { name: prodName }] },
              select: { id: true, name: true },
            });
            if (dbProd) {
              prodId = dbProd.id;
            }
          }
          if (prodId) {
            await (tx as any).activityPlanProduct.create({
              data: {
                activityPlanId,
                workTypeCode: "TYPE_8",
                storeId: storeId || null,
                productId: prodId,
                productName: prodName,
              },
            });
          }
        }

        // Save promotional products (if product catalog attached)
        const promoItems = item.promotions || item.promotionProducts || [];
        for (const promo of promoItems) {
          if (typeof promo === "object" && promo.productId) {
            await (tx as any).activityPlanProduct.create({
              data: {
                activityPlanId,
                workTypeCode: "TYPE_8_PROMOTION",
                storeId: storeId || null,
                productId: promo.productId,
                productName: promo.productName || null,
                targetQuantity: promo.quantityCases ? Number(promo.quantityCases) : 1,
                unitPrice: promo.pricePerCase
                  ? new Prisma.Decimal(promo.pricePerCase)
                  : new Prisma.Decimal(0),
                notes: promo.notes || null,
              },
            });
          }
        }
      }
    } else {
      // Fallback: If planStores was passed directly
      const rawStores: any[] =
        planData.planStores || planData.stores || [];
      const t8Stores = rawStores.filter((s: any) => s.workTypeCode === "TYPE_8");

      for (const s of t8Stores) {
        await (tx as any).activityPlanStore.create({
          data: {
            activityPlanId,
            workTypeCode: "TYPE_8",
            visitPurpose: s.visitPurpose || "FARMER",
            storeId: s.storeId || null,
            storeName: s.storeName || null,
            subDealerStore: s.subDealerStore || null,
            remarks: s.remarks || null,
            notes: s.notes || null,
          },
        });
      }

      const rawProducts: any[] =
        planData.planProducts || planData.products || [];
      const t8Products = rawProducts.filter(
        (p: any) =>
          p.workTypeCode === "TYPE_8" || p.workTypeCode === "TYPE_8_PROMOTION",
      );

      for (const p of t8Products) {
        if (p.productId) {
          await (tx as any).activityPlanProduct.create({
            data: {
              activityPlanId,
              workTypeCode: p.workTypeCode || "TYPE_8",
              storeId: p.storeId || null,
              productId: p.productId,
              productName: p.productName || null,
              targetQuantity: p.targetQuantity != null ? Number(p.targetQuantity) : null,
              unitPrice: p.unitPrice != null ? new Prisma.Decimal(p.unitPrice) : null,
              notes: p.notes || null,
            },
          });
        }
      }
    }

    // 3. Update targetAttendeesCount in ActivityPlan
    const attendeesToUpdate =
      totalAttendees > 0
        ? totalAttendees
        : planData.targetAttendeesCount != null
          ? Number(planData.targetAttendeesCount)
          : null;

    if (attendeesToUpdate != null) {
      await (tx as any).activityPlan.update({
        where: { id: activityPlanId },
        data: {
          targetAttendeesCount: attendeesToUpdate,
        },
      });
    }
  },

  /**
   * Save Type 8 Actual outcome data
   */
  async saveActual(
    tx: PrismaTransaction,
    planIdOrResultId: string,
    actualData: any,
  ): Promise<void> {
    const resultId = actualData?.activityResultId || planIdOrResultId;
    if (
      actualData.productSalesDetails &&
      Array.isArray(actualData.productSalesDetails)
    ) {
      await saveType8ActualSales(tx, resultId, actualData.productSalesDetails);
    }
  },

  /**
   * Load Type 8 Plan Data
   */
  async loadPlan(
    db: any,
    activityPlanId: string,
  ): Promise<any> {
    return findType8ByPlanId(activityPlanId, db);
  },
};

// Backward-compatible alias
export const type8Strategy = type8PlannedStrategy;
