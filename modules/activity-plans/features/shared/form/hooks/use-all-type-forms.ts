"use client";

import { useMemo, useCallback } from "react";
import { getWorkTypeCode } from "@/modules/activity-plans/constants";

import { useType1Form } from "@/modules/activity-plans/features/type-1/hooks/use-type1-form";
import { useType2Form } from "@/modules/activity-plans/features/type-2/hooks/use-type2-form";
import { useType3Form } from "@/modules/activity-plans/features/type-3/hooks/use-type3-form";
import { useType4Form } from "@/modules/activity-plans/features/type-4/hooks/use-type4-form";
import { useType5Form } from "@/modules/activity-plans/features/type-5/hooks/use-type5-form";
import { useType6Form } from "@/modules/activity-plans/features/type-6/hooks/use-type6-form";
import { useType7aForm } from "@/modules/activity-plans/features/type-7a/hooks/use-type7a-form";
import { useType7bForm } from "@/modules/activity-plans/features/type-7b/hooks/use-type7b-form";
import { useType8Form } from "@/modules/activity-plans/features/type-8/hooks/use-type8-form";
import { useType9Form } from "@/modules/activity-plans/features/type-9/hooks/use-type9-form";
import { useType10Form } from "@/modules/activity-plans/features/type-10/hooks/use-type10-form";
import { useType11Form } from "@/modules/activity-plans/features/type-11/hooks/use-type11-form";
import { useType12Form } from "@/modules/activity-plans/features/type-12/hooks/use-type12-form";
import { useType13Form } from "@/modules/activity-plans/features/type-13/hooks/use-type13-form";
import { useType14Form } from "@/modules/activity-plans/features/type-14/hooks/use-type14-form";

export interface UseAllTypeFormsProps {
  initial?: any;
  initDetails?: any;
  initialTypes?: string[];
  selectedWorkTypes: string[];
  customersList?: any[];
  productsList?: any[];
  productCategoriesList?: any[];
  demoPlotsList?: any[];
  fetchedFollowUpDemoPlots?: any[];
  startDate?: string;
  defaultProvince?: string;
  defaultDistrict?: string;
}

