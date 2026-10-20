"use client";

import React, { useState, useMemo } from "react";
import { Calendar, Info } from "lucide-react";
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
  Type1PlannedForm,
  useType1PlannedForm,
  mapType1PlannedItemToDb,
  hydrateType1PlannedData,
  type CustomerOption,
  type ProductOption,
} from "@/modules/activity/features/type-1";
import {
  Type2PlannedForm,
  useType2PlannedForm,
} from "@/modules/activity/features/type-2";
import {
  Type3PlannedForm,
  useType3PlannedForm,
  hydrateType3PlannedData,
} from "@/modules/activity/features/type-3";
import {
  Type4PlannedForm,
  useType4PlannedForm,
  hydrateType4PlannedData,
} from "@/modules/activity/features/type-4";
import {
  Type5PlannedForm,
  useType5PlannedForm,
  hydrateType5PlannedData,
} from "@/modules/activity/features/type-5";
import {
  Type6PlannedForm,
  useType6PlannedForm,
  hydrateType6PlannedData,
} from "@/modules/activity/features/type-6";
import {
  Type7aPlannedForm,
  useType7aPlannedForm,
  hydrateType7aPlannedData,
} from "@/modules/activity/features/type-7a";
import {
  Type7bPlannedForm,
  useType7bPlannedForm,
  hydrateType7bPlannedData,
} from "@/modules/activity/features/type-7b";
import {
  Type8PlannedForm,
  useType8PlannedForm,
  hydrateType8PlannedData,
} from "@/modules/activity/features/type-8";
import {
  Type9PlannedForm,
  useType9PlannedForm,
  hydrateType9PlannedData,
} from "@/modules/activity/features/type-9";
import {
  Type10PlannedForm,
  useType10PlannedForm,
  hydrateType10PlannedData,
} from "@/modules/activity/features/type-10";
import {
  WORK_TYPE_CONFIG,
  getWorkTypeCode,
  getWorkTypeName,
} from "@/modules/activity/constants";

export interface PlannedActivityFormProps {
  initialData?: any;
  employees: any[];
  customers: CustomerOption[];
  products: ProductOption[];
  activityTypes?: any[];
  promotionalMaterialsByCategory?: Record<string, any[]>;
  demoPlots?: any[];
  followUpPlans?: any[];
  onSubmit: (payload: any) => Promise<{ success: boolean; error?: string }>;
  onBack?: () => void;
  readonly?: boolean;
  isEdit?: boolean;
}

