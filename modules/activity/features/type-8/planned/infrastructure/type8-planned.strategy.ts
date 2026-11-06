import { Prisma } from "@prisma/client";
import type {
  WorkTypeStrategy,
  PrismaTransaction,
  StrategyValidationResult,
} from "@/modules/activity/types/strategy.interface";
import type { ProductSaleDetail } from "../../shared/types";
import { encodeType8StoreNotes } from "../../shared/notes";
import { findType8ByPlanId } from "./type8.repository";

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
      planData.type8Targets ||
      (planData.planStores || []).filter(
        (s: any) => s.workTypeCode === "TYPE_8",
      );

    if (rawStores && rawStores.length > 0) {
      for (let i = 0; i < rawStores.length; i++) {
        const s = rawStores[i];
        if (!s.storeId && !s.subDealerStore && !s.storeName && !s.dealerId && !s.dealerName && !s.location) {
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
   * Save Type 8 Plan targets in Dedicated Tables:
   * 1. activity_type_8_targets
   * 2. activity_type_8_products
   * And mirror to legacy tables for backward compatibility.
   */
  async savePlan(
    tx: PrismaTransaction,
    activityPlanId: string,
    planData: any,
  ): Promise<void> {
    // 1. Clean previous dedicated records for this plan
    // Cascades delete activity_type_8_products and activity_type_8_result
    if ((tx as any).activityPlanType8Target?.deleteMany) {
      await (tx as any).activityPlanType8Target.deleteMany({
        where: { activityPlanId },
      });
    }

    if ((tx as any).activityPlanType8Product?.deleteMany) {
      await (tx as any).activityPlanType8Product.deleteMany({
        where: { activityPlanId },
      });
    }

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
        const attendees = Number(item.attendeesCount || item.expectedAttendees || 0);
        totalAttendees += attendees;

        const meetingTarget = item.meetingTarget || "FARMER";
        const farmerChannel = item.farmerChannel || (meetingTarget === "FARMER" ? "DEALER" : null);
        const isUnregistered = Boolean(item.isUnregisteredSubdealer || item.isNewSubdealer);
        const subDealerStore = (item.subDealerStore || item.subdealerName || "").trim() || null;

        let storeId: string | null = null;
        let storeName: string | null = null;
        let dealerId: string | null = item.dealerId || item.customerId || null;
        let dealerName: string | null = item.dealerName || item.customerName || null;
        let subdealerId: string | null = item.subdealerId || null;

        if (meetingTarget === "SUBDEALER") {
          if (isUnregistered) {
            storeId = dealerId;
            storeName = dealerName;
          } else {
            storeId = subdealerId || dealerId;
            storeName = subDealerStore || dealerName;
          }
        } else if (meetingTarget === "FARMER" && farmerChannel === "SUBDEALER") {
          if (isUnregistered) {
            storeId = dealerId;
            storeName = dealerName;
          } else {
            storeId = subdealerId || dealerId;
            storeName = subDealerStore || dealerName;
          }
        } else {
          storeId = dealerId;
          storeName = dealerName;
        }

        // If dealerName is missing but dealerId exists, resolve from customer table
        if (dealerId && !dealerName) {
          const cust = await (tx as any).customer.findUnique({
            where: { id: dealerId },
            select: { name: true },
          });
          if (cust) {
            dealerName = cust.name;
            if (!storeName) storeName = cust.name;
          }
        }

        const topic = item.topic?.trim() || "จัดประชุม";
        const venueType = item.venueType || "STORE";
        const location = item.location?.trim() || null;
        const meetingDate = item.meetingDate ? new Date(item.meetingDate) : null;
        const meetingTime = item.meetingTime || null;
        const detail = item.detail || item.notes || null;

        // 2.1 Create Dedicated Target in activity_type_8_targets
        const target = (tx as any).activityPlanType8Target?.create
          ? await (tx as any).activityPlanType8Target.create({
              data: {
                activityPlanId,
                meetingTarget,
                farmerChannel,
                dealerId,
                dealerName,
                subdealerId,
                subDealerStore,
                isUnregisteredSubdealer: isUnregistered,
                topic,
                venueType,
                location,
                meetingDate,
                meetingTime,
                targetAttendeesCount: attendees,
                detail,
              },
            })
          : null;

        // 2.2 Create Planned Target Products (up to 5 items)
        const targetProducts: string[] = item.targetProducts || [];
        const targetProductIds: string[] = item.targetProductIds || [];
        for (let pIdx = 0; pIdx < targetProducts.length; pIdx++) {
          const prodName = targetProducts[pIdx];
          let prodId = targetProductIds[pIdx];
          if (!prodId || prodId === prodName) {
            const dbProd = (tx as any).product?.findFirst
              ? await (tx as any).product.findFirst({
                  where: { OR: [{ id: prodName }, { name: prodName }] },
                  select: { id: true, name: true },
                })
              : null;
            if (dbProd) {
              prodId = dbProd.id;
            }
          }

          if (target?.id && (tx as any).activityPlanType8Product?.create) {
            await (tx as any).activityPlanType8Product.create({
              data: {
                activityPlanId,
                targetId: target.id,
                productId: prodId || null,
                productName: prodName,
                productRole: "TARGET",
              },
            });
          }
        }

        // 2.3 Create Promotional Products
        const promoItems = item.promotions || item.promotionProducts || [];
        for (const promo of promoItems) {
          if (typeof promo === "object") {
            const promoQty = promo.quantityCases ? new Prisma.Decimal(promo.quantityCases) : (promo.quantity ? new Prisma.Decimal(promo.quantity) : new Prisma.Decimal(1));
            const promoPrice = promo.pricePerCase ? new Prisma.Decimal(promo.pricePerCase) : (promo.unitPrice ? new Prisma.Decimal(promo.unitPrice) : new Prisma.Decimal(0));
            const promoTotal = promo.totalAmount ? new Prisma.Decimal(promo.totalAmount) : null;
            const promoNotes = promo.notes || null;

            if (target?.id && (tx as any).activityPlanType8Product?.create) {
              await (tx as any).activityPlanType8Product.create({
                data: {
                  activityPlanId,
                  targetId: target.id,
                  productId: promo.productId || null,
                  productName: promo.productName || null,
                  productRole: "PROMOTION",
                  targetQuantity: promoQty,
                  targetUnitPrice: promoPrice,
                  targetAmount: promoTotal,
                  promotionNotes: promoNotes,
                },
              });
            }
          }
        }

        // 2.4 If Product Sales Details were passed (e.g. Unplanned 2-in-1 form)
        const salesDetails: ProductSaleDetail[] = item.productSalesDetails || [];
        for (const sale of salesDetails) {
          if (!sale.productName && !sale.productId) continue;

          // Check if matches an existing TARGET product in this target
          const existingTargetProduct = target?.id && (tx as any).activityPlanType8Product?.findFirst
            ? await (tx as any).activityPlanType8Product.findFirst({
                where: {
                  targetId: target.id,
                  productRole: "TARGET",
                  OR: [
                    sale.productId ? { productId: sale.productId } : undefined,
                    sale.productName ? { productName: sale.productName } : undefined,
                  ].filter(Boolean) as any,
                },
              })
            : null;

          if (existingTargetProduct && (tx as any).activityPlanType8Product?.update) {
            await (tx as any).activityPlanType8Product.update({
              where: { id: existingTargetProduct.id },
              data: {
                actualQuantity: sale.actualQty ? new Prisma.Decimal(sale.actualQty) : null,
                actualUnitPrice: sale.unitPrice ? new Prisma.Decimal(sale.unitPrice) : null,
                actualTotal: sale.actualSales ? new Prisma.Decimal(sale.actualSales) : null,
                actualNotes: sale.notes || null,
              },
            });
          } else if (target?.id && (tx as any).activityPlanType8Product?.create) {
            await (tx as any).activityPlanType8Product.create({
              data: {
                activityPlanId,
                targetId: target.id,
                productId: sale.productId || null,
                productName: sale.productName || null,
                productRole: "ADDITIONAL_SALE",
                actualQuantity: sale.actualQty ? new Prisma.Decimal(sale.actualQty) : null,
                actualUnitPrice: sale.unitPrice ? new Prisma.Decimal(sale.unitPrice) : null,
                actualTotal: sale.actualSales ? new Prisma.Decimal(sale.actualSales) : null,
                actualNotes: sale.notes || null,
              },
            });
          }
        }

        // 2.5 If Actual Result Outcome was passed per meeting item (e.g. Unplanned 2-in-1)
        if (item.actualAttendees != null || item.feedbackQnA) {
          await (tx as any).activityResultType8.upsert({
            where: { targetId: target.id },
            create: {
              activityPlanId,
              targetId: target.id,
              actualAttendeesCount: item.actualAttendees != null ? Number(item.actualAttendees) : 0,
              feedbackQnA: item.feedbackQnA || null,
            },
            update: {
              actualAttendeesCount: item.actualAttendees != null ? Number(item.actualAttendees) : 0,
              feedbackQnA: item.feedbackQnA || null,
            },
          });
        }
      }
    } else {
      // Fallback: If legacy planStores was passed directly
      const rawStores: any[] = planData.planStores || planData.stores || [];
      const t8Stores = rawStores.filter((s: any) => s.workTypeCode === "TYPE_8");

      for (const s of t8Stores) {
        const target = await (tx as any).activityPlanType8Target.create({
          data: {
            activityPlanId,
            meetingTarget: s.visitPurpose || "FARMER",
            dealerId: s.storeId || null,
            dealerName: s.storeName || null,
            subDealerStore: s.subDealerStore || null,
            topic: s.remarks || "จัดประชุม",
            venueType: "STORE",
            detail: s.notes || null,
          },
        });
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
   * Save Type 8 Actual outcome data into:
   * 1. activity_type_8_result
   * 2. activity_type_8_products (updating target actual or adding ADDITIONAL_SALE)
   * 3. activity_results (central)
   * 4. activity_result_sale_items (legacy mirror)
   */
  async saveActual(
    tx: PrismaTransaction,
    planIdOrResultId: string,
    actualData: any,
  ): Promise<void> {
    if (!actualData) return;

    // Resolve activityPlanId and activityResultId
    let activityPlanId = planIdOrResultId;
    let activityResultId: string | null = actualData?.activityResultId || null;

    const maybeResult = await (tx as any).activityResult.findUnique({
      where: { id: planIdOrResultId },
      select: { id: true, activityPlanId: true },
    });

    if (maybeResult) {
      activityResultId = maybeResult.id;
      activityPlanId = maybeResult.activityPlanId;
    } else if (!activityResultId) {
      const existingResult = await (tx as any).activityResult.findFirst({
        where: { activityPlanId },
        select: { id: true },
      });
      if (existingResult) {
        activityResultId = existingResult.id;
      }
    }

    const t8Data = actualData?.type8Actual || actualData || {};
    const actualAttendees = t8Data.actualAttendees ?? t8Data.t8ActualAttendees;
    const feedbackQnA = t8Data.feedbackQnA ?? t8Data.t8FeedbackQnA ?? null;
    const salesDetails: ProductSaleDetail[] =
      t8Data.productSalesDetails ?? t8Data.t8ProductSalesDetails ?? actualData.productSalesDetails ?? [];

    // Find targets for this plan
    const targets = await (tx as any).activityPlanType8Target.findMany({
      where: { activityPlanId },
      orderBy: { createdAt: "asc" },
    });

    if (targets.length > 0) {
      const primaryTarget = targets[0];

      // Upsert into activity_type_8_result
      if (actualAttendees != null || feedbackQnA != null) {
        await (tx as any).activityResultType8.upsert({
          where: { targetId: primaryTarget.id },
          create: {
            activityPlanId,
            targetId: primaryTarget.id,
            actualAttendeesCount: actualAttendees != null ? Number(actualAttendees) : 0,
            feedbackQnA: feedbackQnA,
          },
          update: {
            actualAttendeesCount: actualAttendees != null ? Number(actualAttendees) : 0,
            feedbackQnA: feedbackQnA,
          },
        });
      }

      // Save/Update Product Sales in activity_type_8_products
      if (Array.isArray(salesDetails) && salesDetails.length > 0) {
        for (const sale of salesDetails) {
          if (!sale.productName && !sale.productId) continue;

          const actualQtyDec =
            sale.actualQty != null && sale.actualQty !== "" && !isNaN(Number(sale.actualQty))
              ? new Prisma.Decimal(sale.actualQty)
              : null;
          const unitPriceDec =
            sale.unitPrice != null && !isNaN(Number(sale.unitPrice))
              ? new Prisma.Decimal(sale.unitPrice)
              : null;
          const actualTotalDec =
            sale.actualSales != null && sale.actualSales !== "" && !isNaN(Number(sale.actualSales))
              ? new Prisma.Decimal(sale.actualSales)
              : actualQtyDec && unitPriceDec
                ? actualQtyDec.mul(unitPriceDec)
                : null;

          // Check if already exists in this target as TARGET product
          const existingTargetProduct = await (tx as any).activityPlanType8Product.findFirst({
            where: {
              targetId: primaryTarget.id,
              productRole: "TARGET",
              OR: [
                sale.productId ? { productId: sale.productId } : undefined,
                sale.productName ? { productName: sale.productName } : undefined,
              ].filter(Boolean) as any,
            },
          });

          if (existingTargetProduct) {
            await (tx as any).activityPlanType8Product.update({
              where: { id: existingTargetProduct.id },
              data: {
                actualQuantity: actualQtyDec,
                actualUnitPrice: unitPriceDec,
                actualTotal: actualTotalDec,
                actualNotes: sale.notes || null,
              },
            });
          } else {
            // Check if existing ADDITIONAL_SALE product already recorded
            const existingAdditional = await (tx as any).activityPlanType8Product.findFirst({
              where: {
                targetId: primaryTarget.id,
                productRole: "ADDITIONAL_SALE",
                OR: [
                  sale.productId ? { productId: sale.productId } : undefined,
                  sale.productName ? { productName: sale.productName } : undefined,
                ].filter(Boolean) as any,
              },
            });

            if (existingAdditional) {
              await (tx as any).activityPlanType8Product.update({
                where: { id: existingAdditional.id },
                data: {
                  actualQuantity: actualQtyDec,
                  actualUnitPrice: unitPriceDec,
                  actualTotal: actualTotalDec,
                  actualNotes: sale.notes || null,
                },
              });
            } else {
              await (tx as any).activityPlanType8Product.create({
                data: {
                  activityPlanId,
                  targetId: primaryTarget.id,
                  productId: sale.productId || null,
                  productName: sale.productName || null,
                  productRole: "ADDITIONAL_SALE",
                  actualQuantity: actualQtyDec,
                  actualUnitPrice: unitPriceDec,
                  actualTotal: actualTotalDec,
                  actualNotes: sale.notes || null,
                },
              });
            }
          }
        }
      }
    }

    // Mirror to central ActivityResult
    if (activityResultId) {
      if (actualAttendees != null) {
        await (tx as any).activityResult.update({
          where: { id: activityResultId },
          data: {
            actualAttendeesCount: Number(actualAttendees),
          },
        });
      }
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

  /**
   * Load Type 8 Actual outcome data from dedicated tables
   */
  async loadActual(
    tx: PrismaTransaction,
    activityPlanId: string,
  ): Promise<any | null> {
    const [targets, products, results] = await Promise.all([
      (tx as any).activityPlanType8Target.findMany({
        where: { activityPlanId },
        include: { dealer: true, subdealer: true },
        orderBy: { createdAt: "asc" },
      }),
      (tx as any).activityPlanType8Product.findMany({
        where: { activityPlanId },
        include: { product: true },
        orderBy: { createdAt: "asc" },
      }),
      (tx as any).activityResultType8.findMany({
        where: { activityPlanId },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    if ((!targets || targets.length === 0) && (!results || results.length === 0)) {
      return null;
    }

    const firstResult = results[0];
    const saleResults = products
      .filter((p: any) => p.actualQuantity != null || p.productRole === "ADDITIONAL_SALE")
      .map((p: any) => ({
        id: p.id,
        productId: p.productId,
        productName: p.productName || p.product?.name || "",
        actualQty: p.actualQuantity != null ? String(p.actualQuantity) : "",
        actualSales: p.actualTotal != null ? String(p.actualTotal) : "",
        unitPrice: p.actualUnitPrice != null ? Number(p.actualUnitPrice) : undefined,
        notes: p.actualNotes || "",
        isAdditional: p.productRole === "ADDITIONAL_SALE",
      }));

    return {
      t8ActualAttendees: firstResult?.actualAttendeesCount != null ? String(firstResult.actualAttendeesCount) : "",
      t8FeedbackQnA: firstResult?.feedbackQnA || "",
      t8ProductSalesDetails: saleResults,
      targets,
      products,
      results,
    };
  },
};

// Backward-compatible alias
export const type8Strategy = type8PlannedStrategy;
