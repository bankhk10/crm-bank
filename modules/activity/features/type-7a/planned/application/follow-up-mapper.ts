import type { DemoPlotStatus } from "@prisma/client";

export interface PlotFollowUpProduct {
  name: string;
  quantity?: number | string | null;
  unit?: string | null;
  rate?: string | null;
  isAdditional?: boolean;
  extraDetail?: string | null;
}

export interface PlotFollowUpExternalProduct {
  company?: string | null;
  productName: string;
  formula?: string | null;
  applicationRate?: string | null;
}

export interface PlotFollowUpPhoto {
  id?: string;
  url: string;
  name?: string;
}

export interface PlotFollowUpItem {
  id: string;
  visitNumber: number;
  visitDate: Date | string | null;
  daysSinceStart?: number | null;
  planId?: string | null;
  planCode?: string | null;
  planTitle?: string | null;
  planStatus?: string | null;
  employeeName?: string | null;
  workTypeCode?: string | null;
  isPlannedOnly?: boolean;

  // Plant & Condition
  cropCondition?: string | null;
  cropProblemDesc?: string | null;
  growthStage?: string | null;
  cropAgeValue?: number | null;
  cropAgeUnit?: string | null;
  productResponse?: string | null;
  productProblemDesc?: string | null;

  // Spray & Chemicals
  sprayMethod?: string | null;
  sprayEquipment?: string | null;
  otherEquipment?: string | null;
  sprayRoundsCount?: number;
  sprayProducts: PlotFollowUpProduct[];
  externalProducts: PlotFollowUpExternalProduct[];

  // Photos
  photos: PlotFollowUpPhoto[];
  notes?: string | null;

  // Closure
  isClosure?: boolean;
}

export interface PlotFollowUpTimelineResult {
  plotId: string;
  plotCode?: string | null;
  plotName: string;
  plotStatus: string;
  totalVisits: number;
  totalPlans: number;
  latestVisitDate: Date | string | null;
  nextSprayDate?: Date | string | null;
  closedDate?: Date | string | null;
  closureStats?: {
    demoYieldKg?: number | null;
    controlYieldKg?: number | null;
    yieldIncreasePercent?: number | null;
    farmerSatisfaction?: number | null;
    commercialPotential?: string | null;
    finalHarvestDate?: Date | string | null;
    finalSummaryNotes?: string | null;
  } | null;
  timeline: PlotFollowUpItem[];
}

/**
 * Extracts and synthesizes a chronological follow-up timeline for a given demo plot.
 * Combines visits (DemoPlotVisit), planned follow-up plans (ActivityPlanType7bPlot),
 * and spraying rounds (ActivityResultSprayRound) with cross-plan linkage.
 */
