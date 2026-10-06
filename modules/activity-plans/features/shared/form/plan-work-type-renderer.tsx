"use client";

import React from "react";
import { SectionHeader } from "@/components/custom/section-header";
import { getWorkTypeCode } from "@/modules/activity-plans/constants";

import { Type1Visit } from "@/modules/activity-plans/features/type-1/create/type1-visit";
import { Type2Followup } from "@/modules/activity-plans/features/type-2/create/type2-followup";
import { Type3Sales } from "@/modules/activity-plans/features/type-3/create/type3-sales";
import { Type4Collect } from "@/modules/activity-plans/features/type-4/create/type4-collect";
import { Type5Survey } from "@/modules/activity-plans/features/type-5/create/type5-survey";
import { Type6Issue } from "@/modules/activity-plans/features/type-6/create/type6-issue";
import { Type7Demo } from "./components/work-types/type7-demo";
import { Type8Meeting } from "@/modules/activity-plans/features/type-8/create/type8-meeting";
import { Type9Store } from "@/modules/activity-plans/features/type-9/create/type9-store";
import { Type10FieldDay } from "@/modules/activity-plans/features/type-10/create/type10-field-day";
import { Type11Stock } from "@/modules/activity-plans/features/type-11/create/type11-stock";
import { Type12Tour } from "@/modules/activity-plans/features/type-12/create/type12-tour";
import { Type13Create } from "@/modules/activity-plans/features/type-13";
import { Type14Create } from "@/modules/activity-plans/features/type-14";

import type { AllTypeFormsHookResult } from "./hooks/use-all-type-forms";

export interface PlanWorkTypeRendererProps {
  selectedWorkTypes: string[];
  typeForms: AllTypeFormsHookResult;
  readonly?: boolean;
  isEdit?: boolean;
  startDate?: string;
  customersList?: any[];
  productsList?: any[];
  productCategoriesList?: any[];
  chemicalGroups?: any[];
  demoPlotsList?: any[];
  followUpPlotsForType7B?: any[];
  followUpPlansWithPlots?: import("@/modules/activity-plans/constants").FollowUpPlanOption[];
  combinedType10DemoPlots?: any[];
  defaultProvince?: string;
  defaultDistrict?: string;
}

