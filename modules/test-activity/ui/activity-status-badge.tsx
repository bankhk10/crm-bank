import React from "react";
import { TripPlanMock } from "../infrastructure/mock-data";
import { STATUS_CONFIG } from "../constants";

export function ActivityStatusBadge({ status }: { status: TripPlanMock["status"] }) {
  const cfg = STATUS_CONFIG[status];
  if (!cfg) return null;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}
