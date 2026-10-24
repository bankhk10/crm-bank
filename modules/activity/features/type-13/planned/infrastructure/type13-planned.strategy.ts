import { Prisma } from "@prisma/client";
import type {
  WorkTypeStrategy,
  PrismaTransaction,
  StrategyValidationResult,
} from "@/modules/activity/types/strategy.interface";
import {
  syncType13Data,
  findType13ByPlanId,
} from "./type13.repository";
import { WORK_TYPE_CODE } from "../../shared/constants";

export const type13PlannedStrategy: WorkTypeStrategy = {
  code: WORK_TYPE_CODE,

  /**
   * Validate Type 13 Plan Data
   */
  async validatePlan(
    planData: any,
    _db: any,
  ): Promise<StrategyValidationResult> {
    const type13Data = planData.type13Data;
    const plots = type13Data?.plots || planData.type13Plots || [];

    if (!plots || plots.length === 0) {
      return {
        valid: false,
        error: "กรุณาระบุแปลงแฮตแทคอย่างน้อย 1 แปลง",
      };
    }

    for (let i = 0; i < plots.length; i++) {
      const p = plots[i];
      if (!p.storeId) {
        return {
          valid: false,
          error: `แปลงที่ ${i + 1}: กรุณาเลือกร้านค้า Dealer`,
        };
      }
      if (!p.province) {
        return {
          valid: false,
          error: `แปลงที่ ${i + 1}: กรุณาระบุจังหวัด`,
        };
      }
      if (!p.district) {
        return {
          valid: false,
          error: `แปลงที่ ${i + 1}: กรุณาระบุอำเภอ`,
        };
      }
    }

    return { valid: true };
  },

  /**
   * Save Type 13 Plan targets in dedicated tables (ActivityPlanType13Target, ActivityPlanType13Product)
   */
  async savePlan(
    tx: PrismaTransaction,
    activityPlanId: string,
    planData: any,
  ): Promise<void> {
    const t13Payload =
      planData.type13Data !== undefined
        ? planData.type13Data
        : planData.type13Plots
          ? {
              plots: planData.type13Plots.map((p: any, idx: number) => ({
                ...p,
                plotIndex: idx + 1,
              })),
              products: planData.type13Products || planData.withdrawnProducts || [],
              hasProductWithdrawal: planData.hasProductWithdrawal,
            }
          : null;

    if (t13Payload !== undefined) {
      const startDate = planData.startDate ? new Date(planData.startDate) : new Date();
      await syncType13Data(
        tx,
        activityPlanId,
        t13Payload,
        startDate,
        planData.employeeId || "",
      );
    }
  },

  /**
   * Save Type 13 Actual outcome data in dedicated tables (ActivityResultType13, SprayRound, SprayProduct, SprayExternal)
   */
  async saveActual(
    tx: PrismaTransaction,
    activityPlanId: string,
    actualData: any,
  ): Promise<void> {
    const t13 = actualData.type13Actual || actualData;
    const plots: any[] = t13.plots || actualData.type13Plots || [];

    if (!plots || plots.length === 0) {
      return;
    }

    // 1. Fetch existing targets for this plan to map targetId
    const targets = await tx.activityPlanType13Target.findMany({
      where: { activityPlanId },
      select: { id: true, plotIndex: true, demoPlotId: true, plotName: true },
    });
    const targetByIndex = new Map(targets.map((t) => [t.plotIndex, t]));
    const targetByPlotId = new Map(
      targets.filter((t) => t.demoPlotId).map((t) => [t.demoPlotId!, t]),
    );

    // 2. Delete existing actual results for this plan (cascade deletes sprayRounds, products, externals)
    await tx.activityResultType13.deleteMany({
      where: { activityPlanId },
    });

    // 3. Insert results per plot
    for (let i = 0; i < plots.length; i++) {
      const plot = plots[i];
      const plotIndex = plot.plotIndex || i + 1;
      const matchedTarget =
        (plot.demoPlotId ? targetByPlotId.get(plot.demoPlotId) : undefined) ||
        targetByIndex.get(plotIndex) ||
        targets[i];

      const demoPlotId = plot.demoPlotId || matchedTarget?.demoPlotId || null;

      const createdResult = await tx.activityResultType13.create({
        data: {
          activityPlanId,
          targetId: matchedTarget?.id || null,
          demoPlotId,
          plotName: plot.name || plot.plotName || matchedTarget?.plotName || `แปลงแฮตแทค ${plotIndex}`,
          actualPlotsCount: Array.isArray(plot.sprayRounds) ? plot.sprayRounds.length : 1,
          actualLatitude:
            plot.latitude != null && String(plot.latitude).trim() !== ""
              ? new Prisma.Decimal(Number(plot.latitude))
              : null,
          actualLongitude:
            plot.longitude != null && String(plot.longitude).trim() !== ""
              ? new Prisma.Decimal(Number(plot.longitude))
              : null,
          notes: plot.notes || null,
        },
      });

      // Update DemoPlot coordinates if available
      if (demoPlotId && (plot.latitude || plot.longitude)) {
        const updatePlotData: any = {};
        if (plot.latitude != null && String(plot.latitude).trim() !== "") {
          updatePlotData.latitude = new Prisma.Decimal(Number(plot.latitude));
        }
        if (plot.longitude != null && String(plot.longitude).trim() !== "") {
          updatePlotData.longitude = new Prisma.Decimal(Number(plot.longitude));
        }
        await tx.demoPlot.update({
          where: { id: demoPlotId },
          data: updatePlotData,
        });
      }

      // Save Spray Rounds
      const sprayRounds: any[] = plot.sprayRounds || [];
      for (const round of sprayRounds) {
        const sprayDate = round.sprayDate ? new Date(round.sprayDate) : new Date();

        const createdRound = await tx.activityResultType13SprayRound.create({
          data: {
            resultId: createdResult.id,
            roundNumber: round.roundNumber || 1,
            sprayDate,
            sprayMethod: round.sprayMethod || "SINGLE",
            sprayEquipment: round.sprayEquipment || "เครื่องยนต์พ่นยา",
            otherEquipment: round.otherEquipment || null,
            productResponse: round.productResponse || "ปกติ",
            problemDetail: round.problemDetail || null,
          },
        });

        // Spray Products
        const roundProducts: any[] = round.products || round.baselineProducts || [];
        const validRoundProducts = roundProducts.filter((p) => Boolean(p.productId));
        if (validRoundProducts.length > 0) {
          const pIds = validRoundProducts.map((p) => p.productId);
          const dbProducts = await tx.product.findMany({
            where: { id: { in: pIds } },
            select: { id: true, name: true, unit: true },
          });
          const prodMap = new Map(dbProducts.map((p) => [p.id, p]));

          const productsToInsert = validRoundProducts
            .map((p, pIdx) => {
              const dbP = prodMap.get(p.productId);
              if (!dbP) return null;
              return {
                sprayRoundId: createdRound.id,
                productId: dbP.id,
                productName: p.productName || dbP.name || null,
                quantityUsed:
                  p.quantityUsed != null && String(p.quantityUsed).trim() !== ""
                    ? new Prisma.Decimal(Number(p.quantityUsed))
                    : p.actualQuantity != null && String(p.actualQuantity).trim() !== ""
                      ? new Prisma.Decimal(Number(p.actualQuantity))
                      : new Prisma.Decimal(1),
                actualRate: p.actualRate || p.applicationRate || "ตามคำแนะนำ",
                unit: p.unit || dbP.unit || null,
                detail: p.detail || null,
                sortOrder: pIdx,
              };
            })
            .filter((item): item is NonNullable<typeof item> => item !== null);

          if (productsToInsert.length > 0) {
            await tx.activityResultType13SprayProduct.createMany({
              data: productsToInsert,
            });
          }
        }

        // External Chemical Products
        const externals: any[] = round.externalProducts || [];
        const validExternals = externals.filter(
          (ext) => ext && ext.productName && ext.productName.trim() !== "",
        );
        if (validExternals.length > 0) {
          await tx.activityResultType13SprayExternal.createMany({
            data: validExternals.map((ext, extIdx) => ({
              sprayRoundId: createdRound.id,
              company: ext.company || "",
              productName: ext.productName.trim(),
              activeIngredient: ext.activeIngredient || null,
              formula: ext.formula || "SL",
              customFormula: ext.formula === "อื่นๆ" ? ext.customFormula || null : null,
              applicationRate: ext.applicationRate || "",
              sortOrder: extIdx,
            })),
          });
        }

        // Round Attachments
        const roundImages: any[] = round.attachments || round.roundImages || [];
        const validRoundImages = roundImages.filter((img) => img && (img.url || img.fileUrl));
        if (validRoundImages.length > 0) {
          await tx.activityAttachment.createMany({
            data: validRoundImages.map((img) => ({
              activityPlanId,
              type13ResultId: createdResult.id,
              demoPlotId: demoPlotId || null,
              workTypeCode: WORK_TYPE_CODE,
              category: "PLOT",
              fileUrl: img.url || img.fileUrl,
              fileName: img.name || img.fileName || `ภาพแปลงแฮตแทค ${plotIndex} รอบ ${round.roundNumber || 1}`,
              fileSize: img.size || img.fileSize || 0,
              mimeType: img.type || img.mimeType || "image/jpeg",
            })),
          });
        }
      }

      // After Spray Images
      const afterImages: any[] = plot.afterSprayImages || [];
      const validAfterImages = afterImages.filter((img) => img && (img.url || img.fileUrl));
      if (validAfterImages.length > 0) {
        await tx.activityAttachment.createMany({
          data: validAfterImages.map((img) => ({
            activityPlanId,
            type13ResultId: createdResult.id,
            demoPlotId: demoPlotId || null,
            workTypeCode: WORK_TYPE_CODE,
            category: "PLOT",
            fileUrl: img.url || img.fileUrl,
            fileName: img.name || img.fileName || `ภาพหลังพ่นแปลงแฮตแทค ${plotIndex}`,
            fileSize: img.size || img.fileSize || 0,
            mimeType: img.type || img.mimeType || "image/jpeg",
          })),
        });
      }
    }
  },

  /**
   * Load Type 13 Plan targets
   */
  async loadPlan(
    _tx: PrismaTransaction,
    activityPlanId: string,
  ): Promise<any> {
    return findType13ByPlanId(activityPlanId);
  },
};

export const type13Strategy = type13PlannedStrategy;
