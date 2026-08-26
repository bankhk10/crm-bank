"use client";

import React from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DetailViewActionsProps {
  onBack: () => void;
}

export function DetailViewActions({ onBack }: DetailViewActionsProps) {
  return (
    <div className="pt-4 border-t border-slate-100 flex items-center justify-center">
      <Button
        type="button"
        variant="outline"
        onClick={onBack}
        className="px-5 py-2.5 h-10 rounded-xl border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>ย้อนกลับ</span>
      </Button>
    </div>
  );
}
