import React from "react";
import { SectionHeader } from "@/components/custom/section-header";

export interface PlanNotesCardProps {
  notes: string;
  setNotes: (val: string) => void;
  readonly?: boolean;
}

export function PlanNotesCard({
  notes,
  setNotes,
  readonly = false,
}: PlanNotesCardProps) {
  return (
    <>
      <SectionHeader
        title="ข้อมูลเพิ่มเติม"
        className="rounded-xl"
        accentColor="#808080"
      />

      <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-700 mb-1">
          หมายเหตุเพิ่มเติม
        </label>
        <textarea
          rows={3}
          value={notes}
          maxLength={500}
          onChange={(e) => setNotes(e.target.value)}
          disabled={readonly}
          placeholder="ข้อมูลเพิ่มเติมอื่นๆ..."
          className="w-full rounded-lg border border-slate-200 bg-white p-3 text-xs md:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
        />
        <div className="text-right text-[11px] text-slate-400">
          {notes.length}/500
        </div>
      </div>
    </>
  );
}