export function useAllTypeForms({
  initial = {},
  initDetails = (initial as any)?.details,
  initialTypes = [],
  selectedWorkTypes = [],
  customersList = [],
  productsList = [],
  productCategoriesList = [],
  demoPlotsList = [],
  fetchedFollowUpDemoPlots = [],
  startDate = "",
  defaultProvince = "",
  defaultDistrict = "",
}: UseAllTypeFormsProps) {
  // 1. Instantiate individual TYPE form hooks
  const type1 = useType1Form({
    initial,
    initDetails,
    customersList,
    selectedWorkTypes,
  });

  const type2 = useType2Form({
    initial,
    initDetails,
    customersList,
    productsList,
    selectedWorkTypes,
  });

  const type3 = useType3Form({
    initial,
    initDetails,
    customersList,
    productsList,
    selectedWorkTypes,
  });

  const type4 = useType4Form({
    initial,
    initDetails,
    customersList,
    selectedWorkTypes,
  });

  const type5 = useType5Form({
    initial,
    initDetails,
    customersList,
    productsList,
    selectedWorkTypes,
  });

  const type6 = useType6Form({
    initial,
    initDetails,
    customersList,
    selectedWorkTypes,
  });

  const type7a = useType7aForm({
    initial,
    initDetails,
    initialTypes,
    customersList,
    productsList,
    productCategoriesList,
    selectedWorkTypes,
    parentStartDate: startDate,
  });

  const type7b = useType7bForm({
    initial,
    initDetails,
    initialTypes,
    fetchedFollowUpDemoPlots,
    demoPlotsList,
    productsList,
    selectedWorkTypes,
    parentStartDate: startDate,
  });

  const type8 = useType8Form({
    initial,
    initDetails,
    customersList,
    productsList,
    selectedWorkTypes,
  });

  const type9 = useType9Form({
    initial,
    initDetails,
    customersList,
    productsList,
    selectedWorkTypes,
  });

  const combinedType10DemoPlots = useMemo(() => {
    const list = [...(demoPlotsList || [])];
    const initialPlot =
      (initial as any)?.demoPlotVisits?.find(
        (v: any) => v.workTypeCode === "TYPE_10",
      )?.demoPlot ||
      (initial as any)?.demoPlotVisits?.[0]?.demoPlot ||
      (initial as any)?.demoPlot;
    if (
      initialPlot &&
      !list.some(
        (p) => p.id === initialPlot.id || p.name === initialPlot.name,
      )
    ) {
      list.unshift(initialPlot);
    }
    return list;
  }, [demoPlotsList, initial]);

  const type10 = useType10Form({
    initial,
    initDetails,
    demoPlotsList: combinedType10DemoPlots,
    selectedWorkTypes,
  });

  const type11 = useType11Form({
    initial,
    initDetails,
    customersList,
    selectedWorkTypes,
  });

  const type12 = useType12Form({
    initial,
    initDetails,
    customersList,
    selectedWorkTypes,
  });

  const type13 = useType13Form({
    initial,
    selectedWorkTypes,
  });

  const type14 = useType14Form({
    initial,
    selectedWorkTypes,
    defaultProvince,
    defaultDistrict,
  });

  // 2. Validate all active work types
  const validateWorkTypes = useCallback((): {
    isValid: boolean;
    error?: string;
  } => {
    const val1 = type1.validateType1();
    if (!val1.isValid) return val1;

    const val2 = type2.validateType2();
    if (!val2.isValid) return val2;

    const val3 = type3.validateType3();
    if (!val3.isValid) return val3;

    const val4 = type4.validateType4();
    if (!val4.isValid) return val4;

    const val5 = type5.validateType5();
    if (!val5.isValid) return val5;

    const val12 = type12.validateType12();
    if (!val12.isValid) return val12;

    const val6 = type6.validateType6();
    if (!val6.isValid) return val6;

    const hasType7ASelected = selectedWorkTypes.some(
      (t) => getWorkTypeCode(t) === "TYPE_7A",
    );
    const hasType7BSelected = selectedWorkTypes.some(
      (t) => getWorkTypeCode(t) === "TYPE_7B",
    );

    if (hasType7ASelected && hasType7BSelected) {
      return {
        isValid: false,
        error: "ห้ามเลือกทำแปลงสาธิตและติดตามแปลงสาธิตพร้อมกันในแผนเดียว",
      };
    }

    const val7a = type7a.validateType7a();
    if (!val7a.isValid) return val7a;

    const val7b = type7b.validateType7b();
    if (!val7b.isValid) return val7b;

    const val8 = type8.validateType8();
    if (!val8.isValid) return val8;

    const val9 = type9.validateType9();
    if (!val9.isValid) return val9;

    const val10 = type10.validateType10();
    if (!val10.isValid) return val10;

    const val11 = type11.validateType11();
    if (!val11.isValid) return val11;

    const val13 = type13.validateType13();
    if (!val13.isValid) return val13;

    const val14 = type14.validateType14();
    if (!val14.isValid) return val14;

    return { isValid: true };
  }, [
    selectedWorkTypes,
    type1,
    type2,
    type3,
    type4,
    type5,
    type6,
    type7a,
    type7b,
    type8,
    type9,
    type10,
    type11,
    type12,
    type13,
    type14,
  ]);

  // 3. Map payloads across all active work types
  const collectPlanPayloads = useCallback(() => {
    const planStores: Array<any> = [];
    const planProducts: Array<any> = [];

    // 1. TYPE_1
    const type1Payload = type1.mapType1Payload(customersList);
    planStores.push(...type1Payload.planStores);

    // 2. TYPE_2
    const type2Payload = type2.mapType2Payload(customersList, productsList);
    planStores.push(...type2Payload.planStores);
    planProducts.push(...type2Payload.planProducts);

    // 3. TYPE_3
    const type3Payload = type3.mapType3Payload(customersList, productsList);
    planStores.push(...type3Payload.planStores);
    planProducts.push(...type3Payload.planProducts);

    // 4. TYPE_4
    const type4Payload = type4.mapType4Payload(customersList);
    planStores.push(...type4Payload.planStores);

    // 5. TYPE_5
    const type5Payload = type5.mapType5Payload(customersList, productsList);
    planStores.push(...type5Payload.planStores);
    planProducts.push(...type5Payload.planProducts);

    // 6. TYPE_6
    const type6Payload = type6.mapType6Payload(customersList);
    planStores.push(...type6Payload.planStores);

    // 7. TYPE_7A / TYPE_7B
    const hasType7APlan = selectedWorkTypes.some(
      (t) => getWorkTypeCode(t) === "TYPE_7A",
    );
    const hasType7BPlan = selectedWorkTypes.some(
      (t) => getWorkTypeCode(t) === "TYPE_7B",
    );

    let submittedDemoPlotData: any = null;
    let submittedDemoPlotId: string | null = null;
    let t7bObjective: string | null = null;

    if (hasType7APlan) {
      const type7aPayload = type7a.mapType7aPayload(
        customersList,
        productsList,
      );
      submittedDemoPlotData = type7aPayload.submittedDemoPlotData;
      planProducts.push(...type7aPayload.planProducts);
    } else if (hasType7BPlan) {
      const type7bPayload = type7b.mapType7bPayload(productsList);
      submittedDemoPlotId = type7bPayload.submittedDemoPlotId;
      if (type7bPayload.t7bObjective) {
        t7bObjective = type7bPayload.t7bObjective;
      }
      planProducts.push(...type7bPayload.planProducts);
    }

    // 8. TYPE_8
    let submittedTargetAttendees: number | null = null;
    let submittedTargetBookingSales: number | null = null;

    const type8Payload = type8.mapType8Payload(customersList, productsList);
    if (type8Payload.targetAttendees > 0) {
      submittedTargetAttendees =
        (submittedTargetAttendees || 0) + type8Payload.targetAttendees;
    }
    planStores.push(...type8Payload.planStores);
    planProducts.push(...type8Payload.planProducts);

    // 9. TYPE_9
    const type9Payload = type9.mapType9Payload(customersList, productsList);
    planStores.push(...type9Payload.planStores);
    planProducts.push(...type9Payload.planProducts);

    // 10. TYPE_10
    const type10Payload = type10.mapType10Payload(combinedType10DemoPlots);
    if (type10Payload.submittedDemoPlotId) {
      submittedDemoPlotId = type10Payload.submittedDemoPlotId;
    }
    if (type10Payload.targetAttendees != null) {
      submittedTargetAttendees = type10Payload.targetAttendees;
    }
    if (type10Payload.targetBookingSales != null) {
      submittedTargetBookingSales = type10Payload.targetBookingSales;
    }

    // 11. TYPE_11
    const type11Payload = type11.mapType11Payload(customersList);
    planStores.push(...type11Payload.planStores);

    // 12. TYPE_12
    const { tourData } = type12.mapType12Payload(customersList);

    // 13. TYPE_13
    const type13Payload = type13.mapType13Payload(customersList);
    planStores.push(...type13Payload.planStores);

    // 14. TYPE_14
    const type14Payload = type14.mapType14Payload(customersList);
    planStores.push(...type14Payload.planStores);

    return {
      planStores,
      planProducts,
      tourData,
      submittedDemoPlotData,
      submittedDemoPlotId,
      t7bObjective,
      submittedTargetAttendees,
      submittedTargetBookingSales,
      type13Payload,
      type14Payload,
    };
  }, [
    customersList,
    productsList,
    selectedWorkTypes,
    combinedType10DemoPlots,
    type1,
    type2,
    type3,
    type4,
    type5,
    type6,
    type7a,
    type7b,
    type8,
    type9,
    type10,
    type11,
    type12,
    type13,
    type14,
  ]);

  return {
    type1,
    type2,
    type3,
    type4,
    type5,
    type6,
    type7a,
    type7b,
    type8,
    type9,
    type10,
    type11,
    type12,
    type13,
    type14,
    combinedType10DemoPlots,
    validateWorkTypes,
    collectPlanPayloads,
  };
}

export type AllTypeFormsHookResult = ReturnType<typeof useAllTypeForms>;
