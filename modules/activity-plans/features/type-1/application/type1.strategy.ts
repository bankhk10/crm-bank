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
    const rawStores: any[] =
      planData.type1PlannedItems ||
      planData.type1UnplannedItems ||
      planData.type1Stores ||
      planData.planStores ||
      planData.stores ||
      [];

    const type1Stores = rawStores.filter(
      (s) => !s.workTypeCode || s.workTypeCode === "TYPE_1" || s.workTypeCode === "เข้าพบร้านค้า / Key Farmer",
    );

    // Persist exclusively to dedicated table activity_plan_type_1_stores
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
          notes: s.notes || s.detail || null,
        })),
      });
    }
  },

  /**
   * Load Plan Stores exclusively from dedicated `activity_plan_type_1_stores` table
   */
  async loadPlan(tx: PrismaTransaction, activityPlanId: string): Promise<any[]> {
    const dedicated = await tx.activityPlanType1Store.findMany({
      where: { activityPlanId },
      include: { store: true },
      orderBy: { createdAt: "asc" },
    });

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
  },

  /**
   * Persist Actual outcome into dedicated `activity_result_type_1` and `activity_result_type_1_products` tables
   */
  async saveActual(tx: PrismaTransaction, activityPlanId: string, actualData: any): Promise<void> {
    if (!actualData) return;

    const data = actualData.type1Actual || actualData;

    await (tx as any).activityResultType1.upsert({
      where: { activityPlanId },
      create: {
        activityPlanId,
        productAdvice: data.productAdvice ?? null,
        discussionResult: data.discussionResult ?? null,
        salesOpportunity: data.salesOpportunity ?? null,
        nextMeetingDate: data.nextMeetingDate ? new Date(data.nextMeetingDate) : null,
        farmerHomeAddress: data.farmerHomeAddress ?? null,
        plotLatitude: data.plotLatitude != null && data.plotLatitude !== "" ? Number(data.plotLatitude) : null,
        plotLongitude: data.plotLongitude != null && data.plotLongitude !== "" ? Number(data.plotLongitude) : null,
      },
      update: {
        productAdvice: data.productAdvice ?? null,
        discussionResult: data.discussionResult ?? null,
        salesOpportunity: data.salesOpportunity ?? null,
        nextMeetingDate: data.nextMeetingDate ? new Date(data.nextMeetingDate) : null,
        farmerHomeAddress: data.farmerHomeAddress ?? null,
        plotLatitude: data.plotLatitude != null && data.plotLatitude !== "" ? Number(data.plotLatitude) : null,
        plotLongitude: data.plotLongitude != null && data.plotLongitude !== "" ? Number(data.plotLongitude) : null,
      },
    });

    // Persist normalized advised products into dedicated activity_result_type_1_products
    await (tx as any).activityResultType1Product.deleteMany({
      where: { activityPlanId },
    });

    const productsList: any[] = data.products || data.advisedProducts || [];

    if (productsList.length > 0) {
      await (tx as any).activityResultType1Product.createMany({
        data: productsList.map((p) => ({
          activityPlanId,
          targetId: p.targetId || null,
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
    const [dedicated, products] = await Promise.all([
      (tx as any).activityResultType1.findUnique({
        where: { activityPlanId },
      }),
      (tx as any).activityResultType1Product.findMany({
        where: { activityPlanId },
        include: { product: true },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    if (!dedicated) return null;

    return {
      productAdvice: dedicated.productAdvice,
      products: products.map((p: any) => ({
        id: p.id,
        productId: p.productId,
        productName: p.product?.name || p.productName || "",
        productCode: p.product?.productCode || null,
        targetId: p.targetId,
      })),
      discussionResult: dedicated.discussionResult,
      salesOpportunity: dedicated.salesOpportunity,
      nextMeetingDate: dedicated.nextMeetingDate,
      farmerHomeAddress: dedicated.farmerHomeAddress,
      plotLatitude: dedicated.plotLatitude ? Number(dedicated.plotLatitude) : null,
      plotLongitude: dedicated.plotLongitude ? Number(dedicated.plotLongitude) : null,
    };
  },
};

