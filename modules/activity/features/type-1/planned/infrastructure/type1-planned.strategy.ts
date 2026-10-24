import type {
  PrismaTransaction,
  StrategyValidationResult,
  WorkTypeStrategy,
} from "@/modules/activity/types/strategy.interface";

export const type1PlannedStrategy: WorkTypeStrategy = {
  code: "TYPE_1",

  /**
   * Validate Type 1 Customer types in Database
   * - FARMER purpose requires Customer.customerType = FARMER
   * - STORE purpose requires Customer.customerType = DEALER or SUBDEALER
   */
  async validatePlan(planData: any, db: any): Promise<StrategyValidationResult> {
    const stores: Array<{
      workTypeCode?: string;
      visitPurpose?: "FARMER" | "STORE" | null;
      storeId?: string | null;
      isUnregisteredFarmer?: boolean;
    }> = planData.planStores || planData.stores || [];

    const type1Stores = stores.filter(
      (s) => !s.workTypeCode || s.workTypeCode === "TYPE_1" || s.workTypeCode === "เข้าพบร้านค้า / Key Farmer",
    );

    for (const s of type1Stores) {
      const purpose = s.visitPurpose || "FARMER";
      if (purpose === "FARMER") {
        if (!s.isUnregisteredFarmer && s.storeId) {
          const customer = await db.customer.findUnique({
            where: { id: s.storeId },
            select: { id: true, customerType: true },
          });
          if (!customer) {
            return { valid: false, error: "ไม่พบข้อมูลเกษตรกรในระบบ" };
          }
          if (customer.customerType !== "FARMER") {
            return {
              valid: false,
              error: "วัตถุประสงค์เข้าพบเกษตรกร อนุญาตเฉพาะลูกค้าประเภทเกษตรกร (FARMER) เท่านั้น",
            };
          }
        }
      } else if (purpose === "STORE") {
        if (s.isUnregisteredFarmer) {
          return {
            valid: false,
            error: "วัตถุประสงค์เข้าพบร้านค้า ไม่อนุญาตให้ระบุว่าไม่มีในระบบ",
          };
        }
        if (!s.storeId) {
          return { valid: false, error: "กรุณาเลือกร้านค้า" };
        }
        const customer = await db.customer.findUnique({
          where: { id: s.storeId },
          select: { id: true, customerType: true },
        });
        if (!customer) {
          return { valid: false, error: "ไม่พบข้อมูลร้านค้าในระบบ" };
        }
        if (!["DEALER", "SUBDEALER"].includes(customer.customerType)) {
          return {
            valid: false,
            error: "วัตถุประสงค์เข้าพบร้านค้า อนุญาตเฉพาะลูกค้าร้านค้า (DEALER / SUBDEALER) เท่านั้น",
          };
        }
      }
    }

    return { valid: true };
  },

  /**
   * Save Type 1 Plan Targets exclusively into dedicated `activity_type_1_targets` table
   */
  async savePlan(
    tx: PrismaTransaction,
    activityPlanId: string,
    planData: any,
  ): Promise<void> {
    const rawStores: any[] =
      planData.type1Targets ||
      planData.planStores ||
      planData.type1Stores ||
      planData.stores ||
      (planData.type1Items ? planData.type1Items : []);

    const type1Stores = rawStores.filter(
      (s) =>
        !s.workTypeCode ||
        s.workTypeCode === "TYPE_1" ||
        s.workTypeCode === "เข้าพบร้านค้า / Key Farmer",
    );

    // Persist exclusively to dedicated table activity_type_1_targets
    await (tx as any).activityPlanType1Target.deleteMany({
      where: { activityPlanId },
    });

    if (type1Stores.length > 0) {
      await (tx as any).activityPlanType1Target.createMany({
        data: type1Stores.map((s) => ({
          activityPlanId,
          visitPurpose: s.visitPurpose || "FARMER",
          storeId: s.storeId || null,
          province: s.province || "",
          isUnregisteredFarmer: Boolean(s.isUnregisteredFarmer),
          unregisteredFarmerName: s.unregisteredFarmerName || null,
          unregisteredFarmerPhone: s.unregisteredFarmerPhone || null,
          topic: s.topic || s.remarks || null,
          notes: s.notes || null,
        })),
      });
    }
  },

  /**
   * Load Plan Targets exclusively from dedicated `activity_type_1_targets` table
   */
  async loadPlan(tx: PrismaTransaction, activityPlanId: string): Promise<any[]> {
    const dedicated = await (tx as any).activityPlanType1Target.findMany({
      where: { activityPlanId },
      include: {
        store: true,
        products: { include: { product: true } },
        result: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return dedicated.map((d: any) => ({
      id: d.id,
      workTypeCode: "TYPE_1",
      visitPurpose: d.visitPurpose,
      storeId: d.storeId,
      storeName: d.store?.name || d.unregisteredFarmerName || "",
      province: d.province,
      isUnregisteredFarmer: d.isUnregisteredFarmer,
      unregisteredFarmerName: d.unregisteredFarmerName,
      unregisteredFarmerPhone: d.unregisteredFarmerPhone,
      topic: d.topic,
      remarks: d.topic,
      notes: d.notes,
      products: d.products,
      result: d.result,
    }));
  },

  /**
   * Persist Actual outcome into dedicated `activity_type_1_result` and `activity_type_1_products` tables.
   */
  async saveActual(tx: PrismaTransaction, activityPlanId: string, actualData: any): Promise<void> {
    if (!actualData) return;

    const data = actualData.type1Actual || actualData;

    // 1. Query target stores for this plan
    const planTargets = await (tx as any).activityPlanType1Target.findMany({
      where: { activityPlanId },
      orderBy: { createdAt: "asc" },
    });

    // 2. Clean previous results for this plan
    await (tx as any).activityResultType1.deleteMany({
      where: { activityPlanId },
    });

    const targetResults: any[] =
      data.targetActualResults ||
      data.targetItems ||
      data.items ||
      [];

    const matchedTargetProducts: any[] = [];

    if (planTargets.length > 0) {
      for (let idx = 0; idx < planTargets.length; idx++) {
        const target = planTargets[idx];
        const match =
          targetResults.find((t: any) =>
            (t.id && t.id === target.id) ||
            (t.targetId && t.targetId === target.id) ||
            (t.planStoreId && t.planStoreId === target.id) ||
            (target.storeId && t.storeId === target.storeId),
          ) ||
          targetResults[idx] ||
          {};

        if (Array.isArray(match.advisedProducts)) {
          for (const p of match.advisedProducts) {
            if (p && p.productId) {
              matchedTargetProducts.push({
                ...p,
                targetId: target.id,
              });
            }
          }
        }

        const prodAdvice =
          match.productAdvice || (planTargets.length === 1 ? data.productAdvice : null) || null;
        const discResult =
          match.discussionResult || (planTargets.length === 1 ? data.discussionResult : null) || null;
        const salesOpp =
          match.salesOpportunity || (planTargets.length === 1 ? data.salesOpportunity : null) || null;
        const nextActionVal =
          match.nextAction || (planTargets.length === 1 ? data.nextAction : null) || null;
        const nextDateVal =
          match.nextMeetingDate || (planTargets.length === 1 ? data.nextMeetingDate : null);
        const address =
          match.farmerHomeAddress || (planTargets.length === 1 ? data.farmerHomeAddress : null) || null;
        const latVal =
          match.plotLatitude != null && match.plotLatitude !== ""
            ? match.plotLatitude
            : (planTargets.length === 1 && data.plotLatitude != null && data.plotLatitude !== "" ? data.plotLatitude : null);
        const lngVal =
          match.plotLongitude != null && match.plotLongitude !== ""
            ? match.plotLongitude
            : (planTargets.length === 1 && data.plotLongitude != null && data.plotLongitude !== "" ? data.plotLongitude : null);

        await (tx as any).activityResultType1.create({
          data: {
            activityPlanId,
            targetId: target.id,
            productAdvice: prodAdvice,
            discussionResult: discResult,
            salesOpportunity: salesOpp,
            nextAction: nextActionVal,
            nextMeetingDate: nextDateVal ? new Date(nextDateVal) : null,
            farmerHomeAddress: address,
            plotLatitude: latVal != null && latVal !== "" ? Number(latVal) : null,
            plotLongitude: lngVal != null && lngVal !== "" ? Number(lngVal) : null,
          },
        });
      }
    } else {
      await (tx as any).activityResultType1.create({
        data: {
          activityPlanId,
          targetId: null,
          productAdvice: data.productAdvice || null,
          discussionResult: data.discussionResult || null,
          salesOpportunity: data.salesOpportunity || null,
          nextAction: data.nextAction || null,
          nextMeetingDate: data.nextMeetingDate ? new Date(data.nextMeetingDate) : null,
          farmerHomeAddress: data.farmerHomeAddress || null,
          plotLatitude: data.plotLatitude != null && data.plotLatitude !== "" ? Number(data.plotLatitude) : null,
          plotLongitude: data.plotLongitude != null && data.plotLongitude !== "" ? Number(data.plotLongitude) : null,
        },
      });
    }

    // Persist normalized advised products into dedicated activity_type_1_products
    await (tx as any).activityPlanType1Product.deleteMany({
      where: { activityPlanId },
    });

    const validTargetIds = new Set(planTargets.map((s: any) => s.id));
    const fallbackSingleTargetId = planTargets.length === 1 ? planTargets[0].id : null;

    const normalizeProductTargetId = (p: any) => {
      if (!p) return p;
      if (p.targetId && validTargetIds.has(p.targetId)) return p;
      if (fallbackSingleTargetId) {
        return { ...p, targetId: fallbackSingleTargetId };
      }
      return p;
    };

    const rawProductsList: any[] =
      matchedTargetProducts.length > 0
        ? matchedTargetProducts
        : [
            ...(Array.isArray(data.products) ? data.products.map(normalizeProductTargetId) : []),
            ...(Array.isArray(data.advisedProducts) ? data.advisedProducts.map(normalizeProductTargetId) : []),
            ...targetResults.flatMap((t: any) =>
              Array.isArray(t.advisedProducts) ? t.advisedProducts.map(normalizeProductTargetId) : [],
            ),
          ];

    const seen = new Set<string>();
    const productsList = rawProductsList.filter((p) => {
      if (!p || !p.productId) return false;
      const key = `${p.targetId || ""}-${p.productId}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (productsList.length > 0 && (planTargets.length > 0 || fallbackSingleTargetId)) {
      await (tx as any).activityPlanType1Product.createMany({
        data: productsList
          .filter((p) => p.targetId || fallbackSingleTargetId)
          .map((p) => ({
            activityPlanId,
            targetId: p.targetId || fallbackSingleTargetId,
            productId: p.productId,
            productName: p.productName || null,
          })),
      });
    }
  },

  /**
   * Load Actual outcome exclusively from dedicated tables
   */
  async loadActual(tx: PrismaTransaction, activityPlanId: string): Promise<any | null> {
    const [results, products] = await Promise.all([
      (tx as any).activityResultType1.findMany({
        where: { activityPlanId },
        include: { target: { include: { store: true } } },
        orderBy: { createdAt: "asc" },
      }),
      (tx as any).activityPlanType1Product.findMany({
        where: { activityPlanId },
        include: { product: true },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    if (!results || results.length === 0) return null;

    const first = results[0];

    return {
      results,
      productAdvice: results.map((r: any) => r.productAdvice).filter(Boolean).join(", "),
      products: products.map((p: any) => ({
        id: p.id,
        productId: p.productId,
        productName: p.product?.name || p.productName || "",
        productCode: p.product?.productCode || null,
        targetId: p.targetId,
      })),
      discussionResult: results.map((r: any) => r.discussionResult).filter(Boolean).join(" | "),
      salesOpportunity: first.salesOpportunity,
      nextAction: results.map((r: any) => r.nextAction).filter(Boolean).join(" | "),
      nextMeetingDate: results.find((r: any) => r.nextMeetingDate)?.nextMeetingDate,
      farmerHomeAddress: results.find((r: any) => r.farmerHomeAddress)?.farmerHomeAddress,
      plotLatitude:
        results.find((r: any) => r.plotLatitude != null)?.plotLatitude != null
          ? Number(results.find((r: any) => r.plotLatitude != null).plotLatitude)
          : null,
      plotLongitude:
        results.find((r: any) => r.plotLongitude != null)?.plotLongitude != null
          ? Number(results.find((r: any) => r.plotLongitude != null).plotLongitude)
          : null,
    };
  },
};
