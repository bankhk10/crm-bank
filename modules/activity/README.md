# Activity Module

> **Module**: `activity`  
> **Purpose**: จัดการวงจรชีวิตของกิจกรรมการลงพื้นที่ทั้งหมด (Trip Plans, Unplanned Visits, Field Results Recording, Approval Workflows) ครอบคลุม 14 ประเภทงาน (Work Types 1 - 14)  
> **Architecture Authority**: [`docs/MODULE_ARCHITECTURE.md`](../../docs/MODULE_ARCHITECTURE.md)  
> **Coding Standards**: [`docs/CODING_STANDARDS.md`](../../docs/CODING_STANDARDS.md)  
> **Gold Standard Reference**: `modules/activity/features/type-1` (ต้นแบบ Vertical Slice สำหรับประเภทงานอื่น)

---

## 1. Module Overview & Core Philosophy

Activity Module ได้รับการออกแบบตามสถาปัตยกรรม **Modular Monolith** ร่วมกับแนวคิด **Pure Declarative Orchestrators** และ **Vertical Slice Architecture** เพื่อแก้ไขปัญหาเดิมของระบบเก่าที่เป็น Monolith ขนาดใหญ่ (ไฟล์ 1,000–1,600 บรรทัดที่รวบ `switch-case` ของ 14 ประเภทงานไว้ในที่เดียว)

### เสาหลักของสถาปัตยกรรม (Core Pillars):
1. **Pure Declarative Orchestrators (Views)**: หน้าจอทุกหน้าใน `views/` ทำหน้าที่เป็นเพียง "ผู้กำกับเวที" (Orchestrator) นำชิ้นส่วน UI ส่วนกลาง (`ui/`) และชิ้นส่วนเฉพาะงาน (`features/type-X`) มาวางเรียงกันอย่างอ่านง่าย โดยไม่มี Business Logic หรือการดึงข้อมูลตรงแทรกอยู่ใน JSX
2. **Gold Standard Vertical Slice (`features/type-1`)**: แต่ละประเภทงานแยกอิสระเป็นโมดูลย่อย มีทั้ง `planned`, `unplanned`, และ `actual` ของตัวเองอย่างชัดเจน พร้อม Strategy บันทึกฐานข้อมูล และ Mapper
3. **Common Reusable UI Blocks (`ui/`)**: ส่วนประกอบที่เป็นของกลาง เช่น ข้อมูลทั่วไป, วันที่/เวลา, พื้นที่และทีมงานร่วมทาง, งบประมาณ, หมายเหตุ และปุ่ม Action ถูกแยกออกมาเพื่อใช้ร่วมกันข้ามทุกประเภทงาน
4. **Zero Database Schema Changes**: รองรับและเชื่อมต่อกับ Prisma Models เดิม (`ActivityPlan`, `ActivityPlanType1Store`, `ActivityResultType1`, ฯลฯ) 100%

---

## 2. Directory Structure

