"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileText, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActivityStatusBadge } from "../../../ui/activity-status-badge";
import type { ActivityStatus } from "../../../types";

interface DetailViewHeaderProps {
  planNo?: string;
  status?: ActivityStatus;
  onBack?: () => void;
}

export function DetailViewHeader({
  planNo,
  status,
  onBack,
}: DetailViewHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.push("/activity-plans");
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
      {/* Left / Title area */}
      <div className="flex items-center gap-3.5">
        <Button
          variant="outline"
          size="sm"
          onClick={handleBack}
          className="h-10 w-10 p-0 rounded-xl shrink-0 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          title="กลับหน้ารายการแผนงาน"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>

        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 shadow-2xs">
            <FileText className="w-5 h-5 stroke-[2.2]" />
          </div>

          <div>
            <h1 className="font-bold text-lg sm:text-xl text-slate-900 tracking-tight">
              รายละเอียดแผนงาน ( Trip Plan Detail )
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              ดูรายละเอียดแผนงาน งบประมาณ และผลการปฏิบัติงาน
            </p>
          </div>
        </div>
      </div>

      {/* Right / Status & Plan No */}
      <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
        {status && <ActivityStatusBadge status={status} />}

        {planNo && (
          <div className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full shadow-2xs">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>เลขที่แผน: {planNo}</span>
          </div>
        )}
      </div>
    </div>
  );
}
