# ACTIVITY PLAN — TARGET DATA ARCHITECTURE IMPLEMENTATION REPORT
## PHASE 2: DOMAIN + APPLICATION + REPOSITORY REFACTOR

**Document Version:** 1.0.0  
**Execution Date:** September 10, 2026  
**Status:** Completed & Verified (Strict Stop — Awaiting User Approval for Phase 3)  
**Reference Documents:**
- `docs/activity/ACTIVITY-DATA-ARCHITECTURE-INVESTIGATION.md`
- `docs/activity/ACTIVITY-DATA-ARCHITECTURE-IMPLEMENTATION-PHASE-1.md`

---

## 1. Executive Summary

In Phase 1, the normalized target database schema was created and migrated into PostgreSQL, successfully removing the legacy `ActivityPlanItem` model and creating normalized tables:
- `activity_plan_marketing_items`
- `activity_plan_promotion_items`
- `activity_plan_tours`
- along with normalized tables `activity_plan_stores`, `activity_plan_products`, and `activity_helpers`.

In **Phase 2**, we have completely refactored the **Domain Layer**, **Repository Layer**, **Application Layer (Use Cases & Mappers)**, and **Data Extraction / Viewing utilities** without restoring `ActivityPlanItem`, without creating compatibility wrappers, and without storing business data in JSON or comma-separated strings.

### Key Achievements
1. **Zero `ActivityPlanItem` in Application & Repositories**: All writes and reads use normalized tables exclusively.
2. **Pure Domain Layer**: `modules/activity-plans/domain/` contains zero database/Prisma imports, pure TypeScript functions for financial and auto-objective calculations, unit tested in isolation.
3. **Robust Repository Transactions**: `createActivityPlan` and `updateActivityPlan` execute atomic Prisma transactions ensuring children collections (`stores`, `products`, `marketingItems`, `promotionItems`, `tour`, `helpers`, `demoPlotVisits`) are synchronized cleanly with zero partial updates.
4. **Client-Safe Boundary**: `validations.ts` removed server-only Prisma client enums, guaranteeing client bundles will not inadvertently package Prisma.
5. **No Comma-Separated Business Data**: Multiple stores (e.g. TYPE_11) are mapped strictly 1-row-per-store in `ActivityPlanStore`.
6. **Plan ≠ Actual Integrity**: Target amounts and quantities remain strictly in `ActivityPlanProduct` / `ActivityPlan`, while actual execution remains strictly in `ActivityResult` child tables.
7. **100% Automated Test Pass**: 30 new Phase 2 architecture tests passed; 62 existing location/team visibility tests passed. Application-level TypeScript typecheck has 0 errors.

---

## 2. Files Changed & Created

### 2.1 Created Files
| File Path | Layer | Responsibility |
| :--- | :--- | :--- |
| `modules/activity-plans/domain/budget-calculator.ts` | Domain | Pure TS calculation of marketing budget, promotion budget, target sales, price override checks, and budget-to-sales ratios. Zero external dependencies. |
| `modules/activity-plans/domain/objective-builder.ts` | Domain | Pure TS auto-objective generator supporting both Thai work type labels and normalized entity arrays (`stores`, `products`, `tour`, `province`). |
| `modules/activity-plans/domain/index.ts` | Domain | Domain public API barrel export. |
| `modules/activity-plans/application/plan-mapper.ts` | Application / Mapper | Normalizes heterogeneous raw UI payloads into typed domain collections for normalized persistence (`planStores`, `planProducts`, `marketingItems`, `promotionItems`, `tourData`, `helperEmployeeIds`). |
| `scripts/test-phase2-architecture.ts` | Automated Tests | 30 integration & unit test assertions verifying Domain, Mapper, and transactional Repository CRUD with PostgreSQL. |
| `docs/activity/ACTIVITY-DATA-ARCHITECTURE-IMPLEMENTATION-PHASE-2.md` | Documentation | This comprehensive Phase 2 report. |

