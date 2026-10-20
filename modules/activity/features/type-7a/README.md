# Type 7A Feature: จัดทำแปลงสาธิต (Demo Plot Establishment)

โมดูลแนวตั้ง (Vertical Slice) มาตรฐาน 24-Artifacts สำหรับจัดการกิจกรรม **จัดทำแปลงสาธิต (TYPE_7A)** ภายใต้สถาปัตยกรรม Native `modules/activity` รองรับทั้งแบบ **กิจกรรมในแผน (Planned)** และ **กิจกรรมนอกแผน (Unplanned)** ครบถ้วน 100%

---

## 1. ข้อมูลทั่วไป (Overview)
- **Work Type Code:** `TYPE_7A`
- **Work Type Name:** จัดทำแปลงสาธิต
- **Database Tables:**
  - Master Table: `DemoPlot`
  - Dual-Sync Store Table: `ActivityPlanStore` (workTypeCode = "TYPE_7A")
  - Dual-Sync Product Table: `ActivityPlanProduct` (workTypeCode = "TYPE_7A")
  - Actual Outcome Table: `ActivityResultDemoItem`
  - Attachments: `ActivityPlanAttachment` (category = "PLOT")

---

## 2. โครงสร้างโฟลเดอร์ (Directory Structure)
```
modules/activity/features/type-7a/
├── shared/
│   ├── constants.ts                      # CROP_CATEGORIES, PLOT_OBJECTIVES, DEMO_PLOT_STATUSES
│   └── types.ts                          # CustomerOption, ProductOption, Type7aPlotInput, Type7aDemoProductItem
├── planned/
│   ├── types/
│   │   ├── planned.types.ts              # Type7aPlannedFormProps, Type7aPlanCardProps, ValidateType7aOptions
│   │   └── actual.types.ts               # Type7aActualFormProps, Type7aDetailViewProps, Type7aApprovalCardProps
│   ├── application/
│   │   ├── planned-validation.ts         # validateType7aFormItems
│   │   ├── planned-mapper.ts             # extractType7aPlanTargets, hydrateType7aPlannedData, mapType7aToSectionItems
│   │   ├── actual-validation.ts          # validateType7aActual
│   │   └── actual-mapper.ts              # parseType7aActualResult
│   ├── infrastructure/
│   │   ├── type7a.repository.ts          # generateDemoPlotCode, syncType7aPlots, findType7aByPlanId
│   │   └── type7a-planned.strategy.ts    # type7aPlannedStrategy (WorkTypeStrategy)
│   ├── hooks/
│   │   ├── use-type7a-planned-form.ts    # useType7aPlannedForm (alias: useType7aForm)
│   │   └── use-type7a-actual.ts          # useType7aActual
│   └── components/
│       ├── type7a-planned-form.tsx       # Type7aPlannedForm (alias: Type7aPlanForm, Type7NewDemo)
│       ├── type7a-plan-card.tsx          # Type7aPlanCard
│       ├── type7a-actual-form.tsx        # Type7aActualForm (alias: ActualType7NewDemo)
│       ├── type7a-detail-view.tsx        # Type7aDetailView (alias: DetailType7NewDemo)
│       └── type7a-approval-card.tsx      # Type7aApprovalCard (alias: ApprovalType7aDemo)
├── unplanned/
│   ├── types/
│   │   └── unplanned.types.ts            # Type7aUnplannedItem, Type7aUnplannedFormProps
│   ├── application/
│   │   ├── unplanned-validation.ts       # validateType7aUnplannedItems
│   │   └── unplanned-mapper.ts           # hydrateType7aUnplannedData, mapType7aUnplannedToPayload
│   ├── infrastructure/
│   │   └── type7a-unplanned.strategy.ts  # type7aUnplannedStrategy
│   ├── hooks/
│   │   └── use-type7a-unplanned-form.ts  # useType7aUnplannedForm
│   └── components/
│       └── type7a-unplanned-form.tsx     # Type7aUnplannedForm
├── index.ts                              # Public API Barrel
└── README.md                             # Architectural Documentation
```

---

## 3. สถาปัตยกรรม Dual-Mode (Planned + Unplanned)
- **Planned Activity:** ผู้ใช้สร้างแผนขออนุมัติจัดทำแปลงสาธิตล่วงหน้า ผ่าน `Type7aPlannedForm` เมื่อได้รับอนุมัติแล้ว ลงพื้นที่และบันทึกผลจริงผ่าน `Type7aActualForm`
- **Unplanned Activity:** ผู้ใช้ลงพื้นที่และจัดทำแปลงสาธิตหน้างานทันที สามารถเลือกประเภทงาน "จัดทำแปลงสาธิต" ใน `UnplannedActivityForm` เพื่อกรอกข้อมูลแปลง, ชนิดพืช, พิกัด GPS, การใช้สินค้าตัวอย่าง และถ่ายรูปแปลงสาธิต พร้อมบันทึกผลได้ในขั้นตอนเดียว
