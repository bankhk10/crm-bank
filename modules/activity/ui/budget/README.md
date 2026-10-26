# Plan Budget Section — โมดูลงบประมาณและค่าใช้จ่าย (README)

> **Parent Slice**: `modules/activity/ui/budget`
> **Architecture**: Vertical Slice & Feature-based Sub-components
> **Authority Schema**: `activity_plan_marketing_items`, `activity_plan_promotion_items`

---

## 1. Overview & Structure

ส่วนแสดงผลและจัดการข้อมูล "งบประมาณและค่าใช้จ่าย" ภายในฟอร์มแผนงานและผลงานกิจกรรม (Activity Plan) ได้รับการจัดโครงสร้างแบบ Modular Clean Architecture แยกสัดส่วนความรับผิดชอบอย่างชัดเจน:

```text
modules/activity/ui/budget/
├── components/
│   ├── budget-checkbox-selector.tsx      # แถบ Checkbox เลือกว่าจะเปิดใช้ส่วนไหน (พร้อมเงื่อนไข TYPE_8, 9, 10, 12)
│   ├── promotional-media-card.tsx        # กล่องตาราง "สื่อส่งเสริมการขาย" + สรุปคำนวณ % สัดส่วนยอดขาย
│   ├── sales-promotion-card.tsx          # กล่องตาราง "รายการส่งเสริมการขาย" (งบจัดงาน/โปรโมชั่น)
│   └── index.ts
├── hooks/
│   ├── use-plan-budget.ts                # Main Orchestrator Hook (รวมศูนย์ State แบบ Backward-compatible)
│   ├── use-promotional-media.ts          # State & Handlers ของสื่อส่งเสริมการขาย
│   ├── use-sales-promotion.ts            # State & Handlers ของรายการส่งเสริมการขาย
│   └── index.ts
├── types.ts                              # Source of Truth สำหรับ Interfaces & Types
├── plan-budget-section.tsx               # Orchestrator Section (~80 บรรทัด)
├── index.ts                              # Public Export Barrel
└── README.md                             # Documentation
```

---

## 2. Business Rules & Behavior

### 2.1 สื่อส่งเสริมการขาย (Promotional Media / Marketing Items)
- **สิทธิ์การใช้งาน:** ทุกประเภทงาน (Type 1 – 14) สามารถขอเบิกสื่อได้
- **Master Data:** ดึงรายการและราคาอ้างอิงจากแคตตาล็อก Master Data (`PromotionalMaterial`) เช่น หมวด Premium_item, PP_Board, Banner, Leaflet หรือ อื่นๆ
- **Financial Calculation:**
  - คำนวณราคารวมของสื่อที่ขอเบิก
  - คำนวณสัดส่วนต่องบยอดขาย (`targetSales` vs `marketingBudget` %) แสดงในการ์ดสถิติแบบ Real-time
- **Database Mapping:** บันทึกลงตาราง `activity_plan_marketing_items`

### 2.2 รายการส่งเสริมการขาย (Sales Promotion / Event Budget)
- **สิทธิ์การใช้งาน (Conditional Eligibility):**
  - แสดงตัวเลือกให้ติ๊กเฉพาะเมื่อเลือกประเภทงาน:
    - **`TYPE_8`** (จัดประชุม)
    - **`TYPE_9`** (จัดกิจกรรมส่งเสริมการขายหน้าร้าน)
    - **`TYPE_10`** (จัดงาน Field Day)
    - **`TYPE_12`** (ทัวร์ / ดูงาน)
  - หากสลับประเภทงานไปเป็นประเภทอื่น ระบบจะ Uncheck โดยอัตโนมัติเพื่อป้องกันข้อมูลตกค้าง
- **Data Model:** ระบุรายละเอียดรายการ, จำนวนเงิน, และประเภทการใช้งบ (`งบการตลาด` หรือ `งบขาย`)
- **Database Mapping:** บันทึกลงตาราง `activity_plan_promotion_items`

---

## 3. Public API & Usage

```tsx
import { PlanBudgetSection, usePlanBudget } from "@/modules/activity/ui";

function MyActivityForm() {
  const budget = usePlanBudget({ initial: planData });

  return (
    <PlanBudgetSection
      selectedWorkTypes={selectedWorkTypes}
      readonly={false}
      isPromotionalMediaSelected={budget.isPromotionalMediaSelected}
      setIsPromotionalMediaSelected={budget.setIsPromotionalMediaSelected}
      isSalesPromotionSelected={budget.isSalesPromotionSelected}
      setIsSalesPromotionSelected={budget.setIsSalesPromotionSelected}
      marketingProductItems={budget.marketingProductItems}
      marketingBudgetAmount={budget.marketingBudgetAmount}
      addMarketingProductItem={budget.addMarketingProductItem}
      updateMarketingProductItem={budget.updateMarketingProductItem}
      deleteMarketingProductItem={budget.deleteMarketingProductItem}
      salesPromotionItems={budget.salesPromotionItems}
      addSalesPromotionRow={budget.addSalesPromotionRow}
      updateSalesPromotionRow={budget.updateSalesPromotionRow}
      deleteSalesPromotionRow={budget.deleteSalesPromotionRow}
      targetSales={targetSales}
      promotionalMaterialsByCategory={promotionalMaterialsByCategory}
    />
  );
}
```

