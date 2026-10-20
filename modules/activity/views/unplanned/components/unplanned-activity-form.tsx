"use client";

import React, { useState, useMemo } from "react";
import { Zap, Info } from "lucide-react";
import { toast } from "sonner";
import {
  PlanBasicInfoCard,
  PlanLocationTeamCard,
  usePlanLocationTeam,
  PlanBudgetSection,
  usePlanBudget,
  PlanNotesCard,
  FormActionButtons,
  PlanWorkTypeSelector,
} from "@/modules/activity/ui";
import {
  Type1UnplannedForm,
  useType1UnplannedForm,
  mapType1UnplannedItemToStore,
  hydrateType1UnplannedData,
  type CustomerOption,
  type ProductOption,
} from "@/modules/activity/features/type-1";
import {
  Type2UnplannedForm,
  useType2UnplannedForm,
  hydrateType2UnplannedData,
  mapType2UnplannedToPayload,
} from "@/modules/activity/features/type-2";
import {
  Type3UnplannedForm,
  useType3UnplannedForm,
  hydrateType3UnplannedData,
  mapType3UnplannedToPayload,
} from "@/modules/activity/features/type-3";
import {
  Type4UnplannedForm,
  useType4UnplannedForm,
  hydrateType4UnplannedData,
  mapType4UnplannedToPayload,
} from "@/modules/activity/features/type-4";
import {
  Type5UnplannedForm,
  useType5UnplannedForm,
  hydrateType5UnplannedData,
  mapType5UnplannedToPayload,
  validateType5UnplannedItems,
} from "@/modules/activity/features/type-5";
import {
  Type6UnplannedForm,
  useType6UnplannedForm,
  hydrateType6UnplannedData,
  mapType6UnplannedToPayload,
  validateType6UnplannedItems,
} from "@/modules/activity/features/type-6";
import {
  Type7aUnplannedForm,
  useType7aUnplannedForm,
  hydrateType7aUnplannedData,
  mapType7aUnplannedToPayload,
  validateType7aUnplannedItems,
} from "@/modules/activity/features/type-7a";
import {
  Type7bUnplannedForm,
  useType7bUnplannedForm,
  hydrateType7bUnplannedData,
  mapType7bUnplannedToPayload,
  validateType7bUnplannedItems,
} from "@/modules/activity/features/type-7b";
import {
  Type8UnplannedForm,
  useType8UnplannedForm,
  hydrateType8UnplannedData,
  mapType8UnplannedToPayload,
  validateType8UnplannedItems,
} from "@/modules/activity/features/type-8";
import {
  Type9UnplannedForm,
  useType9UnplannedForm,
  hydrateType9UnplannedData,
  mapType9UnplannedToPayload,
  validateType9UnplannedItems,
} from "@/modules/activity/features/type-9";
import {
  Type10UnplannedForm,
  useType10UnplannedForm,
  hydrateType10UnplannedData,
  mapType10UnplannedToPayload,
  validateType10UnplannedItems,
} from "@/modules/activity/features/type-10";
import {
  Type11UnplannedForm,
  useType11UnplannedForm,
  hydrateType11UnplannedData,
  mapType11UnplannedToPayload,
  validateType11UnplannedItems,
} from "@/modules/activity/features/type-11";
import {
  Type12UnplannedForm,
  useType12UnplannedForm,
  mapType12UnplannedToPayload,
  validateType12UnplannedItem,
} from "@/modules/activity/features/type-12";
import {
  Type13UnplannedForm,
  useType13UnplannedForm,
  mapType13UnplannedToPayload,
  validateType13UnplannedItem,
} from "@/modules/activity/features/type-13";
import {
  WORK_TYPE_CONFIG,
  getWorkTypeCode,
  getWorkTypeName,
} from "@/modules/activity/constants";
import {
  uploadActivityPlanImageGroup,
  deleteActivityPlanImagePaths,
} from "@/modules/activity/application/media/image-uploader";

export interface UnplannedActivityFormProps {
  initialData?: any;
  employees: any[];
  customers: CustomerOption[];
  products: ProductOption[];
  activityTypes?: any[];
  promotionalMaterialsByCategory?: Record<string, any[]>;
  plotList?: any[];
  followUpPlans?: any[];
  onSubmit: (payload: any) => Promise<{ success: boolean; error?: string }>;
  onBack?: () => void;
  readonly?: boolean;
  isEdit?: boolean;
}

