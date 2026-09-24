"use client";

import React from "react";
import { BarChart3 } from "lucide-react";
import { WORK_TYPES } from "@/modules/activity-plans/constants";
import type {
  ActualTargetsState,
  ImageFile,
  Type5SurveyRecord,
  FollowupProductItem,
  DemoPlotProductItem,
  DemoPlotExternalProductItem,
  Type7bProductRateItem,
  Type7bSprayingRoundItem,
} from "../types";
import {
  ActualType1Visit,
  ActualType2Followup,
  ActualType3Sales,
  ActualType4Collect,
  ActualType5Survey,
  ActualType6Issue,
  ActualType7Demo,
  ActualType8Meeting,
  ActualType9Store,
  ActualType10FieldDay,
  ActualType11Stock,
} from "./work-types";

import type { useType1Actual } from "@/modules/activity-plans/features/type-1";
import type { useType2Actual } from "@/modules/activity-plans/features/type-2";
import type { useType3Actual } from "@/modules/activity-plans/features/type-3";
import type { useType4Actual } from "@/modules/activity-plans/features/type-4";
import type { useType5Actual } from "@/modules/activity-plans/features/type-5";
import type { useType6Actual } from "@/modules/activity-plans/features/type-6";
import type { useType7aActual } from "@/modules/activity-plans/features/type-7a";
import type { useType7bActual } from "@/modules/activity-plans/features/type-7b";
import type { useType8Actual } from "@/modules/activity-plans/features/type-8";
import type { useType9Actual } from "@/modules/activity-plans/features/type-9";
import type { useType10Actual } from "@/modules/activity-plans/features/type-10";
import type { useType11Actual } from "@/modules/activity-plans/features/type-11";
import { Type13Actual } from "@/modules/activity-plans/features/type-13";

export interface ActualTypeHooks {
  type1: ReturnType<typeof useType1Actual>;
  type2: ReturnType<typeof useType2Actual>;
  type3: ReturnType<typeof useType3Actual>;
  type4: ReturnType<typeof useType4Actual>;
  type5: ReturnType<typeof useType5Actual>;
  type6: ReturnType<typeof useType6Actual>;
  type7a: ReturnType<typeof useType7aActual>;
  type7b: ReturnType<typeof useType7bActual>;
  type8: ReturnType<typeof useType8Actual>;
  type9: ReturnType<typeof useType9Actual>;
  type10: ReturnType<typeof useType10Actual>;
  type11: ReturnType<typeof useType11Actual>;
  type13?: any;
}

export interface ActivityResultSectionProps {
  isTypeVisible: (typeTitle: string) => boolean;
  targets: ActualTargetsState;
  products: any[];
  customers?: any[];
  planProvince?: string;
  typeHooks?: ActualTypeHooks;

  createUploadHandler?: (
    setter: React.Dispatch<React.SetStateAction<ImageFile[]>>,
  ) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeImage?: (
    setter: React.Dispatch<React.SetStateAction<ImageFile[]>>,
    id: string,
  ) => void;
  [key: string]: any;
}

