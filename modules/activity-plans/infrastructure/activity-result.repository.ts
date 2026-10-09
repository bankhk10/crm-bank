import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import {
  Prisma,
  ActivityResultStatus,
  ActivityResultAction,
  DemoPlotStatus,
  AttachmentCategory,
} from "@prisma/client";
import { getWorkTypeCode } from "../constants";
import { generateDemoPlotCode } from "./activity-plan.repository";

export type CreateActivityResultInput = {
  activityPlanId: string;
  actualStartDate: Date;
  actualEndDate: Date;
  actualAttendeesCount?: number | null;
  resultStatus?: ActivityResultStatus;
  resultSummary?: string | null;
  discussionResult?: string | null;
  productAdvice?: string | null;
  salesOpportunity?: string | null;
  problemFound?: string | null;
  nextAction?: string | null;
  nextMeetingDate?: Date | null;
  farmerHomeAddress?: string | null;
  plotLatitude?: number | Prisma.Decimal | null;
  plotLongitude?: number | Prisma.Decimal | null;
  cancelReason?: string | null;
  postponedDate?: Date | null;
  postponedTime?: string | null;
  postponedReason?: string | null;
  postponedNotes?: string | null;
  actualSalesPromotionSpent?: number | null;
  actualMarketingSpent?: number | null;
  salesResultAmount?: number | null;
  salesOrdersCount?: number | null;
  collectResultAmount?: number | null;
  demoPlotsCreated?: number | null;
  demoPlotsFollowedUp?: number | null;
  distributorsCount?: number | null;
  farmersCount?: number | null;
  recordedById?: string | null;
  saleResults?: Array<{
    workTypeCode: string;
    storeId?: string | null;
    productId: string;
    productName?: string | null;
    actualQuantity: number;
    actualUnitPrice: number;
    actualTotal: number;
    unclosedReason?: string | null;
    isAdditional?: boolean;
  }>;
  stockResults?: Array<{
    storeId: string;
    productId: string;
    remainingQuantity: number;
    stockStatus?: string | null;
    reorderOpportunity?: string | null;
    remarks?: string | null;
  }>;
  surveyResults?: Array<{
    id?: string;
    storeId: string;
    productId?: string | null;
    competitorBrand: string;
    competitorProduct: string;
    posPrice?: number | null;
    dealerPrice?: number | null;
    subdealerPrice?: number | null;
    farmerPrice?: number | null;
    sellingPoints?: string | null;
    competitorPrice?: number | null;
    competitorUnit?: string | null;
    promotionDetail?: string | null;
  }>;
  demoResults?: Array<{
    demoPlotId?: string | null;
    plannedProductId?: string | null;
    actualProductId?: string | null;
    changeReason?: string | null;
    plotObjective?: string | null;
    cropAgeValue?: string | null;
    cropAgeUnit?: string | null;
    growthStage?: string | null;
    cropCondition?: string | null;
    productResponse?: string | null;
    problemDescription?: string | null;
    finalYieldKg?: number | null;
    controlYieldKg?: number | null;
    satisfactionScore?: number | null;
    applicationRate?: string | null;
  }>;
  sprayRounds?: Array<{
    demoPlotId: string;
    roundNumber: number;
    sprayDate?: string | Date;
    sprayMethod: string;
    sprayEquipment: string;
    otherEquipment?: string | null;
    productResponse: string;
    problemDetail?: string | null;
    daysSinceStart?: number | null;
    notes?: string | null;
    workTypeCode?: string | null;
    products: Array<{
      productId: string;
      productName?: string | null;
      baselineRate?: string | null;
      actualRate: string;
      quantityUsed: number | string;
      unit?: string | null;
      detail?: string | null;
    }>;
    externalProducts?: Array<{
      company: string;
      productName: string;
      activeIngredient?: string | null;
      formula: string;
      customFormula?: string | null;
      applicationRate: string;
    }>;
    attachments?: Array<{
      fileUrl: string;
      fileName?: string;
      fileSize?: number;
      mimeType?: string;
    }>;
  }>;
  type13PlotsActual?: Array<{
    demoPlotId: string;
    plotName?: string | null;
    storeId?: string | null;
    province?: string | null;
    district?: string | null;
    latitude: number | string | Prisma.Decimal;
    longitude: number | string | Prisma.Decimal;
  }>;
  type13NewPlots?: Array<{
    clientPlotId: string;
    plotName: string;
    storeId?: string | null;
    province?: string | null;
    district?: string | null;
    latitude: number | string | Prisma.Decimal;
    longitude: number | string | Prisma.Decimal;
  }>;
  followupResults?: Array<{
    storeId?: string | null;
    productId: string;
    productName?: string | null;
    usageResult?: string | null;
    followupDetail?: string | null;
    problemDetail?: string | null;
    isAdditional?: boolean;
  }>;
  issueResults?: Array<{
    id?: string;
    productId?: string | null;
    productName?: string | null;
    lotNumber?: string | null;
    purchaseChannel: string;
    storeId?: string | null;
    storeName?: string | null;
    issueType: string;
    detail?: string | null;
    status?: string;
  }>;
  type7aDemoPlot?: {
    customerId?: string | null;
    farmerCustomerId?: string | null;
    ownerName: string;
    ownerPhone?: string | null;
    ownerProvince?: string | null;
    ownerDistrict?: string | null;
    isUnregisteredFarmer: boolean;
    province: string;
    district?: string | null;
    latitude: number;
    longitude: number;
    plotName: string;
    dealerName?: string | null;
    cropCategory: string;
    cropName: string;
    customCropName?: string | null;
    areaRai?: number | null;
    treeCount?: number | null;
    objective?: string | null;
    experimentDetail?: string | null;
    mainCropInfo?: string | null;
    plantingDate?: Date | null;
    initialSprayDate?: Date | null;
    nextSprayDate?: Date | null;
    sprayMethod: string;
    hasExternalChemicals: boolean;
    demoProducts: Array<{
      productId: string;
      productName?: string | null;
      quantity: number;
      remainingQuantity?: number | null;
      unit?: string | null;
      applicationRate: string;
    }>;
    externalProducts?: Array<{
      company: string;
      productName: string;
      activeIngredient?: string | null;
      formula: string;
      customFormula?: string | null;
      applicationRate: string;
    }>;
    irrigations?: string[];
    usageMethod?: string | null;
    notes?: string | null;
    cropAgeValue?: number | null;
    cropAgeUnit?: string | null;
    growthStage?: string | null;
    cropCondition?: string | null;
    productResponse?: string | null;
    sprayEquipment?: string | null;
    otherEquipment?: string | null;
  } | null;
  attachments?: Array<{
    workTypeCode?: string | null;
    storeId?: string | null;
    productId?: string | null;
    surveyItemId?: string | null;
    issueItemId?: string | null;
    demoPlotId?: string | null;
    category?: AttachmentCategory;
    fileUrl: string;
    fileName: string;
    fileSize?: number | null;
    mimeType?: string | null;
  }>;
};

