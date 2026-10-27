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
      if (!type7bData?.sourceActivityPlanId && !type7bData?.type7aTargetId && !type7bData?.demoPlotId) {
        return {
          valid: false,
          error: "กรุณาระบุแปลงสาธิตที่ต้องการติดตามอย่างน้อย 1 แปลง",
        };
      }
    }

    return { valid: true };
  },

  /**
   * Save Type 7B Plan targets in dedicated tables (ActivityPlanType7bTarget, ActivityPlanType7bProduct)
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
        type7aTargetId: planData.type7aTargetId || planData.demoPlotId,
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
   * And update source ActivityPlanType7aTarget status when closed
   */
  async saveActual(
    tx: PrismaTransaction,
    activityPlanId: string,
    actualData: any,
  ): Promise<void> {
    const t7b = actualData.type7bActual || actualData;

    // 1. Resolve target & Type 7A Target ID
    const target = await (tx as any).activityPlanType7bTarget?.findFirst({
      where: { activityPlanId },
      select: { id: true, type7aTargetId: true },
    });

    const raw7aId =
      t7b.type7aTargetId ||
      t7b.t7DemoPlotId ||
      t7b.demoPlotId ||
      actualData.type7aTargetId ||
      actualData.demoPlotId ||
      target?.type7aTargetId ||
      null;

    let valid7aTargetId: string | null = null;
    if (raw7aId && (tx as any).activityPlanType7aTarget?.findUnique) {
      const existing7a = await (tx as any).activityPlanType7aTarget.findUnique({
        where: { id: raw7aId },
        select: { id: true },
      });
      if (existing7a) {
        valid7aTargetId = existing7a.id;
      }
    }

    const visitDate = t7b.t7VisitDate ? new Date(t7b.t7VisitDate) : new Date();
    const daysSinceStart = Number(t7b.t7DaysAfterSpray) || 0;
    const sprayingRounds: any[] = t7b.t7SprayingRounds || [];
    const firstRound = sprayingRounds[0];

    // 2. Update source ActivityPlanType7aTarget status & yield metadata if applicable
    let mappedStatus: DemoPlotStatus = DemoPlotStatus.IN_PROGRESS;
    if (t7b.t7PlotStatus === "COMPLETED") {
      mappedStatus = DemoPlotStatus.COMPLETED;
    } else if (t7b.t7PlotStatus === "CANCELLED" || t7b.t7PlotStatus === "FAILED") {
      mappedStatus = DemoPlotStatus.CANCELLED;
    }

    const isClosing = mappedStatus === DemoPlotStatus.COMPLETED || mappedStatus === DemoPlotStatus.CANCELLED;

    if (valid7aTargetId && (tx as any).activityPlanType7aTarget?.update) {
      await (tx as any).activityPlanType7aTarget.update({
        where: { id: valid7aTargetId },
        data: {
          status: mappedStatus,
          closedDate: isClosing ? new Date() : null,
        },
      });
    }

    // 3. Save into dedicated ActivityResultType7b table
    let createdResult: any = null;
    if ((tx as any).activityResultType7b) {
      await (tx as any).activityResultType7b.deleteMany({
        where: { activityPlanId },
      });

      createdResult = await (tx as any).activityResultType7b.create({
        data: {
          activityPlanId,
          targetId: target?.id || null,
          type7aTargetId: valid7aTargetId,
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

    // Clean up previous TYPE_7B attachments for this plan
    if ((tx as any).activityAttachment?.deleteMany) {
      await (tx as any).activityAttachment.deleteMany({
        where: {
          activityPlanId,
          workTypeCode: "TYPE_7B",
        },
      });
    }

    // Save Crop Images to ActivityAttachment
    const cropImages = t7b.t7CropImages || [];
    const validCropImages = cropImages.filter((img: any) => img && (img.url || img.fileUrl));
    if (validCropImages.length > 0 && (tx as any).activityAttachment) {
      await (tx as any).activityAttachment.createMany({
        data: validCropImages.map((img: any) => ({
          activityPlanId,
          type7bResultId: createdResult.id,
          workTypeCode: "TYPE_7B",
          category: "CROP",
          fileUrl: img.url || img.fileUrl,
          fileName: img.name || img.fileName || "ภาพการเจริญเติบโตของพืช",
          fileSize: img.size || img.fileSize || 0,
          mimeType: img.type || img.mimeType || "image/jpeg",
        })),
      });
    }

    // 4. Save Spray Rounds
    if (sprayingRounds.length > 0) {
      const sprayRoundDelegate = (tx as any).activityResultType7bSprayRound || (tx as any).activityResultSprayRound;
      const sprayProductDelegate = (tx as any).activityResultType7bSprayProduct || (tx as any).activityResultSprayProduct;
      const sprayExternalDelegate = (tx as any).activityResultType7bSprayExternal || (tx as any).activityResultSprayExternal;

      for (let rIdx = 0; rIdx < sprayingRounds.length; rIdx++) {
        const round = sprayingRounds[rIdx];
        const roundDate = round.sprayDate ? new Date(round.sprayDate) : visitDate;

        const createdRound = await sprayRoundDelegate.create({
          data: {
            resultId: createdResult.id,
            roundNumber: round.roundNumber || rIdx + 1,
            sprayDate: roundDate,
            sprayMethod: round.sprayMethod || "SINGLE",
            sprayEquipment: round.sprayEquipment || null,
            otherEquipment: round.otherEquipment || null,
            cropCondition: round.cropCondition || null,
            problemDetail: round.problemDetail || null,
            productResponse: round.productResponse || null,
            notes: round.notes || null,
            hasExternalChemicals: Boolean(round.hasExternalChemicals),
          },
        });

        // Spray Products
        const roundProducts =
          round.products ||
          round.demoProducts ||
          [
            ...(round.baselineProducts || []).map((p: any) => ({ ...p, isPlanned: true })),
            ...(round.additionalProducts || []).map((p: any) => ({ ...p, isPlanned: false })),
          ];
        if (roundProducts.length > 0 && sprayProductDelegate) {
          const prodIds = roundProducts.map((p: any) => p.productId).filter(Boolean);
          const prodNames = roundProducts.map((p: any) => p.productName).filter(Boolean);

          const dbProducts =
            (tx as any).product?.findMany && (prodIds.length > 0 || prodNames.length > 0)
              ? await (tx as any).product.findMany({
                  where: {
                    OR: [
                      ...(prodIds.length > 0 ? [{ id: { in: prodIds } }] : []),
                      ...(prodIds.length > 0 ? [{ name: { in: prodIds } }] : []),
                      ...(prodNames.length > 0 ? [{ name: { in: prodNames } }] : []),
                    ],
                  },
                  select: { id: true, name: true, unit: true },
                })
              : [];

          const productMapById = new Map(dbProducts.map((p: any) => [p.id, p]));
          const productMapByName = new Map(dbProducts.map((p: any) => [p.name, p]));

          const prodsToInsert = roundProducts
            .map((p: any, pIdx: number) => {
              const dbP: any =
                productMapById.get(p.productId) ||
                productMapByName.get(p.productId) ||
                (p.productName ? productMapByName.get(p.productName) : undefined) ||
                (p.productId ? { id: p.productId, name: p.productName, unit: p.unit } : null);

              if (!dbP) return null;

              const qty = p.actualQuantity != null ? Number(p.actualQuantity) : Number(p.quantity) || 1;
              const withdrawnQty =
                p.withdrawnQuantity != null
                  ? new Prisma.Decimal(String(p.withdrawnQuantity))
                  : new Prisma.Decimal(String(qty));
              const extraQty = p.extraQuantity != null && p.extraQuantity !== "" ? String(p.extraQuantity) : null;

              return {
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
            })
            .filter((item: any): item is NonNullable<typeof item> => item !== null);

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
        const roundNum = round.roundNumber || 1;
        const roundImages = round.roundImages || round.attachments || [];
        const validImages = roundImages.filter((img: any) => img && (img.url || img.fileUrl));
        if (validImages.length > 0 && (tx as any).activityAttachment) {
          await (tx as any).activityAttachment.createMany({
            data: validImages.map((img: any) => {
              const origName = img.name || img.fileName || `ภาพการฉีดพ่นรอบที่ ${roundNum}`;
              const fileNameWithRound =
                origName.includes(`รอบที่ ${roundNum}`) || origName.includes(`รอบ ${roundNum}`)
                  ? origName
                  : `[รอบที่ ${roundNum}] ${origName}`;

              return {
                activityPlanId,
                type7bResultId: createdResult.id,
                workTypeCode: "TYPE_7B",
                category: "PLOT",
                fileUrl: img.url || img.fileUrl,
                fileName: fileNameWithRound,
                fileSize: img.size || img.fileSize || 0,
                mimeType: img.type || img.mimeType || "image/jpeg",
              };
            }),
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
