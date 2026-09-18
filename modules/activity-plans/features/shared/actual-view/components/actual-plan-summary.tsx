"use client";

import React from "react";
import type { PlanSummaryData } from "../types";
import { ActivitySummarySection } from "./activity-summary-section";
import { BudgetSection } from "./budget-section";
import { PromotionalMaterialsSection } from "./promotional-materials-section";
import { MarketingExpenseSection } from "./marketing-expense-section";
import { AdditionalInfoSection } from "./additional-info-section";

interface ActualPlanSummaryProps {
  summary: PlanSummaryData;
}

export function ActualPlanSummary({ summary }: ActualPlanSummaryProps) {
  return (
    <div className="space-y-5">
      {/* ─── SECTION 1: ข้อมูลแผนงาน ─── */}
      <ActivitySummarySection summary={summary} />

      {/* ─── SECTION 2: งบประมาณและค่าใช้จ่าย ─── */}
      <BudgetSection summary={summary} />

      {/* ─── SECTION 3: สื่อส่งเสริมการขาย ─── */}
      <PromotionalMaterialsSection summary={summary} />

      {/* ─── SECTION 4: รายการส่งเสริมการขาย ─── */}
      <MarketingExpenseSection summary={summary} />

      {/* ─── SECTION 5: ข้อมูลเพิ่มเติม ─── */}
      <AdditionalInfoSection summary={summary} />
    </div>
  );
}
