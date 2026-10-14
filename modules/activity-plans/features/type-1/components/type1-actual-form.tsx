"use client";

import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { X, UserCheck, Store, MapPin, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormCombobox } from "@/components/custom/form-components";
import { cn } from "@/lib/utils";
import { DEMO_PRODUCTS } from "@/modules/activity-plans/constants";
import DatePicker from "@/components/custom/DatePicker";
import { ActivityPhotoUpload, ActivityGpsPicker } from "@/components/activity";
import { Badge } from "@/components/ui/badge";
import { Type1PlanCard } from "./type1-plan-card";
import type {
  ProductOption,
  Type1ActualFormProps,
  ActualType1VisitProps,
  Type1TargetItem,
  Type1ImageFile,
  Type1TargetActualItem,
} from "../types";

export type { ProductOption, Type1ActualFormProps, ActualType1VisitProps, Type1TargetActualItem };

/**
 * Extracts target-specific text from composite strings like "TargetA: notes | TargetB: notes"
 */
function parseTargetText(
  text: string | undefined,
  targetName: string,
  fallback: string = "",
): string {
  if (!text) return fallback;
  const escaped = targetName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(
    `(?:^|\\||\\n)\\s*(?:\\d+\\.\\s*)?${escaped}:\\s*([^|\\n]+)`,
    "i",
  );
  const match = text.match(regex);
  if (match && match[1]) {
    return match[1].trim();
  }
  return fallback;
}

/**
 * Initializes target actual items from effective plan targets and hydrated props
 */
function initializeTargetItems(
  targets: Type1TargetItem[],
  fallbackProps: {
    discussionResult: string;
    productAdvice: string;
    salesOpportunity: "สูง" | "ต่ำ" | "";
    nextAction: string;
    nextMeetingDate: string;
    farmerHomeAddress: string;
    plotLatitude: string;
    plotLongitude: string;
    plotImages: Type1ImageFile[];
  },
  savedResults?: Type1TargetActualItem[],
): Type1TargetActualItem[] {
  if (savedResults && savedResults.length === targets.length) {
    return savedResults;
  }

  const effectiveList: Type1TargetItem[] =
    targets.length > 0
      ? targets
      : [{ customer: "เป้าหมายที่ 1", visitPurpose: "FARMER" } as Type1TargetItem];
  const isSingle = effectiveList.length === 1;

  return effectiveList.map((t, idx) => {
    const isStore = t.visitPurpose === "STORE";
    const name = t.isUnregisteredFarmer
      ? t.unregisteredFarmerName || t.customer || `เป้าหมายที่ ${idx + 1}`
      : t.customer || `เป้าหมายที่ ${idx + 1}`;

    const parsedDiscussion = parseTargetText(
      fallbackProps.discussionResult,
      name,
      isSingle
        ? fallbackProps.discussionResult
        : idx === 0 && !fallbackProps.discussionResult.includes(":")
          ? fallbackProps.discussionResult
          : "",
    );

    const parsedNextAction = parseTargetText(
      fallbackProps.nextAction,
      name,
      isSingle
        ? fallbackProps.nextAction
        : idx === 0 && !fallbackProps.nextAction.includes(":")
          ? fallbackProps.nextAction
          : "",
    );

    const parsedAddress = parseTargetText(
      fallbackProps.farmerHomeAddress,
      name,
      isSingle
        ? fallbackProps.farmerHomeAddress
        : idx === 0 && !fallbackProps.farmerHomeAddress.includes(":")
          ? fallbackProps.farmerHomeAddress
          : "",
    );

    const images =
      t.plotImages && t.plotImages.length > 0
        ? t.plotImages
        : isSingle
          ? fallbackProps.plotImages
          : [];

    return {
      id: t.id || `t1-target-${idx}`,
      targetId: t.id,
      customer: name,
      visitPurpose: t.visitPurpose || (isStore ? "STORE" : "FARMER"),
      topic: t.topic || "",
      detail: t.detail || "",
      province: t.province,
      isUnregisteredFarmer: Boolean(t.isUnregisteredFarmer),
      unregisteredFarmerName: t.unregisteredFarmerName,
      unregisteredFarmerPhone: t.unregisteredFarmerPhone,

      discussionResult: parsedDiscussion,
      productAdvice: isSingle ? fallbackProps.productAdvice : "",
      salesOpportunity: isSingle ? fallbackProps.salesOpportunity : "",
      nextAction: parsedNextAction,
      nextMeetingDate: isSingle
        ? fallbackProps.nextMeetingDate
        : t.nextDate || "",
      farmerHomeAddress: parsedAddress,
      plotLatitude:
        t.plotLatitude != null
          ? String(t.plotLatitude)
          : isSingle
            ? fallbackProps.plotLatitude
            : "",
      plotLongitude:
        t.plotLongitude != null
          ? String(t.plotLongitude)
          : isSingle
            ? fallbackProps.plotLongitude
            : "",
      plotImages: images,
    };
  });
}

