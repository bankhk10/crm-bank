"use client";

import React from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { Send, AlertCircle, RefreshCw, Calendar, Tag } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { ActivityPlanWithRelations } from "@/modules/activity/types";
import { getWorkTypeName } from "@/modules/activity/constants";

interface BatchSubmitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPlans: ActivityPlanWithRelations[];
  onConfirm: () => Promise<void> | void;
  isSubmitting: boolean;
}

export function BatchSubmitDialog({
  open,
  onOpenChange,
  selectedPlans,
  onConfirm,
  isSubmitting,
}: BatchSubmitDialogProps) {
  const formatThaiDate = (dateStr: string | Date) => {
    try {
      const d = new Date(dateStr);
      return `${format(d, "dd MMM", { locale: th })} ${d.getFullYear() + 543}`;
    } catch {
      return "-";
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !isSubmitting && onOpenChange(o)}>
      <DialogContent className="max-w-md sm:max-w-lg rounded-2xl p-5 sm:p-6">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold text-slate-900">
                ยืนยันการส่งขออนุมัติแผนงาน
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                ส่งแผนงานที่เลือกจำนวน{" "}
                <span className="font-bold text-blue-600">
                  {selectedPlans.length}
                </span>{" "}
                รายการ เข้าสู่ขั้นตอนการอนุมัติตามสายงาน
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Selected plans list */}
        <div className="my-2">
          <p className="text-xs font-semibold text-slate-600 mb-2">
            รายการแผนงานที่จะส่ง:
          </p>
          <div className="max-h-56 sm:max-h-64 overflow-y-auto space-y-2 pr-1 rounded-xl border border-slate-100 bg-slate-50/60 p-2">
            {selectedPlans.map((plan) => {
              const planNo =
                (plan as any).code ||
                (plan as any).planNo ||
                (plan as any).planCode ||
                plan.id.slice(0, 8);

              const workTypeNames: string[] = [];
              if ((plan as any).workTypes?.length > 0) {
                (plan as any).workTypes.forEach((wt: any) => {
                  const name =
                    wt.activityType?.name ||
                    getWorkTypeName(wt.activityTypeId || wt.workTypeCode);
                  if (name) workTypeNames.push(name);
                });
              } else if ((plan as any).tour) {
                workTypeNames.push("ทัวร์");
              } else {
                const raw: any = plan.activityType;
                if (raw && typeof raw === "object") {
                  workTypeNames.push(raw.name || raw.code || "-");
                }
              }

              return (
                <div
                  key={plan.id}
                  className="bg-white border border-slate-200/80 rounded-lg p-2.5 shadow-2xs space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono font-bold text-blue-600 bg-blue-50 border border-blue-100 rounded px-1.5 py-0.5">
                      {planNo}
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 shrink-0">
                      <Calendar className="w-3 h-3" />
                      {formatThaiDate(plan.startDate)}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-800 line-clamp-1">
                    {plan.title || "-"}
                  </p>
                  {workTypeNames.length > 0 && (
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 line-clamp-1">
                      <Tag className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{workTypeNames.join(", ")}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Informational notice */}
        <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-800">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            เมื่อส่งแล้ว แผนงานจะถูกเปลี่ยนสถานะเป็น{" "}
            <strong>รออนุมัติ</strong> และจะไม่สามารถแก้ไขข้อมูลได้
            จนกว่าจะได้รับการพิจารณาจากผู้อนุมัติ
          </p>
        </div>

        <DialogFooter className="mt-4 flex-row justify-end gap-2 sm:gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="rounded-xl text-xs h-9"
          >
            ยกเลิก
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="rounded-xl text-xs h-9 bg-blue-600 hover:bg-blue-700 text-white font-bold gap-1.5 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                กำลังส่งขออนุมัติ...
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                ยืนยันส่งขออนุมัติ ({selectedPlans.length})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

