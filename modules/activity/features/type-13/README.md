# 🌿 Type 13 Feature Module: ฉีดแปลงแฮตแทค (Hattack Spraying)

> **Work Type Code:** `TYPE_13`  
> **Work Type Name:** ฉีดแปลงแฮตแทค (Hattack Spraying)  
> **Architecture:** Vertical Slice Architecture, Dual-Mode (Planned + Unplanned), Multi-Plot (1–10 แปลง)  
> **Status:** ✅ Migrated to `modules/activity/` (100% Zero Legacy Imports)

---

## 1. Overview & Data Architecture

โมดูล **Type 13 (ฉีดแปลงแฮตแทค)** รับผิดชอบกระบวนการวางแผน ติดตาม และบันทึกผลการปฏิบัติงานฉีดพ่นสารเคมีในแปลงสาธิตแฮตแทค (Multi-plot 1–10 แปลง):

- **Plan Phase:** บันทึกข้อมูลแปลงแฮตแทค (`ActivityPlanType13Plot`), ร้านค้า Dealer (`ActivityCustomerSelect`), ที่อยู่แปลง (`ActivityAddressSelect`), และการเบิกสินค้า (`ActivityPlanType13Product`)
- **Actual Phase:** บันทึกพิกัด GPS (`ActivityGpsPicker`), รอบการฉีดพ่น (`demo_plot_spray_rounds`), ผลิตภัณฑ์ที่ใช้ (`demo_plot_spray_round_products`), และรูปถ่ายหลังฉีดพ่นสูงสุด 20 รูปต่อหมู่บ้าน (`ActivityPhotoUpload`)
- **Dual-Mode:** รองรับทั้งแบบตามแผนงาน (Planned) และนอกแผน (Unplanned 2-in-1 Form)

---

## 2. Directory Structure (24-Artifact Standard)

```
modules/activity/features/type-13/
├── shared/
│   ├── constants.ts                      # WORK_TYPE_CODE, SPRAY_EQUIPMENT_OPTIONS, FORMULA_OPTIONS
│   ├── types.ts                          # Type13PlotItem, Type13SprayingRound, Type13ImageFile
│   └── notes.ts                          # formatType13PlannedNotes, formatType13ActualSummary
├── planned/
│   ├── types/
│   │   ├── planned.types.ts              # Type13TargetItem, Type13PlanFormProps, ValidateType13Params
│   │   └── actual.types.ts               # Type13PlotActualState, Type13ActualProps, Type13DetailProps
│   ├── application/
│   │   ├── planned-mapper.ts             # extractType13PlanTargets, mapType13ToSectionItems
│   │   ├── planned-validation.ts         # validateType13FormValues
│   │   ├── actual-mapper.ts              # parseType13ActualResult
│   │   └── actual-validation.ts          # validateType13Actual
│   ├── infrastructure/
│   │   ├── type13.repository.ts          # generateDemoPlotCode, createType13Data, syncType13Data, findType13ByPlanId
│   │   └── type13-planned.strategy.ts    # WorkTypeStrategy implementation (Server only)
│   ├── hooks/
│   │   ├── use-type13-planned-form.ts    # React hook for plan form (alias: useType13Form)
│   │   └── use-type13-actual.ts          # React hook for multi-plot actual state (alias: useType13ActualState)
│   └── components/
│       ├── type13-planned-form.tsx       # Planned form component
│       ├── type13-plan-card.tsx          # Plan preview card
│       ├── type13-actual-form.tsx        # Actual multi-plot result form
│       ├── type13-detail-view.tsx        # Detail view with spray rounds & lightbox
│       └── type13-approval-card.tsx      # Approval queue card
├── unplanned/
│   ├── types/
│   │   └── unplanned.types.ts            # Type13UnplannedItem, Type13UnplannedFormProps
│   ├── application/
│   │   ├── unplanned-validation.ts       # validateType13UnplannedItem
│   │   └── unplanned-mapper.ts           # hydrateType13UnplannedData, mapType13UnplannedToPayload
│   ├── infrastructure/
│   │   └── type13-unplanned.strategy.ts  # WorkTypeStrategy for unplanned (Server only)
│   ├── hooks/
│   │   └── use-type13-unplanned-form.ts  # React hook for unplanned 2-in-1 form
│   └── components/
│       └── type13-unplanned-form.tsx     # Unplanned 2-in-1 form component
├── index.ts                              # Public Feature Barrel Export (Client-safe)
└── README.md                             # Documentation & Checklist
```

---

## 3. Quality Gates Checklist

- [x] โครงสร้าง 24 Artifacts ครบถ้วน
- [x] Strict File Naming Contract
- [x] ไม่มีไฟล์ `index.ts` ย่อยภายใน sub-folder
- [x] ตัดขาดจาก `@/modules/activity-plans/` 100% (Zero Legacy Imports)
- [x] Full Dual-Mode (Planned + Unplanned)
- [x] Unified Activity UI Component Standard (`ActivityCustomerSelect`, `ActivityAddressSelect`, `ActivityInput`, `ActivityGpsPicker`, `ActivityPhotoUpload`)
- [x] Zero TypeScript Errors (`npx tsc --noEmit` Exit Code 0)