```text
modules/activity/
├── features/                             # Vertical Slices แยกตามประเภทงาน (Work Types 1 - 14)
│   ├── type-1/                           # ⭐ GOLD STANDARD VERTICAL SLICE: เข้าพบร้านค้า / Key Farmer
│   │   ├── planned/                      # กิจกรรม "ในแผน" (Trip Plan)
│   │   ├── unplanned/                    # กิจกรรม "นอกแผน" (Unplanned 2-in-1: สร้างพร้อมบันทึกผล)
│   │   ├── shared/                       # สิ่งที่ใช้ร่วมกันภายใน Type 1 (Constants, Types)
│   │   └── index.ts                      # Unified Public API Contract for Type 1
│   │
│   ├── type-2/                           # 🌾 VERTICAL SLICE: ติดตามผลการใช้สินค้า (Product Follow-up)
│   │   ├── planned/                      # กิจกรรมในแผนและผลการติดตามจริง (Targets, Products, Actual Results)
│   │   ├── unplanned/                    # กิจกรรมนอกแผน 2-in-1 (Unplanned Follow-up)
│   │   ├── shared/                       # Constants และ Shared Types ของ Type 2
│   │   ├── README.md                     # เอกสารทางเทคนิคเฉพาะ Type 2
│   │   └── index.ts                      # Unified Public API Contract for Type 2
│   │
│   └── type-3/                           # 💼 VERTICAL SLICE: เสนอขายสินค้า (Product Sales Proposal)
│       ├── planned/                      # แผนเสนอขายและผลงานจริงในแผน (Targets, Products, Actual Sales)
│       ├── unplanned/                    # กิจกรรมนอกแผน 2-in-1 (Unplanned Sales Proposal)
│       ├── shared/                       # Constants (NOT_CLOSED_REASONS) และ Types
│       ├── README.md                     # เอกสารทางเทคนิคเฉพาะ Type 3
│       └── index.ts                      # Unified Public API Contract for Type 3
│
├── server/                               # Server Actions Gateways (Standalone ประจำโมดูล)
│   └── actions.ts                        # createActivityPlanAction, updateActivityPlanAction, getActivityPlanAction ฯลฯ
│
├── infrastructure/                       # Database Infrastructure Repositories & Relation Inclusions
│   ├── activity-plan.repository.ts       # resolveActivityTypeId, generateActivityPlanCode, computeFiscalFields
│   ├── activity-plan-include.ts          # ACTIVITY_PLAN_FULL_INCLUDE (รวม Dedicated Relations ของ Type 1)
│   └── employee-lookup.repository.ts     # findOrCreateEmployeeForUser
│
├── types/                                # Module-level Types & Strategy Interfaces
│   └── strategy.interface.ts             # WorkTypeStrategy, PrismaTransaction, StrategyValidationResult
│
├── domain/                               # Domain Layer (Pure Business Rules & Workflows)
│   ├── approval/                         # 🛡️ Activity Approval Workflow Engine ([README](domain/approval/README.md))
│   │   ├── can-approve.ts                # สิทธิ์การอนุมัติและ Action Scope Badges
│   │   ├── operator-resolver.ts          # การคำนวณผู้รับผิดชอบปัจจุบัน (Step Resolvers)
│   │   └── index.ts                      # Approval Domain Public API
│   │
│   └── summary/                          # 📊 Plan Summary & Extensible Targets Registry
│       ├── types.ts                      # PlanSummaryData, ActualTargetsState, ParsedSummaryValues
│       ├── constants.ts                  # initialPlanSummary, initialTargets, NON_STRICT_OUTCOMES
│       ├── plan-summary-extractor.ts     # Core Extractor (วันเวลา, สถานที่, งบประมาณ, ของเบิก, คนช่วยงาน)
│       ├── plan-targets-registry.ts      # Targets Registry Pattern (Type 1 - 14)
│       ├── plan-extractor.ts             # Main Extractor (extractPlanData)
│       ├── result-summary-parser.ts      # Result Parser (parseResultSummary)
│       └── index.ts                      # Summary Domain Public API
│
├── application/                          # Application Services & Filtering
│   └── filters/                          # Activity Filter Matchers (WorkType, Person, Status, Search)
│
├── hooks/                                # Custom Hooks (useApproverDirectory ฯลฯ)
│
├── ui/                                   # Common UI Components (ส่วนกลางที่ใช้ร่วมกันทุกประเภทงาน)
│   ├── basic-info/                       # PlanBasicInfoCard, DateTimePicker
│   ├── location-team/                    # PlanLocationTeamCard, usePlanLocationTeam
│   ├── budget/                           # PlanBudgetSection, usePlanBudget
│   ├── notes/                            # PlanNotesCard
│   ├── form-action-buttons.tsx           # FormActionButtons (ปุ่ม ยกเลิก / บันทึกร่าง / ส่งขออนุมัติ)
│   ├── activity-status-badge.tsx         # ActivityStatusBadge, ActivityStatusWithOperator
│   └── index.ts                          # UI Public Exports
│
├── views/                                # Pure Declarative Orchestrators (หน้าจอหลักของระบบ)
│   ├── planned/                          # สร้างและแก้ไขแผนงาน (Trip Plan)
│   │   ├── components/                   # planned-activity-form.tsx (Form Orchestrator)
│   │   ├── create-view.tsx               # Route: /activity-plans/new
│   │   └── edit-view.tsx                 # Route: /activity-plans/[id]/edit
│   │
│   ├── unplanned/                        # สร้างและแก้ไขกิจกรรมนอกแผน (Unplanned)
│   │   ├── components/                   # unplanned-activity-form.tsx (2-in-1 Orchestrator)
│   │   ├── create-view.tsx               # Route: /activity-plans/unplanned/new
│   │   └── edit-view.tsx
│   │
│   ├── actual/                           # บันทึกผลการปฏิบัติงานจริง (Actual Result)
│   │   ├── components/                   # ActualViewHeader, ActualPlanSummary, ActivityStatusSection, ActualWorkTypeList
│   │   ├── hooks/                        # useActualPlanLoader, useActualStatusState
│   │   └── activity-plan-actual-view.tsx # Route: /activity-plans/[id]/actual
│   │
│   ├── detail/                           # แสดงรายละเอียดแผนงาน (Read-Only Detail)
│   │   ├── components/                   # DetailWorkTypeList, DetailAuditLogs, CancelPlanDialog
│   │   ├── hooks/                        # useDetailPlanLoader
│   │   └── activity-plan-detail-view.tsx # Route: /activity-plans/[id]
│   │
│   └── approvals/                        # การพิจารณาและอนุมัติแผนงาน (Approvals)
│       ├── components/                   # ApprovalWorkTypeList, ApprovalAuditLogs, HelperReviewDialog, ApprovalActionDialog
│       ├── hooks/                        # useApprovalDetailLoader
│       ├── activity-plan-approval-detail-view.tsx # Route: /activity-plans/approvals/[id]
│       └── activity-plan-approval-list-view.tsx   # Route: /activity-plans/approvals
│
├── constants.ts                          # WORK_TYPE_CONFIG, getWorkTypeCode, STATUS_OPTIONS
├── index.ts                              # Public Module Exports
└── README.md                             # เอกสารคู่มือสถาปัตยกรรม (ไฟล์นี้)
```

