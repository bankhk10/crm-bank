import React from "react";
import { Search, X } from "lucide-react";

export interface Employee {
  id: string;
  name: string;
  positionTitle?: string | null;
  departmentName?: string | null;
  [key: string]: any;
}

interface Props {
  selectedWorkTypes: string[];
  readonly?: boolean;
  helperSearch: string;
  setHelperSearch: (val: string) => void;
  showHelperDropdown: boolean;
  setShowHelperDropdown: (val: boolean) => void;
  filteredEmployees: Employee[];
  addHelper: (id: string) => void;
  helperEmployeeIds: string[];
  employees: Employee[];
  removeHelper: (id: string) => void;
  locationText: string;
  setLocationText: (val: string) => void;
}

export function LocationTeamSection({
  selectedWorkTypes,
  readonly = false,
  helperSearch,
  setHelperSearch,
  showHelperDropdown,
  setShowHelperDropdown,
  filteredEmployees,
  addHelper,
  helperEmployeeIds,
  employees,
  removeHelper,
  locationText,
  setLocationText,
}: Props) {
  if(
    !selectedWorkTypes.some((t) =>
      [
        "จัดประชุมการเกษตร / ดีลเลอร์ / ซับดีลเลอร์",
        "จัดกิจกรรมส่งเสริมการขายหน้าร้าน",
        "จัดงาน Field Day",
      ].includes(t),
    )
  ) {
    return null;
  }

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm p-5 md:p-6 space-y-5 relative z-20">
      <div className="flex items-center gap-2.5">
        <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
          4
        </span>
        <h2 className="font-bold text-slate-800 text-base md:text-lg">
          สถานที่และทีมงาน (Location & Team)
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Col 3: ผู้ช่วยงานกิจกรรม */}
        <div className="lg:col-span-4 space-y-2">
          <label className="block text-xs font-medium text-slate-700 mb-1">
            ผู้ช่วยงานกิจกรรม{" "}
            <span className="text-slate-400 text-[11px]">
              (เลือกได้หลายคน)
            </span>
          </label>

          {/* Employee helpers search and selection */}
          {!readonly && (
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาชื่อผู้ช่วย..."
                value={helperSearch}
                onChange={(e) => {
                  setHelperSearch(e.target.value);
                  setShowHelperDropdown(true);
                }}
                onFocus={() => setShowHelperDropdown(true)}
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {showHelperDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowHelperDropdown(false)}
                  />
                  <ul className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-xl bg-white p-1 text-xs shadow-2xl border border-slate-200 custom-scrollbar">
                    {filteredEmployees.length === 0 ? (
                      <li className="p-3 text-slate-400 italic text-center">
                        ไม่พบข้อมูลพนักงาน
                      </li>
                    ) : (
                      filteredEmployees.map((emp) => (
                        <li
                          key={emp.id}
                          onClick={() => addHelper(emp.id)}
                          className="cursor-pointer p-2.5 hover:bg-blue-50 rounded-lg flex items-center justify-between text-slate-700 transition-colors"
                        >
                          <span className="font-medium text-slate-800">
                            {emp.name}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            ({emp.positionTitle || emp.departmentName || "พนักงาน"})
                          </span>
                        </li>
                      ))
                    )}
                  </ul>
                </>
              )}
            </div>
          )}

          {/* Selected Tags list */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {helperEmployeeIds.map((hid) => {
              const emp = employees.find((e) => e.id === hid);
              const empName = emp ? emp.name : "ผู้ช่วยงาน";
              return (
                <span
                  key={hid}
                  className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200/80 text-slate-700 text-[11px] px-2.5 py-1 rounded-full font-medium"
                >
                  <span>{empName}</span>
                  {!readonly && (
                    <button
                      type="button"
                      onClick={() => removeHelper(hid)}
                      className="hover:text-red-500 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </span>
              );
            })}

            {helperEmployeeIds.length === 0 && (
              <p className="text-xs text-slate-400 italic py-1">
                ยังไม่ได้เลือกผู้ช่วยงาน
              </p>
            )}
          </div>
        </div>
        {/* Col 1: รายละเอียดพื้นที่จัดกิจกรรม */}
        <div className="lg:col-span-full space-y-1">
          <label className="block text-xs font-medium text-slate-700 mb-1.5">
            รายละเอียดพื้นที่จัดกิจกรรม{" "}
            <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={4}
            value={locationText}
            maxLength={500}
            onChange={(e) => setLocationText(e.target.value)}
            disabled={readonly}
            placeholder="ระบุที่อยู่และจุดสังเกต..."
            className="w-full rounded-lg border border-slate-200 bg-white p-3 text-xs md:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
          />
          <div className="text-right text-[11px] text-slate-400">
            {locationText.length}/500
          </div>
        </div>
      </div>
    </div>
  );
}
