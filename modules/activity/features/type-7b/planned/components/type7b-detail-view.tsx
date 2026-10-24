"use client";

import React from "react";
import {
  Search,
  User,
  Sprout,
  Droplets,
  Package,
  Calendar,
  Camera,
  Star,
  CheckCircle2,
  Clock,
  RotateCw,
  TrendingUp,
  PackageCheck,
  PackagePlus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Type7bDetailViewProps } from "../types/actual.types";

export function Type7bDetailView({
  isVisible = true,
  target,
  targets = [],
  actualResult,
  attachments = [],
}: Type7bDetailViewProps) {
  if (!isVisible) return null;

  const plotList = targets.length > 0 ? targets : target ? [target] : [];

  const rounds = actualResult?.t7SprayingRounds || [];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-slate-800 font-bold text-base">
        <Search className="h-5 w-5 text-emerald-600" />
        <span>ข้อมูลการติดตามแปลงสาธิต (Type 7B)</span>
      </div>

      {plotList.map((p, idx) => {
        const withdrawnProds = p.demoProducts || p.withdrawnProducts || [];

        return (
          <div
            key={p.id || idx}
            className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">
                  {idx + 1}
                </span>
                <span>{p.plotName || "แปลงสาธิตติดตาม"}</span>
              </h4>

              {p.areaRai != null && (
                <span className="text-xs bg-emerald-50 text-emerald-800 font-bold px-2.5 py-1 rounded-md border border-emerald-200">
                  {String(p.areaRai)} ไร่
                </span>
              )}
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-slate-500">เจ้าของแปลง:</span>
                <span className="font-semibold text-slate-800">
                  {p.ownerName || p.farmerName || p.owner || "-"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Sprout className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-slate-500">พืชเป้าหมาย:</span>
                <span className="font-semibold text-slate-800">
                  {p.cropName || p.crop || "-"}
                </span>
              </div>

              {p.dealerName && (
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-slate-500">ร้านค้า Dealer:</span>
                  <span className="font-semibold text-slate-800">{p.dealerName}</span>
                </div>
              )}

              {(p.province || p.district) && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">พื้นที่:</span>
                  <span className="font-semibold text-slate-800">
                    {[p.province, p.district].filter(Boolean).join(" / ")}
                  </span>
                </div>
              )}
            </div>

            {/* Objective / Detail */}
            {(p.detail || p.objective || p.followUpObjective) && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1">
                <span className="font-semibold text-slate-600 block text-[11px]">
                  สิ่งที่ตั้งใจจะไปติดตาม
                </span>
                <p className="text-slate-800 whitespace-pre-line leading-relaxed">
                  {p.detail || p.objective || p.followUpObjective}
                </p>
              </div>
            )}

            {/* Withdrawn Products */}
            {withdrawnProds.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-emerald-600" />
                  สินค้าที่เบิกเพื่อการติดตาม:
                </span>
                <div className="flex flex-wrap gap-2">
                  {withdrawnProds.map((prod: any, pIdx: number) => (
                    <div
                      key={prod.id || pIdx}
                      className="bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-lg px-2.5 py-1 text-xs flex items-center gap-1.5"
                    >
                      <span>{prod.productName || prod.product?.name || "สินค้า"}</span>
                      <span className="font-bold text-emerald-700 bg-white px-1.5 rounded border border-emerald-200">
                        {prod.quantity || prod.targetQuantity || 1} {prod.unit || prod.product?.unit || ""}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Actual Results Section */}
      {actualResult && (
        <div className="space-y-5">
          {/* Section 1: ข้อมูลการติดตามแปลง */}
          <div className="bg-white rounded-2xl border border-blue-200 p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-blue-100 pb-3">
              <Clock className="w-5 h-5 text-blue-600" />
              <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                ส่วนที่ 1: ข้อมูลการติดตามแปลง (Tracking Details)
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-500 block text-[11px]">วันที่ติดตามจริง</span>
                <span className="font-bold text-slate-800 text-sm">
                  {actualResult.t7VisitDate || actualResult.actualStartDate || "-"}
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-500 block text-[11px]">จำนวนวันหลังฉีดพ่น</span>
                <span className="font-bold text-slate-800 text-sm">
                  {actualResult.t7DaysAfterSpray ?? 0} วัน
                </span>
              </div>
            </div>

            {/* Crop Images */}
            {actualResult.t7CropImages && actualResult.t7CropImages.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-blue-600" />
                  รูปภาพสภาพพืชในการติดตามรอบนี้ ({actualResult.t7CropImages.length} รูป):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {actualResult.t7CropImages.map((img: any, i: number) => (
                    <a
                      key={img.id || i}
                      href={img.url || img.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="group block relative aspect-video rounded-lg overflow-hidden border border-slate-200 bg-slate-100"
                    >
                      <img
                        src={img.url || img.fileUrl}
                        alt={img.name || img.fileName || `crop-photo-${i}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section 2: ข้อมูลการฉีดพ่นรอบต่างๆ */}
          {rounds.length > 0 ? (
            <div className="bg-white rounded-2xl border border-emerald-200 p-4 sm:p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-emerald-100 pb-3">
                <RotateCw className="w-5 h-5 text-emerald-600" />
                <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                  ส่วนที่ 2: ข้อมูลการฉีดพ่นรอบต่างๆ ({rounds.length} รอบ)
                </h4>
              </div>

              <div className="space-y-4">
                {rounds.map((round, rIdx) => {
                  const bProds = round.baselineProducts || [];
                  const aProds = round.additionalProducts || [];

                  return (
                    <div
                      key={round.id || rIdx}
                      className="bg-slate-50/70 rounded-xl border border-slate-200 p-3.5 sm:p-4 space-y-3.5 text-xs"
                    >
                      <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                        <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                            {round.roundNumber || rIdx + 1}
                          </span>
                          รอบการฉีดพ่นที่ {round.roundNumber || rIdx + 1}
                        </span>
                      </div>

                      {/* Baseline products */}
                      {bProds.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="font-semibold text-slate-700 flex items-center gap-1">
                            <PackageCheck className="w-3.5 h-3.5 text-emerald-600" />
                            1.1 สินค้าตามแผนงาน:
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {bProds.map((bp, bpIdx) => (
                              <div
                                key={bp.productId || bpIdx}
                                className="bg-white p-2 rounded-lg border border-slate-200 flex items-center justify-between"
                              >
                                <div>
                                  <span className="font-bold text-slate-800 block">{bp.productName}</span>
                                  {bp.actualRate && (
                                    <span className="text-[11px] text-slate-500">อัตราใช้: {bp.actualRate}</span>
                                  )}
                                </div>
                                <span className="bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded text-[11px]">
                                  {bp.actualQuantity || bp.plannedQuantity || 1} {bp.unit || "หน่วย"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Additional products */}
                      {aProds.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="font-semibold text-slate-700 flex items-center gap-1">
                            <PackagePlus className="w-3.5 h-3.5 text-purple-600" />
                            1.2 สินค้าเพิ่มเติม:
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {aProds.map((ap, apIdx) => (
                              <div
                                key={ap.id || apIdx}
                                className="bg-white p-2 rounded-lg border border-slate-200 flex items-center justify-between"
                              >
                                <div>
                                  <span className="font-bold text-slate-800 block">{ap.productName || "สินค้า"}</span>
                                  {ap.actualRate && (
                                    <span className="text-[11px] text-slate-500">อัตราใช้: {ap.actualRate}</span>
                                  )}
                                </div>
                                <span className="bg-purple-50 text-purple-800 font-bold px-2 py-0.5 rounded text-[11px]">
                                  {ap.quantityUsed || 1} {ap.unit || "หน่วย"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Method, Equip, Response */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-200/80">
                        <div className="bg-white p-2 rounded-lg border border-slate-100">
                          <span className="text-slate-400 block text-[10px]">วิธีการฉีดพ่น</span>
                          <span className="font-bold text-slate-800">
                            {round.sprayMethod === "TANK_MIXED" ? "ผสมถัง (Tank-mixed)" : "ฉีดเดี่ยว (Single)"}
                          </span>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-slate-100">
                          <span className="text-slate-400 block text-[10px]">อุปกรณ์ฉีดพ่น</span>
                          <span className="font-bold text-slate-800">
                            {round.sprayEquipment === "อื่นๆ ระบุ..." ? round.otherEquipment : round.sprayEquipment}
                          </span>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-slate-100">
                          <span className="text-slate-400 block text-[10px]">ผลหลังการฉีดพ่น</span>
                          <span className="font-bold text-slate-800">{round.productResponse}</span>
                        </div>
                      </div>

                      {round.problemDetail && (
                        <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-200 text-amber-900">
                          <span className="font-semibold block text-[11px]">รายละเอียดปัญหา:</span>
                          <p>{round.problemDetail}</p>
                        </div>
                      )}

                      {/* Round Images */}
                      {round.roundImages && round.roundImages.length > 0 && (
                        <div className="space-y-1.5 pt-1 border-t border-slate-200/80">
                          <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                            <Camera className="w-3 h-3 text-emerald-600" />
                            รูปถ่ายการฉีดพ่นรอบนี้ ({round.roundImages.length} รูป):
                          </span>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {round.roundImages.map((img: any, i: number) => (
                              <a
                                key={img.id || i}
                                href={img.url || img.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="group block relative aspect-video rounded-lg overflow-hidden border border-slate-200 bg-slate-100"
                              >
                                <img
                                  src={img.url || img.fileUrl}
                                  alt={img.name || img.fileName || `round-photo-${i}`}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {actualResult.t7NextSprayDate && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                  <span className="text-slate-500 block text-[11px]">กำหนดฉีดพ่นครั้งถัดไป</span>
                  <span className="font-bold text-slate-800 text-sm">{actualResult.t7NextSprayDate}</span>
                </div>
              )}

              {actualResult.t7Notes && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1">
                  <span className="font-semibold text-slate-600 block text-[11px]">
                    ข้อสังเกตหรือข้อมูลเพิ่มเติม
                  </span>
                  <p className="text-slate-800 whitespace-pre-line leading-relaxed">{actualResult.t7Notes}</p>
                </div>
              )}
            </div>
          ) : (
            /* Backward-compatible block if no rounds array */
            <div className="bg-white rounded-2xl border border-emerald-200 p-4 sm:p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-emerald-100 pb-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h4 className="font-bold text-slate-900 text-sm sm:text-base">ผลการติดตามจริงหน้างาน</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                {actualResult.t7CropCondition && (
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-slate-500 block text-[11px]">สภาพแปลง</span>
                    <span className="font-bold text-slate-800">{actualResult.t7CropCondition}</span>
                  </div>
                )}
                {actualResult.t7GrowthStage && (
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-slate-500 block text-[11px]">ระยะพืช</span>
                    <span className="font-bold text-slate-800">{actualResult.t7GrowthStage}</span>
                  </div>
                )}
                {actualResult.t7ProductResponse && (
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-slate-500 block text-[11px]">การตอบสนอง</span>
                    <span className="font-bold text-slate-800">{actualResult.t7ProductResponse}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section 3: สถานะแปลงสาธิต */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h4 className="font-bold text-slate-900 text-sm sm:text-base">สถานะแปลงสาธิต</h4>
            </div>
            <div className="text-xs">
              <span className="text-slate-500 block text-[11px]">สถานะการตรวจรอบนี้:</span>
              <span className="font-bold text-slate-800 text-sm">
                {actualResult.t7PlotStatus === "COMPLETED"
                  ? "เสร็จสิ้น/ปิดแปลงสาธิต"
                  : actualResult.t7PlotStatus === "CANCELLED" || actualResult.t7PlotStatus === "FAILED"
                    ? "ยกเลิก/ยุติแปลงสาธิต"
                    : "อยู่ระหว่างการทดลอง (ยังคงติดตามต่อ)"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Backward-compatible alias
export const DetailType7FollowUp = Type7bDetailView;
export const DetailType7bDemo = Type7bDetailView;
