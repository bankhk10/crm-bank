import { randomUUID } from "crypto";
import type {
  WorkTypeStrategy,
  PrismaTransaction,
  StrategyValidationResult,
} from "@/modules/activity-plans/application/strategies/work-type-strategy.interface";
import type { Type6IssueItem } from "../types";

export const type6Strategy: WorkTypeStrategy = {
  code: "TYPE_6",

  /**
   * Validate Type 6 Plan Data
   */
  async validatePlan(
    planData: any,
    _db: any,
  ): Promise<StrategyValidationResult> {
    const items: any[] =
      planData.type6Items ||
      planData.stores?.filter(
        (s: any) =>
          !s.workTypeCode ||
          s.workTypeCode === "TYPE_6" ||
          s.workTypeCode === "ตรวจสอบเรื่องร้องเรียน / แก้ปัญหา",
      ) ||
      [];

    if (!items || items.length === 0) {
      return {
        valid: false,
        error: "กรุณาระบุข้อมูลเรื่องร้องเรียนอย่างน้อย 1 รายการ",
      };
    }

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const hasCustomer =
        Boolean(it.storeId) ||
        Boolean(it.customerName?.trim()) ||
        Boolean(it.manualCustomerName?.trim()) ||
        Boolean(it.storeName?.trim());

      if (!hasCustomer) {
        return {
          valid: false,
          error: `รายการที่ ${i + 1}: กรุณาเลือกร้านค้าหรือระบุชื่อลูกค้า/เกษตรกร`,
        };
      }
    }

    return { valid: true };
  },

  /**
   * Save Type 6 Plan targets in dedicated table and perform Dual-Write sync
   */
  async savePlan(
    tx: PrismaTransaction,
    activityPlanId: string,
    planData: any,
  ): Promise<void> {
    let items: any[] = [];

    if (planData.type6Items && Array.isArray(planData.type6Items)) {
      items = planData.type6Items;
    } else if (planData.planStores && Array.isArray(planData.planStores)) {
      items = planData.planStores.filter(
        (s: any) =>
          !s.workTypeCode ||
          s.workTypeCode === "TYPE_6" ||
          s.workTypeCode === "ตรวจสอบเรื่องร้องเรียน / แก้ปัญหา",
      );
    } else if (planData.stores && Array.isArray(planData.stores)) {
      items = planData.stores.filter(
        (s: any) =>
          !s.workTypeCode ||
          s.workTypeCode === "TYPE_6" ||
          s.workTypeCode === "ตรวจสอบเรื่องร้องเรียน / แก้ปัญหา",
      );
    }

    // 1. Delete existing dedicated Type 6 targets
    await (tx as any).activityPlanType6Target.deleteMany({
      where: { activityPlanId },
    });

    if (items.length > 0) {
      const targetsToCreate = items.map((item: any) => {
        const isManual =
          item.isManualCustomer !== undefined
            ? Boolean(item.isManualCustomer)
            : !item.storeId &&
              Boolean(item.manualCustomerName || item.customerName || item.storeName);

        const custName =
          (isManual ? item.manualCustomerName || item.customerName || item.storeName : item.customerName || item.storeName) ||
          null;

        const issueType = item.issueType || item.remarks || "สินค้าหรือบรรจุภัณฑ์ชำรุด / เสียหาย";
        const detail = item.detail || item.notes || null;

        return {
          id: randomUUID(),
          activityPlanId,
          storeId: isManual ? null : item.storeId || null,
          customerName: custName,
          isManualCustomer: isManual,
          issueType,
          detail,
        };
      });

      await (tx as any).activityPlanType6Target.createMany({
        data: targetsToCreate,
      });
    }

    // 2. Dual-Write Sync to activity_plan_stores for backward compatibility
    await tx.activityPlanStore.deleteMany({
      where: {
        activityPlanId,
        workTypeCode: "TYPE_6",
      },
    });

    if (items.length > 0) {
      const storesToCreate = items.map((item: any) => {
        const isManual =
          item.isManualCustomer !== undefined
            ? Boolean(item.isManualCustomer)
            : !item.storeId &&
              Boolean(item.manualCustomerName || item.customerName || item.storeName);

        const storeName =
          (isManual ? item.manualCustomerName || item.customerName || item.storeName : item.customerName || item.storeName) ||
          null;

        return {
          id: randomUUID(),
          activityPlanId,
          workTypeCode: "TYPE_6",
          storeId: isManual ? null : item.storeId || null,
          storeName,
          isUnregisteredFarmer: isManual,
          remarks: item.issueType || item.remarks || "สินค้าหรือบรรจุภัณฑ์ชำรุด / เสียหาย",
          notes: item.detail || item.notes || null,
        };
      });

      await tx.activityPlanStore.createMany({
        data: storesToCreate,
      });
    }
  },

  /**
   * Save Type 6 Actual outcome data (ActivityResultIssueItem & attachments)
   */
  async saveActual(
    tx: PrismaTransaction,
    activityPlanId: string,
    actualData: any,
  ): Promise<void> {
    let resultId = actualData?.activityResultId || actualData?.resultId;
    if (!resultId) {
      const result = await tx.activityResult.findFirst({
        where: { activityPlanId },
        select: { id: true },
      });
      resultId = result?.id;
    }
    if (!resultId) return;

    // Collect issue items
    let issueItems: any[] = [];
    if (actualData.issueResults && Array.isArray(actualData.issueResults)) {
      issueItems = actualData.issueResults;
    } else if (actualData.t6IssueRecord) {
      issueItems = [actualData.t6IssueRecord];
    } else if (actualData.t6IssueDetails && Array.isArray(actualData.t6IssueDetails)) {
      issueItems = actualData.t6IssueDetails;
    }

    if (issueItems.length === 0) return;

    // Clean existing records
    await (tx as any).activityResultIssueItem.deleteMany({
      where: { activityResultId: resultId },
    });

    const clientIssueMap = new Map<string, string>();
    const itemsToCreate = issueItems.map((item: any) => {
      const dbId = randomUUID();
      if (item.id) {
        clientIssueMap.set(item.id, dbId);
      }
      return {
        id: dbId,
        activityResultId: resultId,
        productId: item.productId ?? null,
        productName: item.productName ?? null,
        lotNumber: item.lotNumber ?? null,
        purchaseChannel: item.purchaseChannel || "ร้านค้าตัวแทนจำหน่าย",
        storeId: item.storeId ?? null,
        storeName: item.storeName ?? null,
        issueType: item.issueType || "สินค้าหรือบรรจุภัณฑ์ชำรุด / เสียหาย",
        detail: item.detail ?? null,
        status: item.status || "เสร็จสิ้น",
        problemFound: item.problemFound ?? item.detail ?? actualData.t6ProblemDetail ?? null,
        initialSolution: item.initialSolution ?? actualData.t6InitialSolution ?? null,
        nextAction: item.nextAction ?? actualData.t6NextAction ?? null,
      };
    });

    await (tx as any).activityResultIssueItem.createMany({
      data: itemsToCreate,
    });
  },

  /**
   * Load Type 6 Plan data from database
   */
  async loadPlan(tx: PrismaTransaction, activityPlanId: string): Promise<any> {
    const targets = await (tx as any).activityPlanType6Target.findMany({
      where: { activityPlanId },
      include: {
        store: true,
      },
      orderBy: { createdAt: "asc" },
    });

    if (targets.length > 0) {
      return {
        type6Items: targets.map((t: any) => ({
          id: t.id,
          storeId: t.storeId,
          customerName: t.customerName || t.store?.name || "",
          manualCustomerName: t.isManualCustomer ? t.customerName || "" : "",
          isManualCustomer: t.isManualCustomer,
          issueType: t.issueType,
          detail: t.detail || "",
        })),
      };
    }

    // Fallback: Legacy activity_plan_stores
    const stores = await tx.activityPlanStore.findMany({
      where: {
        activityPlanId,
        workTypeCode: "TYPE_6",
      },
      include: {
        store: true,
      },
    });

    return {
      type6Items: stores.map((s: any, idx: number) => ({
        id: s.id || String(idx + 1),
        storeId: s.storeId || null,
        customerName: s.store?.name || s.storeName || "",
        manualCustomerName: s.isUnregisteredFarmer ? s.storeName || "" : "",
        isManualCustomer: Boolean(s.isUnregisteredFarmer || !s.storeId),
        issueType: s.remarks || "สินค้าหรือบรรจุภัณฑ์ชำรุด / เสียหาย",
        detail: s.notes || "",
      })),
    };
  },
};
