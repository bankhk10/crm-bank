"use client";

import React from "react";
import type { DemoPlotStatus } from "@prisma/client";
import {
  ImageFile,
  DemoPlotProductItem,
  DemoPlotExternalProductItem,
  Type7bProductRateItem,
  Type7bSprayingRoundItem,
} from "@/modules/activity-plans/features/actual-view/types";
import { ActualType7NewDemo, TargetDemoItem, CustomerOption } from "@/modules/activity-plans/features/type-7a/actual/actual-type7-new-demo";
import {
  ActualType7FollowUp,
  DemoPlotVisitHistoryItem,
} from "@/modules/activity-plans/features/type-7b/actual/actual-type7-follow-up";

export type { TargetDemoItem, DemoPlotVisitHistoryItem };

export interface ActualType7DemoProps {
  mode?: "TYPE_7A" | "TYPE_7B";
  isVisible: boolean;
  target: {
    activityType?: string;
    owner: string;
    product: string;
    crop: string;
    plots: string;
    targetCondition?: string;
    demoProductQuantity?: string | number | null;
    objective?: string;
    experimentDetail?: string;
    detail?: string;
    followUpObjective?: string;
    items?: any[];
  };
  products?: Array<{
    id: string;
    name: string;
    productCode?: string | null;
    unit?: string | null;
    packageSizeUnit?: string | null;
  }>;
  customers?: CustomerOption[];

  // 1. Farmer / Customer Identification
  farmerProvince?: string;
  setFarmerProvince?: (v: string) => void;
  farmerDistrict?: string;
  setFarmerDistrict?: (v: string) => void;
  farmerCustomerId?: string | null;
  setFarmerCustomerId?: (id: string | null) => void;
  farmerName?: string;
  setFarmerName?: (name: string) => void;
  farmerPhone?: string;
  setFarmerPhone?: (phone: string) => void;
  isUnregisteredFarmer?: boolean;
  setIsUnregisteredFarmer?: (val: boolean) => void;

  // 2. Plot Location & Identification
  plotName: string;
  setPlotName?: (name: string) => void;
  dealerName?: string;
  setDealerName?: (name: string) => void;
  dealerCode?: string;
  setDealerCode?: (code: string) => void;
  province?: string;
  setProvince?: (prov: string) => void;
  district?: string;
  setDistrict?: (dist: string) => void;
  latitude?: string;
  setLatitude?: (lat: string) => void;
  longitude?: string;
  setLongitude?: (lng: string) => void;
  planProvince?: string;

  // 3. Crop Details
  cropCategory?: string;
  setCropCategory?: (cat: string) => void;
  cropName?: string;
  setCropName?: (crop: string) => void;
  customCropName?: string;
  setCustomCropName?: (custom: string) => void;
  areaRai?: string;
  setAreaRai?: (rai: string) => void;
  treeCount?: string;
  setTreeCount?: (trees: string) => void;
  mainCropInfo?: string;
  setMainCropInfo?: (info: string) => void;

  // 4. Experiment & Plot Objectives
  plotObjective?: string;
  setPlotObjective?: (obj: string) => void;
  experimentDetail?: string;
  setExperimentDetail?: (detail: string) => void;

  // 5. Timeline & Irrigation
  plantingDate?: string;
  setPlantingDate?: (date: string) => void;
  initialSprayDate?: string;
  setInitialSprayDate?: (date: string) => void;
  nextSprayDate?: string;
  setNextSprayDate?: (date: string) => void;
  irrigations?: string[];
  setIrrigations?: (irrs: string[]) => void;
  demoProducts?: DemoPlotProductItem[];
  setDemoProducts?: (items: DemoPlotProductItem[]) => void;

  // 6. Spray Method & External Chemicals
  sprayMethod?: "SINGLE" | "TANK_MIXED";
  setSprayMethod?: (v: "SINGLE" | "TANK_MIXED") => void;
  hasExternalChemicals?: boolean;
  setHasExternalChemicals?: (v: boolean) => void;
  externalProducts?: DemoPlotExternalProductItem[];
  setExternalProducts?: (items: DemoPlotExternalProductItem[]) => void;