### 2.2 Modified Files
| File Path | Layer | Key Modifications |
| :--- | :--- | :--- |
| `modules/activity-plans/application/validations.ts` | Application | Added schemas for normalized stores, products, marketing items, promotion items, and tour data. Removed `@prisma/client` import; made approval schema client-safe. |
| `modules/activity-plans/application/index.ts` | Application / Use Case | Updated `createActivityPlanUseCase`, `duplicateActivityPlanUseCase`, and `updateActivityPlanUseCase` to use `normalizePlanInput` and omit legacy `items`. |
| `modules/activity-plans/application/demo-plots.ts` | Application | Removed legacy `findLegacyDemoPlotItems` regex extraction logic; reads normalized `demo_plot_visits`. |
| `modules/activity-plans/infrastructure/activity-plan.repository.ts` | Repository | Replaced all legacy `tx.activityPlanItem` calls in `createActivityPlan`, `updateActivityPlan`, and queries with normalized tables (`activity_plan_stores`, `activity_plan_products`, `activity_plan_marketing_items`, `activity_plan_promotion_items`, `activity_plan_tours`, `demo_plot_visits`). Implemented transactional child collection synchronization. |
| `modules/activity-plans/infrastructure/promotional-material.repository.ts` | Repository | Updated `checkPromotionalMaterialUsage` to query `db.activityPlanMarketingItem.count({ where: { materialName: productName } })` instead of legacy `activityPlanItem`. |
| `modules/activity-plans/features/actual-view/utils/plan-extractor.ts` | Consumer Utility | Refactored from 1291 lines of legacy regex parsing to 506 lines of typed extraction from normalized relations (`stores`, `products`, `marketingItems`, `promotionItems`, `tour`, `helpers`). |
| `modules/activity-plans/features/detail-view/utils.ts` | Consumer Utility | Updated `extractWorkTypeSections`, `extractMarketingProducts`, and `extractSalesPromotions` to read from normalized tables. |
| `modules/activity-plans/features/detail-view/activity-plan-detail-view.tsx` | View Component | Removed `plan.items` references; renders from `plan.stores`, `plan.products`, `plan.marketingItems`, `plan.promotionItems`, and `plan.tour`. |
| `modules/activity-plans/features/detail-view/components/detail-header.tsx` | View Component | Removed fallback to `plan.items`. |
| `modules/activity-plans/features/detail-view/components/plan-vs-actual.tsx` | View Component | Removed fallback to `plan.items`; binds directly to normalized `plan.products` vs `actualProducts`. |
| `modules/activity-plans/features/approve-view/activity-plan-approval-detail-view.tsx` | View Component | Removed `plan.items` references. |
| `modules/activity-plans/features/approve-view/activity-plan-approval-list-view.tsx` | View Component | Removed legacy item references. |
| `modules/activity-plans/features/approve-view/components/approval-detail-drawer.tsx` | View Component | Removed fallback to `plan.items`. |
| `modules/activity-plans/features/form/activity-plan-edit-view.tsx` | Form View | Initialized edit form values from normalized `stores`, `products`, `marketingItems`, `promotionItems`, `tour` instead of `plan.items`. |

---

## 3. Detailed Architecture Breakdown

### 3.1 Domain Layer (`modules/activity-plans/domain/`)
- **Isolation:** Contains zero imports of `@prisma/client`, Prisma, databases, or Node server modules. Completely pure TypeScript.
- **`budget-calculator.ts`**:
  - `calculateMarketingBudget(items)`: $\sum (\text{quantity} \times \text{unitPrice})$
  - `calculatePromotionBudget(items)`: $\sum \text{amount}$
  - `calculateTotalBudget(mkt, promo)`: $\text{mkt} + \text{promo}$
  - `calculateTargetSales(products)`: $\sum \text{targetAmount}$ (or $\text{targetQuantity} \times \text{unitPrice}$)
  - `calculateBudgetSalesRatio(totalBudget, targetSales)`: $(\text{totalBudget} / \text{targetSales}) \times 100$
  - `isPriceOverridden(masterPrice, unitPrice)`: returns boolean flag without mutating master price.
- **`objective-builder.ts`**:
  - `buildActivityObjective(input)`: formats standard, concise objective string based on work type codes/labels, store names, product targets, and tour destinations.

