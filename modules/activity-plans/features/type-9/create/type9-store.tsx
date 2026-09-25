import React, { useState, useEffect, useMemo } from "react";
import { Store, Package, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormCombobox } from "@/components/custom/form-components";
import type { Type9ProductItem } from "@/modules/activity-plans/features/shared/form/types";

export interface CustomerOption {
  id: string;
  name: string;
  customerCode?: string | null;
  customerType?: string | null;
  phone?: string | null;
  province?: string | null;
  district?: string | null;
  subdistrict?: string | null;
  addressLine?: string | null;
  postalCode?: string | null;
  parentDealerId?: string | null;
  parentDealer?: {
    id: string;
    customerCode?: string | null;
    name: string;
  } | null;
  responsibleEmployeeId?: string | null;
  [key: string]: any;
}

export interface ProductOption {
  id: string;
  name: string;
  productCode?: string | null;
  price?: number | null;
  unit?: string | null;
}

interface Props {
  readonly?: boolean;
  // Sub Dealer state & handlers
  subdealerId?: string;
  setSubdealerId?: (val: string) => void;
  subdealerName?: string;
  setSubdealerName?: (val: string) => void;
  isUnregisteredSubdealer?: boolean;
  setIsUnregisteredSubdealer?: (val: boolean) => void;
  subDealerStore?: string;
  setSubDealerStore?: (val: string) => void;
  province?: string;
  setProvince?: (val: string) => void;
  district?: string;
  setDistrict?: (val: string) => void;
  parentDealerId?: string;
  setParentDealerId?: (val: string) => void;
  parentDealerName?: string;
  setParentDealerName?: (val: string) => void;

  // Backward compatibility
  type9Store?: string;
  setType9Store?: (val: string) => void;
  isSubDealer?: boolean;
  setIsSubDealer?: (val: boolean) => void;

  // Sales & products
  type9Sales: number;
  setType9Sales: (val: number) => void;
  type9ProductItems: Type9ProductItem[];
  addType9ProductItem: () => void;
  updateType9ProductItem: (
    id: string,
    field: keyof Type9ProductItem,
    val: any,
  ) => void;
  deleteType9ProductItem: (id: string) => void;

  customers?: CustomerOption[];
  products?: ProductOption[];
}

