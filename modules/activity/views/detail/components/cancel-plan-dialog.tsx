"use client";

import React from "react";
import { Loader2, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface CancelPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planCodeOrTitle: string;
  cancelReason: string;
  onReasonChange: (reason: string) => void;
  onSubmit: () => void;
  loading: boolean;
  error: string | null;
}

export function CancelPlanDialog({
  open,
  onOpenChange,
  planCodeOrTitle,
  cancelReason,
  onReasonChange,
  onSubmit,
  loading,
  error,
}: CancelPlanDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <DialogTitle className="text-lg font-bold">
              ขอยกเลิกแผนกิจกรรม
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-slate-500">
            แผนงาน:{" "}
            <span className="font-semibold text-slate-700">
              {planCodeOrTitle}
            </span>
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="py-2 text-xs">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-3 py-1">
          <div className="bg-amber-50 text-amber-800 text-xs p-3 rounded-xl border border-amber-200/80 space-y-1">
            <p className="font-semibold">⚠️ ข้อมูลขั้นตอนการยกเลิก:</p>
            <p>
              หากแผนงานนี้มีการเบิกสินค้าในแปลงสาธิต
              คำขอนี้จะต้องผ่านการอนุมัติแบบ Dual-Approval
              จากทั้งหัวหน้างานตามสายงาน และผู้จัดการแผนกการตลาด
              เพื่อตรวจสอบการคืนสต็อกสินค้า
            </p>
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="cancel-reason"
              className="text-xs font-semibold text-slate-700"
            >
              เหตุผลในการขอยกเลิก *
            </Label>
            <Textarea
              id="cancel-reason"
              placeholder="ระบุเหตุผลและรายละเอียดการขอยกเลิกแผนงาน..."
              value={cancelReason}
              onChange={(e) => onReasonChange(e.target.value)}
              className="text-sm min-h-[90px]"
              disabled={loading}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2 pt-2">
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
            onClick={onSubmit}
            disabled={loading}
            className="text-xs bg-red-600 hover:bg-red-700 text-white font-bold"
          >
            {loading && (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
            )}
            ยืนยันส่งคำขอยกเลิก
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
