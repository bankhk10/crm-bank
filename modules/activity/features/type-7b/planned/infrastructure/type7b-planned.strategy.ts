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
   * Save Type 7B Plan targets in dedicated tables (ActivityPlanType7bTarget, ActivityPlanType7bProduct, DemoPlotVisit)
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
   * Save Type 7B Actual outcome data in dedicated tables (ActivityResultType7b, SprayRound, SprayProduct, SprayExternal)
   * And sync master DemoPlot & DemoPlotVisit
   */
  async saveActual(
    tx: PrismaTransaction,
    activityPlanId: string,
    actualData: any,
  ): Promise<void> {
    const t7b = actualData.type7bActual || actualData;

    // 1. Resolve target & DemoPlotId
    const target = await (tx as any).activityPlanType7bTarget?.findFirst({
      where: { activityPlanId },
      select: { id: true, demoPlotId: true },
    });

    let demoPlotId = t7b.t7DemoPlotId || t7b.demoPlotId || actualData.demoPlotId || target?.demoPlotId || null;
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

    if (!demoPlotId) {
      console.warn(`[Type7B saveActual] Cannot find demoPlotId for activityPlanId: ${activityPlanId}. Skipping.`);
      return;
    }

    const visitDate = t7b.t7VisitDate ? new Date(t7b.t7VisitDate) : new Date();
    const daysSinceStart = Number(t7b.t7DaysAfterSpray) || 0;
    const cropImageUrls = (t7b.t7CropImages || []).map((img: any) => img.url).filter(Boolean);
    const sprayingRounds: any[] = t7b.t7SprayingRounds || [];
    const firstRound = sprayingRounds[0];

    // 2. Update DemoPlot status & yield metadata
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
    if (firstRound?.sprayMethod === "TANK_MIXED") {
      demoPlotUpdateData.hasExternalChemicals = Boolean(firstRound?.hasExternalChemicals);
    }

    await (tx as any).demoPlot.update({
      where: { id: demoPlotId },
      data: demoPlotUpdateData,
    });

    // 3. Upsert DemoPlotVisit for timeline tracking
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

    // 4. Save into dedicated ActivityResultType7b table if available
    let createdResult: any = null;
    if ((tx as any).activityResultType7b) {
      await (tx as any).activityResultType7b.deleteMany({
        where: { activityPlanId },
      });

      createdResult = await (tx as any).activityResultType7b.create({
        data: {
          activityPlanId,
          targetId: target?.id || null,
          demoPlotId,
          visitDate,
          daysSinceStart,
          cropCondition: t7b.t7CropCondition || "สมบูรณ์",
          growthStage: t7b.t7GrowthStage || "",
          cropProblemDesc: firstRound?.problemDetail || t7b.t7CropProblemDescription || null,
          productResponse: firstRound?.productResponse || t7b.t7ProductResponse || null,
          productProblemDesc: firstRound?.problemDetail || t7b.t7ProblemDescription || null,
          nextSprayDate: t7b.t7NextSprayDate ? new Date(t7b.t7NextSprayDate) : null,
          notes: t7b.t7Notes || null,
          plotStatus: mappedStatus,
          finalHarvestDate: t7b.t7FinalHarvestDate ? new Date(t7b.t7FinalHarvestDate) : null,
          demoYieldKg: t7b.t7FinalYieldKg ? new Prisma.Decimal(String(t7b.t7FinalYieldKg)) : null,
          controlYieldKg: t7b.t7ControlYieldKg ? new Prisma.Decimal(String(t7b.t7ControlYieldKg)) : null,
          farmerSatisfaction: t7b.t7FarmerSatisfaction ? Number(t7b.t7FarmerSatisfaction) : null,
          commercialPotential: t7b.t7CommercialPotential || null,
          finalSummaryNotes: t7b.t7FinalSummaryNotes || null,
        },
      });
    } else {
      createdResult = { id: actualData.activityResultId || actualData.id || "res-default" };
    }

    const roundDelegate =
      (tx as any).activityResultType7bSprayRound ||
      (tx as any).activityResultSprayRound;
    const sprayProductDelegate =
      (tx as any).activityResultType7bSprayProduct ||
      (tx as any).activityResultSprayProduct;
    const sprayExternalDelegate =
      (tx as any).activityResultType7bSprayExternal ||
      (tx as any).activityResultSprayExternal;

    if (roundDelegate) {
      // Clean up previous spray rounds if delegate supports deleteMany
      if (typeof roundDelegate.deleteMany === "function") {
        await roundDelegate.deleteMany({
          where: (tx as any).activityResultType7b
            ? { resultId: createdResult.id }
            : { activityResultId: createdResult.id },
        });
      }

      // 5. Save Spray Rounds into dedicated ActivityResultType7bSprayRound
      for (const round of sprayingRounds) {
        const roundSprayDate = round.sprayDate ? new Date(round.sprayDate) : visitDate;

        const roundData: any = {
          roundNumber: round.roundNumber || 1,
          sprayDate: roundSprayDate,
          sprayMethod: round.sprayMethod || "SINGLE",
          hasExternalChemicals: Boolean(round.hasExternalChemicals),
          sprayEquipment: round.sprayEquipment || "เครื่องพ่นสะพายหลัง (เครื่องยนต์ / แบตเตอรี่)",
          otherEquipment: round.otherEquipment || null,
          productResponse: round.productResponse || "พืชตอบสนองดี (เห็นผลตามเป้าหมาย)",
          problemDetail: round.problemDetail || null,
          notes: t7b.t7Notes || null,
        };

        if ((tx as any).activityResultType7b) {
          roundData.resultId = createdResult.id;
        } else {
          roundData.activityResultId = createdResult.id;
        }

        const createdRound = await roundDelegate.create({
          data: roundData,
        });

        // Products (Baseline & Additional)
        const allProducts = [
          ...(round.baselineProducts || []).map((p: any) => ({ ...p, isPlanned: true })),
          ...(round.additionalProducts || []).map((p: any) => ({ ...p, isPlanned: false })),
        ];

        const validProducts = allProducts.filter((p) => Boolean(p.productId || p.productName));
        if (validProducts.length > 0 && sprayProductDelegate) {
          const prodIds = validProducts.map((p) => p.productId).filter(Boolean);
          const prodNames = validProducts.map((p) => p.productName).filter(Boolean);

          const dbProds = (tx as any).product
            ? await (tx as any).product.findMany({
                where: {
                  OR: [
                    ...(prodIds.length > 0 ? [{ id: { in: prodIds } }] : []),
                    ...(prodNames.length > 0 ? [{ name: { in: prodNames } }] : []),
                  ],
                },
                select: { id: true, name: true, unit: true },
              })
            : validProducts.map((p: any) => ({
                id: p.productId,
                name: p.productName || p.productId,
                unit: p.unit || "ขวด",
              }));

          const pMapById = new Map(dbProds.map((p: any) => [p.id, p]));
          const pMapByName = new Map(dbProds.map((p: any) => [p.name, p]));

          const isDedicated = Boolean((tx as any).activityResultType7bSprayProduct);

          const prodsToInsert = validProducts
            .map((p: any, pIdx: number) => {
              const dbP: any =
                pMapById.get(p.productId) ||
                pMapByName.get(p.productId) ||
                (p.productName ? pMapByName.get(p.productName) : undefined);
              if (!dbP) return null;

              const qty =
                p.actualQuantity != null && String(p.actualQuantity).trim() !== ""
                  ? p.actualQuantity
                  : p.quantityUsed != null && String(p.quantityUsed).trim() !== ""
                    ? p.quantityUsed
                    : p.plannedQuantity || 1;

              const withdrawnQty =
                p.withdrawnQuantity != null && String(p.withdrawnQuantity).trim() !== ""
                  ? new Prisma.Decimal(String(p.withdrawnQuantity))
                  : p.plannedQuantity != null && String(p.plannedQuantity).trim() !== ""
                    ? new Prisma.Decimal(String(p.plannedQuantity))
                    : null;

              const extraQty =
                p.extraQuantity != null && String(p.extraQuantity).trim() !== ""
                  ? new Prisma.Decimal(String(p.extraQuantity))
                  : null;

              const detail = p.extraQuantity
                ? `ใช้เพิ่ม ${p.extraQuantity} ${p.extraUnit || "ซีซี"}`
                : p.detail || null;

              const record: any = {
                sprayRoundId: createdRound.id,
                productId: dbP.id,
                productName: p.productName || dbP.name || null,
                isPlanned: Boolean(p.isPlanned),
                actualRate: p.applicationRate || p.actualRate || p.plannedRate || "ตามคำแนะนำ",
                actualQuantity: new Prisma.Decimal(String(qty)),
                withdrawnQuantity: withdrawnQty,
                extraQuantity: extraQty,
                unit: p.unit || dbP.unit || null,
                sortOrder: pIdx,
              };

              // Only include legacy fields if not targeting dedicated table ActivityResultType7bSprayProduct
              if (!isDedicated) {
                record.baselineRate = p.isPlanned ? p.plannedRate || "ตามแผน" : null;
                record.quantityUsed = new Prisma.Decimal(String(qty));
                record.detail = detail;
              }

              return record;
            })
            .filter((item): item is NonNullable<typeof item> => item !== null);

          if (prodsToInsert.length > 0) {
            await sprayProductDelegate.createMany({
              data: prodsToInsert,
            });
          }
        }

        // External Chemical Products
        if (
          sprayExternalDelegate &&
          round.sprayMethod === "TANK_MIXED" &&
          round.hasExternalChemicals &&
          Array.isArray(round.externalProducts) &&
          round.externalProducts.length > 0
        ) {
          const externalsToInsert = round.externalProducts
            .filter((ext: any) => ext && ext.productName && ext.productName.trim() !== "")
            .map((ext: any, extIdx: number) => ({
              sprayRoundId: createdRound.id,
              company: ext.company || "",
              productName: ext.productName.trim(),
              activeIngredient: ext.activeIngredient || null,
              formula: ext.formula || "SL",
              customFormula: ext.formula === "อื่นๆ" ? ext.customFormula || null : null,
              applicationRate: ext.applicationRate || "",
              sortOrder: extIdx,
            }));

          if (externalsToInsert.length > 0) {
            await sprayExternalDelegate.createMany({
              data: externalsToInsert,
            });
          }
        }

        // Round Attachments
        const roundImages = round.roundImages || round.attachments || [];
        const validImages = roundImages.filter((img: any) => img && (img.url || img.fileUrl));
        if (validImages.length > 0 && (tx as any).activityAttachment) {
          await (tx as any).activityAttachment.createMany({
            data: validImages.map((img: any) => ({
              activityPlanId,
              type7bResultId: createdResult.id,
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
