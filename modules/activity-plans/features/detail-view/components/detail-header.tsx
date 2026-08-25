"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Edit,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ActivityStatusBadge } from "../../../ui/activity-status-badge";
import type { ActivityPlanWithRelations } from "../../../types";

interface DetailHeaderProps {
  plan: ActivityPlanWithRelations;
  canEdit: boolean;
}

export function DetailHeader({ plan, canEdit }: DetailHeaderProps) {
  const router = useRouter();
  const start = new Date(plan.startDate);
  const end = new Date(plan.endDate);

  return (
    <div className="space-y-3">
      {/* Back + Code + Status row */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/activity-plans")}
          className="text-slate-500 hover:text-slate-800 -ml-2 h-8 px-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          รายการแผนงาน
        </Button>
        <span className="text-slate-300">|</span>
        <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
          {plan.code || plan.id.slice(0, 8)}
        </span>
        <ActivityStatusBadge status={plan.status} />
      </div>

      {/* Title + Badges + Actions */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="space-y-1.5 min-w-0">
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">
            {plan.title}
          </h1>
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
            {(plan.activityType as any)?.name && (
              <Badge
                variant="outline"
                className="text-[11px] bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold"
              >
                {(plan.activityType as any).name}
              </Badge>
            )}
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(start, "dd MMM yyyy", { locale: th })}
              {plan.durationDays > 1 &&
                ` — ${format(end, "dd MMM yyyy", { locale: th })}`}
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {plan.durationDays} วัน
            </span>
            <span>•</span>
            <span
              className="inline-flex items-center gap-1 truncate max-w-[200px]"
              title={plan.location}
            >
              <MapPin className="h-3 w-3 shrink-0" />
              {plan.province || plan.location}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/activity-plans/${plan.id}/edit`)}
              className="text-xs font-semibold gap-1.5 border-slate-300"
            >
              <Edit className="h-3.5 w-3.5" />
              แก้ไขแผนงาน
            </Button>
          )}

          <Button
            size="sm"
            onClick={() => router.push(`/activity-plans/${plan.id}/actual`)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs font-bold shadow-sm"
          >
            <ClipboardList className="h-4 w-4" />
            {plan.result
              ? "ดู / แก้ไขผลปฏิบัติงาน (Actual)"
              : "บันทึกผลปฏิบัติงาน (Actual)"}
          </Button>
        </div>
      </div>
    </div>
  );
}