export function Type9Store({
  readonly = false,
  subdealerId,
  setSubdealerId,
  subdealerName,
  setSubdealerName,
  isUnregisteredSubdealer,
  setIsUnregisteredSubdealer,
  subDealerStore,
  setSubDealerStore,
  province,
  setProvince,
  district,
  setDistrict,
  parentDealerId,
  setParentDealerId,
  parentDealerName,
  setParentDealerName,
  type9Store,
  setType9Store,
  isSubDealer,
  setIsSubDealer,
  type9Sales,
  setType9Sales,
  type9ProductItems,
  addType9ProductItem,
  updateType9ProductItem,
  deleteType9ProductItem,
  customers = [],
  products = [],
}: Props) {
  // Local fallback state if not passed from hook
  const [internalIsUnregistered, setInternalIsUnregistered] = useState(false);
  const [internalSubdealerId, setInternalSubdealerId] = useState("");
  const [internalSubdealerName, setInternalSubdealerName] = useState("");
  const [internalSubDealerStore, setInternalSubDealerStore] = useState("");
  const [internalProvince, setInternalProvince] = useState("");
  const [internalDistrict, setInternalDistrict] = useState("");
  const [internalParentDealerId, setInternalParentDealerId] = useState("");
  const [internalParentDealerName, setInternalParentDealerName] = useState("");

  const activeIsUnregistered = isUnregisteredSubdealer ?? internalIsUnregistered;
  const activeSetIsUnregistered = setIsUnregisteredSubdealer ?? setInternalIsUnregistered;
  const activeSubdealerId = subdealerId ?? internalSubdealerId;
  const activeSetSubdealerId = setSubdealerId ?? setInternalSubdealerId;
  const activeSubdealerName = subdealerName ?? internalSubdealerName;
  const activeSetSubdealerName = setSubdealerName ?? setInternalSubdealerName;
  const activeSubDealerStore = subDealerStore ?? internalSubDealerStore;
  const activeSetSubDealerStore = setSubDealerStore ?? setInternalSubDealerStore;
  const activeProvince = province ?? internalProvince;
  const activeSetProvince = setProvince ?? setInternalProvince;
  const activeDistrict = district ?? internalDistrict;
  const activeSetDistrict = setDistrict ?? setInternalDistrict;
  const activeParentDealerId = parentDealerId ?? internalParentDealerId;
  const activeSetParentDealerId = setParentDealerId ?? setInternalParentDealerId;
  const activeParentDealerName = parentDealerName ?? internalParentDealerName;
  const activeSetParentDealerName = setParentDealerName ?? setInternalParentDealerName;

  // Load Thai Addresses for Unregistered Sub Dealer province/district dropdowns
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
        console.error("Failed to load thai addresses for TYPE_9:", err);
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
    const matched = provincesData.find((p) => p.name === activeProvince);
    if (!matched) return [];
    return matched.districts.map((d: any) => ({
      value: d.name,
      label: d.name,
    }));
  }, [activeProvince, provincesData]);

  const handleProvinceChange = (newProvince: string) => {
    activeSetProvince(newProvince);
    activeSetDistrict("");
  };

  // 1. Filter Subdealer customer master options (customerType === "SUBDEALER")
  const subdealerCustomers = useMemo(() => {
    return (customers || []).filter(
      (c) =>
        c.customerType === "SUBDEALER" ||
        c.customerType === "Subdealer",
    );
  }, [customers]);

  const subdealerOptions = useMemo(() => {
    return subdealerCustomers.map((c) => ({
      value: c.name,
      label: c.name,
      subLabel: c.customerCode ? `รหัส: ${c.customerCode}` : undefined,
    }));
  }, [subdealerCustomers]);

  // 2. Filter Dealer customer master options (for optional parent dealer)
  const dealerCustomers = useMemo(() => {
    return (customers || []).filter(
      (c) =>
        c.customerType === "DEALER" ||
        c.customerType === "Dealer" ||
        !c.customerType,
    );
  }, [customers]);

  const dealerOptions = useMemo(() => {
    return dealerCustomers.map((c) => ({
      value: c.name,
      label: c.name,
      subLabel: c.customerCode ? `รหัส: ${c.customerCode}` : undefined,
    }));
  }, [dealerCustomers]);

  // Selected registered Subdealer object
  const selectedSubdealerCustomer = useMemo(() => {
    return subdealerCustomers.find(
      (c) => c.id === activeSubdealerId || c.name === activeSubdealerName,
    );
  }, [subdealerCustomers, activeSubdealerId, activeSubdealerName]);

  // Resolved Parent Dealer Name
  const resolvedParentDealerName = useMemo(() => {
    if (activeParentDealerName) return activeParentDealerName;
    if (selectedSubdealerCustomer?.parentDealer?.name) {
      return selectedSubdealerCustomer.parentDealer.name;
    }
    if (selectedSubdealerCustomer?.parentDealerId) {
      const parent = customers.find(
        (c) => c.id === selectedSubdealerCustomer.parentDealerId,
      );
      if (parent) return parent.name;
    }
    return "";
  }, [activeParentDealerName, selectedSubdealerCustomer, customers]);

  // Products
  const boxProducts = products.filter(
    (p) => !p.unit || p.unit.trim() === "กล่อง",
  );

  const productOptions = (
    boxProducts.length > 0 ? boxProducts : products || []
  ).map((p) => ({
    value: p.name,
    label: p.name,
    subLabel: p.productCode || undefined,
  }));

  const calculatedSales = type9ProductItems.reduce(
    (sum, item) => sum + (item.quantityCases || 0) * (item.pricePerCase || 0),
    0,
  );

  return (
    <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 md:p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
          <Store className="h-4 w-4 text-slate-600" />
          <span>จัดกิจกรรมส่งเสริมการขายหน้าร้าน</span>
        </div>
      </div>

      <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="text-xs font-bold text-teal-800 flex items-center gap-1.5">
            <Store className="h-4 w-4 text-teal-600" />
            ข้อมูลร้านค้า Sub Dealer และเป้ายอดขาย
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          {/* Left Column: Sub Dealer Section */}
          <div className="space-y-3">
            {/* Header with Checkbox: ไม่มีข้อมูลในระบบ */}
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700">
                {activeIsUnregistered
                  ? "ชื่อร้านค้า Sub Dealer"
                  : "ร้านค้า Sub Dealer (จาก Customer Master)"}{" "}
                <span className="text-red-500">*</span>
              </label>

              {!readonly && (
                <label className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 cursor-pointer select-none">
                  <Checkbox
                    id="type9-unregistered-subdealer-checkbox"
                    checked={activeIsUnregistered}
                    onCheckedChange={(checked) => {
                      const isChecked = !!checked;
                      activeSetIsUnregistered(isChecked);
                      if (isChecked) {
                        // Switch to unregistered: clear registered subdealer selection
                        activeSetSubdealerId("");
                        activeSetSubdealerName("");
                      } else {
                        // Switch to registered: clear manual inputs
                        activeSetSubDealerStore("");
                      }
                    }}
                    className="rounded border-slate-300 data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
                  />
                  <span>ไม่มีข้อมูลในระบบ</span>
                </label>
              )}
            </div>

            {/* Case A: Registered Sub Dealer */}
            {!activeIsUnregistered ? (
              <div className="space-y-2.5">
                <FormCombobox
                  id="type9-subdealer-combobox"
                  label=""
                  labelClassName="hidden"
                  triggerClassName="h-10 min-h-[40px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-teal-500"
                  value={selectedSubdealerCustomer?.name || activeSubdealerName || ""}
                  onChange={(val) => {
                    const found = subdealerCustomers.find(
                      (c) => c.name === val || c.id === val,
                    );
                    if (found) {
                      activeSetSubdealerId(found.id);
                      activeSetSubdealerName(found.name);
                      if (setType9Store) setType9Store(found.name);
                      activeSetProvince(found.province || "");
                      activeSetDistrict(found.district || "");
                      if (found.parentDealerId) {
                        activeSetParentDealerId(found.parentDealerId);
                        const pDealer = customers.find((c) => c.id === found.parentDealerId);
                        activeSetParentDealerName(pDealer?.name || "");
                      } else {
                        activeSetParentDealerId("");
                        activeSetParentDealerName("");
                      }
                    } else {
                      activeSetSubdealerId("");
                      activeSetSubdealerName(val);
                      if (setType9Store) setType9Store(val);
                    }
                  }}
                  options={subdealerOptions}
                  placeholder="เลือกร้านค้า Sub Dealer จาก Customer Master..."
                  searchPlaceholder="ค้นหาร้านค้า Sub Dealer..."
                  emptyText="ไม่พบร้านค้า Sub Dealer ในระบบ"
                  disabled={readonly}
                  required
                />

                {/* READ-ONLY Card for Customer Master Details */}
                {selectedSubdealerCustomer && (
                  <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-100/80 text-xs space-y-1.5 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between text-teal-900 font-semibold">
                      <span className="truncate">{selectedSubdealerCustomer.name}</span>
                      {selectedSubdealerCustomer.customerCode && (
                        <span className="text-[11px] bg-teal-100 text-teal-800 px-2 py-0.5 rounded-md font-mono">
                          {selectedSubdealerCustomer.customerCode}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-slate-600 text-[11px] pt-1 border-t border-teal-100/60">
                      <div>
                        <span className="text-slate-400">จังหวัด:</span>{" "}
                        <span className="font-medium text-slate-700">
                          {selectedSubdealerCustomer.province || "-"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">อำเภอ:</span>{" "}
                        <span className="font-medium text-slate-700">
                          {selectedSubdealerCustomer.district || "-"}
                        </span>
                      </div>
                      {resolvedParentDealerName && (
                        <div className="col-span-2">
                          <span className="text-slate-400">Dealer ต้นสังกัด:</span>{" "}
                          <span className="font-medium text-slate-700">
                            {resolvedParentDealerName}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Case B: Unregistered Sub Dealer */
              <div className="space-y-3 animate-in fade-in duration-200">
                <div>
                  <input
                    type="text"
                    value={activeSubDealerStore}
                    onChange={(e) => {
                      activeSetSubDealerStore(e.target.value);
                      if (setType9Store) setType9Store(e.target.value);
                    }}
                    disabled={readonly}
                    placeholder="กรอกชื่อร้านค้า Sub Dealer..."
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder:text-slate-400"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <FormCombobox
                      id="type9-province-combobox"
                      label="จังหวัด"
                      labelClassName="block text-xs font-medium text-slate-700 mb-1"
                      triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-teal-500"
                      value={activeProvince}
                      onChange={(val) => {
                        handleProvinceChange(val);
                      }}
                      options={provinceOptions}
                      placeholder="เลือกจังหวัด..."
                      searchPlaceholder="ค้นหาจังหวัด..."
                      emptyText="ไม่พบจังหวัด"
                      disabled={readonly}
                      required
                    />
                  </div>

                  <div>
                    <FormCombobox
                      id="type9-district-combobox"
                      label="อำเภอ"
                      labelClassName="block text-xs font-medium text-slate-700 mb-1"
                      triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-teal-500"
                      value={activeDistrict}
                      onChange={(val) => {
                        activeSetDistrict(val);
                      }}
                      options={districtOptions}
                      placeholder={activeProvince ? "เลือกอำเภอ..." : "เลือกจังหวัดก่อน"}
                      searchPlaceholder="ค้นหาอำเภอ..."
                      emptyText="ไม่พบอำเภอ"
                      disabled={readonly || !activeProvince}
                      required
                    />
                  </div>
                </div>

                {/* Optional Dealer Selector */}
                <div>
                  <FormCombobox
                    id="type9-dealer-combobox"
                    label="ร้านค้า Dealer ต้นสังกัด (ถ้ามี)"
                    labelClassName="block text-xs font-medium text-slate-600 mb-1"
                    triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-teal-500"
                    value={activeParentDealerName}
                    onChange={(val) => {
                      const found = dealerCustomers.find((c) => c.name === val || c.id === val);
                      activeSetParentDealerId(found?.id || "");
                      activeSetParentDealerName(found?.name || val);
                    }}
                    options={dealerOptions}
                    placeholder="เลือกร้านค้า Dealer ต้นสังกัด (ถ้ามี)..."
                    searchPlaceholder="ค้นหาร้านค้า Dealer..."
                    emptyText="ไม่พบร้านค้า Dealer ในระบบ"
                    disabled={readonly}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Target Sales */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              เป้ายอดขายรวมจากกิจกรรม (บาท){" "}
              <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-semibold">
                ฿
              </span>
              <input
                type="number"
                value={
                  type9ProductItems.length > 0 ? calculatedSales : type9Sales
                }
                onChange={(e) => setType9Sales(parseFloat(e.target.value) || 0)}
                disabled={readonly || type9ProductItems.length > 0}
                className="w-full h-10 pl-7 pr-3 rounded-lg border border-slate-200 bg-white text-xs font-bold text-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table / List of Products */}
      <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="text-xs font-bold text-teal-800 flex items-center gap-1.5">
            <Package className="h-4 w-4 text-teal-600" />
            รายการสินค้าที่เสนอขาย / โปรโมชันหน้าร้าน
          </span>

          {!readonly && (
            <Button
              type="button"
              size="sm"
              onClick={addType9ProductItem}
              className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium rounded-lg h-7 px-2.5 shadow-sm"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              เพิ่มสินค้า
            </Button>
          )}
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="py-2 px-3 text-center w-10">ลำดับ</th>
                <th className="py-2 px-3 min-w-[180px]">
                  เลือกสินค้า <span className="text-red-500">*</span>
                </th>
                <th className="py-2 px-3 w-28 text-center">
                  จำนวน (ลัง) <span className="text-red-500">*</span>
                </th>
                <th className="py-2 px-3 w-32 text-center">
                  ราคา (บาท) <span className="text-red-500">*</span>
                </th>
                <th className="py-2 px-3 w-36 text-right">รวม</th>
                {!readonly && (
                  <th className="py-2 px-3 text-center w-14">ลบ</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {type9ProductItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-slate-400">
                    ยังไม่มีรายการสินค้า
                  </td>
                </tr>
              ) : (
                type9ProductItems.map((item, index) => {
                  const totalItemPrice =
                    (item.quantityCases || 0) * (item.pricePerCase || 0);
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="py-2 px-3 text-center font-medium text-slate-500">
                        {index + 1}
                      </td>
                      <td className="py-1.5 px-3 min-w-[200px]">
                        <FormCombobox
                          id={`type9-product-combobox-${item.id}`}
                          label=""
                          labelClassName="hidden"
                          triggerClassName="h-8 min-h-[32px] py-0.5 text-xs bg-white border-slate-200 rounded-md text-slate-800 focus:ring-2 focus:ring-teal-500"
                          value={item.productName}
                          onChange={(val) => {
                            const found = products.find((p) => p.name === val || p.id === val);
                            updateType9ProductItem(item.id, "productName", found?.name || val);
                            if (found?.id) {
                              updateType9ProductItem(item.id, "productId", found.id);
                            }
                            if (found && found.price != null) {
                              updateType9ProductItem(
                                item.id,
                                "pricePerCase",
                                found.price,
                              );
                            } else {
                              updateType9ProductItem(
                                item.id,
                                "pricePerCase",
                                0,
                              );
                            }
                          }}
                          options={productOptions}
                          placeholder="เลือกสินค้า..."
                          searchPlaceholder="ค้นหาสินค้า..."
                          emptyText="ไม่พบสินค้า"
                          disabled={readonly}
                        />
                      </td>
                      <td className="py-1.5 px-3">
                        <input
                          type="number"
                          min={0}
                          value={item.quantityCases}
                          onChange={(e) =>
                            updateType9ProductItem(
                              item.id,
                              "quantityCases",
                              parseInt(e.target.value) || 0,
                            )
                          }
                          disabled={readonly}
                          className="w-full h-8 px-2 rounded-md border border-slate-200 text-xs text-slate-800 text-center focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </td>
                      <td className="py-1.5 px-3">
                        <div className="relative">
                          <span className="absolute left-2 top-2 text-slate-400 text-[11px]">
                            ฿
                          </span>
                          <input
                            type="number"
                            min={0}
                            step="any"
                            value={item.pricePerCase ?? 0}
                            onChange={(e) =>
                              updateType9ProductItem(
                                item.id,
                                "pricePerCase",
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            disabled={readonly}
                            placeholder="0"
                            className={`w-full h-8 pl-5 pr-2 rounded-md border border-slate-200 text-xs text-right font-medium focus:outline-none ${
                              readonly
                                ? "bg-slate-100 text-slate-500 cursor-not-allowed"
                                : "bg-white text-slate-800 focus:ring-2 focus:ring-teal-500"
                            }`}
                          />
                        </div>
                      </td>
                      <td className="py-1.5 px-3 text-right font-semibold text-teal-700">
                        ฿ {totalItemPrice.toLocaleString()}
                      </td>
                      {!readonly && (
                        <td className="py-1.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => deleteType9ProductItem(item.id)}
                            className="p-1 rounded-md text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
