import { Prisma, DemoPlotStatus } from "@prisma/client";
import type {
  WorkTypeStrategy,
  PrismaTransaction,
  StrategyValidationResult,
} from "@/modules/activity/types/strategy.interface";
import {
  syncType7bData,
  findType7bByPlanId,
} from "./type7b.repository";

export const type7bPlannedStrategy: WorkTypeStrategy = {
  code: "TYPE_7B",

  /**
   * Validate Type 7B Plan Data
   */
  async validatePlan(
    planData: any,
    _db: any,
  ): Promise<StrategyValidationResult> {
    const type7bData = planData.type7bData || planData.type7b;
    const plots = type7bData?.plots || planData.type7bPlots || [];

    if (!plots || plots.length === 0) {
      if (!type7bData?.sourceActivityPlanId && !type7bData?.demoPlotId) {
        return {
          valid: false,
          error: "กรุณาระบุแปลงสาธิตที่ต้องการติดตามอย่างน้อย 1 แปลง",
        };
      }
    }

    return { valid: true };
  },

  /**
   * Save Type 7B Plan targets in dedicated tables (ActivityPlanType7b, ActivityPlanType7bPlot, ActivityPlanType7bProduct, DemoPlotVisit)
   */
  async savePlan(
    tx: PrismaTransaction,
    activityPlanId: string,
    planData: any,
  ): Promise<void> {
    const raw7bData = planData.type7bData || planData.type7b;
    if (raw7bData !== undefined || planData.type7bPlots !== undefined) {
      const startDate = planData.startDate ? new Date(planData.startDate) : new Date();
      const payload = raw7bData || {
        plots: planData.type7bPlots,
        products: planData.type7bProducts,
        objective: planData.objective,
        sourceActivityPlanId: planData.sourceActivityPlanId,
        demoPlotId: planData.demoPlotId,
      };

      await syncType7bData(
        tx as any,
        activityPlanId,
        payload,
        startDate,
      );
    }
  },

  /**
   * Save Type 7B Actual outcome data
   */
  async saveActual(
    tx: PrismaTransaction,
    activityPlanId: string,
    actualData: any,
  ): Promise<void> {
    const t7b = actualData.type7bActual || actualData;

    // 1. Resolve ActivityResult
    let resultId = actualData.activityResultId || actualData.id || null;
    if (!resultId) {
      const res = await (tx as any).activityResult.findUnique({
        where: { activityPlanId },
        select: { id: true },
      });
      resultId = res?.id || null;
    }

    // 2. Resolve DemoPlotId
    let demoPlotId = t7b.t7DemoPlotId || t7b.demoPlotId || actualData.demoPlotId || null;
    if (!demoPlotId) {
      const matchedPlanPlot = await (tx as any).activityPlanType7bPlot.findFirst({
        where: { type7b: { activityPlanId } },
        select: { demoPlotId: true },
      });
      demoPlotId = matchedPlanPlot?.demoPlotId || null;
    }
    if (!demoPlotId) {
      const matchedVisit = await (tx as any).demoPlotVisit.findFirst({
        where: { activityPlanId },
        select: { demoPlotId: true },
      });
      demoPlotId = matchedVisit?.demoPlotId || null;
    }
    if (!demoPlotId) {
      const matchedPlot = await (tx as any).demoPlot.findFirst({
        where: { activityPlanId },
        select: { id: true },
      });
      demoPlotId = matchedPlot?.id || null;
    }

    const visitDate = t7b.t7VisitDate ? new Date(t7b.t7VisitDate) : new Date();
    const daysSinceStart = Number(t7b.t7DaysAfterSpray) || 0;
    const cropImageUrls = (t7b.t7CropImages || []).map((img: any) => img.url).filter(Boolean);
    const sprayingRounds: any[] = t7b.t7SprayingRounds || [];
    const firstRound = sprayingRounds[0];

    // 3. Update DemoPlot status
    if (demoPlotId) {
      let mappedStatus: DemoPlotStatus = DemoPlotStatus.IN_PROGRESS;
      if (t7b.t7PlotStatus === "COMPLETED") {
        mappedStatus = DemoPlotStatus.COMPLETED;
      } else if (t7b.t7PlotStatus === "CANCELLED" || t7b.t7PlotStatus === "FAILED") {
        mappedStatus = DemoPlotStatus.CANCELLED;
      }

      const isClosing = mappedStatus === DemoPlotStatus.COMPLETED || mappedStatus === DemoPlotStatus.CANCELLED;

      const demoPlotUpdateData: any = {
        status: mappedStatus,
        closedDate: isClosing ? new Date() : null,
      };

      if (t7b.t7NextSprayDate) {
        demoPlotUpdateData.nextSprayDate = new Date(t7b.t7NextSprayDate);
      }
      if (t7b.t7FinalYieldKg) {
        demoPlotUpdateData.demoYieldKg = new Prisma.Decimal(String(t7b.t7FinalYieldKg));
      }
      if (t7b.t7ControlYieldKg) {
        demoPlotUpdateData.controlYieldKg = new Prisma.Decimal(String(t7b.t7ControlYieldKg));
      }
      if (t7b.t7FarmerSatisfaction) {
        demoPlotUpdateData.farmerSatisfaction = Number(t7b.t7FarmerSatisfaction);
      }
      if (t7b.t7CommercialPotential) {
        demoPlotUpdateData.commercialPotential = t7b.t7CommercialPotential;
      }
      if (t7b.t7FinalSummaryNotes) {
        demoPlotUpdateData.finalSummaryNotes = t7b.t7FinalSummaryNotes;
      }

      await (tx as any).demoPlot.update({
        where: { id: demoPlotId },
        data: demoPlotUpdateData,
      });

      // 4. Upsert DemoPlotVisit for this activity plan
      const existingVisit = await (tx as any).demoPlotVisit.findFirst({
        where: {
          activityPlanId,
          demoPlotId,
        },
      });

      if (existingVisit) {
        await (tx as any).demoPlotVisit.update({
          where: { id: existingVisit.id },
          data: {
            visitDate,
            daysSinceStart,
            cropImageUrls,
            imageUrls: cropImageUrls,
            notes: t7b.t7Notes || null,
            cropCondition: t7b.t7CropCondition || "สมบูรณ์",
            growthStage: t7b.t7GrowthStage || "",
            cropProblemDesc: firstRound?.problemDetail || t7b.t7CropProblemDescription || null,
            productResponse: firstRound?.productResponse || t7b.t7ProductResponse || null,
            productProblemDesc: firstRound?.problemDetail || t7b.t7ProblemDescription || null,
            sprayMethod: firstRound?.sprayMethod || t7b.t7SprayMethod || null,
            sprayEquipment: firstRound?.sprayEquipment || t7b.t7SprayEquipment || null,
            otherEquipment: firstRound?.otherEquipment || t7b.t7OtherEquipment || null,
          },
        });
      } else {
        const count = await (tx as any).demoPlotVisit.count({
          where: { demoPlotId },
        });

        await (tx as any).demoPlotVisit.create({
          data: {
            demoPlotId,
            activityPlanId,
            workTypeCode: "TYPE_7B",
            visitNumber: count + 1,
            visitDate,
            daysSinceStart,
            cropImageUrls,
            imageUrls: cropImageUrls,
            notes: t7b.t7Notes || null,
            cropCondition: t7b.t7CropCondition || "สมบูรณ์",
            growthStage: t7b.t7GrowthStage || "",
            cropProblemDesc: firstRound?.problemDetail || t7b.t7CropProblemDescription || null,
            productResponse: firstRound?.productResponse || t7b.t7ProductResponse || null,
            productProblemDesc: firstRound?.problemDetail || t7b.t7ProblemDescription || null,
            sprayMethod: firstRound?.sprayMethod || t7b.t7SprayMethod || null,
            sprayEquipment: firstRound?.sprayEquipment || t7b.t7SprayEquipment || null,
            otherEquipment: firstRound?.otherEquipment || t7b.t7OtherEquipment || null,
          },
        });
      }

      // 5. Sync ActivityResultSprayRound & ActivityResultSprayProduct
      if (resultId) {
        await (tx as any).activityResultSprayRound.deleteMany({
          where: { activityResultId: resultId },
        });

        for (const round of sprayingRounds) {
          const roundSprayDate = round.sprayDate ? new Date(round.sprayDate) : visitDate;

          const createdRound = await (tx as any).activityResultSprayRound.create({
            data: {
              activityResultId: resultId,
              demoPlotId,
              roundNumber: round.roundNumber || 1,
              sprayDate: roundSprayDate,
              sprayMethod: round.sprayMethod || "SINGLE",
              sprayEquipment: round.sprayEquipment || "เป้สะพายหลัง",
              otherEquipment: round.otherEquipment || null,
              productResponse: round.productResponse || "พืชตอบสนองดี (เห็นผลตามเป้าหมาย)",
              problemDetail: round.problemDetail || null,
              daysSinceStart,
              notes: t7b.t7Notes || null,
              workTypeCode: "TYPE_7B",
            },
          });

          const productsToInsert: any[] = [];

          // 1.1 Baseline Products
          for (const bp of round.baselineProducts || []) {
            if (bp.productId) {
              productsToInsert.push({
                sprayRoundId: createdRound.id,
                productId: bp.productId,
                productName: bp.productName || null,
                baselineRate: bp.plannedRate || null,
                actualRate: bp.actualRate || bp.plannedRate || "ตามคำแนะนำ",
                quantityUsed: new Prisma.Decimal(
                  String(bp.actualQuantity || bp.plannedQuantity || 1),
                ),
                unit: bp.unit || null,
                detail: bp.detail || null,
              });
            }
          }

          // 1.2 Additional Products
          for (const ap of round.additionalProducts || []) {
            if (ap.productId) {
              productsToInsert.push({
                sprayRoundId: createdRound.id,
                productId: ap.productId,
                productName: ap.productName || null,
                baselineRate: null,
                actualRate: ap.actualRate || "ตามคำแนะนำ",
                quantityUsed: new Prisma.Decimal(String(ap.quantityUsed || 1)),
                unit: ap.unit || null,
                detail: ap.detail || null,
              });
            }
          }

          if (productsToInsert.length > 0) {
            await (tx as any).activityResultSprayProduct.createMany({
              data: productsToInsert,
            });
          }

          // Attachments per Round
          if (Array.isArray(round.roundImages) && round.roundImages.length > 0) {
            const validImages = round.roundImages.filter((img: any) => img && (img.url || img.fileUrl));
            if (validImages.length > 0) {
              await (tx as any).activityAttachment.createMany({
                data: validImages.map((img: any) => ({
                  activityPlanId,
                  activityResultId: resultId,
                  demoPlotId,
                  sprayRoundId: createdRound.id,
                  workTypeCode: "TYPE_7B",
                  category: "PLOT",
                  fileUrl: img.url || img.fileUrl,
                  fileName: img.name || img.fileName || `ภาพการฉีดพ่นรอบที่ ${round.roundNumber || 1}`,
                  fileSize: img.size || img.fileSize || 0,
                  mimeType: img.type || img.mimeType || "image/jpeg",
                })),
              });
            }
          }
        }
      }
    }

    // 6. Backward compatibility sync to ActivityResultDemoItem
    if (resultId && actualData.demoResults && Array.isArray(actualData.demoResults)) {
      await (tx as any).activityResultDemoItem.deleteMany({
        where: { activityResultId: resultId },
      });

      if (actualData.demoResults.length > 0) {
        await (tx as any).activityResultDemoItem.createMany({
          data: actualData.demoResults.map((item: any) => ({
            activityResultId: resultId,
            plannedProductId: item.plannedProductId || null,
            actualProductId: item.actualProductId || null,
            changeReason: item.changeReason || null,
            plotObjective: item.plotObjective || null,
            demoPlotId: item.demoPlotId || null,
          })),
        });
      }
    }
  },

  /**
   * Load Type 7B Plan Data
   */
  async loadPlan(
    _db: any,
    activityPlanId: string,
  ): Promise<any> {
    return findType7bByPlanId(activityPlanId);
  },
};

export const type7bStrategy = type7bPlannedStrategy;
