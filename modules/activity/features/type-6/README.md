# Type 6 Feature: ตรวจสอบเรื่องร้องเรียน / แก้ปัญหา (Customer Complaint / Issue Resolution)

โมดูลแนวตั้ง (Vertical Slice) มาตรฐาน 24-Artifacts สำหรับจัดการกิจกรรม **ตรวจสอบเรื่องร้องเรียน / แก้ปัญหา (TYPE_6)** ภายใต้สถาปัตยกรรม Native `modules/activity`

---

## 1. ข้อมูลทั่วไป (Overview)
- **Work Type Code:** `TYPE_6`
- **Work Type Name:** ตรวจสอบเรื่องร้องเรียน / แก้ปัญหา
- **Database Tables:**
  - Dedicated Plan Table: `ActivityPlanType6Target`
  - Dedicated Actual Table: `ActivityResultIssueItem`
  - Dual-Write Compatible Table: `ActivityPlanStore` (workTypeCode = "TYPE_6")
  - Attachments: `ActivityPlanAttachment` (category = "ISSUE")

---

## 2. โครงสร้างโฟลเดอร์ (Directory Structure)
```
modules/activity/features/type-6/
├── shared/
│   ├── constants.ts                      # ISSUE_TYPES, PURCHASE_CHANNELS, ISSUE_STATUSES
│   └── types.ts                          # CustomerOption, ProductOption, TargetIssueItem, Type6IssueRecord
├── planned/
│   ├── types/
│   │   ├── planned.types.ts              # Type6PlanFormProps, ValidateType6Options, UseType6FormResult
│   │   └── actual.types.ts               # Type6ActualFormProps, Type6DetailViewProps, Type6ApprovalCardProps
│   ├── application/
│   │   ├── planned-validation.ts         # validateType6FormItems
│   │   ├── planned-mapper.ts             # extractType6PlanTargets, hydrateType6PlannedData, mapType6ToSectionItems
│   │   ├── actual-validation.ts          # validateType6Actual
│   │   └── actual-mapper.ts              # parseType6ActualResult
│   ├── infrastructure/
│   │   └── type6-planned.strategy.ts     # type6PlannedStrategy (WorkTypeStrategy)
│   ├── hooks/
│   │   ├── use-type6-planned-form.ts     # useType6PlannedForm (Form state & validation)
│   │   └── use-type6-actual.ts           # useType6Actual (Image upload & actual payload collection)
│   └── components/
│       ├── type6-planned-form.tsx        # Plan creation & edit form
│       ├── type6-plan-card.tsx           # Planned target summary card
│       ├── type6-actual-form.tsx         # Actual record input form
│       ├── type6-detail-view.tsx         # Read-only actual outcome display
│       └── type6-approval-card.tsx       # Approval screen outcome review card
├── index.ts                              # Unified Public Module Entry Point
└── README.md                             # Slice Documentation
```

---

## 3. Public API Contract
```typescript
import {
  Type6PlannedForm,
  Type6PlanCard,
  Type6ActualForm,
  Type6DetailView,
  Type6ApprovalCard,
  useType6PlannedForm,
  useType6Actual,
  type6PlannedStrategy,
  extractType6PlanTargets,
  hydrateType6PlannedData,
  validateType6FormItems,
  validateType6Actual,
} from "@/modules/activity/features/type-6";
```
