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
        return false;
      }) || activityTypes[0];

    const activityTypeId =
      matchedType?.id || (isType2Active ? "type-2" : "type-1");

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
      actualData,
      attachments: actualData?.attachments || [],
      type1UnplannedItems: isType1Active ? type1.items : undefined,
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
      {!isType1Active && !isType2Active && !isType3Active && !isType4Active && (
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
