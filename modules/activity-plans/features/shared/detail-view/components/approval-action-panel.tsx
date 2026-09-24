"use client";

import React from "react";
import { ShieldCheck, CheckCircle, RotateCcw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ApprovalActionPanelProps {
  canApprove: boolean;
  approvalPrompt: string;
  comment: string;
  onCommentChange: (val: string) => void;
  submitting: boolean;
  onApprove: () => void;
  onRequestCorrection: () => void;
  onReject: () => void;
  canCancel: boolean;
  onCancel: () => void;
}

export function ApprovalActionPanel({
  canApprove,
  approvalPrompt,
  comment,
  onCommentChange,
  submitting,
  onApprove,
  onRequestCorrection,
  onReject,
  canCancel,
  onCancel,
}: ApprovalActionPanelProps) {
  return (
    <>
      {/* Approver Action Panel */}
      {canApprove && (
        <div className="bg-gradient-to-br from-indigo-50/40 via-white to-blue-50/30 rounded-xl p-4 border-2 border-blue-200/80 shadow-md space-y-3">
          <div className="flex items-center gap-2 text-blue-800 font-bold text-sm">
            <ShieldCheck className="h-4 w-4 text-blue-600" />
            <span>แผงควบคุมการอนุมัติ</span>
          </div>
          <p className="text-xs text-blue-900 bg-blue-50 p-2 rounded-lg border border-blue-100 leading-relaxed font-medium">
            {approvalPrompt}
          </p>
          <textarea
            placeholder="ระบุข้อเสนอแนะ, เหตุผล หรือสิ่งที่ต้องแก้ไข..."
            value={comment}
            onChange={(e) => onCommentChange(e.target.value)}
            rows={3}
            className="w-full text-xs rounded-lg border border-slate-200 bg-white p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            disabled={submitting}
          />
          <div className="grid gap-2 grid-cols-2">
            <Button
              onClick={onApprove}
              disabled={submitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold col-span-2 flex items-center justify-center gap-1.5 text-xs shadow-sm h-9"
            >
              <CheckCircle className="h-4 w-4" />
              อนุมัติผ่าน (Approve)
            </Button>
            <Button
              variant="outline"
              onClick={onRequestCorrection}
              disabled={submitting || !comment.trim()}
              className="text-amber-700 border-amber-300 hover:bg-amber-50 font-bold text-xs flex items-center justify-center gap-1 h-8"
              title={!comment.trim() ? "กรุณากรอกเหตุผลเพื่อส่งกลับแก้ไข" : ""}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              ส่งกลับแก้ไข
            </Button>
            <Button
              variant="destructive"
              onClick={onReject}
              disabled={submitting}
              className="font-bold text-xs flex items-center justify-center gap-1 h-8"
            >
              <XCircle className="h-3.5 w-3.5" />
              ปฏิเสธแผน
            </Button>
          </div>
        </div>
      )}

      {/* Creator Cancel Option */}
      {canCancel && (
        <div className="bg-white rounded-xl p-3 border border-slate-200/80">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={submitting}
            className="w-full text-red-600 border-red-200 hover:bg-red-50 text-xs font-semibold h-8"
          >
            ยกเลิกแผนกิจกรรมนี้
          </Button>
        </div>
      )}
    </>
  );
}
