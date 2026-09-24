import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getWorkTypeCode,
  getWorkTypeName,
} from "@/modules/activity-plans/constants";

export interface PlanWorkTypeSelectorProps {
  selectedWorkTypes: string[];
  setSelectedWorkTypes: React.Dispatch<React.SetStateAction<string[]>>;
  activeWorkTypeOptions: Array<any & { displayName: string }>;
  readonly?: boolean;
}

export function PlanWorkTypeSelector({
  selectedWorkTypes,
  setSelectedWorkTypes,
  activeWorkTypeOptions,
  readonly = false,
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
      let next = [...tempSelectedWorkTypes];
      // Mutual Exclusivity between TYPE_7A ("ทำแปลงสาธิต") and TYPE_7B ("ติดตามแปลงสาธิต")
      if (code === "TYPE_7A") {
        next = next.filter((t) => getWorkTypeCode(t) !== "TYPE_7B");
      } else if (code === "TYPE_7B") {
        next = next.filter((t) => getWorkTypeCode(t) !== "TYPE_7A");
      }
      setTempSelectedWorkTypes([...next, canonicalName]);
    }
  };

  const removeWorkType = (typeStr: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const canonicalName = getWorkTypeName(getWorkTypeCode(typeStr)) || typeStr;
    setSelectedWorkTypes(
      selectedWorkTypes.filter(
        (t) =>
          t !== canonicalName &&
          t !== typeStr &&
          getWorkTypeCode(t) !== getWorkTypeCode(typeStr),
      ),
    );
  };

  return (
    <div className="relative" ref={workTypesDropdownRef}>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        ประเภทงาน{" "}
        <span className="text-slate-400 text-[11px]">
          (เลือกได้มากกว่า 1)
        </span>{" "}
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
          <span className="text-slate-400 text-xs px-1">
            เลือกประเภทงาน...
          </span>
        ) : (
          selectedWorkTypes.map((wt) => (
            <span
              key={wt}
              className="inline-flex items-center gap-1 bg-blue-50 border border-blue-200/80 text-blue-700 text-xs px-2 py-0.5 rounded-md font-medium"
            >
              <span>{wt}</span>
              {!readonly && (
                <button
                  type="button"
                  onClick={(e) => removeWorkType(wt, e)}
                  className="hover:bg-blue-100 rounded p-0.5 text-blue-600 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </span>
          ))
        )}
        <ChevronDown className="h-4 w-4 text-slate-400 ml-auto flex-shrink-0" />
      </div>

      {/* Work types multi-select checkbox dropdown popup */}
      {isWorkTypesDropdownOpen && (
        <div className="absolute left-0 sm:right-0 top-full mt-1.5 w-full sm:w-80 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 p-3 space-y-2 animate-in fade-in-0 zoom-in-95">
          <div className="max-h-80 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {activeWorkTypeOptions.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-400">
                กำลังโหลดประเภทงาน...
              </div>
            ) : (
              activeWorkTypeOptions.map((typeItem) => {
                const displayName =
                  (typeItem as any).displayName ||
                  getWorkTypeName(typeItem.code) ||
                  typeItem.name;
                const isChecked = tempSelectedWorkTypes.some(
                  (t) =>
                    t === displayName ||
                    t === typeItem.name ||
                    getWorkTypeCode(t) === typeItem.code,
                );
                return (
                  <label
                    key={typeItem.code}
                    onClick={() => toggleWorkType(displayName)}
                    className={cn(
                      "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs cursor-pointer transition-colors select-none",
                      isChecked
                        ? "bg-blue-50 text-blue-800 font-medium"
                        : "hover:bg-slate-50 text-slate-700",
                    )}
                  >
                    <div
                      className={cn(
                        "w-4 h-4 rounded border flex items-center justify-center transition-colors flex-shrink-0",
                        isChecked
                          ? "bg-blue-600 border-blue-600 text-white"
                          : "border-slate-300 bg-white",
                      )}
                    >
                      {isChecked && (
                        <Check className="h-3 w-3 stroke-[3]" />
                      )}
                    </div>
                    <span>{displayName}</span>
                  </label>
                );
              })
            )}
          </div>

          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setIsWorkTypesDropdownOpen(false)}
              className="px-4 py-1.5 rounded-xl border border-slate-300 bg-red-600 hover:bg-red-700 text-xs font-bold text-white shadow-2xs transition-all active:scale-95"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedWorkTypes(tempSelectedWorkTypes);
                setIsWorkTypesDropdownOpen(false);
              }}
              className="px-4 py-1.5 rounded-xl border border-slate-300 bg-green-600 hover:bg-green-700 text-xs font-bold text-white shadow-2xs transition-all active:scale-95"
            >
              ตกลง
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
