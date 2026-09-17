"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Sprout,
  Calendar,
  Package,
  ImageIcon,
  MapPin,
  UserCheck,
  Plus,
  Trash2,
  FlaskConical,
  Droplets,
  Layers,
  Store,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormCombobox } from "@/components/custom/form-components";
import DatePicker from "@/components/custom/DatePicker";
import {
  ImageFile,
  DemoPlotProductItem,
  DemoPlotExternalProductItem,
} from "@/modules/activity-plans/features/actual-view/types";
import { ActualTargetCard } from "@/modules/activity-plans/features/actual-view/components/actual-target-card";
import {
  ALL_THAI_PROVINCES,
} from "@/lib/province-region-mapping";
import {
  CROP_CATEGORIES,
  CROPS_BY_CATEGORY,
  DEMO_PLOT_SPRAY_METHODS,
  EXTERNAL_CHEMICAL_FORMULAS,
  DEMO_PLOT_IRRIGATION_METHODS,
  UserDemoPlotOption,
} from "@/modules/activity-plans/constants";
import GalleryUpload from "@/components/custom/gallery-upload";
import type { FileWithPreview } from "@/hooks/use-file-upload";
import {
  convertToFileMetadata,
  filesWithPreviewToImageFiles,
  isImageFilesEqual,
} from "@/modules/activity-plans/features/actual-view/utils";

export interface TargetDemoItem {
  activityType?: "CREATE" | "FOLLOW_UP" | string;
  owner: string;
  product: string;
  crop: string;
  plots: string;
  demoProductQuantity?: string | number | null;
  objective?: string;
  experimentDetail?: string;
  detail?: string;
}

export interface CustomerOption {
  id: string;
  name: string;
  customerCode?: string | null;
  customerType?: string;
  province?: string | null;
  district?: string | null;
  phone?: string | null;
}

export interface ActualType7NewDemoProps {
  target: {
    activityType?: string;
    owner: string;
    product: string;
    productId?: string;
    plannedProductId?: string;
    crop: string;
    plots: string;
    targetCondition?: string;
    demoProductQuantity?: string | number | null;
    objective?: string;
    experimentDetail?: string;
    detail?: string;
    items?: TargetDemoItem[];
  };
  products?: Array<{
    id: string;
    name: string;
    productCode?: string | null;
    unit?: string | null;
    packageSizeUnit?: string | null;
  }>;
  customers?: CustomerOption[];

  // 1. Farmer Owner
  farmerProvince?: string;
  setFarmerProvince?: (v: string) => void;
  farmerCustomerId?: string | null;
  setFarmerCustomerId?: (v: string | null) => void;
  farmerName?: string;
  setFarmerName?: (v: string) => void;
  farmerPhone?: string;
  setFarmerPhone?: (v: string) => void;
  isUnregisteredFarmer?: boolean;
  setIsUnregisteredFarmer?: (v: boolean) => void;
  dealerName?: string;
  setDealerName?: (v: string) => void;

  // 2. Plot Location
  latitude?: string;
  setLatitude?: (v: string) => void;
  longitude?: string;
  setLongitude?: (v: string) => void;

  // 3. Demo Plot Initial Data
  plotName?: string;
  setPlotName?: (v: string) => void;
  t7PlotName?: string;
  setT7PlotName?: (v: string) => void;
  district?: string;
  setDistrict?: (v: string) => void;
  cropCategory?: string;
  setCropCategory?: (v: string) => void;
  cropName?: string;
  setCropName?: (v: string) => void;
  customCropName?: string;
  setCustomCropName?: (v: string) => void;
  areaRai?: string;
  setAreaRai?: (v: string) => void;
  treeCount?: string;
  setTreeCount?: (v: string) => void;
  plotObjective?: string;
  setPlotObjective?: (v: string) => void;
  experimentDetail?: string;
  setExperimentDetail?: (v: string) => void;
  mainCropInfo?: string;
  setMainCropInfo?: (v: string) => void;
  irrigations?: string[];
  setIrrigations?: (v: string[]) => void;

  // 4. Planting / Spray Date
  plantingDate?: string;
  setPlantingDate?: (v: string) => void;
  initialSprayDate?: string;
  setInitialSprayDate?: (v: string) => void;
  nextSprayDate?: string;
  setNextSprayDate?: (v: string) => void;

  // 5. Demo Products (Multiple products)
  demoProducts?: DemoPlotProductItem[];
  setDemoProducts?: (items: DemoPlotProductItem[]) => void;

  // 6. Spray Method & External Chemicals
  sprayMethod?: "SINGLE" | "TANK_MIXED";
  setSprayMethod?: (v: "SINGLE" | "TANK_MIXED") => void;
  hasExternalChemicals?: boolean;
  setHasExternalChemicals?: (v: boolean) => void;
  externalProducts?: DemoPlotExternalProductItem[];
  setExternalProducts?: (items: DemoPlotExternalProductItem[]) => void;

  // 7. Initial Condition / Visit #1 Info
  cropAgeValue?: string;
  setCropAgeValue?: (v: string) => void;
  cropAgeUnit?: string;
  setCropAgeUnit?: (v: string) => void;
  growthStage?: string;
  setGrowthStage?: (v: string) => void;
  usageMethod?: string;
  setUsageMethod?: (v: string) => void;

  // 8. Initial Photos (Max 10)
  initialPhotos?: ImageFile[];
  setInitialPhotos?: (imgs: ImageFile[]) => void;

