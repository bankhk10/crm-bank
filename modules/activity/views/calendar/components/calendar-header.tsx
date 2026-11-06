"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, addMonths, subMonths } from "date-fns";
import { th } from "date-fns/locale";

interface CalendarHeaderProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

export function CalendarHeader({
  currentDate,
  onDateChange,
}: CalendarHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/activity-plans")}
          className="rounded-xl shrink-0"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              ปฏิทินกิจกรรม (Activity Calendar)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            ตารางนัดหมายกิจกรรมที่ได้รับอนุมัติแล้ว
            สำหรับผู้สร้างแผนและผู้ช่วยงาน
          </p>
        </div>
      </div>

      {/* Month Navigation & Today Button */}
      <div className="flex items-center flex-wrap gap-2">
        <div className="flex items-center p-1 rounded-xl border border-slate-200">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDateChange(subMonths(currentDate, 1))}
            className="h-8 w-8 rounded-lg"
          >
            <ChevronLeft className="w-4 h-4 text-slate-600" />
          </Button>
          <span className="text-sm font-semibold text-slate-800 px-3 min-w-[130px] text-center">
            {format(currentDate, "MMMM yyyy", { locale: th })}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDateChange(addMonths(currentDate, 1))}
            className="h-8 w-8 rounded-lg"
          >
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </Button>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onDateChange(new Date())}
          className="rounded-xl text-xs font-semibold"
        >
          วันนี้
        </Button>
      </div>
    </div>
  );
}

