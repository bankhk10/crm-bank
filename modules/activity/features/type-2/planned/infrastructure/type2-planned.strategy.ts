import type {
  PrismaTransaction,
  StrategyValidationResult,
  WorkTypeStrategy,
} from "@/modules/activity/types/strategy.interface";

/**
 * Type 2 Strategy (ติดตามผลการใช้สินค้า / Product Follow-up)
 * Encapsulates validation, persistence (Dedicated Table: ActivityPlanType2Target & ActivityPlanType2Product),
 * and loading for Type 2 plans and actual outcomes.
 */
export const type2PlannedStrategy: WorkTypeStrategy = {
  code: "TYPE_2",

  /**
   * Validate business rules for Type 2 before saving Plan
   */
  async validatePlan(planData: any, db: any): Promise<StrategyValidationResult> {
    const rawStores: any[] = planData.planStores || planData.stores || [];
    const rawProducts: any[] = planData.planProducts || planData.products || [];

    const t2Stores = rawStores.filter(
      (s) =>
        !s.workTypeCode ||
        s.workTypeCode === "TYPE_2" ||
        s.workTypeCode === "ติดตามผลการใช้สินค้า",
    );
    const t2Products = rawProducts.filter(
      (p) =>
        !p.workTypeCode ||
        p.workTypeCode === "TYPE_2" ||
        p.workTypeCode === "ติดตามผลการใช้สินค้า",
    );

    if (t2Stores.length === 0 && t2Products.length === 0) {
      return {
        valid: false,
        error: "กรุณาระบุร้านค้า/เกษตรกร หรือสินค้าที่ต้องการติดตามผล (Type 2)",
      };
    }

    // Validate customer existence & types if storeId is provided
    for (const s of t2Stores) {
      if (s.storeId && !s.isUnregisteredFarmer) {
        const customer = await db.customer.findUnique({
          where: { id: s.storeId },
          select: { id: true, customerType: true },
        });
        if (!customer) {
          return { valid: false, error: "ไม่พบข้อมูลร้านค้า/เกษตรกรในระบบ" };
        }
      }
    }

    return { valid: true };
  },

  /**
   * Save Type 2 Plan data (stores & products) inside an atomic transaction
   * Persists to dedicated tables (ActivityPlanType2Target & ActivityPlanType2Product)
   * while keeping backward-compatible sync with generic tables.
   */
  async savePlan(
    tx: PrismaTransaction,
    activityPlanId: string,
    planData: any,
  ): Promise<void> {
    const rawStores: any[] = planData.planStores || planData.stores || [];
    const rawProducts: any[] = planData.planProducts || planData.products || [];

    const t2Stores = rawStores.filter(
      (s) =>
        !s.workTypeCode ||
        s.workTypeCode === "TYPE_2" ||
        s.workTypeCode === "ติดตามผลการใช้สินค้า",
    );
    const t2Products = rawProducts.filter(
      (p) =>
        !p.workTypeCode ||
        p.workTypeCode === "TYPE_2" ||
        p.workTypeCode === "ติดตามผลการใช้สินค้า",
    );

    // 1. DEDICATED TABLES: ActivityPlanType2Target & ActivityPlanType2Product
    await (tx as any).activityPlanType2Product.deleteMany({
      where: { activityPlanId },
    });

    await (tx as any).activityPlanType2Target.deleteMany({
      where: { activityPlanId },
    });

    if (
      Array.isArray(planData.type2Targets) &&
      planData.type2Targets.length > 0
    ) {
      for (const t of planData.type2Targets) {
        const isUnregistered = Boolean(t.isUnregisteredFarmer);
        const targetRecord = await (tx as any).activityPlanType2Target.create({
          data: {
            activityPlanId,
            visitPurpose: t.visitPurpose || "FARMER",
            storeId: isUnregistered ? null : t.storeId || null,
            province: t.province || "",
            isUnregisteredFarmer: isUnregistered,
            unregisteredFarmerName: isUnregistered
              ? t.unregisteredFarmerName || null
              : null,
            unregisteredFarmerPhone: isUnregistered
              ? t.unregisteredFarmerPhone || null
              : null,
            notes: t.notes || null,
          },
        });

        const targetProducts = Array.isArray(t.products) ? t.products : [];
        const validProducts = targetProducts.filter(
          (p: any) => p && p.productId,
        );

        if (validProducts.length > 0) {
          await (tx as any).activityPlanType2Product.createMany({
            data: validProducts.map((p: any) => ({
              targetId: targetRecord.id,
              activityPlanId,
              productId: p.productId,
              notes: p.notes || null,
            })),
          });
        }
      }
    } else if (t2Stores.length > 0) {
      for (let idx = 0; idx < t2Stores.length; idx++) {
        const s = t2Stores[idx];
        const isUnregistered = Boolean(s.isUnregisteredFarmer);
        const targetRecord = await (tx as any).activityPlanType2Target.create({
          data: {
            activityPlanId,
            visitPurpose: s.visitPurpose || "FARMER",
            storeId: isUnregistered ? null : s.storeId || null,
            province: s.province || "",
            isUnregisteredFarmer: isUnregistered,
            unregisteredFarmerName: isUnregistered
              ? s.unregisteredFarmerName || null
              : null,
            unregisteredFarmerPhone: isUnregistered
              ? s.unregisteredFarmerPhone || null
              : null,
            notes: s.notes || s.remarks || null,
          },
        });

        // 1. Check if products match by targetIndex
        const matchedByIndex = t2Products.filter(
          (p) => p.targetIndex !== undefined && p.targetIndex === idx,
        );

        // 2. Check if products match by storeId
        const matchedByStore =
          s.storeId && !isUnregistered
            ? t2Products.filter(
                (p) => p.storeId && p.storeId === s.storeId,
              )
            : [];

        // 3. Fallback for unregistered or unassigned products
        let effectiveProducts: any[] = [];
        if (matchedByIndex.length > 0) {
          effectiveProducts = matchedByIndex;
        } else if (matchedByStore.length > 0) {
          effectiveProducts = matchedByStore;
        } else if (t2Stores.length === 1) {
          effectiveProducts = t2Products;
        } else {
          const unregisteredStoreIndices = t2Stores
            .map((st, i) => (st.isUnregisteredFarmer || !st.storeId ? i : -1))
            .filter((i) => i !== -1);
          const unassignedProducts = t2Products.filter(
            (p) => !p.storeId || p.targetIndex !== undefined,
          );
          const order = unregisteredStoreIndices.indexOf(idx);
          if (order !== -1) {
            const count = Math.max(
              1,
              Math.floor(
                unassignedProducts.length / unregisteredStoreIndices.length,
              ),
            );
            const start = order * count;
            const isLast = order === unregisteredStoreIndices.length - 1;
            effectiveProducts = isLast
              ? unassignedProducts.slice(start)
              : unassignedProducts.slice(start, start + count);
          }
        }

        const validEffective = effectiveProducts.filter(
          (p: any) => p && p.productId,
        );

        if (validEffective.length > 0) {
          await (tx as any).activityPlanType2Product.createMany({
            data: validEffective.map((p) => ({
              targetId: targetRecord.id,
              activityPlanId,
              productId: p.productId,
              notes: p.notes || null,
            })),
          });
        }
      }
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

    // 1. DEDICATED TABLE: ActivityResultType2
    await (tx as any).activityResultType2.deleteMany({
      where: { activityPlanId },
    });

    const validFollowups = followupResults.filter(
      (item: any) => item && Boolean(item.productId),
    );

    if (validFollowups.length > 0) {
      const targets = await (tx as any).activityPlanType2Target.findMany({
        where: { activityPlanId },
        select: { id: true, storeId: true },
        orderBy: { createdAt: "asc" },
      });

      await (tx as any).activityResultType2.createMany({
        data: validFollowups.map((item: any, idx: number) => {
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
            usageResult: item.usageResult || null,
            followupDetail: item.followupDetail || null,
            problemDetail: item.problemDetail || null,
            isAdditional: Boolean(item.isAdditional),
          };
        }),
      });
    }

    // 2. Attachments
    const attachments =
      actualData.attachments ||
      actualData.images ||
      actualData.t2Images ||
      [];
    const hasAttachmentsInput =
      actualData.attachments !== undefined ||
      actualData.images !== undefined ||
      actualData.t2Images !== undefined;

    if (hasAttachmentsInput) {
      await tx.activityAttachment.deleteMany({
        where: {
          activityPlanId,
          workTypeCode: "TYPE_2",
        },
      });

      if (Array.isArray(attachments) && attachments.length > 0) {
        await tx.activityAttachment.createMany({
          data: attachments.map((att: any) => ({
            activityPlanId,
            activityResultId: result?.id || null,
            workTypeCode: "TYPE_2",
            category: att.category || "PLOT",
            fileUrl: att.fileUrl || att.url,
            fileName: att.fileName || att.name || "รูปภาพ",
            fileSize: att.fileSize || att.size || 0,
            mimeType: att.mimeType || att.type || "image/jpeg",
          })),
        });
      }
    }
  },

  async loadActual(
    tx: PrismaTransaction,
    activityPlanId: string,
  ): Promise<any | null> {
    const followupResults = await (tx as any).activityResultType2.findMany({
      where: { activityPlanId },
      include: {
        product: true,
        store: true,
        target: true,
      },
    });

    const attachments = await tx.activityAttachment.findMany({
      where: {
        activityPlanId,
        workTypeCode: "TYPE_2",
      },
    });

    return {
      followupResults,
      type2Results: followupResults,
      attachments,
    };
  },

  /**
   * Load Type 2 Stores and Products from Dedicated Tables
   */
  async loadPlan(
    tx: PrismaTransaction,
    activityPlanId: string,
  ): Promise<{ targets: any[]; stores: any[]; products: any[] }> {
    const targets = await (tx as any).activityPlanType2Target.findMany({
      where: { activityPlanId },
      include: {
        store: true,
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

    const stores = targets.map((t: any) => ({
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

    const products = targets.flatMap((t: any) =>
      (t.products || []).map((p: any) => ({
        id: p.id,
        workTypeCode: "TYPE_2",
        productId: p.productId,
        productName: p.product?.name || null,
        storeId: t.storeId,
        notes: p.notes,
        product: p.product,
      })),
    );

    return { targets, stores, products };
  },
};
