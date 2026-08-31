"use client";

import React from "react";
import type { DemoPlotStatus } from "@prisma/client";
import { ImageFile } from "@/modules/activity-plans/features/actual-view/types";
import {
  ActualType7NewDemo,
  TargetDemoItem,
} from "./actual-type7-new-demo";
import {
  ActualType7FollowUp,
  DemoPlotVisitHistoryItem,
} from "./actual-type7-follow-up";

export type { TargetDemoItem, DemoPlotVisitHistoryItem };

export interface ActualType7DemoProps {
  isVisible: boolean;
  target: {
    activityType?: string;
    owner: string;
    product: string;
    productId?: string;
    plannedProductId?: string;
    crop: string;
    plots: string;
    targetCondition?: string;
    demoProductQuantity?: string | number | null;
    objective?: string;
    experimentDetail?: string;
    detail?: string;
    items?: TargetDemoItem[];
  };
  products?: Array<{ id: string; name: string; productCode?: string | null }>;
  plannedProductId?: string | null;
  setPlannedProductId?: (id: string | null) => void;
  actualProductId?: string | null;
  setActualProductId?: (id: string | null) => void;
  changeReason?: string;
  setChangeReason?: (reason: string) => void;
  startDate?: string;
  actualDate?: string;
  productPrice?: number;
  plotName: string;
  setPlotName: (v: string) => void;
  usageMethod: string;
  setUsageMethod: (v: string) => void;
  // Master Setup (NEW_DEMO)
  plantingDate?: string;
  setPlantingDate?: (v: string) => void;
  plantingAreaCondition?: string;
  setPlantingAreaCondition?: (v: string) => void;
  cropImages?: ImageFile[];
  setCropImages?: (imgs: ImageFile[]) => void;
  onUploadCropImages?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveCropImage?: (id: string) => void;
  // Observation (FOLLOW_UP)
  cropAgeValue?: string;
  setCropAgeValue?: (v: string) => void;
  cropAgeUnit?: string;
  setCropAgeUnit?: (v: string) => void;
  growthStage?: string;
  setGrowthStage?: (v: string) => void;
  cropCondition?: string;
  setCropCondition?: (v: any) => void;
  cropProblemDesc?: string;
  setCropProblemDesc?: (v: string) => void;
  cropProblemDescription?: string;
  setCropProblemDescription?: (v: string) => void;
  productResponse?: string;
  setProductResponse?: (v: any) => void;
  problemDescription?: string;
  setProblemDescription?: (v: string) => void;
  plotImages?: ImageFile[];
  setPlotImages?: (imgs: ImageFile[]) => void;
  onUploadPlotImages?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemovePlotImage?: (id: string) => void;
  // Status & Final Yield (FOLLOW_UP)
  plotStatus?: DemoPlotStatus;
  setPlotStatus?: (v: any) => void;
  nextFollowUpDate?: string;
  setNextFollowUpDate?: (v: string) => void;
  finalYieldKg?: string;
  setFinalYieldKg?: (v: string) => void;
  controlYieldKg?: string;
  setControlYieldKg?: (v: string) => void;
  yieldIncreasePercent?: string;
  setYieldIncreasePercent?: (v: string) => void;
  farmerSatisfaction?: number;
  setFarmerSatisfaction?: (v: number) => void;
  commercialPotential?: string;
  setCommercialPotential?: (v: string) => void;
  finalSummaryNotes?: string;
  setFinalSummaryNotes?: (v: string) => void;
  demoPlotData?: any;
  visitHistory?: DemoPlotVisitHistoryItem[];
}

export function ActualType7Demo(props: ActualType7DemoProps) {
  if (!props.isVisible) return null;

  // Determine work flow from target
  const activityType =
    props.target.activityType ||
    props.target.items?.[0]?.activityType ||
    "CREATE";
  const isFollowUp = activityType === "FOLLOW_UP";

  if (isFollowUp) {
    return (
      <ActualType7FollowUp
        target={props.target}
        plotName={props.plotName}
        usageMethod={props.usageMethod}
        setUsageMethod={props.setUsageMethod}
        cropImages={props.cropImages}
        setCropImages={props.setCropImages}
        plotImages={props.plotImages}
        setPlotImages={props.setPlotImages}
        cropAgeValue={props.cropAgeValue}
        setCropAgeValue={props.setCropAgeValue}
        cropAgeUnit={props.cropAgeUnit}
        setCropAgeUnit={props.setCropAgeUnit}
        growthStage={props.growthStage}
        setGrowthStage={props.setGrowthStage}
        cropCondition={props.cropCondition}
        setCropCondition={props.setCropCondition}
        cropProblemDesc={props.cropProblemDesc}
        setCropProblemDesc={props.setCropProblemDesc}
        cropProblemDescription={props.cropProblemDescription}
        setCropProblemDescription={props.setCropProblemDescription}
        productResponse={props.productResponse}
        setProductResponse={props.setProductResponse}
        problemDescription={props.problemDescription}
        setProblemDescription={props.setProblemDescription}
        plotStatus={props.plotStatus}
        setPlotStatus={props.setPlotStatus}
        nextFollowUpDate={props.nextFollowUpDate}
        setNextFollowUpDate={props.setNextFollowUpDate}
        finalYieldKg={props.finalYieldKg}
        setFinalYieldKg={props.setFinalYieldKg}
        controlYieldKg={props.controlYieldKg}
        setControlYieldKg={props.setControlYieldKg}
        yieldIncreasePercent={props.yieldIncreasePercent}
        setYieldIncreasePercent={props.setYieldIncreasePercent}
        farmerSatisfaction={props.farmerSatisfaction}
        setFarmerSatisfaction={props.setFarmerSatisfaction}
        commercialPotential={props.commercialPotential}
        setCommercialPotential={props.setCommercialPotential}
        finalSummaryNotes={props.finalSummaryNotes}
        setFinalSummaryNotes={props.setFinalSummaryNotes}
        demoPlotData={props.demoPlotData}
        visitHistory={props.visitHistory}
        startDate={props.startDate}
      />
    );
  }

  return (
    <ActualType7NewDemo
      target={props.target}
      products={props.products}
      plannedProductId={props.plannedProductId}
      actualProductId={props.actualProductId}
      setActualProductId={props.setActualProductId}
      changeReason={props.changeReason}
      setChangeReason={props.setChangeReason}
      startDate={props.startDate}
      usageMethod={props.usageMethod}
      setUsageMethod={props.setUsageMethod}
      plantingDate={props.plantingDate}
      setPlantingDate={props.setPlantingDate}
      plantingAreaCondition={props.plantingAreaCondition}
      setPlantingAreaCondition={props.setPlantingAreaCondition}
      cropImages={props.cropImages}
      setCropImages={props.setCropImages}
      plotImages={props.plotImages}
      setPlotImages={props.setPlotImages}
    />
  );
}