export function Type1ActualForm({
  isVisible,
  target,
  targets,
  planType,
  productAdvice,
  setProductAdvice,
  discussionResult,
  setDiscussionResult,
  salesOpportunity,
  setSalesOpportunity,
  nextAction,
  setNextAction,
  nextMeetingDate,
  setNextMeetingDate,
  products = [],
  farmerHomeAddress = "",
  setFarmerHomeAddress,
  plotLatitude = "",
  setPlotLatitude,
  plotLongitude = "",
  setPlotLongitude,
  plotImages = [],
  setPlotImages,
  targetActualResults,
  onUpdateTargetActualResults,
}: Type1ActualFormProps) {
  const effectiveTargets = useMemo(
    () => (targets && targets.length > 0 ? targets : target ? [target] : []),
    [targets, target],
  );
  const count = effectiveTargets.length;
  const hasMultipleTargets = count > 1;

  // Internal per-target actual records
  const [targetItems, setTargetItems] = useState<Type1TargetActualItem[]>(() =>
    initializeTargetItems(
      effectiveTargets,
      {
        discussionResult,
        productAdvice,
        salesOpportunity,
        nextAction,
        nextMeetingDate,
        farmerHomeAddress,
        plotLatitude,
        plotLongitude,
        plotImages,
      },
      targetActualResults,
    ),
  );

  // Keep a stable ref of props for syncing without triggering infinite render loops
  const syncPropsRef = useRef({
    setDiscussionResult,
    setProductAdvice,
    setSalesOpportunity,
    setNextAction,
    setNextMeetingDate,
    setFarmerHomeAddress,
    setPlotLatitude,
    setPlotLongitude,
    setPlotImages,
    onUpdateTargetActualResults,
  });
  syncPropsRef.current = {
    setDiscussionResult,
    setProductAdvice,
    setSalesOpportunity,
    setNextAction,
    setNextMeetingDate,
    setFarmerHomeAddress,
    setPlotLatitude,
    setPlotLongitude,
    setPlotImages,
    onUpdateTargetActualResults,
  };

  // Synchronize internal targetItems changes to parent setters and optional callbacks
  const syncToParent = useCallback((items: Type1TargetActualItem[]) => {
    if (!items || items.length === 0) return;

    const {
      setDiscussionResult,
      setProductAdvice,
      setSalesOpportunity,
      setNextAction,
      setNextMeetingDate,
      setFarmerHomeAddress,
      setPlotLatitude,
      setPlotLongitude,
      setPlotImages,
      onUpdateTargetActualResults,
    } = syncPropsRef.current;

    if (onUpdateTargetActualResults) {
      onUpdateTargetActualResults(items);
    }

    if (items.length === 1) {
      const single = items[0];
      setDiscussionResult(single.discussionResult || "");
      setProductAdvice(single.productAdvice || "");
      setSalesOpportunity(single.salesOpportunity || "");
      setNextAction(single.nextAction || "");
      setNextMeetingDate(single.nextMeetingDate || "");
      if (setFarmerHomeAddress) {
        setFarmerHomeAddress(single.farmerHomeAddress || "");
      }
      if (setPlotLatitude) setPlotLatitude(single.plotLatitude || "");
      if (setPlotLongitude) setPlotLongitude(single.plotLongitude || "");
      if (setPlotImages) setPlotImages(single.plotImages || []);
      return;
    }

    // MULTI-TARGET COMBINATIONS:
    // 1. discussionResult: "ร้าน ก: ... | ร้าน ข: ..."
    const combinedDiscussion = items
      .map((item) =>
        item.discussionResult
          ? `${item.customer}: ${item.discussionResult}`
          : "",
      )
      .filter(Boolean)
      .join(" | ");
    setDiscussionResult(combinedDiscussion);

    // 2. productAdvice: unique product names
    const uniqueProducts = Array.from(
      new Set(
        items.flatMap((item) =>
          (item.productAdvice || "")
            .split(",")
            .map((p) => p.trim())
            .filter(Boolean),
        ),
      ),
    );
    setProductAdvice(uniqueProducts.join(", "));

    // 3. salesOpportunity: "สูง" if any target is สูง, else "ต่ำ" if any is ต่ำ, else ""
    const hasHigh = items.some((i) => i.salesOpportunity === "สูง");
    const hasLow = items.some((i) => i.salesOpportunity === "ต่ำ");
    setSalesOpportunity(hasHigh ? "สูง" : hasLow ? "ต่ำ" : "");

    // 4. nextAction: "ร้าน ก: ... | ร้าน ข: ..."
    const combinedNextAction = items
      .map((item) =>
        item.nextAction ? `${item.customer}: ${item.nextAction}` : "",
      )
      .filter(Boolean)
      .join(" | ");
    setNextAction(combinedNextAction);

    // 5. nextMeetingDate: first target with non-empty date
    const firstDate =
      items.find((i) => i.nextMeetingDate)?.nextMeetingDate || "";
    setNextMeetingDate(firstDate);

    // 6. farmerHomeAddress
    if (setFarmerHomeAddress) {
      const farmerAddresses = items
        .filter((i) => i.visitPurpose !== "STORE" && i.farmerHomeAddress)
        .map((i) =>
          items.filter((x) => x.visitPurpose !== "STORE").length > 1
            ? `${i.customer}: ${i.farmerHomeAddress}`
            : i.farmerHomeAddress!,
        );
      setFarmerHomeAddress(farmerAddresses.join(" | "));
    }

    // 7. plotLatitude & plotLongitude: first farmer with coordinates
    const firstCoord = items.find(
      (i) => i.plotLatitude && i.plotLongitude,
    );
    if (setPlotLatitude && setPlotLongitude) {
      if (firstCoord) {
        setPlotLatitude(firstCoord.plotLatitude || "");
        setPlotLongitude(firstCoord.plotLongitude || "");
      }
    }

    // 8. plotImages: combine all photos across all targets
    if (setPlotImages) {
      const allPlotImages = items.flatMap((i) => i.plotImages || []);
      setPlotImages(allPlotImages);
    }
  }, []);

  // Update targetItems when targets prop changes
  useEffect(() => {
    if (!effectiveTargets || effectiveTargets.length === 0) return;
    setTargetItems((prev) => {
      if (
        prev.length === effectiveTargets.length &&
        prev.every(
          (p, idx) =>
            p.id === (effectiveTargets[idx].id || `t1-target-${idx}`),
        )
      ) {
        return prev;
      }
      return initializeTargetItems(
        effectiveTargets,
        {
          discussionResult,
          productAdvice,
          salesOpportunity,
          nextAction,
          nextMeetingDate,
          farmerHomeAddress,
          plotLatitude,
          plotLongitude,
          plotImages,
        },
        targetActualResults,
      );
    });
  }, [effectiveTargets]);

  // Master product list for Combobox
  const comboboxOptions = useMemo(() => {
    if (products && products.length > 0) {
      return products.map((p) => ({
        value: p.name,
        label: p.name,
        subLabel: p.productCode || undefined,
      }));
    }
    return DEMO_PRODUCTS.map((name) => ({
      value: name,
      label: name,
      subLabel: undefined,
    }));
  }, [products]);

  if (!isVisible) return null;

  // Handlers for individual target fields
  const handleTargetChange = (
    index: number,
    field: keyof Type1TargetActualItem,
    value: any,
  ) => {
    setTargetItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      syncToParent(updated);
      return updated;
    });
  };

  const handleAddProduct = (index: number, prod: string) => {
    if (!prod) return;
    const current = targetItems[index].productAdvice
      ? targetItems[index].productAdvice!
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
    if (current.includes(prod)) return;
    const updated = [...current, prod].join(", ");
    handleTargetChange(index, "productAdvice", updated);
  };

  const handleRemoveProduct = (index: number, prod: string) => {
    const current = targetItems[index].productAdvice
      ? targetItems[index].productAdvice!
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
    const updated = current.filter((p) => p !== prod).join(", ");
    handleTargetChange(index, "productAdvice", updated);
  };

  const isStore = target?.visitPurpose === "STORE";
  const hasFarmerTarget =
    effectiveTargets.some((t) => t.visitPurpose !== "STORE") || !isStore;

  return (
    <div className="border border-emerald-200/80 rounded-2xl p-4 sm:p-5 md:p-6 bg-white space-y-5 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-1 border-b border-emerald-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
            {isStore && !hasFarmerTarget ? (
              <Store className="w-4 h-4" />
            ) : (
              <UserCheck className="w-4 h-4" />
            )}
          </div>
          <div>
            <h2 className="font-bold text-emerald-900 text-base md:text-lg">
              เข้าพบร้านค้า / Key Farmer
            </h2>
            <p className="text-xs text-slate-500">
              รายละเอียดแผนงานและบันทึกผลการเข้าพบจริง
            </p>
          </div>
        </div>
        {count > 1 && (
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            {count} เป้าหมาย
          </span>
        )}
      </div>

      {/* PLAN DETAILS SECTION (Hides automatically in UNPLANNED mode) */}
      <Type1PlanCard planType={planType} target={target} targets={targets} />

      {/* ACTUAL RESULTS FORM SECTION */}
      {hasMultipleTargets ? (
        /* MULTI-TARGET ACTUAL FORM (1 CARD PER TARGET) */
        <div className="space-y-4 pt-1">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 pb-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
              <h3 className="text-sm font-bold text-slate-800">
                บันทึกผลการเข้าพบจริง (ACTUAL) แยกตามเป้าหมาย ({count} เป้าหมาย)
              </h3>
            </div>
            <span className="text-xs text-slate-500">
              * บันทึกข้อมูลผลการเข้าพบและพูดคุยแยกตามแต่ละเป้าหมาย
            </span>
          </div>

          <div className="space-y-4">
            {targetItems.map((item, idx) => {
              const itemIsStore = item.visitPurpose === "STORE";
              const isAdviceTopic =
                item.topic?.trim() === "ให้คำแนะนำการใช้สินค้า" ||
                !!item.productAdvice ||
                !!item.salesOpportunity;

              const targetSelectedProducts = item.productAdvice
                ? item.productAdvice
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)
                : [];

              return (
                <div
                  key={item.id || idx}
                  className="border border-emerald-200/90 rounded-2xl p-4 sm:p-5 bg-emerald-50/25 space-y-4 shadow-2xs hover:border-emerald-300 transition-all"
                >
                  {/* Target Card Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-100/90 pb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-bold shrink-0 shadow-2xs">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 text-sm block truncate">
                          เป้าหมายที่ {idx + 1}: {item.customer}
                        </span>
                        <span className="text-xs text-slate-500 block truncate">
                          {item.topic
                            ? `หัวข้อตามแผน: ${item.topic}`
                            : "ไม่ระบุหัวข้อ"}
                          {item.province ? ` • จังหวัด ${item.province}` : ""}
                          {item.detail ? ` (${item.detail})` : ""}
                        </span>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[11px] font-semibold px-2.5 py-0.5 rounded-lg shrink-0",
                        itemIsStore
                          ? "bg-sky-50 text-sky-800 border-sky-200"
                          : "bg-emerald-50 text-emerald-800 border-emerald-200",
                      )}
                    >
                      {itemIsStore ? "เข้าพบร้านค้า" : "เข้าพบเกษตรกร"}
                    </Badge>
                  </div>

                  {/* Target Specific Fields: FARMER ONLY */}
                  {!itemIsStore && (
                    <div className="space-y-4 pt-1 border-b border-emerald-100/70 pb-4">
                      {/* ที่อยู่บ้านเกษตรกร */}
                      <div className="space-y-1.5">
                        <label className="text-xs sm:text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                          ที่อยู่บ้านเกษตรกร ({item.customer})
                        </label>
                        <Textarea
                          rows={2}
                          value={item.farmerHomeAddress || ""}
                          onChange={(e) =>
                            handleTargetChange(
                              idx,
                              "farmerHomeAddress",
                              e.target.value,
                            )
                          }
                          placeholder="ระบุที่อยู่บ้านเกษตรกร เช่น เลขที่ หมู่ที่ ตำบล อำเภอ"
                          className="bg-white border-slate-200 rounded-xl text-xs sm:text-sm"
                        />
                      </div>

                      {/* พิกัดแปลง (Plot Coordinates) */}
                      <ActivityGpsPicker
                        title={`พิกัดแปลงเกษตรกร - ${item.customer}`}
                        latitude={item.plotLatitude || ""}
                        longitude={item.plotLongitude || ""}
                        onLatitudeChange={(lat) =>
                          handleTargetChange(idx, "plotLatitude", lat)
                        }
                        onLongitudeChange={(lng) =>
                          handleTargetChange(idx, "plotLongitude", lng)
                        }
                        accentColor="emerald"
                      />

                      {/* รูปแปลงเกษตรกร (Plot Photos - Max 5) */}
                      <ActivityPhotoUpload
                        title={`รูปแปลงเกษตรกร - ${item.customer} (สูงสุด 5 รูป)`}
                        description="อัปโหลดรูปภาพแปลงเกษตรกร เช่น สภาพแปลง แปลงปลูก ต้นพืช"
                        images={item.plotImages || []}
                        onImagesChange={(imgs) =>
                          handleTargetChange(idx, "plotImages", imgs)
                        }
                        maxFiles={5}
                        accentColor="emerald"
                      />
                    </div>
                  )}

                  {/* สินค้าที่ให้คำแนะนำ & ประเมินโอกาสการขาย (Conditional) */}
                  {isAdviceTopic && (
                    <div className="space-y-3 pt-1 border-b border-emerald-100/70 pb-4">
                      <div className="space-y-1.5">
                        <label className="text-xs sm:text-sm font-semibold text-slate-800 flex items-center justify-between">
                          <span>สินค้าที่ให้คำแนะนำ ({item.customer})</span>
                          {targetSelectedProducts.length > 0 && (
                            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              เลือกแล้ว {targetSelectedProducts.length} รายการ
                            </span>
                          )}
                        </label>

                        {targetSelectedProducts.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 p-2.5 bg-emerald-50/40 border border-emerald-200/60 rounded-xl mb-1.5">
                            {targetSelectedProducts.map((prod) => (
                              <span
                                key={prod}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white text-emerald-900 border border-emerald-200 shadow-2xs"
                              >
                                {prod}
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRemoveProduct(idx, prod)
                                  }
                                  className="hover:bg-emerald-100 rounded-md p-0.5 transition-colors text-emerald-600 hover:text-red-600 cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}

                        <FormCombobox
                          id={`product-advice-combobox-${idx}`}
                          label=""
                          labelClassName="hidden"
                          value=""
                          onChange={(val) => {
                            if (val) handleAddProduct(idx, val);
                          }}
                          options={comboboxOptions}
                          placeholder="เลือกสินค้าที่ให้คำแนะนำเพิ่มเติม (คลิกเลือกหลายรายการได้)"
                          searchPlaceholder="ค้นหาสินค้า..."
                          emptyText="ไม่พบสินค้า"
                          triggerClassName="w-full bg-white border-slate-200 text-xs sm:text-sm h-10 min-h-[40px] rounded-xl mt-0 font-normal hover:bg-slate-50 focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs sm:text-sm font-semibold text-slate-800">
                          ประเมินโอกาสการขาย <span className="text-rose-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-3 max-w-sm">
                          {(["สูง", "ต่ำ"] as const).map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() =>
                                handleTargetChange(
                                  idx,
                                  "salesOpportunity",
                                  opt,
                                )
                              }
                              className={cn(
                                "py-2 px-3 rounded-xl border text-xs sm:text-sm font-semibold cursor-pointer transition-all flex items-center justify-center",
                                item.salesOpportunity === opt
                                  ? opt === "สูง"
                                    ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                                    : "bg-amber-500 border-amber-500 text-white shadow-xs"
                                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50",
                              )}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ผลการพูดคุย */}
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm font-semibold text-slate-800">
                      ผลการพูดคุยกับ {item.customer}{" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <Textarea
                      rows={2}
                      value={item.discussionResult || ""}
                      onChange={(e) =>
                        handleTargetChange(
                          idx,
                          "discussionResult",
                          e.target.value,
                        )
                      }
                      placeholder={
                        itemIsStore
                          ? `สรุปประเด็นสำคัญจากการพูดคุยกับร้าน ${item.customer}`
                          : `สรุปประเด็นสำคัญจากการพูดคุยกับคุณ ${item.customer}`
                      }
                      className="bg-white border-slate-200 rounded-xl text-xs sm:text-sm"
                    />
                  </div>

                  {/* สิ่งที่ต้องดำเนินการต่อ & วันที่นัดหมายครั้งถัดไป */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div className="space-y-1.5">
                      <label className="text-xs sm:text-sm font-semibold text-slate-800">
                        สิ่งที่ต้องดำเนินการต่อ ({item.customer})
                      </label>
                      <Input
                        value={item.nextAction || ""}
                        onChange={(e) =>
                          handleTargetChange(idx, "nextAction", e.target.value)
                        }
                        placeholder="เช่น ส่งตัวอย่างสินค้า, นัดหมายตรวจแปลง"
                        className="bg-white border-slate-200 rounded-xl text-xs sm:text-sm h-10"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs sm:text-sm font-semibold text-slate-800">
                        วันที่นัดหมายครั้งถัดไป
                      </label>
                      <DatePicker
                        value={item.nextMeetingDate || ""}
                        onChange={(v) =>
                          handleTargetChange(
                            idx,
                            "nextMeetingDate",
                            v || "",
                          )
                        }
                        placeholder="เลือกวันที่นัดหมาย"
                        className="bg-white border-slate-200 rounded-xl text-xs sm:text-sm h-10"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* SINGLE TARGET ACTUAL FORM (CLEAN STANDARD LAYOUT) */
        <div className="space-y-4 pt-1">
          <div className="flex items-center gap-2 pb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
            <h3 className="text-sm font-bold text-slate-800">
              บันทึกผลการเข้าพบจริง (ACTUAL)
            </h3>
          </div>

          {/* Farmer-Specific Actual Fields (Hidden in Store-Only Mode) */}
          {hasFarmerTarget && (
            <>
              {/* 1. ที่อยู่บ้านเกษตรกร */}
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  ที่อยู่บ้านเกษตรกร
                </label>
                <Textarea
                  rows={2}
                  value={farmerHomeAddress}
                  onChange={(e) =>
                    setFarmerHomeAddress && setFarmerHomeAddress(e.target.value)
                  }
                  placeholder="ระบุที่อยู่บ้านเกษตรกร เช่น เลขที่ หมู่ที่ ตำบล อำเภอ"
                  className="bg-white border-slate-200 rounded-xl text-xs sm:text-sm"
                />
              </div>

              {/* 2. พิกัดแปลง (Plot Coordinates) */}
              <ActivityGpsPicker
                title="พิกัดแปลง (Plot Coordinates)"
                latitude={plotLatitude}
                longitude={plotLongitude}
                onLatitudeChange={setPlotLatitude}
                onLongitudeChange={setPlotLongitude}
                accentColor="emerald"
              />

              {/* 3. รูปแปลง (Plot Photos - Max 5) */}
              <ActivityPhotoUpload
                title="รูปแปลงเกษตรกร (สูงสุด 5 รูป)"
                description="อัปโหลดรูปภาพแปลงเกษตรกร เช่น สภาพแปลง แปลงปลูก ต้นพืช"
                images={plotImages}
                onImagesChange={setPlotImages}
                maxFiles={5}
                accentColor="emerald"
              />
            </>
          )}

          {/* 4. Conditional rendering for advice products & sales opportunity */}
          {(target?.topic?.trim() === "ให้คำแนะนำการใช้สินค้า" ||
            !!productAdvice ||
            !!salesOpportunity) && (
            <>
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-semibold text-slate-800 flex items-center justify-between">
                  <span>สินค้าที่ให้คำแนะนำ (เลือกได้มากกว่า 1 รายการ)</span>
                  {productAdvice && (
                    <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      เลือกแล้ว{" "}
                      {
                        productAdvice
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean).length
                      }{" "}
                      รายการ
                    </span>
                  )}
                </label>

                {productAdvice && (
                  <div className="flex flex-wrap gap-1.5 p-2.5 bg-emerald-50/40 border border-emerald-200/60 rounded-xl mb-1.5">
                    {productAdvice
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean)
                      .map((prod) => (
                        <span
                          key={prod}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white text-emerald-900 border border-emerald-200 shadow-2xs"
                        >
                          {prod}
                          <button
                            type="button"
                            onClick={() => {
                              const updated = productAdvice
                                .split(",")
                                .map((s) => s.trim())
                                .filter((p) => p !== prod && Boolean(p))
                                .join(", ");
                              setProductAdvice(updated);
                            }}
                            className="hover:bg-emerald-100 rounded-md p-0.5 transition-colors text-emerald-600 hover:text-red-600 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))}
                  </div>
                )}

                <FormCombobox
                  id="product-advice-combobox-single"
                  label=""
                  labelClassName="hidden"
                  value=""
                  onChange={(val) => {
                    if (val) {
                      const cur = productAdvice
                        ? productAdvice
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean)
                        : [];
                      if (!cur.includes(val)) {
                        setProductAdvice([...cur, val].join(", "));
                      }
                    }
                  }}
                  options={comboboxOptions}
                  placeholder="เลือกสินค้าที่ให้คำแนะนำเพิ่มเติม (คลิกเลือกหลายรายการได้)"
                  searchPlaceholder="ค้นหาสินค้า..."
                  emptyText="ไม่พบสินค้า"
                  triggerClassName="w-full bg-white border-slate-200 text-xs sm:text-sm h-10 min-h-[40px] rounded-xl mt-0 font-normal hover:bg-slate-50 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-semibold text-slate-800">
                  ประเมินโอกาสการขาย <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3 max-w-sm">
                  {(["สูง", "ต่ำ"] as const).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setSalesOpportunity(opt)}
                      className={cn(
                        "py-2.5 px-4 rounded-xl border text-xs sm:text-sm font-semibold cursor-pointer transition-all flex items-center justify-center",
                        salesOpportunity === opt
                          ? opt === "สูง"
                            ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                            : "bg-amber-500 border-amber-500 text-white shadow-xs"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50",
                      )}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* 5. ผลการพูดคุย */}
          <div className="space-y-1.5">
            <label className="text-xs sm:text-sm font-semibold text-slate-800">
              ผลการพูดคุย <span className="text-rose-500">*</span>
            </label>
            <Textarea
              rows={2}
              value={discussionResult}
              onChange={(e) => setDiscussionResult(e.target.value)}
              placeholder={
                isStore
                  ? "สรุปประเด็นสำคัญจากการพูดคุยกับร้านค้า"
                  : "สรุปประเด็นสำคัญจากการพูดคุยกับเกษตรกร"
              }
              className="bg-white border-slate-200 rounded-xl text-xs sm:text-sm"
            />
          </div>

          {/* 6. สิ่งที่ต้องดำเนินการต่อ & วันที่นัดหมายครั้งถัดไป */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-semibold text-slate-800">
                สิ่งที่ต้องดำเนินการต่อ
              </label>
              <Input
                value={nextAction}
                onChange={(e) => setNextAction(e.target.value)}
                placeholder="เช่น ส่งตัวอย่างสินค้า, นัดหมายตรวจแปลง"
                className="bg-white border-slate-200 rounded-xl text-xs sm:text-sm h-10"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-semibold text-slate-800">
                วันที่นัดหมายครั้งถัดไป
              </label>
              <DatePicker
                value={nextMeetingDate}
                onChange={(v) => setNextMeetingDate(v || "")}
                placeholder="เลือกวันที่นัดหมาย"
                className="bg-white border-slate-200 rounded-xl text-xs sm:text-sm h-10"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Backward-compatible alias
export const ActualType1Visit = Type1ActualForm;