---

## 3. รูปแบบการนำไปใช้งาน (Usage Patterns & Code Examples)

ทุกฟอร์มและหน้าจอแสดงผลถูกออกแบบในลักษณะ **Declarative Composition** ทำให้เข้าใจโครงสร้างหน้าจอได้ทันทีเพียงแค่อ่านส่วนของ JSX

### 3.1 แบบที่ 1: การบันทึกผลการปฏิบัติงานจริง (`Actual Result View`)

นำส่วนประกอบส่วนกลางมาร้อยเรียงเข้ากับฟอร์มบันทึกผลเฉพาะประเภทงานจาก `features/type-1`:

```tsx
import React from "react";
import {
  ActualPlanSummary,
  ActivityStatusSection,
} from "./components";
import {
  Type1ActualForm,
  useType1Actual,
} from "@/modules/activity/features/type-1";
import { FormActionButtons } from "@/modules/activity/ui";

export function ActualFormExample({ plan, statusState, isType1 }) {
  const type1Actual = useType1Actual();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 1. ส่วนกลาง: สรุปแผนเดิม */}
      <ActualPlanSummary plan={plan} />

      {/* 2. ส่วนกลาง: สถานะการลงพื้นที่ (สำเร็จ / เลื่อน / ยกเลิก) */}
      <ActivityStatusSection
        status={statusState.activityResultStatus}
        setStatus={statusState.setActivityResultStatus}
        cancelReason={statusState.cancelReason}
        setCancelReason={statusState.setCancelReason}
        postponedDate={statusState.postponedDate}
        setPostponedDate={statusState.setPostponedDate}
      />

      {/* 3. ส่วนเฉพาะ Type 1: ฟอร์มผลการเข้าพบจริง + ถ่ายรูป GPS (ดึงจาก features/type-1) */}
      {(statusState.activityResultStatus === "COMPLETED" ||
        statusState.activityResultStatus === "PARTIAL") &&
        isType1 && (
          <Type1ActualForm
            isVisible={true}
            targets={targets}
            targetActualResults={type1Actual.t1TargetItems}
            onUpdateTargetActualResults={type1Actual.syncFromTargetItems}
            productAdvice={type1Actual.t1ProductAdvice}
            discussionResult={type1Actual.t1DiscussionResult}
            salesOpportunity={type1Actual.t1SalesOpportunity}
            nextAction={type1Actual.t1NextAction}
            nextMeetingDate={type1Actual.t1NextMeetingDate}
            plotImages={type1Actual.t1PlotImages}
            setPlotImages={type1Actual.setT1PlotImages}
          />
        )}

      {/* 4. ส่วนกลาง: สรุปค่าใช้จ่ายจริง & สื่อของแถมจริง */}
      <ActualExpenseSection planSummary={planSummary} />

      {/* ปุ่มบันทึกผลการปฏิบัติงาน */}
      <FormActionButtons
        submitLabel="บันทึกผลการปฏิบัติงาน"
        isSubmitting={isSubmitting}
        onCancel={handleCancel}
      />
    </form>
  );
}
```