### 3.2 Application Layer & Plan Mapper (`modules/activity-plans/application/`)
- **`plan-mapper.ts` (`normalizePlanInput`)**:
  - Handles incoming payloads from the UI and converts them to normalized entity collections.
  - Generates zero `ActivityPlanItem` objects.
  - Automatically handles multi-store normalization:
    - If `storeIds` array is provided (e.g. TYPE_11), creates 1 `planStore` row per store with its specific `storeId` and `workTypeCode`.
    - If single store is selected, binds 1 `planStore` row.
  - Normalizes products with `targetQuantity`, `unitPrice`, `masterPrice`, `isPriceOverridden`, and `targetAmount`.
  - Normalizes marketing materials into `marketingItems` (`category`, `materialName`, `unit`, `unitPrice`, `quantity`, `totalAmount`).
  - Normalizes promotions into `promotionItems` (`budgetType`, `detail`, `amount`).
  - Normalizes tour fields into `tourData` (`tourType`, `tourSize`, `country`, `destination`, `storeId`).
  - Extracts and assigns top-level metrics on `ActivityPlan`: `targetAttendeesCount`, `targetBookingSales`, `marketingBudgetRequested`, `salesPromotionBudgetRequested`, `totalBudgetRequested`.

### 3.3 Repository Layer (`modules/activity-plans/infrastructure/`)
- **Transaction Safety in `createActivityPlan`**:
  1. Creates `ActivityPlan` header record with computed budget totals and target metrics.
  2. Creates `ActivityPlanWorkType` records for each selected work type.
  3. Creates `ActivityPlanStore` rows.
  4. Creates `ActivityPlanProduct` rows.
  5. Creates `ActivityPlanTour` (if TYPE_12).
  6. Creates `ActivityPlanMarketingItem` rows.
  7. Creates `ActivityPlanPromotionItem` rows.
  8. Creates `ActivityHelper` records for assisting team members.
  9. Creates `DemoPlotVisit` records (if demo plot linked).
- **Transactional Synchronization in `updateActivityPlan`**:
  - Children records are synchronized atomically in one `db.$transaction`:
    - `activityPlanStore.deleteMany` $\rightarrow$ `createMany`
    - `activityPlanProduct.deleteMany` $\rightarrow$ `createMany`
    - `activityPlanMarketingItem.deleteMany` $\rightarrow$ `createMany`
    - `activityPlanPromotionItem.deleteMany` $\rightarrow$ `createMany`
    - `activityPlanTour.upsert` (or `deleteMany` if tour removed)
    - `activityHelper.deleteMany` $\rightarrow$ `createMany`
  - Eliminates partial-update anomalies where the header could succeed while children failed.
- **Reads (`findActivityPlanById`, `findApprovalQueueData`, `findActivityPlans`)**:
  - Queries fetch directly from normalized relations: `stores`, `products`, `marketingItems`, `promotionItems`, `tour`, `helpers`, `workTypes.activityType`, `attachments`, `result`.
  - No queries touch `activity_plan_items`.

---

## 4. TYPE 1-12 Normalized Data Mapping

| Work Type | Target Normalized Storage | Key Normalized Columns | JSON / Flat Strings Removed |
| :--- | :--- | :--- | :--- |
| **TYPE_1** (เข้าพบร้านค้า) | `activity_plan_stores` | `activityPlanId`, `storeId`, `workTypeCode`, `remarks` (Topic/Detail) | No JSON storage; store details stored in normalized row. |
| **TYPE_2** (ติดตามผลการใช้) | `activity_plan_stores`, `activity_plan_products` | `storeId`, `productId`, `targetQuantity`, `remarks` | Product & store in normalized tables. |
| **TYPE_3** (เสนอขายสินค้า) | `activity_plan_stores`, `activity_plan_products` | `productId`, `masterPrice`, `unitPrice`, `isPriceOverridden`, `targetQuantity`, `targetAmount` | Calculated `targetAmount` = `targetQuantity * unitPrice`. No custom approval bypass. |
| **TYPE_4** (วางบิล / เก็บเงิน) | `activity_plan_stores`, `activity_plans` | `storeId`, `targetAmount` | Target amount in `ActivityPlanStore` / `ActivityPlan`. |
| **TYPE_5** (สำรวจตลาดคู่แข่ง) | `activity_plan_stores`, `activity_plan_products` | `storeId`, `productId`, `surveyData` | Survey parameters mapped to normalized child entities. |
| **TYPE_6** (แก้ปัญหา/รับเรื่อง) | `activity_plan_stores` | `storeId`, `remarks` (Issue detail) | Issue data preserved in normalized store record. |
| **TYPE_7** (ติดตามแปลงสาธิต) | `demo_plot_visits`, `activity_plan_products` | `demoPlotId`, `activityPlanId`, `productId` | Relational foreign key to `DemoPlot`, zero regex parsing. |
| **TYPE_8** (จัดประชุมเกษตรกร) | `activity_plans`, `activity_plan_products`, `activity_helpers` | `location`, `province`, `district`, `targetAttendeesCount`, `helperEmployeeIds` | Attendees count separated on header; helper relations on `activity_helpers`. |
| **TYPE_9** (กิจกรรมหน้าร้าน) | `activity_plan_stores`, `activity_plan_products`, `activity_helpers` | `storeId`, `productId`, `location`, `targetQuantity`, `targetAmount` | Normalized stores, products, helpers. |
| **TYPE_10** (Field Day) | `activity_plans`, `activity_plan_products`, `demo_plot_visits` | `demoPlotId`, `targetAttendeesCount`, `targetBookingSales`, `productId` | `targetBookingSales` is a separated metric column, NOT mixed into `targetSales`. |
| **TYPE_11** (เช็กสต็อกหน้าร้าน) | `activity_plan_stores` | Multiple rows: 1 row per selected store. | **Zero comma-separated strings**. Multiple store selections create $N$ records in `activity_plan_stores`. |
| **TYPE_12** (ทัวร์) | `activity_plan_tours` | `tourType`, `tourSize`, `country`, `destination`, `storeId` | Normalized 1:1 table `activity_plan_tours`. No Actual data required. |