  // TYPE_7B Specific Props
  actualStartDate?: string;
  setActualStartDate?: (v: string) => void;
  daysAfterSpray?: string | number;
  setDaysAfterSpray?: (v: string) => void;
  bProductRates?: Type7bProductRateItem[];
  setBProductRates?: (items: Type7bProductRateItem[]) => void;
  sprayEquipment?: string;
  setSprayEquipment?: (v: string) => void;
  otherEquipment?: string;
  setOtherEquipment?: (v: string) => void;
  t7bSprayingRounds?: Type7bSprayingRoundItem[];
  setT7bSprayingRounds?: (rounds: Type7bSprayingRoundItem[]) => void;

  // Legacy & Shared Props
  plannedProductId?: string | null;
  setPlannedProductId?: (id: string | null) => void;
  actualProductId?: string | null;
  setActualProductId?: (id: string | null) => void;
  actualQuantity?: string | number;
  setActualQuantity?: (qty: string) => void;
  changeReason?: string;
  setChangeReason?: (reason: string) => void;
  customPlotDetail?: string;
  setCustomPlotDetail?: (v: string) => void;
  startDate?: string;
  actualDate?: string;
  productPrice?: number;
  usageMethod: string;
  setUsageMethod: (v: string) => void;
  plantingAreaCondition?: string;
  setPlantingAreaCondition?: (v: string) => void;
  cropImages?: ImageFile[];
  setCropImages?: (imgs: ImageFile[]) => void;
  onUploadCropImages?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveCropImage?: (id: string) => void;

  // Observation (FOLLOW_UP / TYPE_7B & Visit #1)
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
  initialPhotos?: ImageFile[];
  setInitialPhotos?: (imgs: ImageFile[]) => void;
  onUploadPlotImages?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemovePlotImage?: (id: string) => void;

  // Status & Final Yield (FOLLOW_UP / TYPE_7B)
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
  demoPlotId?: string | null;
  setDemoPlotId?: (id: string | null) => void;
}

