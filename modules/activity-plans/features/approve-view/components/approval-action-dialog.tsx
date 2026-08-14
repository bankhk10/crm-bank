"use client";

import React, { useState } from "react";
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
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  AlertTriangle,
  Loader2,
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
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!plan) return null;

  const planCode = plan.code || plan.id;

  const isApprove = actionType === "APPROVE";
  const isReject = actionType === "REJECT";
  const isCorrection = actionType === "REQUEST_CORRECTION";

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
        res = await approveActivityPlanAction(plan.id, comment.trim() || undefined);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
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

        <div className="space-y-4 py-2">
          {isApprove && (
            <div className="bg-emerald-50 text-emerald-800 text-xs p-3 rounded-lg border border-emerald-100 flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                คุณกำลังจะอนุมัติแผนงานของ <strong>{plan.employee.name}</strong>{" "}
                ระบบจะส่งต่อไปยังขั้นตอนถัดไปหรือบันทึกอนุมัติสมบูรณ์
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
              className="text-sm min-h-[90px]"
              disabled={loading}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
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
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : isReject
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-amber-600 hover:bg-amber-700 text-white"
            }`}
          >
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isApprove ? "อนุมัติแผนงาน" : isReject ? "ยืนยันปฏิเสธ" : "ส่งกลับแก้ไข"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