---

## 5. Budget & Actual Mapping

### 5.1 Budget Mapping
- **Marketing Materials**: Stored in `activity_plan_marketing_items`
  - Columns: `id`, `activityPlanId`, `category`, `materialName`, `unit`, `unitPrice`, `quantity`, `totalAmount`.
  - Header metric: `ActivityPlan.marketingBudgetRequested`
- **Sales Promotions**: Stored in `activity_plan_promotion_items`
  - Columns: `id`, `activityPlanId`, `budgetType`, `detail`, `amount`.
  - Header metric: `ActivityPlan.salesPromotionBudgetRequested`
- **Total Budget**: Stored in `ActivityPlan.totalBudgetRequested`

### 5.2 Actual Data Mapping (Plan ≠ Actual)
- **Separation Principle Maintained**:
  - `ActivityPlanProduct.targetQuantity` & `ActivityPlanProduct.targetAmount` $\ne$ `ActivityResultSaleItem.actualQuantity` & `ActivityResultSaleItem.actualTotal`.
  - Actual results are strictly stored in:
    - `activity_results` (Actual header, Qualitative summary `resultSummary`)
    - `activity_result_sale_items` (Actual sales quantities and amounts)
    - `activity_result_stock_items` (Actual inventory counts)
    - `activity_result_survey_items` (Market survey findings)
    - `activity_result_demo_items` (Demo plot visit outcomes)
    - `activity_attachments` (Photo evidence, check-in photos)
- **`resultSummary` constraint**: Used exclusively for qualitative notes/descriptions, never for JSON-serialized business objects.

---

## 6. Client / Server Boundary Audit

1. **`validations.ts` Cleaned**:
   - Removed: `import { ActivityApprovalAction } from "@prisma/client";`
   - Replaced with client-safe Zod enum: `z.enum(["APPROVE", "REJECT", "REQUEST_CORRECTION"])`.
   - Verified that importing `validations.ts` in Client Components will NOT drag `@prisma/client` or Node runtime utilities into the client bundle.
2. **Domain Barrel (`modules/activity-plans/domain/index.ts`)**:
   - Exports only pure functions (`budget-calculator`, `objective-builder`).
   - 100% client-safe and unit-testable without database mocking.
3. **Repository Layer (`infrastructure/activity-plan.repository.ts`)**:
   - Explicitly marked as server-only; imported solely by server actions and API route handlers.

---

## 7. Verification & Automated Test Results

### 7.1 Phase 2 Architecture Test Suite (`scripts/test-phase2-architecture.ts`)
Run command:
```bash
pnpm exec tsx --env-file=.env scripts/test-phase2-architecture.ts
```
**Results: 30 Passed, 0 Failed**
- **Domain Layer (1.1 - 1.10)**:
  - `calculateMarketingBudget`: computes sum correctly.
  - `calculatePromotionBudget`: computes sum correctly.
  - `calculateTotalBudget`: combines marketing and promotion budgets correctly.
  - `calculateTargetSales`: computes product target amount sum correctly.
  - `calculateBudgetSalesRatio`: returns correct percentage.
  - `isPriceOverridden`: detects price changes vs master price accurately.
  - `buildActivityObjective`: correctly outputs standardized objective containing work type titles and entity names.
