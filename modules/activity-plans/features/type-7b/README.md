# Type 7B Feature Module: ติดตามแปลงสาธิต (Follow-up Demo Plot)

> **Work Type Code:** `TYPE_7B`  
> **Status:** ✅ Dedicated Relational Tables (`ActivityPlanType7b`, `ActivityPlanType7bPlot`, `ActivityPlanType7bProduct`, `DemoPlot`, `DemoPlotVisit`), Encapsulated Strategy Pattern, Multi-Target UI State

---

## 1. Overview & Architecture

Feature Module `type-7b` รับผิดชอบขั้นตอนการวางแผนและบันทึกผลการติดตามแปลงสาธิตเดิม (Follow-up Demo Plot) โดยเชื่อมโยงข้อมูลระหว่าง:
1. ข้อมูลธุรกรรมแผนงานติดตาม (`ActivityPlan`)
2. ข้อมูลแปลงสาธิตที่เลือกมาติดตาม (`ActivityPlanType7b` และรายการแปลง `ActivityPlanType7bPlot`, ผลิตภัณฑ์ที่เบิกเพิ่มเติม `ActivityPlanType7bProduct`)
3. ทะเบียนแปลงสาธิตหลัก (`DemoPlot`) ที่สร้างขึ้นมาจากรอบ 7A
4. บันทึกการเข้าเยี่ยมติดตามรอบถัดไป (`DemoPlotVisit`) และผลการติดตาม/ประเมินผลสัมฤทธิ์ (`activity_results` / `activity_result_demo_items`)

```mermaid
flowchart TD
    subgraph Core Plan
        AP[activity_plans]
        WT[activity_plan_work_types]
    end

    subgraph Type 7B Dedicated Plan Tables
        T7B[activity_plan_type_7b]
        T7BP[activity_plan_type_7b_plots]
        T7BPR[activity_plan_type_7b_products]
    end

    subgraph Master & Tracking
        DP[demo_plots - from 7A]
        DPV[demo_plot_visits - visit #2, 3...]
        AR[activity_results]
        ARDI[activity_result_demo_items]
    end

    AP --> T7B
    T7B --> T7BP
    T7B --> T7BPR
    T7BP --> DP
    DP --> DPV
    AP --> DPV
    AP --> AR
    AR --> ARDI
    DP --> ARDI
```

---

## 2. Directory Structure

```
modules/activity-plans/features/type-7b/
├── types/
│   └── index.ts               # Domain types, UI Props, and form validation interfaces
├── application/
│   ├── mapper.ts              # Pure mappers (extractType7bPlanTargets, parseType7bActualResult, mapType7bToSectionItems)
│   ├── validation.ts          # Pure form & actual validation functions
│   └── type7b.strategy.ts     # Server-only WorkTypeStrategy implementation
├── components/
│   ├── type7b-plan-card.tsx   # Plan detail card component (supports PLANNED/UNPLANNED)
│   ├── type7b-plan-form.tsx   # Plan create/edit form row
│   ├── type7b-actual-form.tsx # Actual result execution form
│   ├── type7b-detail-view.tsx # Readonly detail view
│   ├── type7b-approval-card.tsx# Approval card component
│   └── demo-plot-history-modal.tsx# Demo plot history modal dialog
├── hooks/
│   ├── use-type7b-form.ts     # Plan form state management hook
│   └── use-type7b-actual.ts   # Actual form state management hook
├── index.ts                   # Public Feature Barrel Export (pure components, hooks, mappers & types; NO server strategies)
└── README.md                  # This documentation
```

---

## 3. Data Schema & Persistence

### 3.1 Database Tables

