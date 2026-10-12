# Type 7A Feature Module: ทำแปลงสาธิต (เริ่มทำแปลงใหม่) (New Demo Plot)

> **Work Type Code:** `TYPE_7A`  
> **Status:** ✅ Dedicated Relational Tables (`ActivityPlanType7a`, `ActivityPlanType7aProduct`, `DemoPlot`, `DemoPlotVisit`), Encapsulated Strategy Pattern, Multi-Target UI State

---

## 1. Overview & Architecture

Feature Module `type-7a` รับผิดชอบขั้นตอนการวางแผนและบันทึกผลการทำแปลงสาธิตใหม่ (เริ่มต้นทำแปลง) โดยเชื่อมโยงข้อมูลระหว่าง:
1. ข้อมูลธุรกรรมแผนงาน (`ActivityPlan`)
2. ข้อมูลแปลงสาธิตเฉพาะตามแผน (`ActivityPlanType7a` และผลิตภัณฑ์ที่เบิกใช้สาธิต `ActivityPlanType7aProduct`)
3. ทะเบียนแปลงสาธิตหลัก (`DemoPlot`) ที่ใช้ติดตามต่อเนื่องระยะยาวตลอดฤดูกาล
4. บันทึกการเข้าเยี่ยมรอบแรก (`DemoPlotVisit`) และผลการสาธิต (`activity_results` / `activity_result_demo_items`)

```mermaid
flowchart TD
    subgraph Core Plan
        AP[activity_plans]
        WT[activity_plan_work_types]
    end

    subgraph Type 7A Dedicated Plan Tables
        T7A[activity_plan_type_7a]
        T7AP[activity_plan_type_7a_products]
    end

    subgraph Master & Tracking
        DP[demo_plots]
        DPV[demo_plot_visits]
        AR[activity_results]
        ARDI[activity_result_demo_items]
    end

    AP --> T7A
    T7A --> T7AP
    T7A --> DP
    DP --> DPV
    AP --> DPV
    AP --> AR
    AR --> ARDI
    DP --> ARDI
```

---

## 2. Directory Structure

```
modules/activity-plans/features/type-7a/
├── types/
│   └── index.ts               # Domain types (Type7aTargetItem, Type7aPlanItem, Type7aActualRecord, etc.)
├── application/
│   ├── mapper.ts              # Pure mappers (extractType7aPlanTargets, parseType7aActualResult, mapType7aToSectionItems)
│   └── type7a.strategy.ts     # Server-only WorkTypeStrategy implementation (validatePlan, savePlan, saveActual, loadPlan)
├── shared/
│   ├── types.ts               # Re-exports from ../types
│   └── type7a-plan-card.tsx   # Plan detail card component
├── create/                    # Create form components & validation
├── edit/                      # Edit form components
├── actual/                    # Actual outcome execution components & hooks
├── detail/                    # Detail view components
├── approval/                  # Approval preview components
├── hooks/                     # Custom React hooks (useType7aForm, etc.)
├── index.ts                   # Public Feature Barrel Export (pure mappers & types, NO server strategies)
└── README.md                  # This documentation
```

---

## 3. Data Schema & Persistence

### 3.1 Database Tables

| Table | Prisma Model | Purpose |
|---|---|---|
| `activity_plan_type_7a` | `ActivityPlanType7a` | ข้อมูลแปลงสาธิตที่ระบุไว้ในแผนงาน (1:N กับ ActivityPlan) |
| `activity_plan_type_7a_products` | `ActivityPlanType7aProduct` | ผลิตภัณฑ์และจำนวนที่ขอเบิกเพื่อนำไปสาธิตในแปลง |
| `demo_plots` | `DemoPlot` | ทะเบียนแปลงสาธิตหลัก (เก็บพิกัด, พืช, เจ้าของ, วันที่เริ่ม) |
| `demo_plot_visits` | `DemoPlotVisit` | รอบการเข้าเยี่ยมบันทึกผลการทำแปลง (Visit #1 สำหรับ 7A) |
| `activity_result_demo_items` | `ActivityResultDemoItem` | รายการผลการสาธิต (ยาที่วางแผน vs ยาที่ใช้จริง) |

---

## 4. Strategy & Mapper API

### 4.1 Application Mapper (`application/mapper.ts`)
- **`extractType7aPlanTargets(plan, prevTarget)`**: ดึงข้อมูลเป้าหมายแปลงสาธิตจาก `plan.type7aPlots` (พร้อม relations: `store`, `demoPlot`, `products`) และ fallback ไปยัง `demoPlotVisits` หากเป็นข้อมูลเก่า
- **`parseType7aActualResult(resData)`**: แกะข้อมูลผลการทำแปลงจริง (พิกัด, เกษตรกร, พืช, ผลิตภัณฑ์ที่ใช้จริง, ฯลฯ)
- **`mapType7aToSectionItems(plots)`**: แปลงข้อมูลแปลงสาธิตเป็น Section Items สำหรับแสดงผลใน Activity Plan Detail View

### 4.2 Strategy (`application/type7a.strategy.ts`)
- **`code: "TYPE_7A"`**
- **`validatePlan(planData, db)`**: ตรวจสอบความครบถ้วนของข้อมูลแปลงสาธิต
- **`savePlan(tx, activityPlanId, planData)`**: Sync ข้อมูลลงใน `ActivityPlanType7a` และ `DemoPlot`
- **`saveActual(tx, resultId, actualData)`**: บันทึกผลการทำแปลงสาธิตลงใน `ActivityResultDemoItem`
- **`loadPlan(db, activityPlanId)`**: ดึงข้อมูลแปลงสาธิตพร้อม relations ผ่าน `findType7aByPlanId`

---

## 5. Security & Bundling Guardrails

> [!IMPORTANT]
> **Server Bundle Isolation:** ห้าม Export `type7aStrategy` หรือโมดูลที่เรียก Prisma Client ออกมาจาก `modules/activity-plans/features/type-7a/index.ts` โดยเด็ดขาด เพื่อป้องกันไม่ให้ Client Component Bundle ดึง `@prisma/client-runtime-utils` เข้าไปในเบราว์เซอร์