export function extractPlotFollowUpTimeline(demoPlot: any): PlotFollowUpTimelineResult {
  if (!demoPlot) {
    return {
      plotId: "",
      plotName: "",
      plotStatus: "IN_PROGRESS",
      totalVisits: 0,
      totalPlans: 0,
      latestVisitDate: null,
      timeline: [],
    };
  }

  const plotId: string = demoPlot.id || "";
  const plotCode: string = demoPlot.code || "";
  const plotName: string = demoPlot.name || demoPlot.plotName || "แปลงสาธิต";
  const plotStatus: string = demoPlot.status || "IN_PROGRESS";
  const closedDate = demoPlot.closedDate || null;
  const nextSprayDate = demoPlot.nextSprayDate || null;

  const rawVisits: any[] = Array.isArray(demoPlot.visits) && demoPlot.visits.length > 0
    ? demoPlot.visits
    : Array.isArray(demoPlot.type7bResults) && demoPlot.type7bResults.length > 0
    ? demoPlot.type7bResults
    : [];
  const rawType7bPlots: any[] = Array.isArray(demoPlot.type7bPlots) && demoPlot.type7bPlots.length > 0
    ? demoPlot.type7bPlots
    : Array.isArray(demoPlot.type7bTargets) && demoPlot.type7bTargets.length > 0
    ? demoPlot.type7bTargets
    : [];
  const rawSprayRounds: any[] = Array.isArray(demoPlot.sprayRounds) ? demoPlot.sprayRounds : [];

  const timelineItems: PlotFollowUpItem[] = [];
  const visitedPlanIds = new Set<string>();

  // 1. Process actual visits (DemoPlotVisit)
  rawVisits.forEach((visit: any, idx: number) => {
    const plan = visit.activityPlan || {};
    if (plan.id) visitedPlanIds.add(plan.id);

    // Photos gathering
    const photos: PlotFollowUpPhoto[] = [];
    const photoUrls = new Set<string>();

    const addPhoto = (url?: string, name?: string, id?: string) => {
      if (url && !photoUrls.has(url)) {
        photoUrls.add(url);
        photos.push({ id, url, name: name || "ภาพถ่ายติดตามแปลง" });
      }
    };

    if (Array.isArray(visit.cropImageUrls)) {
      visit.cropImageUrls.forEach((u: string) => addPhoto(u, "ภาพสภาพพืช"));
    }
    if (Array.isArray(visit.plotImageUrls)) {
      visit.plotImageUrls.forEach((u: string) => addPhoto(u, "ภาพสภาพแปลง"));
    }
    if (Array.isArray(visit.imageUrls)) {
      visit.imageUrls.forEach((u: string) => addPhoto(u, "ภาพถ่ายหน้างาน"));
    }
    if (Array.isArray(visit.attachments)) {
      visit.attachments.forEach((att: any) =>
        addPhoto(att.fileUrl || att.url, att.fileName || att.name, att.id),
      );
    }

    // Match spraying rounds for this plot and visit date / plan
    const matchedRounds = Array.isArray(visit.sprayRounds) && visit.sprayRounds.length > 0
      ? visit.sprayRounds
      : rawSprayRounds.filter((r: any) => {
      if (visit.activityPlanId && r.activityResult?.activityPlanId) {
        return r.activityResult.activityPlanId === visit.activityPlanId;
      }
      return false;
    });

    const sprayProducts: PlotFollowUpProduct[] = [];
    const externalProducts: PlotFollowUpExternalProduct[] = [];

    matchedRounds.forEach((round: any) => {
      if (Array.isArray(round.products)) {
        round.products.forEach((p: any) => {
          const pName = p.product?.name || p.productName || "สินค้าสาธิต";
          sprayProducts.push({
            name: pName,
            quantity: p.quantityUsed != null ? Number(p.quantityUsed) : 1,
            unit: p.unit || p.product?.unit || "",
            rate: p.actualRate || "",
            isAdditional: p.baselineRate == null,
            extraDetail: p.detail || null,
          });
        });
      }
      if (Array.isArray(round.externalProducts)) {
        round.externalProducts.forEach((ep: any) => {
          externalProducts.push({
            company: ep.company,
            productName: ep.productName,
            formula: ep.formula,
            applicationRate: ep.applicationRate,
          });
        });
      }
      if (Array.isArray(round.attachments)) {
        round.attachments.forEach((att: any) => {
          addPhoto(att.fileUrl || att.url, att.fileName || "ภาพการฉีดพ่น", att.id);
        });
      }
    });

    const isClosure =
      Boolean(closedDate) &&
      (idx === rawVisits.length - 1 || visit.visitNumber >= rawVisits.length);

    timelineItems.push({
      id: visit.id || `visit-${idx + 1}`,
      visitNumber: visit.visitNumber || idx + 1,
      visitDate: visit.visitDate || visit.createdAt || null,
      daysSinceStart: visit.daysSinceStart ?? null,
      planId: plan.id || visit.activityPlanId || null,
      planCode: plan.code || null,
      planTitle: plan.title || "ติดตามแปลงสาธิต",
      planStatus: plan.status || null,
      employeeName: plan.employee?.name || null,
      workTypeCode: visit.workTypeCode || "TYPE_7B",
      isPlannedOnly: false,
      cropCondition: visit.cropCondition || null,
      cropProblemDesc: visit.cropProblemDesc || null,
      growthStage: visit.growthStage || null,
      cropAgeValue: visit.cropAgeValue ?? null,
      cropAgeUnit: visit.cropAgeUnit || null,
      productResponse: visit.productResponse || null,
      productProblemDesc: visit.productProblemDesc || null,
      sprayMethod: visit.sprayMethod || matchedRounds[0]?.sprayMethod || null,
      sprayEquipment: visit.sprayEquipment || matchedRounds[0]?.sprayEquipment || null,
      otherEquipment: visit.otherEquipment || matchedRounds[0]?.otherEquipment || null,
      sprayRoundsCount: matchedRounds.length,
      sprayProducts,
      externalProducts,
      photos,
      notes: visit.notes || null,
      isClosure,
    });
  });

  // 2. Identify planned follow-up plans (Type 7B) that have not yet had an actual visit recorded
  rawType7bPlots.forEach((t7bPlot: any, idx: number) => {
    const t7b = t7bPlot.type7b || {};
    const plan = t7b.activityPlan || {};

    if (plan.id && !visitedPlanIds.has(plan.id)) {
      visitedPlanIds.add(plan.id);

      const plannedProducts: PlotFollowUpProduct[] = (t7b.products || []).map(
        (p: any) => ({
          name: p.product?.name || p.productName || "สินค้าขอเบิกตามแผน",
          quantity: p.quantity != null ? Number(p.quantity) : 1,
          unit: p.unit || p.product?.unit || "",
          rate: "",
          isAdditional: false,
        }),
      );

      timelineItems.push({
        id: t7bPlot.id || `planned-followup-${idx + 1}`,
        visitNumber: timelineItems.length + 1,
        visitDate: plan.startDate || null,
        daysSinceStart: null,
        planId: plan.id,
        planCode: plan.code || null,
        planTitle: plan.title || "ติดตามแปลงสาธิต (ตามแผน)",
        planStatus: plan.status || "PLANNED",
        employeeName: plan.employee?.name || null,
        workTypeCode: "TYPE_7B",
        isPlannedOnly: true,
        sprayProducts: plannedProducts,
        externalProducts: [],
        photos: [],
        notes: t7b.objective || t7b.notes || null,
        isClosure: false,
      });
    }
  });

  // Sort timeline chronologically (earliest to latest)
  timelineItems.sort((a, b) => {
    const dateA = a.visitDate ? new Date(a.visitDate).getTime() : 0;
    const dateB = b.visitDate ? new Date(b.visitDate).getTime() : 0;
    if (dateA !== dateB) return dateA - dateB;
    return a.visitNumber - b.visitNumber;
  });

  // Re-index visit numbers cleanly (1, 2, 3...)
  timelineItems.forEach((item, i) => {
    item.visitNumber = i + 1;
  });

  // Extract closure stats if plot is closed
  let closureStats = null;
  if (
    plotStatus === "COMPLETED" ||
    demoPlot.closedDate != null ||
    demoPlot.finalHarvestDate != null
  ) {
    closureStats = {
      demoYieldKg: demoPlot.demoYieldKg != null ? Number(demoPlot.demoYieldKg) : null,
      controlYieldKg:
        demoPlot.controlYieldKg != null ? Number(demoPlot.controlYieldKg) : null,
      yieldIncreasePercent:
        demoPlot.yieldIncreasePercent != null
          ? Number(demoPlot.yieldIncreasePercent)
          : null,
      farmerSatisfaction: demoPlot.farmerSatisfaction ?? null,
      commercialPotential: demoPlot.commercialPotential || null,
      finalHarvestDate: demoPlot.finalHarvestDate || null,
      finalSummaryNotes: demoPlot.finalSummaryNotes || null,
    };
  }

  const latestVisitDate =
    timelineItems.length > 0
      ? timelineItems[timelineItems.length - 1].visitDate
      : null;

  return {
    plotId,
    plotCode,
    plotName,
    plotStatus,
    totalVisits: timelineItems.filter((i) => !i.isPlannedOnly).length,
    totalPlans: visitedPlanIds.size,
    latestVisitDate,
    nextSprayDate,
    closedDate,
    closureStats,
    timeline: timelineItems,
  };
}