export function ActualType7Demo(props: ActualType7DemoProps) {
  if (!props.isVisible) return null;

  // Determine work flow from mode or target
  const isFollowUp =
    props.mode === "TYPE_7B" ||
    (!props.mode &&
      (props.target.activityType === "FOLLOW_UP" ||
        props.target.activityType === "FOLLOWUP" ||
        props.target.items?.[0]?.activityType === "FOLLOW_UP"));

  if (isFollowUp) {
    return (
      <ActualType7FollowUp
        target={props.target}
        plotName={props.plotName}
        usageMethod={props.usageMethod}
        setUsageMethod={props.setUsageMethod}
        actualStartDate={props.actualStartDate}
        setActualStartDate={props.setActualStartDate}
        daysAfterSpray={props.daysAfterSpray}
        setDaysAfterSpray={props.setDaysAfterSpray}
        bProductRates={props.bProductRates}
        setBProductRates={props.setBProductRates}
        sprayMethod={props.sprayMethod}
        setSprayMethod={props.setSprayMethod}
        hasExternalChemicals={props.hasExternalChemicals}
        setHasExternalChemicals={props.setHasExternalChemicals}
        externalProducts={props.externalProducts}
        setExternalProducts={props.setExternalProducts}
        sprayEquipment={props.sprayEquipment}
        setSprayEquipment={props.setSprayEquipment}
        otherEquipment={props.otherEquipment}
        setOtherEquipment={props.setOtherEquipment}
        t7bSprayingRounds={props.t7bSprayingRounds}
        setT7bSprayingRounds={props.setT7bSprayingRounds}
        nextSprayDate={props.nextSprayDate}
        setNextSprayDate={props.setNextSprayDate}
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
      customers={props.customers}
      farmerProvince={props.farmerProvince}
      setFarmerProvince={props.setFarmerProvince}
      farmerDistrict={props.farmerDistrict}
      setFarmerDistrict={props.setFarmerDistrict}
      farmerCustomerId={props.farmerCustomerId}
      setFarmerCustomerId={props.setFarmerCustomerId}
      farmerName={props.farmerName}
      setFarmerName={props.setFarmerName}
      farmerPhone={props.farmerPhone}
      setFarmerPhone={props.setFarmerPhone}
      isUnregisteredFarmer={props.isUnregisteredFarmer}
      setIsUnregisteredFarmer={props.setIsUnregisteredFarmer}
      dealerName={props.dealerName}
      setDealerName={props.setDealerName}
      dealerCode={props.dealerCode}
      latitude={props.latitude}
      setLatitude={props.setLatitude}
      longitude={props.longitude}
      setLongitude={props.setLongitude}
      planProvince={props.planProvince}
      plotName={props.plotName}
      setPlotName={props.setPlotName}
      district={props.district}
      setDistrict={props.setDistrict}
      cropCategory={props.cropCategory}
      setCropCategory={props.setCropCategory}
      cropName={props.cropName}
      setCropName={props.setCropName}
      customCropName={props.customCropName}
      setCustomCropName={props.setCustomCropName}
      areaRai={props.areaRai}
      setAreaRai={props.setAreaRai}
      treeCount={props.treeCount}
      setTreeCount={props.setTreeCount}
      plotObjective={props.plotObjective}
      setPlotObjective={props.setPlotObjective}
      experimentDetail={props.experimentDetail}
      setExperimentDetail={props.setExperimentDetail}
      mainCropInfo={props.mainCropInfo}
      setMainCropInfo={props.setMainCropInfo}
      irrigations={props.irrigations}
      setIrrigations={props.setIrrigations}
      plantingDate={props.plantingDate}
      setPlantingDate={props.setPlantingDate}
      initialSprayDate={props.initialSprayDate}
      setInitialSprayDate={props.setInitialSprayDate}
      nextSprayDate={props.nextSprayDate}
      setNextSprayDate={props.setNextSprayDate}
      demoProducts={props.demoProducts}
      setDemoProducts={props.setDemoProducts}
      sprayMethod={props.sprayMethod}
      setSprayMethod={props.setSprayMethod}
      hasExternalChemicals={props.hasExternalChemicals}
      setHasExternalChemicals={props.setHasExternalChemicals}
      externalProducts={props.externalProducts}
      setExternalProducts={props.setExternalProducts}
      cropAgeValue={props.cropAgeValue}
      setCropAgeValue={props.setCropAgeValue}
      cropAgeUnit={props.cropAgeUnit}
      setCropAgeUnit={props.setCropAgeUnit}
      growthStage={props.growthStage}
      setGrowthStage={props.setGrowthStage}
      usageMethod={props.usageMethod}
      setUsageMethod={props.setUsageMethod}
      initialPhotos={props.initialPhotos}
      setInitialPhotos={props.setInitialPhotos}
      plannedProductId={props.plannedProductId}
      actualProductId={props.actualProductId}
      setActualProductId={props.setActualProductId}
      actualQuantity={props.actualQuantity}
      setActualQuantity={props.setActualQuantity}
      changeReason={props.changeReason}
      setChangeReason={props.setChangeReason}
      customPlotDetail={props.customPlotDetail}
      setCustomPlotDetail={props.setCustomPlotDetail}
      plantingAreaCondition={props.plantingAreaCondition}
      setPlantingAreaCondition={props.setPlantingAreaCondition}
      nextFollowUpDate={props.nextFollowUpDate}
      setNextFollowUpDate={props.setNextFollowUpDate}
      cropImages={props.cropImages}
      setCropImages={props.setCropImages}
      plotImages={props.plotImages}
      setPlotImages={props.setPlotImages}
      demoPlotId={props.demoPlotId}
      setDemoPlotId={props.setDemoPlotId}
    />
  );
}
