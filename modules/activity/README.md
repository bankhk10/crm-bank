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
│   └── type-1/                           # ⭐ GOLD STANDARD VERTICAL SLICE: เข้าพบร้านค้า / Key Farmer
│       ├── planned/                      # กิจกรรม "ในแผน" (Trip Plan)
│       │   ├── application/              # Validation schemas, Mappers, Business Logic
│       │   ├── components/               # Type1PlannedForm, Type1PlanCard, Type1DetailView, Type1ApprovalCard, Type1ActualForm
│       │   ├── hooks/                    # useType1PlannedForm, useType1Actual
│       │   ├── infrastructure/           # type1PlannedStrategy (Prisma Save/Update)
│       │   └── types/                    # planned.types.ts, actual.types.ts
│       │
│       ├── unplanned/                    # กิจกรรม "นอกแผน" (Unplanned 2-in-1: สร้างพร้อมบันทึกผล)
│       │   ├── application/              # Validation schemas, Mappers
│       │   ├── components/               # Type1UnplannedForm
│       │   ├── hooks/                    # useType1UnplannedForm
│       │   ├── infrastructure/           # type1UnplannedStrategy
│       │   └── types/                    # unplanned.types.ts
│       │
│       ├── shared/                       # สิ่งที่ใช้ร่วมกันภายใน Type 1 (Constants, Types)
│       └── index.ts                      # Unified Public API Contract for Type 1
│
├── ui/                                   # Common UI Components (ส่วนกลางที่ใช้ร่วมกันทุกประเภทงาน)
│   ├── basic-info/                       # PlanBasicInfoCard, DateTimePicker
│   ├── location-team/                    # PlanLocationTeamCard, usePlanLocationTeam
│   ├── budget/                           # PlanBudgetSection, usePlanBudget
│   ├── notes/                            # PlanNotesCard
│   ├── form-action-buttons.tsx           # FormActionButtons (ปุ่ม ยกเลิก / บันทึกร่าง / ส่งขออนุมัติ)
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
│       ├── components/                   # ApprovalWorkTypeList, ApprovalAuditLogs, HelperReviewDialog
│       ├── hooks/                        # useApprovalDetailLoader
│       ├── activity-plan-approval-detail-view.tsx # Route: /activity-plans/approvals/[id]
│       └── activity-plan-approval-list-view.tsx   # Route: /activity-plans/approvals
│
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
      {statusState.activityResultStatus === "COMPLETED" && isType1 && (
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
  DetailWorkTypeList,
  DetailActivityResultSection,
  DetailAuditLogs,
  CancelPlanDialog,
  DetailViewActions,
} from "./components";

export function ActivityPlanDetailView({ id }) {
  const { plan, targets, type1Targets, mergedLogs, isTypeActive } = useDetailPlanLoader({ id });

  return (
    <section className="space-y-6">
      {/* 1. Header และสถานะ */}
      <DetailHeader plan={plan} />

      {/* 2. การ์ดข้อมูลทั่วไปและงบประมาณ */}
      <DetailOverview plan={plan} />

      {/* 3. รายละเอียดตามประเภทงาน (เรียกใช้ <Type1DetailView /> จาก Type 1 Slice) */}
      <DetailWorkTypeList
        plan={plan}
        targets={targets}
        type1Targets={type1Targets}
        isTypeActive={isTypeActive}
      />

      {/* 4. ผลงานจริง (ถ้ามีบันทึกในฐานข้อมูลแล้ว) */}
      {plan.result && (
        <DetailActivityResultSection plan={plan} />
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
- [ ] ทยอย Migrate ประเภทงาน Type 2 ถึง Type 14 ตามแบบอย่างของ Type 1 Gold Standard
