"use client";

import React from "react";
import { ChevronRight, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ParsedWorkTypeSection } from "../types";

interface WorkTypeSectionProps {
  section: ParsedWorkTypeSection;
  isOpen: boolean;
  onToggle: () => void;
}

export function WorkTypeSection({
  section,
  isOpen,
  onToggle,
}: WorkTypeSectionProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden">
      {/* Accordion Header */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between gap-2 hover:bg-slate-50/50 transition-colors text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-[10px] font-bold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded shrink-0">
            {section.typeIndex}
          </span>
          <span className="text-sm font-bold text-slate-900 truncate">
            {section.title}
          </span>
          <Badge
            variant="outline"
            className="text-[10px] bg-slate-50 text-slate-600 shrink-0"
          >
            {section.badge} • {section.items.length} รายการ
          </Badge>
        </div>
        <ChevronRight
          className={cn(
            "h-4 w-4 text-slate-400 shrink-0 transition-transform duration-200",
            isOpen && "rotate-90",
          )}
        />
      </button>

      {/* Accordion Content */}
      {isOpen && (
        <div className="border-t border-slate-100 p-4 space-y-3">
          {section.rawSummary && (
            <p className="text-xs text-slate-600 bg-blue-50/40 p-2.5 rounded-lg border border-blue-50 leading-relaxed">
              {section.rawSummary}
            </p>
          )}

          {section.items.length > 0 && (
            <div className="divide-y border rounded-lg overflow-hidden">
              {section.items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="text-slate-400">{idx + 1}.</span>
                      <span className="truncate">{item.title}</span>
                      {item.badge && (
                        <Badge
                          variant="outline"
                          className="text-[10px] py-0 shrink-0"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </div>
                    {item.subtitle && (
                      <div className="text-slate-500 pl-5">{item.subtitle}</div>
                    )}
                    {item.details && (
                      <div className="text-slate-500 pl-5 italic">
                        {item.details}
                      </div>
                    )}
                    {item.extraFields && item.extraFields.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pl-5 pt-1">
                        {item.extraFields.map((f, fIdx) => (
                          <span
                            key={fIdx}
                            className="inline-flex items-center gap-1 text-[10px] bg-slate-50 px-2 py-0.5 rounded border border-slate-200 text-slate-600"
                          >
                            <span className="font-semibold text-slate-400">
                              {f.label}:
                            </span>
                            <span className="font-medium text-slate-800">
                              {f.value}
                            </span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {item.amount && (
                    <div className="text-sm font-extrabold text-blue-700 sm:text-right shrink-0">
                      {item.amount}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Target Summary Cards */}
          {section.targetCards && section.targetCards.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {section.targetCards.map((tc, tcIdx) => (
                <div
                  key={tcIdx}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border",
                    tc.highlight
                      ? "bg-blue-50 border-blue-200 text-blue-800"
                      : "bg-slate-50 border-slate-200 text-slate-700",
                  )}
                >
                  <TrendingUp
                    className={cn(
                      "h-3 w-3 shrink-0",
                      tc.highlight ? "text-blue-500" : "text-slate-400",
                    )}
                  />
                  <span className="text-slate-500">{tc.label}:</span>
                  <span
                    className={cn(
                      "font-extrabold",
                      tc.highlight ? "text-blue-700" : "text-slate-800",
                    )}
                  >
                    {tc.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
