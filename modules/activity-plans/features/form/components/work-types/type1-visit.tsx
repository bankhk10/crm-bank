"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Users, Store, UserCheck } from "lucide-react";
import { FormCombobox } from "@/components/custom/form-components";
import { ALL_THAI_PROVINCES } from "@/lib/province-region-mapping";
import type { Type1VisitItem } from "../../types";

export interface CustomerOption {
  id: string;
  name: string;
  customerCode?: string | null;
  customerType?: string;
  province?: string | null;
  district?: string | null;
  phone?: string | null;
  responsibleEmployeeId?: string | null;
}

interface Props {
  readonly?: boolean;
  type1Items: Type1VisitItem[];
  addType1Row?: () => void;
  updateType1Row: (id: string, field: keyof Type1VisitItem, val: any) => void;
  deleteType1Row?: (id: string) => void;
  customers?: CustomerOption[];
}

const VISIT_TOPICS = [
  "แจ้งข่าวสาร",
  "อัปเดตข้อมูลลูกค้า",
  "เพิ่มข้อมูลเกษตรกร",
  "เลี้ยงรับรอง / สังสรรค์",
  "ให้คำแนะนำการใช้สินค้า",
  "อื่นๆ",
];

export function Type1Visit({
  readonly = false,
  type1Items,
  updateType1Row,
  customers = [],
}: Props) {
  // 1 Plan : 1 Target rule for TYPE_1
  const item = type1Items[0] || {
    id: "1",
    visitPurpose: "FARMER",
    province: "",
    isUnregisteredFarmer: false,
    storeId: "",
    customerName: "",
    unregisteredFarmerName: "",
    unregisteredFarmerPhone: "",
    topic: "แจ้งข่าวสาร",
    detail: "",
  };

  const currentPurpose: "FARMER" | "STORE" = item.visitPurpose === "STORE" ? "STORE" : "FARMER";
  const currentProvince = item.province?.trim() || "";

  // Server-fetched options for Dealer/Subdealer and Farmer
  const [storeOptionsFromApi, setStoreOptionsFromApi] = useState<CustomerOption[]>([]);
  const [farmerOptionsFromApi, setFarmerOptionsFromApi] = useState<CustomerOption[]>([]);

  // Load Dealer & Subdealer options from server action
  useEffect(() => {
    let isMounted = true;
    async function loadStores() {
      try {
        const { getDealerAndSubdealerCustomerOptionsAction } = await import("../../../../server/actions");
        const res = await getDealerAndSubdealerCustomerOptionsAction();
        if (isMounted && res && res.success && res.stores) {
          setStoreOptionsFromApi(res.stores as CustomerOption[]);
        }
      } catch (err) {
        console.error("Failed to load stores for TYPE_1:", err);
      }
    }
    loadStores();
    return () => {
      isMounted = false;
    };
  }, []);

  // Load Farmer options from server action when province is selected
  useEffect(() => {
    if (!currentProvince) {
      setFarmerOptionsFromApi([]);
      return;
    }
    let isMounted = true;
    async function loadFarmers() {
      try {
        const { getFarmerCustomerOptionsAction } = await import("../../../../server/actions");
        const res = await getFarmerCustomerOptionsAction(currentProvince);
        if (isMounted && res && res.success && res.farmers) {
          setFarmerOptionsFromApi(res.farmers as CustomerOption[]);
        }
      } catch (err) {
        console.error("Failed to load farmers for TYPE_1:", err);
      }
    }
    loadFarmers();
    return () => {
      isMounted = false;
    };
  }, [currentProvince]);

  // Handle Switching Purpose with state cleanup
  const handlePurposeChange = (newPurpose: "FARMER" | "STORE") => {
    if (newPurpose === currentPurpose) return;
    updateType1Row(item.id, "visitPurpose", newPurpose);
    if (newPurpose === "STORE") {
      // Clear all Farmer-specific state
      updateType1Row(item.id, "province", "");
      updateType1Row(item.id, "storeId", undefined);
      updateType1Row(item.id, "customerName", "");
      updateType1Row(item.id, "isUnregisteredFarmer", false);
      updateType1Row(item.id, "unregisteredFarmerName", "");
      updateType1Row(item.id, "unregisteredFarmerPhone", "");
    } else {
      // newPurpose === "FARMER"
      // Clear Store-specific selection
      updateType1Row(item.id, "storeId", undefined);
      updateType1Row(item.id, "customerName", "");
    }
  };

  // Farmer Customers: ONLY CustomerType.FARMER (Strictly exclude DEALER, SUBDEALER, BROKER)
  const allFarmerCustomers = useMemo(() => {
    const list = [...farmerOptionsFromApi];
    const existingIds = new Set(list.map((c) => c.id));
    (customers || []).forEach((c) => {
      if (c.customerType === "FARMER" && !existingIds.has(c.id)) {
        list.push(c);
        existingIds.add(c.id);
      }
    });
    return list;
  }, [farmerOptionsFromApi, customers]);

  // Filter Farmers by selected Province
  const provinceFarmerOptions = useMemo(() => {
    if (!currentProvince) return [];

    const filtered = allFarmerCustomers.filter(
      (c) => c.province?.trim() === currentProvince,
    );

    const options = filtered.map((c) => ({
      value: c.id,
      label: `${c.name}${c.customerCode ? ` (${c.customerCode})` : ""}`,
      customerName: c.name,
    }));

    // Preserve selected registered farmer in options if already set
    if (item.storeId && !options.some((o) => o.value === item.storeId)) {
      const matched = allFarmerCustomers.find((c) => c.id === item.storeId);
      if (matched) {
        options.push({
          value: matched.id,
          label: `${matched.name}${matched.customerCode ? ` (${matched.customerCode})` : ""}`,
          customerName: matched.name,
        });
      }
    }

    return options;
  }, [allFarmerCustomers, currentProvince, item.storeId]);

  // Store Customers: ONLY CustomerType.DEALER or CustomerType.SUBDEALER (Strictly exclude FARMER, BROKER)
  const storeCustomerOptions = useMemo(() => {
    const list = [...storeOptionsFromApi];
    const existingIds = new Set(list.map((c) => c.id));
    (customers || []).forEach((c) => {
      if (
        (c.customerType === "DEALER" || c.customerType === "SUBDEALER") &&
        !existingIds.has(c.id)
      ) {
        list.push(c);
        existingIds.add(c.id);
      }
    });

    const options = list.map((c) => {
      const typeLabel =
        c.customerType === "DEALER"
          ? "ตัวแทนจำหน่าย"
          : c.customerType === "SUBDEALER"
            ? "ร้านค้าย่อย"
            : "";
      const provinceInfo = c.province ? ` - จ.${c.province}` : "";
      return {
        value: c.id,
        label: `${c.name} (${typeLabel})${provinceInfo}`,
        customerName: c.name,
        customerType: c.customerType,
      };
    });

    // Preserve selected store if already set
    if (item.storeId && !options.some((o) => o.value === item.storeId)) {
      const matched = (customers || []).find((c) => c.id === item.storeId);
      if (matched && (matched.customerType === "DEALER" || matched.customerType === "SUBDEALER")) {
        const typeLabel = matched.customerType === "DEALER" ? "ตัวแทนจำหน่าย" : "ร้านค้าย่อย";
        options.push({
          value: matched.id,
          label: `${matched.name} (${typeLabel})${matched.province ? ` - จ.${matched.province}` : ""}`,
          customerName: matched.name,
          customerType: matched.customerType,
        });
      }
    }

    return options;
  }, [storeOptionsFromApi, customers, item.storeId]);

  const provinceOptions = useMemo(
    () => ALL_THAI_PROVINCES.map((p) => ({ value: p, label: p })),
    [],
  );

  const handleProvinceChange = (newProvince: string) => {
    updateType1Row(item.id, "province", newProvince);
    // When province changes, clear selected farmer to prevent mismatched data
    updateType1Row(item.id, "storeId", undefined);
    updateType1Row(item.id, "customerName", "");
  };

  const handleToggleUnregistered = (checked: boolean) => {
    updateType1Row(item.id, "isUnregisteredFarmer", checked);
    if (checked) {
      // Switching to Unregistered: clear registered farmer
      updateType1Row(item.id, "storeId", undefined);
      updateType1Row(item.id, "customerName", "");
    } else {
      // Switching to Registered: clear unregistered details
      updateType1Row(item.id, "unregisteredFarmerName", "");
      updateType1Row(item.id, "unregisteredFarmerPhone", "");
    }
  };

  return (
    <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 md:p-5 space-y-4 relative">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
          <Store className="h-4 w-4 text-emerald-600" />
          <span>เข้าพบร้านค้า / Key Farmer</span>
        </div>
        <span className="text-[11px] font-medium text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
          {currentPurpose === "STORE" ? "1 แผน : 1 ร้านค้า" : "1 แผน : 1 เกษตรกร"}
        </span>
      </div>

      {/* Single Visit Card */}
      <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3.5">
        {/* Row 0: วัตถุประสงค์ของประเภทงาน */}
        <div className="space-y-1.5 border-b border-slate-100 pb-3">
          <label className="block text-xs font-semibold text-slate-700">
            วัตถุประสงค์ของประเภทงาน <span className="text-rose-500">*</span>
          </label>
          <div className="flex flex-wrap gap-6 items-center pt-0.5">
            <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 select-none">
              <input
                type="radio"
                name={`visit-purpose-${item.id}`}
                value="FARMER"
                checked={currentPurpose === "FARMER"}
                onChange={() => handlePurposeChange("FARMER")}
                disabled={readonly}
                className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer"
              />
              <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                เข้าพบเกษตรกร
              </span>
            </label>

            <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 select-none">
              <input
                type="radio"
                name={`visit-purpose-${item.id}`}
                value="STORE"
                checked={currentPurpose === "STORE"}
                onChange={() => handlePurposeChange("STORE")}
                disabled={readonly}
                className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer"
              />
              <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                <Store className="w-3.5 h-3.5 text-emerald-600" />
                เข้าพบร้านค้า
              </span>
            </label>
          </div>
        </div>

        {/* CASE 1: เข้าพบเกษตรกร (FARMER) */}
        {currentPurpose === "FARMER" && (
          <div className="space-y-3">
            {/* จังหวัด & รายชื่อเกษตรกร */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* จังหวัด Selector */}
              <FormCombobox
                id={`province-combobox-${item.id}`}
                label="จังหวัด"
                labelClassName="block text-xs font-semibold text-slate-700 mb-1 mx-0"
                triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500"
                value={item.province || ""}
                onChange={handleProvinceChange}
                options={provinceOptions}
                placeholder="เลือกจังหวัด"
                searchPlaceholder="ค้นหาจังหวัด..."
                emptyText="ไม่พบจังหวัด"
                disabled={readonly}
                required
              />

              {/* รายชื่อเกษตรกร (เมื่ออยู่ในระบบ) */}
              {!item.isUnregisteredFarmer ? (
                <div>
                  <FormCombobox
                    id={`farmer-combobox-${item.id}`}
                    label="เกษตรกร"
                    labelClassName="block text-xs font-semibold text-slate-700 mb-1 mx-0"
                    triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100 disabled:text-slate-400"
                    value={item.storeId || ""}
                    onChange={(val) => {
                      const opt = provinceFarmerOptions.find((o) => o.value === val);
                      updateType1Row(item.id, "storeId", val || undefined);
                      updateType1Row(
                        item.id,
                        "customerName",
                        opt?.customerName || "",
                      );
                    }}
                    options={provinceFarmerOptions}
                    placeholder={
                      !currentProvince
                        ? "กรุณาเลือกจังหวัดก่อน"
                        : "เลือกเกษตรกร (Customer Master)"
                    }
                    searchPlaceholder="ค้นหาชื่อ หรือรหัสเกษตรกร..."
                    emptyText={
                      !currentProvince
                        ? "กรุณาเลือกจังหวัดก่อน"
                        : "ไม่พบเกษตรกรในจังหวัดนี้"
                    }
                    disabled={readonly || !currentProvince}
                    required
                  />
                </div>
              ) : (
                <div className="hidden md:block" />
              )}
            </div>

            {/* Toggle: ไม่มีเกษตรกรในระบบ */}
            <div className="flex items-center gap-2 pt-0.5">
              <input
                type="checkbox"
                id={`unregistered-farmer-toggle-${item.id}`}
                checked={Boolean(item.isUnregisteredFarmer)}
                onChange={(e) => handleToggleUnregistered(e.target.checked)}
                disabled={readonly}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer disabled:cursor-not-allowed"
              />
              <label
                htmlFor={`unregistered-farmer-toggle-${item.id}`}
                className="text-xs font-medium text-slate-700 cursor-pointer select-none"
              >
                ไม่มีเกษตรกรในระบบ{" "}
                <span className="text-[11px] text-slate-500">
                  (กรอกชื่อและเบอร์โทรศัพท์โดยไม่สร้าง Master Data)
                </span>
              </label>
            </div>

            {/* Form fields for Unregistered Farmer */}
            {item.isUnregisteredFarmer && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-amber-50/50 border border-amber-200/80 rounded-lg">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ชื่อ - สกุล เกษตรกร <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={item.unregisteredFarmerName || ""}
                    onChange={(e) =>
                      updateType1Row(
                        item.id,
                        "unregisteredFarmerName",
                        e.target.value,
                      )
                    }
                    disabled={readonly}
                    placeholder="ระบุชื่อ - สกุล เกษตรกร..."
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    เบอร์โทรศัพท์
                  </label>
                  <input
                    type="tel"
                    value={item.unregisteredFarmerPhone || ""}
                    onChange={(e) =>
                      updateType1Row(
                        item.id,
                        "unregisteredFarmerPhone",
                        e.target.value,
                      )
                    }
                    disabled={readonly}
                    placeholder="เช่น 0812345678"
                    maxLength={12}
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* CASE 2: เข้าพบร้านค้า (STORE) */}
        {currentPurpose === "STORE" && (
          <div className="space-y-3">
            <div>
              <FormCombobox
                id={`store-combobox-${item.id}`}
                label="ร้านค้า (ตัวแทนจำหน่าย / ร้านค้าย่อย)"
                labelClassName="block text-xs font-semibold text-slate-700 mb-1 mx-0"
                triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500"
                value={item.storeId || ""}
                onChange={(val) => {
                  const opt = storeCustomerOptions.find((o) => o.value === val);
                  updateType1Row(item.id, "storeId", val || undefined);
                  updateType1Row(
                    item.id,
                    "customerName",
                    opt?.customerName || "",
                  );
                }}
                options={storeCustomerOptions}
                placeholder="เลือกร้านค้า (Customer Master)"
                searchPlaceholder="ค้นหาชื่อร้านค้า..."
                emptyText="ไม่พบร้านค้าในระบบ"
                disabled={readonly}
                required
              />
              <p className="text-[11px] text-slate-500 mt-1">
                อนุญาตเฉพาะลูกค้าประเภทตัวแทนจำหน่าย (DEALER) หรือร้านค้าย่อย (SUBDEALER) ในระบบเท่านั้น
              </p>
            </div>
          </div>
        )}

        {/* Common Row: ประเด็นหลัก & รายละเอียดเพิ่มเติม */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          <FormCombobox
            id={`topic-combobox-${item.id}`}
            label="ประเด็นหลัก"
            labelClassName="block text-xs font-semibold text-slate-700 mb-1 mx-0"
            triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500"
            value={item.topic}
            onChange={(val) => updateType1Row(item.id, "topic", val)}
            options={VISIT_TOPICS.map((topic) => ({
              label: topic,
              value: topic,
            }))}
            placeholder="เลือกประเด็นหลัก"
            searchPlaceholder="ค้นหาประเด็นหลัก..."
            emptyText="ไม่พบประเด็นหลัก"
            disabled={readonly}
            required
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              รายละเอียดเพิ่มเติม
            </label>
            <input
              type="text"
              value={item.detail}
              onChange={(e) =>
                updateType1Row(item.id, "detail", e.target.value)
              }
              disabled={readonly}
              placeholder="ระบุรายละเอียดเพิ่มเติมการเข้าพบ..."
              className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
