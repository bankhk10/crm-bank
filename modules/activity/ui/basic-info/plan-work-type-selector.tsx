"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  WORK_TYPE_CONFIG,
  getWorkTypeCode,
  getWorkTypeName,
} from "@/modules/activity/constants";

export interface PlanWorkTypeOption {
  code: string;
  name: string;
  displayName?: string;
  disabled?: boolean;
}

export interface PlanWorkTypeSelectorProps {
  selectedWorkTypes: string[];
  setSelectedWorkTypes: (types: string[]) => void;
  activeWorkTypeOptions?: PlanWorkTypeOption[];
  readonly?: boolean;
  isSingleSelect?: boolean;
}

export function PlanWorkTypeSelector({
  selectedWorkTypes,
  setSelectedWorkTypes,
  activeWorkTypeOptions,
  readonly = false,
  isSingleSelect = false,
}: PlanWorkTypeSelectorProps) {
  const [isWorkTypesDropdownOpen, setIsWorkTypesDropdownOpen] = useState(false);
  const [tempSelectedWorkTypes, setTempSelectedWorkTypes] =
    useState<string[]>(selectedWorkTypes);
  const workTypesDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        workTypesDropdownRef.current &&
        !workTypesDropdownRef.current.contains(event.target as Node)
      ) {
        setIsWorkTypesDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Default options if not provided: All 15 supported work types (TYPE_1 - TYPE_14)
  const options: PlanWorkTypeOption[] =
    activeWorkTypeOptions && activeWorkTypeOptions.length > 0
      ? activeWorkTypeOptions
      : [
          {
            code: "TYPE_1",
            name: WORK_TYPE_CONFIG.TYPE_1.name,
            displayName: "เข้าพบร้านค้า / Key Farmer (Type 1)",
          },
          {
            code: "TYPE_2",
            name: WORK_TYPE_CONFIG.TYPE_2.name,
            displayName: "ติดตามผลการใช้สินค้า (Type 2)",
          },
          {
            code: "TYPE_3",
            name: WORK_TYPE_CONFIG.TYPE_3.name,
            displayName: "เสนอขายสินค้า (Type 3)",
          },
          {
            code: "TYPE_4",
            name: WORK_TYPE_CONFIG.TYPE_4.name,
            displayName: "วางบิล / เก็บเงิน (Type 4)",
          },
          {
            code: "TYPE_5",
            name: WORK_TYPE_CONFIG.TYPE_5.name,
            displayName: "สำรวจตลาดของคู่แข่ง (Type 5)",
          },
          {
            code: "TYPE_6",
            name: WORK_TYPE_CONFIG.TYPE_6.name,
            displayName: "ตรวจสอบเรื่องร้องเรียน / แก้ปัญหา (Type 6)",
          },
          {
            code: "TYPE_7A",
            name: WORK_TYPE_CONFIG.TYPE_7A.name,
            displayName: "จัดทำแปลงสาธิต (Type 7A)",
          },
          {
            code: "TYPE_7B",
            name: WORK_TYPE_CONFIG.TYPE_7B.name,
            displayName: "ติดตามแปลงสาธิต (Type 7B)",
          },
          {
            code: "TYPE_8",
            name: WORK_TYPE_CONFIG.TYPE_8.name,
            displayName: "จัดประชุม (Type 8)",
          },
          {
            code: "TYPE_9",
            name: WORK_TYPE_CONFIG.TYPE_9.name,
            displayName: "จัดกิจกรรมส่งเสริมการขายหน้าร้าน (Type 9)",
          },
          {
            code: "TYPE_10",
            name: WORK_TYPE_CONFIG.TYPE_10.name,
            displayName: "จัดงาน Field Day (Type 10)",
          },
          {
            code: "TYPE_11",
            name: WORK_TYPE_CONFIG.TYPE_11.name,
            displayName: "ตรวจเช็คสต๊อกหน้าร้าน (Type 11)",
          },
          {
            code: "TYPE_12",
            name: WORK_TYPE_CONFIG.TYPE_12.name,
            displayName: "ทัวร์ (Type 12)",
          },
          {
            code: "TYPE_13",
            name: WORK_TYPE_CONFIG.TYPE_13.name,
            displayName: "ฉีดแปลงแฮตแทค (Type 13)",
          },
          {
            code: "TYPE_14",
            name: WORK_TYPE_CONFIG.TYPE_14.name,
            displayName: "ติดตามแปลงแฮทแทค (Type 14)",
          },
        ];

  const toggleWorkType = (typeStr: string) => {
    const code = getWorkTypeCode(typeStr);
    const canonicalName = getWorkTypeName(code) || typeStr;
    const isSelected = tempSelectedWorkTypes.some(
      (t) =>
        t === canonicalName || t === typeStr || getWorkTypeCode(t) === code,
    );

    if (isSelected) {
      setTempSelectedWorkTypes(
        tempSelectedWorkTypes.filter(
          (t) =>
            t !== canonicalName && t !== typeStr && getWorkTypeCode(t) !== code,
        ),
      );
    } else {
      setTempSelectedWorkTypes([...tempSelectedWorkTypes, canonicalName]);
    }
  };

  const selectSingleWorkType = (typeStr: string) => {
    const code = getWorkTypeCode(typeStr);
    const canonicalName = getWorkTypeName(code) || typeStr;
    setSelectedWorkTypes([canonicalName]);
    setTempSelectedWorkTypes([canonicalName]);
    setIsWorkTypesDropdownOpen(false);
  };

  const removeWorkType = (typeStr: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const code = getWorkTypeCode(typeStr);
    const canonicalName = getWorkTypeName(code) || typeStr;
    setSelectedWorkTypes(
      selectedWorkTypes.filter(
        (t) =>
          t !== canonicalName && t !== typeStr && getWorkTypeCode(t) !== code,
      ),
    );
  };

  return (
    <div className="relative" ref={workTypesDropdownRef}>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        ประเภทงาน{" "}
        {!isSingleSelect && (
          <span className="text-slate-400 text-[11px]">
            (เลือกได้มากกว่า 1)
          </span>
        )}{" "}
        <span className="text-red-500">*</span>
      </label>

      {/* Input Trigger Field */}
      <div
        onClick={() => {
          if (!readonly) {
            if (!isWorkTypesDropdownOpen) {
              setTempSelectedWorkTypes(selectedWorkTypes);
            }
            setIsWorkTypesDropdownOpen(!isWorkTypesDropdownOpen);
          }
        }}
        className={cn(
          "min-h-[40px] w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm flex flex-wrap items-center gap-1.5 cursor-pointer hover:border-slate-300 focus-within:ring-2 focus-within:ring-blue-500 transition-all",
          readonly && "cursor-not-allowed bg-slate-50",
        )}
      >
        {selectedWorkTypes.length === 0 ? (
          <span className="text-slate-400 text-xs px-1">เลือกประเภทงาน...</span>
        ) : (
          selectedWorkTypes.map((wt) => {
            const code = getWorkTypeCode(wt);
            const matchedOption = options.find((opt) => opt.code === code);
            const label =
              matchedOption?.displayName ||
              matchedOption?.name ||
              getWorkTypeName(code) ||
              wt;

            return (
              <span
                key={wt}
                className={cn(
                  "inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md font-medium border shadow-2xs",
                  code === "TYPE_1"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : code === "TYPE_2"
                      ? "bg-indigo-50 border-indigo-200 text-indigo-800"
                      : "bg-blue-50 border-blue-200 text-blue-800",
                )}
              >
                <span>{label}</span>
                {!readonly && !isSingleSelect && (
                  <button
                    type="button"
                    onClick={(e) => removeWorkType(wt, e)}
                    className="hover:bg-black/10 rounded p-0.5 transition-colors cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </span>
            );
          })
        )}
        <ChevronDown className="h-4 w-4 text-slate-400 ml-auto flex-shrink-0" />
      </div>

      {/* Work types dropdown popup */}
      {isWorkTypesDropdownOpen && (
        <div className="absolute left-0 sm:right-0 top-full mt-1.5 w-full sm:w-80 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 p-3 space-y-2 animate-in fade-in-0 zoom-in-95">
          <div className="max-h-80 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {options.map((typeItem) => {
              const code = typeItem.code;
              const displayName =
                typeItem.displayName || getWorkTypeName(code) || typeItem.name;

              const activeList = isSingleSelect
                ? selectedWorkTypes
                : tempSelectedWorkTypes;

              const isChecked = activeList.some(
                (t) =>
                  t === displayName ||
                  t === typeItem.name ||
                  getWorkTypeCode(t) === code,
              );

              return (
                <div
                  role="button"
                  tabIndex={0}
                  key={code}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (isSingleSelect) {
                      selectSingleWorkType(typeItem.name);
                    } else {
                      toggleWorkType(typeItem.name);
                    }
                  }}
                  className={cn(
                    "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs cursor-pointer transition-colors select-none",
                    isChecked
                      ? "bg-blue-50 text-blue-800 font-medium"
                      : "hover:bg-slate-50 text-slate-700",
                  )}
                >
                  {isSingleSelect ? (
                    <div
                      className={cn(
                        "w-4 h-4 rounded-full border flex items-center justify-center transition-colors flex-shrink-0",
                        isChecked
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-slate-300 bg-white",
                      )}
                    >
                      {isChecked && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </div>
                  ) : (
                    <div
                      className={cn(
                        "w-4 h-4 rounded border flex items-center justify-center transition-colors flex-shrink-0",
                        isChecked
                          ? "bg-blue-600 border-blue-600 text-white"
                          : "border-slate-300 bg-white",
                      )}
                    >
                      {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                  )}
                  <span>{displayName}</span>
                </div>
              );
            })}
          </div>

          {!isSingleSelect && (
            <div className="pt-2.5 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsWorkTypesDropdownOpen(false)}
                className="px-3 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedWorkTypes(tempSelectedWorkTypes);
                  setIsWorkTypesDropdownOpen(false);
                }}
                className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-medium text-white shadow-2xs cursor-pointer"
              >
                ตกลง
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
