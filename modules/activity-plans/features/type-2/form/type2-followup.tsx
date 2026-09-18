"use client";

import React, { useMemo, useState, useEffect } from "react";
import { CheckSquare, Plus, Trash2, Store, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormCombobox } from "@/components/custom/form-components";
import { ALL_THAI_PROVINCES } from "@/lib/province-region-mapping";
import type { Type2ProductFollowupItem } from "@/modules/activity-plans/features/shared/form/types";

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

export interface ProductOption {
  id: string;
  name: string;
  productCode?: string | null;
}

interface Props {
  readonly?: boolean;
  type2Items: Type2ProductFollowupItem[];
  addType2Row: () => void;
  updateType2Row: (
    id: string,
    field: keyof Type2ProductFollowupItem,
    val: any,
  ) => void;
  deleteType2Row: (id: string) => void;
  customers?: CustomerOption[];
  products?: ProductOption[];
}

export function Type2Followup({
  readonly = false,
  type2Items,
  addType2Row,
  updateType2Row,
  deleteType2Row,
  customers = [],
  products = [],
}: Props) {
  // Server-fetched options for Dealer/Subdealer and Farmers per province
  const [storeOptionsFromApi, setStoreOptionsFromApi] = useState<
    CustomerOption[]
  >([]);
  const [farmersByProvince, setFarmersByProvince] = useState<
    Record<string, CustomerOption[]>
  >({});

  // Load Dealer & Subdealer options from server action
  useEffect(() => {
    let isMounted = true;
    async function loadStores() {
      try {
        const { getDealerAndSubdealerCustomerOptionsAction } =
          await import("@/modules/activity-plans/server/actions");
        const res = await getDealerAndSubdealerCustomerOptionsAction();
        if (isMounted && res && res.success && res.stores) {
          setStoreOptionsFromApi(res.stores as CustomerOption[]);
        }
      } catch (err) {
        console.error("Failed to load stores for TYPE_2:", err);
      }
    }
    loadStores();
    return () => {
      isMounted = false;
    };
  }, []);

  // Track unique provinces currently selected across all TYPE_2 rows
  const activeProvinces = useMemo(() => {
    const provs = new Set<string>();
    type2Items.forEach((it) => {
      const p = it.province?.trim();
      if (p) provs.add(p);
    });
    return Array.from(provs);
  }, [type2Items]);

  // Load Farmer options per province
  useEffect(() => {
    let isMounted = true;
    activeProvinces.forEach(async (prov) => {
      if (farmersByProvince[prov]) return;
      try {
        const { getFarmerCustomerOptionsAction } =
          await import("@/modules/activity-plans/server/actions");
        const res = await getFarmerCustomerOptionsAction(prov);
        if (isMounted && res && res.success && res.farmers) {
          setFarmersByProvince((prev) => ({
            ...prev,
            [prov]: res.farmers as CustomerOption[],
          }));
        }
      } catch (err) {
        console.error("Failed to load farmers for TYPE_2 province:", prov, err);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [activeProvinces, farmersByProvince]);

  const provinceOptions = useMemo(
    () => ALL_THAI_PROVINCES.map((p) => ({ value: p, label: p })),
    [],
  );

  const productOptions = useMemo(
    () =>
      (products || []).map((p) => ({
        value: p.name,
        label: p.name,
        subLabel: p.productCode || undefined,
      })),
    [products],
  );

  // Store Customers: ONLY DEALER or SUBDEALER
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

    return list.map((c) => {
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
  }, [storeOptionsFromApi, customers]);

  // Helper for Store options preserving selected store
  const getStoreOptionsForItem = (item: Type2ProductFollowupItem) => {
    const options = [...storeCustomerOptions];
    if (item.storeId && !options.some((o) => o.value === item.storeId)) {
      const matched = (customers || []).find((c) => c.id === item.storeId);
      if (
        matched &&
        (matched.customerType === "DEALER" ||
          matched.customerType === "SUBDEALER")
      ) {
        const typeLabel =
          matched.customerType === "DEALER" ? "ตัวแทนจำหน่าย" : "ร้านค้าย่อย";
        options.push({
          value: matched.id,
          label: `${matched.name} (${typeLabel})${matched.province ? ` - จ.${matched.province}` : ""}`,
          customerName: matched.name,
          customerType: matched.customerType,
        });
      }
    }
    return options;
  };

  // Helper for Farmer options preserving selected farmer
  const getFarmerOptionsForItem = (item: Type2ProductFollowupItem) => {
    const currentProvince = item.province?.trim();
    if (!currentProvince) return [];

    const apiFarmers = farmersByProvince[currentProvince] || [];
    const list = [...apiFarmers];
    const existingIds = new Set(list.map((c) => c.id));

    (customers || []).forEach((c) => {
      if (
        c.customerType === "FARMER" &&
        c.province?.trim() === currentProvince &&
        !existingIds.has(c.id)
      ) {
        list.push(c);
        existingIds.add(c.id);
      }
    });

    const options = list.map((c) => ({
      value: c.id,
      label: `${c.name}${c.customerCode ? ` (${c.customerCode})` : ""}`,
      customerName: c.name,
    }));

    if (item.storeId && !options.some((o) => o.value === item.storeId)) {
      const matched = (customers || []).find((c) => c.id === item.storeId);
      if (matched) {
        options.push({
          value: matched.id,
          label: `${matched.name}${matched.customerCode ? ` (${matched.customerCode})` : ""}`,
          customerName: matched.name,
        });
      }
    }

    return options;
  };

  // Switching purpose with state cleanup
  const handlePurposeChange = (
    id: string,
    newPurpose: "FARMER" | "STORE",
    currentPurpose: "FARMER" | "STORE",
  ) => {
    if (newPurpose === currentPurpose) return;
    updateType2Row(id, "visitPurpose", newPurpose);
    if (newPurpose === "STORE") {
      // Clear all Farmer-specific state
      updateType2Row(id, "province", "");
      updateType2Row(id, "storeId", undefined);
      updateType2Row(id, "customerName", "");
      updateType2Row(id, "isUnregisteredFarmer", false);
      updateType2Row(id, "unregisteredFarmerName", "");
      updateType2Row(id, "unregisteredFarmerPhone", "");
    } else {
      // newPurpose === "FARMER"
      // Clear Store-specific selection
      updateType2Row(id, "storeId", undefined);
      updateType2Row(id, "customerName", "");
    }
  };

  const handleProvinceChange = (id: string, newProvince: string) => {
    updateType2Row(id, "province", newProvince);
    // When province changes, clear selected farmer to prevent mismatched data
    updateType2Row(id, "storeId", undefined);
    updateType2Row(id, "customerName", "");
  };

  const handleToggleUnregistered = (id: string, checked: boolean) => {
    updateType2Row(id, "isUnregisteredFarmer", checked);
    if (checked) {
      // Switching to Unregistered: clear registered farmer
      updateType2Row(id, "storeId", undefined);
      updateType2Row(id, "customerName", "");
    } else {
      // Switching to Registered: clear unregistered details
      updateType2Row(id, "unregisteredFarmerName", "");
      updateType2Row(id, "unregisteredFarmerPhone", "");
    }
  };

  return (
    <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 md:p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
          <CheckSquare className="h-4 w-4 text-indigo-600" />
          <span>ติดตามผลการใช้สินค้า</span>
        </div>

        {!readonly && (
          <Button
            type="button"
            size="sm"
            onClick={addType2Row}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg h-7 px-2.5 shadow-sm"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            เพิ่มรายการ
          </Button>
        )}
      </div>

      {/* List of Follow-up Cards */}
      <div className="space-y-3">
        {type2Items.length === 0 ? (
          <div className="py-6 text-center text-slate-400 bg-white rounded-xl border border-slate-200 text-xs">
            ยังไม่มีรายการติดตามผล
          </div>
        ) : (
          type2Items.map((item, index) => {
            const currentPurpose: "FARMER" | "STORE" =
              item.visitPurpose === "STORE" ? "STORE" : "FARMER";
            const currentProvince = item.province?.trim() || "";
            const itemFarmerOptions = getFarmerOptionsForItem(item);
            const itemStoreOptions = getStoreOptionsForItem(item);

            return (
              <div
                key={item.id}
                className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3.5 transition-all hover:border-indigo-300"
              >
                {/* Header of Item */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-indigo-800 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[11px] font-extrabold">
                      {index + 1}
                    </span>
                    รายการติดตามผลที่ {index + 1}
                  </span>
                  {!readonly && (
                    <button
                      type="button"
                      onClick={() => deleteType2Row(item.id)}
                      className="p-1 rounded-md text-red-500 hover:bg-red-50 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>ลบรายการ</span>
                    </button>
                  )}
                </div>

                {/* Row 1: วัตถุประสงค์ของประเภทงาน */}
                <div className="space-y-1.5 border-b border-slate-100 pb-3">
                  <label className="block text-xs font-semibold text-slate-700">
                    วัตถุประสงค์ของประเภทงาน{" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-6 items-center pt-0.5">
                    <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 select-none">
                      <input
                        type="radio"
                        name={`type2-visit-purpose-${item.id}`}
                        value="FARMER"
                        checked={currentPurpose === "FARMER"}
                        onChange={() =>
                          handlePurposeChange(item.id, "FARMER", currentPurpose)
                        }
                        disabled={readonly}
                        className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                      />
                      <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                        <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                        เข้าพบเกษตรกร
                      </span>
                    </label>

                    <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 select-none">
                      <input
                        type="radio"
                        name={`type2-visit-purpose-${item.id}`}
                        value="STORE"
                        checked={currentPurpose === "STORE"}
                        onChange={() =>
                          handlePurposeChange(item.id, "STORE", currentPurpose)
                        }
                        disabled={readonly}
                        className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                      />
                      <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                        <Store className="w-3.5 h-3.5 text-indigo-600" />
                        เข้าพบร้านค้า
                      </span>
                    </label>
                  </div>
                </div>

                {/* CASE 1: เข้าพบเกษตรกร (FARMER) */}
                {currentPurpose === "FARMER" && (
                  <div className="space-y-3 border-b border-slate-100 pb-3">
                    {/* จังหวัด & รายชื่อเกษตรกร */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* จังหวัด Selector */}
                      <FormCombobox
                        id={`type2-province-combobox-${item.id}`}
                        label="จังหวัด"
                        labelClassName="block text-xs font-semibold text-slate-700 mb-1 mx-0"
                        triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500"
                        value={item.province || ""}
                        onChange={(val) => handleProvinceChange(item.id, val)}
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
                            id={`type2-farmer-combobox-${item.id}`}
                            label="เกษตรกร"
                            labelClassName="block text-xs font-semibold text-slate-700 mb-1 mx-0"
                            triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-400"
                            value={item.storeId || ""}
                            onChange={(val) => {
                              const opt = itemFarmerOptions.find(
                                (o) => o.value === val,
                              );
                              updateType2Row(
                                item.id,
                                "storeId",
                                val || undefined,
                              );
                              updateType2Row(
                                item.id,
                                "customerName",
                                opt?.customerName || "",
                              );
                            }}
                            options={itemFarmerOptions}
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
                        id={`type2-unregistered-farmer-toggle-${item.id}`}
                        checked={Boolean(item.isUnregisteredFarmer)}
                        onChange={(e) =>
                          handleToggleUnregistered(item.id, e.target.checked)
                        }
                        disabled={readonly}
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer disabled:cursor-not-allowed"
                      />
                      <label
                        htmlFor={`type2-unregistered-farmer-toggle-${item.id}`}
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
                            ชื่อ - สกุล เกษตรกร{" "}
                            <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={item.unregisteredFarmerName || ""}
                            onChange={(e) =>
                              updateType2Row(
                                item.id,
                                "unregisteredFarmerName",
                                e.target.value,
                              )
                            }
                            disabled={readonly}
                            placeholder="ระบุชื่อ - สกุล เกษตรกร..."
                            className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            เบอร์โทรศัพท์{" "}
                            <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="tel"
                            value={item.unregisteredFarmerPhone || ""}
                            onChange={(e) =>
                              updateType2Row(
                                item.id,
                                "unregisteredFarmerPhone",
                                e.target.value,
                              )
                            }
                            disabled={readonly}
                            placeholder="เช่น 0812345678"
                            maxLength={12}
                            className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                            required
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* CASE 2: เข้าพบร้านค้า (STORE) */}
                {currentPurpose === "STORE" && (
                  <div className="space-y-2 border-b border-slate-100 pb-3">
                    <FormCombobox
                      id={`type2-store-combobox-${item.id}`}
                      label="ร้านค้า (ตัวแทนจำหน่าย / ร้านค้าย่อย)"
                      labelClassName="block text-xs font-semibold text-slate-700 mb-1 mx-0"
                      triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500"
                      value={item.storeId || ""}
                      onChange={(val) => {
                        const opt = itemStoreOptions.find(
                          (o) => o.value === val,
                        );
                        updateType2Row(item.id, "storeId", val || undefined);
                        updateType2Row(
                          item.id,
                          "customerName",
                          opt?.customerName || "",
                        );
                      }}
                      options={itemStoreOptions}
                      placeholder="เลือกร้านค้า (Customer Master)"
                      searchPlaceholder="ค้นหาชื่อร้านค้า..."
                      emptyText="ไม่พบร้านค้าในระบบ"
                      disabled={readonly}
                      required
                    />
                    <p className="text-[11px] text-slate-500">
                      อนุญาตเฉพาะลูกค้าประเภทตัวแทนจำหน่าย (DEALER)
                      หรือร้านค้าย่อย (SUBDEALER) ในระบบเท่านั้น
                    </p>
                  </div>
                )}

                {/* Common Section: สินค้าที่ต้องการติดตามผล & รายละเอียดเพิ่มเติม */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-0.5">
                  <FormCombobox
                    id={`product-combobox-${item.id}`}
                    label="สินค้าที่ต้องการติดตามผล"
                    labelClassName="block text-xs font-semibold text-slate-700 mb-1 mx-0"
                    triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500"
                    value={item.productName}
                    onChange={(val) => {
                      const prod = products.find(
                        (p) => p.name === val || p.id === val,
                      );
                      updateType2Row(item.id, "productName", prod?.name || val);
                      if (prod?.id) {
                        updateType2Row(item.id, "productId", prod.id);
                      }
                    }}
                    options={productOptions}
                    placeholder="เลือกสินค้า..."
                    searchPlaceholder="ค้นหาสินค้า..."
                    emptyText="ไม่พบสินค้า"
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
                        updateType2Row(item.id, "detail", e.target.value)
                      }
                      disabled={readonly}
                      placeholder="ระบุรายละเอียดการติดตาม..."
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
