import type {
  PrismaTransaction,
  StrategyValidationResult,
  WorkTypeStrategy,
} from "@/modules/activity-plans/application/strategies/work-type-strategy.interface";
import type { Type1ActualResultValues, Type1PlanStoreValues } from "./validation";

export const type1Strategy: WorkTypeStrategy = {
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
        if (customer.customerType !== "DEALER" && customer.customerType !== "SUBDEALER") {
          return {
            valid: false,
            error: "วัตถุประสงค์เข้าพบร้านค้า อนุญาตเฉพาะร้านค้าตัวแทนจำหน่าย (DEALER) หรือร้านค้าย่อย (SUBDEALER) เท่านั้น",
          };
        }
      }
    }

    return { valid: true };
  },

  /**
   * Persist Plan Stores into dedicated `activity_plan_type_1_stores` table
   * Also syncs with legacy `activity_plan_stores` for seamless backward compatibility
   */
  async savePlan(tx: PrismaTransaction, activityPlanId: string, planData: any): Promise<void> {
    const rawStores: any[] = planData.planStores || planData.stores || [];
    const type1Stores = rawStores.filter(
      (s) => !s.workTypeCode || s.workTypeCode === "TYPE_1" || s.workTypeCode === "เข้าพบร้านค้า / Key Farmer",
    );

    // 1. Save to dedicated table
    await tx.activityPlanType1Store.deleteMany({
      where: { activityPlanId },
    });

    if (type1Stores.length > 0) {
      await tx.activityPlanType1Store.createMany({
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
   * Load Plan Stores from dedicated table (with fallback to legacy table)
   */
  async loadPlan(tx: PrismaTransaction, activityPlanId: string): Promise<any[]> {
    const dedicated = await tx.activityPlanType1Store.findMany({
      where: { activityPlanId },
      include: { store: true },
      orderBy: { createdAt: "asc" },
    });

    if (dedicated.length > 0) {
      return dedicated.map((d) => ({
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
      }));
    }

    // Fallback for older plans created before migration
    const legacy = await tx.activityPlanStore.findMany({
      where: { activityPlanId, workTypeCode: "TYPE_1" },
      include: { store: true },
    });

    return legacy.map((l) => ({
      id: l.id,
      workTypeCode: "TYPE_1",
      visitPurpose: l.visitPurpose,
      storeId: l.storeId,
      storeName: l.store?.name || l.unregisteredFarmerName || l.storeName || "",
      province: l.province || "",
      isUnregisteredFarmer: l.isUnregisteredFarmer,
      unregisteredFarmerName: l.unregisteredFarmerName,
      unregisteredFarmerPhone: l.unregisteredFarmerPhone,
      topic: l.remarks,
      remarks: l.remarks,
      notes: l.notes,
    }));
  },

  /**
   * Persist Actual outcome into dedicated `activity_result_type_1` table
   */
  async saveActual(tx: PrismaTransaction, activityPlanId: string, actualData: Type1ActualResultValues): Promise<void> {
    if (!actualData) return;

    await tx.activityResultType1.upsert({
      where: { activityPlanId },
      create: {
        activityPlanId,
        productAdvice: actualData.productAdvice ?? null,
        discussionResult: actualData.discussionResult ?? null,
        salesOpportunity: actualData.salesOpportunity ?? null,
        nextMeetingDate: actualData.nextMeetingDate ? new Date(actualData.nextMeetingDate) : null,
        farmerHomeAddress: actualData.farmerHomeAddress ?? null,
        plotLatitude: actualData.plotLatitude ?? null,
        plotLongitude: actualData.plotLongitude ?? null,
      },
      update: {
        productAdvice: actualData.productAdvice ?? null,
        discussionResult: actualData.discussionResult ?? null,
        salesOpportunity: actualData.salesOpportunity ?? null,
        nextMeetingDate: actualData.nextMeetingDate ? new Date(actualData.nextMeetingDate) : null,
        farmerHomeAddress: actualData.farmerHomeAddress ?? null,
        plotLatitude: actualData.plotLatitude ?? null,
        plotLongitude: actualData.plotLongitude ?? null,
      },
    });
  },

  /**
   * Load Actual outcome from dedicated table (with fallback to legacy activity_results)
   */
  async loadActual(tx: PrismaTransaction, activityPlanId: string): Promise<any | null> {
    const dedicated = await tx.activityResultType1.findUnique({
      where: { activityPlanId },
    });

    if (dedicated) {
      return {
        productAdvice: dedicated.productAdvice,
        discussionResult: dedicated.discussionResult,
        salesOpportunity: dedicated.salesOpportunity,
        nextMeetingDate: dedicated.nextMeetingDate,
        farmerHomeAddress: dedicated.farmerHomeAddress,
        plotLatitude: dedicated.plotLatitude ? Number(dedicated.plotLatitude) : null,
        plotLongitude: dedicated.plotLongitude ? Number(dedicated.plotLongitude) : null,
      };
    }

    // Fallback for older actual results
    const legacy = await tx.activityResult.findUnique({
      where: { activityPlanId },
    });

    if (!legacy) return null;

    return {
      productAdvice: legacy.productAdvice,
      discussionResult: legacy.discussionResult,
      salesOpportunity: legacy.salesOpportunity,
      nextMeetingDate: legacy.nextMeetingDate,
      farmerHomeAddress: legacy.farmerHomeAddress,
      plotLatitude: legacy.plotLatitude ? Number(legacy.plotLatitude) : null,
      plotLongitude: legacy.plotLongitude ? Number(legacy.plotLongitude) : null,
    };
  },
};
