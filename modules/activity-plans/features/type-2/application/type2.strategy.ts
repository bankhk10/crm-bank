import type {
  WorkTypeStrategy,
  PrismaTransaction,
  StrategyValidationResult,
} from "@/modules/activity-plans/application/strategies/work-type-strategy.interface";

/**
 * Type 2 Strategy (ติดตามผลการใช้สินค้า / Product Follow-up)
 * Encapsulates validation, persistence (Dedicated Table: ActivityPlanType2Target & ActivityPlanType2Product),
 * and loading for Type 2 plans and actual outcomes.
 */
export const type2Strategy: WorkTypeStrategy = {
  code: "TYPE_2",

  /**
   * Validate business rules for Type 2 before saving Plan
   */
  async validatePlan(planData: any, _db: any): Promise<StrategyValidationResult> {
    const rawStores: any[] = planData.planStores || planData.stores || [];
    const rawProducts: any[] = planData.planProducts || planData.products || [];

    const t2Stores = rawStores.filter(
      (s) => !s.workTypeCode || s.workTypeCode === "TYPE_2" || s.workTypeCode === "ติดตามผลการใช้สินค้า",
    );
    const t2Products = rawProducts.filter(
      (p) => !p.workTypeCode || p.workTypeCode === "TYPE_2" || p.workTypeCode === "ติดตามผลการใช้สินค้า",
    );

    // If Type 2 is active, ensure at least one target store/farmer or product is specified
    if (t2Stores.length === 0 && t2Products.length === 0) {
      return {
        valid: false,
        error: "กรุณาระบุร้านค้า/เกษตรกร หรือสินค้าที่ต้องการติดตามผล (Type 2)",
      };
    }

    return { valid: true };
  },

  /**
   * Save Type 2 Plan data (stores & products) inside an atomic transaction
   * Persists to dedicated tables (ActivityPlanType2Target & ActivityPlanType2Product)
   * while keeping backward-compatible sync with legacy tables.
   */
  async savePlan(
    tx: PrismaTransaction,
    activityPlanId: string,
    planData: any,
  ): Promise<void> {
    const rawStores: any[] = planData.planStores || planData.stores || [];
    const rawProducts: any[] = planData.planProducts || planData.products || [];

    const t2Stores = rawStores.filter(
      (s) => !s.workTypeCode || s.workTypeCode === "TYPE_2" || s.workTypeCode === "ติดตามผลการใช้สินค้า",
    );
    const t2Products = rawProducts.filter(
      (p) => !p.workTypeCode || p.workTypeCode === "TYPE_2" || p.workTypeCode === "ติดตามผลการใช้สินค้า",
    );

    // ─────────────────────────────────────────────────────────────
    // 1. DEDICATED TABLES: ActivityPlanType2Target & Product
    // ─────────────────────────────────────────────────────────────
    await (tx as any).activityPlanType2Product.deleteMany({
      where: { activityPlanId },
    });

    await (tx as any).activityPlanType2Target.deleteMany({
      where: { activityPlanId },
    });

    if (t2Stores.length > 0) {
      for (let idx = 0; idx < t2Stores.length; idx++) {
        const s = t2Stores[idx];
        const targetRecord = await (tx as any).activityPlanType2Target.create({
          data: {
            activityPlanId,
            visitPurpose: s.visitPurpose || "FARMER",
            storeId: s.storeId || null,
            province: s.province || "",
            isUnregisteredFarmer: Boolean(s.isUnregisteredFarmer),
            unregisteredFarmerName: s.unregisteredFarmerName || null,
            unregisteredFarmerPhone: s.unregisteredFarmerPhone || null,
            notes: s.notes || s.remarks || null,
          },
        });

        // Find products belonging to this target
        const matchedProducts = t2Stores.length === 1
          ? t2Products
          : t2Products.filter((p) => p.storeId && s.storeId && p.storeId === s.storeId);

        const effectiveProducts = matchedProducts.length > 0
          ? matchedProducts
          : (idx === 0 && t2Products.some((p) => !p.storeId)
              ? t2Products.filter((p) => !p.storeId)
              : []);

        if (effectiveProducts.length > 0) {
          await (tx as any).activityPlanType2Product.createMany({
            data: effectiveProducts.map((p) => ({
              targetId: targetRecord.id,
              activityPlanId,
              productId: p.productId,
              notes: p.notes || null,
            })),
          });
        }
      }
    } else if (t2Products.length > 0) {
      // Fallback: Products only, create a default target container
      const defaultTarget = await (tx as any).activityPlanType2Target.create({
        data: {
          activityPlanId,
          visitPurpose: "STORE",
          province: "",
          isUnregisteredFarmer: false,
          notes: null,
        },
      });

      await (tx as any).activityPlanType2Product.createMany({
        data: t2Products.map((p) => ({
          targetId: defaultTarget.id,
          activityPlanId,
          productId: p.productId,
          notes: p.notes || null,
        })),
      });
    }

    // ─────────────────────────────────────────────────────────────
    // 2. LEGACY COMPATIBILITY: Sync with generic tables
    // ─────────────────────────────────────────────────────────────
    await tx.activityPlanStore.deleteMany({
      where: {
        activityPlanId,
        workTypeCode: "TYPE_2",
      },
    });

    await tx.activityPlanProduct.deleteMany({
      where: {
        activityPlanId,
        workTypeCode: "TYPE_2",
      },
    });

    if (t2Stores.length > 0) {
      await tx.activityPlanStore.createMany({
        data: t2Stores.map((s) => ({
          activityPlanId,
          workTypeCode: "TYPE_2",
          visitPurpose: s.visitPurpose || "FARMER",
          storeId: s.storeId || null,
          storeName: s.storeName || null,
          province: s.province || "",
          isUnregisteredFarmer: Boolean(s.isUnregisteredFarmer),
          unregisteredFarmerName: s.unregisteredFarmerName || null,
          unregisteredFarmerPhone: s.unregisteredFarmerPhone || null,
          notes: s.notes || s.remarks || null,
        })),
      });
    }

    if (t2Products.length > 0) {
      await tx.activityPlanProduct.createMany({
        data: t2Products.map((p) => ({
          activityPlanId,
          workTypeCode: "TYPE_2",
          productId: p.productId,
          productName: p.productName || null,
          storeId: p.storeId || null,
          notes: p.notes || null,
        })),
      });
    }
  },

  /**
   * Save Type 2 Actual Followup Results
   */
  async saveActual(
    tx: PrismaTransaction,
    activityPlanId: string,
    actualData: any,
  ): Promise<void> {
    const followupResults: any[] =
      actualData.followupResults || actualData.t2FollowupResults || [];

    const result = await tx.activityResult.findFirst({
      where: { activityPlanId },
      select: { id: true },
    });

    if (!result) return;

    await tx.activityResultFollowupItem.deleteMany({
      where: { activityResultId: result.id },
    });

    if (followupResults.length > 0) {
      await tx.activityResultFollowupItem.createMany({
        data: followupResults.map((item) => ({
          activityResultId: result.id,
          storeId: item.storeId || null,
          productId: item.productId,
          productName: item.productName || null,
          usageResult: item.usageResult || null,
          followupDetail: item.followupDetail || null,
          problemDetail: item.problemDetail || null,
          isAdditional: Boolean(item.isAdditional),
        })),
      });
    }
  },

  /**
   * Load Type 2 Stores and Products from Dedicated Tables with fallback to legacy
   */
  async loadPlan(
    tx: PrismaTransaction,
    activityPlanId: string,
  ): Promise<{ stores: any[]; products: any[] }> {
    const dedicatedTargets = await (tx as any).activityPlanType2Target.findMany({
      where: { activityPlanId },
      include: {
        store: true,
        products: {
          include: {
            product: true,
          },
        },
      },
    });

    if (dedicatedTargets && dedicatedTargets.length > 0) {
      const stores = dedicatedTargets.map((t: any) => ({
        id: t.id,
        workTypeCode: "TYPE_2",
        visitPurpose: t.visitPurpose,
        storeId: t.storeId,
        storeName: t.store?.name || null,
        province: t.province,
        isUnregisteredFarmer: t.isUnregisteredFarmer,
        unregisteredFarmerName: t.unregisteredFarmerName,
        unregisteredFarmerPhone: t.unregisteredFarmerPhone,
        notes: t.notes,
        store: t.store,
      }));

      const products = dedicatedTargets.flatMap((t: any) =>
        (t.products || []).map((p: any) => ({
          id: p.id,
          workTypeCode: "TYPE_2",
          storeId: t.storeId,
          productId: p.productId,
          productName: p.product?.name || null,
          notes: p.notes,
          product: p.product,
        })),
      );

      return { stores, products };
    }

    // Fallback: Legacy tables
    const stores = await tx.activityPlanStore.findMany({
      where: {
        activityPlanId,
        workTypeCode: "TYPE_2",
      },
      include: {
        store: true,
      },
    });

    const products = await tx.activityPlanProduct.findMany({
      where: {
        activityPlanId,
        workTypeCode: "TYPE_2",
      },
      include: {
        product: true,
      },
    });

    return { stores, products };
  },
};