export function UnplannedActivityForm({
  initialData = {},
  employees = [],
  customers = [],
  products = [],
  activityTypes = [],
  promotionalMaterialsByCategory,
  plotList = [],
  followUpPlans = [],
  onSubmit,
  onBack,
  readonly = false,
  isEdit = false,
}: UnplannedActivityFormProps) {
  const [submitting, setSubmitting] = useState<boolean>(false);

  // 1. Work Types Selection State (Single Select: ค่าเริ่มต้นว่าง)
  const [selectedWorkTypes, setSelectedWorkTypes] = useState<string[]>(() => {
    // 1. ตรวจสอบจาก Dedicated Target / Stores ของ Type 2 ก่อน (แม่นยำสูงสุด)
    if (
      (initialData.type2Targets && initialData.type2Targets.length > 0) ||
      (initialData.stores && initialData.stores.some((s: any) => s.workTypeCode === "TYPE_2")) ||
      (initialData.products && initialData.products.some((p: any) => p.workTypeCode === "TYPE_2"))
    ) {
      return [WORK_TYPE_CONFIG.TYPE_2.name];
    }
    // 1.1 ตรวจสอบจาก Dedicated Target / Stores ของ Type 3
    if (
      (initialData.type3Targets && initialData.type3Targets.length > 0) ||
      (initialData.stores && initialData.stores.some((s: any) => s.workTypeCode === "TYPE_3")) ||
      (initialData.products && initialData.products.some((p: any) => p.workTypeCode === "TYPE_3"))
    ) {
      return [WORK_TYPE_CONFIG.TYPE_3.name];
    }
    // 1.2 ตรวจสอบจาก Dedicated Target / Stores ของ Type 5
    if (
      (initialData.type5Targets && initialData.type5Targets.length > 0) ||
      (initialData.stores && initialData.stores.some((s: any) => s.workTypeCode === "TYPE_5")) ||
      initialData.type5SurveyRecords ||
      initialData.competitorBrand
    ) {
      return [WORK_TYPE_CONFIG.TYPE_5.name];
    }
    // 1.3 ตรวจสอบจาก Dedicated Target / Stores ของ Type 6
    if (
      (initialData.type6Targets && initialData.type6Targets.length > 0) ||
      (initialData.stores && initialData.stores.some((s: any) => s.workTypeCode === "TYPE_6")) ||
      initialData.type6ActualIssues ||
      initialData.t6IssueRecord
    ) {
      return [WORK_TYPE_CONFIG.TYPE_6.name];
    }
    // 1.4 ตรวจสอบจาก Dedicated Target / Plots ของ Type 7A
    if (
      (initialData.type7aPlots && initialData.type7aPlots.length > 0) ||
      (initialData.demoPlots && initialData.demoPlots.length > 0) ||
      (initialData.type7aUnplannedItems && initialData.type7aUnplannedItems.length > 0) ||
      (initialData.stores && initialData.stores.some((s: any) => s.workTypeCode === "TYPE_7A")) ||
      initialData.demoPlotData
    ) {
      return [WORK_TYPE_CONFIG.TYPE_7A.name];
    }
    // 1.5 ตรวจสอบจาก Dedicated Target / Plots ของ Type 7B
    if (
      (initialData.type7bPlots && initialData.type7bPlots.length > 0) ||
      (initialData.type7bUnplannedItems && initialData.type7bUnplannedItems.length > 0) ||
      initialData.type7b ||
      initialData.type7bData ||
      (initialData.stores && initialData.stores.some((s: any) => s.workTypeCode === "TYPE_7B"))
    ) {
      return [WORK_TYPE_CONFIG.TYPE_7B?.name || "ติดตามแปลงสาธิต"];
    }
    // 1.6 ตรวจสอบจาก Dedicated Target ของ Type 8
    if (
      (initialData.type8UnplannedItems && initialData.type8UnplannedItems.length > 0) ||
      initialData.type8 ||
      initialData.type8Data ||
      (initialData.stores && initialData.stores.some((s: any) => s.workTypeCode === "TYPE_8"))
    ) {
      return [WORK_TYPE_CONFIG.TYPE_8?.name || "จัดประชุม"];
    }
    // 1.7 ตรวจสอบจาก Dedicated Target ของ Type 9
    if (
      (initialData.type9UnplannedItems && initialData.type9UnplannedItems.length > 0) ||
      initialData.type9 ||
      initialData.type9Data ||
      (initialData.stores &&
        initialData.stores.some(
          (s: any) =>
            s.workTypeCode === "TYPE_9" ||
            s.workTypeCode === "จัดกิจกรรมส่งเสริมการขายหน้าร้าน",
        ))
    ) {
      return [WORK_TYPE_CONFIG.TYPE_9?.name || "จัดกิจกรรมส่งเสริมการขายหน้าร้าน"];
    }
    // 1.8 ตรวจสอบจาก Dedicated Target ของ Type 10
    if (
      (initialData.type10UnplannedItems && initialData.type10UnplannedItems.length > 0) ||
      initialData.type10 ||
      initialData.type10Data ||
      (initialData.demoPlotVisits &&
        initialData.demoPlotVisits.some(
          (v: any) =>
            v.workTypeCode === "TYPE_10" ||
            v.workTypeCode === "จัดงาน Field Day",
        ))
    ) {
      return [WORK_TYPE_CONFIG.TYPE_10?.name || "จัดงาน Field Day"];
    }
    // 2. ตรวจสอบจาก workTypes หรือ workTypeCodes
    if (initialData.workTypes && initialData.workTypes.length > 0) {
      const first = initialData.workTypes[0];
      const name = getWorkTypeName(first);
      if (name) return [name];
    }
    if (initialData.workTypeCodes && initialData.workTypeCodes.length > 0) {
      const first = initialData.workTypeCodes[0];
      const name = getWorkTypeName(first);
      if (name) return [name];
    }
    if (initialData.activityType) {
      const code = getWorkTypeCode(initialData.activityType);
      if (code === "TYPE_2") return [WORK_TYPE_CONFIG.TYPE_2.name];
      if (code === "TYPE_3") return [WORK_TYPE_CONFIG.TYPE_3.name];
      if (code === "TYPE_4") return [WORK_TYPE_CONFIG.TYPE_4.name];
      if (code === "TYPE_5") return [WORK_TYPE_CONFIG.TYPE_5.name];
      if (code === "TYPE_6") return [WORK_TYPE_CONFIG.TYPE_6.name];
      if (code === "TYPE_7A") return [WORK_TYPE_CONFIG.TYPE_7A.name];
      if (code === "TYPE_7B") return [WORK_TYPE_CONFIG.TYPE_7B?.name || "ติดตามแปลงสาธิต"];
      if (code === "TYPE_8") return [WORK_TYPE_CONFIG.TYPE_8?.name || "จัดประชุม"];
    }
    if (initialData.type1Stores && initialData.type1Stores.length > 0 && isEdit) {
      return [WORK_TYPE_CONFIG.TYPE_1.name];
    }
    return [];
  });

  const isType1Active = selectedWorkTypes.some(
    (wt) =>
      getWorkTypeCode(wt) === "TYPE_1" ||
      wt.includes("TYPE_1") ||
      wt.includes("เข้าพบ"),
  );
  const isType2Active = selectedWorkTypes.some(
    (wt) =>
      getWorkTypeCode(wt) === "TYPE_2" ||
      wt.includes("TYPE_2") ||
      wt.includes("ติดตามผล"),
  );
  const isType3Active = selectedWorkTypes.some(
    (wt) =>
      getWorkTypeCode(wt) === "TYPE_3" ||
      wt.includes("TYPE_3") ||
      wt.includes("เสนอขาย"),
  );
  const isType4Active = selectedWorkTypes.some(
    (wt) =>
      getWorkTypeCode(wt) === "TYPE_4" ||
      wt.includes("TYPE_4") ||
      wt.includes("วางบิล"),
  );
  const isType5Active = selectedWorkTypes.some(
    (wt) =>
      getWorkTypeCode(wt) === "TYPE_5" ||
      wt.includes("TYPE_5") ||
      wt.includes("สำรวจตลาด"),
  );
  const isType6Active = selectedWorkTypes.some(
    (wt) =>
      getWorkTypeCode(wt) === "TYPE_6" ||
      wt.includes("TYPE_6") ||
      wt.includes("ร้องเรียน"),
  );
  const isType7aActive = selectedWorkTypes.some(
    (wt) =>
      getWorkTypeCode(wt) === "TYPE_7A" ||
      wt.includes("TYPE_7A") ||
      wt.includes("จัดทำแปลงสาธิต") ||
      (wt.includes("แปลงสาธิต") && !wt.includes("ติดตาม")),
  );
  const isType7bActive = selectedWorkTypes.some(
    (wt) =>
      getWorkTypeCode(wt) === "TYPE_7B" ||
      wt.includes("TYPE_7B") ||
      wt.includes("ติดตามแปลงสาธิต"),
  );
  const isType8Active = selectedWorkTypes.some(
    (wt) =>
      getWorkTypeCode(wt) === "TYPE_8" ||
      wt.includes("TYPE_8") ||
      wt.includes("จัดประชุม"),
  );
  const isType9Active = selectedWorkTypes.some(
    (wt) =>
      getWorkTypeCode(wt) === "TYPE_9" ||
      wt.includes("TYPE_9") ||
      wt.includes("จัดกิจกรรมส่งเสริมการขายหน้าร้าน") ||
      wt.includes("กิจกรรมหน้าร้าน"),
  );
  const isType10Active = selectedWorkTypes.some(
    (wt) =>
      getWorkTypeCode(wt) === "TYPE_10" ||
      wt.includes("TYPE_10") ||
      wt.includes("จัดงาน Field Day") ||
      wt.includes("Field Day"),
  );
  const isType11Active = selectedWorkTypes.some(
    (wt) =>
      getWorkTypeCode(wt) === "TYPE_11" ||
      wt.includes("TYPE_11") ||
      wt.includes("ตรวจเช็คสต๊อกหน้าร้าน") ||
      wt.includes("ตรวจเช็กสต็อก"),
  );
  const isType12Active = selectedWorkTypes.some(
    (wt) =>
      getWorkTypeCode(wt) === "TYPE_12" ||
      wt.includes("TYPE_12") ||
      wt.includes("พาลูกค้าศึกษาดูงาน (ทัวร์)") ||
      wt.includes("ศึกษาดูงาน") ||
      wt.includes("ทัวร์"),
  );
  const isType13Active = selectedWorkTypes.some(
    (wt) =>
      getWorkTypeCode(wt) === "TYPE_13" ||
      wt.includes("TYPE_13") ||
      wt.includes("ฉีดแปลงแฮตแทค") ||
      wt.includes("ฉีดแปลงแฮทแทค") ||
      wt.includes("ฉีดแปลง"),
  );

  // 2. Basic Info State
  const [title, setTitle] = useState<string>(initialData.title || "");
  const [startDate, setStartDate] = useState<string>(() => {
    if (initialData.startDate) {
      return new Date(initialData.startDate).toISOString().split("T")[0];
    }
    return new Date().toISOString().split("T")[0];
  });
  const [startTime, setStartTime] = useState<string>(() => {
    if (initialData.startDate) {
      const d = new Date(initialData.startDate);
      return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    }
    return "08:30";
  });
  const [endDate, setEndDate] = useState<string>(() => {
    if (initialData.endDate) {
      return new Date(initialData.endDate).toISOString().split("T")[0];
    }
    return new Date().toISOString().split("T")[0];
  });
  const [endTime, setEndTime] = useState<string>(() => {
    if (initialData.endDate) {
      const d = new Date(initialData.endDate);
      return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    }
    return "17:30";
  });

  // 3. Location & Team Hook
  const locationTeam = usePlanLocationTeam({
    initial: initialData,
    selectedWorkTypes: selectedWorkTypes.map(getWorkTypeCode),
    employees,
    isEdit,
  });

  // 4. Type 1 Unplanned Hook
  const hydratedInitialType1Items = useMemo(
    () => hydrateType1UnplannedData(initialData),
    [initialData],
  );

  const type1 = useType1UnplannedForm({
    initialItems: hydratedInitialType1Items,
    defaultProvince: locationTeam.province,
  });

  // 5. Type 2 Unplanned Hook
  const hydratedInitialType2Items = useMemo(
    () => hydrateType2UnplannedData(initialData),
    [initialData],
  );

  const type2 = useType2UnplannedForm({
    initialItems: hydratedInitialType2Items,
    defaultProvince: locationTeam.province,
  });

  // 5.1 Type 3 Unplanned Hook
  const hydratedInitialType3Items = useMemo(
    () => hydrateType3UnplannedData(initialData),
    [initialData],
  );

  const type3 = useType3UnplannedForm({
    initialItems: hydratedInitialType3Items,
    customersList: customers as any,
    productsList: products as any,
  });

  // 5.2 Type 4 Unplanned Hook
  const hydratedInitialType4Items = useMemo(
    () => hydrateType4UnplannedData(initialData),
    [initialData],
  );

  const type4 = useType4UnplannedForm({
    initialItems: hydratedInitialType4Items,
    customersList: customers as any,
  });

  // 5.3 Type 5 Unplanned Hook
  const hydratedInitialType5Items = useMemo(
    () => hydrateType5UnplannedData(initialData),
    [initialData],
  );

  const type5 = useType5UnplannedForm({
    initialItems: hydratedInitialType5Items,
  });

  // 5.4 Type 6 Unplanned Hook
  const hydratedInitialType6Items = useMemo(
    () => hydrateType6UnplannedData(initialData),
    [initialData],
  );

  const type6 = useType6UnplannedForm({
    initialItems: hydratedInitialType6Items,
  });

  // 5.5 Type 7A Unplanned Hook
  const hydratedInitialType7aItems = useMemo(
    () => hydrateType7aUnplannedData(initialData),
    [initialData],
  );

  const type7a = useType7aUnplannedForm({
    initialItems: hydratedInitialType7aItems,
  });

  // 5.6 Type 7B Unplanned Hook
  const hydratedInitialType7bItems = useMemo(
    () => hydrateType7bUnplannedData(initialData),
    [initialData],
  );

  const type7b = useType7bUnplannedForm({
    initialItems: hydratedInitialType7bItems,
  });

  // 5.7 Type 8 Unplanned Hook
  const hydratedInitialType8Items = useMemo(
    () => hydrateType8UnplannedData(initialData),
    [initialData],
  );

  const type8 = useType8UnplannedForm({
    initialItems: hydratedInitialType8Items,
  });

  // 5.8 Type 9 Unplanned Hook
  const hydratedInitialType9Items = useMemo(
    () => hydrateType9UnplannedData(initialData),
    [initialData],
  );

  const type9 = useType9UnplannedForm({
    initialItems: hydratedInitialType9Items,
  });

  // 5.9 Type 10 Unplanned Hook
  const hydratedInitialType10Items = useMemo(
    () => hydrateType10UnplannedData(initialData),
    [initialData],
  );

  const type10 = useType10UnplannedForm({
    initialItems: hydratedInitialType10Items,
  });

  // 5.11 Type 11 Unplanned Hook
  const hydratedInitialType11Items = useMemo(
    () => hydrateType11UnplannedData(initialData),
    [initialData],
  );

  const type11 = useType11UnplannedForm({
    initialItems: hydratedInitialType11Items,
    customersList: customers as any,
    productsList: products as any,
  });

  // 5.12 Type 12 Unplanned Hook
  const type12 = useType12UnplannedForm({
    initial: initialData,
  });

  // 5.13 Type 13 Unplanned Hook
  const type13 = useType13UnplannedForm({
    initial: initialData,
    dealers: customers as any,
    products: products as any,
  });

  // 6. Budget Hook
  const budget = usePlanBudget({
    initial: initialData,
  });

  // 7. Notes State
  const [notes, setNotes] = useState<string>(initialData.notes || "");

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readonly || submitting) return;

    // 1. Validation - Work Type
    if (selectedWorkTypes.length === 0) {
      toast.error("กรุณาเลือกประเภทงานอย่างน้อย 1 ประเภท");
      return;
    }

    // 2. Validation - Basic Info
    if (!title.trim()) {
      toast.error("กรุณาระบุชื่อกิจกรรม");
      return;
    }
    if (!startDate || !endDate) {
      toast.error("กรุณาระบุวันเวลาเริ่มต้นและสิ้นสุด");
      return;
    }
    const startDateTime = new Date(`${startDate}T${startTime || "08:30"}:00`);
    const endDateTime = new Date(`${endDate}T${endTime || "17:30"}:00`);
    if (endDateTime <= startDateTime) {
      toast.error("วันเวลาสิ้นสุดต้องหลังจากวันเวลาเริ่มต้น");
      return;
    }

    let planStores: any[] = [];
    let planProducts: any[] = [];
    let followupResults: any[] = [];
    let actualData: any = null;
    const uploadPlanId = initialData?.id || "unplanned";

    // 3. Validation & Mapping by Work Type
    if (isType1Active) {
      if (type1.items.length === 0) {
        toast.error("กรุณาระบุร้านค้าหรือเกษตรกรเป้าหมายอย่างน้อย 1 รายการ");
        return;
      }

      const type1Validation = type1.validate(customers);
      if (!type1Validation.isValid) {
        toast.error(type1Validation.error || "ข้อมูลเป้าหมายเข้าพบไม่ถูกต้อง");
        return;
      }

      planStores = type1.items
        .map((item) => mapType1UnplannedItemToStore(item, customers))
        .filter(Boolean);

      const allType1Images = type1.items.flatMap(
        (item) => item.plotImages || [],
      );
      let cleanType1Images = allType1Images;
      if (allType1Images.length > 0) {
        try {
          const res = await uploadActivityPlanImageGroup(
            uploadPlanId,
            allType1Images,
            "type1",
            "plot",
          );
          cleanType1Images = res.updatedImages;
        } catch (uploadErr: any) {
          toast.error(uploadErr.message || "อัปโหลดรูปภาพไม่สำเร็จ");
          return;
        }
      }

      const firstItem = type1.items[0];
      actualData = {
        workTypeCode: "TYPE_1",
        discussionResult: firstItem?.discussionResult || null,
        productAdvice: firstItem?.productAdvice || null,
        advisedProducts: firstItem?.advisedProducts || [],
        attachments: cleanType1Images.map((img) => ({
          category: "PLOT",
          fileUrl: img.url,
          fileName: img.name || "รูปภาพ",
          fileSize: (img as any).size || 0,
          mimeType: (img as any).type || "image/jpeg",
          workTypeCode: "TYPE_1",
        })),
      };
    } else if (isType2Active) {
      if (type2.items.length === 0) {
        toast.error("กรุณาระบุเป้าหมายการติดตามผลอย่างน้อย 1 รายการ");
        return;
      }

      const type2Validation = type2.validate(customers);
      if (!type2Validation.isValid) {
        toast.error(type2Validation.error || "ข้อมูลเป้าหมายติดตามผลไม่ถูกต้อง");
        return;
      }

      const mapped = mapType2UnplannedToPayload(
        type2.items,
        customers,
        products,
      );
      planStores = mapped.planStores;
      planProducts = mapped.planProducts;
      followupResults = mapped.followupResults;

      const allType2Images = type2.items.flatMap(
        (item) => item.images || [],
      );
      let cleanType2Images = allType2Images;
      if (allType2Images.length > 0) {
        try {
          const res = await uploadActivityPlanImageGroup(
            uploadPlanId,
            allType2Images,
            "type2",
            "plot",
          );
          cleanType2Images = res.updatedImages;
        } catch (uploadErr: any) {
          toast.error(uploadErr.message || "อัปโหลดรูปภาพไม่สำเร็จ");
          return;
        }
      }

      actualData = {
        workTypeCode: "TYPE_2",
        attachments: cleanType2Images.map((img) => ({
          category: "PLOT",
          fileUrl: img.url,
          fileName: img.name || "รูปภาพ",
          fileSize: (img as any).size || 0,
          mimeType: (img as any).type || "image/jpeg",
          workTypeCode: "TYPE_2",
        })),
      };
    } else if (isType3Active) {
      if (type3.items.length === 0) {
        toast.error("กรุณาระบุร้านค้าเป้าหมายและรายการสินค้าที่เสนอขายอย่างน้อย 1 รายการ");
        return;
      }

      const type3Validation = type3.validate();
      if (!type3Validation.isValid) {
        toast.error(type3Validation.error || "ข้อมูลเสนอขายสินค้าไม่ถูกต้อง");
        return;
      }

      const mapped = mapType3UnplannedToPayload(
        type3.items,
        customers as any,
        products as any,
      );
      planStores = mapped.planStores;
      planProducts = mapped.planProducts;

      actualData = {
        workTypeCode: "TYPE_3",
        productSalesDetails: mapped.productSalesDetails,
        saleResults: mapped.productSalesDetails,
      };
    } else if (isType4Active) {
      if (type4.items.length === 0) {
        toast.error("กรุณาระบุร้านค้าเป้าหมายสำหรับวางบิล / เก็บเงินอย่างน้อย 1 รายการ");
        return;
      }

      const type4Validation = type4.validate();
      if (!type4Validation.isValid) {
        toast.error(type4Validation.error || "ข้อมูลวางบิล / เก็บเงินไม่ถูกต้อง");
        return;
      }

      const mapped = mapType4UnplannedToPayload(
        type4.items,
        customers as any,
      );
      planStores = mapped.planStores;

      const allType4Images = type4.items.flatMap(
        (item) => item.images || [],
      );
      let cleanType4Images = allType4Images;
      if (allType4Images.length > 0) {
        try {
          const res = await uploadActivityPlanImageGroup(
            uploadPlanId,
            allType4Images,
            "type4",
            "payment",
          );
          cleanType4Images = res.updatedImages;
        } catch (uploadErr: any) {
          toast.error(uploadErr.message || "อัปโหลดรูปภาพไม่สำเร็จ");
          return;
        }
      }

      actualData = {
        workTypeCode: "TYPE_4",
        type4Result: mapped.result,
        items: mapped.items,
        receivedAmount: mapped.result.receivedAmount,
        attachments: cleanType4Images.map((img) => ({
          category: "PAYMENT",
          fileUrl: img.url,
          fileName: img.name || "เอกสารชำระเงิน/วางบิล",
          fileSize: (img as any).size || 0,
          mimeType: (img as any).type || "image/jpeg",
          workTypeCode: "TYPE_4",
        })),
      };
    } else if (isType5Active) {
      if (type5.items.length === 0) {
        toast.error("กรุณาระบุรายการสำรวจตลาดของคู่แข่งอย่างน้อย 1 รายการ");
        return;
      }

      const type5Validation = validateType5UnplannedItems(type5.items);
      if (!type5Validation.isValid) {
        toast.error(type5Validation.errors[0] || "ข้อมูลสำรวจตลาดไม่ถูกต้อง");
        return;
      }

      const mapped = mapType5UnplannedToPayload(type5.items);

      // Upload Bottle Images and Promotional Images
      const allBottleImages = type5.items.flatMap((item) => item.bottleImages || []);
      const allPromoImages = type5.items.flatMap((item) => item.promotionalImages || []);
      let cleanBottleImages = allBottleImages;
      let cleanPromoImages = allPromoImages;

      if (allBottleImages.length > 0) {
        try {
          const res = await uploadActivityPlanImageGroup(
            uploadPlanId,
            allBottleImages,
            "type5",
            "product",
          );
          cleanBottleImages = res.updatedImages;
        } catch (uploadErr: any) {
          toast.error(uploadErr.message || "อัปโหลดรูปขวดผลิตภัณฑ์ไม่สำเร็จ");
          return;
        }
      }

      if (allPromoImages.length > 0) {
        try {
          const res = await uploadActivityPlanImageGroup(
            uploadPlanId,
            allPromoImages,
            "type5",
            "media",
          );
          cleanPromoImages = res.updatedImages;
        } catch (uploadErr: any) {
          toast.error(uploadErr.message || "อัปโหลดรูปภาพสื่อส่งเสริมการขายไม่สำเร็จ");
          return;
        }
      }

      actualData = {
        workTypeCode: "TYPE_5",
        type5SurveyRecords: mapped.type5SurveyRecords,
        targetActualResults: mapped.type5SurveyRecords,
        attachments: [
          ...cleanBottleImages.map((img) => ({
            category: "PRODUCT",
            fileUrl: img.url,
            fileName: img.name || "รูปถ่ายขวดผลิตภัณฑ์",
            fileSize: (img as any).size || 0,
            mimeType: (img as any).type || "image/jpeg",
            workTypeCode: "TYPE_5",
          })),
          ...cleanPromoImages.map((img) => ({
            category: "MEDIA",
            fileUrl: img.url,
            fileName: img.name || "รูปภาพสื่อโปรโมท",
            fileSize: (img as any).size || 0,
            mimeType: (img as any).type || "image/jpeg",
            workTypeCode: "TYPE_5",
          })),
        ],
      };
    } else if (isType6Active) {
      if (type6.items.length === 0) {
        toast.error("กรุณาระบุรายการตรวจสอบเรื่องร้องเรียนอย่างน้อย 1 รายการ");
        return;
      }

      const type6Validation = validateType6UnplannedItems(type6.items);
      if (!type6Validation.isValid) {
        toast.error(type6Validation.errors[0] || "ข้อมูลตรวจสอบเรื่องร้องเรียนไม่ถูกต้อง");
        return;
      }

      const mapped = mapType6UnplannedToPayload(type6.items);

      // Upload Evidence Images
      const allType6Images = type6.items.flatMap((item) => item.images || []);
      let cleanType6Images = allType6Images;
      if (allType6Images.length > 0) {
        try {
          const res = await uploadActivityPlanImageGroup(
            uploadPlanId,
            allType6Images,
            "type6",
            "issue",
          );
          cleanType6Images = res.updatedImages;
        } catch (uploadErr: any) {
          toast.error(uploadErr.message || "อัปโหลดรูปภาพหลักฐานไม่สำเร็จ");
          return;
        }
      }

      actualData = {
        workTypeCode: "TYPE_6",
        type6ActualIssues: mapped.type6ActualIssues,
        targetActualResults: mapped.type6ActualIssues,
        attachments: cleanType6Images.map((img) => ({
          category: "ISSUE",
          fileUrl: img.url,
          fileName: img.name || "รูปถ่ายหลักฐานปัญหา",
          fileSize: (img as any).size || 0,
          mimeType: (img as any).type || "image/jpeg",
          workTypeCode: "TYPE_6",
        })),
      };
    } else if (isType7aActive) {
      if (type7a.items.length === 0) {
        toast.error("กรุณาระบุแปลงสาธิตอย่างน้อย 1 รายการ");
        return;
      }

      const type7aValidation = validateType7aUnplannedItems(type7a.items);
      if (!type7aValidation.isValid) {
        toast.error(type7aValidation.errors[0] || "ข้อมูลจัดทำแปลงสาธิตไม่ถูกต้อง");
        return;
      }

      const mapped = mapType7aUnplannedToPayload(type7a.items);

      // Upload Evidence / Plot Images
      const allType7aImages = type7a.items.flatMap((item) => item.initialPhotos || []);
      let cleanType7aImages = allType7aImages;
      if (allType7aImages.length > 0) {
        try {
          const res = await uploadActivityPlanImageGroup(
            uploadPlanId,
            allType7aImages,
            "type7a",
            "plot",
          );
          cleanType7aImages = res.updatedImages;
        } catch (uploadErr: any) {
          toast.error(uploadErr.message || "อัปโหลดรูปภาพแปลงสาธิตไม่สำเร็จ");
          return;
        }
      }

      const firstItem = type7a.items[0];
      actualData = {
        workTypeCode: "TYPE_7A",
        demoPlotId: firstItem?.demoPlotId || null,
        plotName: firstItem?.plotName,
        cropCategory: firstItem?.cropCategory,
        cropName: firstItem?.cropName,
        areaRai: firstItem?.areaRai,
        plotObjective: firstItem?.objective || firstItem?.plotObjective || "",
        latitude: firstItem?.latitude,
        longitude: firstItem?.longitude,
        type7aPlots: mapped.type7aPlots,
        targetActualResults: mapped.type7aPlots,
        attachments: cleanType7aImages.map((img) => ({
          category: "PLOT",
          fileUrl: img.url,
          fileName: img.name || "รูปถ่ายแปลงสาธิต",
          fileSize: (img as any).size || 0,
          mimeType: (img as any).type || "image/jpeg",
          workTypeCode: "TYPE_7A",
        })),
      };
    } else if (isType7bActive) {
      if (type7b.items.length === 0) {
        toast.error("กรุณาระบุแปลงสาธิตที่ติดตามอย่างน้อย 1 รายการ");
        return;
      }

      const type7bValidation = validateType7bUnplannedItems(type7b.items);
      if (!type7bValidation.isValid) {
        toast.error(type7bValidation.errors?.[0] || "ข้อมูลติดตามแปลงสาธิตไม่ถูกต้อง");
        return;
      }

      const mapped = mapType7bUnplannedToPayload(type7b.items);

      // Upload Evidence / Follow-up Images
      const allType7bImages = type7b.items.flatMap((item) => item.photos || []);
      let cleanType7bImages = allType7bImages;
      if (allType7bImages.length > 0) {
        try {
          const res = await uploadActivityPlanImageGroup(
            uploadPlanId,
            allType7bImages,
            "type7b",
            "plot",
          );
          cleanType7bImages = res.updatedImages;
        } catch (uploadErr: any) {
          toast.error(uploadErr.message || "อัปโหลดรูปภาพติดตามแปลงสาธิตไม่สำเร็จ");
          return;
        }
      }

      if (mapped.planProducts?.length) {
        planProducts = [...planProducts, ...mapped.planProducts];
      }

      const firstItem = type7b.items[0];
      actualData = {
        workTypeCode: "TYPE_7B",
        notes: firstItem?.notes || "",
        actualOutcome: mapped.actualOutcome,
        attachments: cleanType7bImages.map((img) => ({
          category: "PLOT",
          fileUrl: img.url,
          fileName: img.name || "รูปถ่ายติดตามแปลงสาธิต",
          fileSize: (img as any).size || 0,
          mimeType: (img as any).type || "image/jpeg",
          workTypeCode: "TYPE_7B",
        })),
      };
    } else if (isType8Active) {
      if (type8.items.length === 0) {
        toast.error("กรุณาระบุข้อมูลการจัดประชุมอย่างน้อย 1 รายการ");
        return;
      }

      const type8Validation = validateType8UnplannedItems(type8.items);
      if (!type8Validation.isValid) {
        toast.error(type8Validation.errors?.[0] || "ข้อมูลการจัดประชุมไม่ถูกต้อง");
        return;
      }

      // Upload Registration & Atmosphere Images
      const allType8RegImages = type8.items.flatMap((item) => item.registrationImages || []);
      let cleanType8RegImages = allType8RegImages;
      if (allType8RegImages.length > 0) {
        try {
          const res = await uploadActivityPlanImageGroup(
            uploadPlanId,
            allType8RegImages,
            "type8",
            "registration",
          );
          cleanType8RegImages = res.updatedImages;
        } catch (uploadErr: any) {
          toast.error(uploadErr.message || "อัปโหลดรูปใบลงทะเบียนไม่สำเร็จ");
          return;
        }
      }

      const allType8AtmosImages = type8.items.flatMap((item) => item.images || []);
      let cleanType8AtmosImages = allType8AtmosImages;
      if (allType8AtmosImages.length > 0) {
        try {
          const res = await uploadActivityPlanImageGroup(
            uploadPlanId,
            allType8AtmosImages,
            "type8",
            "atmosphere",
          );
          cleanType8AtmosImages = res.updatedImages;
        } catch (uploadErr: any) {
          toast.error(uploadErr.message || "อัปโหลดรูปบรรยากาศการประชุมไม่สำเร็จ");
          return;
        }
      }

      const mapped = mapType8UnplannedToPayload(
        type8.items.map((item) => ({
          ...item,
          registrationImages: cleanType8RegImages,
          images: cleanType8AtmosImages,
        })),
      );

      if (mapped.stores?.length) {
        planStores = [...planStores, ...mapped.stores];
      }

      const firstItem = type8.items[0];
      actualData = {
        workTypeCode: "TYPE_8",
        topic: firstItem?.topic,
        meetingTarget: firstItem?.meetingTarget,
        actualAttendees: firstItem?.actualAttendees,
        feedbackQnA: firstItem?.feedbackQnA,
        notes: firstItem?.notes || "",
        type8Actual: mapped.actualOutcome?.type8Actual,
        attachments: [
          ...cleanType8RegImages.map((img) => ({
            category: "REGISTRATION",
            fileUrl: img.url,
            fileName: img.name || "รูปใบลงทะเบียนผู้เข้าร่วมงาน",
            fileSize: (img as any).size || 0,
            mimeType: (img as any).type || "image/jpeg",
            workTypeCode: "TYPE_8",
          })),
          ...cleanType8AtmosImages.map((img) => ({
            category: "ATMOSPHERE",
            fileUrl: img.url,
            fileName: img.name || "ภาพถ่ายบรรยากาศการประชุม",
            fileSize: (img as any).size || 0,
            mimeType: (img as any).type || "image/jpeg",
            workTypeCode: "TYPE_8",
          })),
        ],
      };
    } else if (isType9Active) {
      if (type9.items.length === 0) {
        toast.error("กรุณาระบุข้อมูลกิจกรรมหน้าร้านอย่างน้อย 1 รายการ");
        return;
      }

      const type9Validation = validateType9UnplannedItems(type9.items);
      if (!type9Validation.isValid) {
        toast.error(type9Validation.errors?.[0] || "ข้อมูลจัดกิจกรรมส่งเสริมการขายหน้าร้านไม่ถูกต้อง (Type 9)");
        return;
      }

      // Upload Store Event Atmosphere Images
      const allType9Images = type9.items.flatMap((item) => item.images || []);
      let cleanType9Images = allType9Images;
      if (allType9Images.length > 0) {
        try {
          const res = await uploadActivityPlanImageGroup(
            uploadPlanId,
            allType9Images,
            "type9",
            "atmosphere",
          );
          cleanType9Images = res.updatedImages;
        } catch (uploadErr: any) {
          toast.error(uploadErr.message || "อัปโหลดรูปภาพกิจกรรมหน้าร้านไม่สำเร็จ");
          return;
        }
      }

      const mapped = mapType9UnplannedToPayload(
        type9.items.map((item) => ({
          ...item,
          images: cleanType9Images,
        })),
      );

      if (mapped.planStores?.length) {
        planStores = [...planStores, ...mapped.planStores];
      }
      if (mapped.planProducts?.length) {
        planProducts = [...planProducts, ...mapped.planProducts];
      }

      const firstItem = type9.items[0];
      actualData = {
        workTypeCode: "TYPE_9",
        actualSales: firstItem?.actualSales,
        actualAttendees: firstItem?.actualAttendees,
        notes: firstItem?.notes || "",
        type9Actual: mapped.actualOutcome?.type9Actual,
        saleResults: mapped.actualOutcome?.saleResults,
        attachments: cleanType9Images.map((img) => ({
          category: "ATMOSPHERE",
          fileUrl: img.url,
          fileName: img.name || "ภาพถ่ายกิจกรรมหน้าร้าน",
          fileSize: (img as any).size || 0,
          mimeType: (img as any).type || "image/jpeg",
          workTypeCode: "TYPE_9",
        })),
      };
    } else if (isType10Active) {
      if (type10.items.length === 0) {
        toast.error("กรุณาระบุข้อมูลจัดงาน Field Day อย่างน้อย 1 รายการ");
        return;
      }

      const type10Validation = validateType10UnplannedItems(type10.items);
      if (!type10Validation.isValid) {
        toast.error(
          type10Validation.errors?.[0] ||
            "ข้อมูลจัดงาน Field Day ไม่ถูกต้อง (Type 10)",
        );
        return;
      }

      // Upload Field Day Atmosphere Images
      const allType10Images = type10.items.flatMap(
        (item) => item.images || [],
      );
      let cleanType10Images = allType10Images;
      if (allType10Images.length > 0) {
        try {
          const res = await uploadActivityPlanImageGroup(
            uploadPlanId,
            allType10Images,
            "type10",
            "atmosphere",
          );
          cleanType10Images = res.updatedImages;
        } catch (uploadErr: any) {
          toast.error(
            uploadErr.message || "อัปโหลดรูปภาพงาน Field Day ไม่สำเร็จ",
          );
          return;
        }
      }

      const mapped = mapType10UnplannedToPayload(
        type10.items.map((item) => ({
          ...item,
          images: cleanType10Images,
        })),
      );

      const firstItem = type10.items[0];
      actualData = {
        workTypeCode: "TYPE_10",
        actualAttendees: firstItem?.actualAttendees,
        actualSales: firstItem?.actualSalesOrBooking,
        notes: firstItem?.notes || "",
        type10Actual: mapped.actualOutcome?.type10Actual,
        saleResults: mapped.actualOutcome?.saleResults,
        attachments: cleanType10Images.map((img) => ({
          category: "ATMOSPHERE",
          fileUrl: img.url,
          fileName: img.name || "ภาพถ่ายบรรยากาศงาน Field Day",
          fileSize: (img as any).size || 0,
          mimeType: (img as any).type || "image/jpeg",
          workTypeCode: "TYPE_10",
        })),
      };
    } else if (isType11Active) {
      if (type11.items.length === 0) {
        toast.error("กรุณาระบุข้อมูลตรวจเช็กสต็อกอย่างน้อย 1 ร้านค้า");
        return;
      }

      const type11Validation = validateType11UnplannedItems(type11.items);
      if (!type11Validation.isValid) {
        toast.error(
          type11Validation.errors?.[0] ||
            "ข้อมูลตรวจเช็คสต๊อกหน้าร้านไม่ถูกต้อง (Type 11)",
        );
        return;
      }

      // Upload Stock Photos
      const allType11Images = type11.items.flatMap(
        (item) => item.images || [],
      );
      let cleanType11Images = allType11Images;
      if (allType11Images.length > 0) {
        try {
          const res = await uploadActivityPlanImageGroup(
            uploadPlanId,
            allType11Images,
            "stock",
            "general",
          );
          cleanType11Images = res.updatedImages;
        } catch (uploadErr: any) {
          toast.error(
            uploadErr.message || "อัปโหลดรูปภาพตรวจเช็กสต็อกไม่สำเร็จ",
          );
          return;
        }
      }

      const mapped = mapType11UnplannedToPayload(
        type11.items.map((item) => ({
          ...item,
          images: cleanType11Images,
        })),
      );

      if (mapped.planStores?.length) {
        planStores = [...planStores, ...mapped.planStores];
      }

      const firstItem = type11.items[0];
      actualData = {
        workTypeCode: "TYPE_11",
        notes: firstItem?.remarks || "",
        t11StockItems: mapped.t11StockItems,
        stockResults: mapped.stockResults,
        t11NextAction: mapped.t11NextAction,
        attachments: cleanType11Images.map((img) => ({
          category: "STOCK",
          fileUrl: img.url,
          fileName: img.name || "รูปภาพสต็อกสินค้า",
          fileSize: (img as any).size || 0,
          mimeType: (img as any).type || "image/jpeg",
          workTypeCode: "TYPE_11",
        })),
      };
    } else if (isType12Active) {
      const type12Validation = type12.validate();
      if (!type12Validation.isValid) {
        toast.error(type12Validation.error || "ข้อมูลพาลูกค้าศึกษาดูงานไม่ถูกต้อง (Type 12)");
        return;
      }

      // Upload Tour Images
      const allType12Images = type12.item.images || [];
      let cleanType12Images = allType12Images;
      if (allType12Images.length > 0) {
        try {
          const res = await uploadActivityPlanImageGroup(
            uploadPlanId,
            allType12Images,
            "type12",
            "tour",
          );
          cleanType12Images = res.updatedImages;
        } catch (uploadErr: any) {
          toast.error(uploadErr.message || "อัปโหลดรูปภาพทัวร์ไม่สำเร็จ");
          return;
        }
      }

      const mapped = mapType12UnplannedToPayload({
        ...type12.item,
        images: cleanType12Images,
      });

      if (mapped.tourData.storeId) {
        const cust = customers.find((c) => c.id === mapped.tourData.storeId);
        planStores = [
          ...planStores,
          {
            workTypeCode: "TYPE_12",
            storeId: mapped.tourData.storeId,
            storeName: cust?.name || type12.item.storeName || null,
            notes: `ทัวร์ร้านค้า ไปยัง ${type12.item.destination || "ปลายทาง"}`,
          },
        ];
      }

      actualData = {
        workTypeCode: "TYPE_12",
        actualAttendees: type12.item.actualAttendees,
        tourData: mapped.tourData,
        type12Actual: mapped.type12Actual,
        attachments: cleanType12Images.map((img) => ({
          category: "TOUR",
          fileUrl: img.url,
          fileName: img.name || "ภาพกิจกรรมศึกษาดูงาน",
          fileSize: (img as any).size || 0,
          mimeType: (img as any).type || "image/jpeg",
          workTypeCode: "TYPE_12",
        })),
      };
    } else if (isType13Active) {
      const type13Validation = type13.validate();
      if (!type13Validation.isValid) {
        toast.error(
          type13Validation.error ||
            "ข้อมูลฉีดแปลงแฮตแทคไม่ถูกต้อง (Type 13)",
        );
        return;
      }

      // Upload After-Spray Images
      const allType13Images = type13.item.images || [];
      let cleanType13Images = allType13Images;
      if (allType13Images.length > 0) {
        try {
          const res = await uploadActivityPlanImageGroup(
            uploadPlanId,
            allType13Images,
            "type13",
            "after_spray",
          );
          cleanType13Images = res.updatedImages;
        } catch (uploadErr: any) {
          toast.error(uploadErr.message || "อัปโหลดรูปภาพการฉีดพ่นไม่สำเร็จ");
          return;
        }
      }

      const mapped = mapType13UnplannedToPayload({
        ...type13.item,
        images: cleanType13Images,
      });

      if (mapped.planStores?.length) {
        planStores = [...planStores, ...mapped.planStores];
      }

      actualData = {
        workTypeCode: "TYPE_13",
        type13Data: mapped.type13Data,
        type13Actual: mapped.type13Actual,
        attachments: cleanType13Images.map((img) => ({
          category: "AFTER_SPRAY",
          fileUrl: img.url,
          fileName: img.name || "ภาพหลังการฉีดพ่น",
          fileSize: (img as any).size || 0,
          mimeType: (img as any).type || "image/jpeg",
          workTypeCode: "TYPE_13",
        })),
      };
    }

    // 4. Resolve activityTypeId
    const matchedType =
      activityTypes.find((t) => {
        if (isType1Active) {
          return (
            t.code === "TYPE_1" ||
            t.code === "VISIT" ||
            t.name?.includes("เข้าพบ")
          );
        }
        if (isType2Active) {
          return (
            t.code === "TYPE_2" ||
            t.code === "FOLLOWUP" ||
            t.name?.includes("ติดตาม")
          );
        }
        if (isType3Active) {
          return (
            t.code === "TYPE_3" ||
            t.code === "SALE" ||
            t.name?.includes("เสนอขาย")
          );
        }
        if (isType4Active) {
          return (
            t.code === "TYPE_4" ||
            t.code === "COLLECT" ||
            t.name?.includes("วางบิล")
          );
        }
        if (isType5Active) {
          return (
            t.code === "TYPE_5" ||
            t.code === "SURVEY" ||
            t.name?.includes("สำรวจตลาด")
          );
        }
        if (isType6Active) {
          return (
            t.code === "TYPE_6" ||
            t.code === "ISSUE" ||
            t.name?.includes("ร้องเรียน")
          );
        }
        if (isType7aActive) {
          return (
            t.code === "TYPE_7A" ||
            t.code === "DEMO" ||
            (t.name?.includes("แปลงสาธิต") && !t.name?.includes("ติดตาม"))
          );
        }
        if (isType7bActive) {
          return (
            t.code === "TYPE_7B" ||
            t.name?.includes("ติดตามแปลงสาธิต")
          );
        }
        if (isType8Active) {
          return (
            t.code === "TYPE_8" ||
            t.code === "MEETING" ||
            t.name?.includes("ประชุม")
          );
        }
        if (isType9Active) {
          return (
            t.code === "TYPE_9" ||
            t.code === "STORE_EVENT" ||
            t.name?.includes("ส่งเสริมการขายหน้าร้าน") ||
            t.name?.includes("กิจกรรมหน้าร้าน")
          );
        }
        if (isType10Active) {
          return (
            t.code === "TYPE_10" ||
            t.code === "FIELD_DAY" ||
            t.name?.includes("Field Day") ||
            t.name?.includes("จัดงาน")
          );
        }
        if (isType11Active) {
          return (
            t.code === "TYPE_11" ||
            t.code === "STOCK" ||
            t.name?.includes("ตรวจเช็คสต๊อก") ||
            t.name?.includes("สต็อก")
          );
        }
        if (isType12Active) {
          return (
            t.code === "TYPE_12" ||
            t.code === "TOUR" ||
            t.name?.includes("ทัวร์") ||
            t.name?.includes("ศึกษาดูงาน")
          );
        }
        if (isType13Active) {
          return (
            t.code === "TYPE_13" ||
            t.code === "HATTACK" ||
            t.name?.includes("ฉีดแปลง") ||
            t.name?.includes("แฮตแทค")
          );
        }
        return false;
      }) || activityTypes[0];

    const activityTypeId =
      matchedType?.id ||
      (isType2Active
        ? "type-2"
        : isType7aActive
          ? "type-7a"
          : isType7bActive
            ? "type-7b"
            : isType8Active
              ? "type-8"
              : isType9Active
                ? "type-9"
                : isType10Active
                  ? "type-10"
                  : isType11Active
                    ? "type-11"
                    : isType12Active
                      ? "type-12"
                      : isType13Active
                        ? "type-13"
                        : "type-1");

    const budgetPayload = budget.buildBudgetPayload();
    const totalBudgetRequested =
      (budgetPayload.marketingBudgetRequested || 0) +
      (budgetPayload.salesPromotionBudgetRequested || 0);

    // 5. Assemble Payload
    const mappedType2 = isType2Active
      ? mapType2UnplannedToPayload(type2.items, customers, products)
      : null;

    const mappedType3 = isType3Active
      ? mapType3UnplannedToPayload(type3.items, customers as any, products as any)
      : null;

    const mappedType4 = isType4Active
      ? mapType4UnplannedToPayload(type4.items, customers as any)
      : null;

    const mappedType5 = isType5Active
      ? mapType5UnplannedToPayload(type5.items)
      : null;

    const mappedType6 = isType6Active
      ? mapType6UnplannedToPayload(type6.items)
      : null;

    const mappedType7a = isType7aActive
      ? mapType7aUnplannedToPayload(type7a.items)
      : null;

    const mappedType7b = isType7bActive
      ? mapType7bUnplannedToPayload(type7b.items)
      : null;

    const mappedType8 = isType8Active
      ? mapType8UnplannedToPayload(type8.items)
      : null;

    const mappedType9 = isType9Active
      ? mapType9UnplannedToPayload(type9.items)
      : null;

    const mappedType10 = isType10Active
      ? mapType10UnplannedToPayload(type10.items)
      : null;

    const payload = {
      planType: "UNPLANNED",
      title: title.trim(),
      startDate: startDateTime,
      endDate: endDateTime,
      activityTypeId,
      workTypeCodes: selectedWorkTypes.map(getWorkTypeCode),
      province: locationTeam.province || null,
      district: locationTeam.district || null,
      location: locationTeam.locationText || null,
      helperEmployeeIds: locationTeam.helperEmployeeIds,
      salesPromotionBudgetRequested: budgetPayload.salesPromotionBudgetRequested,
      marketingBudgetRequested: budgetPayload.marketingBudgetRequested,
      totalBudgetRequested:
        totalBudgetRequested > 0 ? totalBudgetRequested : null,
      notes: notes.trim() || null,
      planStores,
      planProducts,
      followupResults,
      t2FollowupResults: followupResults,
      type2Targets: mappedType2?.type2Targets,
      type3Targets: mappedType3?.type3Targets,
      productSalesDetails: mappedType3?.productSalesDetails,
      saleResults: mappedType3?.saleResults,
      t3ProductSalesDetails: mappedType3?.productSalesDetails,
      type4Targets: mappedType4?.targets,
      type4Items: mappedType4?.targets,
      type4Result: mappedType4?.result,
      type5Targets: mappedType5?.type5Targets,
      type5SurveyRecords: mappedType5?.type5SurveyRecords,
      type6Targets: mappedType6?.type6Targets,
      type6ActualIssues: mappedType6?.type6ActualIssues,
      type7aPlots: mappedType7a?.type7aPlots,
      type7aTargets: mappedType7a?.type7aPlots,
      type7bData: mappedType7b?.type7bData,
      type7bPlots: mappedType7b?.type7bData?.plots,
      type7bTargets: mappedType7b?.type7bData?.plots,
      type8Data: mappedType8?.type8Data,
      type8Meetings: mappedType8?.type8Data?.meetings,
      type8Targets: mappedType8?.targets,
      type9Data: mappedType9?.type9Data,
      type9Targets: mappedType9?.targets,
      type10Data: mappedType10?.type10Data,
      type10Plots: mappedType10?.type10Plots,
      type10Targets: mappedType10?.targets,
      type11Data: isType11Active ? mapType11UnplannedToPayload(type11.items).type11Stores : undefined,
      type11Stores: isType11Active ? mapType11UnplannedToPayload(type11.items).type11Stores : undefined,
      type11Targets: isType11Active ? mapType11UnplannedToPayload(type11.items).type11Stores : undefined,
      tourData: isType12Active ? mapType12UnplannedToPayload(type12.item).tourData : undefined,
      tour: isType12Active ? mapType12UnplannedToPayload(type12.item).tourData : undefined,
      type12Actual: isType12Active ? mapType12UnplannedToPayload(type12.item).type12Actual : undefined,
      type12Data: isType12Active ? mapType12UnplannedToPayload(type12.item).tourData : undefined,
      type13Data: isType13Active ? mapType13UnplannedToPayload(type13.item).type13Data : undefined,
      type13Plots: isType13Active ? mapType13UnplannedToPayload(type13.item).type13Plots : undefined,
      type13Targets: isType13Active ? mapType13UnplannedToPayload(type13.item).type13Plots : undefined,
      type13Actual: isType13Active ? mapType13UnplannedToPayload(type13.item).type13Actual : undefined,
      actualData,
      attachments: actualData?.attachments || [],
      type1UnplannedItems: isType1Active ? type1.items : undefined,
      type5UnplannedItems: isType5Active ? type5.items : undefined,
      type6UnplannedItems: isType6Active ? type6.items : undefined,
      type7aUnplannedItems: isType7aActive ? type7a.items : undefined,
      type7bUnplannedItems: isType7bActive ? type7b.items : undefined,
      type8UnplannedItems: isType8Active ? type8.items : undefined,
      type9UnplannedItems: isType9Active ? type9.items : undefined,
      type10UnplannedItems: isType10Active ? type10.items : undefined,
      type11UnplannedItems: isType11Active ? type11.items : undefined,
      type12UnplannedItem: isType12Active ? type12.item : undefined,
      type13UnplannedItem: isType13Active ? type13.item : undefined,
    };

    // Track old permanent image URLs that were removed by user
    const originalUrls = (initialData?.attachments || [])
      .map((a: any) => a.fileUrl || a.url)
      .filter(
        (u: string) =>
          typeof u === "string" && u.startsWith("/uploads/activity-plans/"),
      );
    const currentUrls = new Set(
      (actualData?.attachments || [])
        .map((a: any) => a.fileUrl || a.url)
        .filter(Boolean),
    );
    const oldUrlsToDelete = originalUrls.filter(
      (u: string) => !currentUrls.has(u),
    );

    try {
      setSubmitting(true);
      const res = await onSubmit(payload);
      if (res.success) {
        if (
          oldUrlsToDelete.length > 0 &&
          uploadPlanId &&
          uploadPlanId !== "unplanned"
        ) {
          await deleteActivityPlanImagePaths(uploadPlanId, oldUrlsToDelete);
        }
      } else {
        toast.error(res.error || "เกิดข้อผิดพลาดในการบันทึก");
      }
    } catch (err: any) {
      toast.error(err.message || "เกิดข้อผิดพลาดไม่คาดคิด");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ─── 0. Form Header ─── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100 shadow-2xs">
            <Zap className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="font-bold text-lg sm:text-2xl text-slate-800 tracking-tight">
              {isEdit
                ? "แก้ไขกิจกรรมนอกแผน ( Unplanned Activity )"
                : "สร้างกิจกรรมนอกแผน ( Unplanned Activity )"}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEdit
                ? "ปรับปรุงข้อมูลและบันทึกผลการปฏิบัติงานนอกแผน"
                : "บันทึกข้อมูลการเข้าพบลูกค้าและผลการดำเนินงานจริงนอกแผน"}
            </p>
          </div>
        </div>

        {initialData?.code && (
          <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-full shadow-2xs self-start sm:self-auto">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>เลขที่กิจกรรม: {initialData.code}</span>
          </div>
        )}
      </div>

      {/* 1. ส่วนกลาง: ข้อมูลระบบ & วันเวลา & ตัวเลือกประเภทงาน */}
      <PlanBasicInfoCard
        isEdit={isEdit}
        readonly={readonly}
        initial={initialData}
        title={title}
        setTitle={setTitle}
        startDate={startDate}
        setStartDate={setStartDate}
        startTime={startTime}
        setStartTime={setStartTime}
        endDate={endDate}
        setEndDate={setEndDate}
        endTime={endTime}
        setEndTime={setEndTime}
        workTypeSelectorNode={
          <PlanWorkTypeSelector
            isSingleSelect={true}
            selectedWorkTypes={selectedWorkTypes}
            setSelectedWorkTypes={setSelectedWorkTypes}
            readonly={readonly}
          />
        }
      />

      {/* 2. ส่วนกลาง: เลือกพื้นที่ & ทีมงานร่วมทาง */}
      <PlanLocationTeamCard
        isVisible={locationTeam.isLocationTeamVisible}
        readonly={readonly}
        isEdit={isEdit}
        helperSearch={locationTeam.helperSearch}
        setHelperSearch={locationTeam.setHelperSearch}
        showHelperDropdown={locationTeam.showHelperDropdown}
        setShowHelperDropdown={locationTeam.setShowHelperDropdown}
        filteredEmployees={locationTeam.filteredEmployees}
        addHelper={locationTeam.addHelper}
        removeHelper={locationTeam.removeHelper}
        helperEmployeeIds={locationTeam.helperEmployeeIds}
        employees={employees}
        locationText={locationTeam.locationText}
        setLocationText={locationTeam.setLocationText}
        province={locationTeam.province}
        setProvince={locationTeam.setProvince}
        district={locationTeam.district}
        setDistrict={locationTeam.setDistrict}
      />

      {/* 3.0 กล่องข้อความเมื่อยังไม่ได้เลือกประเภทงาน */}
      {!isType1Active &&
        !isType2Active &&
        !isType3Active &&
        !isType4Active &&
        !isType5Active &&
        !isType6Active &&
        !isType7aActive &&
        !isType7bActive && (
          <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-8 text-center space-y-2 shadow-2xs">
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 mx-auto flex items-center justify-center">
              <Info className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-700">
              ยังไม่ได้เลือกประเภทงาน
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              กรุณาเลือกประเภทงานจากช่อง &quot;ประเภทงาน&quot; ในส่วนข้อมูลหลักของกิจกรรมด้านบนเพื่อกรอกรายละเอียดเป้าหมาย
            </p>
          </div>
        )}

      {/* 3.1 ส่วนเฉพาะ Type 1: เข้าพบเกษตรกร / ร้านค้า (นอกแผน) */}
      {isType1Active && (
        <Type1UnplannedForm
          items={type1.items}
          addItem={type1.addItem}
          deleteItem={type1.deleteItem}
          updateItem={type1.updateItem}
          customers={customers}
          products={products}
          readonly={readonly}
        />
      )}

      {/* 3.2 ส่วนเฉพาะ Type 2: ติดตามผลการใช้สินค้า (นอกแผน) */}
      {isType2Active && (
        <Type2UnplannedForm
          items={type2.items}
          addItem={type2.addItem}
          deleteItem={type2.deleteItem}
          updateItem={type2.updateItem}
          addProductToItem={type2.addProductToItem}
          updateProductInItem={type2.updateProductInItem}
          deleteProductFromItem={type2.deleteProductFromItem}
          customers={customers}
          products={products}
          readonly={readonly}
        />
      )}

      {/* 3.3 ส่วนเฉพาะ Type 3: เสนอขายสินค้า 2-in-1 (นอกแผน) */}
      {isType3Active && (
        <Type3UnplannedForm
          items={type3.items}
          addItem={type3.addItem}
          removeItem={type3.removeItem}
          updateItem={type3.updateItem}
          addProduct={type3.addProduct}
          removeProduct={type3.removeProduct}
          updateProduct={type3.updateProduct}
          customers={customers as any}
          products={products as any}
          readonly={readonly}
        />
      )}

      {/* 3.4 ส่วนเฉพาะ Type 4: วางบิล / เก็บเงิน 2-in-1 (นอกแผน) */}
      {isType4Active && (
        <Type4UnplannedForm
          items={type4.items}
          addItem={type4.addItem}
          removeItem={type4.removeItem}
          updateItem={type4.updateItem}
          customers={customers as any}
          readonly={readonly}
        />
      )}

      {/* 3.5 ส่วนเฉพาะ Type 5: สำรวจตลาดของคู่แข่ง (นอกแผน) */}
      {isType5Active && (
        <Type5UnplannedForm
          items={type5.items}
          addItem={type5.addItem}
          deleteItem={type5.deleteItem}
          updateItem={type5.updateItem}
          customers={customers as any}
          products={products as any}
          readonly={readonly}
        />
      )}

      {/* 3.6 ส่วนเฉพาะ Type 6: ตรวจสอบเรื่องร้องเรียน / แก้ปัญหา (นอกแผน) */}
      {isType6Active && (
        <Type6UnplannedForm
          items={type6.items}
          addItem={type6.addItem}
          deleteItem={type6.deleteItem}
          updateItem={type6.updateItem}
          customers={customers as any}
          products={products as any}
          readonly={readonly}
        />
      )}

      {/* 3.7 ส่วนเฉพาะ Type 7A: จัดทำแปลงสาธิต (นอกแผน) */}
      {isType7aActive && (
        <Type7aUnplannedForm
          items={type7a.items}
          addItem={type7a.addItem}
          deleteItem={type7a.deleteItem}
          updateItem={type7a.updateItem}
          addProductToItem={type7a.addProductToItem}
          updateProductInItem={type7a.updateProductInItem}
          deleteProductFromItem={type7a.deleteProductFromItem}
          customers={customers as any}
          products={products as any}
          readonly={readonly}
        />
      )}

      {/* 3.8 ส่วนเฉพาะ Type 7B: ติดตามแปลงสาธิต (นอกแผน) */}
      {isType7bActive && (
        <Type7bUnplannedForm
          items={type7b.items}
          addItem={type7b.addItem}
          deleteItem={type7b.deleteItem}
          updateItem={type7b.updateItem}
          addWithdrawnProduct={type7b.addWithdrawnProduct}
          updateWithdrawnProduct={type7b.updateWithdrawnProduct}
          deleteWithdrawnProduct={type7b.deleteWithdrawnProduct}
          plotList={plotList as any}
          followUpPlans={followUpPlans as any}
          products={products as any}
          readonly={readonly}
        />
      )}

      {/* 3.9 ส่วนเฉพาะ Type 8: จัดประชุม (นอกแผน) */}
      {isType8Active && (
        <Type8UnplannedForm
          items={type8.items}
          addItem={type8.addItem}
          deleteItem={type8.deleteItem}
          updateItem={type8.updateItem}
          addPromotion={type8.addPromotion}
          updatePromotion={type8.updatePromotion}
          deletePromotion={type8.deletePromotion}
          customers={customers as any}
          products={products as any}
          readonly={readonly}
        />
      )}

      {/* 3.10 ส่วนเฉพาะ Type 9: จัดกิจกรรมส่งเสริมการขายหน้าร้าน (นอกแผน) */}
      {isType9Active && (
        <Type9UnplannedForm
          items={type9.items}
          addItem={type9.addItem}
          deleteItem={type9.deleteItem}
          updateItem={type9.updateItem}
          addProductItem={type9.addProductItem}
          updateProductItem={type9.updateProductItem}
          deleteProductItem={type9.deleteProductItem}
          customers={customers as any}
          products={products as any}
          readonly={readonly}
        />
      )}

      {/* 3.11 ส่วนเฉพาะ Type 10: จัดงาน Field Day (นอกแผน) */}
      {isType10Active && (
        <Type10UnplannedForm
          items={type10.items}
          addItem={type10.addItem}
          deleteItem={type10.deleteItem}
          updateItem={type10.updateItem}
          addSoldProduct={type10.addSoldProduct}
          updateSoldProduct={type10.updateSoldProduct}
          deleteSoldProduct={type10.deleteSoldProduct}
          products={products as any}
          readonly={readonly}
        />
      )}

      {/* 3.12 ส่วนเฉพาะ Type 11: ตรวจเช็คสต๊อกหน้าร้าน */}
      {isType11Active && (
        <Type11UnplannedForm
          items={type11.items}
          addItem={type11.addItem}
          deleteItem={type11.deleteItem}
          updateItem={type11.updateItem}
          addStockItem={type11.addStockItem}
          updateStockItem={type11.updateStockItem}
          deleteStockItem={type11.deleteStockItem}
          customers={customers as any}
          products={products as any}
          readonly={readonly}
        />
      )}

      {/* 3.13 ส่วนเฉพาะ Type 12: พาลูกค้าศึกษาดูงาน (ทัวร์) */}
      {isType12Active && (
        <Type12UnplannedForm
          item={type12.item}
          onChange={type12.updateItem}
          customers={customers as any}
          readonly={readonly}
        />
      )}

      {/* 3.14 ส่วนเฉพาะ Type 13: ฉีดแปลงแฮตแทค */}
      {isType13Active && (
        <Type13UnplannedForm
          item={type13.item}
          onChange={type13.updateItem}
          dealers={customers as any}
          products={products as any}
          readonly={readonly}
        />
      )}

      {/* 4. ส่วนกลาง: งบประมาณและค่าใช้จ่าย */}
      <PlanBudgetSection
        selectedWorkTypes={selectedWorkTypes.map(getWorkTypeCode)}
        readonly={readonly}
        isPromotionalMediaSelected={budget.isPromotionalMediaSelected}
        setIsPromotionalMediaSelected={budget.setIsPromotionalMediaSelected}
        isSalesPromotionSelected={budget.isSalesPromotionSelected}
        setIsSalesPromotionSelected={budget.setIsSalesPromotionSelected}
        marketingProductItems={budget.marketingProductItems}
        marketingBudgetAmount={budget.marketingBudgetAmount}
        setMarketingBudgetAmount={budget.setMarketingBudgetAmount}
        addMarketingProductItem={budget.addMarketingProductItem}
        updateMarketingProductItem={budget.updateMarketingProductItem}
        deleteMarketingProductItem={budget.deleteMarketingProductItem}
        salesPromotionItems={budget.salesPromotionItems}
        addSalesPromotionRow={budget.addSalesPromotionRow}
        updateSalesPromotionRow={budget.updateSalesPromotionRow}
        deleteSalesPromotionRow={budget.deleteSalesPromotionRow}
        promotionalMaterialsByCategory={promotionalMaterialsByCategory}
      />

      {/* 5. ส่วนกลาง: หมายเหตุ */}
      <PlanNotesCard
        notes={notes}
        setNotes={setNotes}
        readonly={readonly}
      />

      {/* ปุ่มบันทึก */}
      <FormActionButtons
        onBack={onBack}
        loading={submitting}
        readonly={readonly}
        submitLabel={isEdit ? "บันทึกการแก้ไข" : "บันทึกกิจกรรมนอกแผน"}
      />
    </form>
  );
}

export default UnplannedActivityForm;