---

### 3.2 แบบที่ 2: ฟอร์มสร้างแผนงานตามแผน (`Planned Activity Form`)

ร้อยเรียงชิ้นส่วน Common UI Cards สำหรับสร้างแผนงานล่วงหน้า:

```tsx
import React from "react";
import {
  PlanBasicInfoCard,
  PlanLocationTeamCard,
  PlanBudgetSection,
  PlanNotesCard,
  FormActionButtons,
} from "@/modules/activity/ui";
import {
  Type1PlannedForm,
  useType1PlannedForm,
} from "@/modules/activity/features/type-1";

export function PlannedActivityForm({ basicProps, locationProps, budgetProps }) {
  const type1Form = useType1PlannedForm();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 1. ส่วนกลาง: ข้อมูลระบบ วันและเวลา */}
      <PlanBasicInfoCard {...basicProps} />

      {/* 2. ส่วนกลาง: เลือกพื้นที่ & ทีมงานร่วมทาง */}
      <PlanLocationTeamCard {...locationProps} />

      {/* 3. ส่วนเฉพาะ Type: ดึงมาจาก features/type-1 */}
      {isType1 && (
        <Type1PlannedForm
          items={type1Form.items}
          onAddItem={type1Form.addItem}
          onDeleteItem={type1Form.deleteItem}
          onUpdateItem={type1Form.updateItem}
        />
      )}

      {/* 4. ส่วนกลาง: งบประมาณและค่าใช้จ่าย */}
      <PlanBudgetSection {...budgetProps} />

      {/* 5. ส่วนกลาง: หมายเหตุเพิ่มเติม */}
      <PlanNotesCard notes={notes} onNotesChange={setNotes} />

      {/* ปุ่ม Action (ยกเลิก / บันทึกร่าง / ส่งขออนุมัติ) */}
      <FormActionButtons
        isSubmitting={isSubmitting}
        onCancel={handleCancel}
        onSaveDraft={handleDraftSubmit}
      />
    </form>
  );
}
```

---

### 3.3 แบบที่ 3: ฟอร์มกิจกรรมนอกแผน (`Unplanned Activity Form`)

รูปแบบ 2-in-1 สำหรับการลงพื้นที่ทันทีโดยไม่ได้วางแผนล่วงหน้า (ระบุเป้าหมายพร้อมบันทึกผลจริงในฟอร์มเดียว):

```tsx
import React from "react";
import {
  PlanBasicInfoCard,
  PlanLocationTeamCard,
  PlanBudgetSection,
  PlanNotesCard,
  FormActionButtons,
} from "@/modules/activity/ui";
import {
  Type1UnplannedForm,
  useType1UnplannedForm,
} from "@/modules/activity/features/type-1";

export function UnplannedActivityForm({ basicProps, locationProps, budgetProps }) {
  const type1Unplanned = useType1UnplannedForm();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 1. ส่วนกลาง: ข้อมูลระบบ วันและเวลา (ระบุประเภทเป็น UNPLANNED) */}
      <PlanBasicInfoCard {...basicProps} isUnplanned />

      {/* 2. ส่วนกลาง: เลือกพื้นที่ & เพื่อนร่วมงาน */}
      <PlanLocationTeamCard {...locationProps} />

      {/* 3. ส่วนเฉพาะ Type 1 นอกแผน (2-in-1: ระบุร้านค้า/เกษตรกร + บันทึกผลพูดคุย + ถ่ายรูป GPS) */}
      {isType1 && (
        <Type1UnplannedForm
          items={type1Unplanned.items}
          onAddItem={type1Unplanned.addItem}
          onDeleteItem={type1Unplanned.deleteItem}
          onUpdateItem={type1Unplanned.updateItem}
        />
      )}

      {/* 4. ส่วนกลาง: งบประมาณที่ใช้จริง */}
      <PlanBudgetSection {...budgetProps} />

      {/* 5. ส่วนกลาง: หมายเหตุ */}
      <PlanNotesCard notes={notes} onNotesChange={setNotes} />

      {/* ปุ่มบันทึกกิจกรรมนอกแผน */}
      <FormActionButtons
        submitLabel="บันทึกกิจกรรมนอกแผน"
        isSubmitting={isSubmitting}
        onCancel={handleCancel}
      />
    </form>
  );
}
```

