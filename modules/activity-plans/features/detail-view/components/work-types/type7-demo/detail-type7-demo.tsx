"use client";

import React from "react";
import { ImageFile } from "@/modules/activity-plans/features/actual-view/types";
import {
  DetailType7NewDemo,
  DemoResultItemData,
} from "./detail-type7-new-demo";
import { DetailType7FollowUp } from "./detail-type7-follow-up";

export type { DemoResultItemData };

export interface DetailType7DemoProps {
  isVisible: boolean;
  target: {
    activityType?: "CREATE" | "FOLLOW_UP" | string;
    owner: string;
    product: string;
    crop: string;
    plots: string;
    targetCondition?: string;
    demoProductQuantity?: string | number | null;
    objective?: string;
    experimentDetail?: string;
    detail?: string;
    items?: any[];
  };
  demoResults?: DemoResultItemData[];
  plannedProductId?: string | null;
  actualProductId?: string | null;
  plannedProductName?: string | null;
  actualProductName?: string | null;
  changeReason?: string | null;
  startDate?: string;
  plotName?: string;
  usageMethod?: string;
  plantingDate?: string;
  plantingAreaCondition?: string;
  cropAgeValue?: string;
  cropAgeUnit?: string;
  growthStage?: string;
  cropCondition?: "สมบูรณ์" | "มีปัญหา" | "ปานกลาง" | "ทรุดโทรม" | "";
  cropProblemDescription?: string;
  productResponse?: "พืชตอบสนองดี" | "พบปัญหา" | "";
  problemDescription?: string;
  plotStatus?: "IN_PROGRESS" | "COMPLETED" | "FAILED";
  nextFollowUpDate?: string;
  finalYieldKg?: string;
  controlYieldKg?: string;
  yieldIncreasePercent?: string;
  farmerSatisfaction?: number;
  commercialPotential?: string;
  finalSummaryNotes?: string;
  cropImages?: ImageFile[];
  plotImages?: ImageFile[];
  visitHistory?: any[];
  demoPlotData?: any;
}

export function DetailType7Demo(props: DetailType7DemoProps) {
  if (!props.isVisible) return null;

  const isFollowUp =
    props.target.activityType === "FOLLOW_UP" ||
    (props.target.owner && props.target.owner.startsWith("plot-"));

  if (isFollowUp) {
    return (
      <DetailType7FollowUp
        target={props.target}
        plotName={props.plotName}
        usageMethod={props.usageMethod}
        cropAgeValue={props.cropAgeValue}
        cropAgeUnit={props.cropAgeUnit}
        growthStage={props.growthStage}
        cropCondition={props.cropCondition}
        cropProblemDescription={props.cropProblemDescription}
        productResponse={props.productResponse}
        problemDescription={props.problemDescription}
        plotStatus={props.plotStatus}
        nextFollowUpDate={props.nextFollowUpDate}
        finalYieldKg={props.finalYieldKg}
        controlYieldKg={props.controlYieldKg}
        yieldIncreasePercent={props.yieldIncreasePercent}
        farmerSatisfaction={props.farmerSatisfaction}
        commercialPotential={props.commercialPotential}
        finalSummaryNotes={props.finalSummaryNotes}
        cropImages={props.cropImages}
        plotImages={props.plotImages}
        visitHistory={props.visitHistory}
        demoPlotData={props.demoPlotData}
      />
    );
  }

  return (
    <DetailType7NewDemo
      target={props.target}
      demoResults={props.demoResults}
      plannedProductId={props.plannedProductId}
      actualProductId={props.actualProductId}
      plannedProductName={props.plannedProductName}
      actualProductName={props.actualProductName}
      changeReason={props.changeReason}
      plotName={props.plotName}
      usageMethod={props.usageMethod}
      plantingDate={props.plantingDate}
      plantingAreaCondition={props.plantingAreaCondition}
      cropImages={props.cropImages}
      plotImages={props.plotImages}
    />
  );
}