| Table | Prisma Model | Purpose |
|---|---|---|
| `activity_plan_type_7b` | `ActivityPlanType7b` | ข้อมูลหัวข้อการติดตามแปลงสาธิต (1:1 กับ ActivityPlan, เชื่อมโยง sourceActivityPlanId) |
| `activity_plan_type_7b_plots` | `ActivityPlanType7bPlot` | รายการแปลงสาธิตที่ระบุติดตามในแผน (เชื่อมโยง demoPlotId ของ DemoPlot) |
| `activity_plan_type_7b_products` | `ActivityPlanType7bProduct` | ผลิตภัณฑ์และจำนวนที่ขอเบิกเพิ่มเติมสำหรับรอบติดตาม |
| `demo_plots` | `DemoPlot` | ทะเบียนแปลงสาธิตหลัก |
| `demo_plot_visits` | `DemoPlotVisit` | บันทึกรอบการเข้าเยี่ยมติดตาม (Visit #2, #3, ...) |
| `activity_result_demo_items` | `ActivityResultDemoItem` | รายการผลการใช้สาร/ผลิตภัณฑ์จริงในแปลง |

---

## 4. Strategy & Mapper API

### 4.1 Application Mapper (`application/mapper.ts`)
- **`extractType7bPlanTargets(plan, prevTarget)`**: ดึงข้อมูลแปลงสาธิตที่ติดตามจาก `plan.type7b` (พร้อม relations: `plots`, `products`, `demoPlot`) และ fallback ไปยัง `demoPlotVisits`
- **`parseType7bActualResult(resData)`**: แกะข้อมูลผลการติดตามจริง (จำนวนวันหลังฉีดพ่น, วิธีการฉีดพ่น, อุปกรณ์, อาการพืช, ผลผลิต, ความพึงพอใจ, รูปภาพสภาพแปลง)
- **`mapType7bToSectionItems(type7b, demoVisits)`**: แปลงข้อมูลแปลงสาธิตติดตามเป็น Section Items สำหรับแสดงผลใน Activity Plan Detail View

### 4.2 Strategy (`application/type7b.strategy.ts`)
- **`code: "TYPE_7B"`**
- **`validatePlan(planData, db)`**: ตรวจสอบว่ามีการระบุแปลงสาธิตที่ต้องการติดตามอย่างน้อย 1 แปลง
- **`savePlan(tx, activityPlanId, planData)`**: Sync ข้อมูลลงใน `ActivityPlanType7b`, `ActivityPlanType7bPlot`, `ActivityPlanType7bProduct` และสร้าง `DemoPlotVisit`
- **`saveActual(tx, resultId, actualData)`**: บันทึกผลการติดตามลงใน `ActivityResultDemoItem`
- **`loadPlan(db, activityPlanId)`**: ดึงข้อมูล 7B พร้อม relations ผ่าน `findType7bByPlanId`

---

## 5. UI & State Integration

- **Multi-Target State Support**: รองรับการติดตามแปลงสาธิตทั้งแบบเดี่ยวและกลุ่ม (`targets.t7b` และ `targets.t7bList`)
- **Host Pages Wiring**:
  - `actual-result-section.tsx`: ส่ง `target={targets.t7b || targets.t7}` และ `targets={targets.t7bList}` เข้าสู่ `ActualType7Demo` (`mode="TYPE_7B"`)
  - `detail-activity-result-section.tsx`: ส่ง `targets={targets.t7bList}` เข้าสู่ `DetailType7Demo` (`mode="TYPE_7B"`)
  - `activity-plan-detail-view.tsx`: ส่ง `targets={targets.t7bList}` เข้าสู่ `ApprovalType7Demo` สำหรับ TYPE_7B
  - `activity-plan-approval-detail-view.tsx`: ส่ง `targets={targets.t7bList}` เข้าสู่ `ApprovalType7Demo` สำหรับ TYPE_7B

## 🔗 ความเชื่อมโยงกับระบบส่วนกลาง (Dependencies & External Functions Mapping)

### 1. ฟังก์ชันและโมดูลที่ Slice นี้เรียกใช้งาน (Inbound Dependencies)
| หมวดหมู่ | ฟังก์ชัน / โมดูลที่เรียกใช้ | ที่อยู่ไฟล์ (File Path) | วัตถุประสงค์การใช้งาน |
|---|---|---|---|
| **Infrastructure** | `db (PrismaClient)` | [`lib/db.ts`](file:///lib/db.ts) | ประมวลผล Transaction บันทึกข้อมูล activity_plan_type_7b และ demoPlotVisits |
| **Infrastructure** | `findFollowUpDemoPlots, findFollowUpActivityPlans` | [`modules/activity-plans/features/type-7b/infrastructure/type-7b.repository.ts`](file:///modules/activity-plans/features/type-7b/infrastructure/type-7b.repository.ts) | ดึงรายการแปลงสาธิตและแผนต้นทาง TYPE_7A เพื่อนำมาติดตามผล |
| **Application** | `WorkTypeStrategy, PrismaTransaction, StrategyValidationResult` | [`modules/activity-plans/application/strategies/work-type-strategy.interface.ts`](file:///modules/activity-plans/application/strategies/work-type-strategy.interface.ts) | สัญญากลางสำหรับ Strategy Pattern |
| **Application** | `type7bProductSchema, type7bPlotSchema, type7bPlanInputSchema` | [`modules/activity-plans/features/type-7b/application/validation.ts`](file:///modules/activity-plans/features/type-7b/application/validation.ts) | Zod Validation Schema ของ Type 7B |
| **Server Actions** | `getFollowUpPlansWithPlotsAction, getFollowUpDemoPlotsAction` | [`modules/activity-plans/server/actions.ts`](file:///modules/activity-plans/server/actions.ts) | ดึงรายการแปลงและแผนต้นทางเพื่อแสดงใน Combobox เลือกแปลง |
| **Shared UI / Utils** | `uploadActivityPlanImageGroup, collectPermanentUrls` | [`modules/activity-plans/features/shared/actual-view/utils/index.ts`](file:///modules/activity-plans/features/shared/actual-view/utils/index.ts) | อัปโหลดรูปภาพผลการติดตามแปลงสาธิต |

### 2. จุดที่ระบบส่วนกลางเรียกใช้งาน Slice นี้ (Outbound Integration Points)
| ส่วนกลางที่เรียกใช้ | ไฟล์ที่เรียกใช้ (Caller Path) | สิ่งที่นำไปใช้ (Export / Function) | วัตถุประสงค์ |
|---|---|---|---|
| **Strategy Registry** | [`modules/activity-plans/application/strategies/type-registry.ts`](file:///modules/activity-plans/application/strategies/type-registry.ts) | `Type7bStrategy` | ลงทะเบียน Handler สำหรับ Type 7B |
| **Plan Repository** | [`modules/activity-plans/infrastructure/activity-plan.repository.ts`](file:///modules/activity-plans/infrastructure/activity-plan.repository.ts) | `getTypeStrategy("TYPE_7B").savePlan` | บันทึก relation การติดตามแปลงสาธิต |
| **Validation Layer** | [`modules/activity-plans/application/validations.ts`](file:///modules/activity-plans/application/validations.ts) | `type7bPlanInputSchema, type7bPlotSchema` | นำเข้า Zod Schema เพื่อตรวจสอบความถูกต้องในระดับภาพรวม |
| **Repository Query** | [`modules/activity-plans/infrastructure/activity-plan-include.ts`](file:///modules/activity-plans/infrastructure/activity-plan-include.ts) | `type7b, demoPlotVisits` | Eager load ข้อมูลการติดตามและรอบการฉีดพ่นใน findActivityPlanById |
| **Detail Mapper** | [`modules/activity-plans/features/shared/detail-view/utils.ts`](file:///modules/activity-plans/features/shared/detail-view/utils.ts) | `mapType7bToSectionItems` | แปลงข้อมูลเพื่อแสดงใน Detail View |
| **Approval Queue** | [`modules/activity-plans/features/shared/approve-view/components/work-types/index.ts`](file:///modules/activity-plans/features/shared/approve-view/components/work-types/index.ts) | `Type7bApprovalCard` | การ์ดแสดงผลในหน้าอนุมัติ |
| **Actual Form** | [`modules/activity-plans/features/shared/actual-view/components/work-types/index.ts`](file:///modules/activity-plans/features/shared/actual-view/components/work-types/index.ts) | `Type7bActualForm, Type7bHistoryModal` | ฟอร์มบันทึกผลและ Modal ประวัติแปลง |