---

### 3.4 แบบที่ 4: หน้ารายละเอียดแผนงาน (`Detail View`)

แสดงข้อมูลแบบ Read-only และแยก Accordion ตามประเภทงาน:

```tsx
import React from "react";
import {
  DetailHeader,
  DetailOverview,
  DetailWorkTypeList,
  DetailActivityStatusSection,
  DetailAuditLogs,
  CancelPlanDialog,
  DetailViewActions,
} from "./components";

export function ActivityPlanDetailView({ id }) {
  const { plan, targets, type1Targets, parsedResults, mergedLogs, isTypeActive } = useDetailPlanLoader({ id });

  return (
    <section className="space-y-6">
      {/* 1. Header และสถานะ */}
      <DetailHeader plan={plan} />

      {/* 2. การ์ดข้อมูลทั่วไปและงบประมาณ */}
      <DetailOverview plan={plan} />

      {/* 3. รายละเอียดตามประเภทงาน (เรียกใช้ <Type1DetailView /> จาก Type 1 Slice ซึ่งแสดงทั้งเป้าหมายและผลงานจริง) */}
      <DetailWorkTypeList
        plan={plan}
        targets={targets}
        type1Targets={type1Targets}
        isTypeActive={isTypeActive}
      />

      {/* 4. สถานะผลการปฏิบัติงานจริง (ถ้ามีบันทึก) */}
      {plan.result && parsedResults.activityResultStatus && (
        <DetailActivityStatusSection activityResultStatus={parsedResults.activityResultStatus} />
      )}

      {/* 5. บันทึกประวัติการดำเนินการ (Audit Logs) */}
      <DetailAuditLogs logs={mergedLogs} />

      {/* 6. ปุ่ม Action ด้านล่าง (ย้อนกลับ / ขอยกเลิกแผน) */}
      <DetailViewActions />
    </section>
  );
}
```

---

### 3.5 แบบที่ 5: หน้าพิจารณาอนุมัติ (`Approval View`)

แสดงข้อมูลสรุปเพื่อการตัดสินใจ พร้อม Action Panel อนุมัติ / ปฏิเสธ / ส่งกลับแก้ไข:

```tsx
import React from "react";
import {
  ApprovalWorkTypeList,
  ApprovalAuditLogs,
  HelperReviewDialog,
  ApprovalActionDialog,
} from "./components";

export function ActivityPlanApprovalDetailView({ id }) {
  const { plan, targets, type1Targets, canPerformApproval, isTypeActive } = useApprovalDetailLoader({ id });

  return (
    <section className="space-y-6">
      {/* 1. Header และสถานะผู้ดำเนินการปัจจุบัน */}
      <ApprovalHeader plan={plan} />

      {/* 2. ข้อมูลทั่วไปและคนช่วยงาน */}
      <ApprovalOverview plan={plan} />

      {/* 3. การ์ดพิจารณาตามประเภทงาน (เรียกใช้ <Type1ApprovalCard /> จาก Type 1 Slice) */}
      <ApprovalWorkTypeList
        plan={plan}
        targets={targets}
        type1Targets={type1Targets}
        isTypeActive={isTypeActive}
      />

      {/* 4. ประวัติการอนุมัติตามลำดับขั้น */}
      <ApprovalAuditLogs logs={plan.approvalLogs} />

      {/* 5. แถบปุ่มพิจารณาอนุมัติ (อนุมัติ / ปฏิเสธ / ส่งกลับแก้ไข) */}
      <ApprovalActionPanel canPerformApproval={canPerformApproval} />
    </section>
  );
}
```

---

## 4. Vertical Slice Architecture: Type 1 Gold Standard

แต่ละประเภทงาน (Work Type) ถูกจัดโครงสร้างแบบ Self-Contained ตามรูปแบบของ `features/type-1`:

