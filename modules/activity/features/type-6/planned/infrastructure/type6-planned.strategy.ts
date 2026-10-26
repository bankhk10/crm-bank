import { randomUUID } from "crypto";
import type {
  WorkTypeStrategy,
  PrismaTransaction,
  StrategyValidationResult,
} from "@/modules/activity/types/strategy.interface";
import type { Type6IssueItem } from "../../shared/types";

export const type6PlannedStrategy: WorkTypeStrategy = {
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
    } else if (planData.type6Targets && Array.isArray(planData.type6Targets)) {
      items = planData.type6Targets;
    } else if (planData.type6UnplannedItems && Array.isArray(planData.type6UnplannedItems)) {
      items = planData.type6UnplannedItems;
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
  },

  /**
   * Save Type 6 Actual outcome data (activityResultType6 & attachments)
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

    if (!resultId) {
      const plan = await tx.activityPlan.findUnique({
        where: { id: activityPlanId },
        select: { startDate: true, endDate: true },
      });
      if (plan) {
        const created = await tx.activityResult.create({
          data: {
            activityPlanId,
            actualStartDate: actualData.actualStartDate || plan.startDate || new Date(),
            actualEndDate: actualData.actualEndDate || plan.endDate || new Date(),
            resultStatus: actualData.resultStatus || "COMPLETED",
          },
          select: { id: true },
        });
        resultId = created.id;
      }
    }
    if (!resultId) return;

    // Collect issue items
    let issueItems: any[] = [];
    if (actualData.type6Results && Array.isArray(actualData.type6Results)) {
      issueItems = actualData.type6Results;
    } else if (actualData.issueResults && Array.isArray(actualData.issueResults)) {
      issueItems = actualData.issueResults;
    } else if (actualData.type6ActualIssues && Array.isArray(actualData.type6ActualIssues)) {
      issueItems = actualData.type6ActualIssues;
    } else if (actualData.targetActualResults && Array.isArray(actualData.targetActualResults)) {
      issueItems = actualData.targetActualResults;
    } else if (actualData.type6UnplannedItems && Array.isArray(actualData.type6UnplannedItems)) {
      issueItems = actualData.type6UnplannedItems;
    } else if (actualData.t6IssueRecord) {
      issueItems = [actualData.t6IssueRecord];
    } else if (actualData.t6IssueDetails && Array.isArray(actualData.t6IssueDetails)) {
      issueItems = actualData.t6IssueDetails;
    }

    if (issueItems.length === 0) return;

    // Clean existing records in dedicated table
    const targetDelegate =
      (tx as any).activityResultType6 ||
      (tx as any).activityResultIssueItem;

    if (targetDelegate?.deleteMany) {
      await targetDelegate.deleteMany({
        where: { activityPlanId },
      });
    }

    const planTargetDelegate =
      (tx as any).activityPlanType6Target ||
      (tx as any).activityPlanType6Issue;

    const existingTargets = planTargetDelegate?.findMany
      ? await planTargetDelegate.findMany({
          where: { activityPlanId },
          select: { id: true, storeId: true, customerName: true },
        })
      : [];

    const clientIssueMap = new Map<string, string>();
    const itemsToCreate = issueItems.map((item: any, idx: number) => {
      const dbId = randomUUID();
      if (item.id) {
        clientIssueMap.set(item.id, dbId);
      }

      const matchedTarget =
        item.targetId ||
        existingTargets.find(
          (t: any) =>
            (item.storeId && t.storeId === item.storeId) ||
            (item.customerName && t.customerName === item.customerName),
        )?.id ||
        existingTargets[idx]?.id ||
        null;

      const isManual =
        item.isManualCustomer !== undefined
          ? Boolean(item.isManualCustomer)
          : !item.storeId &&
            Boolean(item.manualCustomerName || item.customerName || item.storeName);

      const custName =
        (isManual
          ? item.manualCustomerName || item.customerName || item.storeName
          : item.customerName || item.storeName) || null;

      return {
        id: dbId,
        activityPlanId,
        targetId: matchedTarget,
        productId: item.productId ?? null,
        productName: item.productName ?? null,
        lotNumber: item.lotNumber ?? null,
        purchaseChannel: item.purchaseChannel || "ร้านค้าตัวแทนจำหน่าย",
        storeId: isManual ? null : item.storeId ?? null,
        storeName: item.storeName ?? null,
        customerName: custName,
        isManualCustomer: isManual,
        issueType: item.issueType || "สินค้าหรือบรรจุภัณฑ์ชำรุด / เสียหาย",
        detail: item.detail ?? null,
        status: item.status || "เสร็จสิ้น",
        problemFound: item.problemFound ?? item.detail ?? actualData.t6ProblemDetail ?? null,
        initialSolution: item.initialSolution ?? actualData.t6InitialSolution ?? null,
        nextAction: item.nextAction ?? actualData.t6NextAction ?? null,
        isAdditional: Boolean(item.isAdditional || !matchedTarget),
      };
    });

    if (targetDelegate?.createMany) {
      await targetDelegate.createMany({
        data: itemsToCreate,
      });
    }

    // Sync attachments for Type 6 issue results
    const issueAttachments: any[] = [];
    issueItems.forEach((item: any, idx: number) => {
      const dbId = itemsToCreate[idx]?.id;
      if (Array.isArray(item.images)) {
        for (const img of item.images) {
          issueAttachments.push({
            activityPlanId,
            activityResultId: resultId,
            workTypeCode: "TYPE_6",
            category: "ISSUE",
            storeId: item.storeId || null,
            productId: item.productId || null,
            type6ResultId: dbId,
            issueItemId: dbId,
            fileUrl: img.url || img.fileUrl,
            fileName: img.name || img.fileName || "รูปถ่ายหลักฐานปัญหา",
            fileSize: img.size || img.fileSize || 0,
            mimeType: img.type || img.mimeType || "image/jpeg",
          });
        }
      }
    });

    const rawAttachments: any[] = Array.isArray(actualData.attachments)
      ? actualData.attachments
      : [];
    for (const att of rawAttachments) {
      if (att.workTypeCode === "TYPE_6" || att.category === "ISSUE") {
        if (!issueAttachments.some((ia) => ia.fileUrl === (att.fileUrl || att.url))) {
          issueAttachments.push({
            activityPlanId,
            activityResultId: resultId,
            workTypeCode: "TYPE_6",
            category: "ISSUE",
            storeId: att.storeId || itemsToCreate[0]?.storeId || null,
            productId: att.productId || itemsToCreate[0]?.productId || null,
            type6ResultId:
              (att.type6ResultId && clientIssueMap.get(att.type6ResultId)) ||
              att.type6ResultId ||
              itemsToCreate[0]?.id ||
              null,
            fileUrl: att.fileUrl || att.url,
            fileName: att.fileName || att.name || "รูปถ่ายหลักฐานปัญหา",
            fileSize: att.fileSize || att.size || 0,
            mimeType: att.mimeType || att.type || "image/jpeg",
          });
        }
      }
    }

    if (issueAttachments.length > 0) {
      await (tx as any).activityAttachment.deleteMany({
        where: {
          activityPlanId,
          workTypeCode: "TYPE_6",
        },
      });
      await (tx as any).activityAttachment.createMany({
        data: issueAttachments,
      });
    }
  },

  /**
   * Load Type 6 Plan data from database
   */
  async loadPlan(tx: PrismaTransaction, activityPlanId: string): Promise<any> {
    const targets = await (tx as any).activityPlanType6Target.findMany({
      where: { activityPlanId },
      include: {
        store: true,
        results: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return {
      type6Items: targets.map((t: any) => ({
        id: t.id,
        storeId: t.storeId,
        customerName: t.customerName || t.store?.name || "",
        manualCustomerName: t.isManualCustomer ? t.customerName || "" : "",
        isManualCustomer: t.isManualCustomer,
        issueType: t.issueType,
        detail: t.detail || "",
        results: t.results || [],
      })),
    };
  },

  /**
   * Load Type 6 Actual outcome data from database
   */
  async loadActual(tx: PrismaTransaction, activityPlanId: string): Promise<any> {
    const results = await (tx as any).activityResultType6.findMany({
      where: { activityPlanId },
      include: {
        store: true,
        product: true,
        attachments: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return {
      issueResults: results,
      type6Results: results,
    };
  },
};

// Aliases
export const type6Strategy = type6PlannedStrategy;
