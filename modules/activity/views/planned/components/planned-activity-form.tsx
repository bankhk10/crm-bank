"use client";

import React, { useState } from "react";
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
} from "@/modules/activity/ui";
import {
  Type1PlannedForm,
  useType1PlannedForm,
  validateType1PlannedItem,
  mapType1PlannedItemToDb,
  type CustomerOption,
  type ProductOption,
} from "@/modules/activity/features/type-1";

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

  // 1. Basic Info State
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

  // 2. Location & Team Hook
  const locationTeam = usePlanLocationTeam({
    initial: initialData,
    selectedWorkTypes: ["TYPE_1"],
    employees,
    isEdit,
  });

  // 3. Type 1 Planned Hook
  const type1 = useType1PlannedForm({
    initialItems: initialData.items || undefined,
    defaultProvince: locationTeam.province,
  });

  // 4. Budget Hook
  const budget = usePlanBudget({
    initial: initialData,
  });

  // 5. Notes State
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

    // 2. Validation - Type 1 Items
    if (type1.items.length === 0) {
      toast.error("กรุณาระบุร้านค้าหรือเกษตรกรเป้าหมายอย่างน้อย 1 รายการ");
      return;
    }

    const type1Validation = type1.validate(customers);
    if (!type1Validation.isValid) {
      toast.error(type1Validation.error || "ข้อมูลเป้าหมายเข้าพบไม่ถูกต้อง");
      return;
    }

    // 3. Map Type 1 items to database stores
    const planStores = type1.items
      .map((item) => mapType1PlannedItemToDb(item, customers))
      .filter(Boolean);

    // 4. Resolve activityTypeId for Type 1
    const matchedType =
      activityTypes.find(
        (t) =>
          t.code === "TYPE_1" ||
          t.code === "VISIT" ||
          t.name?.includes("เข้าพบ"),
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
      workTypeCodes: ["TYPE_1"],
      province: locationTeam.province || null,
      district: locationTeam.district || null,
      location: locationTeam.locationText || null,
      helperEmployeeIds: locationTeam.helperEmployeeIds,
      salesPromotionBudgetRequested: budgetPayload.salesPromotionBudgetRequested,
      marketingBudgetRequested: budgetPayload.marketingBudgetRequested,
      totalBudgetRequested: totalBudgetRequested > 0 ? totalBudgetRequested : null,
      notes: notes.trim() || null,
      planStores,
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
              {isEdit ? "แก้ไขแผนงาน ( Trip Plan )" : "สร้างแผนงาน ( Trip Plan )"}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEdit
                ? "ปรับปรุงข้อมูลและรายละเอียดของแผนงานกิจกรรม"
                : "กรอกข้อมูลและรายละเอียดเพื่อวางแผนงานกิจกรรมล่วงหน้า"}
            </p>
          </div>
        </div>

        {initialData?.code && (
          <div className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full shadow-2xs self-start sm:self-auto">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>เลขที่แผน: {initialData.code}</span>
          </div>
        )}
      </div>

      {/* 1. ส่วนกลาง: ข้อมูลระบบ & วันเวลา */}
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

      {/* 3. ส่วนเฉพาะ Type: เข้าพบเกษตรกร / ร้านค้า (Type 1) */}
      <Type1PlannedForm
        items={type1.items}
        addItem={type1.addItem}
        deleteItem={type1.deleteItem}
        updateItem={type1.updateItem}
        customers={customers}
        readonly={readonly}
      />

      {/* 4. ส่วนกลาง: งบประมาณและค่าใช้จ่าย */}
      <PlanBudgetSection
        selectedWorkTypes={["TYPE_1"]}
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
        submitLabel={isEdit ? "บันทึกการแก้ไข" : "บันทึก Trip Plan"}
      />
    </form>
  );
}

export default PlannedActivityForm;
