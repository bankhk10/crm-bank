"use client";

import React from "react";
import { Megaphone, FileText, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { Type15PlanCard } from "./type15-plan-card";
import type { Type15DetailViewProps } from "../types/actual.types";

export function Type15DetailView({
  isVisible = true,
  target,
  targets,
  actual,
}: Type15DetailViewProps) {
  if (!isVisible) return null;

  const actualAttachments = actual?.attachments || [];

  return (
    <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 md:p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100">
          <Megaphone className="h-4 w-4" />
        </div>
        <div>
          <span className="text-slate-800 font-bold text-sm sm:text-base">
            รายละเอียดกิจกรรม: บูมทีม / คาราวาน
          </span>
          <p className="text-xs text-slate-500 font-normal">
            ข้อมูลแผนงานและผลการปฏิบัติงานจริง
          </p>
        </div>
      </div>

      {/* Plan Target Summary */}
      <Type15PlanCard target={target} targets={targets} />

      {/* Actual Result Section (if recorded) */}
      {actual && (
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 border-b border-slate-100 pb-2">
            <FileText className="h-3.5 w-3.5 text-orange-600" />
            <span>ผลการปฏิบัติงานจริง (Actual Outcome)</span>
          </div>

          <div className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
            {actual.detail || "ไม่มีรายละเอียดผลการปฏิบัติงานเพิ่มเติม"}
          </div>

          {/* Photo Gallery */}
          {actualAttachments.length > 0 && (
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5 text-slate-500" />
                รูปภาพการปฏิบัติงาน ({actualAttachments.length} รูป)
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
                {actualAttachments.map((att: any, idx: number) => (
                  <a
                    key={att.id || idx}
                    href={att.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="group relative block aspect-square rounded-lg overflow-hidden border border-slate-200 hover:border-orange-400 transition-all bg-slate-100"
                  >
                    <Image
                      src={att.fileUrl}
                      alt={att.fileName || `Attachment ${idx + 1}`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