| โฟลเดอร์ / ไฟล์ | หน้าที่และความรับผิดชอบ |
| :--- | :--- |
| `planned/application/` | Zod Validation Schema (`type1PlannedSchema`) และ Mappers แปลงข้อมูลไป-กลับระหว่าง Form State กับ Prisma Model |
| `planned/components/` | UI Components ประจำประเภทงาน: `Type1PlannedForm`, `Type1PlanCard`, `Type1DetailView`, `Type1ApprovalCard`, `Type1ActualForm` |
| `planned/hooks/` | Custom Hooks สำหรับจัดการ Form State: `useType1PlannedForm`, `useType1Actual` |
| `planned/infrastructure/` | Database Strategy (`type1PlannedStrategy`) สำหรับทำ Transaction บันทึกร้านค้า/แปลงสาธิตลงฐานข้อมูล |
| `planned/types/` | TypeScript interfaces ประจำประเภทงาน: `Type1PlannedItem`, `Type1TargetActualItem`, ฯลฯ |
| `unplanned/` | โครงสร้างแบบเดียวกันสำหรับกิจกรรมนอกแผน (มี validation, mapper, component, hook, strategy แยกเฉพาะ) |
| `shared/` | ค่าคงที่และประเภทข้อมูลร่วมกันในประเภทงาน เช่น `VISIT_TOPICS`, `ProductOption`, `CustomerOption` |
| `index.ts` | **Public API Contract**: ส่งออกเฉพาะสิ่งที่ภายนอกต้องใช้งาน ห้ามภายนอก Import ข้ามชั้นเข้าไปยังไฟล์ภายในโดยตรง |

---

## 5. Next.js 16 App Router & Turbopack Rules

1. **Client Directives (`"use client";`)**:
   * ทุก Hook หรือ Component ที่มีการใช้ React Hooks (`useState`, `useEffect`, `useCallback`, `useMemo`) หรือ Client Events ต้องขึ้นต้นบรรทัดที่ 1 ด้วย `"use client";`
   * ไฟล์ Barrel (`index.ts`) ที่ส่งออก Client Hooks/Components ต้องระวังไม่ให้ Server Components นำไปใช้โดยไม่ผ่าน Client Boundary
2. **Path Aliasing**:
   * การ Import ข้ามโมดูลหรือเข้าสู่ Feature ให้ใช้ Absolute Alias `@/modules/activity/...` เสมอ
   * ห้าม Import ย้อนกลับไปยัง `modules/activity-plans/` เมื่อ Feature นั้นถูก Refactor เข้าสู่ `modules/activity/` แล้ว
3. **Type Safety**:
   * ทุกการแก้ไขต้องผ่านการตรวจสอบ `npx tsc --noEmit` โดยไม่มี Error (Exit code 0)

---

## 6. แผนการพัฒนาต่อไป (Roadmap)

- [x] ออกแบบและสร้าง `modules/activity/features/type-1` (Gold Standard)
- [x] พัฒนา Common UI ใน `modules/activity/ui`
- [x] สลับเส้นทาง Route ทั้งหมดใน `app/(main)/activity-plans/*` มายัง `modules/activity`
- [x] Clean Up หน้า `planned` (สร้างและแก้ไขแผนงาน)
- [x] Clean Up หน้า `unplanned` (กิจกรรมนอกแผน 2-in-1)
- [x] Clean Up หน้า `actual` (บันทึกผลงานจริง)
- [x] Clean Up หน้า `detail` (รายละเอียดแผนงาน)
- [x] Clean Up หน้า `approvals` (การพิจารณาอนุมัติ)
- [x] สร้าง Standalone Server Actions (`server/actions.ts`) ประจำโมดูล activity
- [x] สร้าง Database Infrastructure (`infrastructure/`) และแยกขาดจากการพึ่งพา `modules/activity-plans` 100%
- [x] **Step 1: Approval Workflow & Authority Backbone** (`domain/approval/`, `operator-resolver`, `hooks/use-approver-directory`, Pure UI Badge)
- [x] **Step 2: Plan Summary & Targets Registry Engine** (`domain/summary/`, Extensible Targets Registry, 100% Decoupled Views)
- [x] **Type 2 Vertical Slice**: ติดตามผลการใช้สินค้า (Followup) พร้อม `type2Targets` และ `followupResults`
- [x] **Type 3 Vertical Slice**: เสนอขายสินค้า (Product Sales Proposal) ครบทั้ง Planned, Actual, Unplanned 2-in-1 และ Dual Persistence
- [ ] ทยอย Migrate ประเภทงาน Type 4 ถึง Type 14 ตามแบบอย่างของ Type 1 Gold Standard

