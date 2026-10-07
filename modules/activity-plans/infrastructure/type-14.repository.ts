import { db } from "@/lib/db";
import { Prisma, DemoPlotStatus, AttachmentCategory } from "@prisma/client";
import { generateDemoPlotCode } from "./activity-plan.repository";

export interface Type14PlotInput {
  id?: string;
  demoPlotId?: string | null;
  plotName?: string | null;
  name?: string | null;
  dealerName?: string | null;
  ownerName?: string | null;
  cropCategory?: string | null;
  cropName?: string | null;
  province?: string | null;
  district?: string | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
}

export interface Type14WithdrawnProductInput {
  id?: string;
  productId: string;
  productName?: string | null;
  quantity?: number | string | null;
  unit?: string | null;
}

export interface Type14TrackingAttachmentInput {
  fileUrl: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
}

export interface Type14TrackingItemInput {
  id?: string;
  visitDate: string;
  daysSinceStart?: number;
  notes?: string;
  attachments?: Type14TrackingAttachmentInput[];
}

export interface Type14DataInput {
  sourceActivityPlanId?: string | null;
  selectedPlanId?: string | null;
  mode?: "EXISTING_PLOT" | "NEW_PLOT";
  demoPlotId?: string | null;
  demoPlotIds?: string[];
  selectedPlotIds?: string[];
  name?: string | null;
  plotName?: string | null;
  storeId?: string | null;
  dealerName?: string | null;
  ownerName?: string | null;
  cropCategory?: string | null;
  cropName?: string | null;
  province?: string | null;
  district?: string | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
  hasProducts?: boolean;
  hasProductWithdrawal?: boolean;
  notes?: string | null;
  plots?: Type14PlotInput[];
  products?: Type14WithdrawnProductInput[];
  withdrawnProducts?: Type14WithdrawnProductInput[];
  trackings?: Type14TrackingItemInput[];
}

/**
 * Creates ActivityPlanType14 records, plots, products, and visits in a Prisma Transaction
 */
