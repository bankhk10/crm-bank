"use client";

import React, { useMemo } from "react";
import { SectionHeader } from "@/components/custom/section-header";
import { getWorkTypeCode } from "@/modules/activity/constants";
import {
  BudgetCheckboxSelector,
  PromotionalMediaCard,
  SalesPromotionCard,
} from "./components";
import type { PlanBudgetSectionProps } from "./types";

export function BudgetSection({
  selectedWorkTypes = [],
  readonly = false,
  isPromotionalMediaSelected,
  setIsPromotionalMediaSelected,
  isSalesPromotionSelected,
  setIsSalesPromotionSelected,
  marketingProductItems,
  marketingBudgetAmount,
  addMarketingProductItem,
  updateMarketingProductItem,
  deleteMarketingProductItem,
  salesPromotionItems,
  addSalesPromotionRow,
  updateSalesPromotionRow,
  deleteSalesPromotionRow,
  targetSales = 0,
  promotionalMaterialsByCategory,
}: PlanBudgetSectionProps) {
  // ตรวจสอบสิทธิ์การแสดง "รายการส่งเสริมการขาย" เฉพาะเมื่อมี:
  // TYPE_8 (จัดประชุม), TYPE_9 (จัดกิจกรรมหน้าร้าน), TYPE_10 (Field Day), TYPE_12 (ทัวร์/ดูงาน)
  const isSalesPromotionAllowed = useMemo(() => {
    if (!selectedWorkTypes || selectedWorkTypes.length === 0) return false;
    return selectedWorkTypes.some((wt) => {
      const code = getWorkTypeCode(wt);
      return (
        code === "TYPE_8" ||
        code === "TYPE_9" ||
        code === "TYPE_10" ||
        code === "TYPE_12"
      );
    });
  }, [selectedWorkTypes]);

  return (
    <div className="space-y-4">
      {/* 1. หัวข้อส่วนงบประมาณ */}
      <SectionHeader
        title="งบประมาณและค่าใช้จ่าย"
        className="rounded-xl"
        accentColor="#808080"
      />

      {/* 2. แถบเลือกประเภทงบประมาณที่ต้องการขอเบิก */}
      <BudgetCheckboxSelector
        selectedWorkTypes={selectedWorkTypes}
        readonly={readonly}
        isPromotionalMediaSelected={isPromotionalMediaSelected}
        setIsPromotionalMediaSelected={setIsPromotionalMediaSelected}
        isSalesPromotionSelected={isSalesPromotionSelected}
        setIsSalesPromotionSelected={setIsSalesPromotionSelected}
        marketingProductItemsCount={marketingProductItems.length}
        onAddInitialMarketingItem={addMarketingProductItem}
      />

      {/* 3. การ์ดรายละเอียด สื่อส่งเสริมการขาย & สัดส่วนต่อยอดขาย */}
      {isPromotionalMediaSelected && (
        <PromotionalMediaCard
          readonly={readonly}
          marketingProductItems={marketingProductItems}
          marketingBudgetAmount={marketingBudgetAmount}
          addMarketingProductItem={addMarketingProductItem}
          updateMarketingProductItem={updateMarketingProductItem}
          deleteMarketingProductItem={deleteMarketingProductItem}
          targetSales={targetSales}
          promotionalMaterialsByCategory={promotionalMaterialsByCategory}
        />
      )}

      {/* 4. การ์ดรายละเอียด รายการส่งเสริมการขาย (เฉพาะ TYPE_8, TYPE_9, TYPE_10, TYPE_12) */}
      {isSalesPromotionAllowed && isSalesPromotionSelected && (
        <SalesPromotionCard
          readonly={readonly}
          salesPromotionItems={salesPromotionItems}
          addSalesPromotionRow={addSalesPromotionRow}
          updateSalesPromotionRow={updateSalesPromotionRow}
          deleteSalesPromotionRow={deleteSalesPromotionRow}
        />
      )}
    </div>
  );
}

export const PlanBudgetSection = BudgetSection;
export default PlanBudgetSection;
