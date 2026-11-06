import { Prisma } from "@prisma/client";
import type {
  PrismaTransaction,
  StrategyValidationResult,
  WorkTypeStrategy,
} from "@/modules/activity/types/strategy.interface";

/**
 * Type 3 Strategy: เสนอขายสินค้า (Product Sales Proposal)
 * Handles validation, persistence into dedicated tables (ActivityPlanType3Target & ActivityPlanType3Product)
 * as well as generic relation tables (ActivityPlanStore, ActivityPlanProduct, ActivityResultSaleItem).
 */
export const type3PlannedStrategy: WorkTypeStrategy = {
  code: "TYPE_3",

  /**
   * Validate business rules for Type 3 before saving Plan
   */
  async validatePlan(planData: any, db: any): Promise<StrategyValidationResult> {
    const rawStores: any[] = planData.planStores || planData.stores || [];
    const rawProducts: any[] = planData.planProducts || planData.products || [];
    const t3Items: any[] = planData.type3Items || [];

    const t3Stores = rawStores.filter(
      (s) =>
        !s.workTypeCode ||
        s.workTypeCode === "TYPE_3" ||
        s.workTypeCode === "เสนอขายสินค้า",
    );
    const t3Products = rawProducts.filter(
      (p) =>
        !p.workTypeCode ||
        p.workTypeCode === "TYPE_3" ||
        p.workTypeCode === "เสนอขายสินค้า",
    );

    if (t3Stores.length === 0 && t3Products.length === 0 && t3Items.length === 0) {
      return {
        valid: false,
        error: "กรุณาระบุร้านค้าเป้าหมายและรายการสินค้าที่เสนอขาย (Type 3)",
      };
    }

    // Check store existence if storeId is provided
    for (const s of t3Stores) {
      if (s.storeId) {
        const customer = await db.customer.findUnique({
          where: { id: s.storeId },
          select: { id: true, customerType: true },
        });
        if (!customer) {
          return { valid: false, error: "ไม่พบข้อมูลร้านค้าในระบบ" };
        }
      }
    }

    return { valid: true };
  },

  /**
   * Save Type 3 Plan data (stores & products) inside an atomic transaction
   */
  async savePlan(
    tx: PrismaTransaction,
    activityPlanId: string,
    planData: any,
  ): Promise<void> {
    const rawTargets: any[] = planData.type3Targets || planData.type3Items || [];
    const rawStores: any[] = planData.planStores || planData.stores || [];
    const rawProducts: any[] = planData.planProducts || planData.products || [];

    const t3Stores = rawStores.filter(
      (s) =>
        !s.workTypeCode ||
        s.workTypeCode === "TYPE_3" ||
        s.workTypeCode === "เสนอขายสินค้า",
    );
    const t3Products = rawProducts.filter(
      (p) =>
        !p.workTypeCode ||
        p.workTypeCode === "TYPE_3" ||
        p.workTypeCode === "เสนอขายสินค้า",
    );

    // 1. Clean up existing dedicated tables
    await (tx as any).activityPlanType3Product.deleteMany({
      where: { activityPlanId },
    });

    await (tx as any).activityPlanType3Target.deleteMany({
      where: { activityPlanId },
    });

    // 2. Save into Dedicated Tables
    if (rawTargets.length > 0) {
      for (const t of rawTargets) {
        const isSubDealer = Boolean(t.isSubDealer);
        const isUnregistered = isSubDealer ? Boolean(t.isUnregisteredSubdealer) : false;
        const subdealerId = isSubDealer && !isUnregistered ? (t.subdealerId || null) : null;
        const subDealerStore = isSubDealer ? (t.subDealerStore || null) : null;

        const targetRecord = await (tx as any).activityPlanType3Target.create({
          data: {
            activityPlanId,
            storeId: t.storeId || null,
            subdealerId,
            isSubDealer,
            isUnregisteredSubdealer: isUnregistered,
            subDealerStore,
            notes: t.detail || t.notes || null,
          },
        });

        const targetProducts = Array.isArray(t.products)
          ? t.products
          : t.productId
            ? [
                {
                  productId: t.productId,
                  quantity: t.quantity || 1,
                  unitPrice: t.unitPrice || 0,
                  price: t.price || 0,
                  notes: t.notes || null,
                },
              ]
            : [];

        const validProducts = targetProducts.filter(
          (p: any) => p && (p.productId || p.productName),
        );

        if (validProducts.length > 0) {
          await (tx as any).activityPlanType3Product.createMany({
            data: validProducts.map((p: any) => {
              const qty = p.quantity != null ? Number(p.quantity) : 1;
              const unitPrice =
                p.unitPrice != null
                  ? new Prisma.Decimal(p.unitPrice)
                  : p.price != null
                    ? new Prisma.Decimal(p.price)
                    : null;
              const targetAmount =
                p.price != null
                  ? new Prisma.Decimal(p.price)
                  : unitPrice != null
                    ? unitPrice.mul(qty)
                    : null;

              return {
                targetId: targetRecord.id,
                activityPlanId,
                productId: p.productId,
                targetQuantity: qty,
                unitPrice,
                targetAmount,
                notes: p.notes || null,
              };
            }),
          });
        }
      }
    } else if (t3Stores.length > 0) {
      // Fallback: Build dedicated targets from t3Stores & t3Products
      for (const s of t3Stores) {
        const isSubDealer = Boolean(s.isSubDealer || s.subDealerStore);
        const isUnregistered = isSubDealer ? Boolean(s.isUnregisteredSubdealer) : false;
        const subdealerId = isSubDealer && !isUnregistered ? (s.subdealerId || null) : null;
        const subDealerStore = isSubDealer ? (s.subDealerStore || null) : null;

        const targetRecord = await (tx as any).activityPlanType3Target.create({
          data: {
            activityPlanId,
            storeId: s.storeId || null,
            subdealerId,
            isSubDealer,
            isUnregisteredSubdealer: isUnregistered,
            subDealerStore,
            notes: s.notes || s.remarks || null,
          },
        });

        const matchedProds = t3Products.filter(
          (p) => !p.storeId || p.storeId === s.storeId,
        );
        const effectiveProds =
          matchedProds.length > 0 ? matchedProds : t3Products;

        if (effectiveProds.length > 0) {
          await (tx as any).activityPlanType3Product.createMany({
            data: effectiveProds.map((p) => {
              const qty = p.targetQuantity != null ? Number(p.targetQuantity) : 1;
              const unitPrice =
                p.unitPrice != null ? new Prisma.Decimal(p.unitPrice) : null;
              const targetAmount =
                p.targetAmount != null
                  ? new Prisma.Decimal(p.targetAmount)
                  : unitPrice != null
                    ? unitPrice.mul(qty)
                    : null;

              return {
                targetId: targetRecord.id,
                activityPlanId,
                productId: p.productId,
                targetQuantity: qty,
                unitPrice,
                targetAmount,
                notes: p.notes || null,
              };
            }),
          });
        }
      }
    }
  },

  /**
   * Save Type 3 Actual Outcome (Dedicated Table: ActivityResultType3)
   */
  async saveActual(
    tx: PrismaTransaction,
    activityPlanId: string,
    actualData: any,
  ): Promise<void> {
    const saleResults: any[] =
      actualData.productSalesDetails ||
      actualData.saleResults ||
      actualData.t3ProductSalesDetails ||
      [];

    const t3SaleResults = saleResults.filter(
      (s) =>
        !s.workTypeCode ||
        s.workTypeCode === "TYPE_3" ||
        s.workTypeCode === "เสนอขายสินค้า",
    );

    let result = await tx.activityResult.findFirst({
      where: { activityPlanId },
      select: { id: true },
    });

    if (!result) {
      const plan = await tx.activityPlan.findUnique({
        where: { id: activityPlanId },
        select: { startDate: true, endDate: true },
      });

      if (plan) {
        result = await tx.activityResult.create({
          data: {
            activityPlanId,
            actualStartDate: actualData.actualStartDate || plan.startDate,
            actualEndDate: actualData.actualEndDate || plan.endDate,
            resultStatus: actualData.resultStatus || "COMPLETED",
          },
          select: { id: true },
        });
      }
    }

    // 1. DEDICATED TABLE: ActivityResultType3
    await (tx as any).activityResultType3.deleteMany({
      where: { activityPlanId },
    });

    const validSaleResults = t3SaleResults.filter(
      (item: any) => item && Boolean(item.productId),
    );

    if (validSaleResults.length > 0) {
      const targets = await (tx as any).activityPlanType3Target.findMany({
        where: { activityPlanId },
        select: { id: true, storeId: true },
        orderBy: { createdAt: "asc" },
      });

      let totalSalesAmount = new Prisma.Decimal(0);
      let ordersCount = 0;

      const recordsToCreate = validSaleResults.map((item: any, idx: number) => {
        const qty = Number(item.actualQty ?? item.actualQuantity ?? 0);
        const unitPrice = new Prisma.Decimal(
          item.unitPrice ?? item.actualUnitPrice ?? 0,
        );
        const total =
          item.actualSales != null || item.actualTotal != null
            ? new Prisma.Decimal(item.actualSales ?? item.actualTotal)
            : unitPrice.mul(qty);

        if (total.greaterThan(0) || qty > 0) {
          totalSalesAmount = totalSalesAmount.add(total);
          ordersCount += 1;
        }

        let targetId = item.targetId || null;
        if (!targetId && targets.length > 0) {
          const matched = targets.find(
            (t: any) => t.storeId && t.storeId === item.storeId,
          );
          targetId = matched ? matched.id : targets[idx]?.id || targets[0].id;
        }

        return {
          activityPlanId,
          targetId,
          storeId: item.storeId || null,
          productId: item.productId,
          productName: item.productName || null,
          actualQuantity: qty,
          actualUnitPrice: unitPrice,
          actualTotal: total,
          unclosedReason: item.unclosedReason || null,
          isAdditional: Boolean(item.isAdditional),
        };
      });

      await (tx as any).activityResultType3.createMany({
        data: recordsToCreate,
      });

      // Update ActivityResult summary fields
      if (result) {
        await tx.activityResult.update({
          where: { id: result.id },
          data: {
            salesResultAmount: totalSalesAmount,
            salesOrdersCount: ordersCount,
          },
        });
      }
    }
  },

  /**
   * Load Type 3 Stores and Products from Dedicated Tables
   */
  async loadPlan(
    tx: PrismaTransaction,
    activityPlanId: string,
  ): Promise<{ targets: any[]; stores: any[]; products: any[] }> {
    const dedicatedTargets = await (tx as any).activityPlanType3Target.findMany({
      where: { activityPlanId },
      include: {
        store: true,
        subdealer: true,
        products: {
          include: {
            product: true,
          },
        },
        results: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const stores = dedicatedTargets.map((t: any) => ({
      id: t.id,
      workTypeCode: "TYPE_3",
      storeId: t.storeId,
      storeName: t.store?.name || null,
      subdealerId: t.subdealerId,
      subdealerName: t.subdealer?.name || null,
      isSubDealer: t.isSubDealer,
      isUnregisteredSubdealer: t.isUnregisteredSubdealer,
      subDealerStore: t.subDealerStore,
      notes: t.notes,
      store: t.store,
      subdealer: t.subdealer,
    }));

    const products = dedicatedTargets.flatMap((t: any) =>
      (t.products || []).map((p: any) => ({
        id: p.id,
        workTypeCode: "TYPE_3",
        storeId: t.storeId,
        productId: p.productId,
        productName: p.product?.name || null,
        targetQuantity: p.targetQuantity,
        unitPrice: p.unitPrice ? Number(p.unitPrice) : null,
        targetAmount: p.targetAmount ? Number(p.targetAmount) : null,
        notes: p.notes,
        product: p.product,
      })),
    );

    return { targets: dedicatedTargets, stores, products };
  },

  /**
   * Load Type 3 Actual Results
   */
  async loadActual(
    tx: PrismaTransaction,
    activityPlanId: string,
  ): Promise<any | null> {
    const saleResults = await (tx as any).activityResultType3.findMany({
      where: { activityPlanId },
      include: {
        product: true,
        store: true,
        target: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return {
      saleResults,
      type3Results: saleResults,
    };
  },
};