---

## 7. ประวัติการปรับปรุง (Change Log)

### Version 1.7.0 (2026-10-20)
- **Type 3 Vertical Slice Complete (เสนอขายสินค้า / Product Sales Proposal)**:
  - พัฒนา Type 3 Vertical Slice ใน `modules/activity/features/type-3/` ตามมาตรฐาน Vertical Slice Architecture อย่างสมบูรณ์ 100%
  - **Shared Core & Constants**: `NOT_CLOSED_REASONS`, `SALE_STATUSES`, `SALE_STATUS_CONFIG`, `StoreOption`, `ProductOption`
  - **Planned Sub-slice**:
    - ฟอร์มและ Hook: `Type3PlanForm`, `Type3PlanCard`, `useType3Form` (รองรับ Dealer/Subdealer, แคตตาล็อกราคา และคำนวณยอดเงินรวมอัตโนมัติ)
    - Application & Validation: Zod schemas (`type3SalesItemSchema`, `type3ProductLineSchema`), `validateType3FormItems` และ Mappers (`extractType3PlanTargets`, `hydrateType3PlannedData`, `mapType3FormToPayload`)
    - Strategy: `type3PlannedStrategy` บันทึกลงตารางเฉพาะ `ActivityPlanType3Target` / `ActivityPlanType3Product` พร้อม Dual Persistence Sync สู่ตาราง generic `ActivityPlanStore` / `ActivityPlanProduct`
  - **Actual & Review Sub-slice**:
    - ฟอร์มและ Hook: `Type3ActualForm`, `useType3Actual`, `Type3DetailView` (ตารางเปรียบเทียบ Target vs Actual), `Type3ApprovalCard`
    - Validation & Mappers: `validateType3Actual`, `parseType3ActualResult`, `mapType3ActualFormToDb` บันทึกลง `ActivityResultSaleItem` (`workTypeCode = TYPE_3`)
  - **Unplanned Sub-slice (กิจกรรมนอกแผน 2-in-1)**:
    - ฟอร์มและ Hook: `Type3UnplannedForm`, `useType3UnplannedForm` (ระบุร้านค้า สินค้า และบันทึกยอดขายจริงพร้อมเหตุผลปิดดีลในหน้าเดียว)
    - Application & Strategy: `unplanned-validation.ts`, `unplanned-mapper.ts`, `type3-unplanned.strategy.ts` ทำงานแบบ Atomic 1 Transaction
  - **Views & Domain Integration**:
    - ผูกเข้ากับ `domain/summary/plan-targets-registry.ts` และ `result-summary-parser.ts`
    - ผูกเข้ากับ View Orchestrators: `PlannedActivityForm`, `UnplannedActivityForm`, `ActualWorkTypeList`, `DetailWorkTypeList`, `ApprovalWorkTypeList` และ `activity-plan-actual-view.tsx`
    - ผูกเข้ากับ Server Actions: `createActivityPlanAction` และ `updateActivityPlanAction` ใน `modules/activity/server/actions.ts`
  - ตรวจสอบผ่าน `npx tsc --noEmit` Exit code 0 สมบูรณ์แบบ 100%

### Version 1.6.1 (2026-10-20)
- **Type 2 Image Deduplication & Multi-Tier Data Sanitation**:
  - แก้ไขปัญหาภาพถ่ายการติดตามผลแสดงซ้ำ 2 รูปใน `Type2DetailView` อันเกิดจากการที่ตาราง `ActivityAttachment` ผูกทั้ง `activityPlanId` และ `activityResultId` ในระเบียนเดียวกัน
  - เพิ่มการกรองรูปภาพซ้ำหลายชั้น (Multi-tier Deduplication):
    - **UI Layer (`Type2DetailView`)**: ใช้ `useMemo` (`uniqueImages`) กรองตาม `id` และ `url` ก่อนเรนเดอร์ Gallery และตัวนับรูป
    - **Domain Layer (`result-summary-parser.ts`)**: Deduplicate `rawAttachments` ก่อนแปลงเข้า `result.t2Images`
    - **View Orchestrator (`DetailWorkTypeList`)**: Deduplicate `effectiveT2Images` fallback
    - **Form State Hook (`useType2Actual`)**: กรองรูปภาพก่อนตั้งค่า Form State
  - ตรวจสอบผ่าน `npx tsc --noEmit` Exit code 0 สมบูรณ์แบบ