export function PlannedActivityForm({
  initialData = {},
  employees = [],
  customers = [],
  products = [],
  activityTypes = [],
  promotionalMaterialsByCategory,
  demoPlots = [],
  followUpPlans = [],
  onSubmit,
  onBack,
  readonly = false,
  isEdit = false,
}: PlannedActivityFormProps) {
  const [submitting, setSubmitting] = useState<boolean>(false);

  // 1. Work Types Selection State (Single Select: ค่าเริ่มต้นว่าง)
  const [selectedWorkTypes, setSelectedWorkTypes] = useState<string[]>(() => {
    // 1. ตรวจสอบจาก Dedicated Target / Stores ของ Type 2 ก่อน (แม่นยำสูงสุด)
    if (
      (initialData.type2Targets && initialData.type2Targets.length > 0) ||
      (initialData.stores &&
        initialData.stores.some((s: any) => s.workTypeCode === "TYPE_2")) ||
      (initialData.products &&
        initialData.products.some((p: any) => p.workTypeCode === "TYPE_2"))
    ) {
      return [WORK_TYPE_CONFIG.TYPE_2.name];
    }
    // 1.1 ตรวจสอบจาก Dedicated Target / Stores ของ Type 3
    if (
      (initialData.type3Targets && initialData.type3Targets.length > 0) ||
      (initialData.stores &&
        initialData.stores.some((s: any) => s.workTypeCode === "TYPE_3")) ||
      (initialData.products &&
        initialData.products.some((p: any) => p.workTypeCode === "TYPE_3"))
    ) {
      return [WORK_TYPE_CONFIG.TYPE_3.name];
    }
    // 1.2 ตรวจสอบจาก Dedicated Target / Plots ของ Type 7A
    if (
      (initialData.type7aPlots && initialData.type7aPlots.length > 0) ||
      (initialData.demoPlots && initialData.demoPlots.length > 0) ||
      (initialData.stores &&
        initialData.stores.some((s: any) => s.workTypeCode === "TYPE_7A"))
    ) {
      return [WORK_TYPE_CONFIG.TYPE_7A.name];
    }
    // 1.3 ตรวจสอบจาก Dedicated Target / Plots ของ Type 7B
    if (
      (initialData.type7bPlots && initialData.type7bPlots.length > 0) ||
      initialData.type7b ||
      initialData.type7bData ||
      (initialData.stores &&
        initialData.stores.some((s: any) => s.workTypeCode === "TYPE_7B"))
    ) {
      return [WORK_TYPE_CONFIG.TYPE_7B?.name || "ติดตามแปลงสาธิต"];
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
      if (code === "TYPE_7A") return [WORK_TYPE_CONFIG.TYPE_7A.name];
      if (code === "TYPE_7B") return [WORK_TYPE_CONFIG.TYPE_7B?.name || "ติดตามแปลงสาธิต"];
      if (code === "TYPE_8") return [WORK_TYPE_CONFIG.TYPE_8?.name || "จัดประชุม"];
    }
    if (
      (initialData.type8Meetings && initialData.type8Meetings.length > 0) ||
      (initialData.type8Items && initialData.type8Items.length > 0) ||
      (initialData.stores &&
        initialData.stores.some((s: any) => s.workTypeCode === "TYPE_8")) ||
      initialData.type8Data ||
      initialData.type8
    ) {
      return [WORK_TYPE_CONFIG.TYPE_8?.name || "จัดประชุม"];
    }
    if (
      initialData.type1Stores &&
      initialData.type1Stores.length > 0 &&
      isEdit
    ) {
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
      wt.includes("ร้องเรียน") ||
      wt.includes("แก้ปัญหา"),
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

  // 4. Type 1 Planned Hook
  const hydratedInitialItems = useMemo(
    () => hydrateType1PlannedData(initialData),
    [initialData],
  );

  const type1 = useType1PlannedForm({
    initialItems: hydratedInitialItems,
    defaultProvince: locationTeam.province,
  });

  // 5. Type 2 Planned Hook
  const type2 = useType2PlannedForm({
    initial: initialData,
    customersList: customers,
    productsList: products,
    selectedWorkTypes: selectedWorkTypes.map(getWorkTypeCode),
  });

  // 5.1 Type 3 Planned Hook
  const hydratedInitialType3Items = useMemo(
    () => hydrateType3PlannedData(initialData),
    [initialData],
  );

  const type3 = useType3PlannedForm({
    initialItems: hydratedInitialType3Items,
    customersList: customers as any,
    productsList: products as any,
  });

  // 5.2 Type 4 Planned Hook
  const hydratedInitialType4Items = useMemo(
    () => hydrateType4PlannedData(initialData),
    [initialData],
  );

  const type4 = useType4PlannedForm({
    initialItems: hydratedInitialType4Items,
    customersList: customers as any,
  });

  // 5.3 Type 5 Planned Hook
  const hydratedInitialType5Items = useMemo(
    () => hydrateType5PlannedData(initialData),
    [initialData],
  );

  const type5 = useType5PlannedForm({
    initialItems: hydratedInitialType5Items,
    customersList: customers as any,
    productsList: products as any,
    selectedWorkTypes: selectedWorkTypes.map(getWorkTypeCode),
  });

  // 5.5 Type 6 Planned Hook
  const hydratedInitialType6Items = useMemo(
    () => hydrateType6PlannedData(initialData),
    [initialData],
  );

  const type6 = useType6PlannedForm({
    initial: initialData,
    initDetails: { type6Items: hydratedInitialType6Items },
    customersList: customers as any,
    selectedWorkTypes: selectedWorkTypes.map(getWorkTypeCode),
  });

  // 5.6 Type 7A Planned Hook
  const hydratedInitialType7aItems = useMemo(
    () => hydrateType7aPlannedData(initialData),
    [initialData],
  );

  const type7a = useType7aPlannedForm({
    initial: { type7aPlots: hydratedInitialType7aItems },
  });

  // 5.7 Type 7B Planned Hook
  const hydratedInitialType7bItems = useMemo(
    () => hydrateType7bPlannedData(initialData),
    [initialData],
  );

  const type7b = useType7bPlannedForm({
    initialItems: hydratedInitialType7bItems,
  });

  // 5.8 Type 8 Planned Hook
  const hydratedInitialType8Items = useMemo(
    () => hydrateType8PlannedData(initialData),
    [initialData],
  );

  const type8 = useType8PlannedForm({
    initialItems: hydratedInitialType8Items,
  });

  // 5.9 Type 9 Planned Hook
  const hydratedInitialType9Items = useMemo(
    () => hydrateType9PlannedData(initialData),
    [initialData],
  );

  const type9 = useType9PlannedForm({
    initial: initialData,
    initDetails: hydratedInitialType9Items,
    customersList: customers as any,
    productsList: products as any,
    selectedWorkTypes,
  });

  // 5.10 Type 10 Planned Hook
  const hydratedInitialType10Items = useMemo(
    () => hydrateType10PlannedData(initialData),
    [initialData],
  );

  const type10 = useType10PlannedForm({
    initial: initialData,
    initDetails: hydratedInitialType10Items,
    selectedWorkTypes,
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

    // 1. Validation - Basic Info
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

    if (selectedWorkTypes.length === 0) {
      toast.error("กรุณาเลือกประเภทงานอย่างน้อย 1 ประเภท");
      return;
    }

    let planStores: any[] = [];
    let planProducts: any[] = [];

    // 2. Validation & Mapping - Type 1 Items
    if (isType1Active) {
      if (type1.items.length === 0) {
        toast.error(
          "กรุณาระบุร้านค้าหรือเกษตรกรเป้าหมายอย่างน้อย 1 รายการ (Type 1)",
        );
        return;
      }

      const type1Validation = type1.validate(customers);
      if (!type1Validation.isValid) {
        toast.error(type1Validation.error || "ข้อมูลเป้าหมายเข้าพบไม่ถูกต้อง");
        return;
      }

      const t1Stores = type1.items
        .map((item) => mapType1PlannedItemToDb(item, customers))
        .filter(Boolean);

      planStores = [...planStores, ...t1Stores];
    }

    // 3. Validation & Mapping - Type 2 Items
    let type2TargetsPayload: any[] = [];
    if (isType2Active) {
      const type2Validation = type2.validateType2();
      if (!type2Validation.isValid) {
        toast.error(
          type2Validation.error ||
            "ข้อมูลติดตามผลการใช้สินค้าไม่ถูกต้อง (Type 2)",
        );
        return;
      }

      const t2Payload = type2.mapType2Payload(customers, products);
      planStores = [...planStores, ...t2Payload.planStores];
      planProducts = [...planProducts, ...t2Payload.planProducts];
      type2TargetsPayload = t2Payload.type2Targets;
    }

    // 3.1 Validation & Mapping - Type 3 Items
    let type3TargetsPayload: any[] = [];
    if (isType3Active) {
      const type3Validation = type3.validateType3();
      if (!type3Validation.isValid) {
        toast.error(
          type3Validation.error ||
            "ข้อมูลเสนอขายสินค้าไม่ถูกต้อง (Type 3)",
        );
        return;
      }

      const t3Payload = type3.mapType3Payload(customers as any, products as any);
      planStores = [...planStores, ...t3Payload.planStores];
      planProducts = [...planProducts, ...t3Payload.planProducts];
      type3TargetsPayload = t3Payload.type3Targets;
    }

    // 3.2 Validation & Mapping - Type 4 Items
    let type4TargetsPayload: any[] = [];
    if (isType4Active) {
      const type4Validation = type4.validateType4();
      if (!type4Validation.isValid) {
        toast.error(
          type4Validation.error ||
            "ข้อมูลวางบิล / เก็บเงินไม่ถูกต้อง (Type 4)",
        );
        return;
      }

      const t4Payload = type4.mapType4Payload(customers as any);
      planStores = [...planStores, ...t4Payload.planStores];
      type4TargetsPayload = t4Payload.type4Targets;
    }

    // 3.3 Validation & Mapping - Type 5 Items
    let type5TargetsPayload: any[] = [];
    if (isType5Active) {
      const type5Validation = type5.validateType5();
      if (!type5Validation.isValid) {
        toast.error(
          type5Validation.error ||
            "ข้อมูลสำรวจตลาดของคู่แข่งไม่ถูกต้อง (Type 5)",
        );
        return;
      }

      const t5Payload = type5.mapType5Payload(
        customers as any,
        products as any,
      );
      planStores = [...planStores, ...t5Payload.planStores];
      planProducts = [...planProducts, ...t5Payload.planProducts];
      type5TargetsPayload = t5Payload.type5Items;
    }

    // 3.4 Validation & Mapping - Type 6 Items
    let type6TargetsPayload: any[] = [];
    if (isType6Active) {
      const type6Validation = type6.validateType6();
      if (!type6Validation.isValid) {
        toast.error(
          type6Validation.error ||
            "ข้อมูลตรวจสอบเรื่องร้องเรียน / แก้ปัญหาไม่ถูกต้อง (Type 6)",
        );
        return;
      }

      const t6Payload = type6.mapType6Payload(customers as any);
      planStores = [...planStores, ...t6Payload.planStores];
      type6TargetsPayload = t6Payload.type6Items || [];
    }

    // 3.5 Validation & Mapping - Type 7A Items
    let type7aPlotsPayload: any[] = [];
    if (isType7aActive) {
      const type7aValidation = type7a.validate();
      if (!type7aValidation.isValid) {
        toast.error(
          type7aValidation.error ||
            "ข้อมูลจัดทำแปลงสาธิตไม่ถูกต้อง (Type 7A)",
        );
        return;
      }

      type7aPlotsPayload = type7a.type7aPlots;

      const t7Stores = type7a.type7aPlots
        .filter((p) => p.storeId)
        .map((p) => {
          const cust = customers.find((c) => c.id === p.storeId);
          return {
            storeId: p.storeId,
            storeName: cust?.name || p.farmerName || p.ownerName || p.plotName,
            workTypeCode: "TYPE_7A",
          };
        });

      const t7Products = type7a.type7aPlots.flatMap((p) =>
        (p.demoProducts || p.products || []).map((prod) => ({
          productId: prod.productId,
          productName: prod.productName,
          targetQuantity: prod.quantity || (prod as any).targetQuantity || 1,
          workTypeCode: "TYPE_7A",
        })),
      );

      planStores = [...planStores, ...t7Stores];
      planProducts = [...planProducts, ...t7Products];
    }

    // 3.6 Validation & Mapping - Type 7B Items
    let type7bPayload: any = null;
    if (isType7bActive) {
      const type7bValidation = type7b.validateType7b();
      if (!type7bValidation.isValid) {
        toast.error(
          type7bValidation.error ||
            "ข้อมูลติดตามแปลงสาธิตไม่ถูกต้อง (Type 7B)",
        );
        return;
      }

      const t7bMapped = type7b.mapType7bPayload(products as any);
      type7bPayload = t7bMapped.type7bData;
      if (t7bMapped.planProducts?.length) {
        planProducts = [...planProducts, ...t7bMapped.planProducts];
      }
    }

    // 3.7 Validation & Mapping - Type 8 Items
    let type8Payload: any = null;
    if (isType8Active) {
      const type8Validation = type8.validateType8();
      if (!type8Validation.isValid) {
        toast.error(
          type8Validation.error ||
            "ข้อมูลจัดประชุมไม่ถูกต้อง (Type 8)",
        );
        return;
      }

      const t8Mapped = type8.mapType8Payload(customers as any);
      type8Payload = t8Mapped.type8Data;
      if (t8Mapped.stores?.length) {
        planStores = [...planStores, ...t8Mapped.stores];
      }
    }

    // 3.8 Validation & Mapping - Type 9 Items
    let type9Payload: any = null;
    if (isType9Active) {
      const type9Validation = type9.validateType9();
      if (!type9Validation.isValid) {
        toast.error(
          type9Validation.error ||
            "ข้อมูลจัดกิจกรรมส่งเสริมการขายหน้าร้านไม่ถูกต้อง (Type 9)",
        );
        return;
      }

      const t9Mapped = type9.mapType9Payload(customers as any, products as any);
      if (t9Mapped.planStores?.length) {
        planStores = [...planStores, ...t9Mapped.planStores];
      }
      if (t9Mapped.planProducts?.length) {
        planProducts = [...planProducts, ...t9Mapped.planProducts];
      }
      type9Payload = {
        subdealerId: type9.subdealerId,
        subdealerName: type9.subdealerName,
        isUnregisteredSubdealer: type9.isUnregisteredSubdealer,
        subDealerStore: type9.subDealerStore,
        province: type9.subDealerProvince,
        district: type9.subDealerDistrict,
        parentDealerId: type9.parentDealerId,
        parentDealerName: type9.parentDealerName,
        type9Sales: type9.type9Sales,
        products: type9.type9ProductItems,
      };
    }

    // 3.9 Validation & Mapping - Type 10 Items
    let type10Payload: any = null;
    if (isType10Active) {
      const type10Validation = type10.validateType10();
      if (!type10Validation.isValid) {
        toast.error(
          type10Validation.error ||
            "ข้อมูลจัดงาน Field Day ไม่ถูกต้อง (Type 10)",
        );
        return;
      }
      const t10Mapped = type10.mapType10Payload();
      type10Payload = {
        demoPlotId: t10Mapped.submittedDemoPlotId,
        submittedDemoPlotId: t10Mapped.submittedDemoPlotId,
        location: type10.type10Location,
        targetCrop: type10.type10TargetCrop,
        showcase: type10.type10Showcase,
        targetAttendees: t10Mapped.targetAttendees,
        targetAttendeesCount: t10Mapped.targetAttendees,
        targetBookingSales: t10Mapped.targetBookingSales,
        plots: [
          {
            demoPlotId: t10Mapped.submittedDemoPlotId,
            location: type10.type10Location,
            targetAttendeesCount: t10Mapped.targetAttendees,
            targetBookingSales: t10Mapped.targetBookingSales,
          },
        ],
      };
    }

    // 4. Resolve activityTypeId
    const primaryCode = getWorkTypeCode(selectedWorkTypes[0] || "TYPE_1");
    const matchedType =
      activityTypes.find(
        (t) =>
          t.code === primaryCode ||
          (primaryCode === "TYPE_1" &&
            (t.code === "VISIT" || t.name?.includes("เข้าพบ"))) ||
          (primaryCode === "TYPE_2" &&
            (t.code === "FOLLOWUP" || t.name?.includes("ติดตามผล"))) ||
          (primaryCode === "TYPE_3" &&
            (t.code === "SALE" || t.name?.includes("เสนอขาย"))) ||
          (primaryCode === "TYPE_4" &&
            (t.code === "COLLECT" || t.name?.includes("วางบิล"))) ||
          (primaryCode === "TYPE_5" &&
            (t.code === "SURVEY" || t.name?.includes("สำรวจตลาด"))) ||
          (primaryCode === "TYPE_6" &&
            (t.code === "ISSUE" || t.name?.includes("ร้องเรียน") || t.name?.includes("แก้ปัญหา"))) ||
          (primaryCode === "TYPE_7A" &&
            (t.code === "DEMO" || t.code === "TYPE_7A" || (t.name?.includes("แปลงสาธิต") && !t.name?.includes("ติดตาม")))) ||
          (primaryCode === "TYPE_7B" &&
            (t.code === "TYPE_7B" || t.name?.includes("ติดตามแปลงสาธิต"))) ||
          (primaryCode === "TYPE_8" &&
            (t.code === "TYPE_8" || t.code === "MEETING" || t.name?.includes("ประชุม"))) ||
          (primaryCode === "TYPE_9" &&
            (t.code === "TYPE_9" || t.code === "STORE_EVENT" || t.name?.includes("ส่งเสริมการขายหน้าร้าน"))),
      ) || activityTypes[0];

    const activityTypeId = matchedType?.id || "type-1";

    const budgetPayload = budget.buildBudgetPayload();
    const totalBudgetRequested =
      (budgetPayload.marketingBudgetRequested || 0) +
      (budgetPayload.salesPromotionBudgetRequested || 0);

    // 5. Assemble Payload
    const payload = {
      planType: "PLANNED",
      title: title.trim(),
      startDate: startDateTime,
      endDate: endDateTime,
      activityTypeId,
      workTypeCodes: selectedWorkTypes.map(getWorkTypeCode),
      province: locationTeam.province || null,
      district: locationTeam.district || null,
      location: locationTeam.locationText || null,
      helperEmployeeIds: locationTeam.helperEmployeeIds,
      salesPromotionBudgetRequested:
        budgetPayload.salesPromotionBudgetRequested,
      marketingBudgetRequested: budgetPayload.marketingBudgetRequested,
      totalBudgetRequested:
        totalBudgetRequested > 0 ? totalBudgetRequested : null,
      notes: notes.trim() || null,
      planStores,
      planProducts,
      type2Targets: type2TargetsPayload,
      type3Targets: type3TargetsPayload,
      type3Items: type3TargetsPayload,
      type4Targets: type4TargetsPayload,
      type4Items: type4TargetsPayload,
      type5Targets: type5TargetsPayload,
      type5Items: type5TargetsPayload,
      type6Targets: type6TargetsPayload,
      type6Items: type6TargetsPayload,
      type7aPlots: type7aPlotsPayload,
      type7aTargets: type7aPlotsPayload,
      type7bData: type7bPayload,
      type7bPlots: type7bPayload?.plots,
      type7bTargets: type7bPayload?.plots,
      type8Data: type8Payload,
      type8Meetings: type8Payload?.meetings,
      type8Items: type8Payload?.meetings,
      type8Targets: type8Payload?.meetings,
      type9Data: type9Payload,
      type9Stores: type9Payload ? [type9Payload] : undefined,
      type9Targets: type9Payload ? [type9Payload] : undefined,
      type10Data: type10Payload,
      type10Plots: type10Payload?.plots,
      type10Targets: type10Payload?.plots,
    };

    try {
      setSubmitting(true);
      const res = await onSubmit(payload);
      if (!res.success) {
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
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 shadow-2xs">
            <Calendar className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="font-bold text-lg sm:text-2xl text-slate-800 tracking-tight">
              {isEdit
                ? "แก้ไขแผนงาน ( Trip Plan )"
                : "สร้างแผนงาน ( Trip Plan )"}
            </h1>
          </div>
        </div>

        {initialData?.code && (
          <div className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full shadow-2xs self-start sm:self-auto">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>เลขที่แผน: {initialData.code}</span>
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
              กรุณาเลือกประเภทงานจากช่อง &quot;ประเภทงาน&quot;
              ในส่วนข้อมูลหลักของกิจกรรมด้านบนเพื่อกรอกรายละเอียดเป้าหมาย
            </p>
          </div>
        )}

      {/* 3.1 ส่วนเฉพาะ Type 1: เข้าพบเกษตรกร / ร้านค้า */}
      {isType1Active && (
        <Type1PlannedForm
          items={type1.items}
          addItem={type1.addItem}
          deleteItem={type1.deleteItem}
          updateItem={type1.updateItem}
          customers={customers}
          readonly={readonly}
        />
      )}

      {/* 3.2 ส่วนเฉพาะ Type 2: ติดตามผลการใช้สินค้า */}
      {isType2Active && (
        <Type2PlannedForm
          readonly={readonly}
          customers={customers}
          products={products}
          type2Items={type2.type2Items}
          addType2Row={type2.addType2Row}
          updateType2Row={type2.updateType2Row}
          deleteType2Row={type2.deleteType2Row}
        />
      )}

      {/* 3.3 ส่วนเฉพาะ Type 3: เสนอขายสินค้า */}
      {isType3Active && (
        <Type3PlannedForm
          readonly={readonly}
          customers={customers as any}
          products={products as any}
          type3Items={type3.type3Items}
          addType3Row={type3.addType3Row}
          updateType3Row={type3.updateType3Row}
          deleteType3Row={type3.deleteType3Row}
          addProductToRow={type3.addProductToRow}
          updateProductInRow={type3.updateProductInRow}
          deleteProductFromRow={type3.deleteProductFromRow}
        />
      )}

      {/* 3.4 ส่วนเฉพาะ Type 4: วางบิล / เก็บเงิน */}
      {isType4Active && (
        <Type4PlannedForm
          readonly={readonly}
          customers={customers as any}
          type4Items={type4.type4Items}
          addType4Row={type4.addType4Row}
          updateType4Row={type4.updateType4Row}
          deleteType4Row={type4.deleteType4Row}
        />
      )}

      {/* 3.5 ส่วนเฉพาะ Type 5: สำรวจตลาดของคู่แข่ง */}
      {isType5Active && (
        <Type5PlannedForm
          readonly={readonly}
          customers={customers as any}
          products={products as any}
          type5Items={type5.type5Items}
          addType5Row={type5.addType5Row}
          updateType5Row={type5.updateType5Row}
          deleteType5Row={type5.deleteType5Row}
        />
      )}

      {/* 3.6 ส่วนเฉพาะ Type 6: ตรวจสอบเรื่องร้องเรียน / แก้ปัญหา */}
      {isType6Active && (
        <Type6PlannedForm
          readonly={readonly}
          customers={customers as any}
          type6Items={type6.type6Items}
          addType6Row={type6.addType6Row}
          updateType6Row={type6.updateType6Row}
          deleteType6Row={type6.deleteType6Row}
        />
      )}

      {/* 3.7 ส่วนเฉพาะ Type 7A: จัดทำแปลงสาธิต */}
      {isType7aActive && (
        <Type7aPlannedForm
          readonly={readonly}
          customers={customers as any}
          products={products as any}
          type7aPlots={type7a.type7aPlots}
          addType7aRow={type7a.addType7aRow}
          updateType7aRow={type7a.updateType7aRow}
          deleteType7aRow={type7a.deleteType7aRow}
          addProductToDemoPlot={type7a.addProductToDemoPlot}
          updateProductInDemoPlot={type7a.updateProductInDemoPlot}
          deleteProductFromDemoPlot={type7a.deleteProductFromDemoPlot}
        />
      )}

      {/* 3.8 ส่วนเฉพาะ Type 7B: ติดตามแปลงสาธิต */}
      {isType7bActive && (
        <Type7bPlannedForm
          readonly={readonly}
          item={type7b.type7bItems[0] || { id: "1" }}
          updateType7Row={type7b.updateType7bRow}
          plotList={demoPlots as any}
          followUpPlans={followUpPlans as any}
          products={products as any}
        />
      )}

      {/* 3.9 ส่วนเฉพาะ Type 8: จัดประชุม */}
      {isType8Active && (
        <Type8PlannedForm
          readonly={readonly}
          type8Items={type8.type8Items}
          addType8Row={type8.addType8Row}
          updateType8Row={type8.updateType8Row}
          deleteType8Row={type8.deleteType8Row}
          addPromotionProduct={type8.addPromotionProduct}
          updatePromotionProduct={type8.updatePromotionProduct}
          deletePromotionProduct={type8.deletePromotionProduct}
          customers={customers as any}
          products={products as any}
        />
      )}

      {/* 3.10 ส่วนเฉพาะ Type 9: จัดกิจกรรมส่งเสริมการขายหน้าร้าน */}
      {isType9Active && (
        <Type9PlannedForm
          readonly={readonly}
          subdealerId={type9.subdealerId}
          setSubdealerId={type9.setSubdealerId}
          subdealerName={type9.subdealerName}
          setSubdealerName={type9.setSubdealerName}
          isUnregisteredSubdealer={type9.isUnregisteredSubdealer}
          setIsUnregisteredSubdealer={type9.setIsUnregisteredSubdealer}
          subDealerStore={type9.subDealerStore}
          setSubDealerStore={type9.setSubDealerStore}
          province={type9.subDealerProvince}
          setProvince={type9.setSubDealerProvince}
          district={type9.subDealerDistrict}
          setDistrict={type9.setSubDealerDistrict}
          parentDealerId={type9.parentDealerId}
          setParentDealerId={type9.setParentDealerId}
          parentDealerName={type9.parentDealerName}
          setParentDealerName={type9.setParentDealerName}
          type9Store={type9.type9Store}
          setType9Store={type9.setType9Store}
          type9Sales={type9.type9Sales}
          setType9Sales={type9.setType9Sales}
          type9ProductItems={type9.type9ProductItems}
          addType9ProductItem={type9.addType9ProductItem}
          updateType9ProductItem={type9.updateType9ProductItem}
          deleteType9ProductItem={type9.deleteType9ProductItem}
          customers={customers as any}
          products={products as any}
        />
      )}

      {/* 3.11 ส่วนเฉพาะ Type 10: จัดงาน Field Day */}
      {isType10Active && (
        <Type10PlannedForm
          readonly={readonly}
          type10DemoPlot={type10.type10DemoPlot}
          setType10DemoPlot={type10.setType10DemoPlot}
          type10Location={type10.type10Location}
          setType10Location={type10.setType10Location}
          type10TargetCrop={type10.type10TargetCrop}
          setType10TargetCrop={type10.setType10TargetCrop}
          type10Showcase={type10.type10Showcase}
          setType10Showcase={type10.setType10Showcase}
          type10Attendees={type10.type10Attendees}
          setType10Attendees={type10.setType10Attendees}
          type10BookingSales={type10.type10BookingSales}
          setType10BookingSales={type10.setType10BookingSales}
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
      <PlanNotesCard notes={notes} setNotes={setNotes} readonly={readonly} />

      {/* ปุ่มบันทึก */}
      <FormActionButtons
        onBack={onBack}
        loading={submitting}
        readonly={readonly}
        submitLabel={isEdit ? "บันทึกการแก้ไข" : "บันทึก Trip Plan"}
      />
    </form>
  );
}

export default PlannedActivityForm;
