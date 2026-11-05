"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface LoadingOverlayDialogProps {
  open: boolean;
  title?: string;
  description?: string;
  progress?: {
    done: number;
    total: number;
  } | null;
}

export function LoadingOverlayDialog({
  open,
  title = "กำลังบันทึกข้อมูล...",
  description = "กรุณารอสักครู่ ระบบกำลังอัปโหลดรูปภาพและบันทึกข้อมูล ห้ามปิดหรือรีเฟรชหน้านี้",
  progress = null,
}: LoadingOverlayDialogProps) {
  const percentage =
    progress && progress.total > 0
      ? Math.min(100, Math.round((progress.done / progress.total) * 100))
      : null;

  return (
    <AlertDialog open={open}>
      <AlertDialogContent
        onEscapeKeyDown={(e) => e.preventDefault()}
        className="max-w-sm rounded-2xl p-6 bg-white shadow-2xl border border-slate-200 text-center sm:text-center"
      >
        <AlertDialogHeader className="items-center text-center sm:text-center space-y-4">
          <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-100 shadow-xs">
            <div className="absolute inset-0 rounded-2xl border-2 border-emerald-500/20 animate-ping" />
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          </div>

          <div className="space-y-1.5 text-center">
            <AlertDialogTitle className="text-base sm:text-lg font-bold text-slate-900 text-center">
              {title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm text-slate-500 leading-relaxed text-center">
              {description}
            </AlertDialogDescription>
          </div>

          {progress && progress.total > 0 && (
            <div className="w-full space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs font-medium text-slate-600">
                <span>ความคืบหน้า</span>
                <span>
                  {progress.done}/{progress.total} ({percentage}%)
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-600 transition-all duration-200"
                  style={{ width: `${percentage ?? 0}%` }}
                />
              </div>
            </div>
          )}
        </AlertDialogHeader>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default LoadingOverlayDialog;

