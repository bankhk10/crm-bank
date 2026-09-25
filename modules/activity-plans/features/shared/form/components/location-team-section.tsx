import React, { useEffect, useState, useMemo } from "react";
import { Search, X, Users, MapPin, UserCircle2, Store } from "lucide-react";
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
  // Optional TYPE_8 specific props
  isType8Active?: boolean;
  selectedDealer?: any;
  venueType?: "STORE" | "OTHER";
  onVenueTypeChange?: (val: "STORE" | "OTHER") => void;
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
  province = "",
  setProvince,
  district = "",
  setDistrict,
  isType8Active = false,
  selectedDealer,
  venueType = "STORE",
  onVenueTypeChange,
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

  // Address formatting helper for selected Dealer
  const formattedDealerAddress = useMemo(() => {
    if (!selectedDealer) return "";
    const parts = [
      selectedDealer.addressLine,
      selectedDealer.subdistrict ? `ต.${selectedDealer.subdistrict}` : "",
      selectedDealer.district ? `อ.${selectedDealer.district}` : "",
      selectedDealer.province ? `จ.${selectedDealer.province}` : "",
      selectedDealer.postalCode,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(" ") : selectedDealer.name || "";
  }, [selectedDealer]);

  // When TYPE_8 is active with venueType === "STORE", auto-sync location fields from selected dealer
  useEffect(() => {
    if (isType8Active && venueType === "STORE" && selectedDealer) {
      if (setProvince && selectedDealer.province && selectedDealer.province !== province) {
        setProvince(selectedDealer.province);
      }
      if (setDistrict && selectedDealer.district && selectedDealer.district !== district) {
        setDistrict(selectedDealer.district);
      }
      if (formattedDealerAddress && formattedDealerAddress !== locationText) {
        setLocationText(formattedDealerAddress);
      }
    }
  }, [isType8Active, venueType, selectedDealer, formattedDealerAddress, province, district, locationText, setProvince, setDistrict, setLocationText]);

  // Helper Section Sub-component
  const renderHelpersCard = () => (
    <div className="space-y-3">
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
                        <p className="text-xs text-slate-400 truncate">
                          {[emp.positionTitle, emp.departmentName]
                            .filter(Boolean)
                            .join(" • ")}
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

      {/* Selected helpers badge list */}
      {helperEmployeeIds.length > 0 ? (
        <div className="flex flex-wrap gap-2 pt-1">
          {helperEmployeeIds.map((id) => {
            const emp = employees.find((e) => e.id === id);
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-lg
                           bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200"
              >
                <UserCircle2 className="h-3.5 w-3.5 text-slate-400" />
                <span className="max-w-[150px] truncate">
                  {emp?.name || id}
                </span>
                {!readonly && (
                  <button
                    type="button"
                    onClick={() => removeHelper(id)}
                    className="p-0.5 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </span>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-slate-400 italic">ยังไม่ได้เลือกผู้ช่วย</p>
      )}
    </div>
  );

  // IF TYPE_8 is active: Render "จัดสถานที่ร้าน" and "ผู้ช่วยกิจกรรม" as separate Sections!
  if (isType8Active) {
    return (
      <div className="space-y-6 relative z-20">
        {/* 1. จัดสถานที่ร้าน */}
        <div className="space-y-4">
          <SectionHeader
            title="จัดสถานที่ร้าน"
            className="rounded-xl"
            accentColor="#808080"
          />

          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4">
            {/* Radio เลือก: ร้านค้า vs อื่นๆ */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">
                สถานที่จัดงาน <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap items-center gap-6">
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="type8-venue-type"
                    value="STORE"
                    checked={venueType === "STORE"}
                    onChange={() => {
                      if (onVenueTypeChange) onVenueTypeChange("STORE");
                    }}
                    disabled={readonly}
                    className="text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <span>ร้านค้า (ดึงที่อยู่ร้าน Dealer จาก Customer Master)</span>
                </label>

                <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="type8-venue-type"
                    value="OTHER"
                    checked={venueType === "OTHER"}
                    onChange={() => {
                      if (onVenueTypeChange) onVenueTypeChange("OTHER");
                    }}
                    disabled={readonly}
                    className="text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <span>อื่นๆ (ระบุสถานที่จัดงานเอง)</span>
                </label>
              </div>
            </div>

            {/* Case STORE: แสดงที่อยู่ร้านค้าของ Dealer */}
            {venueType === "STORE" ? (
              <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-100 space-y-2">
                <div className="flex items-center gap-2 text-blue-900 font-bold text-xs">
                  <Store className="h-4 w-4 text-blue-600" />
                  <span>ข้อมูลที่อยู่ร้านค้าสำหรับการจัดงาน</span>
                </div>
                {selectedDealer ? (
                  <div className="text-xs text-slate-700 space-y-1 pt-1">
                    <p>
                      <span className="font-semibold text-slate-900">ร้านค้า:</span>{" "}
                      {selectedDealer.name}{" "}
                      {selectedDealer.customerCode && (
                        <span className="text-slate-500 font-normal">
                          ({selectedDealer.customerCode})
                        </span>
                      )}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-900">ที่อยู่:</span>{" "}
                      {formattedDealerAddress || "ไม่พบข้อมูลที่อยู่แบบเต็มในระบบ"}
                    </p>
                    {selectedDealer.phone && (
                      <p>
                        <span className="font-semibold text-slate-900">เบอร์โทรศัพท์:</span>{" "}
                        {selectedDealer.phone}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-amber-700 italic pt-1">
                    กรุณาเลือกร้านค้า Dealer ในส่วน &quot;จัดประชุมให้ใคร&quot; ด้านบนเพื่อดึงข้อมูลที่อยู่ร้านมาแสดง
                  </p>
                )}
              </div>
            ) : (
              /* Case OTHER: กรอก จังหวัด, อำเภอ, รายละเอียด */
              <div className="space-y-3 pt-1 border-t border-slate-100">
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
                    required
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
                    required
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    รายละเอียดพื้นที่จัดกิจกรรม / จุดสังเกต <span className="text-red-500">*</span>
                  </label>

                  <div className="relative">
                    <textarea
                      rows={3}
                      value={locationText}
                      maxLength={500}
                      onChange={(e) => setLocationText(e.target.value)}
                      disabled={readonly}
                      placeholder="ระบุสถานที่ เช่น โรงแรม, หอประชุมอำเภอ, แปลงนา, พร้อมจุดสังเกต..."
                      className="w-full rounded-xl border border-slate-200 bg-white p-3 pr-4 text-xs text-slate-800
                                 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/60
                                 focus:border-blue-400 transition-all resize-none
                                 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                    />

                    <div className="mt-1 flex items-center justify-between gap-3">
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
                        className={`text-[10px] tabular-nums font-medium ${
                          charPercent >= 90 ? "text-red-500" : "text-slate-400"
                        }`}
                      >
                        {charCount} / 500
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 2. ผู้ช่วยกิจกรรม (Section อิสระ) */}
        <div className="space-y-4">
          <SectionHeader
            title="ผู้ช่วยกิจกรรม"
            className="rounded-xl"
            accentColor="#808080"
          />

          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
            {renderHelpersCard()}
          </div>
        </div>
      </div>
    );
  }

  // TYPE_9 (Alone): Show only Helpers, hide Location text / observation points
  const isType9Active = selectedWorkTypes.includes("จัดกิจกรรมส่งเสริมการขายหน้าร้าน");
  const hasOtherLocationWorkType = selectedWorkTypes.some(
    (wt) => wt.includes("Field Day") || wt.includes("จัดประชุม"),
  );
  const isType9Only = isType9Active && !hasOtherLocationWorkType;

  if (isType9Only) {
    return (
      <div className="space-y-4 relative z-20">
        <SectionHeader
          title="สถานที่และทีมงาน"
          className="rounded-xl"
          accentColor="#808080"
        />
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          {renderHelpersCard()}
        </div>
      </div>
    );
  }

  // DEFAULT (Non-TYPE_8, e.g. TYPE_10 alone): Keep original 2-column layout unchanged
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
          {renderHelpersCard()}
        </div>
      </div>
    </div>
  );
}
