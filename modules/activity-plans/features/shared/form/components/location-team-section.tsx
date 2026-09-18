import React, { useEffect, useState, useMemo } from "react";
import { Search, X, Users, MapPin, UserCircle2, Building2 } from "lucide-react";
import { SectionHeader } from "@/components/custom/section-header";
import { FormCombobox } from "@/components/custom/FormCombobox";

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
  province?: string;
  setProvince?: (val: string) => void;
  district?: string;
  setDistrict?: (val: string) => void;
}

export function LocationTeamSection({
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
  province = "",
  setProvince,
  district = "",
  setDistrict,
}: Props) {
  const [provincesData, setProvincesData] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;
    async function loadAddresses() {
      try {
        const res = await fetch("/api/thai-addresses");
        if (!res.ok) return;
        const json = await res.json();
        if (isMounted && Array.isArray(json)) {
          const normalized = json.map((p: any) => ({
            id: p.id,
            name: p.name_th,
            districts: (p.districts || []).map((d: any) => ({
              id: d.id,
              name: d.name_th,
            })),
          }));
          setProvincesData(normalized);
        }
      } catch (err) {
        console.error("Failed to load thai addresses:", err);
      }
    }
    loadAddresses();
    return () => {
      isMounted = false;
    };
  }, []);

  const provinceOptions = useMemo(() => {
    return provincesData.map((p) => ({
      value: p.name,
      label: p.name,
    }));
  }, [provincesData]);

  const districtOptions = useMemo(() => {
    const matched = provincesData.find((p) => p.name === province);
    if (!matched) return [];
    return matched.districts.map((d: any) => ({
      value: d.name,
      label: d.name,
    }));
  }, [province, provincesData]);

  const charCount = locationText.length;
  const charPercent = Math.round((charCount / 500) * 100);

  return (
    <div className="space-y-4 relative z-20">
      <SectionHeader
        title="สถานที่และทีมงาน"
        className="rounded-xl"
        accentColor="#808080"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* รายละเอียดพื้นที่จัดกิจกรรม & จังหวัด / อำเภอ */}
        <div className="lg:col-span-8 space-y-3">
          {/* Province & District dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormCombobox
              label="จังหวัด"
              value={province}
              onChange={(val) => {
                if (setProvince) setProvince(val);
                if (setDistrict) setDistrict("");
              }}
              options={provinceOptions}
              placeholder="เลือกจังหวัด"
              searchPlaceholder="ค้นหาจังหวัด..."
              emptyText="ไม่พบจังหวัด"
              disabled={readonly}
              containerClassName="w-full"
            />
            <FormCombobox
              label="อำเภอ / เขต"
              value={district}
              onChange={(val) => {
                if (setDistrict) setDistrict(val);
              }}
              options={districtOptions}
              placeholder={province ? "เลือกอำเภอ / เขต" : "กรุณาเลือกจังหวัดก่อน"}
              searchPlaceholder="ค้นหาอำเภอ..."
              emptyText="ไม่พบอำเภอ"
              disabled={readonly || !province}
              containerClassName="w-full"
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1">
              <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
              รายละเอียดพื้นที่จัดกิจกรรม / จุดสังเกต
            </label>

            <div className="relative">
              <textarea
                rows={4}
                value={locationText}
                maxLength={500}
                onChange={(e) => setLocationText(e.target.value)}
                disabled={readonly}
                placeholder="ระบุสถานที่ ที่อยู่ และจุดสังเกต..."
                className="w-full rounded-xl border border-slate-200 bg-white p-3 pr-4 text-sm text-slate-800
                           placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/60
                           focus:border-blue-400 transition-all resize-none
                           disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
              />

              {/* Character count bar */}
              <div className="mt-1.5 flex items-center justify-between gap-3">
                <div className="flex-1 h-1 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      charPercent >= 90
                        ? "bg-red-400"
                        : charPercent >= 70
                          ? "bg-amber-400"
                          : "bg-blue-400"
                    }`}
                    style={{ width: `${charPercent}%` }}
                  />
                </div>
                <span
                  className={`text-[11px] tabular-nums font-medium ${
                    charPercent >= 90 ? "text-red-500" : "text-slate-400"
                  }`}
                >
                  {charCount} / 500
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ผู้ช่วยงานกิจกรรม */}
        <div className="lg:col-span-4 space-y-2">
          <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
            <Users className="h-4 w-4 text-slate-400 shrink-0" />
            ผู้ช่วยงานกิจกรรม
            <span className="text-slate-400 text-[11px] font-normal ml-1">
              (เลือกได้หลายคน)
            </span>
          </label>

          {/* Search box */}
          {!readonly && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="ค้นหาชื่อผู้ช่วย..."
                value={helperSearch}
                onChange={(e) => {
                  setHelperSearch(e.target.value);
                  setShowHelperDropdown(true);
                }}
                onFocus={() => setShowHelperDropdown(true)}
                className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 bg-white text-sm
                           text-slate-800 placeholder:text-slate-300
                           focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-400
                           transition-all"
              />

              {showHelperDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowHelperDropdown(false)}
                  />
                  <ul
                    className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-56 overflow-y-auto
                                  rounded-xl bg-white p-1.5 text-sm shadow-xl shadow-slate-200/80
                                  border border-slate-100 custom-scrollbar"
                  >
                    {filteredEmployees.length === 0 ? (
                      <li className="p-3 text-slate-400 text-xs italic text-center">
                        ไม่พบข้อมูลพนักงาน
                      </li>
                    ) : (
                      filteredEmployees.map((emp) => (
                        <li
                          key={emp.id}
                          onClick={() => addHelper(emp.id)}
                          className="cursor-pointer px-3 py-2 hover:bg-blue-50 rounded-lg
                                     flex items-center gap-2.5 text-slate-700 transition-colors group"
                        >
                          <div
                            className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0
                                          group-hover:bg-blue-100 transition-colors"
                          >
                            <UserCircle2 className="h-4 w-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">
                              {emp.name}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate">
                              {emp.positionTitle ||
                                emp.departmentName ||
                                "พนักงาน"}
                            </p>
                          </div>
                        </li>
                      ))
                    )}
                  </ul>
                </>
              )}
            </div>
          )}

          {/* Selected helper tags */}
          <div className="flex flex-wrap gap-1.5 pt-0.5 min-h-[2rem]">
            {helperEmployeeIds.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-1">
                ยังไม่ได้เลือกผู้ช่วยงาน
              </p>
            ) : (
              helperEmployeeIds.map((hid) => {
                const emp = employees.find((e) => e.id === hid);
                const empName = emp ? emp.name : "ผู้ช่วยงาน";
                return (
                  <span
                    key={hid}
                    className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200/70
                               text-blue-700 text-xs px-2.5 py-1 rounded-full font-medium
                               transition-colors"
                  >
                    <UserCircle2 className="h-3 w-3 text-blue-400 shrink-0" />
                    <span>{empName}</span>
                    {!readonly && (
                      <button
                        type="button"
                        onClick={() => removeHelper(hid)}
                        className="ml-0.5 hover:text-red-500 hover:bg-red-50 rounded-full p-0.5 transition-colors"
                        aria-label={`ลบ ${empName}`}
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    )}
                  </span>
                );
              })
            )}
          </div>

          {/* Helper count badge */}
          {helperEmployeeIds.length > 0 && (
            <p className="text-[11px] text-slate-400">
              เลือกแล้ว{" "}
              <span className="font-semibold text-blue-500">
                {helperEmployeeIds.length}
              </span>{" "}
              คน
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