export async function createType14Data(
  tx: Prisma.TransactionClient,
  planId: string,
  type14Data: Type14DataInput | undefined | null,
  startDate: Date,
  employeeId: string,
) {
  if (!type14Data) return;

  const rawProducts = type14Data.products || type14Data.withdrawnProducts || [];
  const validProducts = rawProducts.filter((p) => Boolean(p.productId));
  const hasProducts = Boolean(
    type14Data.hasProducts || type14Data.hasProductWithdrawal || validProducts.length > 0,
  );

  const sourcePlanId =
    type14Data.sourceActivityPlanId || type14Data.selectedPlanId || null;

  const t14 = await tx.activityPlanType14.create({
    data: {
      activityPlanId: planId,
      sourceActivityPlanId: sourcePlanId,
      mode: type14Data.mode || "EXISTING_PLOT",
      hasProducts,
      notes: type14Data.notes || null,
    },
  });

  // Resolve target plots
  const plotInputs: Type14PlotInput[] = [];

  if (type14Data.plots && type14Data.plots.length > 0) {
    plotInputs.push(...type14Data.plots);
  } else if (type14Data.selectedPlotIds && type14Data.selectedPlotIds.length > 0) {
    for (const pid of type14Data.selectedPlotIds) {
      plotInputs.push({ demoPlotId: pid });
    }
  } else if (type14Data.demoPlotIds && type14Data.demoPlotIds.length > 0) {
    for (const pid of type14Data.demoPlotIds) {
      plotInputs.push({ demoPlotId: pid });
    }
  } else if (type14Data.demoPlotId) {
    plotInputs.push({
      demoPlotId: type14Data.demoPlotId,
      name: type14Data.name || type14Data.plotName,
      dealerName: type14Data.dealerName,
      ownerName: type14Data.ownerName,
      province: type14Data.province,
      district: type14Data.district,
      latitude: type14Data.latitude,
      longitude: type14Data.longitude,
    });
  } else if (type14Data.mode === "NEW_PLOT" || type14Data.name) {
    // New plot mode
    plotInputs.push({
      name: type14Data.name || type14Data.plotName || "แปลงแฮตแทคใหม่",
      dealerName: type14Data.dealerName,
      ownerName: type14Data.ownerName,
      cropCategory: type14Data.cropCategory,
      cropName: type14Data.cropName,
      province: type14Data.province,
      district: type14Data.district,
      latitude: type14Data.latitude,
      longitude: type14Data.longitude,
    });
  }

  for (let i = 0; i < plotInputs.length; i++) {
    const p = plotInputs[i];
    let targetDemoPlotId = p.demoPlotId || null;

    if (targetDemoPlotId) {
      // Check if GPS update is needed
      const hasLat =
        p.latitude != null &&
        String(p.latitude).trim() !== "" &&
        !isNaN(Number(p.latitude));
      const hasLng =
        p.longitude != null &&
        String(p.longitude).trim() !== "" &&
        !isNaN(Number(p.longitude));
      if (hasLat || hasLng) {
        await tx.demoPlot.update({
          where: { id: targetDemoPlotId },
          data: {
            latitude: hasLat ? new Prisma.Decimal(Number(p.latitude)) : undefined,
            longitude: hasLng ? new Prisma.Decimal(Number(p.longitude)) : undefined,
          },
        });
      }
    } else {
      // Create new Hattack demo plot
      const code = await generateDemoPlotCode(
        tx,
        startDate ? new Date(startDate) : new Date(),
        i,
      );

      const newPlot = await tx.demoPlot.create({
        data: {
          code,
          name: p.name || p.plotName || `แปลงแฮตแทคใหม่ ${i + 1}`,
          ownerName: p.ownerName || "",
          customerId: type14Data.storeId || null,
          employeeId,
          province: p.province || null,
          district: p.district || null,
          cropCategory: p.cropCategory || null,
          cropName: p.cropName || null,
          latitude:
            p.latitude != null && String(p.latitude).trim() !== ""
              ? new Prisma.Decimal(Number(p.latitude))
              : null,
          longitude:
            p.longitude != null && String(p.longitude).trim() !== ""
              ? new Prisma.Decimal(Number(p.longitude))
              : null,
          plotType: "HATTACK",
          startDate,
          status: DemoPlotStatus.IN_PROGRESS,
        },
      });
      targetDemoPlotId = newPlot.id;
    }

    await tx.activityPlanType14Plot.create({
      data: {
        type14Id: t14.id,
        demoPlotId: targetDemoPlotId,
        plotName: p.plotName || p.name || null,
        dealerName: p.dealerName || null,
        ownerName: p.ownerName || null,
        cropCategory: p.cropCategory || null,
        cropName: p.cropName || null,
        province: p.province || null,
        district: p.district || null,
        latitude:
          p.latitude != null && String(p.latitude).trim() !== ""
            ? new Prisma.Decimal(Number(p.latitude))
            : null,
        longitude:
          p.longitude != null && String(p.longitude).trim() !== ""
            ? new Prisma.Decimal(Number(p.longitude))
            : null,
      },
    });

    // Create tracking visits if provided
    if (targetDemoPlotId) {
      if (type14Data.trackings && type14Data.trackings.length > 0) {
        for (let tIdx = 0; tIdx < type14Data.trackings.length; tIdx++) {
          const tracking = type14Data.trackings[tIdx];
          const visit = await tx.demoPlotVisit.create({
            data: {
              demoPlotId: targetDemoPlotId,
              activityPlanId: planId,
              workTypeCode: "TYPE_14",
              visitNumber: tIdx + 1,
              visitDate: tracking.visitDate ? new Date(tracking.visitDate) : startDate,
              daysSinceStart: Number(tracking.daysSinceStart) || 0,
              notes: tracking.notes ?? null,
            },
          });

          if (tracking.attachments && tracking.attachments.length > 0) {
            await tx.activityAttachment.createMany({
              data: tracking.attachments.slice(0, 5).map((att) => ({
                activityPlanId: planId,
                demoPlotId: targetDemoPlotId,
                demoPlotVisitId: visit.id,
                workTypeCode: "TYPE_14",
                category: AttachmentCategory.PLOT,
                fileUrl: att.fileUrl,
                fileName: att.fileName || "hattack-result-photo.jpg",
                fileSize: att.fileSize ?? null,
                mimeType: att.mimeType ?? null,
              })),
            });
          }
        }
      } else {
        const existingVisit = await tx.demoPlotVisit.findFirst({
          where: {
            activityPlanId: planId,
            demoPlotId: targetDemoPlotId,
            workTypeCode: "TYPE_14",
          },
        });
        if (!existingVisit) {
          await tx.demoPlotVisit.create({
            data: {
              demoPlotId: targetDemoPlotId,
              activityPlanId: planId,
              workTypeCode: "TYPE_14",
              visitNumber: 1,
              visitDate: startDate,
            },
          });
        }
      }
    }
  }

  if (validProducts.length > 0) {
    const pIds = validProducts.map((p) => p.productId);
    const dbProds = await tx.product.findMany({
      where: { id: { in: pIds } },
      select: { id: true, name: true, unit: true },
    });
    const pMap = new Map(dbProds.map((p) => [p.id, p]));

    await tx.activityPlanType14Product.createMany({
      data: validProducts.map((p, idx) => {
        const dbP = pMap.get(p.productId);
        return {
          type14Id: t14.id,
          productId: p.productId,
          productName: p.productName || dbP?.name || null,
          quantity:
            p.quantity != null
              ? new Prisma.Decimal(Number(p.quantity))
              : new Prisma.Decimal(1),
          unit: p.unit || dbP?.unit || null,
          sortOrder: idx,
        };
      }),
    });
  }
}

/**
 * Synchronizes ActivityPlanType14 records when updating an ActivityPlan
 */
export async function syncType14Data(
  tx: Prisma.TransactionClient,
  planId: string,
  type14Data: Type14DataInput | undefined | null,
  startDate: Date,
  employeeId: string,
) {
  if (type14Data === undefined) return;

  await tx.activityPlanType14.deleteMany({
    where: { activityPlanId: planId },
  });

  if (type14Data) {
    await createType14Data(tx, planId, type14Data, startDate, employeeId);
  }
}

/**
 * Fetch TYPE_14 records with relations for a given plan
 */
export async function findType14ByPlanId(planId: string) {
  return db.activityPlanType14.findUnique({
    where: { activityPlanId: planId },
    include: {
      sourceActivityPlan: {
        select: {
          id: true,
          code: true,
          title: true,
          startDate: true,
        },
      },
      plots: {
        include: {
          demoPlot: true,
        },
      },
      products: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              productCode: true,
              unit: true,
              packageSizeUnit: true,
            },
          },
        },
        orderBy: { sortOrder: "asc" },
      },
    },
  });
}
