import { Prisma, ActivityResultStatus } from "@prisma/client";
import type {
  WorkTypeStrategy,
  PrismaTransaction,
  StrategyValidationResult,
} from "@/modules/activity/types/strategy.interface";
import {
  syncType14Data,
  findType14ByPlanId,
} from "../../planned/infrastructure/type14.repository";
import { type14PlannedStrategy } from "../../planned/infrastructure/type14-planned.strategy";
import { WORK_TYPE_CODE } from "../../shared/constants";

export const type14UnplannedStrategy: WorkTypeStrategy = {
  code: WORK_TYPE_CODE,

  /**
   * Validate Type 14 Unplanned Plan Data (2-in-1 Plan setup + Actual execution)
   */
  async validatePlan(
    planData: any,
    _db: any,
  ): Promise<StrategyValidationResult> {
    const rawT14 = planData.type14Data || planData.type14;
    const plots =
      planData.type14Plots ||
      rawT14?.plots ||
      planData.type14Targets ||
      planData.type14UnplannedItem?.plots ||
      [];

    const mode = rawT14?.mode || planData.mode || "EXISTING_PLOT";

    if (mode === "EXISTING_PLOT") {
      const hasSourcePlan = Boolean(
        rawT14?.selectedPlanId ||
          rawT14?.sourceActivityPlanId ||
          planData.selectedPlanId,
      );
      const hasPlots =
        plots.length > 0 &&
        plots.some(
          (p: any) => p.type13TargetId || p.demoPlotId || (p.name && !p.name.includes("default")),
        );

      if (!hasSourcePlan && !hasPlots) {
        return {
          valid: false,
          error: "กรุณาเลือกแผนงานฉีดแปลงแฮตแทคเดิม (Type 13) เพื่อติดตามผล (TYPE_14)",
        };
      }
    } else if (mode === "NEW_PLOT") {
      if (!plots || plots.length === 0) {
        return {
          valid: false,
          error: "กรุณาระบุข้อมูลแปลงแฮตแทคอย่างน้อย 1 แปลง (TYPE_14)",
        };
      }

      const firstPlot = plots[0];
      if (!firstPlot.storeId) {
        return {
          valid: false,
          error: "กรุณาเลือกร้านค้า Dealer สำหรับแปลงแฮตแทค (TYPE_14)",
        };
      }

      if (!firstPlot.name && !firstPlot.plotName) {
        return {
          valid: false,
          error: "กรุณาระบุชื่อแปลงแฮตแทค (TYPE_14)",
        };
      }

      if (!firstPlot.province) {
        return {
          valid: false,
          error: "กรุณาระบุจังหวัดของแปลงแฮตแทค (TYPE_14)",
        };
      }

      if (!firstPlot.district) {
        return {
          valid: false,
          error: "กรุณาระบุอำเภอของแปลงแฮตแทค (TYPE_14)",
        };
      }
    }

    // Validate actual fields for each plot
    for (let i = 0; i < plots.length; i++) {
      const p = plots[i];
      if (
        p.actualPlotsCount == null ||
        String(p.actualPlotsCount).trim() === "" ||
        Number(p.actualPlotsCount) <= 0
      ) {
        return {
          valid: false,
          error: `แปลงที่ ${i + 1}: กรุณาระบุจำนวนแปลงที่ติดตามจริง (TYPE_14)`,
        };
      }

      if (p.products && p.products.length > 0) {
        for (let j = 0; j < p.products.length; j++) {
          const prod = p.products[j];
          if (prod.productId) {
            if (
              prod.actualQuantity == null ||
              String(prod.actualQuantity).trim() === "" ||
              Number(prod.actualQuantity) < 0
            ) {
              return {
                valid: false,
                error: `แปลงที่ ${i + 1}: กรุณาระบุจำนวนที่ใช้จริงสำหรับสินค้า "${prod.productName || `ลำดับที่ ${j + 1}`}"`,
              };
            }
            if (!prod.actualRate || !String(prod.actualRate).trim()) {
              return {
                valid: false,
                error: `แปลงที่ ${i + 1}: กรุณาระบุอัตราการใช้สำหรับสินค้า "${prod.productName || `ลำดับที่ ${j + 1}`}"`,
              };
            }
          }
        }
      }

      const imgs = p.afterSprayImages || p.images || [];
      if (imgs.length > 20) {
        return {
          valid: false,
          error: `แปลงที่ ${i + 1}: อัปโหลดรูปภาพได้สูงสุด 20 รูปต่อหมู่บ้าน (TYPE_14)`,
        };
      }
    }

    return { valid: true };
  },

  /**
   * Save Type 14 Unplanned Data (Targets, Products, Actual Results, and Attachments)
   */
  async savePlan(
    tx: PrismaTransaction,
    activityPlanId: string,
    planData: any,
  ): Promise<void> {
    const rawT14 = planData.type14Data || planData.type14;
    const plots =
      planData.type14Plots ||
      rawT14?.plots ||
      planData.type14Targets ||
      planData.type14UnplannedItem?.plots ||
      [];

    const startDate = planData.startDate
      ? new Date(planData.startDate)
      : new Date();

    const t14Payload =
      rawT14 !== undefined
        ? rawT14
        : plots.length > 0
          ? {
              mode: planData.mode || "EXISTING_PLOT",
              selectedPlanId: planData.selectedPlanId || null,
              hasProductWithdrawal: Boolean(planData.hasProductWithdrawal),
              withdrawnProducts: planData.type14Products || [],
              plots: plots.map((p: any, idx: number) => ({
                ...p,
                plotIndex: idx + 1,
              })),
            }
          : null;

    // 1. Save Target & Product records
    if (t14Payload !== null) {
      await syncType14Data(
        tx,
        activityPlanId,
        t14Payload,
        startDate,
        planData.employeeId || "",
      );
    }

    // 2. Prepare actual execution payload
    const actualPayload =
      planData.type14Actual ||
      planData.actualData?.type14Actual ||
      planData.actualData || {
        plots,
        rounds: plots.map((p: any, idx: number) => ({
          roundNumber: idx + 1,
          actualVisitDate: p.actualVisitDate || startDate,
          daysAfterSpray: p.daysAfterSpray || "7",
          trackingResult: p.trackingResult || "ได้ผลตามเกณฑ์",
          productResponse: p.productResponse || "ปกติ",
          plotStatus: p.plotStatus || "IN_PROGRESS",
          closureNotes: p.closureNotes || null,
          additionalNotes: p.additionalNotes || null,
          products: p.products || [],
          afterSprayImages: p.afterSprayImages || p.images || [],
        })),
        totalPlots: plots.length,
      };

    // 3. Save Actual Outcome (ActivityResultType14, ProductsUsed, Attachments)
    if (typeof type14PlannedStrategy.saveActual === "function") {
      await type14PlannedStrategy.saveActual(tx, activityPlanId, actualPayload);
    }

    // 4. Ensure header ActivityResult exists and record demoPlotsFollowedUp
    const totalActualPlots = plots.reduce(
      (sum: number, p: any) => sum + (Number(p.actualPlotsCount) || 1),
      0,
    );

    const endDate = planData.endDate ? new Date(planData.endDate) : startDate;

    await (tx as any).activityResult.upsert({
      where: { activityPlanId },
      create: {
        activityPlanId,
        actualStartDate: startDate,
        actualEndDate: endDate,
        resultStatus: ActivityResultStatus.COMPLETED,
        demoPlotsFollowedUp: totalActualPlots || 1,
      },
      update: {
        actualStartDate: startDate,
        actualEndDate: endDate,
        resultStatus: ActivityResultStatus.COMPLETED,
        demoPlotsFollowedUp: totalActualPlots || 1,
      },
    });
  },

  /**
   * Save actual execution for Type 14 Unplanned
   */
  async saveActual(
    tx: PrismaTransaction,
    activityPlanId: string,
    actualData: any,
  ): Promise<void> {
    if (typeof type14PlannedStrategy.saveActual === "function") {
      await type14PlannedStrategy.saveActual(tx, activityPlanId, actualData);
    }
  },

  /**
   * Load Type 14 Unplanned Data
   */
  async loadPlan(
    _tx: PrismaTransaction,
    activityPlanId: string,
  ): Promise<any> {
    return findType14ByPlanId(activityPlanId);
  },
};
