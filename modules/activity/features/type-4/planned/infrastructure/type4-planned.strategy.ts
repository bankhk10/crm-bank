import { Prisma } from "@prisma/client";
import type {
  PrismaTransaction,
  StrategyValidationResult,
  WorkTypeStrategy,
} from "@/modules/activity/types/strategy.interface";

/**
 * Type 4 Strategy: วางบิล / เก็บเงิน (Billing & Payment Collection)
 * Encapsulates validation, persistence (Dedicated Tables: ActivityPlanType4Target & ActivityResultType4),
 * and loading for Type 4 plans and actual outcomes.
 */
export const type4PlannedStrategy: WorkTypeStrategy = {
  code: "TYPE_4",

  /**
   * Validate business rules for Type 4 before saving Plan
   */
  async validatePlan(planData: any, db: any): Promise<StrategyValidationResult> {
    const rawStores: any[] = planData.planStores || planData.stores || [];
    const t4Targets: any[] = planData.type4Targets || planData.type4Items || [];

    const t4Stores = rawStores.filter(
      (s) =>
        !s.workTypeCode ||
        s.workTypeCode === "TYPE_4" ||
        s.workTypeCode === "วางบิล / เก็บเงิน",
    );

    if (t4Stores.length === 0 && t4Targets.length === 0) {
      return {
        valid: false,
        error: "กรุณาระบุร้านค้า/ลูกค้าเป้าหมายสำหรับวางบิล/เก็บเงิน (Type 4)",
      };
    }

    const checkList = t4Targets.length > 0 ? t4Targets : t4Stores;
    for (let i = 0; i < checkList.length; i++) {
      const s = checkList[i];
      const isBilling =
        s.collectType === "BILLING" ||
        s.remarks === "BILLING" ||
        s.remarks === "วางบิล";
      const amt = Number(s.targetAmount ?? s.collectAmount);

      if (!isBilling && (!amt || amt <= 0)) {
        return {
          valid: false,
          error: `กรุณาระบุจำนวนเงินที่ต้องเก็บสำหรับร้านค้ารายการที่ ${i + 1} (Type 4)`,
        };
      }

      if (s.storeId) {
        const customer = await db.customer.findUnique({
          where: { id: s.storeId },
          select: { id: true },
        });
        if (!customer) {
          return { valid: false, error: "ไม่พบข้อมูลร้านค้าในระบบ" };
        }
      }
    }

    return { valid: true };
  },

  /**
   * Save Type 4 Plan data inside an atomic transaction
   * Persists to dedicated table (ActivityPlanType4Target)
   * while keeping backward-compatible sync with legacy tables.
   */
  async savePlan(
    tx: PrismaTransaction,
    activityPlanId: string,
    planData: any,
  ): Promise<void> {
    const rawTargets: any[] = planData.type4Targets || planData.type4Items || [];
    const rawStores: any[] = planData.planStores || planData.stores || [];

    const t4Stores = rawStores.filter(
      (s) =>
        !s.workTypeCode ||
        s.workTypeCode === "TYPE_4" ||
        s.workTypeCode === "วางบิล / เก็บเงิน",
    );

    // ─────────────────────────────────────────────────────────────
    // 1. DEDICATED TABLE: ActivityPlanType4Target
    // ─────────────────────────────────────────────────────────────
    await (tx as any).activityPlanType4Target.deleteMany({
      where: { activityPlanId },
    });

    const itemsToSave = rawTargets.length > 0 ? rawTargets : t4Stores;

    if (itemsToSave.length > 0) {
      await (tx as any).activityPlanType4Target.createMany({
        data: itemsToSave.map((s) => {
          const isBilling =
            s.collectType === "BILLING" ||
            s.remarks === "BILLING" ||
            s.remarks === "วางบิล";
          const collectType = isBilling ? "BILLING" : "COLLECT";
          const amt =
            s.targetAmount != null
              ? s.targetAmount
              : s.collectAmount != null
                ? s.collectAmount
                : null;

          return {
            activityPlanId,
            collectType,
            storeId: s.storeId || null,
            targetAmount: amt != null ? new Prisma.Decimal(amt) : null,
            invoiceNo: s.invoiceNo || s.orderNo || null,
            notes: s.notes || s.detail || null,
          };
        }),
      });
    }

    // ─────────────────────────────────────────────────────────────
    // 2. DUAL-WRITE SYNC TO LEGACY TABLES (activityPlanStore)
    // ─────────────────────────────────────────────────────────────
    if (planData._syncLegacy !== false) {
      await tx.activityPlanStore.deleteMany({
        where: {
          activityPlanId,
          workTypeCode: "TYPE_4",
        },
      });

      if (itemsToSave.length > 0) {
        await tx.activityPlanStore.createMany({
          data: itemsToSave.map((s) => {
            const isBilling =
              s.collectType === "BILLING" ||
              s.remarks === "BILLING" ||
              s.remarks === "วางบิล";
            const amt =
              s.targetAmount != null
                ? s.targetAmount
                : s.collectAmount != null
                  ? s.collectAmount
                  : null;

            return {
              activityPlanId,
              workTypeCode: "TYPE_4",
              storeId: s.storeId || null,
              targetAmount: amt != null ? new Prisma.Decimal(amt) : null,
              remarks: isBilling ? "BILLING" : "COLLECT",
              notes: s.notes || s.detail || null,
            };
          }),
        });
      }
    }
  },

  /**
   * Save Type 4 Actual Outcome (ActivityResultType4)
   */
  async saveActual(
    tx: PrismaTransaction,
    activityPlanId: string,
    outcomeData: any,
  ): Promise<void> {
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
            actualStartDate: outcomeData.actualStartDate || plan.startDate,
            actualEndDate: outcomeData.actualEndDate || plan.endDate,
            resultStatus: outcomeData.resultStatus || "COMPLETED",
          },
          select: { id: true },
        });
      }
    }

    const resultId = outcomeData.activityResultId || result?.id;
    const t4Data = outcomeData.type4Result || outcomeData;

    // 1. Delete existing records for this activityPlanId
    await (tx as any).activityResultType4.deleteMany({
      where: { activityPlanId },
    });

    const multiItems: any[] =
      outcomeData.type4Results ||
      outcomeData.type4ActualItems ||
      outcomeData.items ||
      outcomeData.companyItems ||
      outcomeData.t4Items ||
      outcomeData.actualData?.type4Results ||
      outcomeData.actualData?.type4ActualItems ||
      outcomeData.actualData?.items ||
      outcomeData.actualData?.t4Items ||
      t4Data.type4Results ||
      t4Data.type4ActualItems ||
      t4Data.items ||
      t4Data.companyItems ||
      t4Data.t4Items ||
      (Array.isArray(outcomeData.type4Result) ? outcomeData.type4Result : undefined) ||
      (Array.isArray(t4Data) ? t4Data : undefined) ||
      [];

    const orderNo = t4Data.orderNo || t4Data.t4OrderNo || null;
    let totalReceivedAmt = 0;

    if (multiItems.length > 0) {
      await (tx as any).activityResultType4.createMany({
        data: multiItems.map((item: any) => {
          const recAmt =
            item.receivedAmount != null && String(item.receivedAmount).trim() !== ""
              ? Number(String(item.receivedAmount).replace(/,/g, ""))
              : null;
          if (recAmt != null && !isNaN(recAmt)) {
            totalReceivedAmt += recAmt;
          }
          const targetAmt =
            item.targetAmountNum != null
              ? Number(item.targetAmountNum)
              : item.targetAmount != null
                ? Number(item.targetAmount)
                : recAmt != null
                  ? recAmt
                  : null;

          return {
            activityPlanId,
            storeId: item.storeId || null,
            companyName: item.companyName || item.customerName || item.customer || null,
            collectType: item.collectType || "COLLECT",
            targetAmount: targetAmt != null ? new Prisma.Decimal(targetAmt) : null,
            receivedAmount: recAmt != null ? new Prisma.Decimal(recAmt) : null,
            orderNo: item.orderNo || item.invoiceNo || orderNo,
            billingStatus: item.billingStatus || null,
            billingDetail: item.billingDetail || null,
            collectDetail: item.collectDetail || null,
            notes: item.notes || item.detail || null,
          };
        }),
      });
    } else {
      const recAmt =
        t4Data.receivedAmount != null && String(t4Data.receivedAmount).trim() !== ""
          ? Number(String(t4Data.receivedAmount).replace(/,/g, ""))
          : t4Data.t4ReceivedAmount != null && String(t4Data.t4ReceivedAmount).trim() !== ""
            ? Number(String(t4Data.t4ReceivedAmount).replace(/,/g, ""))
            : null;
      if (recAmt != null && !isNaN(recAmt)) {
        totalReceivedAmt = recAmt;
      }

      await (tx as any).activityResultType4.create({
        data: {
          activityPlanId,
          storeId: t4Data.storeId || null,
          companyName: t4Data.companyName || t4Data.customerName || t4Data.customer || null,
          collectType: t4Data.collectType || "COLLECT",
          targetAmount: t4Data.targetAmount != null ? new Prisma.Decimal(t4Data.targetAmount) : null,
          receivedAmount: recAmt != null ? new Prisma.Decimal(recAmt) : null,
          orderNo,
          billingStatus: t4Data.billingStatus || t4Data.t4BillingStatus || null,
          billingDetail: t4Data.billingDetail || t4Data.t4BillingDetail || null,
          collectDetail: t4Data.collectDetail || t4Data.t4CollectDetail || null,
          notes: t4Data.notes || t4Data.t4Detail || null,
        },
      });
    }

    // 2. Sync to legacy collectResultAmount in activity_results
    if (resultId && totalReceivedAmt > 0) {
      await tx.activityResult.update({
        where: { id: resultId },
        data: {
          collectResultAmount: new Prisma.Decimal(totalReceivedAmt),
        },
      });
    }

    // 3. Sync attachments to activityAttachment if present
    const attachments =
      outcomeData.attachments ||
      outcomeData.type4PaymentImages ||
      outcomeData.paymentImages ||
      t4Data.attachments ||
      [];

    if (resultId && Array.isArray(attachments) && attachments.length > 0) {
      await tx.activityAttachment.deleteMany({
        where: {
          activityPlanId,
          category: "GENERAL",
        },
      });

      await tx.activityAttachment.createMany({
        data: attachments.map((att: any) => ({
          activityPlanId,
          activityResultId: resultId,
          workTypeCode: "TYPE_4",
          category: "GENERAL",
          fileUrl: att.fileUrl || att.url,
          fileName: att.fileName || att.name || "หลักฐานการชำระเงิน",
          fileSize: att.fileSize || att.size || 0,
          mimeType: att.mimeType || att.type || "image/jpeg",
        })),
      });
    }
  },

  /**
   * Load Type 4 Stores from Dedicated Table with fallback to legacy
   */
  async loadPlan(
    tx: PrismaTransaction,
    activityPlanId: string,
  ): Promise<{ targets: any[]; stores: any[] }> {
    const dedicatedTargets = await (tx as any).activityPlanType4Target.findMany({
      where: { activityPlanId },
      include: {
        store: true,
      },
    });

    if (dedicatedTargets && dedicatedTargets.length > 0) {
      const stores = dedicatedTargets.map((t: any) => ({
        id: t.id,
        workTypeCode: "TYPE_4",
        collectType: t.collectType,
        storeId: t.storeId,
        storeName: t.store?.name || null,
        targetAmount: t.targetAmount,
        invoiceNo: t.invoiceNo,
        notes: t.notes,
        store: t.store,
      }));

      return { targets: dedicatedTargets, stores };
    }

    // Fallback: Legacy table
    const stores = await tx.activityPlanStore.findMany({
      where: {
        activityPlanId,
        workTypeCode: "TYPE_4",
      },
      include: {
        store: true,
      },
    });

    return { targets: [], stores };
  },

  /**
   * Load Type 4 Actual Results
   */
  async loadActual(
    tx: PrismaTransaction,
    activityPlanId: string,
  ): Promise<any[]> {
    const results = await (tx as any).activityResultType4.findMany({
      where: { activityPlanId },
      include: {
        store: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return results;
  },
};
