"use client";

import React, { useState } from "react";
import { Layers } from "lucide-react";
import { WorkTypeSection } from "./work-type-section";
import type { ParsedWorkTypeSection } from "../types";

interface WorkTypeListProps {
  sections: ParsedWorkTypeSection[];
}

export function WorkTypeList({ sections }: WorkTypeListProps) {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(
    new Set(),
  );

  const toggleSection = (typeIndex: number) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(typeIndex)) next.delete(typeIndex);
      else next.add(typeIndex);
      return next;
    });
  };

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 px-1">
        <Layers className="h-3.5 w-3.5 text-indigo-500" />
        รายละเอียดกิจกรรม ({sections.length} ประเภท)
      </h3>

      {sections.length === 0 ? (
        <div className="bg-white rounded-xl p-6 border border-slate-200/80 text-center text-xs text-slate-400">
          ไม่มีรายการกิจกรรมเฉพาะ
        </div>
      ) : (
        <div className="space-y-2">
          {sections.map((sec, secIdx) => {
            const isOpen =
              expandedSections.has(sec.typeIndex) ||
              (expandedSections.size === 0 && secIdx === 0);
            return (
              <WorkTypeSection
                key={sec.typeIndex}
                section={sec}
                isOpen={isOpen}
                onToggle={() => toggleSection(sec.typeIndex)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
