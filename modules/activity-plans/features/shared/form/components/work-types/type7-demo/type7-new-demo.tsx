"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Plus, Trash2, AlertCircle, Info } from "lucide-react";
import { FormCombobox } from "@/components/custom/form-components";
import { Button } from "@/components/ui/button";
import type {
  Type7DemoPlotItem,
  Type7DemoProductLine,
} from "@/modules/activity-plans/features/form/types";
import { CROPS_BY_CATEGORY } from "@/modules/activity-plans/constants";

export interface CustomerOption {
  id: string;
  name: string;
  customerCode?: string | null;
  customerType?: string | null;
  province?: string | null;
  district?: string | null;
  responsibleEmployeeId?: string | null;
}

export interface ProductOption {
  id: string;
  name: string;
  productCode?: string | null;
  categoryId?: string | null;
  productGroupId?: string | null;
  price?: number | null;
  unit?: string | null;
}

export interface ProductCategoryOption {
  id: string;
  code: string;
  description: string;
  name?: string;
}

export interface ChemicalGroupOption {
  id: string;
  code: string;
  name: string;
  description?: string | null;
}

interface Type7NewDemoProps {
  item: Type7DemoPlotItem;
  updateType7Row: (
    id: string,
    field: keyof Type7DemoPlotItem,
    val: any,
  ) => void;
  customerOptions?: Array<{ value: string; label: string; subLabel?: string }>;
  productOptions?: Array<{ value: string; label: string; subLabel?: string }>;
  cropCategoryOptions: Array<{ value: string; label: string }>;
  customers?: CustomerOption[];
  products?: ProductOption[];
  productCategories?: ProductCategoryOption[];
  chemicalGroups?: ChemicalGroupOption[];
  readonly?: boolean;
}

