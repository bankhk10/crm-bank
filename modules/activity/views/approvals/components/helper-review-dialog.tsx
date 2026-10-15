"use client";

import React from "react";
import { Button } from "@/components/ui/button";

interface HelperReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason: string;
  onReasonChange: (reason: string) => void;
  onSubmit: () => void;
  isProcessing: boolean;
}

export function HelperReviewDialog({
  open,
  onOpenChange,
  reason,
  onReasonChange,
  onSubmit,
  isProcessing,
}: HelperReviewDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4">
        <h3 className="text-base font-bold text-slate-900">
          ระบุเหตุผลที่ไม่อนุมัติพนักงานช่วยงาน
        </h3>
        <p className="text-xs text-slate-500">
          ระบบจะส่งแผนงานนี้กลับไปยังผู้สร้างเพื่อให้แก้ไขรายชื่อผู้ช่วยงานใหม่
        </p>
        <textarea
          rows={3}
          value={reason}
          onChange={(e) => onReasonChange(e.target.value)}
          placeholder="ระบุเหตุผล เช่น ติดภารกิจอื่น, ไม่อนุญาต ฯลฯ"
          className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            disabled={isProcessing}
            onClick={() => onOpenChange(false)}
            className="rounded-xl"
          >
            ยกเลิก
          </Button>
          <Button
            disabled={isProcessing || !reason.trim()}
            onClick={onSubmit}
            className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
          >
            ยืนยันปฏิเสธ
          </Button>
        </div>
      </div>
    </div>
  );
}