- **Mapper Layer (2.1 - 2.9)**:
  - TYPE_11: transforms multiple store IDs into 3 separate `planStores` rows with zero comma-separated strings.
  - TYPE_3: verifies `targetAmount` calculation and price override flag preservation.
  - TYPE_10: separates `targetAttendeesCount` and `targetBookingSales` metrics; binds `demoPlotId`.
  - TYPE_12: maps tour fields (`tourType: STORE`, `country: ญี่ปุ่น`) to normalized `tourData`.
- **Repository Integration (3.1 - 3.11)**:
  - `createActivityPlan`: creates header and all normalized child collections (`stores`, `products`, `marketingItems`, `promotionItems`) in one transaction.
  - `findActivityPlanById`: returns populated normalized arrays without `items`.
  - `updateActivityPlan`: executes atomic transactional sync replacing old child records and updating amounts.
  - Cleaned up test fixtures after completion.

### 7.2 Existing Location & Team Conditional Visibility Suite
Run command:
```bash
pnpm exec tsx --env-file=.env scripts/test-location-team-visibility.ts
```
**Results: 62 Passed, 0 Failed**
- Validates all conditional display rules (TC-1 to TC-10) for locations, provinces, districts, and helper employee selection across all 12 work types.

### 7.3 TypeScript Typecheck (`tsc --noEmit`)
Run command:
```bash
pnpm exec tsc --noEmit
```
**Results:**
- **Application & Module Code:** 0 Errors.
- **Deferred Seed Files:** 5 errors in `prisma/seed/activity/seed-helpers.ts` and `scripts/seed-activity-uat.ts`. As strictly instructed in the prompt (*"ห้ามแก้ Seed ใน Phase นี้ Seed จะทำใน Phase ถัดไป หลัง Application Flow ผ่านแล้ว"*), seed scripts are intentionally deferred to the dedicated Seed Phase.

---

## 8. Remaining UI Data Contract Gaps (for Phase 3)

| Component / File | Current UI Behavior | Target Contract | Action Planned for Phase 3 |
| :--- | :--- | :--- | :--- |
| `activity-plan-form.tsx` (TYPE_11) | UI sends single `storeId` or text list in some cases. | UI form should allow multi-store selector and send `storeIds: string[]`. Backend mapper currently handles both, but UI form needs multi-select component polish. | Refactor UI store selector in Phase 3. |
| `activity-plan-form.tsx` (Budget Items) | Form uses older table inputs for marketing materials and sales promotions. | Form inputs should cleanly separate marketing items from promotion items and send typed arrays directly. | Refactor budget step in UI form in Phase 3. |
| `activity-plan-form.tsx` (TYPE_10 Field Day) | Field Day fields (`targetBookingSales`, `targetAttendeesCount`, `demoPlotId`) were previously embedded inside form detail strings. | Form should bind directly to top-level fields `targetBookingSales`, `targetAttendeesCount`, `demoPlotId`. | Align form state with normalized schema in Phase 3. |
| `prisma/seed/activity/seed-helpers.ts` & `scripts/seed-activity-uat.ts` | Seed scripts still call `tx.activityPlanItem.createMany`. | Must create records in `activity_plan_stores`, `activity_plan_products`, `activity_plan_marketing_items`, etc. | Update seeds in Phase 3 / Seed phase. |

---

## 9. Risks & Mitigation

1. **Stale Browser Caches / Next.js Dev Cache**:
   - *Risk*: Next.js dev server may cache old compiled server actions if hot reload fails.
   - *Mitigation*: Restart dev server when switching between phases.
2. **Seed Migration Requirement**:
   - *Risk*: Running `pnpm db:seed` will fail until seeds are refactored in Phase 3.
   - *Mitigation*: Dedicated seed refactor is scheduled as the very next step in Phase 3.

---

## 10. Strict Stop Declaration

Phase 2 implementation, domain isolation, repository transaction refactoring, mapper unification, consumer extractor rewrites, and test verification are **100% Complete**.

In accordance with the project instructions:
- **NO Phase 3 work has been initiated.**
- **NO UI redesign or form behavior modification has been performed.**
- **NO seed files have been modified.**
- **NO Git commits or pushes have been made.**
- **Standing by for user review and authorization before proceeding.**
