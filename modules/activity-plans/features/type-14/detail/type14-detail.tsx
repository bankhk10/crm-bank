"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Clock,
  Layers,
  MapPin,
  ExternalLink,
  Store,
  User,
  Calendar,
  Eye,
  X,
  FileText,
  Camera,
  ChevronDown,
  ChevronRight,
  Beaker,
  Package,
  PackageCheck,
  History,
  Loader2,
  Droplets,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Type14PlanInput } from "../shared/types";
import { getHattackPlotContextAction } from "../../../server/actions";
import type {
  FormattedProduct,
  FormattedFollowUpRound,
  Type14DetailProps,
} from "./types";

export type { FormattedProduct, FormattedFollowUpRound, Type14DetailProps };

function formatThaiDate(d?: string | Date | null): string {
  if (!d) return "-";
  try {
    const date = typeof d === "string" ? new Date(d) : d;
    if (isNaN(date.getTime())) return String(d);
    return date.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return String(d);
  }
}

export function Type14Detail({ data, planSummary, plan }: Type14DetailProps) {
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Expand / Collapse state per round (Default is Collapse)
  const [expandedRounds, setExpandedRounds] = useState<Record<number, boolean>>({});

  // Historical spray history for this demo plot (Read-Only Reference from TYPE13)
  const [sprayHistory, setSprayHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Withdrawn products for TYPE_14 (General Plan Requisition)
  const withdrawnProducts = useMemo(() => {
    return (plan?.products || []).filter(
      (p: any) => p.workTypeCode === "TYPE_14",
    );
  }, [plan?.products]);

  const demoPlotId =
    data?.demoPlotId ||
    plan?.demoPlot?.id ||
    plan?.demoPlotVisits?.[0]?.demoPlotId;

  // Load Historical Spray History (Reference from TYPE13)
  useEffect(() => {
    if (!demoPlotId) return;
    let active = true;
    setLoadingHistory(true);
    getHattackPlotContextAction(demoPlotId, plan?.id)
      .then((res) => {
        if (active && res.success && res.sprayHistory) {
          setSprayHistory(res.sprayHistory);
        }
      })
      .catch((err) => {
        console.error("Failed to load plot spray history:", err);
      })
      .finally(() => {
        if (active) setLoadingHistory(false);
      });
    return () => {
      active = false;
    };
  }, [demoPlotId, plan?.id]);

  // Extract Actual Follow-Up Rounds (Source of Truth: ActivityPlan TYPE14 -> ActivityResult -> SprayRound)
  const actualRounds: FormattedFollowUpRound[] = useMemo(() => {
    const rawRounds = (plan?.result?.sprayRounds || [])
      .filter((r: any) => r.workTypeCode === "TYPE_14" || !r.workTypeCode)
      .sort((a: any, b: any) => (a.roundNumber || 1) - (b.roundNumber || 1));

    if (rawRounds.length > 0) {
      return rawRounds.map((r: any, idx: number) => {
        const rNum = r.roundNumber || idx + 1;
        const matchingVisit = (plan?.demoPlotVisits || []).find(
          (v: any) => v.visitNumber === rNum,
        );

        // Days since start: prioritize round's daysSinceStart
        const daysSinceStart =
          r.daysSinceStart != null
            ? r.daysSinceStart
            : matchingVisit?.daysSinceStart ?? 0;

        // Group classification (Requirement 4)
        const rawProducts: any[] = r.products || [];
        const mapProduct = (
          p: any,
          group: "ORIGINAL" | "SUPPLEMENTAL" | "ACTUAL_ONLY",
        ): FormattedProduct => {
          let withdrawnQty: number | null = null;
          if (group === "ORIGINAL") {
            const withdrawalItem =
              p.drugWithdrawalItem ||
              plan?.drugWithdrawal?.items?.find(
                (it: any) => it.id === p.drugWithdrawalItemId,
              );
            if (withdrawalItem && withdrawalItem.quantity != null) {
              withdrawnQty = Number(withdrawalItem.quantity);
            } else {
              const matchedPlanProduct = (withdrawnProducts || []).find(
                (it: any) => it.productId === p.productId,
              );
              if (matchedPlanProduct) {
                withdrawnQty =
                  Number(
                    matchedPlanProduct.targetQuantity ??
                      matchedPlanProduct.quantity,
                  ) || 0;
              }
            }
          } else if (group === "SUPPLEMENTAL") {
            const suppItem =
              p.supplementalDrugWithdrawalItem ||
              (plan?.supplementalDrugWithdrawals || [])
                .flatMap((w: any) => w.items || [])
                .find(
                  (it: any) => it.id === p.supplementalDrugWithdrawalItemId,
                );
            if (suppItem && suppItem.quantity != null) {
              withdrawnQty = Number(suppItem.quantity);
            }
          }

          return {
            productId: p.productId,
            productName: p.productName || p.product?.name || "สินค้า",
            withdrawnQuantity: withdrawnQty,
            quantityUsed:
              p.quantityUsed != null && p.quantityUsed !== ""
                ? Number(p.quantityUsed)
                : "-",
            unit: p.unit || p.product?.unit || "ขวด",
            actualRate: p.actualRate || "-",
            detail: p.detail || "-",
            sourceGroup: group,
          };
        };

        const planProductIds = new Set(
          (withdrawnProducts || []).map((p: any) => p.productId),
        );

        // Group A: drugWithdrawalItemId != null OR matches plan-level requisition
        const groupA = rawProducts
          .filter(
            (p: any) =>
              (p.drugWithdrawalItemId != null ||
                planProductIds.has(p.productId)) &&
              p.supplementalDrugWithdrawalItemId == null,
          )
          .map((p: any) => mapProduct(p, "ORIGINAL"));

        // Group B: supplementalDrugWithdrawalItemId != null
        const groupB = rawProducts
          .filter((p: any) => p.supplementalDrugWithdrawalItemId != null)
          .map((p: any) => mapProduct(p, "SUPPLEMENTAL"));

        // Group C: drugWithdrawalItemId == null && supplementalDrugWithdrawalItemId == null && not in Group A
        const groupC = rawProducts
          .filter(
            (p: any) =>
              p.drugWithdrawalItemId == null &&
              p.supplementalDrugWithdrawalItemId == null &&
              !planProductIds.has(p.productId),
          )
          .map((p: any) => mapProduct(p, "ACTUAL_ONLY"));

        // Attachments for this round
        const roundAttachments = [
          ...(r.attachments || []),
          ...(rNum === 1
            ? (plan?.result?.attachments || []).filter(
                (a: any) =>
                  a.workTypeCode === "TYPE_14" &&
                  (!a.sprayRoundId || a.sprayRoundId === r.id),
              )
            : []),
        ];

        return {
          id: r.id,
          roundNumber: rNum,
          visitDate: r.sprayDate,
          daysSinceStart,
          productResponse:
            r.productResponse || matchingVisit?.productResponse || "",
          notes: r.notes || matchingVisit?.notes || "",
          groupA,
          groupB,
          groupC,
          attachments: roundAttachments,
        };
      });
    }

    // Fallback: If no actual spray rounds recorded yet, fall back to planned trackings
    if (data?.trackings && data.trackings.length > 0) {
      return data.trackings.map((t: any, idx: number) => ({
        id: t.id,
        roundNumber: idx + 1,
        visitDate: t.visitDate,
        daysSinceStart: t.daysSinceStart ?? 0,
        productResponse: "",
        notes: t.notes || "",
        groupA: [],
        groupB: [],
        groupC: [],
        attachments: t.attachments || [],
      }));
    }

    return [];
  }, [
    plan?.result?.sprayRounds,
    plan?.result?.attachments,
    plan?.demoPlotVisits,
    plan?.drugWithdrawal,
    plan?.supplementalDrugWithdrawals,
    data?.trackings,
  ]);

  if (!data) {
    return (
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 text-center">
        ไม่มีข้อมูลการติดตามแปลงแฮตแทค
      </div>
    );
  }

  const hasCoords = Boolean(data.latitude?.trim() && data.longitude?.trim());

  const toggleRound = (roundNumber: number) => {
    setExpandedRounds((prev) => ({
      ...prev,
      [roundNumber]: !prev[roundNumber],
    }));
  };

  const allExpanded =
    actualRounds.length > 0 &&
    actualRounds.every((r) => expandedRounds[r.roundNumber]);

  const toggleAll = () => {
    const nextState = !allExpanded;
    const updated: Record<number, boolean> = {};
    actualRounds.forEach((r) => {
      updated[r.roundNumber] = nextState;
    });
    setExpandedRounds(updated);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 space-y-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
            14
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-sm sm:text-base">
              ติดตามแปลงแฮทแทค (TYPE_14)
            </h4>
            <p className="text-xs text-slate-500">
              รายละเอียดแปลงแฮตแทคและประวัติการตรวจติดตามผลจริง
            </p>
          </div>
        </div>

        <Badge
          variant="outline"
          className="text-xs px-2.5 py-1 font-semibold rounded-lg bg-purple-50 text-purple-700 border-purple-200 self-start sm:self-auto"
        >
          {data.mode === "EXISTING_PLOT"
            ? "แปลงเดิม (Existing Plot)"
            : "แปลงใหม่ (New Plot)"}
        </Badge>
      </div>

      {/* Plot Overview Card */}
      <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-600" />
            <h5 className="font-bold text-sm text-slate-800">
              {data.name || "แปลงแฮตแทค"}
            </h5>
          </div>

          {hasCoords && (
            <a
              href={`https://www.google.com/maps?q=${data.latitude},${data.longitude}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 font-semibold px-2 py-1 rounded-lg hover:bg-purple-50 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>เปิดดูแผนที่ Google Maps</span>
            </a>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {/* Dealer */}
          <div className="p-2.5 bg-white rounded-xl border border-slate-100 space-y-0.5">
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
              <Store className="w-3 h-3 text-slate-400" />
              ร้านค้าตัวแทนจำหน่าย (Dealer):
            </span>
            <span className="font-bold text-slate-800 truncate block">
              {data.storeId || "-"}
            </span>
          </div>

          {/* Farmer Owner */}
          <div className="p-2.5 bg-white rounded-xl border border-slate-100 space-y-0.5">
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
              <User className="w-3 h-3 text-slate-400" />
              เกษตรกรเจ้าของแปลง:
            </span>
            <span className="font-bold text-slate-800 truncate block">
              {data.ownerName || "-"}
            </span>
          </div>

          {/* Location */}
          <div className="p-2.5 bg-white rounded-xl border border-slate-100 space-y-0.5">
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-400" />
              พื้นที่ (อำเภอ, จังหวัด):
            </span>
            <span className="font-bold text-slate-800 truncate block">
              {data.district || planSummary?.district || "-"},{" "}
              {data.province || planSummary?.province || "-"}
            </span>
          </div>

          {/* GPS Coordinates */}
          <div className="p-2.5 bg-white rounded-xl border border-slate-100 space-y-0.5">
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-400" />
              พิกัด GPS:
            </span>
            <span className="font-bold text-purple-700 truncate block">
              {hasCoords
                ? `${data.latitude}, ${data.longitude}`
                : "ยังไม่ได้ระบุพิกัด"}
            </span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          1.2 รายการสินค้าที่ขอเบิก (TYPE_14 Requested Products)
      ───────────────────────────────────────────────────────────── */}
      <div className="space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
              <PackageCheck className="w-4 h-4" />
            </div>
            <div>
              <h5 className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-2">
                <span>รายการสินค้าที่ขอเบิก</span>
                <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                  {withdrawnProducts.length} รายการ
                </span>
              </h5>
              <p className="text-2xs text-slate-500">
                รายการสินค้าสาธิตที่ขอเบิกสำหรับงานติดตามแปลงแฮทแทคในแผนงานนี้
              </p>
            </div>
          </div>
        </div>

        {withdrawnProducts.length === 0 ? (
          <div className="p-3.5 bg-slate-50/70 border border-slate-200/60 rounded-xl text-xs text-slate-400 italic text-center">
            ไม่มีการขอเบิกสินค้าสำหรับแผนงานนี้
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200/80 bg-white shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-semibold">
                <tr>
                  <th className="py-2.5 px-3 w-12 text-center">ลำดับ</th>
                  <th className="py-2.5 px-3">รายการสินค้า</th>
                  <th className="py-2.5 px-3 w-28 text-center">รหัสสินค้า</th>
                  <th className="py-2.5 px-3 w-36 text-center">จำนวนที่ขอเบิก</th>
                  <th className="py-2.5 px-3 w-28 text-center">หน่วยบรรจุ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {withdrawnProducts.map((p: any, idx: number) => {
                  const pName = p.productName || p.product?.name || "สินค้า";
                  const pCode = p.product?.productCode || "-";
                  const qty = p.targetQuantity != null ? p.targetQuantity : "-";
                  const unit =
                    p.product?.unit || p.product?.packageSizeUnit || "ขวด";

                  return (
                    <tr
                      key={p.id || idx}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="py-2.5 px-3 text-center text-slate-400 font-medium">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        {pName}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-500">
                        {pCode}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md text-xs border border-purple-200/70">
                          {qty}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-600 font-medium">
                        {unit}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          1.5 ประวัติการฉีดพ่นจริง (Read-Only Reference จาก TYPE13)
      ───────────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h5 className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-2">
                <span>ประวัติการฉีดพ่นจริง</span>
                <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  Read-Only (ประวัติย้อนหลัง)
                </span>
              </h5>
              <p className="text-2xs text-slate-500">
                ข้อมูลผลการฉีดพ่นจริงจากกิจกรรมก่อนหน้าของแปลงนี้ (อ้างอิงเพื่อการติดตามผล)
              </p>
            </div>
          </div>
          {loadingHistory && (
            <div className="flex items-center gap-1.5 text-xs text-purple-600 animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>กำลังโหลดประวัติ...</span>
            </div>
          )}
        </div>

        {!demoPlotId ? (
          <p className="text-xs text-slate-400 italic py-1">
            ไม่มีข้อมูลแปลงเพื่อแสดงประวัติการฉีดพ่นจริง
          </p>
        ) : sprayHistory.length === 0 && !loadingHistory ? (
          <p className="text-xs text-slate-400 italic py-1">
            ไม่พบประวัติการฉีดพ่นจริงก่อนหน้านี้สำหรับแปลงนี้
          </p>
        ) : (
          <div className="space-y-3">
            {sprayHistory.map((hist, idx) => (
              <div
                key={hist.id || idx}
                className="rounded-xl border border-slate-200/80 bg-gradient-to-br from-slate-50/70 to-amber-50/20 p-4 space-y-3"
              >
                {/* Header: ครั้งที่, วันที่, TP, ประเภท */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold text-xs">
                      ครั้งที่ {hist.roundNumber || idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-slate-700">
                      วันที่ฉีดพ่น:{" "}
                      <span className="font-bold text-slate-900">
                        {formatThaiDate(hist.sprayDate)}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-2xs text-slate-600">
                    <div>
                      <span className="text-slate-400">เลขที่ TP: </span>
                      <span className="font-semibold text-slate-800">
                        {hist.activityPlanCode || "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">ประเภท: </span>
                      <span className="font-semibold text-slate-800">
                        {hist.activityTypeName || "ฉีดแปลงแฮตแทค"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* รายการสินค้าที่ใช้จริง */}
                {hist.products && hist.products.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-2xs font-bold text-slate-700 block uppercase tracking-wider">
                      รายการสินค้าที่ใช้จริง:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {hist.products.map((p: any, pIdx: number) => (
                        <div
                          key={p.id || pIdx}
                          className="bg-white rounded-lg border border-slate-200/80 p-2.5 text-xs flex flex-col justify-between shadow-2xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-slate-800">
                              {p.productName}
                            </span>
                            <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-2xs border border-amber-200">
                              ใช้จริง {p.quantityUsed} {p.unit}
                            </span>
                          </div>
                          {(p.actualRate || p.detail) && (
                            <div className="mt-1 pt-1 border-t border-slate-100 text-2xs text-slate-500 space-y-0.5">
                              {p.actualRate && (
                                <div>
                                  <span className="text-slate-400">
                                    อัตรา:{" "}
                                  </span>
                                  {p.actualRate}
                                </div>
                              )}
                              {p.detail && (
                                <div>
                                  <span className="text-slate-400">
                                    รายละเอียด:{" "}
                                  </span>
                                  {p.detail}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ผลการฉีดพ่น */}
                {hist.productResponse && (
                  <div className="pt-1 text-xs">
                    <span className="text-2xs font-bold text-slate-700 block mb-0.5 uppercase tracking-wider">
                      ผลการฉีดพ่น:
                    </span>
                    <p className="text-slate-700 bg-white/80 p-2.5 rounded-lg border border-slate-200/60 whitespace-pre-line text-xs">
                      {hist.productResponse}
                    </p>
                  </div>
                )}

                {/* หมายเหตุ */}
                {hist.notes && (
                  <div className="text-xs">
                    <span className="text-2xs font-bold text-slate-700 block mb-0.5 uppercase tracking-wider">
                      หมายเหตุ:
                    </span>
                    <p className="text-slate-600 bg-white/80 p-2 rounded-lg border border-slate-200/60 text-2xs">
                      {hist.notes}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. ประวัติการติดตามผล (TYPE14 Actual Rounds - Source of Truth)
      ───────────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-600" />
            <h5 className="font-bold text-xs sm:text-sm text-slate-800">
              ประวัติการติดตามผล ({actualRounds.length} ครั้ง)
            </h5>
          </div>

          {actualRounds.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={toggleAll}
              className="h-7 text-xs text-purple-700 hover:bg-purple-50 px-2 font-medium"
            >
              {allExpanded ? "ยุบทั้งหมด" : "ขยายทั้งหมด"}
            </Button>
          )}
        </div>

        {actualRounds.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-2">
            ยังไม่มีบันทึกข้อมูลการติดตามผล
          </p>
        ) : (
          <div className="space-y-4">
            {actualRounds.map((round) => {
              const isExpanded = Boolean(expandedRounds[round.roundNumber]);
              const totalProducts =
                round.groupA.length + round.groupB.length + round.groupC.length;

              return (
                <div
                  key={round.id || round.roundNumber}
                  className="bg-purple-50/20 border border-purple-200/80 rounded-2xl overflow-hidden shadow-2xs transition-all"
                >
                  {/* Collapsible Header */}
                  <div
                    onClick={() => toggleRound(round.roundNumber)}
                    className="p-4 flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none hover:bg-purple-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                          {round.roundNumber}
                        </span>
                        <span className="font-bold text-xs sm:text-sm text-slate-800">
                          การตรวจติดตามครั้งที่ {round.roundNumber}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className="text-2xs px-2.5 py-0.5 bg-white text-slate-700 border-slate-200 flex items-center gap-1 font-semibold"
                      >
                        <Calendar className="w-3 h-3 text-purple-600" />
                        <span>วันที่: {formatThaiDate(round.visitDate)}</span>
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-2xs px-2.5 py-0.5 bg-purple-100 text-purple-800 border-purple-200 font-bold"
                      >
                        หลังฉีด {round.daysSinceStart ?? 0} วัน
                      </Badge>
                      {!isExpanded && totalProducts > 0 && (
                        <span className="text-3xs text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-150 font-medium">
                          ยา {totalProducts} รายการ
                        </span>
                      )}
                      {!isExpanded && round.attachments.length > 0 && (
                        <span className="text-3xs text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200 font-medium flex items-center gap-1">
                          <Camera className="w-2.5 h-2.5 text-purple-600" />
                          {round.attachments.length} รูป
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expanded Detail Content */}
                  {isExpanded && (
                    <div className="px-4 pb-5 sm:px-6 sm:pb-6 pt-1 space-y-5 border-t border-purple-100/80 bg-white/60">
                      {/* Section A: ข้อมูลการติดตาม */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                        <div className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-0.5">
                          <span className="text-2xs text-slate-400 font-semibold block uppercase">
                            ครั้งที่ติดตาม:
                          </span>
                          <span className="font-bold text-slate-800 text-sm">
                            ครั้งที่ {round.roundNumber}
                          </span>
                        </div>

                        <div className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-0.5">
                          <span className="text-2xs text-slate-400 font-semibold block uppercase">
                            วันที่ติดตามจริง:
                          </span>
                          <span className="font-bold text-slate-800 text-sm">
                            {formatThaiDate(round.visitDate)}
                          </span>
                        </div>

                        <div className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-0.5">
                          <span className="text-2xs text-slate-400 font-semibold block uppercase">
                            จำนวนวันหลังฉีดพ่น:
                          </span>
                          <span className="font-bold text-purple-700 text-sm">
                            {round.daysSinceStart ?? 0} วัน
                          </span>
                        </div>
                      </div>

                      {/* Section B: ยาที่ใช้ในการติดตามรอบนี้ (Group A / B / C) */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
                          <Beaker className="w-4 h-4 text-purple-600" />
                          <h6 className="font-bold text-slate-800 text-xs sm:text-sm">
                            ยาที่ใช้ในการติดตาม (รอบที่ {round.roundNumber})
                          </h6>
                        </div>

                        {totalProducts === 0 ? (
                          <p className="text-xs text-slate-400 italic bg-white p-3 rounded-xl border border-slate-100">
                            ไม่มีการบันทึกการใช้ยาในรอบนี้
                          </p>
                        ) : (
                          <div className="space-y-3.5">
                            {/* Group A: ยาจากรายการเบิกเดิม */}
                            {round.groupA.length > 0 && (
                              <div className="rounded-xl border border-blue-200/80 bg-blue-50/20 p-3.5 space-y-2.5">
                                <div className="flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center text-2xs font-bold">
                                    A
                                  </span>
                                  <span className="font-bold text-slate-800 text-xs">
                                    ยาจากรายการเบิกเดิม ({round.groupA.length}{" "}
                                    รายการ)
                                  </span>
                                </div>

                                <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                                  <table className="w-full text-xs">
                                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                                      <tr>
                                        <th className="py-2 px-3 text-left">
                                          สินค้า
                                        </th>
                                        <th className="py-2 px-3 text-center w-28">
                                          จำนวนที่เบิก
                                        </th>
                                        <th className="py-2 px-3 text-center w-32">
                                          ใช้จริงในรอบนี้
                                        </th>
                                        <th className="py-2 px-3 text-left w-36">
                                          อัตราการใช้
                                        </th>
                                        <th className="py-2 px-3 text-left">
                                          รายละเอียด
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {round.groupA.map((item, pIdx) => (
                                        <tr
                                          key={item.productId || pIdx}
                                          className="hover:bg-slate-50/50"
                                        >
                                          <td className="py-2 px-3">
                                            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                                              <Package className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                              <span>{item.productName}</span>
                                            </div>
                                          </td>
                                          <td className="py-2 px-3 text-center">
                                            <Badge
                                              variant="outline"
                                              className="font-bold text-blue-700 bg-blue-50 border-blue-200 text-2xs"
                                            >
                                              {item.withdrawnQuantity != null
                                                ? `${item.withdrawnQuantity} ${item.unit}`
                                                : "-"}
                                            </Badge>
                                          </td>
                                          <td className="py-2 px-3 text-center font-bold text-slate-800">
                                            {item.quantityUsed !== "-"
                                              ? `${item.quantityUsed} ${item.unit}`
                                              : "-"}
                                          </td>
                                          <td className="py-2 px-3 text-slate-600">
                                            {item.actualRate}
                                          </td>
                                          <td className="py-2 px-3 text-slate-600">
                                            {item.detail}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}

                            {/* Group B: รายการเบิกใหม่ในการติดตามรอบนี้ */}
                            {round.groupB.length > 0 && (
                              <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/20 p-3.5 space-y-2.5">
                                <div className="flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xs font-bold">
                                    B
                                  </span>
                                  <span className="font-bold text-slate-800 text-xs">
                                    รายการเบิกใหม่ในการติดตามรอบนี้ (
                                    {round.groupB.length} รายการ)
                                  </span>
                                </div>

                                <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                                  <table className="w-full text-xs">
                                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                                      <tr>
                                        <th className="py-2 px-3 text-left">
                                          สินค้า
                                        </th>
                                        <th className="py-2 px-3 text-center w-28">
                                          จำนวนที่เบิก
                                        </th>
                                        <th className="py-2 px-3 text-center w-32">
                                          ใช้จริงในรอบนี้
                                        </th>
                                        <th className="py-2 px-3 text-left w-36">
                                          อัตราการใช้
                                        </th>
                                        <th className="py-2 px-3 text-left">
                                          รายละเอียด
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {round.groupB.map((item, pIdx) => (
                                        <tr
                                          key={item.productId || pIdx}
                                          className="hover:bg-slate-50/50"
                                        >
                                          <td className="py-2 px-3">
                                            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                                              <Package className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                              <span>{item.productName}</span>
                                            </div>
                                          </td>
                                          <td className="py-2 px-3 text-center">
                                            <Badge
                                              variant="outline"
                                              className="font-bold text-emerald-700 bg-emerald-50 border-emerald-200 text-2xs"
                                            >
                                              {item.withdrawnQuantity != null
                                                ? `${item.withdrawnQuantity} ${item.unit}`
                                                : "-"}
                                            </Badge>
                                          </td>
                                          <td className="py-2 px-3 text-center font-bold text-slate-800">
                                            {item.quantityUsed !== "-"
                                              ? `${item.quantityUsed} ${item.unit}`
                                              : "-"}
                                          </td>
                                          <td className="py-2 px-3 text-slate-600">
                                            {item.actualRate}
                                          </td>
                                          <td className="py-2 px-3 text-slate-600">
                                            {item.detail}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}

                            {/* Group C: ยานอกแผนที่ใช้จริง */}
                            {round.groupC.length > 0 && (
                              <div className="rounded-xl border border-amber-200/80 bg-amber-50/20 p-3.5 space-y-2.5">
                                <div className="flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center text-2xs font-bold">
                                    C
                                  </span>
                                  <span className="font-bold text-slate-800 text-xs">
                                    ยานอกแผนที่ใช้จริง ({round.groupC.length}{" "}
                                    รายการ)
                                  </span>
                                </div>

                                <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                                  <table className="w-full text-xs">
                                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                                      <tr>
                                        <th className="py-2 px-3 text-left">
                                          สินค้า
                                        </th>
                                        <th className="py-2 px-3 text-center w-32">
                                          ใช้จริงในรอบนี้
                                        </th>
                                        <th className="py-2 px-3 text-left w-36">
                                          อัตราการใช้
                                        </th>
                                        <th className="py-2 px-3 text-left">
                                          รายละเอียด
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {round.groupC.map((item, pIdx) => (
                                        <tr
                                          key={item.productId || pIdx}
                                          className="hover:bg-slate-50/50"
                                        >
                                          <td className="py-2 px-3">
                                            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                                              <Package className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                              <span>{item.productName}</span>
                                            </div>
                                          </td>
                                          <td className="py-2 px-3 text-center font-bold text-slate-800">
                                            {item.quantityUsed !== "-"
                                              ? `${item.quantityUsed} ${item.unit}`
                                              : "-"}
                                          </td>
                                          <td className="py-2 px-3 text-slate-600">
                                            {item.actualRate}
                                          </td>
                                          <td className="py-2 px-3 text-slate-600">
                                            {item.detail}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Section C: ผลการติดตาม */}
                      <div className="space-y-1.5">
                        <span className="text-2xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                          <FileText className="w-3.5 h-3.5 text-purple-600" />
                          ผลการติดตาม (รอบที่ {round.roundNumber}):
                        </span>
                        {round.productResponse ? (
                          <p className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200/80 leading-relaxed whitespace-pre-line shadow-2xs">
                            {round.productResponse}
                          </p>
                        ) : (
                          <p className="text-xs text-slate-400 italic bg-white p-2.5 rounded-xl border border-slate-150">
                            -
                          </p>
                        )}
                      </div>

                      {/* Section D: รูปภาพหลังการฉีดพ่น */}
                      {round.attachments && round.attachments.length > 0 && (
                        <div className="space-y-2 pt-1">
                          <span className="text-2xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                            <Camera className="w-3.5 h-3.5 text-purple-600" />
                            รูปภาพหลังการฉีดพ่น ({round.attachments.length} รูป):
                          </span>
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                            {round.attachments.map(
                              (att: any, aIdx: number) => (
                                <div
                                  key={att.id || aIdx}
                                  className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-square shadow-2xs"
                                >
                                  <img
                                    src={att.fileUrl}
                                    alt={att.fileName || `รูปภาพ #${aIdx + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setPreviewImageUrl(att.fileUrl)
                                      }
                                      className="p-1.5 rounded-full bg-white/90 text-slate-700 hover:bg-white shadow-xs"
                                      title="ดูรูปภาพขนาดใหญ่"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      )}

                      {/* Section E: ข้อมูลเพิ่มเติม */}
                      {round.notes && round.notes.trim() !== "" && (
                        <div className="space-y-1.5">
                          <span className="text-2xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                            <FileText className="w-3.5 h-3.5 text-slate-500" />
                            ข้อมูลเพิ่มเติม (รอบที่ {round.roundNumber}):
                          </span>
                          <p className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200/80 leading-relaxed whitespace-pre-line shadow-2xs">
                            {round.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {previewImageUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setPreviewImageUrl(null)}
        >
          <div
            className="relative max-w-3xl max-h-[85vh] bg-white rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewImageUrl(null)}
              className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewImageUrl}
              alt="ดูรูปถ่ายเต็มขนาด"
              className="w-full h-auto max-h-[80vh] object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default Type14Detail;