export function PlanWorkTypeRenderer({
  selectedWorkTypes,
  typeForms,
  readonly = false,
  isEdit = false,
  startDate = "",
  customersList = [],
  productsList = [],
  productCategoriesList = [],
  chemicalGroups = [],
  demoPlotsList = [],
  followUpPlotsForType7B = [],
  followUpPlansWithPlots = [],
  combinedType10DemoPlots,
  defaultProvince = "",
  defaultDistrict = "",
}: PlanWorkTypeRendererProps) {
  if (!selectedWorkTypes || selectedWorkTypes.length === 0) {
    return null;
  }

  const isType1 = selectedWorkTypes.some(
    (t) =>
      getWorkTypeCode(t) === "TYPE_1" ||
      t === "เข้าพบเกษตรกร" ||
      t === "เข้าพบร้านค้า / Key Farmer",
  );

  const isType2 = selectedWorkTypes.some(
    (t) =>
      getWorkTypeCode(t) === "TYPE_2" ||
      t === "ติดตามผลการใช้สินค้า",
  );

  const isType3 = selectedWorkTypes.some(
    (t) =>
      getWorkTypeCode(t) === "TYPE_3" ||
      t === "เสนอขายสินค้า",
  );

  const isType4 = selectedWorkTypes.some(
    (t) =>
      getWorkTypeCode(t) === "TYPE_4" ||
      t === "วางบิล / เก็บเงิน",
  );

  const isType5 = selectedWorkTypes.some(
    (t) =>
      getWorkTypeCode(t) === "TYPE_5" ||
      t === "สำรวจตลาดของคู่แข่ง",
  );

  const isType6 = selectedWorkTypes.some(
    (t) =>
      getWorkTypeCode(t) === "TYPE_6" ||
      t === "ตรวจสอบเรื่องร้องเรียน / แก้ปัญหา",
  );

  const isType7A = selectedWorkTypes.some(
    (t) =>
      getWorkTypeCode(t) === "TYPE_7A" ||
      t === "ทำแปลงสาธิต",
  );

  const isType7B = selectedWorkTypes.some(
    (t) =>
      getWorkTypeCode(t) === "TYPE_7B" ||
      t === "ติดตามแปลงสาธิต",
  );

  const isType8 = selectedWorkTypes.some(
    (t) =>
      getWorkTypeCode(t) === "TYPE_8" ||
      t === "จัดประชุม" ||
      t === "จัดประชุมการเกษตร / ดีลเลอร์ / ซับดีลเลอร์",
  );

  const isType9 = selectedWorkTypes.some(
    (t) =>
      getWorkTypeCode(t) === "TYPE_9" ||
      t === "จัดกิจกรรมส่งเสริมการขายหน้าร้าน",
  );

  const isType10 = selectedWorkTypes.some(
    (t) =>
      getWorkTypeCode(t) === "TYPE_10" ||
      t === "จัดงาน Field Day" ||
      t.includes("Field Day"),
  );

  const isType11 = selectedWorkTypes.some(
    (t) =>
      getWorkTypeCode(t) === "TYPE_11" ||
      t === "ตรวจเช็กสต็อกหน้าร้าน",
  );

  const isType12 = selectedWorkTypes.some(
    (t) =>
      getWorkTypeCode(t) === "TYPE_12" ||
      t === "ทัวร์",
  );

  const isType13 = selectedWorkTypes.some(
    (t) =>
      getWorkTypeCode(t) === "TYPE_13" ||
      t.includes("ฉีดแปลงแฮตแทค"),
  );

  const isType14 = selectedWorkTypes.some(
    (t) =>
      getWorkTypeCode(t) === "TYPE_14" ||
      t.includes("ติดตามแปลงแฮทแทค"),
  );

  const activeDemoPlotsForType10 =
    combinedType10DemoPlots || typeForms.combinedType10DemoPlots;

  return (
    <div className="space-y-4">
      <SectionHeader
        title="วัตถุประสงค์ของประเภทงาน"
        className="rounded-xl"
        accentColor="#808080"
      />

      <div className="space-y-5">
        {/* Work Type 1: เข้าพบเกษตรกร */}
        {isType1 && (
          <Type1Visit
            readonly={readonly}
            type1Items={typeForms.type1.type1Items}
            addType1Row={typeForms.type1.addType1Row}
            updateType1Row={typeForms.type1.updateType1Row}
            deleteType1Row={typeForms.type1.deleteType1Row}
            customers={customersList}
          />
        )}

        {/* Work Type 2: ติดตามผลการใช้สินค้า */}
        {isType2 && (
          <Type2Followup
            readonly={readonly}
            type2Items={typeForms.type2.type2Items}
            addType2Row={typeForms.type2.addType2Row}
            updateType2Row={typeForms.type2.updateType2Row}
            deleteType2Row={typeForms.type2.deleteType2Row}
            customers={customersList}
            products={productsList}
          />
        )}

        {/* Work Type 3: เสนอขายสินค้า */}
        {isType3 && (
          <Type3Sales
            readonly={readonly}
            type3Items={typeForms.type3.type3Items}
            addType3Row={typeForms.type3.addType3Row}
            updateType3Row={typeForms.type3.updateType3Row}
            deleteType3Row={typeForms.type3.deleteType3Row}
            customers={customersList}
            products={productsList}
          />
        )}

        {/* Work Type 4: วางบิล / เก็บเงิน */}
        {isType4 && (
          <Type4Collect
            readonly={readonly}
            type4Items={typeForms.type4.type4Items}
            addType4Row={typeForms.type4.addType4Row}
            updateType4Row={typeForms.type4.updateType4Row}
            deleteType4Row={typeForms.type4.deleteType4Row}
            customers={customersList}
          />
        )}

        {/* Work Type 5: สำรวจตลาดของคู่แข่ง */}
        {isType5 && (
          <Type5Survey
            readonly={readonly}
            type5Items={typeForms.type5.type5Items}
            addType5Row={typeForms.type5.addType5Row}
            updateType5Row={typeForms.type5.updateType5Row}
            deleteType5Row={typeForms.type5.deleteType5Row}
            customers={customersList}
            products={productsList}
          />
        )}

        {/* Work Type 6: ตรวจสอบเรื่องร้องเรียน / แก้ปัญหา */}
        {isType6 && (
          <Type6Issue
            readonly={readonly}
            type6Items={typeForms.type6.type6Items}
            addType6Row={typeForms.type6.addType6Row}
            updateType6Row={typeForms.type6.updateType6Row}
            deleteType6Row={typeForms.type6.deleteType6Row}
            customers={customersList}
          />
        )}

        {/* Work Type 7A: ทำแปลงสาธิต */}
        {isType7A && (
          <Type7Demo
            mode="TYPE_7A"
            readonly={readonly}
            type7Items={typeForms.type7a.type7aItems}
            addType7Row={typeForms.type7a.addType7aRow}
            updateType7Row={typeForms.type7a.updateType7aRow}
            deleteType7Row={typeForms.type7a.deleteType7aRow}
            customers={customersList}
            products={productsList}
            productCategories={productCategoriesList}
            chemicalGroups={chemicalGroups.length > 0 ? chemicalGroups : productCategoriesList}
            demoPlots={demoPlotsList}
            parentStartDate={startDate}
          />
        )}

        {/* Work Type 7B: ติดตามแปลงสาธิต */}
        {isType7B && (
          <Type7Demo
            mode="TYPE_7B"
            readonly={readonly}
            type7Items={typeForms.type7b.type7bItems}
            addType7Row={typeForms.type7b.addType7bRow}
            updateType7Row={typeForms.type7b.updateType7bRow}
            deleteType7Row={typeForms.type7b.deleteType7bRow}
            customers={customersList}
            products={productsList}
            productCategories={productCategoriesList}
            chemicalGroups={chemicalGroups.length > 0 ? chemicalGroups : productCategoriesList}
            demoPlots={followUpPlotsForType7B}
            followUpPlans={
              followUpPlansWithPlots && followUpPlansWithPlots.length > 0
                ? followUpPlansWithPlots
                : typeForms.type7b.fetchedFollowUpPlansWithPlots
            }
            parentStartDate={startDate}
          />
        )}

        {/* Work Type 8: จัดประชุม */}
        {isType8 && (
          <Type8Meeting
            readonly={readonly}
            type8Items={typeForms.type8.type8Items}
            addType8Row={typeForms.type8.addType8Row}
            updateType8Row={typeForms.type8.updateType8Row}
            deleteType8Row={typeForms.type8.deleteType8Row}
            products={productsList}
            customers={customersList}
            addPromotionProduct={typeForms.type8.addPromotionProduct}
            updatePromotionProduct={typeForms.type8.updatePromotionProduct}
            deletePromotionProduct={typeForms.type8.deletePromotionProduct}
          />
        )}

        {/* Work Type 9: จัดกิจกรรมส่งเสริมการขายหน้าร้าน */}
        {isType9 && (
          <Type9Store
            readonly={readonly}
            subdealerId={typeForms.type9.subdealerId}
            setSubdealerId={typeForms.type9.setSubdealerId}
            subdealerName={typeForms.type9.subdealerName}
            setSubdealerName={typeForms.type9.setSubdealerName}
            isUnregisteredSubdealer={typeForms.type9.isUnregisteredSubdealer}
            setIsUnregisteredSubdealer={typeForms.type9.setIsUnregisteredSubdealer}
            subDealerStore={typeForms.type9.subDealerStore}
            setSubDealerStore={typeForms.type9.setSubDealerStore}
            province={typeForms.type9.subDealerProvince}
            setProvince={typeForms.type9.setSubDealerProvince}
            district={typeForms.type9.subDealerDistrict}
            setDistrict={typeForms.type9.setSubDealerDistrict}
            parentDealerId={typeForms.type9.parentDealerId}
            setParentDealerId={typeForms.type9.setParentDealerId}
            parentDealerName={typeForms.type9.parentDealerName}
            setParentDealerName={typeForms.type9.setParentDealerName}
            type9Store={typeForms.type9.type9Store}
            setType9Store={typeForms.type9.setType9Store}
            isSubDealer={typeForms.type9.type9IsSubDealer}
            setIsSubDealer={typeForms.type9.setType9IsSubDealer}
            type9Sales={typeForms.type9.type9Sales}
            setType9Sales={typeForms.type9.setType9Sales}
            type9ProductItems={typeForms.type9.type9ProductItems}
            addType9ProductItem={typeForms.type9.addType9ProductItem}
            updateType9ProductItem={typeForms.type9.updateType9ProductItem}
            deleteType9ProductItem={typeForms.type9.deleteType9ProductItem}
            customers={customersList}
            products={productsList}
          />
        )}

        {/* Work Type 10: จัดงาน Field Day */}
        {isType10 && (
          <Type10FieldDay
            readonly={readonly}
            isEdit={isEdit}
            type10DemoPlot={typeForms.type10.type10DemoPlot}
            setType10DemoPlot={typeForms.type10.setType10DemoPlot}
            type10Location={typeForms.type10.type10Location}
            setType10Location={typeForms.type10.setType10Location}
            type10TargetCrop={typeForms.type10.type10TargetCrop}
            setType10TargetCrop={typeForms.type10.setType10TargetCrop}
            type10Showcase={typeForms.type10.type10Showcase}
            setType10Showcase={typeForms.type10.setType10Showcase}
            type10Attendees={typeForms.type10.type10Attendees}
            setType10Attendees={typeForms.type10.setType10Attendees}
            type10BookingSales={typeForms.type10.type10BookingSales}
            setType10BookingSales={typeForms.type10.setType10BookingSales}
            demoPlots={activeDemoPlotsForType10}
          />
        )}

        {/* Work Type 11: ตรวจเช็กสต็อกหน้าร้าน */}
        {isType11 && (
          <Type11Stock
            readonly={readonly}
            type11Stores={typeForms.type11.type11Stores}
            setType11Stores={typeForms.type11.setType11Stores}
            customers={customersList}
          />
        )}

        {/* Work Type 12: ทัวร์ */}
        {isType12 && (
          <Type12Tour
            readonly={readonly}
            type12TourType={typeForms.type12.type12TourType}
            setType12TourType={typeForms.type12.setType12TourType}
            type12TourSize={typeForms.type12.type12TourSize}
            setType12TourSize={typeForms.type12.setType12TourSize}
            type12Country={typeForms.type12.type12Country}
            setType12Country={typeForms.type12.setType12Country}
            type12Store={typeForms.type12.type12Store}
            setType12Store={typeForms.type12.setType12Store}
            type12Destination={typeForms.type12.type12Destination}
            setType12Destination={typeForms.type12.setType12Destination}
            customers={customersList}
          />
        )}

        {/* Work Type 13: ฉีดแปลงแฮตแทค */}
        {isType13 && (
          <Type13Create
            plots={typeForms.type13.type13Plots}
            onChange={typeForms.type13.setType13Plots}
            dealers={customersList}
            products={productsList}
            readonly={readonly}
          />
        )}

        {/* Work Type 14: ติดตามแปลงแฮทแทค */}
        {isType14 && (
          <Type14Create
            value={typeForms.type14.type14Data}
            onChange={typeForms.type14.setType14Data}
            dealerCustomers={customersList}
            products={productsList}
            planDate={startDate}
            defaultProvince={defaultProvince}
            defaultDistrict={defaultDistrict}
            readonly={readonly}
          />
        )}
      </div>
    </div>
  );
}
