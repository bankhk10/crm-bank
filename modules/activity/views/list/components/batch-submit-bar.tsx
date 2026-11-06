"use client";

import React from "react";
import { Send, X, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BatchSubmitBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onSubmitClick: () => void;
  isSubmitting?: boolean;
}

export function BatchSubmitBar({
  selectedCount,
  onClearSelection,
  onSubmitClick,
  isSubmitting = false,
}: BatchSubmitBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div
      role="region"
      aria-label="แถบการจัดการแผนงานที่เลือก"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-lg w-[calc(100%-2rem)] sm:w-auto"
    >
      <div className="bg-slate-900/95 backdrop-blur-md text-white border border-slate-800 shadow-2xl shadow-slate-950/40 rounded-2xl px-4 py-3 sm:px-5 sm:py-3.5 flex items-center justify-between sm:justify-start gap-3 sm:gap-6 animate-in fade-in slide-in-from-bottom-5 duration-200">
        {/* Count and indicator */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
            <CheckSquare className="w-4 h-4" />
          </div>
          <div className="text-xs sm:text-sm font-medium">
            เลือกแล้ว{" "}
            <span className="font-extrabold text-blue-400 tabular-nums">
              {selectedCount}
            </span>{" "}
            รายการ
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            disabled={isSubmitting}
            className="text-slate-300 hover:text-white hover:bg-slate-800 text-xs h-9 px-2.5 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5 sm:mr-1" />
            <span className="hidden sm:inline">ยกเลิกการเลือก</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={onSubmitClick}
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm h-9 px-3.5 rounded-xl gap-1.5 shadow-md shadow-blue-600/30 cursor-pointer transition-transform active:scale-95"
          >
            <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>ส่งขออนุมัติ ({selectedCount})</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

