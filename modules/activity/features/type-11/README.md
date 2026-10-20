# Type 11 Feature: ตรวจเช็คสต๊อกหน้าร้าน (Store Stock Check)

Vertical Slice Architecture for Activity Type 11 supporting both Planned and Unplanned modes.

## Architecture Structure (24-Artifact Standard)

```
modules/activity/features/type-11/
├── index.ts                           # Barrel export (Public API Contract)
├── README.md                          # Feature Documentation
├── shared/
│   ├── constants.ts                   # WORK_TYPE_CODE, WORK_TYPE_NAME, STOCK_STATUS_OPTIONS, REORDER_OPPORTUNITY_OPTIONS
│   ├── types.ts                       # Type11StoreItem, Type11StockItem, Type11ImageFile, StockStatus, ReorderOpportunity
│   └── notes.ts                       # formatType11PlannedNotes, formatType11ActualSummary
├── planned/
│   ├── types/
│   │   ├── planned.types.ts           # Type11TargetItem, Type11PlanItem, Type11PlannedFormProps, Validation types
│   │   └── actual.types.ts            # Type11ActualRecord, Type11ActualFormProps, Detail/Approval View types
│   ├── application/
│   │   ├── planned-validation.ts      # validateType11FormItems
│   │   ├── planned-mapper.ts          # extractType11PlanTargets, hydrateType11PlannedData, mapType11ToSectionItems
│   │   ├── actual-validation.ts       # validateType11Actual
│   │   └── actual-mapper.ts           # parseType11ActualResult
│   ├── infrastructure/
│   │   ├── type11.repository.ts       # findType11StoresByPlanId, saveType11ActualStockItems
│   │   └── type11-planned.strategy.ts # type11PlannedStrategy (WorkTypeStrategy)
│   ├── hooks/
│   │   ├── use-type11-planned-form.ts # useType11PlannedForm
│   │   └── use-type11-actual.ts       # useType11Actual (with media uploader & validator)
│   └── components/
│       ├── type11-planned-form.tsx    # Plan form with ActivityCustomerSelect
│       ├── type11-plan-card.tsx       # Plan summary card
│       ├── type11-actual-form.tsx     # Actual form with ActivityProductSelect, ActivityInput, ActivityPhotoUpload
│       ├── type11-detail-view.tsx     # Detail view with grouped tables & Lightbox
│       └── type11-approval-card.tsx   # Approval view card
└── unplanned/
    ├── types/
    │   └── unplanned.types.ts         # Type11UnplannedItem, form props, validation types
    ├── application/
    │   ├── unplanned-validation.ts    # validateType11UnplannedItems
    │   └── unplanned-mapper.ts        # hydrateType11UnplannedData, mapType11UnplannedToPayload
    ├── infrastructure/
    │   └── type11-unplanned.strategy.ts # type11UnplannedStrategy (WorkTypeStrategy)
    ├── hooks/
    │   └── use-type11-unplanned-form.ts # useType11UnplannedForm
    └── components/
        └── type11-unplanned-form.tsx  # 2-in-1 Unplanned form with multi-store & stock table
```

## Quality Gates Checklist

1. [x] **Zero Legacy Imports:** 0 imports from `@/modules/activity-plans/`.
2. [x] **Unified UI Components:** Uses `ActivityCustomerSelect`, `ActivityProductSelect`, `ActivityInput`, `ActivityCombobox`, `ActivityPhotoUpload` from `@/modules/activity/ui`.
3. [x] **Dual Mode Coverage:** Both Planned and Unplanned modes fully implemented.
4. [x] **Data Persistence Parity:** Planned stores map to `ActivityPlanStore`, Actual results map to `ActivityResultStockItem` (`workTypeCode = "TYPE_11"`).
5. [x] **Public API Barrel:** Clean export via `index.ts`.
6. [x] **Central Registry Integration:** Integrated with `strategy.registry.ts`, `plan-targets-registry.ts`, and `result-summary-parser.ts`.
7. [x] **Orchestrator Views:** Fully wired into all 6 views (`planned-activity-form.tsx`, `unplanned-activity-form.tsx`, `actual-work-type-list.tsx`, `activity-plan-actual-view.tsx`, `detail-work-type-list.tsx`, `approval-work-type-list.tsx`).