export function Type7NewDemo({
  item,
  updateType7Row,
  cropCategoryOptions,
  customers = [],
  products = [],
  productCategories = [],
  chemicalGroups = [],
  readonly = false,
}: Type7NewDemoProps) {
  // 1. Thai Address Cascading
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
    const matched = provincesData.find((p) => p.name === item.province);
    if (!matched) return [];
    return matched.districts.map((d: any) => ({
      value: d.name,
      label: d.name,
    }));
  }, [item.province, provincesData]);

  // 2. Dealer Customer Options (Strictly DEALER)
  const dealerOptions = useMemo(() => {
    return customers
      .filter((c) => !c.customerType || c.customerType === "DEALER")
      .map((c) => ({
        value: c.id,
        label: c.name,
        subLabel: c.customerCode ? `รหัส: ${c.customerCode}` : undefined,
      }));
  }, [customers]);

  const handleDealerChange = (dealerId: string) => {
    const dealer = customers.find((c) => c.id === dealerId);
    updateType7Row(item.id, "storeId", dealerId);
    updateType7Row(item.id, "ownerName", dealer?.name || "");

    // Autofill province and district from dealer if currently empty
    if (dealer?.province && !item.province) {
      updateType7Row(item.id, "province", dealer.province);
      if (dealer.district && !item.district) {
        updateType7Row(item.id, "district", dealer.district);
      }
    }
  };

  // 3. Crop options
  const availableCropOptions = (CROPS_BY_CATEGORY[item.cropCategory] || []).map(
    (crop: string) => ({
      value: crop,
      label: crop,
    }),
  );

  const isRaiUnit = ["พืชไร่", "ผักและพืชล้มลุก"].includes(item.cropCategory);

  const isCustomCropName = [
    "ผักและพืชล้มลุกอื่นๆ",
    "พืชไร่อื่นๆ",
    "พืชสวนอื่นๆ",
  ].includes(item.cropName);

  // 4. Product Category Options (หมวดสินค้า)
  const categoryOptions = useMemo(() => {
    const list =
      productCategories && productCategories.length > 0
        ? productCategories
        : chemicalGroups;
    return (list || []).map((c: any) => ({
      value: c.id,
      label:
        c.code && c.description
          ? `${c.code} - ${c.description}`
          : c.description || c.name || c.code,
      subLabel: c.code ? `รหัส: ${c.code}` : undefined,
    }));
  }, [productCategories, chemicalGroups]);

  const selectedCategoryId = item.categoryId || item.chemicalGroupId || "";

  const handleCategoryChange = (newCatId: string) => {
    updateType7Row(item.id, "categoryId", newCatId);
    updateType7Row(item.id, "chemicalGroupId", newCatId);

    // Business Requirement: Auto-clear products not matching the selected category
    const currentProducts = item.demoProducts || [];
    const filtered = currentProducts.filter((p) => {
      const matched = products.find(
        (prod) => prod.id === p.productId || prod.name === p.productName,
      );
      return (
        matched &&
        (matched.categoryId === newCatId || matched.productGroupId === newCatId)
      );
    });

    updateType7Row(
      item.id,
      "demoProducts",
      filtered.length > 0
        ? filtered
        : [
            {
              id: Date.now().toString(),
              productId: "",
              productName: "",
              quantity: 1,
              unit: "",
            },
          ],
    );
  };

  // 5. Products filtered strictly by chosen Product Category
  const availableProductsForCategory = useMemo(() => {
    if (!selectedCategoryId) return [];
    return products.filter(
      (p) =>
        p.categoryId === selectedCategoryId ||
        p.productGroupId === selectedCategoryId,
    );
  }, [products, selectedCategoryId]);

  const productOptionsForCategory = useMemo(() => {
    return availableProductsForCategory.map((p) => ({
      value: p.id,
      label: p.name,
      subLabel: p.unit
        ? `หน่วย: ${p.unit}`
        : p.productCode
          ? `รหัส: ${p.productCode}`
          : undefined,
    }));
  }, [availableProductsForCategory]);

  // 6. Demo Products Management
  const demoProducts: Type7DemoProductLine[] = useMemo(() => {
    if (item.demoProducts && item.demoProducts.length > 0) {
      return item.demoProducts;
    }
    // Fallback if existing item had singular product
    if (item.productName || item.productId) {
      return [
        {
          id: "1",
          productId: item.productId || "",
          productName: item.productName || "",
          quantity:
            typeof item.plotsCount === "number" && item.plotsCount > 0
              ? item.plotsCount
              : 1,
          unit: item.productUnit || "",
        },
      ];
    }
    return [
      {
        id: "1",
        productId: "",
        productName: "",
        quantity: 1,
        unit: "",
      },
    ];
  }, [
    item.demoProducts,
    item.productName,
    item.productId,
    item.plotsCount,
    item.productUnit,
  ]);

  const addProductRow = () => {
    const newRow: Type7DemoProductLine = {
      id: Date.now().toString(),
      productId: "",
      productName: "",
      quantity: 1,
      unit: "",
    };
    updateType7Row(item.id, "demoProducts", [...demoProducts, newRow]);
  };

  const updateProductRow = (
    rowId: string,
    field: keyof Type7DemoProductLine,
    value: any,
  ) => {
    const updated = demoProducts.map((p) => {
      if (p.id !== rowId) return p;
      if (field === "productId") {
        const matched = products.find((prod) => prod.id === value);
        return {
          ...p,
          productId: value,
          productName: matched?.name || "",
          unit: matched?.unit || p.unit || "",
        };
      }
      return { ...p, [field]: value };
    });
    updateType7Row(item.id, "demoProducts", updated);
  };

  const deleteProductRow = (rowId: string) => {
    if (demoProducts.length <= 1) {
      updateType7Row(item.id, "demoProducts", [
        {
          id: Date.now().toString(),
          productId: "",
          productName: "",
          quantity: 1,
          unit: "",
        },
      ]);
      return;
    }
    const updated = demoProducts.filter((p) => p.id !== rowId);
    updateType7Row(item.id, "demoProducts", updated);
  };

  return (
    <div className="space-y-4 pt-1">
      {/* SECTION 1: ข้อมูลแปลงสาธิต */}
      <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-200/80 space-y-3">
        <h6 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <span>ข้อมูลแปลงสาธิต</span>
        </h6>

        {/* Row 1: ชื่อแปลง + ร้านค้า Dealer */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-6">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              ชื่อแปลง <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={item.plotName || ""}
              onChange={(e) =>
                updateType7Row(item.id, "plotName", e.target.value)
              }
              disabled={readonly}
              placeholder="เช่น แปลงสาธิตทุเรียนหมอนทอง แปลงที่ 1..."
              className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-medium"
            />
          </div>

          <div className="md:col-span-6">
            <FormCombobox
              id={`dealer-combobox-${item.id}`}
              label="ร้านค้า Dealer"
              labelClassName="block text-xs font-medium text-slate-700 mb-1 mx-0"
              triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500"
              value={item.storeId || ""}
              onChange={handleDealerChange}
              options={dealerOptions}
              placeholder="เลือกร้านค้า Dealer..."
              searchPlaceholder="ค้นหาร้านค้า Dealer..."
              emptyText="ไม่พบร้านค้า Dealer"
              disabled={readonly}
              required
            />
          </div>
        </div>

        {/* Row 2: จังหวัด + อำเภอ */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-6">
            <FormCombobox
              id={`province-combobox-${item.id}`}
              label="จังหวัด"
              labelClassName="block text-xs font-medium text-slate-700 mb-1 mx-0"
              triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500"
              value={item.province || ""}
              onChange={(val) => {
                updateType7Row(item.id, "province", val);
                updateType7Row(item.id, "district", "");
              }}
              options={provinceOptions}
              placeholder="เลือกจังหวัด..."
              searchPlaceholder="ค้นหาจังหวัด..."
              emptyText="ไม่พบจังหวัด"
              disabled={readonly}
              required
            />
          </div>

          <div className="md:col-span-6">
            <FormCombobox
              id={`district-combobox-${item.id}`}
              label="อำเภอ"
              labelClassName="block text-xs font-medium text-slate-700 mb-1 mx-0"
              triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500"
              value={item.district || ""}
              onChange={(val) => updateType7Row(item.id, "district", val)}
              options={districtOptions}
              placeholder={
                item.province ? "เลือกอำเภอ..." : "กรุณาเลือกจังหวัดก่อน"
              }
              searchPlaceholder="ค้นหาอำเภอ..."
              emptyText="ไม่พบอำเภอ"
              disabled={readonly || !item.province}
              required
            />
          </div>
        </div>

        {/* Row 3: หมวดพืช + ชื่อพืช + พื้นที่ */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className={isCustomCropName ? "md:col-span-3" : "md:col-span-5"}>
            <FormCombobox
              id={`crop-category-combobox-${item.id}`}
              label="หมวดพืช"
              labelClassName="block text-xs font-medium text-slate-700 mb-1 mx-0"
              triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500"
              value={item.cropCategory}
              onChange={(newCat) => {
                updateType7Row(item.id, "cropCategory", newCat);
                const nextCrops = CROPS_BY_CATEGORY[newCat] || [];
                if (
                  nextCrops.length > 0 &&
                  !nextCrops.includes(item.cropName)
                ) {
                  updateType7Row(item.id, "cropName", nextCrops[0]);
                }
              }}
              options={cropCategoryOptions}
              placeholder="เลือกหมวด..."
              searchPlaceholder="ค้นหาหมวดพืช..."
              emptyText="ไม่พบหมวดพืช"
              disabled={readonly}
              required
            />
          </div>

          <div className={isCustomCropName ? "md:col-span-4" : "md:col-span-5"}>
            <FormCombobox
              id={`crop-name-combobox-${item.id}`}
              label="ชื่อพืช"
              labelClassName="block text-xs font-medium text-slate-700 mb-1 mx-0"
              triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500"
              value={item.cropName}
              onChange={(val) => {
                updateType7Row(item.id, "cropName", val);
                if (
                  ![
                    "ผักและพืชล้มลุกอื่นๆ",
                    "พืชไร่อื่นๆ",
                    "พืชสวนอื่นๆ",
                  ].includes(val)
                ) {
                  updateType7Row(item.id, "customCropName", "");
                }
              }}
              options={availableCropOptions}
              placeholder="เลือกชื่อพืช..."
              searchPlaceholder="ค้นหาชื่อพืช..."
              emptyText="ไม่พบชื่อพืช"
              disabled={readonly || !item.cropCategory}
              required
            />
          </div>

          {isCustomCropName && (
            <div className="md:col-span-3">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                ระบุชื่อพืชเพิ่มเติม <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={item.customCropName || ""}
                onChange={(e) =>
                  updateType7Row(item.id, "customCropName", e.target.value)
                }
                disabled={readonly}
                placeholder="ระบุชื่อพืช..."
                className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-medium"
              />
            </div>
          )}

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              {!item.cropCategory ? (
                <>
                  จำนวน <span className="text-red-500">*</span>
                </>
              ) : isRaiUnit ? (
                <>
                  พื้นที่ (ไร่) <span className="text-red-500">*</span>
                </>
              ) : (
                <>
                  จำนวนต้น <span className="text-red-500">*</span>
                </>
              )}
            </label>
            <div className="relative flex items-center">
              <input
                type="number"
                min={1}
                value={
                  isRaiUnit ? (item.areaRai ?? "") : (item.treeCount ?? "")
                }
                onChange={(e) => {
                  const val = Math.max(0, parseInt(e.target.value) || 0);
                  if (isRaiUnit) {
                    updateType7Row(item.id, "areaRai", val);
                  } else {
                    updateType7Row(item.id, "treeCount", val);
                  }
                }}
                disabled={readonly || !item.cropCategory}
                placeholder="0"
                className="w-full h-9 pl-3 pr-8 rounded-lg border border-slate-200 text-xs text-slate-800 text-center focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium bg-white disabled:bg-slate-50"
              />
              <span className="absolute right-3 text-[11px] font-semibold text-slate-500 pointer-events-none">
                {!item.cropCategory ? "-" : isRaiUnit ? "ไร่" : "ต้น"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: หมวดสินค้าและวัตถุประสงค์ */}
      <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-200/80 space-y-3">
        <h6 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <span>ข้อมูลการทดลองและวัตถุประสงค์</span>
        </h6>

        {/* Product Category Combobox */}
        <div>
          <FormCombobox
            id={`category-combobox-${item.id}`}
            label="หมวดสินค้า"
            labelClassName="block text-xs font-medium text-slate-700 mb-1 mx-0"
            triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500"
            value={selectedCategoryId}
            onChange={handleCategoryChange}
            options={categoryOptions}
            placeholder="เลือกหมวดสินค้า..."
            searchPlaceholder="ค้นหาหมวดสินค้า..."
            emptyText="ไม่พบหมวดสินค้า"
            disabled={readonly}
            required
          />
          {selectedCategoryId && (
            <p className="mt-1 text-[11px] text-emerald-600 flex items-center gap-1">
              <Info className="h-3 w-3 inline" />
              สินค้าในตารางด้านล่างจะถูกกรองให้ตรงกับหมวดสินค้าที่เลือกเท่านั้น
            </p>
          )}
        </div>

        {/* Objective Textarea */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            วัตถุประสงค์การทำแปลง <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={2}
            value={item.objective || ""}
            onChange={(e) =>
              updateType7Row(item.id, "objective", e.target.value)
            }
            disabled={readonly}
            placeholder="ระบุวัตถุประสงค์การทำแปลง เช่น เพื่อทดสอบประสิทธิภาพการกำจัดวัชพืชใบแคบ..."
            className="w-full p-2.5 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          />
        </div>
      </div>

      {/* SECTION 3: ตารางสินค้าที่จะสาธิต (ActivityPlanProduct) */}
      <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-200/80 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h6 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <span>สินค้าที่จะสาธิต</span>
              <span className="text-red-500">*</span>
            </h6>
            <p className="text-[11px] text-slate-500">
              ระบุรายการสินค้าและจำนวนที่จะใช้สาธิต
              (ต้องตรงกับหมวดสินค้าที่เลือก)
            </p>
          </div>
          {!readonly && (
            <Button
              type="button"
              size="sm"
              onClick={addProductRow}
              disabled={!selectedCategoryId}
              className="h-7 px-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>เพิ่มสินค้า</span>
            </Button>
          )}
        </div>

        {!selectedCategoryId ? (
          <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-lg text-xs text-amber-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
            <span>
              กรุณาเลือกหมวดสินค้าในหัวข้อด้านบนก่อน เพื่อเลือกสินค้าที่จะสาธิต
            </span>
          </div>
        ) : (
          <div className="space-y-2">
            {demoProducts.map((pLine, idx) => (
              <div
                key={pLine.id}
                className="grid grid-cols-12 gap-2 p-2 bg-white rounded-lg border border-slate-200 items-center"
              >
                <div className="col-span-1 text-center font-bold text-xs text-slate-500">
                  {idx + 1}
                </div>

                <div className="col-span-6 sm:col-span-7">
                  <FormCombobox
                    id={`demo-prod-${item.id}-${pLine.id}`}
                    label=""
                    triggerClassName="h-8 min-h-[32px] py-0.5 text-xs bg-white border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-emerald-500"
                    value={pLine.productId || ""}
                    onChange={(val) =>
                      updateProductRow(pLine.id, "productId", val)
                    }
                    options={productOptionsForCategory}
                    placeholder="เลือกสินค้า..."
                    searchPlaceholder="ค้นหาสินค้าในหมวดหมู่นี้..."
                    emptyText="ไม่พบสินค้าในหมวดหมู่นี้"
                    disabled={readonly}
                  />
                </div>

                <div className="col-span-4 sm:col-span-3 flex items-center gap-1.5">
                  <input
                    type="number"
                    min={1}
                    value={pLine.quantity ?? ""}
                    onChange={(e) => {
                      const val = Math.max(1, parseInt(e.target.value) || 1);
                      updateProductRow(pLine.id, "quantity", val);
                    }}
                    disabled={readonly}
                    placeholder="จำนวน"
                    className="w-full h-8 px-2 rounded-lg border border-slate-200 text-xs text-slate-800 text-center focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                  {pLine.unit && (
                    <span className="text-[11px] text-slate-500 whitespace-nowrap">
                      {pLine.unit}
                    </span>
                  )}
                </div>

                <div className="col-span-1 text-right">
                  {!readonly && (
                    <button
                      type="button"
                      onClick={() => deleteProductRow(pLine.id)}
                      className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                      title="ลบแถวสินค้านี้"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
