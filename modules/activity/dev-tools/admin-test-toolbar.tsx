"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Wand2,
  SearchCheck,
  Zap,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ShieldCheck,
  FileEdit,
  Eye,
  ClipboardCheck,
} from "lucide-react";
import { toast } from "sonner";
import {
  WORK_TYPE_CONFIG,
  UNPLANNED_EXCLUDED_WORK_TYPE_CODES,
} from "@/modules/activity/constants";
import { forceApproveActivityPlanForTestAction } from "@/modules/activity/server";
import { useIsAdminTester } from "./use-is-admin-tester";
import {
  type HydrationInspectionReport,
  getAutoRedirectInspectPref,
  setAutoRedirectInspectPref,
} from "./snapshot-storage";

export interface AdminTestToolbarProps {
  mode: "PLANNED_CREATE" | "PLANNED_EDIT" | "ACTUAL" | "UNPLANNED_CREATE" | "UNPLANNED_EDIT" | "DETAIL";
  planId?: string;
  planStatus?: string;
  planType?: string;
  selectedWorkTypeCodes?: string[];
  onAutoFill?: (targetCodes: string[]) => void;
  onRunInspection?: () => HydrationInspectionReport;
}

export function AdminTestToolbar({
  mode,
  planId,
  planStatus,
  planType,
  selectedWorkTypeCodes = [],
  onAutoFill,
  onRunInspection,
}: AdminTestToolbarProps) {
  const { isAdminTester, isLoading } = useIsAdminTester();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [quickWorkType, setQuickWorkType] = useState<string>("USE_CURRENT");
  const [autoRedirectInspect, setAutoRedirectInspect] = useState<boolean>(true);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);
  const [report, setReport] = useState<HydrationInspectionReport | null>(null);
  const [filterStatus, setFilterStatus] = useState<"ALL" | "FAIL" | "PASS">("ALL");
  const [isApproving, setIsApproving] = useState<boolean>(false);

  useEffect(() => {
    setAutoRedirectInspect(getAutoRedirectInspectPref());
  }, []);

  const handleToggleRedirectPref = (checked: boolean) => {
    setAutoRedirectInspect(checked);
    setAutoRedirectInspectPref(checked);
  };

  const runScan = useCallback(() => {
    if (!onRunInspection) return;
    // Slight delay to ensure DOM inputs have settled
    setTimeout(() => {
      const res = onRunInspection();
      setReport(res);
      setIsInspectorOpen(true);
    }, 80);
  }, [onRunInspection]);

  // Auto-run inspection if URL has ?inspect=1 or when opening Edit/Actual page
  useEffect(() => {
    if (!isAdminTester || !onRunInspection) return;
    const inspectParam = searchParams?.get("inspect");
    if (inspectParam === "1") {
      const timer = setTimeout(() => {
        const res = onRunInspection();
        setReport(res);
        setIsInspectorOpen(true);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isAdminTester, onRunInspection, searchParams]);

  // Strict guard: ONLY administrator can see this toolbar
  if (isLoading || !isAdminTester) {
    return null;
  }

  const isUnplannedMode =
    mode === "UNPLANNED_CREATE" ||
    mode === "UNPLANNED_EDIT" ||
    planType === "UNPLANNED";

  const availableWorkTypes = Object.values(WORK_TYPE_CONFIG).filter((wt) => {
    if (isUnplannedMode) {
      return !(UNPLANNED_EXCLUDED_WORK_TYPE_CODES as readonly string[]).includes(
        wt.code,
      );
    }
    return true;
  });

  const handleTriggerAutoFill = () => {
    if (!onAutoFill) return;

    let targets: string[] = [];
    if (quickWorkType === "USE_CURRENT") {
      targets =
        selectedWorkTypeCodes.length > 0 ? selectedWorkTypeCodes : ["TYPE_1"];
    } else if (quickWorkType === "ALL_PLANNED") {
      targets = availableWorkTypes.map((w) => w.code);
    } else {
      targets = [quickWorkType];
    }

    onAutoFill(targets);
    toast.success(
      `🪄 กรอกข้อมูลทดสอบ (${targets.join(", ")}) ครบทุกช่องเรียบร้อย!`,
      {
        description:
          "คุณสามารถกดปุ่มบันทึกเพื่อทดสอบการดึงข้อมูลกลับมาแสดงในช่อง UI ได้ทันที",
      },
    );

    if (onRunInspection) {
      setTimeout(() => {
        const res = onRunInspection();
        setReport(res);
      }, 150);
    }
  };

  const handleForceApproveAndGoActual = async () => {
    if (!planId) return;
    setIsApproving(true);
    try {
      if (planStatus !== "APPROVED" && planStatus !== "COMPLETED") {
        const res = await forceApproveActivityPlanForTestAction(planId);
        if (!res.success) {
          toast.error(res.error || "ไม่สามารถอนุมัติแผนงานอัตโนมัติได้");
          setIsApproving(false);
          return;
        }
        toast.success("⚡ เปลี่ยนสถานะแผนงานเป็น APPROVED สำหรับทดสอบเรียบร้อย!");
      }
      router.push(`/activity-plans/${planId}/actual?inspect=1`);
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || "เกิดข้อผิดพลาด");
    } finally {
      setIsApproving(false);
    }
  };

  const modeLabelMap: Record<AdminTestToolbarProps["mode"], string> = {
    PLANNED_CREATE: "1. หน้าสร้างแผนงาน (Create Trip Plan)",
    PLANNED_EDIT: "1. หน้าแก้ไข/ตรวจสอบแผนงาน (Edit Trip Plan)",
    ACTUAL: "2. หน้าบันทึกผลการปฏิบัติงาน (Trip Plan Actual)",
    UNPLANNED_CREATE: "3. หน้าสร้างกิจกรรมนอกแผน (Create Unplanned)",
    UNPLANNED_EDIT: "3. หน้าแก้ไข/ตรวจสอบกิจกรรมนอกแผน (Edit Unplanned)",
    DETAIL: "หน้ารายละเอียดแผนงาน (Activity Detail)",
  };

  const filteredItems =
    report?.items.filter((item) => {
      if (filterStatus === "FAIL") return item.status === "FAIL";
      if (filterStatus === "PASS") return item.status === "PASS";
      return true;
    }) || [];

  return (
    <div className="mb-6 rounded-2xl border-2 border-indigo-500/40 bg-gradient-to-r from-indigo-950/90 via-slate-900/95 to-teal-950/90 p-4 text-white shadow-lg">
      {/* Top Bar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20 border border-indigo-400/40 text-indigo-300">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/30 border border-indigo-400/50 px-2.5 py-0.5 text-xs font-bold text-indigo-200">
                Administrator Only
              </span>
              <span className="text-sm font-bold text-white">
                เครื่องมือช่วยทดสอบและเช็คข้อมูลหน้าบ้าน (UI Hydration Inspector)
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-300">
              โหมดปัจจุบัน:{" "}
              <span className="font-semibold text-teal-300">
                {modeLabelMap[mode]}
              </span>
              {planId && (
                <span className="ml-2 text-slate-400">
                  (ID: {planId.slice(0, 8)}... | สถานะ: {planStatus || "DRAFT"})
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {onAutoFill && (
            <>
              {mode !== "ACTUAL" && (
                <select
                  value={quickWorkType}
                  onChange={(e) => setQuickWorkType(e.target.value)}
                  className="h-9 rounded-lg border border-indigo-400/40 bg-slate-800/90 px-2.5 text-xs font-medium text-white focus:border-teal-400 focus:outline-none"
                >
                  <option value="USE_CURRENT">
                    🎯 ใช้ประเภทงานที่ติ๊กเลือกอยู่ตอนนี้ (
                    {selectedWorkTypeCodes.length > 0
                      ? selectedWorkTypeCodes.join(", ")
                      : "TYPE_1"}
                    )
                  </option>
                  {!isUnplannedMode && (
                    <option value="ALL_PLANNED">
                      🔥 เลือกและกรอกครบทุกประเภทงานพร้อมกัน (All 15 Types)
                    </option>
                  )}
                  {availableWorkTypes.map((wt) => (
                    <option key={wt.code} value={wt.code}>
                      เลือกและกรอกเฉพาะ {wt.code}: {wt.name}
                    </option>
                  ))}
                </select>
              )}

              <button
                type="button"
                onClick={handleTriggerAutoFill}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-gradient-to-r from-teal-500 to-emerald-600 px-3.5 text-xs font-bold text-white shadow-sm hover:from-teal-400 hover:to-emerald-500 transition-all cursor-pointer"
              >
                <Wand2 className="h-4 w-4" />
                <span>กรอกข้อมูลทดสอบอัตโนมัติ (Auto-Fill)</span>
              </button>
            </>
          )}

          {onRunInspection && (
            <button
              type="button"
              onClick={() => {
                if (!isInspectorOpen) {
                  runScan();
                } else {
                  setIsInspectorOpen(false);
                }
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-amber-400/50 bg-amber-500/20 px-3.5 text-xs font-bold text-amber-200 hover:bg-amber-500/30 transition-all cursor-pointer"
            >
              <SearchCheck className="h-4 w-4" />
              <span>
                {isInspectorOpen
                  ? "ซ่อนตารางเช็คข้อมูล UI"
                  : "เช็คข้อมูลในช่อง UI ว่าดึงมาครบไหม"}
              </span>
              {isInspectorOpen ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Second Row: Redirect Toggle & Quick Jump Links */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-700/80 pt-2.5 text-xs">
        <label className="inline-flex items-center gap-2 cursor-pointer select-none text-slate-200">
          <input
            type="checkbox"
            checked={autoRedirectInspect}
            onChange={(e) => handleToggleRedirectPref(e.target.checked)}
            className="h-4 w-4 rounded border-slate-500 text-teal-500 focus:ring-teal-500"
          />
          <span>
            🚀 <strong>หลังกดบันทึก</strong> ให้พาไปหน้า{" "}
            <span className="text-teal-300 underline">
              แก้ไข/เช็คข้อมูลในช่อง UI ทันที
            </span>{" "}
            (ไม่ต้องกลับหน้ารวมรายการ)
          </span>
        </label>

        {planId && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400">ลัดไปหน้า:</span>
            {mode !== "DETAIL" && (
              <button
                type="button"
                onClick={() => router.push(`/activity-plans/${planId}`)}
                className="inline-flex items-center gap-1 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-600 px-2.5 py-1 text-xs font-medium text-slate-200 cursor-pointer"
              >
                <Eye className="h-3.5 w-3.5 text-sky-400" />
                <span>ดูรายละเอียด (Detail)</span>
              </button>
            )}

            {mode !== "PLANNED_EDIT" && mode !== "UNPLANNED_EDIT" && (
              <button
                type="button"
                onClick={() =>
                  router.push(
                    isUnplannedMode
                      ? `/activity-plans/unplanned/${planId}/edit?inspect=1`
                      : `/activity-plans/${planId}/edit?inspect=1`,
                  )
                }
                className="inline-flex items-center gap-1 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-600 px-2.5 py-1 text-xs font-medium text-slate-200 cursor-pointer"
              >
                <FileEdit className="h-3.5 w-3.5 text-amber-400" />
                <span>หน้าแก้ไขแผน (เช็คช่อง UI)</span>
              </button>
            )}

            {!isUnplannedMode && mode !== "ACTUAL" && (
              <button
                type="button"
                disabled={isApproving}
                onClick={handleForceApproveAndGoActual}
                className="inline-flex items-center gap-1 rounded-md bg-purple-600/80 hover:bg-purple-600 border border-purple-400/50 px-2.5 py-1 text-xs font-bold text-white cursor-pointer disabled:opacity-50"
              >
                <Zap className="h-3.5 w-3.5 text-yellow-300" />
                <span>
                  {isApproving
                    ? "กำลังอนุมัติ..."
                    : planStatus === "APPROVED" || planStatus === "COMPLETED"
                      ? "ไปหน้าบันทึกผล (Actual) + เช็ค UI"
                      : "Force Approve & ไปหน้าบันทึกผล (Actual)"}
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Expandable Hydration Inspector Report */}
      {isInspectorOpen && report && (
        <div className="mt-4 rounded-xl border border-slate-700 bg-slate-950/95 p-4 text-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-sm font-bold">
                <ClipboardCheck className="h-4 w-4 text-teal-400" />
                <span>ผลการตรวจเช็คข้อมูลในช่อง UI (ตรวจเมื่อ {report.checkedAt})</span>
              </div>

              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-xs font-bold text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5" />
                ดึงมาครบ: {report.passedFields}/{report.totalFields} ช่อง
              </span>

              {report.failedFields > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 border border-rose-500/40 px-2.5 py-0.5 text-xs font-bold text-rose-300">
                  <XCircle className="h-3.5 w-3.5" />
                  ตกหล่น/ไม่ตรง: {report.failedFields} ช่อง
                </span>
              )}

              {report.warnFields > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 text-xs font-bold text-amber-300">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  ช่องว่าง: {report.warnFields} ช่อง
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border border-slate-700 bg-slate-900 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setFilterStatus("ALL")}
                  className={`rounded-md px-2.5 py-1 font-medium cursor-pointer ${
                    filterStatus === "ALL"
                      ? "bg-indigo-600 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  ทั้งหมด ({report.totalFields})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStatus("FAIL")}
                  className={`rounded-md px-2.5 py-1 font-medium cursor-pointer ${
                    filterStatus === "FAIL"
                      ? "bg-rose-600 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  เฉพาะที่ตกหล่น ({report.failedFields})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStatus("PASS")}
                  className={`rounded-md px-2.5 py-1 font-medium cursor-pointer ${
                    filterStatus === "PASS"
                      ? "bg-emerald-600 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  ดึงครบ ({report.passedFields})
                </button>
              </div>

              <button
                type="button"
                onClick={runScan}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>สแกนซ้ำ</span>
              </button>
            </div>
          </div>

          <div className="mt-3 max-h-80 overflow-y-auto rounded-lg border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-900 text-slate-300 border-b border-slate-800">
                <tr>
                  <th className="py-2 px-3 font-semibold">หมวด / ช่องข้อมูล</th>
                  <th className="py-2 px-3 font-semibold">
                    ค่าที่บันทึกไว้ / ค่าใน DB
                  </th>
                  <th className="py-2 px-3 font-semibold">
                    ค่าที่ดึงเข้าช่อง UI ปัจจุบัน
                  </th>
                  <th className="py-2 px-3 font-semibold text-center">
                    แสดงบนหน้าจอ (DOM)
                  </th>
                  <th className="py-2 px-3 font-semibold text-right">
                    สถานะการดึงข้อมูล
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-6 text-center text-slate-400"
                    >
                      ไม่พบรายการในตัวกรองนี้
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-900/60 transition-colors"
                    >
                      <td className="py-2 px-3">
                        <div className="font-semibold text-white">
                          {item.label}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {item.section} •{" "}
                          <code className="text-indigo-300">
                            {item.fieldKey}
                          </code>
                        </div>
                      </td>
                      <td className="py-2 px-3 text-slate-300 max-w-[220px] truncate">
                        {item.expectedValue}
                      </td>
                      <td className="py-2 px-3 font-medium text-teal-300 max-w-[220px] truncate">
                        {item.actualUiValue}
                      </td>
                      <td className="py-2 px-3 text-center">
                        {item.domMatched ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                            ✅ พบในช่อง Input/UI
                          </span>
                        ) : item.actualUiValue !== "(ว่าง)" ? (
                          <span className="inline-flex items-center gap-1 text-sky-300">
                            ☑️ มีใน React State
                          </span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-right">
                        {item.status === "PASS" && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 font-bold text-emerald-300">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            ครบถ้วน
                          </span>
                        )}
                        {item.status === "FAIL" && (
                          <span
                            title={item.note}
                            className="inline-flex items-center gap-1 rounded-md bg-rose-500/20 border border-rose-500/40 px-2 py-0.5 font-bold text-rose-300"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            ตกหล่น/ไม่ตรง
                          </span>
                        )}
                        {item.status === "WARN" && (
                          <span
                            title={item.note}
                            className="inline-flex items-center gap-1 rounded-md bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 font-medium text-amber-300"
                          >
                            <AlertTriangle className="h-3.5 w-3.5" />
                            ว่างเปล่า
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
