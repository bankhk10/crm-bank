"use client";

import React from "react";
import {
  Calendar,
  Clock,
  Layers,
  Plus,
  Trash2,
  FileText,
  AlertCircle,
  Package,
  Activity,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ActivityInput,
  ActivityProductSelect,
  ActivityPhotoUpload,
  type ImageFile,
} from "@/modules/activity/ui";
import {
  TRACKING_RESULT_OPTIONS,
  PRODUCT_RESPONSE_OPTIONS,
  TYPE14_MAX_IMAGES_PER_VILLAGE,
} from "../../shared/constants";
import type {
  Type14SprayRoundState,
  Type14ActualProductState,
  ProductOption,
} from "../../shared/types";
import type { Type14ActualProps } from "../types/actual.types";

export type { Type14ActualProps };

export function Type14ActualForm({
  isVisible = true,
  actualState,
  products = [],
  readonly = false,
  className = "",
  targets = [],
}: Type14ActualProps) {
  if (!isVisible || !actualState) return null;

  const rounds: Type14SprayRoundState[] = actualState.rounds || [];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overview target banner if present */}
      {targets.length > 0 && (
        <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/40 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-950">
            <Layers className="h-4 w-4 text-emerald-600" />
            <span>แปลงเป้าหมายที่ต้องติดตาม ({targets.length} แปลง)</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            {targets.map((t, idx) => (
              <span
                key={t.id || idx}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 font-medium text-slate-800 shadow-2xs border border-slate-200"
              >
                <span className="font-semibold text-emerald-700">
                  {idx + 1}. {t.name || t.plotName || `แปลงที่ ${idx + 1}`}
                </span>
                {t.dealerName && (
                  <span className="text-slate-500">({t.dealerName})</span>
                )}
                {t.province && (
                  <span className="text-slate-400">จ.{t.province}</span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tracking Rounds */}
      <div className="space-y-5">
        {rounds.map((round, roundIdx) => (
          <div
            key={round.id || roundIdx}
            className="rounded-xl border border-border/80 bg-card p-5 shadow-sm space-y-4"
          >
            {/* Round Header */}
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs dark:bg-emerald-950 dark:text-emerald-300">
                  {round.roundNumber || roundIdx + 1}
                </span>
                <h4 className="font-semibold text-foreground text-sm sm:text-base">
                  รอบการติดตามที่ {round.roundNumber || roundIdx + 1}
                </h4>
              </div>

              {!readonly && rounds.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => actualState.removeRound(roundIdx)}
                  className="text-xs text-destructive hover:bg-destructive/10 h-8"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  ลบรอบนี้
                </Button>
              )}
            </div>

            {/* Visit Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  วันที่ติดตามผล <span className="text-destructive">*</span>
                </label>
                <ActivityInput
                  type="date"
                  value={round.actualVisitDate || ""}
                  onChange={(e) =>
                    actualState.updateRoundField(
                      roundIdx,
                      "actualVisitDate",
                      e.target.value,
                    )
                  }
                  disabled={readonly}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  ระยะเวลาหลังฉีดพ่น (วัน)
                </label>
                <ActivityInput
                  type="number"
                  min="0"
                  value={round.daysAfterSpray || ""}
                  onChange={(e) =>
                    actualState.updateRoundField(
                      roundIdx,
                      "daysAfterSpray",
                      e.target.value,
                    )
                  }
                  placeholder="เช่น 7, 14, 21"
                  disabled={readonly}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  ผลการติดตามแปลง <span className="text-destructive">*</span>
                </label>
                <select
                  value={round.trackingResult || "ได้ผลตามเกณฑ์"}
                  onChange={(e) =>
                    actualState.updateRoundField(
                      roundIdx,
                      "trackingResult",
                      e.target.value,
                    )
                  }
                  disabled={readonly}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {TRACKING_RESULT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  การตอบสนองของพืช
                </label>
                <select
                  value={round.productResponse || "ปกติ"}
                  onChange={(e) =>
                    actualState.updateRoundField(
                      roundIdx,
                      "productResponse",
                      e.target.value,
                    )
                  }
                  disabled={readonly}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {PRODUCT_RESPONSE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Additional notes */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                บันทึกข้อสังเกตเพิ่มเติม / ปัญหาที่พบ
              </label>
              <ActivityInput
                value={round.additionalNotes || ""}
                onChange={(e) =>
                  actualState.updateRoundField(
                    roundIdx,
                    "additionalNotes",
                    e.target.value,
                  )
                }
                placeholder="ระบุข้อสังเกต สภาพพืช อาการ หรือแนวทางแก้ไข"
                disabled={readonly}
              />
            </div>

            {/* Observed/Applied Products in this round */}
            <div className="space-y-2 rounded-lg border border-border/70 bg-muted/10 p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5 text-emerald-600" />
                  รายการสินค้าที่ตรวจติดตาม / ฉีดพ่นซ้ำ ({round.products?.length || 0})
                </span>
                {!readonly && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      actualState.addRoundProduct(roundIdx, {
                        productId: "",
                        productName: "",
                        unit: "ขวด",
                        quantityUsed: 1,
                        actualRate: "",
                        detail: "",
                      })
                    }
                    className="h-7 text-xs text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    เพิ่มสินค้า
                  </Button>
                )}
              </div>

              {round.products && round.products.length > 0 ? (
                <div className="space-y-2 pt-1">
                  {round.products.map((p, pIdx) => (
                    <div
                      key={pIdx}
                      className="grid grid-cols-12 gap-2 items-center bg-card p-2.5 rounded-lg border"
                    >
                      <div className="col-span-12 sm:col-span-4">
                        <ActivityProductSelect
                          products={products as any}
                          value={p.productId}
                          onChange={(val, prod) => {
                            actualState.updateRoundProduct(
                              roundIdx,
                              pIdx,
                              "productId",
                              val,
                            );
                            actualState.updateRoundProduct(
                              roundIdx,
                              pIdx,
                              "productName",
                              prod?.name || "",
                            );
                            if (prod?.unit) {
                              actualState.updateRoundProduct(
                                roundIdx,
                                pIdx,
                                "unit",
                                prod.unit,
                              );
                            }
                          }}
                          disabled={readonly}
                        />
                      </div>
                      <div className="col-span-4 sm:col-span-2">
                        <ActivityInput
                          type="number"
                          value={p.quantityUsed}
                          onChange={(e) =>
                            actualState.updateRoundProduct(
                              roundIdx,
                              pIdx,
                              "quantityUsed",
                              e.target.value,
                            )
                          }
                          placeholder="จำนวน"
                          disabled={readonly}
                        />
                      </div>
                      <div className="col-span-3 sm:col-span-2">
                        <ActivityInput
                          value={p.unit || "ขวด"}
                          onChange={(e) =>
                            actualState.updateRoundProduct(
                              roundIdx,
                              pIdx,
                              "unit",
                              e.target.value,
                            )
                          }
                          placeholder="หน่วย"
                          disabled={readonly}
                        />
                      </div>
                      <div className="col-span-4 sm:col-span-3">
                        <ActivityInput
                          value={p.actualRate || ""}
                          onChange={(e) =>
                            actualState.updateRoundProduct(
                              roundIdx,
                              pIdx,
                              "actualRate",
                              e.target.value,
                            )
                          }
                          placeholder="อัตราใช้จริง"
                          disabled={readonly}
                        />
                      </div>
                      {!readonly && (
                        <div className="col-span-1 flex justify-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              actualState.removeRoundProduct(roundIdx, pIdx)
                            }
                            className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[11px] text-muted-foreground text-center py-2">
                  ไม่มีสินค้าเฉพาะรอบนี้
                </div>
              )}
            </div>

            {/* Photo Upload Section */}
            <div className="pt-2">
              <ActivityPhotoUpload
                title={`รูปถ่ายสภาพแปลงหลังการติดตามรอบที่ ${round.roundNumber || roundIdx + 1}`}
                description={`อัปโหลดภาพถ่ายสภาพพืช ผลการใช้สาร หรืออาการผิดปกติ (สูงสุด ${TYPE14_MAX_IMAGES_PER_VILLAGE} รูป)`}
                images={round.afterSprayImages || []}
                onImagesChange={(newImages: ImageFile[]) => {
                  actualState.updateRoundField(
                    roundIdx,
                    "afterSprayImages",
                    newImages,
                  );
                }}
                maxFiles={TYPE14_MAX_IMAGES_PER_VILLAGE}
                readonly={readonly}
                accentColor="emerald"
              />
            </div>
          </div>
        ))}

        {!readonly && (
          <Button
            type="button"
            variant="outline"
            onClick={actualState.addRound}
            className="w-full border-dashed border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950/30"
          >
            <Plus className="h-4 w-4 mr-2" />
            เพิ่มรอบการติดตามผล (รอบที่ {rounds.length + 1})
          </Button>
        )}
      </div>
    </div>
  );
}

export const Type14Actual = Type14ActualForm;
