"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  AlertTriangle,
  Loader2,
  Users,
  ShieldCheck,
  Info,
} from "lucide-react";
import type { ActivityPlanWithRelations } from "../../../types";
import {
  approveActivityPlanAction,
  rejectActivityPlanAction,
  requestCorrectionPlanAction,
} from "../../../server/actions";

export type ApprovalActionType = "APPROVE" | "REJECT" | "REQUEST_CORRECTION";

interface ApprovalActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: ActivityPlanWithRelations | null;
  actionType: ApprovalActionType;
  onSuccess: () => void;
}

export function ApprovalActionDialog({
  open,
  onOpenChange,
  plan,
  actionType,
  onSuccess,
}: ApprovalActionDialogProps) {
  const { data: session } = useSession();
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedHelperIds, setSelectedHelperIds] = useState<string[]>([]);

  const userRoles = session?.user?.roles || [];
  const permissions = session?.user?.permissionKeys || [];
  const isAdmin =
    userRoles.includes("administrator") ||
    userRoles.includes("admin") ||
    userRoles.includes("ceo") ||
    permissions.includes("activity.manage");

  const userEmployeeId = session?.user?.employeeId;

  const isApprove = actionType === "APPROVE";
  const isReject = actionType === "REJECT";
  const isCorrection = actionType === "REQUEST_CORRECTION";

  // Filter helpers that fall under this approver's scope
  const helpersInScope = useMemo(() => {
    if (!plan || !plan.helpers || plan.helpers.length === 0) return [];

    const isCurrentLine =
      plan.status === "PENDING_LINE_APPROVAL" &&
      (isAdmin || plan.currentApproverEmployeeId === userEmployeeId);

    const isSalesAdmin =
      isAdmin ||
      (isCurrentLine &&
        plan.currentApprover?.positionTitle?.includes("บริหารงานขาย")) ||
      plan.currentApprover?.department?.code === "SA";

    const isMkt =
      isAdmin ||
      plan.currentApprover?.positionTitle?.includes("การตลาด") ||
      plan.currentApprover?.department?.code === "MKT";

    return plan.helpers.filter((h) => {
      // Only include pending helpers or unreviewed helpers
      if (h.status === "REJECTED") return false;
      if (h.status === "APPROVED") return false;

      if (isAdmin) return true;

      const dept = (
        h.employee?.department?.code ||
        h.departmentName ||
        ""
      ).toUpperCase();
      const pos = (
        h.employee?.positionTitle ||
        h.employee?.position?.name ||
        ""
      ).toLowerCase();

      const isSalesHelper =
        dept === "SA" ||
        dept === "SS" ||
        pos.includes("เซลส์") ||
        pos.includes("ส่งเสริม") ||
        pos.includes("ขาย");

      const isMktHelper = dept === "MKT" || pos.includes("การตลาด");

      if (isSalesAdmin && isSalesHelper) return true;
      if (isMkt && isMktHelper) return true;

      // Fallback: If in helper approval phase, show helpers under this user
      if (plan.status === "PENDING_HELPER_APPROVAL") {
        if (isSalesHelper) return true;
        if (isMktHelper) return true;
      }

      return false;
    });
  }, [plan, isAdmin, userEmployeeId]);

  // Default: Auto-select all helpers in scope when dialog opens
  useEffect(() => {
    if (open && helpersInScope.length > 0) {
      setSelectedHelperIds(helpersInScope.map((h) => h.employeeId));
    } else if (open) {
      setSelectedHelperIds([]);
    }
  }, [open, helpersInScope]);

  if (!plan) return null;

  const planCode = plan.code || plan.id;

  const getTitle = () => {
    if (isApprove) return "ยืนยันการอนุมัติ Trip Plan";
    if (isReject) return "ยืนยันการปฏิเสธ Trip Plan";
    return "ส่งกลับให้แก้ไข Trip Plan";
  };

  const getIcon = () => {
    if (isApprove) return <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
    if (isReject) return <XCircle className="h-5 w-5 text-red-600" />;
    return <RotateCcw className="h-5 w-5 text-amber-600" />;
  };

  const toggleHelper = (empId: string) => {
    setSelectedHelperIds((prev) =>
      prev.includes(empId)
        ? prev.filter((id) => id !== empId)
        : [...prev, empId],
    );
  };

  const handleSubmit = async () => {
    if ((isReject || isCorrection) && !comment.trim()) {
      setError(
        isReject
          ? "กรุณาระบุเหตุผลในการปฏิเสธแผนงาน"
          : "กรุณาระบุจุดที่ต้องการให้พนักงานแก้ไข",
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let res;
      if (isApprove) {
        res = await approveActivityPlanAction(
          plan.id,
          comment.trim() || undefined,
          helpersInScope.length > 0 ? selectedHelperIds : undefined,
        );
      } else if (isReject) {
        res = await rejectActivityPlanAction(plan.id, comment.trim());
      } else {
        res = await requestCorrectionPlanAction(plan.id, comment.trim());
      }

      if (res.success) {
        setComment("");
        onOpenChange(false);
        onSuccess();
      } else {
        setError(res.error || "เกิดข้อผิดพลาดในการดำเนินการ");
      }
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาดไม่คาดคิด");
    } finally {
      setLoading(false);
    }
  };

  // Responsibilities being approved
  const isLineApprover =
    plan.status === "PENDING_LINE_APPROVAL" &&
    (isAdmin || plan.currentApproverEmployeeId === userEmployeeId);
  const hasSP =
    Number(plan.salesPromotionBudgetRequested || 0) > 0 &&
    plan.salesPromotionApproved !== true;
  const hasMKT =
    Number(plan.marketingBudgetRequested || 0) > 0 &&
    plan.marketingApproved !== true;
  const isDirectorPending =
    (Number(plan.salesPromotionBudgetRequested || 0) === 0 ||
      plan.salesPromotionApproved === true) &&
    (Number(plan.marketingBudgetRequested || 0) === 0 ||
      plan.marketingApproved === true) &&
    plan.salesManagerApproved !== true;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {getIcon()}
            <DialogTitle className="text-lg font-bold">{getTitle()}</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-slate-500">
            เลขที่แผน: <span className="font-semibold text-slate-700">{planCode}</span> — {plan.title}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="py-2 text-xs">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4 py-1">
          {isApprove && (
            <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>การอนุมัติในรอบนี้รวมความรับผิดชอบของคุณ:</span>
              </div>
              <ul className="text-xs text-emerald-800 space-y-1.5 pl-6 list-disc">
                {isLineApprover && (
                  <li>
                    <strong>อนุมัติตามสายงาน (Line Approval)</strong>
                  </li>
                )}
                {hasSP && (
                  <li>
                    อนุมัติงบส่งเสริมการขาย:{" "}
                    <strong>
                      {Number(plan.salesPromotionBudgetRequested).toLocaleString()} บาท
                    </strong>
                  </li>
                )}
                {hasMKT && (
                  <li>
                    อนุมัติงบการตลาด:{" "}
                    <strong>
                      {Number(plan.marketingBudgetRequested).toLocaleString()} บาท
                    </strong>
                  </li>
                )}
                {isDirectorPending && (
                  <li>
                    อนุมัติงบประมาณภาพรวมทั้งหมด:{" "}
                    <strong>
                      {Number(plan.totalBudgetRequested || 0).toLocaleString()} บาท
                    </strong>
                  </li>
                )}
                {helpersInScope.length > 0 && (
                  <li>
                    พิจารณาพนักงานช่วยงานในสังกัด:{" "}
                    <strong>
                      เลือก {selectedHelperIds.length} / {helpersInScope.length} คน
                    </strong>
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Helper Selection Checklist */}
          {isApprove && helpersInScope.length > 0 && (
            <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <Users className="h-4 w-4 text-purple-600 shrink-0" />
                  <span>พนักงานช่วยงานในสังกัด ({helpersInScope.length} คน)</span>
                </div>
                <Badge variant="outline" className="text-[10px] font-semibold">
                  เลือก {selectedHelperIds.length} คน
                </Badge>
              </div>

              <div className="bg-amber-50 text-amber-800 text-[11px] p-2 rounded-lg border border-amber-200/60 flex items-start gap-1.5">
                <Info className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>ข้อแนะนำ:</strong> ติ๊กถูก = อนุมัติ / เอาเครื่องหมายออก = คงสถานะรออนุมัติ (Pending) ไม่ได้หมายถึงปฏิเสธ
                </span>
              </div>

              <div className="divide-y divide-slate-200/70 border border-slate-200/80 rounded-lg bg-white overflow-hidden">
                {helpersInScope.map((helper, idx) => {
                  const isChecked = selectedHelperIds.includes(helper.employeeId);
                  return (
                    <div
                      key={helper.id || idx}
                      className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Checkbox
                          id={`helper-${helper.employeeId}`}
                          checked={isChecked}
                          onCheckedChange={() => toggleHelper(helper.employeeId)}
                          disabled={loading}
                        />
                        <label
                          htmlFor={`helper-${helper.employeeId}`}
                          className="cursor-pointer min-w-0 text-xs"
                        >
                          <div className="font-semibold text-slate-900 truncate">
                            {idx + 1}. {helper.employee?.name || "พนักงาน"}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">
                            {helper.employee?.positionTitle || "-"}{" "}
                            •{" "}
                            {helper.departmentName ||
                              helper.employee?.department?.code ||
                              "ฝ่ายขาย"}
                          </div>
                        </label>
                      </div>

                      <Badge
                        variant="outline"
                        className={`text-[10px] font-semibold shrink-0 ${
                          isChecked
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {isChecked ? "จะอนุมัติ (Approved)" : "รออนุมัติ (Pending)"}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {isReject && (
            <div className="bg-red-50 text-red-800 text-xs p-3 rounded-lg border border-red-100 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                การปฏิเสธจะทำให้แผนงานนี้สิ้นสุดลงทันที และแจ้งเตือนให้ผู้สร้างทราบ
              </div>
            </div>
          )}

          {isCorrection && (
            <div className="bg-amber-50 text-amber-800 text-xs p-3 rounded-lg border border-amber-100 flex items-start gap-2">
              <RotateCcw className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                ระบบจะเปลี่ยนสถานะเป็น &quot;รอแก้ไข&quot; เพื่อให้ผู้สร้างปรับปรุงข้อมูลและส่งใหม่
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="approval-comment" className="text-xs font-semibold text-slate-700">
              {isApprove ? "หมายเหตุ / คำแนะนำ (ถ้ามี)" : "เหตุผล / สิ่งที่ต้องแก้ไข *"}
            </Label>
            <Textarea
              id="approval-comment"
              placeholder={
                isApprove
                  ? "ระบุความเห็นเพิ่มเติม..."
                  : isReject
                  ? "ระบุเหตุผลที่ไม่อนุมัติ..."
                  : "ระบุรายการที่ต้องการให้แก้ไข..."
              }
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="text-sm min-h-[85px]"
              disabled={loading}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="text-xs"
          >
            ยกเลิก
          </Button>

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className={`text-xs gap-1.5 ${
              isApprove
                ? "bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                : isReject
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-amber-600 hover:bg-amber-700 text-white"
            }`}
          >
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isApprove
              ? "ยืนยันการอนุมัติในรอบนี้"
              : isReject
              ? "ยืนยันปฏิเสธ"
              : "ส่งกลับแก้ไข"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

