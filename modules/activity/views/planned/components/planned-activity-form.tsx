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
  Type3PlanForm,
  useType3Form,
  hydrateType3PlannedData,
} from "@/modules/activity/features/type-3";
import {
  Type4PlanForm,
  useType4Form,
  hydrateType4PlannedData,
} from "@/modules/activity/features/type-4";
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

  const type3 = useType3Form({
    initialItems: hydratedInitialType3Items,
    customersList: customers as any,
    productsList: products as any,
  });

  // 5.2 Type 4 Planned Hook
  const hydratedInitialType4Items = useMemo(
    () => hydrateType4PlannedData(initialData),
    [initialData],
  );

  const type4 = useType4Form({
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
            (t.code === "COLLECT" || t.name?.includes("วางบิล"))),
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
      {!isType1Active && !isType2Active && !isType3Active && (
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
        <Type3PlanForm
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
        <Type4PlanForm
          readonly={readonly}
          customers={customers as any}
          type4Items={type4.type4Items}
          addType4Row={type4.addType4Row}
          updateType4Row={type4.updateType4Row}
          deleteType4Row={type4.deleteType4Row}
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
