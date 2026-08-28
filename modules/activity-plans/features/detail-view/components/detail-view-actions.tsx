"use client";

import React from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DetailViewActionsProps {
  onBack: () => void;
  backLabel?: string;
  children?: React.ReactNode;
}

export function DetailViewActions({
  onBack,
  backLabel = "ย้อนกลับ",
  children,
}: DetailViewActionsProps) {
  return (
    <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center justify-center gap-3 w-full">
      <Button
        type="button"
        variant="outline"
        onClick={onBack}
        className="px-5 py-2.5 h-10 rounded-xl border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer shadow-2xs"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{backLabel}</span>
      </Button>
      {children}
    </div>
  );
}