/**
 * Create or update ActivityResult (Post-activity outcome recording)
 */
export async function upsertActivityResult(
  input: CreateActivityResultInput,
  txClient?: Prisma.TransactionClient,
) {
  const handler = async (tx: Prisma.TransactionClient) => {
    // Check if result already exists before upsert to detect create vs edit and status change
    const existingResult = await tx.activityResult.findUnique({
      where: { activityPlanId: input.activityPlanId },
      select: { id: true, resultStatus: true },
    });

    const isFirstTime = !existingResult;
    const oldStatus = existingResult?.resultStatus ?? null;
    const newStatus = input.resultStatus ?? ActivityResultStatus.COMPLETED;
    const isStatusChanged = !isFirstTime && oldStatus !== newStatus;

    const spSpent = input.actualSalesPromotionSpent ?? 0;
    const mktSpent = input.actualMarketingSpent ?? 0;
    const actualTotalSpent = spSpent + mktSpent;

    const result = await tx.activityResult.upsert({
      where: { activityPlanId: input.activityPlanId },
      create: {
        activityPlanId: input.activityPlanId,
        actualStartDate: input.actualStartDate,
        actualEndDate: input.actualEndDate,
        actualAttendeesCount: input.actualAttendeesCount ?? null,
        resultStatus: input.resultStatus ?? ActivityResultStatus.COMPLETED,
        resultSummary: input.resultSummary ?? null,
        discussionResult: input.discussionResult ?? null,
        productAdvice: input.productAdvice ?? null,
        salesOpportunity: input.salesOpportunity ?? null,
        problemFound: input.problemFound ?? null,
        nextAction: input.nextAction ?? null,
        nextMeetingDate: input.nextMeetingDate ?? null,
        farmerHomeAddress: input.farmerHomeAddress ?? null,
        plotLatitude:
          input.plotLatitude != null
            ? new Prisma.Decimal(input.plotLatitude)
            : null,
        plotLongitude:
          input.plotLongitude != null
            ? new Prisma.Decimal(input.plotLongitude)
            : null,
        cancelReason: input.cancelReason ?? null,
        postponedDate: input.postponedDate ?? null,
        postponedTime: input.postponedTime ?? null,
        postponedReason: input.postponedReason ?? null,
        postponedNotes: input.postponedNotes ?? null,
        actualSalesPromotionSpent: input.actualSalesPromotionSpent
          ? new Prisma.Decimal(input.actualSalesPromotionSpent)
          : null,
        actualMarketingSpent: input.actualMarketingSpent
          ? new Prisma.Decimal(input.actualMarketingSpent)
          : null,
        actualTotalSpent: new Prisma.Decimal(actualTotalSpent),
        salesResultAmount: input.salesResultAmount
          ? new Prisma.Decimal(input.salesResultAmount)
          : null,
        salesOrdersCount: input.salesOrdersCount ?? null,
        collectResultAmount: input.collectResultAmount
          ? new Prisma.Decimal(input.collectResultAmount)
          : null,
        demoPlotsCreated: input.demoPlotsCreated ?? null,
        demoPlotsFollowedUp: input.demoPlotsFollowedUp ?? null,
        distributorsCount: input.distributorsCount ?? null,
        farmersCount: input.farmersCount ?? null,
        recordedById: input.recordedById ?? null,
      },
      update: {
        actualStartDate: input.actualStartDate,
        actualEndDate: input.actualEndDate,
        actualAttendeesCount: input.actualAttendeesCount ?? null,
        resultStatus: input.resultStatus ?? ActivityResultStatus.COMPLETED,
        resultSummary: input.resultSummary ?? null,
        discussionResult: input.discussionResult ?? null,
        productAdvice: input.productAdvice ?? null,
        salesOpportunity: input.salesOpportunity ?? null,
        problemFound: input.problemFound ?? null,
        nextAction: input.nextAction ?? null,
        nextMeetingDate: input.nextMeetingDate ?? null,
        farmerHomeAddress: input.farmerHomeAddress ?? null,
        plotLatitude:
          input.plotLatitude != null
            ? new Prisma.Decimal(input.plotLatitude)
            : null,
        plotLongitude:
          input.plotLongitude != null
            ? new Prisma.Decimal(input.plotLongitude)
            : null,
        cancelReason: input.cancelReason ?? null,
        postponedDate: input.postponedDate ?? null,
        postponedTime: input.postponedTime ?? null,
        postponedReason: input.postponedReason ?? null,
        postponedNotes: input.postponedNotes ?? null,
        actualSalesPromotionSpent: input.actualSalesPromotionSpent
          ? new Prisma.Decimal(input.actualSalesPromotionSpent)
          : null,
        actualMarketingSpent: input.actualMarketingSpent
          ? new Prisma.Decimal(input.actualMarketingSpent)
          : null,
        actualTotalSpent: new Prisma.Decimal(actualTotalSpent),
        salesResultAmount: input.salesResultAmount
          ? new Prisma.Decimal(input.salesResultAmount)
          : null,
        salesOrdersCount: input.salesOrdersCount ?? null,
        collectResultAmount: input.collectResultAmount
          ? new Prisma.Decimal(input.collectResultAmount)
          : null,
        demoPlotsCreated: input.demoPlotsCreated ?? null,
        demoPlotsFollowedUp: input.demoPlotsFollowedUp ?? null,
        distributorsCount: input.distributorsCount ?? null,
        farmersCount: input.farmersCount ?? null,
        recordedById: input.recordedById ?? null,
      },
    });

    // 1. Sync Sale Results
    if (input.saleResults !== undefined) {
      await tx.activityResultSaleItem.deleteMany({
        where: { activityResultId: result.id },
      });
      if (input.saleResults.length > 0) {
        await tx.activityResultSaleItem.createMany({
          data: input.saleResults.map((item) => ({
            activityResultId: result.id,
            workTypeCode: getWorkTypeCode(item.workTypeCode),
            storeId: item.storeId ?? null,
            productId: item.productId,
            productName: item.productName ?? null,
            actualQuantity: item.actualQuantity,
            actualUnitPrice: new Prisma.Decimal(item.actualUnitPrice),
            actualTotal: new Prisma.Decimal(item.actualTotal),
            unclosedReason: item.unclosedReason ?? null,
            isAdditional: Boolean(item.isAdditional),
          })),
        });
      }
    }

    // 2. Sync Stock Results
    if (input.stockResults !== undefined) {
      await tx.activityResultStockItem.deleteMany({
        where: { activityResultId: result.id },
      });
      if (input.stockResults.length > 0) {
        await tx.activityResultStockItem.createMany({
          data: input.stockResults.map((item) => ({
            activityResultId: result.id,
            storeId: item.storeId,
            productId: item.productId,
            remainingQuantity: item.remainingQuantity,
            stockStatus: item.stockStatus ?? null,
            reorderOpportunity: item.reorderOpportunity ?? null,
            remarks: item.remarks ?? null,
          })),
        });
      }
    }

    // 3. Sync Survey Results
    const clientSurveyMap = new Map<string, string>();
    if (input.surveyResults !== undefined) {
      await tx.activityResultSurveyItem.deleteMany({
        where: { activityResultId: result.id },
      });
      if (input.surveyResults.length > 0) {
        const surveyItemsToCreate = input.surveyResults.map((item, idx) => {
          const dbId = randomUUID();
          if (item.id) {
            clientSurveyMap.set(item.id, dbId);
          }
          clientSurveyMap.set(`survey-item-${idx + 1}`, dbId);
          clientSurveyMap.set(`item-${idx + 1}`, dbId);
          return {
            id: dbId,
            activityResultId: result.id,
            storeId: item.storeId,
            productId: item.productId ?? null,
            competitorBrand: item.competitorBrand || "-",
            competitorProduct: item.competitorProduct || "-",
            posPrice:
              item.posPrice != null ? new Prisma.Decimal(item.posPrice) : null,
            dealerPrice:
              item.dealerPrice != null
                ? new Prisma.Decimal(item.dealerPrice)
                : null,
            subdealerPrice:
              item.subdealerPrice != null
                ? new Prisma.Decimal(item.subdealerPrice)
                : null,
            farmerPrice:
              item.farmerPrice != null
                ? new Prisma.Decimal(item.farmerPrice)
                : null,
            sellingPoints: item.sellingPoints ?? null,
            competitorPrice:
              item.competitorPrice != null
                ? new Prisma.Decimal(item.competitorPrice)
                : null,
            competitorUnit: item.competitorUnit ?? null,
            promotionDetail: item.promotionDetail ?? null,
          };
        });

        await tx.activityResultSurveyItem.createMany({
          data: surveyItemsToCreate,
        });
      }
    }

    // 4. Sync Demo Results
    if (input.demoResults !== undefined) {
      await tx.activityResultDemoItem.deleteMany({
        where: { activityResultId: result.id },
      });
      if (input.demoResults.length > 0) {
        await tx.activityResultDemoItem.createMany({
          data: input.demoResults.map((item) => ({
            activityResultId: result.id,
            demoPlotId: item.demoPlotId ?? null,
            plannedProductId: item.plannedProductId ?? null,
            actualProductId: item.actualProductId ?? null,
            changeReason: item.changeReason ?? null,
            plotObjective: item.plotObjective ?? null,
            cropAgeValue: item.cropAgeValue ?? null,
            cropAgeUnit: item.cropAgeUnit ?? null,
            growthStage: item.growthStage ?? null,
            cropCondition: item.cropCondition ?? null,
            productResponse: item.productResponse ?? null,
            problemDescription: item.problemDescription ?? null,
            finalYieldKg:
              item.finalYieldKg != null
                ? new Prisma.Decimal(item.finalYieldKg)
                : null,
            controlYieldKg:
              item.controlYieldKg != null
                ? new Prisma.Decimal(item.controlYieldKg)
                : null,
            satisfactionScore: item.satisfactionScore ?? null,
            applicationRate: item.applicationRate ?? null,
          })),
        });
      }
    }

    // 5. Sync Followup Results
    if (input.followupResults !== undefined) {
      await tx.activityResultFollowupItem.deleteMany({
        where: { activityResultId: result.id },
      });
      if (input.followupResults.length > 0) {
        await tx.activityResultFollowupItem.createMany({
          data: input.followupResults.map((item) => ({
            activityResultId: result.id,
            storeId: item.storeId ?? null,
            productId: item.productId,
            productName: item.productName ?? null,
            usageResult: item.usageResult ?? null,
            followupDetail: item.followupDetail ?? null,
            problemDetail: item.problemDetail ?? null,
            isAdditional: Boolean(item.isAdditional),
          })),
        });
      }
    }

    // 6. Sync Issue Results (TYPE_6)
    const clientIssueMap = new Map<string, string>();
    if (input.issueResults !== undefined) {
      await tx.activityResultIssueItem.deleteMany({
        where: { activityResultId: result.id },
      });
      if (input.issueResults.length > 0) {
        const issueItemsToCreate = input.issueResults.map((item) => {
          const dbId = randomUUID();
          if (item.id) {
            clientIssueMap.set(item.id, dbId);
          }
          return {
            id: dbId,
            activityResultId: result.id,
            productId: item.productId ?? null,
            productName: item.productName ?? null,
            lotNumber: item.lotNumber ?? null,
            purchaseChannel: item.purchaseChannel,
            storeId: item.storeId ?? null,
            storeName: item.storeName ?? null,
            issueType: item.issueType,
            detail: item.detail ?? null,
            status: item.status || "เสร็จสิ้น",
          };
        });

        await tx.activityResultIssueItem.createMany({
          data: issueItemsToCreate,
        });
      }
    }

    // 6.1. Process TYPE_13 Plots (Existing Update & New On-the-fly Discovery)
    const clientPlotMap = new Map<string, string>();

    // 6.1.1. Validate and Create New TYPE_13 Plots discovered on-the-fly
    if (input.type13NewPlots && input.type13NewPlots.length > 0) {
      // Validate uniqueness of clientPlotId
      const seenClientPlotIds = new Set<string>();
      for (const newPlotItem of input.type13NewPlots) {
        if (!newPlotItem.clientPlotId) {
          throw new Error("TYPE_13 new plot missing clientPlotId");
        }
        if (seenClientPlotIds.has(newPlotItem.clientPlotId)) {
          throw new Error(
            `Duplicate clientPlotId: ${newPlotItem.clientPlotId}`,
          );
        }
        seenClientPlotIds.add(newPlotItem.clientPlotId);

        // Latitude & Longitude validation
        const latNum = Number(newPlotItem.latitude);
        const lngNum = Number(newPlotItem.longitude);
        if (
          newPlotItem.latitude == null ||
          newPlotItem.longitude == null ||
          newPlotItem.latitude === "" ||
          newPlotItem.longitude === "" ||
          isNaN(latNum) ||
          isNaN(lngNum)
        ) {
          throw new Error(
            `New plot "${newPlotItem.plotName || newPlotItem.clientPlotId}" has invalid or missing coordinates`,
          );
        }
      }

      // Fetch activity plan for employeeId and startDate
      const plan = await tx.activityPlan.findUnique({
        where: { id: input.activityPlanId },
        select: {
          employeeId: true,
          startDate: true,
        },
      });

      const existingType13Visits = await tx.demoPlotVisit.findMany({
        where: {
          activityPlanId: input.activityPlanId,
          workTypeCode: "TYPE_13",
        },
        orderBy: { createdAt: "asc" },
      });

      // Filter out visits whose demoPlotId is already claimed by type13PlotsActual
      const claimedPlotIds = new Set(
        (input.type13PlotsActual || [])
          .map((p) => p.demoPlotId)
          .filter(Boolean),
      );

      const unclaimedVisits = existingType13Visits.filter(
        (v) => v.demoPlotId && !claimedPlotIds.has(v.demoPlotId),
      );

      for (let i = 0; i < input.type13NewPlots.length; i++) {
        const item = input.type13NewPlots[i];
        let targetPlotId: string;

        if (i < unclaimedVisits.length && unclaimedVisits[i].demoPlotId) {
          targetPlotId = unclaimedVisits[i].demoPlotId;
          const updateData: any = {
            latitude: new Prisma.Decimal(item.latitude),
            longitude: new Prisma.Decimal(item.longitude),
          };
          if (item.plotName && item.plotName.trim()) {
            updateData.name = item.plotName.trim();
          }
          if (item.storeId && item.storeId.trim()) {
            updateData.customerId = item.storeId.trim();
          }
          if (item.province && item.province.trim()) {
            updateData.province = item.province.trim();
          }
          if (item.district && item.district.trim()) {
            updateData.district = item.district.trim();
          }
          await tx.demoPlot.update({
            where: { id: targetPlotId },
            data: updateData,
          });

          await tx.activityPlanType13Plot.updateMany({
            where: { demoPlotId: targetPlotId },
            data: {
              latitude: new Prisma.Decimal(item.latitude),
              longitude: new Prisma.Decimal(item.longitude),
              ...(item.plotName && item.plotName.trim() ? { plotName: item.plotName.trim() } : {}),
              ...(item.storeId && item.storeId.trim() ? { storeId: item.storeId.trim() } : {}),
              ...(item.province && item.province.trim() ? { province: item.province.trim() } : {}),
              ...(item.district && item.district.trim() ? { district: item.district.trim() } : {}),
            },
          });
        } else {
          const code = await generateDemoPlotCode(
            tx,
            plan?.startDate ? new Date(plan.startDate) : new Date(),
            i,
          );

          const createdPlot = await tx.demoPlot.create({
            data: {
              code,
              name:
                item.plotName && item.plotName.trim()
                  ? item.plotName.trim()
                  : "แปลงแฮตแทค",
              ownerName: "",
              customerId:
                item.storeId && item.storeId.trim() ? item.storeId.trim() : null,
              employeeId: plan?.employeeId || "emp-system",
              province:
                item.province && item.province.trim()
                  ? item.province.trim()
                  : null,
              district:
                item.district && item.district.trim()
                  ? item.district.trim()
                  : null,
              plotType: "HATTACK",
              startDate: plan?.startDate || input.actualStartDate || new Date(),
              latitude: new Prisma.Decimal(item.latitude),
              longitude: new Prisma.Decimal(item.longitude),
              status: DemoPlotStatus.IN_PROGRESS,
            },
          });
          targetPlotId = createdPlot.id;

          // If ActivityPlanType13 exists, also link to ActivityPlanType13Plot
          const t13 = await tx.activityPlanType13.findUnique({
            where: { activityPlanId: input.activityPlanId },
            include: { plots: { select: { id: true, plotIndex: true } } },
          });
          if (t13) {
            const maxIndex = t13.plots.reduce(
              (max, p) => Math.max(max, p.plotIndex),
              0,
            );
            await tx.activityPlanType13Plot.create({
              data: {
                type13Id: t13.id,
                plotIndex: maxIndex + 1,
                plotName:
                  item.plotName && item.plotName.trim()
                    ? item.plotName.trim()
                    : `แปลงแฮตแทค ${maxIndex + 1}`,
                storeId:
                  item.storeId && item.storeId.trim()
                    ? item.storeId.trim()
                    : null,
                province:
                  item.province && item.province.trim()
                    ? item.province.trim()
                    : null,
                district:
                  item.district && item.district.trim()
                    ? item.district.trim()
                    : null,
                latitude: new Prisma.Decimal(item.latitude),
                longitude: new Prisma.Decimal(item.longitude),
                demoPlotId: targetPlotId,
              },
            });
          }

          const existingVisit = await tx.demoPlotVisit.findFirst({
            where: {
              demoPlotId: targetPlotId,
              activityPlanId: input.activityPlanId,
            },
          });
          if (!existingVisit) {
            await tx.demoPlotVisit.create({
              data: {
                demoPlotId: targetPlotId,
                activityPlanId: input.activityPlanId,
                workTypeCode: "TYPE_13",
                visitNumber: 1,
                visitDate: input.actualStartDate || plan?.startDate || new Date(),
              },
            });
          }
        }

        clientPlotMap.set(item.clientPlotId, targetPlotId);
      }
    }

    // 6.1.2. Update Existing TYPE_13 Plots GPS coordinates & Plot Name & Dealer
    if (input.type13PlotsActual && input.type13PlotsActual.length > 0) {
      for (const plotItem of input.type13PlotsActual) {
        if (plotItem.demoPlotId) {
          const updateData: any = {};
          if (
            plotItem.latitude != null &&
            plotItem.latitude !== "" &&
            plotItem.longitude != null &&
            plotItem.longitude !== ""
          ) {
            updateData.latitude = new Prisma.Decimal(plotItem.latitude);
            updateData.longitude = new Prisma.Decimal(plotItem.longitude);
          }
          if (plotItem.plotName && plotItem.plotName.trim() !== "") {
            updateData.name = plotItem.plotName.trim();
          }
          if (plotItem.storeId && plotItem.storeId.trim() !== "") {
            updateData.customerId = plotItem.storeId.trim();
          }
          if (plotItem.province && plotItem.province.trim() !== "") {
            updateData.province = plotItem.province.trim();
          }
          if (plotItem.district && plotItem.district.trim() !== "") {
            updateData.district = plotItem.district.trim();
          }
          if (Object.keys(updateData).length > 0) {
            await tx.demoPlot.update({
              where: { id: plotItem.demoPlotId },
              data: updateData,
            });

            await tx.activityPlanType13Plot.updateMany({
              where: { demoPlotId: plotItem.demoPlotId },
              data: {
                ...(updateData.latitude ? { latitude: updateData.latitude } : {}),
                ...(updateData.longitude ? { longitude: updateData.longitude } : {}),
                ...(plotItem.plotName && plotItem.plotName.trim() ? { plotName: plotItem.plotName.trim() } : {}),
                ...(plotItem.storeId && plotItem.storeId.trim() ? { storeId: plotItem.storeId.trim() } : {}),
                ...(plotItem.province && plotItem.province.trim() ? { province: plotItem.province.trim() } : {}),
                ...(plotItem.district && plotItem.district.trim() ? { district: plotItem.district.trim() } : {}),
              },
            });
          }
        }
      }
    }

    // 6.2. Sync Spraying Rounds (TYPE_7B / TYPE_13)
    if (input.sprayRounds !== undefined) {
      await tx.activityResultSprayRound.deleteMany({
        where: { activityResultId: result.id },
      });
      if (input.sprayRounds.length > 0) {
        for (const round of input.sprayRounds) {
          let targetPlotId = round.demoPlotId || (round as any).clientPlotId;
          if (targetPlotId && clientPlotMap.has(targetPlotId)) {
            targetPlotId = clientPlotMap.get(targetPlotId)!;
          } else if (
            targetPlotId &&
            (targetPlotId.startsWith("temp-") ||
              targetPlotId.startsWith("client-"))
          ) {
            throw new Error(
              `Unable to resolve TYPE_13 client plot ID: ${targetPlotId}`,
            );
          }

          if (!targetPlotId || !targetPlotId.trim()) {
            const planRel = await tx.activityPlan.findUnique({
              where: { id: input.activityPlanId },
              select: {
                demoPlotVisits: { select: { demoPlotId: true }, take: 1 },
                type7b: {
                  select: { plots: { select: { demoPlotId: true }, take: 1 } },
                },
              },
            });
            targetPlotId =
              planRel?.demoPlotVisits?.[0]?.demoPlotId ||
              planRel?.type7b?.plots?.[0]?.demoPlotId ||
              "";
          }

          if (!targetPlotId || !targetPlotId.trim()) {
            throw new Error("Spray round is missing demoPlotId");
          }

          const createdRound = await tx.activityResultSprayRound.create({
            data: {
              activityResultId: result.id,
              demoPlotId: targetPlotId,
              roundNumber: round.roundNumber,
              sprayDate: round.sprayDate
                ? new Date(round.sprayDate)
                : new Date(),
              sprayMethod: round.sprayMethod || "FOLLOW_UP",
              sprayEquipment: round.sprayEquipment || "FOLLOW_UP",
              otherEquipment: round.otherEquipment ?? null,
              productResponse: round.productResponse,
              problemDetail: round.problemDetail ?? null,
              daysSinceStart:
                round.daysSinceStart != null
                  ? Number(round.daysSinceStart)
                  : null,
              notes: round.notes ?? null,
              workTypeCode: round.workTypeCode ?? null,
              products: {
                create: (round.products || []).map((p: any) => ({
                  productId: p.productId,
                  productName: p.productName ?? null,
                  baselineRate: p.baselineRate ?? null,
                  actualRate: p.actualRate,
                  quantityUsed: new Prisma.Decimal(Number(p.quantityUsed) || 0),
                  unit: p.unit ?? null,
                  detail: p.detail ?? null,
                })),
              },
              externalProducts: {
                create: (round.externalProducts || []).map((ep: any) => ({
                  company: ep.company,
                  productName: ep.productName,
                  activeIngredient: ep.activeIngredient ?? null,
                  formula: ep.formula,
                  customFormula: ep.customFormula ?? null,
                  applicationRate: ep.applicationRate,
                })),
              },
            },
          });

          // Update or create DemoPlotVisit for TYPE_14 (per round)
          if (round.workTypeCode === "TYPE_14") {
            const existingVisit = await tx.demoPlotVisit.findFirst({
              where: {
                activityPlanId: input.activityPlanId,
                demoPlotId: targetPlotId,
                visitNumber: round.roundNumber || 1,
              },
            });
            if (existingVisit) {
              await tx.demoPlotVisit.update({
                where: { id: existingVisit.id },
                data: {
                  workTypeCode: "TYPE_14",
                  visitDate: round.sprayDate
                    ? new Date(round.sprayDate)
                    : new Date(),
                  daysSinceStart:
                    round.daysSinceStart != null
                      ? Number(round.daysSinceStart)
                      : (existingVisit.daysSinceStart ?? 0),
                  productResponse: round.productResponse ?? null,
                  notes: round.notes ?? null,
                },
              });
            } else {
              await tx.demoPlotVisit.create({
                data: {
                  activityPlanId: input.activityPlanId,
                  demoPlotId: targetPlotId,
                  workTypeCode: "TYPE_14",
                  visitNumber: round.roundNumber || 1,
                  visitDate: round.sprayDate
                    ? new Date(round.sprayDate)
                    : new Date(),
                  daysSinceStart:
                    round.daysSinceStart != null
                      ? Number(round.daysSinceStart)
                      : 0,
                  productResponse: round.productResponse ?? null,
                  notes: round.notes ?? null,
                },
              });
            }
          }

          // Link attachments for this spraying round if any
          if (round.attachments && round.attachments.length > 0) {
            await tx.activityAttachment.createMany({
              data: round.attachments.map((att: any) => ({
                activityPlanId: input.activityPlanId,
                activityResultId: result.id,
                workTypeCode: round.workTypeCode || "TYPE_7B",
                demoPlotId: targetPlotId,
                sprayRoundId: createdRound.id,
                category: AttachmentCategory.PLOT,
                fileUrl: att.fileUrl,
                fileName: att.fileName || "spray-round-photo.jpg",
                fileSize: att.fileSize ?? null,
                mimeType: att.mimeType ?? null,
              })),
            });
          }
        }
      }
    }

    // 6.5. Sync TYPE_7A Demo Plot Initial Data (Rule 11: Persistence Architecture)
    let createdDemoPlotId: string | null = null;
    if (input.type7aDemoPlot) {
      const demoData = input.type7aDemoPlot;
      const plan = await tx.activityPlan.findUnique({
        where: { id: input.activityPlanId },
        select: {
          employeeId: true,
          stores: { select: { storeId: true } },
          demoPlotVisits: {
            where: { visitNumber: 1 },
            include: { demoPlot: true },
            take: 1,
          },
          type7aPlots: {
            include: { demoPlot: true },
            take: 1,
          },
        },
      });

      let existingPlot =
        plan?.type7aPlots?.[0]?.demoPlot ||
        plan?.demoPlotVisits?.[0]?.demoPlot ||
        null;
      if (!existingPlot) {
        const earliestVisit = await tx.demoPlotVisit.findFirst({
          where: { activityPlanId: input.activityPlanId },
          orderBy: [{ visitNumber: "asc" }, { createdAt: "asc" }],
          include: { demoPlot: true },
        });
        existingPlot = earliestVisit?.demoPlot || null;
      }
      if (!existingPlot) {
        existingPlot = await tx.demoPlot.findFirst({
          where: {
            OR: [
              { visits: { some: { activityPlanId: input.activityPlanId } } },
              { type7aPlots: { some: { activityPlanId: input.activityPlanId } } },
              {
                name: demoData.plotName,
                ownerName: demoData.ownerName,
                deletedAt: null,
              },
            ],
          },
        });
      }

      let plotId: string;
      const validDemoProducts = (demoData.demoProducts || []).filter(
        (p) =>
          p.productId &&
          p.productId.trim() &&
          p.productId !== "prod-default",
      );
      const primaryProduct = validDemoProducts[0];
      if (existingPlot) {
        plotId = existingPlot.id;

        // Guards: Do not overwrite existing plot data with empty, null, or undefined values from actualData
        const resolvedCropCategory =
          demoData.cropCategory &&
          demoData.cropCategory.trim() !== "" &&
          demoData.cropCategory !== "พืชทั่วไป"
            ? demoData.cropCategory.trim()
            : existingPlot.cropCategory || null;

        const resolvedCropName =
          demoData.cropName &&
          demoData.cropName.trim() !== "" &&
          demoData.cropName !== "พืชทั่วไป"
            ? demoData.cropName.trim()
            : existingPlot.cropName || null;

        const resolvedCustomCropName =
          demoData.customCropName && demoData.customCropName.trim() !== ""
            ? demoData.customCropName.trim()
            : existingPlot.customCropName ?? null;

        let resolvedAreaRai = existingPlot.areaRai ?? null;
        if (demoData.areaRai != null && (typeof demoData.areaRai !== "string" || demoData.areaRai !== "")) {
          const num = Number(demoData.areaRai);
          if (!isNaN(num) && num > 0) {
            resolvedAreaRai = new Prisma.Decimal(num);
          } else if (existingPlot.areaRai == null && !isNaN(num)) {
            resolvedAreaRai = new Prisma.Decimal(num);
          }
        }

        let resolvedTreeCount = existingPlot.treeCount ?? null;
        if (demoData.treeCount != null && (typeof demoData.treeCount !== "string" || demoData.treeCount !== "")) {
          const num = Number(demoData.treeCount);
          if (!isNaN(num) && num > 0) {
            resolvedTreeCount = num;
          } else if (existingPlot.treeCount == null && !isNaN(num)) {
            resolvedTreeCount = num;
          }
        }

        const resolvedPlotName =
          demoData.plotName && demoData.plotName.trim() !== ""
            ? demoData.plotName.trim()
            : existingPlot.name;

        const resolvedOwnerName =
          demoData.ownerName && demoData.ownerName.trim() !== ""
            ? demoData.ownerName.trim()
            : existingPlot.ownerName;

        const resolvedProvince =
          demoData.province && demoData.province.trim() !== ""
            ? demoData.province.trim()
            : existingPlot.province;

        const resolvedDistrict =
          demoData.district && demoData.district.trim() !== ""
            ? demoData.district.trim()
            : existingPlot.district ?? null;

        const resolvedObjective =
          demoData.objective && demoData.objective.trim() !== ""
            ? demoData.objective.trim()
            : existingPlot.objective || null;

        const resolvedExperimentDetail =
          demoData.experimentDetail && demoData.experimentDetail.trim() !== ""
            ? demoData.experimentDetail.trim()
            : existingPlot.experimentDetail || null;

        await tx.demoPlot.update({
          where: { id: plotId },
          data: {
            name: resolvedPlotName,
            ownerName: resolvedOwnerName,
            ownerPhone: demoData.ownerPhone ?? existingPlot.ownerPhone ?? null,
            ownerProvince: demoData.ownerProvince ?? existingPlot.ownerProvince ?? null,
            ownerDistrict: demoData.ownerDistrict ?? existingPlot.ownerDistrict ?? null,
            isUnregisteredFarmer: demoData.isUnregisteredFarmer ?? existingPlot.isUnregisteredFarmer,
            farmerCustomerId: demoData.farmerCustomerId ?? existingPlot.farmerCustomerId ?? null,
            province: resolvedProvince,
            district: resolvedDistrict,
            latitude:
              demoData.latitude != null && !isNaN(Number(demoData.latitude)) && Number(demoData.latitude) !== 0
                ? new Prisma.Decimal(demoData.latitude)
                : existingPlot.latitude ?? new Prisma.Decimal(demoData.latitude ?? 0),
            longitude:
              demoData.longitude != null && !isNaN(Number(demoData.longitude)) && Number(demoData.longitude) !== 0
                ? new Prisma.Decimal(demoData.longitude)
                : existingPlot.longitude ?? new Prisma.Decimal(demoData.longitude ?? 0),
            cropCategory: resolvedCropCategory,
            cropName: resolvedCropName,
            customCropName: resolvedCustomCropName,
            areaRai: resolvedAreaRai,
            treeCount: resolvedTreeCount,
            objective: resolvedObjective,
            experimentDetail: resolvedExperimentDetail,
            mainCropInfo: demoData.mainCropInfo ?? existingPlot.mainCropInfo ?? null,
            plantingDate: demoData.plantingDate ?? existingPlot.plantingDate ?? null,
            initialSprayDate: demoData.initialSprayDate ?? existingPlot.initialSprayDate ?? null,
            nextSprayDate: demoData.nextSprayDate ?? existingPlot.nextSprayDate ?? null,
            sprayMethod: demoData.sprayMethod ?? existingPlot.sprayMethod,
            hasExternalChemicals: demoData.hasExternalChemicals ?? existingPlot.hasExternalChemicals,
            usageMethod: demoData.usageMethod ?? existingPlot.usageMethod ?? null,
            notes: demoData.notes ?? existingPlot.notes ?? null,
            primaryProductName: primaryProduct?.productName || existingPlot.primaryProductName || null,
            primaryProductId: primaryProduct?.productId || existingPlot.primaryProductId || null,
          },
        });
      } else {
        const code = await generateDemoPlotCode(
          tx,
          demoData.initialSprayDate
            ? new Date(demoData.initialSprayDate)
            : demoData.plantingDate
              ? new Date(demoData.plantingDate)
              : new Date(),
        );

        const newPlot = await tx.demoPlot.create({
          data: {
            code,
            name: demoData.plotName,
            ownerName: demoData.ownerName,
            ownerPhone: demoData.ownerPhone ?? null,
            ownerProvince: demoData.ownerProvince ?? null,
            ownerDistrict: demoData.ownerDistrict ?? null,
            isUnregisteredFarmer: demoData.isUnregisteredFarmer,
            customerId:
              demoData.customerId || plan?.stores?.[0]?.storeId || null,
            farmerCustomerId: demoData.farmerCustomerId ?? null,
            employeeId: plan?.employeeId || "emp-system",
            province: demoData.province,
            district: demoData.district ?? null,
            latitude: new Prisma.Decimal(demoData.latitude),
            longitude: new Prisma.Decimal(demoData.longitude),
            cropCategory: demoData.cropCategory,
            cropName: demoData.cropName,
            customCropName: demoData.customCropName ?? null,
            areaRai:
              demoData.areaRai != null
                ? new Prisma.Decimal(demoData.areaRai)
                : null,
            treeCount: demoData.treeCount ?? null,
            objective: demoData.objective ?? null,
            experimentDetail: demoData.experimentDetail ?? null,
            mainCropInfo: demoData.mainCropInfo ?? null,
            startDate:
              demoData.initialSprayDate || demoData.plantingDate || new Date(),
            plantingDate: demoData.plantingDate ?? null,
            initialSprayDate: demoData.initialSprayDate ?? null,
            nextSprayDate: demoData.nextSprayDate ?? null,
            sprayMethod: demoData.sprayMethod,
            hasExternalChemicals: demoData.hasExternalChemicals,
            usageMethod: demoData.usageMethod ?? null,
            notes: demoData.notes ?? null,
            primaryProductName: primaryProduct?.productName || null,
            primaryProductId: primaryProduct?.productId || null,
            status: DemoPlotStatus.IN_PROGRESS,
          },
        });
        plotId = newPlot.id;
      }
      createdDemoPlotId = plotId;

      // Link DemoPlot to ActivityPlanType7a
      await tx.activityPlanType7a.updateMany({
        where: { activityPlanId: input.activityPlanId },
        data: { demoPlotId: plotId },
      });

      // Save DemoPlotProduct (Single Source of Truth for applicationRate)
      await tx.demoPlotProduct.deleteMany({ where: { demoPlotId: plotId } });
      if (validDemoProducts.length > 0) {
        // Guard against invalid/non-existent product IDs to satisfy Foreign Key constraints
        const candidateIds = validDemoProducts
          .map((p) => p.productId)
          .filter(Boolean);
        const existingDbProducts = await tx.product.findMany({
          where: { id: { in: candidateIds } },
          select: { id: true, name: true },
        });
        const existingDbProductMap = new Map(
          existingDbProducts.map((p) => [p.id, p]),
        );

        // Also try to resolve products by name if candidate productId was not found in DB
        const missingProducts = validDemoProducts.filter(
          (p) => !existingDbProductMap.has(p.productId) && p.productName,
        );
        if (missingProducts.length > 0) {
          const namesToFind = missingProducts
            .map((p) => p.productName!)
            .filter(Boolean);
          if (namesToFind.length > 0) {
            const matchedByName = await tx.product.findMany({
              where: { name: { in: namesToFind } },
              select: { id: true, name: true },
            });
            for (const dbp of matchedByName) {
              existingDbProductMap.set(dbp.id, dbp);
              for (const vp of validDemoProducts) {
                if (vp.productName === dbp.name) {
                  vp.productId = dbp.id;
                }
              }
            }
          }
        }

        const insertableProducts = validDemoProducts.filter((p) =>
          existingDbProductMap.has(p.productId),
        );

        if (insertableProducts.length > 0) {
          await tx.demoPlotProduct.createMany({
            data: insertableProducts.map((p, idx) => ({
              demoPlotId: plotId,
              productId: p.productId,
              productName: p.productName ?? null,
              quantity: new Prisma.Decimal(p.quantity),
              remainingQuantity:
                p.remainingQuantity != null
                  ? new Prisma.Decimal(p.remainingQuantity)
                  : null,
              unit: p.unit ?? null,
              applicationRate: p.applicationRate,
              sortOrder: idx,
            })),
          });
        }
      }

      // Save DemoPlotExternalProduct
      await tx.demoPlotExternalProduct.deleteMany({
        where: { demoPlotId: plotId },
      });
      if (
        demoData.sprayMethod === "TANK_MIXED" &&
        demoData.hasExternalChemicals &&
        demoData.externalProducts &&
        demoData.externalProducts.length > 0
      ) {
        await tx.demoPlotExternalProduct.createMany({
          data: demoData.externalProducts.slice(0, 4).map((ep, idx) => ({
            demoPlotId: plotId,
            company: ep.company,
            productName: ep.productName,
            activeIngredient: ep.activeIngredient ?? null,
            formula: ep.formula,
            customFormula:
              ep.formula === "อื่นๆ" ? (ep.customFormula ?? null) : null,
            applicationRate: ep.applicationRate,
            sortOrder: idx,
          })),
        });
      }

      // Save DemoPlotIrrigation (1:N normalized)
      await tx.demoPlotIrrigation.deleteMany({ where: { demoPlotId: plotId } });
      if (demoData.irrigations && demoData.irrigations.length > 0) {
        const uniqueMethods = Array.from(new Set(demoData.irrigations));
        await tx.demoPlotIrrigation.createMany({
          data: uniqueMethods.map((m) => ({
            demoPlotId: plotId,
            method: m,
          })),
        });
      }

      // Create / Update DemoPlotVisit #1
      const existingVisit1 = await tx.demoPlotVisit.findFirst({
        where: {
          demoPlotId: plotId,
          activityPlanId: input.activityPlanId,
        },
      });

      const visitDate =
        demoData.initialSprayDate ||
        demoData.plantingDate ||
        input.actualStartDate ||
        new Date();
      if (existingVisit1) {
        await tx.demoPlotVisit.update({
          where: { id: existingVisit1.id },
          data: {
            visitDate,
            cropAgeValue: demoData.cropAgeValue ?? null,
            cropAgeUnit: demoData.cropAgeUnit || "วัน",
            growthStage: demoData.growthStage ?? null,
            cropCondition: demoData.cropCondition ?? null,
            productResponse: demoData.productResponse ?? null,
            usageMethod: demoData.usageMethod ?? null,
            notes: demoData.notes ?? null,
            sprayMethod: demoData.sprayMethod ?? null,
            sprayEquipment: demoData.sprayEquipment ?? null,
            otherEquipment: demoData.otherEquipment ?? null,
          },
        });
      } else {
        await tx.demoPlotVisit.create({
          data: {
            demoPlotId: plotId,
            activityPlanId: input.activityPlanId,
            visitNumber: 1,
            visitDate,
            daysSinceStart: 0,
            cropAgeValue: demoData.cropAgeValue ?? null,
            cropAgeUnit: demoData.cropAgeUnit || "วัน",
            growthStage: demoData.growthStage ?? null,
            cropCondition: demoData.cropCondition ?? null,
            productResponse: demoData.productResponse ?? null,
            usageMethod: demoData.usageMethod ?? null,
            notes: demoData.notes ?? null,
            sprayMethod: demoData.sprayMethod ?? null,
            sprayEquipment: demoData.sprayEquipment ?? null,
            otherEquipment: demoData.otherEquipment ?? null,
          },
        });
      }
    }

    // 7. Sync Attachments
    if (input.attachments !== undefined) {
      await tx.activityAttachment.deleteMany({
        where: {
          activityResultId: result.id,
          sprayRoundId: null,
        },
      });
      if (input.attachments.length > 0) {
        const existingSurveyItems = await tx.activityResultSurveyItem.findMany({
          where: { activityResultId: result.id },
          select: { id: true },
        });
        const validSurveyItemIds = new Set(
          existingSurveyItems.map((s) => s.id),
        );

        const existingIssueItems = await tx.activityResultIssueItem.findMany({
          where: { activityResultId: result.id },
          select: { id: true },
        });
        const validIssueItemIds = new Set(existingIssueItems.map((s) => s.id));

        await tx.activityAttachment.createMany({
          data: input.attachments.map((att) => ({
            activityPlanId: input.activityPlanId,
            activityResultId: result.id,
            workTypeCode: att.workTypeCode
              ? getWorkTypeCode(att.workTypeCode)
              : null,
            storeId: att.storeId ?? null,
            productId: att.productId ?? null,
            surveyItemId: (() => {
              let sId = att.surveyItemId;
              if (sId && clientSurveyMap.has(sId)) {
                sId = clientSurveyMap.get(sId);
              }
              if (
                !sId &&
                clientSurveyMap.size === 1 &&
                (att.category === AttachmentCategory.SURVEY_BOTTLE ||
                  att.category === AttachmentCategory.SURVEY_PROMO_MATERIAL)
              ) {
                sId = clientSurveyMap.values().next().value;
              }
              return sId && validSurveyItemIds.has(sId)
                ? sId
                : null;
            })(),
            issueItemId: (() => {
              let issueId = att.issueItemId;
              if (issueId && clientIssueMap.has(issueId)) {
                issueId = clientIssueMap.get(issueId);
              }
              return issueId && validIssueItemIds.has(issueId)
                ? issueId
                : null;
            })(),
            demoPlotId: (() => {
              let plotId = att.demoPlotId || (att as any).clientPlotId;
              if (plotId && clientPlotMap.has(plotId)) {
                plotId = clientPlotMap.get(plotId);
              } else if (
                plotId &&
                (plotId.startsWith("temp-") || plotId.startsWith("client-"))
              ) {
                throw new Error(
                  `Unable to resolve attachment client plot ID: ${plotId}`,
                );
              }
              return (
                plotId ||
                (att.workTypeCode === "TYPE_7A" ||
                att.workTypeCode === "ทำแปลงสาธิต"
                  ? createdDemoPlotId
                  : null)
              );
            })(),
            category: att.category ?? AttachmentCategory.GENERAL,
            fileUrl: att.fileUrl,
            fileName: att.fileName,
            fileSize: att.fileSize ?? null,
            mimeType: att.mimeType ?? null,
          })),
        });
      }
    }

    // Audit Logging in the same transaction
    const actorUserId = input.recordedById;
    if (actorUserId) {
      if (isFirstTime) {
        // 6 & 10. First time recording: RECORD_ACTUAL
        await tx.activityResultLog.create({
          data: {
            activityResultId: result.id,
            userId: actorUserId,
            action: ActivityResultAction.RECORD_ACTUAL,
            previousStatus: null,
            newStatus: result.resultStatus,
            comment: "บันทึกผลการทำกิจกรรม",
          },
        });
      } else {
        // 7 & 9. Editing existing: UPDATE_ACTUAL
        await tx.activityResultLog.create({
          data: {
            activityResultId: result.id,
            userId: actorUserId,
            action: ActivityResultAction.UPDATE_ACTUAL,
            previousStatus: oldStatus,
            newStatus: result.resultStatus,
            comment: "แก้ไขผลการทำกิจกรรม",
          },
        });

        // 8. If status changed: additionally create CHANGE_ACTUAL_STATUS
        if (isStatusChanged) {
          await tx.activityResultLog.create({
            data: {
              activityResultId: result.id,
              userId: actorUserId,
              action: ActivityResultAction.CHANGE_ACTUAL_STATUS,
              previousStatus: oldStatus,
              newStatus: result.resultStatus,
              comment: "เปลี่ยนสถานะผลการทำกิจกรรม",
            },
          });
        }
      }
    }

    return result;
  };

  if (txClient) {
    return handler(txClient);
  }
  return db.$transaction(handler);
}
