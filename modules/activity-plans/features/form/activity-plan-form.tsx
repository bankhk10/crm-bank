"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { Search, X, UserPlus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  FormInput,
  FormTextarea,
} from "@/components/custom/form-components";
import type { ActivityPlanFormValues } from "../../application/validations";

type SubmitResult = {
  success: boolean;
  error?: string;
};

interface Props {
  initial?: Partial<ActivityPlanFormValues>;
  employees?: Array<{ id: string; name: string; positionTitle?: string | null; departmentName?: string | null }>;
  onSubmit: (payload: ActivityPlanFormValues) => Promise<SubmitResult>;
  onCancel?: () => void;
  submitLabel?: string;
  readonly?: boolean;
}

export function ActivityPlanForm({
  initial = {},
  employees = [],
  onSubmit,
  onCancel,
  submitLabel = "บันทึกร่าง",
  readonly = false,
}: Props) {
  // Format dates for datetime-local inputs
  const formatDateForInput = (date?: Date | string) => {
    if (!date) return "";
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "";
    return format(d, "yyyy-MM-dd'T'HH:mm");
  };

  const [payload, setPayload] = useState({
    title: initial.title ?? "",
    activityType: initial.activityType ?? "",
    startDate: formatDateForInput(initial.startDate),
    endDate: formatDateForInput(initial.endDate),
    location: initial.location ?? "",
    objective: initial.objective ?? "",
    description: initial.description ?? "",
    salesPromotionBudget: initial.salesPromotionBudget ?? 0,
    marketingBudget: initial.marketingBudget ?? 0,
    notes: initial.notes ?? "",
    helperEmployeeIds: initial.helperEmployeeIds ?? [],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Helper search state
  const [helperSearch, setHelperSearch] = useState("");
  const [showHelperDropdown, setShowHelperDropdown] = useState(false);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!payload.title.trim()) errors.title = "กรุณากรอกชื่อกิจกรรม";
    if (!payload.activityType.trim()) errors.activityType = "กรุณากรอกประเภทกิจกรรม";
    if (!payload.startDate) errors.startDate = "กรุณาระบุวันและเวลาเริ่มต้น";
    if (!payload.endDate) errors.endDate = "กรุณาระบุวันและเวลาสิ้นสุด";
    if (payload.startDate && payload.endDate && new Date(payload.endDate) <= new Date(payload.startDate)) {
      errors.endDate = "วันและเวลาสิ้นสุดต้องหลังจากเวลาเริ่มต้น";
    }
    if (!payload.location.trim()) errors.location = "กรุณากรอกรายละเอียดพื้นที่จัดกิจกรรม";
    if (!payload.objective.trim()) errors.objective = "กรุณากรอกเป้าหมายกิจกรรม";
    if (!payload.description.trim()) errors.description = "กรุณากรอกรายละเอียดกิจกรรม";
    if (payload.salesPromotionBudget < 0) errors.salesPromotionBudget = "งบประมาณต้องมากกว่าหรือเท่ากับ 0";
    if (payload.marketingBudget < 0) errors.marketingBudget = "งบประมาณต้องมากกว่าหรือเท่ากับ 0";

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (readonly) return;
    if (loading) return;

    if (!validateForm()) {
      setError("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await onSubmit({
        title: payload.title,
        activityType: payload.activityType,
        startDate: new Date(payload.startDate),
        endDate: new Date(payload.endDate),
        location: payload.location,
        objective: payload.objective,
        description: payload.description,
        salesPromotionBudget: payload.salesPromotionBudget ? Number(payload.salesPromotionBudget) : null,
        marketingBudget: payload.marketingBudget ? Number(payload.marketingBudget) : null,
        notes: payload.notes || null,
        helperEmployeeIds: payload.helperEmployeeIds,
      });

      if (!result.success) {
        setError(result.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ");
      setLoading(false);
    }
  }

  // Filter helper suggestions
  const filteredEmployees = employees.filter((emp) => {
    // Exclude already selected
    if (payload.helperEmployeeIds.includes(emp.id)) return false;
    
    const search = helperSearch.toLowerCase();
    return (
      emp.name.toLowerCase().includes(search) ||
      (emp.positionTitle?.toLowerCase() || "").includes(search) ||
      (emp.departmentName?.toLowerCase() || "").includes(search)
    );
  });

  const addHelper = (id: string) => {
    setPayload((prev) => ({
      ...prev,
      helperEmployeeIds: [...prev.helperEmployeeIds, id],
    }));
    setHelperSearch("");
    setShowHelperDropdown(false);
  };

  const removeHelper = (id: string) => {
    setPayload((prev) => ({
      ...prev,
      helperEmployeeIds: prev.helperEmployeeIds.filter((hid) => hid !== id),
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm shadow-sm">
          {error}
        </div>
      )}

      {/* Section 1: ข้อมูลกิจกรรมทั่วไป */}
      <div className="space-y-6">
        <h3 className="text-lg font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
          <span className="h-4 w-1 bg-blue-600 rounded-full" />
          1. ข้อมูลกิจกรรมทั่วไป
        </h3>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <FormInput
              label="ชื่อกิจกรรม / แผนทริป"
              value={payload.title}
              onChange={(e) => {
                setPayload((p) => ({ ...p, title: e.target.value }));
                if (fieldErrors.title) setFieldErrors((f) => ({ ...f, title: "" }));
              }}
              disabled={readonly}
              error={fieldErrors.title}
              required
              placeholder="เช่น จัดบูธสาธิตสินค้า ณ ร้านสหายพานิช"
            />
          </div>

          <FormInput
            label="ประเภทกิจกรรม"
            value={payload.activityType}
            onChange={(e) => {
              setPayload((p) => ({ ...p, activityType: e.target.value }));
              if (fieldErrors.activityType) setFieldErrors((f) => ({ ...f, activityType: "" }));
            }}
            disabled={readonly}
            error={fieldErrors.activityType}
            required
            placeholder="เช่น บูธสาธิต, เข้าพบลูกค้า, ทริปทัวร์, สัมมนา"
          />

          <FormInput
            label="รายละเอียดพื้นที่จัดกิจกรรม (สถานที่ / จังหวัด / อำเภอ)"
            value={payload.location}
            onChange={(e) => {
              setPayload((p) => ({ ...p, location: e.target.value }));
              if (fieldErrors.location) setFieldErrors((f) => ({ ...f, location: "" }));
            }}
            disabled={readonly}
            error={fieldErrors.location}
            required
            placeholder="เช่น ร้านสหายพานิช อ.เมือง จ.เชียงใหม่"
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              วันและเวลาเริ่มต้น <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={payload.startDate}
              onChange={(e) => {
                setPayload((p) => ({ ...p, startDate: e.target.value }));
                if (fieldErrors.startDate) setFieldErrors((f) => ({ ...f, startDate: "" }));
              }}
              disabled={readonly}
              className={cn(
                "h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500",
                fieldErrors.startDate && "border-red-500 ring-red-500"
              )}
            />
            {fieldErrors.startDate && <p className="mt-1 text-xs text-red-500">{fieldErrors.startDate}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              วันและเวลาสิ้นสุด <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={payload.endDate}
              onChange={(e) => {
                setPayload((p) => ({ ...p, endDate: e.target.value }));
                if (fieldErrors.endDate) setFieldErrors((f) => ({ ...f, endDate: "" }));
              }}
              disabled={readonly}
              className={cn(
                "h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500",
                fieldErrors.endDate && "border-red-500 ring-red-500"
              )}
            />
            {fieldErrors.endDate && <p className="mt-1 text-xs text-red-500">{fieldErrors.endDate}</p>}
          </div>

          <div className="md:col-span-2">
            <FormTextarea
              label="เป้าหมายของกิจกรรม"
              value={payload.objective}
              onChange={(e) => {
                setPayload((p) => ({ ...p, objective: e.target.value }));
                if (fieldErrors.objective) setFieldErrors((f) => ({ ...f, objective: "" }));
              }}
              disabled={readonly}
              error={fieldErrors.objective}
              required
              rows={2}
              placeholder="ระบุสิ่งที่ต้องการบรรลุ เช่น แนะนำสินค้าใหม่ 2 รายการ เพื่อทำยอดขายขั้นต่ำ 50,000 บาท"
            />
          </div>

          <div className="md:col-span-2">
            <FormTextarea
              label="รายละเอียดกิจกรรม (มีขั้นตอนอะไรบ้าง)"
              value={payload.description}
              onChange={(e) => {
                setPayload((p) => ({ ...p, description: e.target.value }));
                if (fieldErrors.description) setFieldErrors((f) => ({ ...f, description: "" }));
              }}
              disabled={readonly}
              error={fieldErrors.description}
              required
              rows={4}
              placeholder="อธิบายกิจกรรมโดยละเอียด เช่น 09:00 น. เริ่มจัดโต๊ะกิจกรรม, 10:00 น. เริ่มประชาสัมพันธ์แจกใบปลิวสินค้าใหม่, 13:00 น. เริ่มสาธิตปุ๋ยเคมี"
            />
          </div>
        </div>
      </div>

      {/* Section 2: งบประมาณที่ต้องการขอใช้ */}
      <div className="space-y-6">
        <h3 className="text-lg font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
          <span className="h-4 w-1 bg-blue-600 rounded-full" />
          2. งบประมาณที่ขอใช้ (หากไม่ต้องการใช้งบ กรุณาใส่ 0 หรือเว้นว่าง)
        </h3>

        <div className="grid gap-6 md:grid-cols-2">
          <FormInput
            label="งบส่งเสริมการขาย (บาท)"
            type="number"
            value={String(payload.salesPromotionBudget)}
            onChange={(e) => {
              setPayload((p) => ({ ...p, salesPromotionBudget: Math.max(0, parseFloat(e.target.value) || 0) }));
              if (fieldErrors.salesPromotionBudget) setFieldErrors((f) => ({ ...f, salesPromotionBudget: "" }));
            }}
            disabled={readonly}
            error={fieldErrors.salesPromotionBudget}
            onWheel={(e) => e.currentTarget.blur()}
          />

          <FormInput
            label="งบส่งเสริมการตลาด (บาท)"
            type="number"
            value={String(payload.marketingBudget)}
            onChange={(e) => {
              setPayload((p) => ({ ...p, marketingBudget: Math.max(0, parseFloat(e.target.value) || 0) }));
              if (fieldErrors.marketingBudget) setFieldErrors((f) => ({ ...f, marketingBudget: "" }));
            }}
            disabled={readonly}
            error={fieldErrors.marketingBudget}
            onWheel={(e) => e.currentTarget.blur()}
          />
        </div>
      </div>

      {/* Section 3: ผู้ช่วยกิจกรรมงาน */}
      <div className="space-y-6">
        <h3 className="text-lg font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
          <span className="h-4 w-1 bg-blue-600 rounded-full" />
          3. รายชื่อพนักงานช่วยงาน (ถ้ามี)
        </h3>

        <div className="space-y-4">
          {!readonly && (
            <div className="relative">
              <label className="block text-sm font-medium text-slate-700 mb-1">ค้นหาและเพิ่มผู้ช่วยงาน</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อ, ตำแหน่ง, หรือแผนกพนักงานช่วยงาน..."
                  value={helperSearch}
                  onChange={(e) => {
                    setHelperSearch(e.target.value);
                    setShowHelperDropdown(true);
                  }}
                  onFocus={() => setShowHelperDropdown(true)}
                  className="pl-10 h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {helperSearch && (
                  <button
                    type="button"
                    onClick={() => setHelperSearch("")}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Suggestions Dropdown */}
              {showHelperDropdown && helperSearch.trim() && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowHelperDropdown(false)} />
                  <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm border border-slate-100">
                    {filteredEmployees.length === 0 ? (
                      <li className="relative cursor-default select-none py-2 px-4 text-slate-500 italic">
                        ไม่พบพนักงานที่ตรงกับเงื่อนไข
                      </li>
                    ) : (
                      filteredEmployees.map((emp) => (
                        <li
                          key={emp.id}
                          onClick={() => addHelper(emp.id)}
                          className="relative cursor-pointer select-none py-2.5 pl-4 pr-9 hover:bg-blue-50 text-slate-700 flex justify-between items-center transition-colors"
                        >
                          <div>
                            <span className="font-medium text-slate-900">{emp.name}</span>
                            <span className="ml-2 text-xs text-slate-400">
                              ({emp.positionTitle || "ไม่ระบุตำแหน่ง"} / {emp.departmentName || "ไม่ระบุแผนก"})
                            </span>
                          </div>
                          <UserPlus className="h-4 w-4 text-blue-500" />
                        </li>
                      ))
                    )}
                  </ul>
                </>
              )}
            </div>
          )}

          {/* Selected Helpers Display (Tags) */}
          <div className="space-y-2">
            <span className="block text-sm font-medium text-slate-500">พนักงานช่วยงานที่เลือกไว้ ({payload.helperEmployeeIds.length} คน)</span>
            {payload.helperEmployeeIds.length === 0 ? (
              <p className="text-sm text-slate-400 italic">ยังไม่มีการเลือกผู้ช่วยงาน (ดำเนินการคนเดียว)</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {payload.helperEmployeeIds.map((hid) => {
                  const emp = employees.find((e) => e.id === hid);
                  return (
                    <span
                      key={hid}
                      className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 border border-slate-200 pl-3 pr-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm"
                    >
                      <span>
                        {emp?.name || "ไม่ทราบชื่อ"}
                        {emp?.positionTitle && <span className="ml-1 text-[10px] text-slate-400">({emp.positionTitle})</span>}
                      </span>
                      {!readonly && (
                        <button
                          type="button"
                          onClick={() => removeHelper(hid)}
                          className="rounded-full p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 focus:outline-none transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section 4: หมายเหตุเพิ่มเติม */}
      <div className="space-y-6">
        <h3 className="text-lg font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
          <span className="h-4 w-1 bg-blue-600 rounded-full" />
          4. หมายเหตุเพิ่มเติม
        </h3>

        <FormTextarea
          label="หมายเหตุ / คำอธิบายเพิ่มเติม"
          value={payload.notes}
          onChange={(e) => setPayload((p) => ({ ...p, notes: e.target.value }))}
          disabled={readonly}
          rows={2}
          placeholder="ข้อมูลอื่นๆ ที่ต้องการบันทึกเพิ่มเติมเพื่อความเข้าใจของหัวหน้างาน"
        />
      </div>

      {/* Form Buttons */}
      <div className="flex justify-end gap-3 pt-6 border-t">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            ยกเลิก
          </Button>
        )}
        {!readonly && (
          <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md">
            {loading ? "กำลังบันทึก..." : submitLabel}
          </Button>
        )}
      </div>
    </form>
  );
}