### Version 1.6.0 (2026-10-19)
- **Type 2 Vertical Slice Complete (ติดตามผลการใช้สินค้า / Product Follow-up)**:
  - พัฒนา Type 2 Vertical Slice ใน `modules/activity/features/type-2/` ตามต้นแบบ Gold Standard ครบวงจร
  - **Planned Sub-slice**: `Type2PlanForm`, `Type2PlanCard`, `useType2Form`, `type2PlannedStrategy`, Zod Validation (`validateType2FormItems`) และ Mappers (`extractType2PlanTargets`, `hydrateType2PlannedData`)
  - **Actual Sub-slice**: `Type2ActualForm`, `Type2DetailView`, `Type2ApprovalCard`, `useType2Actual`, Zod Validation (`validateType2Actual`) และ Mappers (`parseType2ActualResult`, `mapType2ActualFormToDb`)
  - **Domain Integration**: ลงทะเบียน `TYPE_2` Extractor ใน `domain/summary/plan-targets-registry.ts`
  - **Views Orchestrators**: เชื่อมโยงเข้ากับ `DetailWorkTypeList`, `ApprovalWorkTypeList`, `ActualWorkTypeList` และ `activity-plan-actual-view.tsx`
  - **Server Actions**: ผนวก `type2PlannedStrategy` เข้ากับ `createActivityPlanAction` และ `updateActivityPlanAction`
  - ตรวจสอบผ่าน `npx tsc --noEmit` Exit code 0 สมบูรณ์แบบ 100%

### Version 1.5.1 (2026-10-19)
- **100% Route & Shared Components Migration (Quick Win Complete)**:
  - สลับ Imports ใน Route Pages ทั้งหมดของ `app/(main)/activity-plans/*` (`unplanned/[id]/edit/page.tsx` และ `actual/page.tsx`) มายัง `@/modules/activity` ครบ 100%
  - สลับ `components/activity/activity-photo-upload.tsx` ให้ใช้ Utility และ Type จาก `@/modules/activity/ui/utils/image-uploader`
  - ตรวจสอบผ่าน `npx tsc --noEmit` Exit code 0 สมบูรณ์แบบ

### Version 1.5.0 (2026-10-19)
- **100% Decoupled Backbone (Core Migration Complete)**:
  - สร้าง `domain/approval/` พร้อมคู่มือฉบับเต็ม (`domain/approval/README.md`) แตก Step Resolvers ย่อย (`resolveLineApprover`, `resolveBudgetApprover`, ฯลฯ)
  - สร้าง `domain/summary/` ด้วย **Registry Pattern** รองรับการลงทะเบียน Targets ของ Type 1 ถึง 14 โดยไม่ต้องแก้ Monolithic File ขนาด 1,000 บรรทัดอีกต่อไป
  - แยก `application/filters/activity-filter-matcher.ts` ออกจาก `constants.ts` เพื่อความสะอาดตามมาตรฐาน Clean Architecture
  - แยก Hook `useApproverDirectory()` ออกจาก UI เข้าสู่ `hooks/use-approver-directory.ts`
  - ปรับ `ui/activity-status-badge.tsx` ให้เป็น Pure UI Presentation ลดขนาดโค้ดจาก 600+ บรรทัด เหลือเพียง ~150 บรรทัด
  - สลับ Imports ใน Views ทั้งหมด (`views/approvals`, `views/detail`, `views/actual`, `views/calendar`, `views/list`) ให้ชี้หา `@/modules/activity` ตัวเอง 100%
  - ตรวจสอบผ่าน `npx tsc --noEmit` Exit code 0 สมบูรณ์แบบ โดยไม่มีการแตะต้อง `modules/activity-plans/`


### Version 1.4.0 (2026-10-19)
- **Autonomous Module Infrastructure**:
  - ย้ายและปรับปรุง Repositories ประจำโมดูล (`activity-plan.repository.ts`, `employee-lookup.repository.ts`, `activity-plan-include.ts`)
  - แยกขาด Server Actions Gateway ใน `modules/activity/server/actions.ts`
  - Clean up Type 1 Mappers ตัด fallback `remarks` เหลือเฉพาะมาตรฐาน `topic` และ `notes`