export function ActivityResultSection(props: ActivityResultSectionProps) {
  const {
    isTypeVisible,
    targets,
    products,
    customers,
    planProvince,
    typeHooks,
  } = props;

  const defaultCreateUploadHandler = (
    setter: React.Dispatch<React.SetStateAction<ImageFile[]>>,
  ) => {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files?.length) return;
      const files = Array.from(e.target.files);
      const newItems = files.map((file, idx) => ({
        id: `img-${Date.now()}-${idx}`,
        url: URL.createObjectURL(file),
        name: file.name,
      }));
      setter((prev) => [...prev, ...newItems]);
    };
  };

  const defaultRemoveImage = (
    setter: React.Dispatch<React.SetStateAction<ImageFile[]>>,
    id: string,
  ) => {
    setter((prev) => prev.filter((img) => img.id !== id));
  };

  const createUploadHandler =
    props.createUploadHandler || defaultCreateUploadHandler;
  const removeImage = props.removeImage || defaultRemoveImage;

  // TYPE 1
  const t1 = typeHooks?.type1;
  const t1ProductAdvice = t1 ? t1.t1ProductAdvice : (props.t1ProductAdvice ?? "");
  const setT1ProductAdvice = t1 ? t1.setT1ProductAdvice : (props.setT1ProductAdvice || (() => {}));
  const t1SalesOpportunity = t1 ? t1.t1SalesOpportunity : (props.t1SalesOpportunity ?? "");
  const setT1SalesOpportunity = t1 ? t1.setT1SalesOpportunity : (props.setT1SalesOpportunity || (() => {}));
  const t1DiscussionResult = t1 ? t1.t1DiscussionResult : (props.t1DiscussionResult ?? "");
  const setT1DiscussionResult = t1 ? t1.setT1DiscussionResult : (props.setT1DiscussionResult || (() => {}));
  const t1Detail = t1 ? t1.t1Detail : (props.t1Detail ?? "");
  const setT1Detail = t1 ? t1.setT1Detail : (props.setT1Detail || (() => {}));
  const t1NextAction = t1 ? t1.t1NextAction : (props.t1NextAction ?? "");
  const setT1NextAction = t1 ? t1.setT1NextAction : (props.setT1NextAction || (() => {}));
  const t1NextMeetingDate = t1 ? t1.t1NextMeetingDate : (props.t1NextMeetingDate ?? "");
  const setT1NextMeetingDate = t1 ? t1.setT1NextMeetingDate : (props.setT1NextMeetingDate || (() => {}));
  const t1FarmerHomeAddress = t1 ? t1.t1FarmerHomeAddress : (props.t1FarmerHomeAddress ?? "");
  const setT1FarmerHomeAddress = t1 ? t1.setT1FarmerHomeAddress : (props.setT1FarmerHomeAddress || (() => {}));
  const t1PlotLatitude = t1 ? t1.t1PlotLatitude : (props.t1PlotLatitude ?? "");
  const setT1PlotLatitude = t1 ? t1.setT1PlotLatitude : (props.setT1PlotLatitude || props.setPlotLatitude || (() => {}));
  const t1PlotLongitude = t1 ? t1.t1PlotLongitude : (props.t1PlotLongitude ?? "");
  const setT1PlotLongitude = t1 ? t1.setT1PlotLongitude : (props.setT1PlotLongitude || props.setPlotLongitude || (() => {}));
  const t1PlotImages = t1 ? t1.t1PlotImages : (props.t1PlotImages ?? []);
  const setT1PlotImages = t1 ? t1.setT1PlotImages : (props.setT1PlotImages || props.setPlotImages || (() => {}));

  // TYPE 2
  const t2 = typeHooks?.type2;
  const t2CustomerName = t2 ? t2.t2CustomerName : (props.t2CustomerName ?? "");
  const setT2CustomerName = t2 ? t2.setT2CustomerName : (props.setT2CustomerName || (() => {}));
  const t2FollowupDetail = t2 ? t2.t2FollowupDetail : (props.t2FollowupDetail ?? "");
  const setT2FollowupDetail = t2 ? t2.setT2FollowupDetail : (props.setT2FollowupDetail || (() => {}));
  const t2Detail = t2 ? t2.t2Detail : (props.t2Detail ?? "");
  const setT2Detail = t2 ? t2.setT2Detail : (props.setT2Detail || (() => {}));
  const t2UsageResult = t2 ? t2.t2UsageResult : (props.t2UsageResult ?? "");
  const setT2UsageResult = t2 ? t2.setT2UsageResult : (props.setT2UsageResult || (() => {}));
  const t2ProblemDetail = t2 ? t2.t2ProblemDetail : (props.t2ProblemDetail ?? "");
  const setT2ProblemDetail = t2 ? t2.setT2ProblemDetail : (props.setT2ProblemDetail || (() => {}));
  const t2FollowupResults = t2 ? t2.t2FollowupResults : (props.t2FollowupResults ?? []);
  const setT2FollowupResults = t2 ? t2.setT2FollowupResults : (props.setT2FollowupResults || (() => {}));
  const t2Images = t2 ? t2.t2Images : (props.t2Images ?? []);
  const setT2Images = t2 ? t2.setT2Images : (props.setT2Images || (() => {}));

  // TYPE 3
  const t3 = typeHooks?.type3;
  const t3SoldProducts = t3 ? t3.t3SoldProducts : (props.t3SoldProducts ?? "");
  const setT3SoldProducts = t3 ? t3.setT3SoldProducts : (props.setT3SoldProducts || (() => {}));
  const t3ActualSales = t3 ? t3.t3ActualSales : (props.t3ActualSales ?? "");
  const setT3ActualSales = t3 ? t3.setT3ActualSales : (props.setT3ActualSales || (() => {}));
  const t3ActualQuantity = t3 ? t3.t3ActualQuantity : (props.t3ActualQuantity ?? "");
  const setT3ActualQuantity = t3 ? t3.setT3ActualQuantity : (props.setT3ActualQuantity || (() => {}));
  const t3UnclosedReason = t3 ? t3.t3UnclosedReason : (props.t3UnclosedReason ?? "");
  const setT3UnclosedReason = t3 ? t3.setT3UnclosedReason : (props.setT3UnclosedReason || (() => {}));
  const t3ProductSalesDetails = t3 ? t3.t3ProductSalesDetails : (props.t3ProductSalesDetails ?? []);
  const setT3ProductSalesDetails = t3 ? t3.setT3ProductSalesDetails : (props.setT3ProductSalesDetails || props.setProductSalesDetails || (() => {}));

  // TYPE 4
  const t4 = typeHooks?.type4;
  const t4OrderNo = t4 ? t4.t4OrderNo : (props.t4OrderNo ?? "");
  const setT4OrderNo = t4 ? t4.setT4OrderNo : (props.setT4OrderNo || (() => {}));
  const t4ReceivedAmount = t4 ? t4.t4ReceivedAmount : (props.t4ReceivedAmount ?? "");
  const setT4ReceivedAmount = t4 ? t4.setT4ReceivedAmount : (props.setT4ReceivedAmount || (() => {}));
  const t4BillingStatus = t4 ? t4.t4BillingStatus : (props.t4BillingStatus ?? "");
  const setT4BillingStatus = t4 ? t4.setT4BillingStatus : (props.setT4BillingStatus || (() => {}));
  const t4Detail = t4 ? t4.t4Detail : (props.t4Detail ?? "");
  const setT4Detail = t4 ? t4.setT4Detail : (props.setT4Detail || (() => {}));
  const t4PaymentImages = t4 ? t4.t4PaymentImages : (props.t4PaymentImages ?? []);
  const setT4PaymentImages = t4 ? t4.setT4PaymentImages : (props.setT4PaymentImages || (() => {}));

  // TYPE 5
  const t5 = typeHooks?.type5;
  const t5SurveyDetails = t5 ? t5.t5SurveyDetails : (props.t5SurveyDetails ?? []);
  const onUpdateT5SurveyItem = t5 ? t5.handleUpdateT5SurveyItem : (props.onUpdateT5SurveyItem || (() => {}));
  const t5CompetitorBrand = t5 ? t5.t5CompetitorBrand : (props.t5CompetitorBrand ?? "");
  const setT5CompetitorBrand = t5 ? t5.setT5CompetitorBrand : (props.setT5CompetitorBrand || (() => {}));
  const t5CompetitorProduct = t5 ? t5.t5CompetitorProduct : (props.t5CompetitorProduct ?? "");
  const setT5CompetitorProduct = t5 ? t5.setT5CompetitorProduct : (props.setT5CompetitorProduct || (() => {}));

  // TYPE 6
  const t6 = typeHooks?.type6;
  const t6ProductId = t6 ? t6.t6ProductId : (props.t6ProductId ?? null);
  const setT6ProductId = t6 ? t6.setT6ProductId : (props.setT6ProductId || (() => {}));
  const t6ProductName = t6 ? t6.t6ProductName : (props.t6ProductName ?? null);
  const setT6ProductName = t6 ? t6.setT6ProductName : (props.setT6ProductName || (() => {}));
  const t6LotNumber = t6 ? t6.t6LotNumber : (props.t6LotNumber ?? "");
  const setT6LotNumber = t6 ? t6.setT6LotNumber : (props.setT6LotNumber || (() => {}));
  const t6PurchaseChannel = t6 ? t6.t6PurchaseChannel : (props.t6PurchaseChannel ?? "ร้านค้าตัวแทนจำหน่าย");
  const setT6PurchaseChannel = t6 ? ((v: any) => t6.setT6PurchaseChannel(v)) : (props.setT6PurchaseChannel || (() => {}));
  const t6StoreId = t6 ? t6.t6StoreId : (props.t6StoreId ?? null);
  const setT6StoreId = t6 ? t6.setT6StoreId : (props.setT6StoreId || (() => {}));
  const t6StoreName = t6 ? t6.t6StoreName : (props.t6StoreName ?? null);
  const setT6StoreName = t6 ? t6.setT6StoreName : (props.setT6StoreName || (() => {}));
  const t6IssueType = t6 ? t6.t6IssueType : (props.t6IssueType ?? "");
  const setT6IssueType = t6 ? t6.setT6IssueType : (props.setT6IssueType || (() => {}));
  const t6Detail = t6 ? t6.t6Detail : (props.t6Detail ?? "");
  const setT6Detail = t6 ? t6.setT6Detail : (props.setT6Detail || (() => {}));
  const t6Status = t6 ? t6.t6Status : (props.t6Status ?? "");
  const setT6Status = t6 ? t6.setT6Status : (props.setT6Status || (() => {}));
  const t6Images = t6 ? t6.t6Images : (props.t6Images ?? []);
  const setT6Images = t6 ? t6.setT6Images : (props.setT6Images || (() => {}));
  const t6ProblemDetail = t6 ? t6.t6ProblemDetail : (props.t6ProblemDetail ?? "");
  const setT6ProblemDetail = t6 ? t6.setT6ProblemDetail : (props.setT6ProblemDetail || (() => {}));
  const t6InitialSolution = t6 ? t6.t6InitialSolution : (props.t6InitialSolution ?? "");
  const setT6InitialSolution = t6 ? t6.setT6InitialSolution : (props.setT6InitialSolution || (() => {}));

  // TYPE 7A & 7B
  const t7a = typeHooks?.type7a;
  const t7b = typeHooks?.type7b;

  const t7FarmerProvince = t7a ? t7a.t7FarmerProvince : (props.t7FarmerProvince ?? "");
  const setT7FarmerProvince = t7a ? t7a.setT7FarmerProvince : (props.setT7FarmerProvince || (() => {}));
  const t7FarmerCustomerId = t7a ? t7a.t7FarmerCustomerId : (props.t7FarmerCustomerId ?? null);
  const setT7FarmerCustomerId = t7a ? t7a.setT7FarmerCustomerId : (props.setT7FarmerCustomerId || (() => {}));
  const t7FarmerName = t7a ? t7a.t7FarmerName : (props.t7FarmerName ?? "");
  const setT7FarmerName = t7a ? t7a.setT7FarmerName : (props.setT7FarmerName || (() => {}));
  const t7FarmerPhone = t7a ? t7a.t7FarmerPhone : (props.t7FarmerPhone ?? "");
  const setT7FarmerPhone = t7a ? t7a.setT7FarmerPhone : (props.setT7FarmerPhone || (() => {}));
  const t7IsUnregisteredFarmer = t7a ? t7a.t7IsUnregisteredFarmer : (props.t7IsUnregisteredFarmer ?? false);
  const setT7IsUnregisteredFarmer = t7a ? t7a.setT7IsUnregisteredFarmer : (props.setT7IsUnregisteredFarmer || (() => {}));
  const t7DealerName = t7a ? t7a.t7DealerName : (props.t7DealerName ?? "");
  const setT7DealerName = t7a ? t7a.setT7DealerName : (props.setT7DealerName || (() => {}));
  const t7DealerCode = t7a ? t7a.t7DealerCode : (props.t7DealerCode ?? "");
  const t7Latitude = t7a ? t7a.t7Latitude : (props.t7Latitude ?? "");
  const setT7Latitude = t7a ? t7a.setT7Latitude : (props.setT7Latitude || props.setLatitude || (() => {}));
  const t7Longitude = t7a ? t7a.t7Longitude : (props.t7Longitude ?? "");
  const setT7Longitude = t7a ? t7a.setT7Longitude : (props.setT7Longitude || props.setLongitude || (() => {}));
  const t7District = t7a ? t7a.t7District : (props.t7District ?? "");
  const setT7District = t7a ? t7a.setT7District : (props.setT7District || props.setDistrict || (() => {}));
  const t7CropCategory = t7a ? t7a.t7CropCategory : (props.t7CropCategory ?? "");
  const setT7CropCategory = t7a ? t7a.setT7CropCategory : (props.setT7CropCategory || props.setCropCategory || (() => {}));
  const t7CropName = t7a ? t7a.t7CropName : (props.t7CropName ?? "");
  const setT7CropName = t7a ? t7a.setT7CropName : (props.setT7CropName || props.setCropName || (() => {}));
  const t7CustomCropName = t7a ? t7a.t7CustomCropName : (props.t7CustomCropName ?? "");
  const setT7CustomCropName = t7a ? t7a.setT7CustomCropName : (props.setT7CustomCropName || props.setCustomCropName || (() => {}));
  const t7AreaRai = t7a ? t7a.t7AreaRai : (props.t7AreaRai ?? "");
  const setT7AreaRai = t7a ? t7a.setT7AreaRai : (props.setT7AreaRai || props.setAreaRai || (() => {}));
  const t7TreeCount = t7a ? t7a.t7TreeCount : (props.t7TreeCount ?? "");
  const setT7TreeCount = t7a ? t7a.setT7TreeCount : (props.setT7TreeCount || props.setTreeCount || (() => {}));
  const t7ExperimentDetail = t7a ? t7a.t7ExperimentDetail : (props.t7ExperimentDetail ?? "");
  const setT7ExperimentDetail = t7a ? t7a.setT7ExperimentDetail : (props.setT7ExperimentDetail || props.setExperimentDetail || (() => {}));
  const t7MainCropInfo = t7a ? t7a.t7MainCropInfo : (props.t7MainCropInfo ?? "");
  const setT7MainCropInfo = t7a ? t7a.setT7MainCropInfo : (props.setT7MainCropInfo || props.setMainCropInfo || (() => {}));
  const t7Irrigations = t7a ? t7a.t7Irrigations : (props.t7Irrigations ?? []);
  const setT7Irrigations = t7a ? t7a.setT7Irrigations : (props.setT7Irrigations || props.setIrrigations || (() => {}));
  const t7InitialSprayDate = t7a ? t7a.t7InitialSprayDate : (props.t7InitialSprayDate ?? "");
  const setT7InitialSprayDate = t7a ? t7a.setT7InitialSprayDate : (props.setT7InitialSprayDate || props.setInitialSprayDate || (() => {}));
  const t7DemoProducts = t7a ? t7a.t7DemoProducts : (props.t7DemoProducts ?? []);
  const setT7DemoProducts = t7a ? t7a.setT7DemoProducts : (props.setT7DemoProducts || props.setDemoProducts || (() => {}));
  const t7InitialPhotos = t7a ? t7a.t7InitialPhotos : (props.t7InitialPhotos ?? []);
  const setT7InitialPhotos = t7a ? t7a.setT7InitialPhotos : (props.setT7InitialPhotos || props.setInitialPhotos || (() => {}));

  const t7PlotName = t7a ? t7a.t7PlotName : (props.t7PlotName ?? "");
  const setT7PlotName = t7a ? t7a.setT7PlotName : (props.setT7PlotName || props.setPlotName || (() => {}));
  const t7PlotObjective = t7a ? t7a.t7PlotObjective : (props.t7PlotObjective ?? "");
  const setT7PlotObjective = t7a ? t7a.setT7PlotObjective : (props.setT7PlotObjective || props.setPlotObjective || (() => {}));
  const t7CustomPlotDetail = t7a ? t7a.t7CustomPlotDetail : (props.t7CustomPlotDetail ?? "");
  const setT7CustomPlotDetail = t7a ? t7a.setT7CustomPlotDetail : (props.setT7CustomPlotDetail || props.setCustomPlotDetail || (() => {}));
  const t7aUsageMethod = t7a ? t7a.t7UsageMethod : (props.t7UsageMethod ?? "");
  const setT7aUsageMethod = t7a ? t7a.setT7UsageMethod : (props.setT7UsageMethod || props.setUsageMethod || (() => {}));
  const t7bUsageMethod = t7b ? t7b.t7UsageMethod : (props.t7UsageMethod ?? "");
  const setT7bUsageMethod = t7b ? t7b.setT7UsageMethod : (props.setT7UsageMethod || props.setUsageMethod || (() => {}));

  const t7aSprayMethod = t7a ? t7a.t7SprayMethod : (props.t7SprayMethod ?? "SINGLE");
  const setT7aSprayMethod = t7a ? t7a.setT7SprayMethod : (props.setT7SprayMethod || props.setSprayMethod || (() => {}));
  const t7bSprayMethod = t7b ? t7b.t7SprayMethod : (props.t7SprayMethod ?? "SINGLE");
  const setT7bSprayMethod = t7b ? t7b.setT7SprayMethod : (props.setT7SprayMethod || props.setSprayMethod || (() => {}));

  const t7aHasExternalChemicals = t7a ? t7a.t7HasExternalChemicals : (props.t7HasExternalChemicals ?? false);
  const setT7aHasExternalChemicals = t7a ? t7a.setT7HasExternalChemicals : (props.setT7HasExternalChemicals || props.setHasExternalChemicals || (() => {}));
  const t7bHasExternalChemicals = t7b ? t7b.t7HasExternalChemicals : (props.t7HasExternalChemicals ?? false);
  const setT7bHasExternalChemicals = t7b ? t7b.setT7HasExternalChemicals : (props.setT7HasExternalChemicals || props.setHasExternalChemicals || (() => {}));

  const t7aExternalProducts = t7a ? t7a.t7ExternalProducts : (props.t7ExternalProducts ?? []);
  const setT7aExternalProducts = t7a ? t7a.setT7ExternalProducts : (props.setT7ExternalProducts || props.setExternalProducts || (() => {}));
  const t7bExternalProducts = t7b ? t7b.t7ExternalProducts : (props.t7ExternalProducts ?? []);
  const setT7bExternalProducts = t7b ? t7b.setT7ExternalProducts : (props.setT7ExternalProducts || props.setExternalProducts || (() => {}));

  const t7DemoPlotId = t7a ? t7a.t7DemoPlotId : (t7b ? t7b.t7DemoPlotId : props.t7DemoPlotId);
  const setT7DemoPlotId = t7a ? t7a.setT7DemoPlotId : (t7b ? t7b.setT7DemoPlotId : (props.setT7DemoPlotId || props.setDemoPlotId || (() => {})));
  const t7DemoPlotData = t7a ? t7a.t7DemoPlotData : (t7b ? t7b.t7DemoPlotData : props.t7DemoPlotData);

  const t7StartDate = t7b ? t7b.t7StartDate : (props.t7StartDate ?? "");
  const setT7StartDate = t7b ? t7b.setT7StartDate : (props.setT7StartDate || (() => {}));
  const t7ProductPrice = t7b ? t7b.t7ProductPrice : (props.t7ProductPrice ?? 0);
  const t7PlannedProductId = t7b ? t7b.t7PlannedProductId : props.t7PlannedProductId;
  const setT7PlannedProductId = t7b ? t7b.setT7PlannedProductId : (props.setT7PlannedProductId || props.setPlannedProductId || (() => {}));
  const t7ActualProductId = t7b ? t7b.t7ActualProductId : props.t7ActualProductId;
  const setT7ActualProductId = t7b ? t7b.setT7ActualProductId : (props.setT7ActualProductId || props.setActualProductId || (() => {}));
  const t7ActualQuantity = t7b ? t7b.t7ActualQuantity : (props.t7ActualQuantity ?? "");
  const setT7ActualQuantity = t7b ? t7b.setT7ActualQuantity : (props.setT7ActualQuantity || props.setActualQuantity || (() => {}));
  const t7ChangeReason = t7b ? t7b.t7ChangeReason : (props.t7ChangeReason ?? "");
  const setT7ChangeReason = t7b ? t7b.setT7ChangeReason : (props.setT7ChangeReason || props.setChangeReason || (() => {}));
  const t7PlantingDate = t7b ? t7b.t7PlantingDate : (props.t7PlantingDate ?? "");
  const setT7PlantingDate = t7b ? t7b.setT7PlantingDate : (props.setT7PlantingDate || props.setPlantingDate || (() => {}));
  const t7PlantingAreaCondition = t7b ? t7b.t7PlantingAreaCondition : (props.t7PlantingAreaCondition ?? "");
  const setT7PlantingAreaCondition = t7b ? t7b.setT7PlantingAreaCondition : (props.setT7PlantingAreaCondition || props.setPlantingAreaCondition || (() => {}));
  const t7CropImages = t7b ? t7b.t7CropImages : (props.t7CropImages ?? []);
  const setT7CropImages = t7b ? t7b.setT7CropImages : (props.setT7CropImages || props.setCropImages || (() => {}));
  const t7CropAgeValue = t7b ? t7b.t7CropAgeValue : (props.t7CropAgeValue ?? "");
  const setT7CropAgeValue = t7b ? t7b.setT7CropAgeValue : (props.setT7CropAgeValue || props.setCropAgeValue || (() => {}));
  const t7CropAgeUnit = t7b ? t7b.t7CropAgeUnit : (props.t7CropAgeUnit ?? "");
  const setT7CropAgeUnit = t7b ? t7b.setT7CropAgeUnit : (props.setT7CropAgeUnit || props.setCropAgeUnit || (() => {}));
  const t7GrowthStage = t7b ? t7b.t7GrowthStage : (props.t7GrowthStage ?? "");
  const setT7GrowthStage = t7b ? t7b.setT7GrowthStage : (props.setT7GrowthStage || props.setGrowthStage || (() => {}));
  const t7CropCondition = t7b ? t7b.t7CropCondition : (props.t7CropCondition ?? "");
  const setT7CropCondition = t7b ? t7b.setT7CropCondition : (props.setT7CropCondition || props.setCropCondition || (() => {}));
  const t7CropProblemDescription = t7b ? t7b.t7CropProblemDescription : (props.t7CropProblemDescription ?? "");
  const setT7CropProblemDescription = t7b ? t7b.setT7CropProblemDescription : (props.setT7CropProblemDescription || props.setCropProblemDescription || (() => {}));
  const t7ProductResponse = t7b ? t7b.t7ProductResponse : (props.t7ProductResponse ?? "");
  const setT7ProductResponse = t7b ? t7b.setT7ProductResponse : (props.setT7ProductResponse || props.setProductResponse || (() => {}));
  const t7ProblemDescription = t7b ? t7b.t7ProblemDescription : (props.t7ProblemDescription ?? "");
  const setT7ProblemDescription = t7b ? t7b.setT7ProblemDescription : (props.setT7ProblemDescription || props.setProblemDescription || (() => {}));
  const t7PlotImages = t7b ? t7b.t7PlotImages : (props.t7PlotImages ?? []);
  const setT7PlotImages = t7b ? t7b.setT7PlotImages : (props.setT7PlotImages || props.setPlotImages || (() => {}));
  const t7PlotStatus = t7b ? t7b.t7PlotStatus : (props.t7PlotStatus ?? "IN_PROGRESS");
  const setT7PlotStatus = t7b ? t7b.setT7PlotStatus : (props.setT7PlotStatus || props.setPlotStatus || (() => {}));
  const t7NextFollowUpDate = t7b ? t7b.t7NextFollowUpDate : (props.t7NextFollowUpDate ?? "");
  const setT7NextFollowUpDate = t7b ? t7b.setT7NextFollowUpDate : (props.setT7NextFollowUpDate || props.setNextFollowUpDate || (() => {}));
  const t7aNextSprayDate = t7a ? t7a.t7NextSprayDate : (props.t7NextSprayDate ?? "");
  const setT7aNextSprayDate = t7a ? t7a.setT7NextSprayDate : (props.setT7NextSprayDate || props.setNextSprayDate || (() => {}));
  const t7bNextSprayDate = t7b ? t7b.t7NextSprayDate : (props.t7NextSprayDate ?? "");
  const setT7bNextSprayDate = t7b ? t7b.setT7NextSprayDate : (props.setT7NextSprayDate || props.setNextSprayDate || (() => {}));
  const t7FinalYieldKg = t7b ? t7b.t7FinalYieldKg : (props.t7FinalYieldKg ?? "");
  const setT7FinalYieldKg = t7b ? t7b.setT7FinalYieldKg : (props.setT7FinalYieldKg || props.setFinalYieldKg || (() => {}));
  const t7ControlYieldKg = t7b ? t7b.t7ControlYieldKg : (props.t7ControlYieldKg ?? "");
  const setT7ControlYieldKg = t7b ? t7b.setT7ControlYieldKg : (props.setT7ControlYieldKg || props.setControlYieldKg || (() => {}));
  const t7YieldIncreasePercent = t7b ? t7b.t7YieldIncreasePercent : (props.t7YieldIncreasePercent ?? "");
  const setT7YieldIncreasePercent = t7b ? t7b.setT7YieldIncreasePercent : (props.setT7YieldIncreasePercent || props.setYieldIncreasePercent || (() => {}));
  const t7FarmerSatisfaction = t7b ? t7b.t7FarmerSatisfaction : (props.t7FarmerSatisfaction ?? 0);
  const setT7FarmerSatisfaction = t7b ? t7b.setT7FarmerSatisfaction : (props.setT7FarmerSatisfaction || props.setFarmerSatisfaction || (() => {}));
  const t7CommercialPotential = t7b ? t7b.t7CommercialPotential : (props.t7CommercialPotential ?? "");
  const setT7CommercialPotential = t7b ? t7b.setT7CommercialPotential : (props.setT7CommercialPotential || props.setCommercialPotential || (() => {}));
  const t7FinalSummaryNotes = t7b ? t7b.t7FinalSummaryNotes : (props.t7FinalSummaryNotes ?? "");
  const setT7FinalSummaryNotes = t7b ? t7b.setT7FinalSummaryNotes : (props.setT7FinalSummaryNotes || props.setFinalSummaryNotes || (() => {}));
  const t7VisitHistory = t7b ? t7b.t7VisitHistory : (props.t7VisitHistory ?? []);
  const t7DaysAfterSpray = t7b ? t7b.t7DaysAfterSpray : (props.t7DaysAfterSpray ?? "");
  const setT7DaysAfterSpray = t7b ? t7b.setT7DaysAfterSpray : (props.setT7DaysAfterSpray || props.setDaysAfterSpray || (() => {}));
  const t7bProductRates = t7b ? t7b.t7bProductRates : (props.t7bProductRates ?? []);
  const setT7bProductRates = t7b ? t7b.setT7bProductRates : (props.setT7bProductRates || props.setBProductRates || (() => {}));
  const t7SprayEquipment = t7b ? t7b.t7SprayEquipment : (props.t7SprayEquipment ?? "");
  const setT7SprayEquipment = t7b ? t7b.setT7SprayEquipment : (props.setT7SprayEquipment || props.setSprayEquipment || (() => {}));
  const t7OtherEquipment = t7b ? t7b.t7OtherEquipment : (props.t7OtherEquipment ?? "");
  const setOtherEquipment = t7b ? t7b.setT7OtherEquipment : (props.setOtherEquipment || (() => {}));
  const t7bSprayingRounds = t7b ? t7b.t7bSprayingRounds : (props.t7bSprayingRounds ?? []);
  const setT7bSprayingRounds = t7b ? t7b.setT7bSprayingRounds : (props.setT7bSprayingRounds || (() => {}));

  // TYPE 8
  const t8 = typeHooks?.type8;
  const t8ActualAttendees = t8 ? t8.t8ActualAttendees : (props.t8ActualAttendees ?? "");
  const setT8ActualAttendees = t8 ? t8.setT8ActualAttendees : (props.setT8ActualAttendees || (() => {}));
  const t8FeedbackQnA = t8 ? t8.t8FeedbackQnA : (props.t8FeedbackQnA ?? "");
  const setT8FeedbackQnA = t8 ? t8.setT8FeedbackQnA : (props.setT8FeedbackQnA || props.setFeedbackQnA || (() => {}));
  const t8ProductSalesDetails = t8 ? t8.t8ProductSalesDetails : (props.t8ProductSalesDetails ?? []);
  const setT8ProductSalesDetails = t8 ? t8.setT8ProductSalesDetails : (props.setT8ProductSalesDetails || props.setProductSalesDetails || (() => {}));
  const t8Images = t8 ? t8.t8Images : (props.t8Images ?? []);
  const setT8Images = t8 ? t8.setT8Images : (props.setT8Images || props.setImages || (() => {}));

  // TYPE 9
  const t9 = typeHooks?.type9;
  const t9Formats = t9 ? t9.t9Formats : (props.t9Formats ?? []);
  const setT9Formats = t9 ? t9.setT9Formats : (props.setT9Formats || props.setFormats || (() => {}));
  const t9ActualSales = t9 ? t9.t9ActualSales : (props.t9ActualSales ?? "");
  const setT9ActualSales = t9 ? t9.setT9ActualSales : (props.setT9ActualSales || props.setActualSales || (() => {}));
  const t9ProductSalesDetails = t9 ? t9.t9ProductSalesDetails : (props.t9ProductSalesDetails ?? []);
  const setT9ProductSalesDetails = t9 ? t9.setT9ProductSalesDetails : (props.setT9ProductSalesDetails || props.setProductSalesDetails || (() => {}));
  const t9ActualAttendees = t9 ? t9.t9ActualAttendees : (props.t9ActualAttendees ?? "");
  const setT9ActualAttendees = t9 ? t9.setT9ActualAttendees : (props.setT9ActualAttendees || props.setActualAttendees || (() => {}));
  const t9Images = t9 ? t9.t9Images : (props.t9Images ?? []);
  const setT9Images = t9 ? t9.setT9Images : (props.setT9Images || props.setImages || (() => {}));

  // TYPE 10
  const t10 = typeHooks?.type10;
  const t10ActualAttendees = t10 ? t10.t10ActualAttendees : (props.t10ActualAttendees ?? "");
  const setT10ActualAttendees = t10 ? t10.setT10ActualAttendees : (props.setT10ActualAttendees || (() => {}));
  const t10ActualSalesOrBooking = t10 ? t10.t10ActualSalesOrBooking : (props.t10ActualSalesOrBooking ?? "");
  const setT10ActualSalesOrBooking = t10 ? t10.setT10ActualSalesOrBooking : (props.setT10ActualSalesOrBooking || (() => {}));
  const t10TargetFarmersList = t10 ? t10.t10TargetFarmersList : (props.t10TargetFarmersList ?? "");
  const setT10TargetFarmersList = t10 ? t10.setT10TargetFarmersList : (props.setT10TargetFarmersList || (() => {}));
  const t10FarmerFeedback = t10 ? t10.t10FarmerFeedback : (props.t10FarmerFeedback ?? "");
  const setT10FarmerFeedback = t10 ? t10.setT10FarmerFeedback : (props.setT10FarmerFeedback || props.setFarmerFeedback || (() => {}));
  const t10Images = t10 ? t10.t10Images : (props.t10Images ?? []);
  const setT10Images = t10 ? t10.setT10Images : (props.setT10Images || props.setImages || (() => {}));

  // TYPE 11
  const t11 = typeHooks?.type11;
  const t11StockItems = t11 ? t11.t11StockItems : (props.t11StockItems ?? []);
  const setT11StockItems = t11 ? t11.setT11StockItems : (props.setT11StockItems || props.setStockItems || (() => {}));
  const t11ProductList = t11 ? t11.t11ProductList : (props.t11ProductList ?? "");
  const setT11ProductList = t11 ? t11.setT11ProductList : (props.setT11ProductList || props.setProductList || (() => {}));
  const t11RemainingQty = t11 ? t11.t11RemainingQty : (props.t11RemainingQty ?? "");
  const setT11RemainingQty = t11 ? t11.setT11RemainingQty : (props.setT11RemainingQty || props.setRemainingQty || (() => {}));
  const t11Remarks = t11 ? t11.t11Remarks : (props.t11Remarks ?? "");
  const setT11Remarks = t11 ? t11.setT11Remarks : (props.setT11Remarks || props.setRemarks || (() => {}));
  const t11StockStatus = t11 ? t11.t11StockStatus : (props.t11StockStatus ?? "");
  const setT11StockStatus = t11 ? t11.setT11StockStatus : (props.setT11StockStatus || props.setStockStatus || (() => {}));
  const t11ReorderOpportunity = t11 ? t11.t11ReorderOpportunity : (props.t11ReorderOpportunity ?? "");
  const setT11ReorderOpportunity = t11 ? t11.setT11ReorderOpportunity : (props.setT11ReorderOpportunity || props.setReorderOpportunity || (() => {}));
  const t11NextAction = t11 ? t11.t11NextAction : (props.t11NextAction ?? "");
  const setT11NextAction = t11 ? t11.setT11NextAction : (props.setNextAction || (() => {}));

  const hasAnyActualWorkType = WORK_TYPES.slice(0, 11).some((wt) =>
    isTypeVisible(wt),
  );
  if (!hasAnyActualWorkType) return null;

  return (
    <div className="space-y-4 pt-2">
      <div className="bg-[#eff6ff] border border-blue-100 rounded-xl px-4 py-3 flex items-center gap-2.5 shadow-2xs">
        <BarChart3 className="w-4 h-4 text-blue-600 shrink-0" />
        <h2 className="text-sm font-bold text-blue-900">
          ผลการปฏิบัติงานตามประเภทงาน
        </h2>
      </div>

      <div className="space-y-4 md:space-y-6">
        {/* WORK TYPE 1 */}
        <ActualType1Visit
          isVisible={isTypeVisible("TYPE_1")}
          target={targets.t1}
          productAdvice={t1ProductAdvice}
          setProductAdvice={setT1ProductAdvice}
          detail={t1Detail}
          setDetail={setT1Detail}
          discussionResult={t1DiscussionResult}
          setDiscussionResult={setT1DiscussionResult}
          salesOpportunity={t1SalesOpportunity}
          setSalesOpportunity={setT1SalesOpportunity}
          nextAction={t1NextAction}
          setNextAction={setT1NextAction}
          nextMeetingDate={t1NextMeetingDate}
          setNextMeetingDate={setT1NextMeetingDate}
          products={products}
          farmerHomeAddress={t1FarmerHomeAddress}
          setFarmerHomeAddress={setT1FarmerHomeAddress}
          plotLatitude={t1PlotLatitude}
          setPlotLatitude={setT1PlotLatitude}
          plotLongitude={t1PlotLongitude}
          setPlotLongitude={setT1PlotLongitude}
          plotImages={t1PlotImages}
          setPlotImages={setT1PlotImages}
        />

        {/* WORK TYPE 2 */}
        <ActualType2Followup
          isVisible={isTypeVisible("TYPE_2")}
          target={targets.t2}
          products={products}
          followupResults={t2FollowupResults}
          onUpdateFollowupResults={setT2FollowupResults}
          customerName={t2CustomerName}
          setCustomerName={setT2CustomerName}
          followupDetail={t2FollowupDetail}
          setFollowupDetail={setT2FollowupDetail}
          detail={t2Detail}
          setDetail={setT2Detail}
          usageResult={t2UsageResult}
          setUsageResult={setT2UsageResult}
          problemDetail={t2ProblemDetail}
          setProblemDetail={setT2ProblemDetail}
          images={t2Images}
          setImages={setT2Images}
        />

        {/* WORK TYPE 3 */}
        <ActualType3Sales
          isVisible={isTypeVisible("TYPE_3")}
          target={targets.t3}
          products={products}
          soldProducts={t3SoldProducts}
          setSoldProducts={setT3SoldProducts}
          actualSales={t3ActualSales}
          setActualSales={setT3ActualSales}
          actualQuantity={t3ActualQuantity}
          setActualQuantity={setT3ActualQuantity}
          unclosedReason={t3UnclosedReason}
          setUnclosedReason={setT3UnclosedReason}
          productSalesDetails={t3ProductSalesDetails}
          setProductSalesDetails={setT3ProductSalesDetails}
        />

        {/* WORK TYPE 4 */}
        <ActualType4Collect
          isVisible={isTypeVisible("TYPE_4")}
          target={targets.t4}
          orderNo={t4OrderNo}
          setOrderNo={setT4OrderNo}
          receivedAmount={t4ReceivedAmount}
          setReceivedAmount={setT4ReceivedAmount}
          billingStatus={t4BillingStatus}
          setBillingStatus={setT4BillingStatus}
          collectDetail={t4Detail}
          setCollectDetail={setT4Detail}
          paymentImages={t4PaymentImages}
          onUploadImages={createUploadHandler(setT4PaymentImages)}
          onRemoveImage={(id) => removeImage(setT4PaymentImages, id)}
        />

        {/* WORK TYPE 5 */}
        <ActualType5Survey
          isVisible={isTypeVisible("TYPE_5")}
          target={targets.t5}
          surveyDetails={t5SurveyDetails}
          onUpdateSurveyItem={onUpdateT5SurveyItem}
          competitorBrand={t5CompetitorBrand}
          setCompetitorBrand={setT5CompetitorBrand}
          competitorProduct={t5CompetitorProduct}
          setCompetitorProduct={setT5CompetitorProduct}
        />

        {/* WORK TYPE 6 */}
        <ActualType6Issue
          isVisible={isTypeVisible("TYPE_6")}
          target={targets.t6}
          products={products}
          customers={customers}
          productId={t6ProductId}
          setProductId={setT6ProductId}
          productName={t6ProductName}
          setProductName={setT6ProductName}
          lotNumber={t6LotNumber}
          setLotNumber={setT6LotNumber}
          purchaseChannel={t6PurchaseChannel}
          setPurchaseChannel={setT6PurchaseChannel}
          storeId={t6StoreId}
          setStoreId={setT6StoreId}
          storeName={t6StoreName}
          setStoreName={setT6StoreName}
          issueType={t6IssueType}
          setIssueType={setT6IssueType}
          detail={t6Detail}
          setDetail={setT6Detail}
          status={t6Status}
          setStatus={setT6Status}
          images={t6Images}
          setImages={setT6Images}
          problemDetail={t6ProblemDetail}
          setProblemDetail={setT6ProblemDetail}
          initialSolution={t6InitialSolution}
          setInitialSolution={setT6InitialSolution}
        />

        {/* WORK TYPE 7A: ทำแปลงสาธิต */}
        <ActualType7Demo
          isVisible={isTypeVisible("TYPE_7A")}
          mode="TYPE_7A"
          target={targets.t7a || targets.t7}
          products={products}
          customers={customers}
          planProvince={planProvince}
          farmerProvince={t7FarmerProvince}
          setFarmerProvince={setT7FarmerProvince}
          farmerCustomerId={t7FarmerCustomerId}
          setFarmerCustomerId={setT7FarmerCustomerId}
          farmerName={t7FarmerName}
          setFarmerName={setT7FarmerName}
          farmerPhone={t7FarmerPhone}
          setFarmerPhone={setT7FarmerPhone}
          isUnregisteredFarmer={t7IsUnregisteredFarmer}
          setIsUnregisteredFarmer={setT7IsUnregisteredFarmer}
          dealerName={t7DealerName}
          setDealerName={setT7DealerName}
          dealerCode={t7DealerCode}
          latitude={t7Latitude}
          setLatitude={setT7Latitude}
          longitude={t7Longitude}
          setLongitude={setT7Longitude}
          plotName={t7PlotName}
          setPlotName={setT7PlotName}
          district={t7District}
          setDistrict={setT7District}
          cropCategory={t7CropCategory}
          setCropCategory={setT7CropCategory}
          cropName={t7CropName}
          setCropName={setT7CropName}
          customCropName={t7CustomCropName}
          setCustomCropName={setT7CustomCropName}
          areaRai={t7AreaRai}
          setAreaRai={setT7AreaRai}
          treeCount={t7TreeCount}
          setTreeCount={setT7TreeCount}
          plotObjective={t7PlotObjective}
          setPlotObjective={setT7PlotObjective}
          experimentDetail={t7ExperimentDetail}
          setExperimentDetail={setT7ExperimentDetail}
          mainCropInfo={t7MainCropInfo || t7PlantingAreaCondition}
          setMainCropInfo={setT7MainCropInfo}
          irrigations={t7Irrigations}
          setIrrigations={setT7Irrigations}
          plantingDate={t7PlantingDate}
          setPlantingDate={setT7PlantingDate}
          initialSprayDate={t7InitialSprayDate}
          setInitialSprayDate={setT7InitialSprayDate}
          nextSprayDate={t7aNextSprayDate}
          setNextSprayDate={setT7aNextSprayDate}
          demoProducts={t7DemoProducts}
          setDemoProducts={setT7DemoProducts}
          sprayMethod={t7aSprayMethod}
          setSprayMethod={setT7aSprayMethod}
          hasExternalChemicals={t7aHasExternalChemicals}
          setHasExternalChemicals={setT7aHasExternalChemicals}
          externalProducts={t7aExternalProducts}
          setExternalProducts={setT7aExternalProducts}
          cropAgeValue={t7CropAgeValue}
          setCropAgeValue={setT7CropAgeValue}
          cropAgeUnit={t7CropAgeUnit}
          setCropAgeUnit={setT7CropAgeUnit}
          growthStage={t7GrowthStage}
          setGrowthStage={setT7GrowthStage}
          usageMethod={t7aUsageMethod}
          setUsageMethod={setT7aUsageMethod}
          initialPhotos={t7InitialPhotos}
          setInitialPhotos={setT7InitialPhotos}
          plannedProductId={t7PlannedProductId}
          setPlannedProductId={setT7PlannedProductId}
          actualProductId={t7ActualProductId}
          setActualProductId={setT7ActualProductId}
          actualQuantity={t7ActualQuantity}
          setActualQuantity={setT7ActualQuantity}
          changeReason={t7ChangeReason}
          setChangeReason={setT7ChangeReason}
          customPlotDetail={t7CustomPlotDetail}
          setCustomPlotDetail={setT7CustomPlotDetail}
          startDate={t7StartDate}
          actualDate={new Date().toISOString().split("T")[0]}
          productPrice={t7ProductPrice}
          plantingAreaCondition={t7PlantingAreaCondition}
          setPlantingAreaCondition={setT7PlantingAreaCondition}
          cropCondition={t7CropCondition}
          setCropCondition={setT7CropCondition}
          cropProblemDescription={t7CropProblemDescription}
          setCropProblemDescription={setT7CropProblemDescription}
          productResponse={t7ProductResponse}
          setProductResponse={setT7ProductResponse}
          problemDescription={t7ProblemDescription}
          setProblemDescription={setT7ProblemDescription}
          plotStatus={t7PlotStatus}
          setPlotStatus={setT7PlotStatus}
          nextFollowUpDate={t7NextFollowUpDate}
          setNextFollowUpDate={setT7NextFollowUpDate}
          finalYieldKg={t7FinalYieldKg}
          setFinalYieldKg={setT7FinalYieldKg}
          controlYieldKg={t7ControlYieldKg}
          setControlYieldKg={setT7ControlYieldKg}
          yieldIncreasePercent={t7YieldIncreasePercent}
          setYieldIncreasePercent={setT7YieldIncreasePercent}
          farmerSatisfaction={t7FarmerSatisfaction}
          setFarmerSatisfaction={setT7FarmerSatisfaction}
          commercialPotential={t7CommercialPotential}
          setCommercialPotential={setT7CommercialPotential}
          finalSummaryNotes={t7FinalSummaryNotes}
          setFinalSummaryNotes={setT7FinalSummaryNotes}
          visitHistory={t7VisitHistory}
          demoPlotData={t7DemoPlotData}
          demoPlotId={t7DemoPlotId}
          setDemoPlotId={setT7DemoPlotId}
        />

        {/* WORK TYPE 7B: ติดตามแปลงสาธิต */}
        <ActualType7Demo
          isVisible={isTypeVisible("TYPE_7B")}
          mode="TYPE_7B"
          target={targets.t7b || targets.t7}
          products={products}
          plannedProductId={t7PlannedProductId}
          setPlannedProductId={setT7PlannedProductId}
          actualProductId={t7ActualProductId}
          setActualProductId={setT7ActualProductId}
          actualQuantity={t7ActualQuantity}
          setActualQuantity={setT7ActualQuantity}
          changeReason={t7ChangeReason}
          setChangeReason={setT7ChangeReason}
          plotObjective={t7PlotObjective}
          setPlotObjective={setT7PlotObjective}
          customPlotDetail={t7CustomPlotDetail}
          setCustomPlotDetail={setT7CustomPlotDetail}
          startDate={t7StartDate}
          actualDate={new Date().toISOString().split("T")[0]}
          actualStartDate={t7StartDate}
          setActualStartDate={setT7StartDate}
          daysAfterSpray={t7DaysAfterSpray}
          setDaysAfterSpray={setT7DaysAfterSpray}
          bProductRates={t7bProductRates}
          setBProductRates={setT7bProductRates}
          sprayMethod={t7bSprayMethod}
          setSprayMethod={setT7bSprayMethod}
          hasExternalChemicals={t7bHasExternalChemicals}
          setHasExternalChemicals={setT7bHasExternalChemicals}
          externalProducts={t7bExternalProducts}
          setExternalProducts={setT7bExternalProducts}
          sprayEquipment={t7SprayEquipment}
          setSprayEquipment={setT7SprayEquipment}
          otherEquipment={t7OtherEquipment}
          setOtherEquipment={setOtherEquipment}
          t7bSprayingRounds={t7bSprayingRounds}
          setT7bSprayingRounds={setT7bSprayingRounds}
          nextSprayDate={t7bNextSprayDate}
          setNextSprayDate={setT7bNextSprayDate}
          productPrice={t7ProductPrice}
          plotName={t7PlotName}
          setPlotName={setT7PlotName}
          usageMethod={t7bUsageMethod}
          setUsageMethod={setT7bUsageMethod}
          plantingDate={t7PlantingDate}
          setPlantingDate={setT7PlantingDate}
          plantingAreaCondition={t7PlantingAreaCondition}
          setPlantingAreaCondition={setT7PlantingAreaCondition}
          cropImages={t7CropImages}
          setCropImages={setT7CropImages}
          cropAgeValue={t7CropAgeValue}
          setCropAgeValue={setT7CropAgeValue}
          cropAgeUnit={t7CropAgeUnit}
          setCropAgeUnit={setT7CropAgeUnit}
          growthStage={t7GrowthStage}
          setGrowthStage={setT7GrowthStage}
          cropCondition={t7CropCondition}
          setCropCondition={setT7CropCondition}
          cropProblemDescription={t7CropProblemDescription}
          setCropProblemDescription={setT7CropProblemDescription}
          productResponse={t7ProductResponse}
          setProductResponse={setT7ProductResponse}
          problemDescription={t7ProblemDescription}
          setProblemDescription={setT7ProblemDescription}
          plotImages={t7PlotImages}
          setPlotImages={setT7PlotImages}
          plotStatus={t7PlotStatus}
          setPlotStatus={setT7PlotStatus}
          nextFollowUpDate={t7NextFollowUpDate}
          setNextFollowUpDate={setT7NextFollowUpDate}
          finalYieldKg={t7FinalYieldKg}
          setFinalYieldKg={setT7FinalYieldKg}
          controlYieldKg={t7ControlYieldKg}
          setControlYieldKg={setT7ControlYieldKg}
          yieldIncreasePercent={t7YieldIncreasePercent}
          setYieldIncreasePercent={setT7YieldIncreasePercent}
          farmerSatisfaction={t7FarmerSatisfaction}
          setFarmerSatisfaction={setT7FarmerSatisfaction}
          commercialPotential={t7CommercialPotential}
          setCommercialPotential={setT7CommercialPotential}
          finalSummaryNotes={t7FinalSummaryNotes}
          setFinalSummaryNotes={setT7FinalSummaryNotes}
          visitHistory={t7VisitHistory}
          demoPlotData={t7DemoPlotData}
          demoPlotId={t7DemoPlotId}
          setDemoPlotId={setT7DemoPlotId}
        />

        {/* WORK TYPE 8 */}
        <ActualType8Meeting
          isVisible={isTypeVisible("TYPE_8")}
          target={targets.t8}
          actualAttendees={t8ActualAttendees}
          setActualAttendees={setT8ActualAttendees}
          feedbackQnA={t8FeedbackQnA}
          setFeedbackQnA={setT8FeedbackQnA}
          productSalesDetails={t8ProductSalesDetails}
          setProductSalesDetails={setT8ProductSalesDetails}
          images={t8Images}
          setImages={setT8Images}
        />

        {/* WORK TYPE 9 */}
        <ActualType9Store
          isVisible={isTypeVisible("TYPE_9")}
          target={targets.t9}
          formats={t9Formats}
          setFormats={setT9Formats}
          actualSales={t9ActualSales}
          setActualSales={setT9ActualSales}
          productSalesDetails={t9ProductSalesDetails}
          setProductSalesDetails={setT9ProductSalesDetails}
          actualAttendees={t9ActualAttendees}
          setActualAttendees={setT9ActualAttendees}
          images={t9Images}
          setImages={setT9Images}
        />

        {/* WORK TYPE 10 */}
        <ActualType10FieldDay
          isVisible={isTypeVisible("TYPE_10")}
          target={targets.t10}
          actualAttendees={t10ActualAttendees}
          setActualAttendees={setT10ActualAttendees}
          actualSalesOrBooking={t10ActualSalesOrBooking}
          setActualSalesOrBooking={setT10ActualSalesOrBooking}
          targetFarmersList={t10TargetFarmersList}
          setTargetFarmersList={setT10TargetFarmersList}
          farmerFeedback={t10FarmerFeedback}
          setFarmerFeedback={setT10FarmerFeedback}
          images={t10Images}
          setImages={setT10Images}
        />

        {/* WORK TYPE 11 */}
        <ActualType11Stock
          isVisible={isTypeVisible("TYPE_11")}
          target={targets.t11}
          products={products}
          stockItems={t11StockItems}
          setStockItems={setT11StockItems}
          productList={t11ProductList}
          setProductList={setT11ProductList}
          remainingQty={t11RemainingQty}
          setRemainingQty={setT11RemainingQty}
          remarks={t11Remarks}
          setRemarks={setT11Remarks}
          stockStatus={t11StockStatus}
          setStockStatus={setT11StockStatus}
          reorderOpportunity={t11ReorderOpportunity}
          setReorderOpportunity={setT11ReorderOpportunity}
          nextAction={t11NextAction}
          setNextAction={setT11NextAction}
        />

        {/* WORK TYPE 13: ฉีดแปลงแฮตแทค */}
        {typeHooks?.type13 && (
          <Type13Actual
            isVisible={isTypeVisible("ฉีดแปลงแฮตแทค") || isTypeVisible("TYPE_13")}
            actualState={typeHooks.type13}
            products={products}
          />
        )}
      </div>
    </div>
  );
}