  // Backward compatibility props
  plannedProductId?: string | null;
  actualProductId?: string | null;
  setActualProductId?: (id: string | null) => void;
  actualQuantity?: string | number;
  setActualQuantity?: (qty: string) => void;
  changeReason?: string;
  setChangeReason?: (reason: string) => void;
  customPlotDetail?: string;
  setCustomPlotDetail?: (v: string) => void;
  plantingAreaCondition?: string;
  setPlantingAreaCondition?: (v: string) => void;
  nextFollowUpDate?: string;
  setNextFollowUpDate?: (v: string) => void;
  cropImages?: ImageFile[];
  setCropImages?: (imgs: ImageFile[]) => void;
  plotImages?: ImageFile[];
  setPlotImages?: (imgs: ImageFile[]) => void;
  demoPlots?: UserDemoPlotOption[];
  demoPlotId?: string | null;
  setDemoPlotId?: (id: string | null) => void;
}

export function ActualType7NewDemo({
  target,
  products = [],
  customers = [],

  // 1. Farmer Owner
  farmerProvince = "",
  setFarmerProvince,
  farmerCustomerId = null,
  setFarmerCustomerId,
  farmerName = "",
  setFarmerName,
  farmerPhone = "",
  setFarmerPhone,
  isUnregisteredFarmer = false,
  setIsUnregisteredFarmer,
  dealerName = "",
  setDealerName,

  // 2. Plot Location
  latitude = "",
  setLatitude,
  longitude = "",
  setLongitude,

  // 3. Demo Plot Initial Data
  plotName: propPlotName = "",
  t7PlotName = "",
  setPlotName,
  setT7PlotName,
  district = "",
  setDistrict,
  cropCategory = "",
  setCropCategory,
  cropName = "",
  setCropName,
  customCropName = "",
  setCustomCropName,
  areaRai = "",
  setAreaRai,
  treeCount = "",
  setTreeCount,
  plotObjective = "",
  setPlotObjective,
  experimentDetail = "",
  setExperimentDetail,
  mainCropInfo = "",
  setMainCropInfo,
  irrigations = [],
  setIrrigations,

  // 4. Planting / Spray Date
  plantingDate = "",
  setPlantingDate,
  initialSprayDate = "",
  setInitialSprayDate,
  nextSprayDate = "",
  setNextSprayDate,

  // 5. Demo Products
  demoProducts = [],
  setDemoProducts,

  // 6. Spray Method & External Chemicals
  sprayMethod = "SINGLE",
  setSprayMethod,
  hasExternalChemicals = false,
  setHasExternalChemicals,
  externalProducts = [],
  setExternalProducts,

  // 7. Initial Condition / Visit #1 Info
  cropAgeValue = "",
  setCropAgeValue,
  cropAgeUnit = "วัน",
  setCropAgeUnit,
  growthStage = "",
  setGrowthStage,
  usageMethod = "",
  setUsageMethod,

  // 8. Initial Photos
  initialPhotos = [],
  setInitialPhotos,

  // Backward compatibility fallbacks
  customPlotDetail,
  setCustomPlotDetail,
  plantingAreaCondition,
  setPlantingAreaCondition,
  nextFollowUpDate,
  setNextFollowUpDate,
  plotImages = [],
  setPlotImages,
}: ActualType7NewDemoProps) {
  const plotName = propPlotName || t7PlotName;
  const handlePlotNameChange = (val: string) => {
    setPlotName?.(val);
    setT7PlotName?.(val);
  };

  // Server-fetched farmers for the selected province (customerType === "FARMER")
  const [farmersFromApi, setFarmersFromApi] = useState<CustomerOption[]>([]);
  const [loadingFarmers, setLoadingFarmers] = useState(false);

  // Fetch farmers by province
  useEffect(() => {
    if (!farmerProvince) {
      setFarmersFromApi([]);
      return;
    }
    let isMounted = true;
    setLoadingFarmers(true);
    import("@/modules/activity-plans/server/actions")
      .then(({ getFarmerCustomerOptionsAction }) =>
        getFarmerCustomerOptionsAction(farmerProvince),
      )
      .then((res) => {
        if (isMounted && res && res.success && res.farmers) {
          setFarmersFromApi(res.farmers as CustomerOption[]);
        }
      })
      .catch((err) => {
        console.error("Failed to load farmers for TYPE_7A:", err);
      })
      .finally(() => {
        if (isMounted) setLoadingFarmers(false);
      });

    return () => {
      isMounted = false;
    };
  }, [farmerProvince]);

  // Province dropdown options
  const provinceOptions = useMemo(
    () => ALL_THAI_PROVINCES.map((p) => ({ value: p, label: p })),
    [],
  );

  // Combine farmers from API and customers prop (customerType === "FARMER")
  const allFarmers = useMemo(() => {
    const map = new Map<string, CustomerOption>();
    farmersFromApi.forEach((f) => map.set(f.id, f));
    (customers || []).forEach((c) => {
      if (c.customerType === "FARMER" && !map.has(c.id)) {
        map.set(c.id, c);
      }
    });
    return Array.from(map.values());
  }, [farmersFromApi, customers]);

  // Farmer options filtered by selected province
  const provinceFarmerOptions = useMemo(() => {
    if (!farmerProvince) return [];
    const filtered = allFarmers.filter(
      (f) => f.province?.trim() === farmerProvince.trim(),
    );
    const opts = filtered.map((f) => ({
      value: f.id,
      label: `${f.name}${f.customerCode ? ` (${f.customerCode})` : ""}`,
      customerName: f.name,
      phone: f.phone || "",
      district: f.district || "",
    }));

    // Preserve selected farmer if already set
    if (farmerCustomerId && !opts.some((o) => o.value === farmerCustomerId)) {
      const matched = allFarmers.find((f) => f.id === farmerCustomerId);
      if (matched) {
        opts.push({
          value: matched.id,
          label: `${matched.name}${matched.customerCode ? ` (${matched.customerCode})` : ""}`,
          customerName: matched.name,
          phone: matched.phone || "",
          district: matched.district || "",
        });
      }
    }
    return opts;
  }, [allFarmers, farmerProvince, farmerCustomerId]);

  // Handle Province Change: reset farmer selection
  const handleProvinceChange = (newProvince: string) => {
    setFarmerProvince?.(newProvince);
    setFarmerCustomerId?.(null);
    if (!isUnregisteredFarmer) {
      setFarmerName?.("");
      setFarmerPhone?.("");
    }
  };

  // Handle Unregistered Toggle
  const handleToggleUnregistered = (checked: boolean) => {
    setIsUnregisteredFarmer?.(checked);
    if (checked) {
      setFarmerCustomerId?.(null);
      setFarmerName?.("");
      setFarmerPhone?.("");
    } else {
      setFarmerName?.("");
      setFarmerPhone?.("");
    }
  };

  // Product Master options for Combobox
  const productOptions = useMemo(
    () =>
      (products || []).map((p) => ({
        value: p.id,
        label: p.productCode ? `${p.name} (${p.productCode})` : p.name,
        unit: p.unit || p.packageSizeUnit || "",
      })),
    [products],
  );

  // Irrigation toggle handler
  const handleToggleIrrigation = (method: string) => {
    if (!setIrrigations) return;
    const current = new Set(irrigations);
    if (current.has(method)) {
      current.delete(method);
    } else {
      current.add(method);
    }
    setIrrigations(Array.from(current));
  };

  // Demo Products handlers
  const handleAddProduct = () => {
    if (!setDemoProducts) return;
    const firstProd = products[0];
    const newItems: DemoPlotProductItem[] = [
      ...demoProducts,
      {
        productId: firstProd?.id || "",
        productName: firstProd?.name || "",
        quantity: 1,
        unit: firstProd?.unit || firstProd?.packageSizeUnit || "",
        applicationRate: "",
      },
    ];
    setDemoProducts(newItems);
  };

  const handleUpdateProduct = (
    index: number,
    field: keyof DemoPlotProductItem,
    val: any,
  ) => {
    if (!setDemoProducts) return;
    const updated = [...demoProducts];
    const current = { ...updated[index] };
    if (field === "productId") {
      const matched = products.find((p) => p.id === val);
      current.productId = val;
      current.productName = matched?.name || "";
      current.unit = matched?.unit || matched?.packageSizeUnit || "";
    } else {
      (current as any)[field] = val;
    }
    updated[index] = current;
    setDemoProducts(updated);
  };

  const handleRemoveProduct = (index: number) => {
    if (!setDemoProducts) return;
    const updated = demoProducts.filter((_, i) => i !== index);
    setDemoProducts(updated);
  };

  // External Chemicals handlers
  const handleAddExternalProduct = () => {
    if (!setExternalProducts || externalProducts.length >= 4) return;
    const newItems: DemoPlotExternalProductItem[] = [
      ...externalProducts,
      {
        company: "",
        productName: "",
        activeIngredient: "",
        formula: "SL",
        customFormula: "",
        applicationRate: "",
      },
    ];
    setExternalProducts(newItems);
  };

  const handleUpdateExternalProduct = (
    index: number,
    field: keyof DemoPlotExternalProductItem,
    val: any,
  ) => {
    if (!setExternalProducts) return;
    const updated = [...externalProducts];
    updated[index] = { ...updated[index], [field]: val };
    setExternalProducts(updated);
  };

  const handleRemoveExternalProduct = (index: number) => {
    if (!setExternalProducts) return;
    const updated = externalProducts.filter((_, i) => i !== index);
    setExternalProducts(updated);
  };

  // Photos handler (Max 10)
  const effectivePhotos = initialPhotos.length > 0 ? initialPhotos : plotImages;
  const handlePhotosChange = (files: FileWithPreview[]) => {
    const newImageFiles = filesWithPreviewToImageFiles(files);
    if (setInitialPhotos && !isImageFilesEqual(initialPhotos, newImageFiles)) {
      setInitialPhotos(newImageFiles);
    }
    if (setPlotImages && !isImageFilesEqual(plotImages, newImageFiles)) {
      setPlotImages(newImageFiles);
    }
  };

  // Crop list by selected category
  const availableCrops = useMemo(() => {
    if (!cropCategory) return [];
    return CROPS_BY_CATEGORY[cropCategory] || [];
  }, [cropCategory]);

  return (
    <div className="border border-emerald-200/80 rounded-2xl p-4 sm:p-5 md:p-6 bg-white space-y-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-emerald-100 pb-3 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shadow-2xs">
            <Sprout className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-emerald-950">
              ทำแปลงสาธิต (เริ่มทำแปลงใหม่)
            </h2>
            <p className="text-xs text-slate-500">
              บันทึกข้อมูลตั้งต้นของแปลงสาธิต (Initial Data) เพื่อใช้อ้างอิงตลอดอายุแปลง
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="bg-emerald-50 text-emerald-800 border-emerald-300 font-bold px-3 py-1"
        >
          DEMO PLOT SETUP (TYPE 7A)
        </Badge>
      </div>

      {/* SECTION 1: PLANNED TARGET CARD */}
      <ActualTargetCard
        iconColorClass="text-emerald-700"
        badgeColorClass="bg-emerald-50 text-emerald-800 border border-emerald-200"
        gridColsClass="grid-cols-1 sm:grid-cols-2 md:grid-cols-4"
        items={[
          { label: "ประเภทงาน:", value: "ทำแปลงสาธิต (เริ่มทำแปลงใหม่)" },
          { label: "เกษตรกร / เจ้าของแปลง:", value: target.owner || "-" },
          { label: "พืชที่ทดสอบ:", value: target.crop || "-" },
          { label: "สินค้าที่วางแผน:", value: target.product || "-" },
          { label: "จำนวนแปลง / พื้นที่:", value: target.plots || "-" },
          ...(target.demoProductQuantity
            ? [
                {
                  label: "จำนวนสินค้าที่ใช้ตามแผน:",
                  value: `${target.demoProductQuantity}`,
                },
              ]
            : []),
          ...(target.experimentDetail || target.detail
            ? [
                {
                  label: "รายละเอียดการทดลองตามแผน:",
                  value: target.experimentDetail || target.detail,
                },
              ]
            : []),
        ]}
      />

      {/* SECTION 2: FARMER OWNER (ตาม Rule 1) */}
      <div className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-700" />
            <h3 className="text-sm font-bold text-slate-900">
              1. เกษตรกรเจ้าของแปลง <span className="text-rose-500">*</span>
            </h3>
          </div>
          <span className="text-[11px] text-slate-500">
            บังคับระบุจังหวัดก่อนเลือกเกษตรกร
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* จังหวัด REQUIRED และเลือกก่อน */}
          <div>
            <FormCombobox
              id="farmer-province-combobox"
              label="จังหวัดของเกษตรกรเจ้าของแปลง"
              labelClassName="block text-xs font-bold text-slate-700 mb-1"
              triggerClassName="h-10 text-xs sm:text-sm bg-white border-slate-200 rounded-xl text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500"
              value={farmerProvince}
              onChange={handleProvinceChange}
              options={provinceOptions}
              placeholder="เลือกจังหวัด..."
              searchPlaceholder="ค้นหาจังหวัด..."
              emptyText="ไม่พบจังหวัด"
              required
            />
          </div>

          {/* เกษตรกรในระบบ */}
          {!isUnregisteredFarmer ? (
            <div>
              <FormCombobox
                id="farmer-master-combobox"
                label="เกษตรกร (Customer Master: FARMER)"
                labelClassName="block text-xs font-bold text-slate-700 mb-1"
                triggerClassName="h-10 text-xs sm:text-sm bg-white border-slate-200 rounded-xl text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100 disabled:text-slate-400"
                value={farmerCustomerId || ""}
                onChange={(val) => {
                  setFarmerCustomerId?.(val || null);
                  const matched = provinceFarmerOptions.find(
                    (o) => o.value === val,
                  );
                  if (matched) {
                    setFarmerName?.(matched.customerName);
                    if (matched.phone) setFarmerPhone?.(matched.phone);
                    if (matched.district && setDistrict && !district) {
                      setDistrict(matched.district);
                    }
                  } else {
                    setFarmerName?.("");
                    setFarmerPhone?.("");
                  }
                }}
                options={provinceFarmerOptions}
                placeholder={
                  !farmerProvince
                    ? "กรุณาเลือกจังหวัดก่อน"
                    : loadingFarmers
                      ? "กำลังโหลดรายชื่อเกษตรกร..."
                      : "เลือกเกษตรกร..."
                }
                searchPlaceholder="ค้นหาชื่อ หรือรหัสเกษตรกร..."
                emptyText={
                  !farmerProvince
                    ? "กรุณาเลือกจังหวัดก่อน"
                    : "ไม่พบเกษตรกรในจังหวัดนี้"
                }
                disabled={!farmerProvince || loadingFarmers}
                required
              />
            </div>
          ) : (
            <div className="hidden md:block" />
          )}

          {/* Toggle: ไม่มีในระบบ */}
          <div className="md:col-span-2 flex items-center gap-2 pt-0.5">
            <input
              type="checkbox"
              id="unregistered-farmer-toggle-t7a"
              checked={Boolean(isUnregisteredFarmer)}
              onChange={(e) => handleToggleUnregistered(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
            />
            <label
              htmlFor="unregistered-farmer-toggle-t7a"
              className="text-xs font-medium text-slate-700 cursor-pointer select-none"
            >
              ไม่มีในระบบ{" "}
              <span className="text-[11px] text-slate-500">
                (กรอกชื่อและเบอร์โทรศัพท์โดยไม่ผูกกับ Customer Master)
              </span>
            </label>
          </div>

          {/* Form fields for Unregistered Farmer */}
          {isUnregisteredFarmer && (
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3 p-3.5 bg-amber-50/60 border border-amber-200/90 rounded-xl">
              <div>
                <label className="block text-xs font-bold text-amber-950 mb-1">
                  ชื่อ - สกุล เกษตรกร <span className="text-rose-500">*</span>
                </label>
                <Input
                  value={farmerName}
                  onChange={(e) => setFarmerName?.(e.target.value)}
                  placeholder="ระบุชื่อ - สกุล เกษตรกร..."
                  className="h-10 text-xs sm:text-sm bg-white border-amber-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-amber-950 mb-1">
                  เบอร์โทรศัพท์ <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="tel"
                  value={farmerPhone}
                  onChange={(e) => setFarmerPhone?.(e.target.value)}
                  placeholder="เช่น 081-xxx-xxxx"
                  className="h-10 text-xs sm:text-sm bg-white border-amber-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>
          )}

          {/* Dealer/Store Owner ตาม requirement เดิมของ TYPE7A */}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-emerald-600" />
              ร้านค้าตัวแทนจำหน่ายที่ดูแลแปลง (Dealer / Store)
            </label>
            <Input
              value={dealerName}
              onChange={(e) => setDealerName?.(e.target.value)}
              placeholder="ระบุชื่อร้านค้าตัวแทนจำหน่าย (ถ้ามี)..."
              className="h-10 text-xs sm:text-sm bg-white border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* SECTION 3: PLOT LOCATION (ตาม Rule 2: Latitude & Longitude REQUIRED numeric) */}
      <div className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xs">
        <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2.5">
          <MapPin className="w-4 h-4 text-emerald-700" />
          <h3 className="text-sm font-bold text-slate-900">
            2. พิกัดแปลงสาธิต (Plot Coordinates) <span className="text-rose-500">*</span>
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              ละติจูด (Latitude) <span className="text-rose-500">*</span>
            </label>
            <Input
              type="number"
              step="any"
              value={latitude}
              onChange={(e) => setLatitude?.(e.target.value)}
              placeholder="เช่น 13.7563309"
              className="h-10 text-xs sm:text-sm bg-white border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              required
            />
            <span className="text-[10px] text-slate-400">
              เก็บค่าเป็นตัวเลขทศนิยม (Decimal)
            </span>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              ลองจิจูด (Longitude) <span className="text-rose-500">*</span>
            </label>
            <Input
              type="number"
              step="any"
              value={longitude}
              onChange={(e) => setLongitude?.(e.target.value)}
              placeholder="เช่น 100.5017651"
              className="h-10 text-xs sm:text-sm bg-white border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              required
            />
            <span className="text-[10px] text-slate-400">
              เก็บค่าเป็นตัวเลขทศนิยม (Decimal)
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 4: DEMO PLOT INITIAL DATA (ตาม Rule 3 & Rule 7) */}
      <div className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xs">
        <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2.5">
          <Layers className="w-4 h-4 text-emerald-700" />
          <h3 className="text-sm font-bold text-slate-900">
            3. ข้อมูลตั้งต้นของแปลงสาธิต (Demo Plot Details)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* ชื่อแปลงสาธิต */}
          <div className="md:col-span-2 space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              ชื่อแปลงสาธิต <span className="text-rose-500">*</span>
            </label>
            <Input
              value={plotName}
              onChange={(e) => handlePlotNameChange(e.target.value)}
              placeholder="เช่น แปลงสาธิตทุเรียนหมอนทอง นายสมชาย..."
              className="h-10 text-xs sm:text-sm bg-white border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          {/* อำเภอ */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              อำเภอ / เขต
            </label>
            <Input
              value={district}
              onChange={(e) => setDistrict?.(e.target.value)}
              placeholder="เช่น ท่าใหม่, เมือง..."
              className="h-10 text-xs sm:text-sm bg-white border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* หมวดหมู่พืช */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              หมวดหมู่พืช <span className="text-rose-500">*</span>
            </label>
            <Select
              value={cropCategory}
              onValueChange={(val) => {
                setCropCategory?.(val);
                setCropName?.("");
              }}
            >
              <SelectTrigger className="h-10 text-xs sm:text-sm bg-white border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500">
                <SelectValue placeholder="เลือกหมวดหมู่พืช..." />
              </SelectTrigger>
              <SelectContent>
                {CROP_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ชื่อพืชที่ทดสอบ */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              พืชที่ทดสอบ <span className="text-rose-500">*</span>
            </label>
            {cropCategory && availableCrops.length > 0 ? (
              <Select
                value={cropName}
                onValueChange={(val) => setCropName?.(val)}
              >
                <SelectTrigger className="h-10 text-xs sm:text-sm bg-white border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500">
                  <SelectValue placeholder="เลือกพืชที่ทดสอบ..." />
                </SelectTrigger>
                <SelectContent>
                  {availableCrops.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                  <SelectItem value="อื่นๆ">อื่นๆ (ระบุเอง)</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={cropName}
                onChange={(e) => setCropName?.(e.target.value)}
                placeholder="ระบุชื่อพืช เช่น ทุเรียน, ข้าว..."
                className="h-10 text-xs sm:text-sm bg-white border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                required
              />
            )}
          </div>

          {/* พืชอื่นๆ ถ้าเลือก อื่นๆ */}
          {cropName === "อื่นๆ" && (
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                ระบุชื่อพืชเพิ่มเติม <span className="text-rose-500">*</span>
              </label>
              <Input
                value={customCropName}
                onChange={(e) => setCustomCropName?.(e.target.value)}
                placeholder="พิมพ์ชื่อพืชที่ทดสอบ..."
                className="h-10 text-xs sm:text-sm bg-white border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}

          {/* ขนาดพื้นที่ (ไร่) */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              ขนาดพื้นที่ (ไร่)
            </label>
            <Input
              type="number"
              step="any"
              min={0}
              value={areaRai}
              onChange={(e) => setAreaRai?.(e.target.value)}
              placeholder="เช่น 5 หรือ 2.5"
              className="h-10 text-xs sm:text-sm bg-white border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* จำนวนต้น */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              จำนวนต้น
            </label>
            <Input
              type="number"
              step="any"
              min={0}
              value={treeCount}
              onChange={(e) => setTreeCount?.(e.target.value)}
              placeholder="เช่น 100"
              className="h-10 text-xs sm:text-sm bg-white border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* ข้อมูลพืชประธาน (Rule 8: ข้อมูลพืชประธาน) */}
          <div className="md:col-span-2 space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              ข้อมูลพืชประธาน
            </label>
            <Input
              value={mainCropInfo || plantingAreaCondition}
              onChange={(e) => {
                setMainCropInfo?.(e.target.value);
                setPlantingAreaCondition?.(e.target.value);
              }}
              placeholder="เช่น ทุเรียนพันธุ์หมอนทอง อายุ 7 ปี ปลูกร่วมกับมังคุด..."
              className="h-10 text-xs sm:text-sm bg-white border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* วัตถุประสงค์แปลง */}
          <div className="md:col-span-2 space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              วัตถุประสงค์ของแปลงสาธิต
            </label>
            <Textarea
              rows={2}
              value={plotObjective}
              onChange={(e) => setPlotObjective?.(e.target.value)}
              placeholder="ระบุวัตถุประสงค์ของการทำแปลงสาธิต เช่น ทดสอบการแตกยอด ลดอาการใบไหม้..."
              className="text-xs sm:text-sm bg-white border-slate-200 rounded-xl"
            />
          </div>

          {/* วิธีการทดลอง */}
          <div className="md:col-span-2 space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              วิธีการทดลอง / แผนการทดสอบ
            </label>
            <Textarea
              rows={2}
              value={experimentDetail || customPlotDetail}
              onChange={(e) => {
                setExperimentDetail?.(e.target.value);
                setCustomPlotDetail?.(e.target.value);
              }}
              placeholder="ระบุวิธีการทดลอง การแบ่งแปลงเปรียบเทียบ..."
              className="text-xs sm:text-sm bg-white border-slate-200 rounded-xl"
            />
          </div>

          {/* ระบบน้ำ (Rule 7: Normalized Multi-select Checkboxes) */}
          <div className="md:col-span-2 space-y-2 pt-1 border-t border-slate-200/80">
            <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5 text-blue-600" />
              ระบบน้ำ (เลือกได้มากกว่า 1 ข้อ)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 pt-1">
              {DEMO_PLOT_IRRIGATION_METHODS.map((method) => {
                const isChecked = (irrigations || []).includes(method);
                return (
                  <label
                    key={method}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${
                      isChecked
                        ? "bg-emerald-50/80 border-emerald-300 text-emerald-950 font-bold"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleIrrigation(method)}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span>{method}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 5: DEMO PRODUCTS (ตาม Rule 5: Multiple products with applicationRate SSoT) */}
      <div className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between border-b border-slate-200/80 pb-2.5 gap-2">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-emerald-700" />
            <h3 className="text-sm font-bold text-slate-900">
              4. สินค้าสาธิตที่ใช้จริง (Demonstration Products){" "}
              <span className="text-rose-500">*</span>
            </h3>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={handleAddProduct}
            className="h-8 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            เพิ่มสินค้าสาธิต
          </Button>
        </div>

        {demoProducts.length === 0 ? (
          <div className="p-6 text-center bg-white rounded-xl border border-dashed border-slate-300 space-y-2">
            <Package className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs text-slate-500">
              ยังไม่มีรายการสินค้าสาธิต กรุณากดปุ่มเพิ่มสินค้า
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddProduct}
              className="text-xs rounded-xl border-emerald-300 text-emerald-800 bg-emerald-50"
            >
              + เพิ่มสินค้าสาธิตรายการแรก
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {demoProducts.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-3 shadow-2xs"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    สินค้าสาธิต #{idx + 1}
                  </span>
                  {demoProducts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveProduct(idx)}
                      className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      ลบ
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  {/* สินค้า */}
                  <div className="sm:col-span-6">
                    <FormCombobox
                      id={`demo-product-combobox-${idx}`}
                      label="สินค้าจากระบบ *"
                      labelClassName="block text-xs font-bold text-slate-700 mb-1"
                      triggerClassName="h-10 text-xs sm:text-sm bg-white border-slate-200 rounded-xl text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500"
                      value={item.productId}
                      onChange={(val) =>
                        handleUpdateProduct(idx, "productId", val)
                      }
                      options={productOptions}
                      placeholder="เลือกสินค้าสาธิต..."
                      searchPlaceholder="พิมพ์ชื่อสินค้าหรือรหัส..."
                      emptyText="ไม่พบสินค้า"
                      required
                    />
                  </div>

                  {/* จำนวน */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      จำนวน {item.unit ? `(${item.unit})` : ""} *
                    </label>
                    <Input
                      type="number"
                      min={0.01}
                      step="any"
                      value={item.quantity || ""}
                      onChange={(e) =>
                        handleUpdateProduct(idx, "quantity", e.target.value)
                      }
                      placeholder="เช่น 1"
                      className="h-10 text-xs sm:text-sm bg-white border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>

                  {/* อัตราการใช้ (Single Source of Truth) */}
                  <div className="sm:col-span-4">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      อัตราการใช้ (Application Rate) *
                    </label>
                    <Input
                      value={item.applicationRate || ""}
                      onChange={(e) =>
                        handleUpdateProduct(
                          idx,
                          "applicationRate",
                          e.target.value,
                        )
                      }
                      placeholder="เช่น 20 ซีซี / น้ำ 20 ลิตร"
                      className="h-10 text-xs sm:text-sm bg-white border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 6: SPRAY METHOD & EXTERNAL CHEMICALS (ตาม Rule 6) */}
      <div className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xs">
        <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2.5">
          <FlaskConical className="w-4 h-4 text-emerald-700" />
          <h3 className="text-sm font-bold text-slate-900">
            5. วิธีการฉีดพ่นและสารเคมีภายนอก (Spray Method & Chemicals)
          </h3>
        </div>

        {/* วิธีการฉีดพ่น SINGLE vs TANK_MIXED */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700">
            วิธีการฉีดพ่น <span className="text-rose-500">*</span>
          </label>
          <div className="flex flex-wrap gap-4 items-center">
            {DEMO_PLOT_SPRAY_METHODS.map((m) => (
              <label
                key={m.value}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold cursor-pointer select-none transition-colors ${
                  sprayMethod === m.value
                    ? "bg-emerald-50 border-emerald-400 text-emerald-950 font-bold shadow-2xs"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="spray-method-radio"
                  value={m.value}
                  checked={sprayMethod === m.value}
                  onChange={() => {
                    setSprayMethod?.(m.value);
                    if (m.value === "SINGLE") {
                      setHasExternalChemicals?.(false);
                      setExternalProducts?.([]);
                    }
                  }}
                  className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer"
                />
                <span>{m.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* ถ้าเลือก TANK_MIXED: แสดง Checkbox "มียาภายนอก" */}
        {sprayMethod === "TANK_MIXED" && (
          <div className="pt-2 border-t border-slate-200/80 space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="has-external-chemicals-toggle"
                checked={Boolean(hasExternalChemicals)}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setHasExternalChemicals?.(checked);
                  if (checked && externalProducts.length === 0) {
                    handleAddExternalProduct();
                  }
                }}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
              />
              <label
                htmlFor="has-external-chemicals-toggle"
                className="text-xs font-bold text-slate-800 cursor-pointer select-none"
              >
                มียาภายนอก (External Chemicals)
              </label>
            </div>

            {hasExternalChemicals && (
              <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-950">
                    รายการสารเคมีภายนอก (สูงสุด 4 รายการ)
                  </span>
                  {externalProducts.length < 4 && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddExternalProduct}
                      className="h-7 text-xs bg-amber-700 hover:bg-amber-800 text-white rounded-lg shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      เพิ่มสารเคมี ({externalProducts.length}/4)
                    </Button>
                  )}
                </div>

                {externalProducts.length === 0 ? (
                  <p className="text-xs text-amber-800">
                    กรุณากดปุ่มเพิ่มรายการสารเคมีภายนอก
                  </p>
                ) : (
                  <div className="space-y-3">
                    {externalProducts.map((ep, eIdx) => (
                      <div
                        key={eIdx}
                        className="p-3 bg-white border border-amber-200 rounded-xl space-y-2.5 shadow-2xs"
                      >
                        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                          <span className="text-xs font-bold text-slate-800">
                            สารเคมีภายนอก #{eIdx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveExternalProduct(eIdx)}
                            className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                            ลบ
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                              บริษัท (Company) *
                            </label>
                            <Input
                              value={ep.company}
                              onChange={(e) =>
                                handleUpdateExternalProduct(
                                  eIdx,
                                  "company",
                                  e.target.value,
                                )
                              }
                              placeholder="เช่น บริษัท ไบเออร์..."
                              className="h-9 text-xs bg-white border-slate-200 rounded-lg"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                              ชื่อสินค้า / สารเคมี *
                            </label>
                            <Input
                              value={ep.productName}
                              onChange={(e) =>
                                handleUpdateExternalProduct(
                                  eIdx,
                                  "productName",
                                  e.target.value,
                                )
                              }
                              placeholder="เช่น คอนฟิดอร์..."
                              className="h-9 text-xs bg-white border-slate-200 rounded-lg"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                              สารสำคัญ (Active Ingredient)
                            </label>
                            <Input
                              value={ep.activeIngredient || ""}
                              onChange={(e) =>
                                handleUpdateExternalProduct(
                                  eIdx,
                                  "activeIngredient",
                                  e.target.value,
                                )
                              }
                              placeholder="เช่น อิมิดาโคลพริด..."
                              className="h-9 text-xs bg-white border-slate-200 rounded-lg"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                              สูตรยา (Formula) *
                            </label>
                            <Select
                              value={ep.formula}
                              onValueChange={(val) =>
                                handleUpdateExternalProduct(
                                  eIdx,
                                  "formula",
                                  val,
                                )
                              }
                            >
                              <SelectTrigger className="h-9 text-xs bg-white border-slate-200 rounded-lg">
                                <SelectValue placeholder="เลือกสูตรยา..." />
                              </SelectTrigger>
                              <SelectContent>
                                {EXTERNAL_CHEMICAL_FORMULAS.map((f) => (
                                  <SelectItem key={f} value={f}>
                                    {f}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {ep.formula === "อื่นๆ" && (
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                                ระบุสูตรยา *
                              </label>
                              <Input
                                value={ep.customFormula || ""}
                                onChange={(e) =>
                                  handleUpdateExternalProduct(
                                    eIdx,
                                    "customFormula",
                                    e.target.value,
                                  )
                                }
                                placeholder="ระบุสูตรยา..."
                                className="h-9 text-xs bg-white border-slate-200 rounded-lg"
                                required
                              />
                            </div>
                          )}

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                              อัตราการใช้ *
                            </label>
                            <Input
                              value={ep.applicationRate}
                              onChange={(e) =>
                                handleUpdateExternalProduct(
                                  eIdx,
                                  "applicationRate",
                                  e.target.value,
                                )
                              }
                              placeholder="เช่น 10 ซีซี / น้ำ 20 ลิตร"
                              className="h-9 text-xs bg-white border-slate-200 rounded-lg"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECTION 7: INITIAL CONDITION & SPRAY DATES (ตาม Rule 4, 8, 9) */}
      <div className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xs">
        <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2.5">
          <Calendar className="w-4 h-4 text-emerald-700" />
          <h3 className="text-sm font-bold text-slate-900">
            6. ข้อมูลสภาพแปลงเริ่มต้น (Initial Plot Condition & Spraying)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* วันที่ฉีดพ่น (Rule 8: วันที่ฉีดพ่น REQUIRED) */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              วันที่ฉีดพ่น <span className="text-rose-500">*</span>
            </label>
            <DatePicker
              value={initialSprayDate}
              onChange={(v) => setInitialSprayDate?.(v || "")}
              placeholder="เลือกวันที่ฉีดพ่นครั้งแรก"
              className="bg-white border-slate-200 rounded-xl text-xs sm:text-sm h-10"
              required
            />
          </div>

          {/* กำหนดฉีดพ่นครั้งต่อไป (Rule 8: กำหนดฉีดพ่นครั้งต่อไป) */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              กำหนดฉีดพ่นครั้งต่อไป
            </label>
            <DatePicker
              value={nextSprayDate || nextFollowUpDate}
              onChange={(v) => {
                setNextSprayDate?.(v || "");
                setNextFollowUpDate?.(v || "");
              }}
              placeholder="เลือกกำหนดฉีดพ่นครั้งต่อไป"
              className="bg-white border-slate-200 rounded-xl text-xs sm:text-sm h-10"
            />
          </div>

          {/* วันที่เริ่มปลูกจริง (Rule 4: plantingDate = วันที่เริ่มปลูก) */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              วันที่เริ่มปลูกจริง
            </label>
            <DatePicker
              value={plantingDate}
              onChange={(v) => setPlantingDate?.(v || "")}
              placeholder="เลือกวันที่เริ่มปลูกจริง"
              className="bg-white border-slate-200 rounded-xl text-xs sm:text-sm h-10"
            />
          </div>

          {/* อายุพืช (Rule 9: ข้อมูลของ Visit #1) */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              อายุพืช (วันหลังปลูก)
            </label>
            <div className="flex gap-2">
              <Input
                type="number"
                min={0}
                value={cropAgeValue}
                onChange={(e) => setCropAgeValue?.(e.target.value)}
                placeholder="เช่น 15"
                className="h-10 text-xs sm:text-sm bg-white border-slate-200 rounded-xl flex-1"
              />
              <Select
                value={cropAgeUnit}
                onValueChange={(v) => setCropAgeUnit?.(v)}
              >
                <SelectTrigger className="w-24 h-10 text-xs sm:text-sm bg-white border-slate-200 rounded-xl">
                  <SelectValue placeholder="หน่วย" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="วัน">วัน</SelectItem>
                  <SelectItem value="สัปดาห์">สัปดาห์</SelectItem>
                  <SelectItem value="เดือน">เดือน</SelectItem>
                  <SelectItem value="ปี">ปี</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ระยะพืช (Stage) (Rule 9: ข้อมูลของ Visit #1) */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              ระยะพืช (Stage)
            </label>
            <Input
              value={growthStage}
              onChange={(e) => setGrowthStage?.(e.target.value)}
              placeholder="เช่น ระยะแตกยอดอ่อน, ระยะติดผล..."
              className="h-10 text-xs sm:text-sm bg-white border-slate-200 rounded-xl"
            />
          </div>

          {/* ข้อมูลเพิ่มเติม (Rule 8: ข้อมูลเพิ่มเติม) */}
          <div className="md:col-span-2 space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              ข้อมูลเพิ่มเติม
            </label>
            <Textarea
              rows={3}
              value={usageMethod}
              onChange={(e) => setUsageMethod?.(e.target.value)}
              placeholder="ระบุข้อมูลเพิ่มเติม สภาพอากาศ หรือหมายเหตุอื่นๆ..."
              className="text-xs sm:text-sm bg-white border-slate-200 rounded-xl"
            />
          </div>
        </div>
      </div>

      {/* SECTION 8: INITIAL PHOTOS (ตาม Rule 10: ภาพถ่ายสภาพแปลงเริ่มต้น Max 10 รูป) */}
      <div className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-emerald-700" />
            <h3 className="text-sm font-bold text-slate-900">
              7. ภาพถ่ายสภาพแปลงเริ่มต้น (Initial Plot Photos)
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            แนบได้สูงสุด 10 รูป
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90">
          <GalleryUpload
            initialFiles={convertToFileMetadata(effectivePhotos)}
            onFilesChange={handlePhotosChange}
            maxFiles={10}
          />
        </div>
      </div>
    </div>
  );
}
