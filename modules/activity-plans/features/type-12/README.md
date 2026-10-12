# Type 12 Feature Module: พาลูกค้าศึกษาดูงาน (Tour)

> **Work Type Code:** `TYPE_12`  
> **Label:** พาลูกค้าศึกษาดูงาน (Tour / Study Trip)  
> **hasActual:** `false` (ไม่มีการบันทึกผลงานจริง Actual Outcome)  
> **Status:** ✅ Relational Strategy Pattern, Multi-Target UI State, Clean Architecture

---

## 1. Overview & Architecture

Feature Module `type-12` รับผิดชอบกระบวนการวางแผนกิจกรรมพาลูกค้าศึกษาดูงาน (ทัวร์) ทั้งทัวร์กลาง (Central Tour) และทัวร์ร้านค้า (Store Tour):

```mermaid
flowchart TD
    subgraph Core Plan
        AP[activity_plans<br/>Activity Plan Header]
        APT[activity_plan_tours<br/>1:1 Relation with ActivityPlan<br/>tourType: CENTRAL | STORE<br/>tourSize: LARGE | SMALL<br/>country, storeId, destination]
    end

    subgraph Views & Approvals
        PLAN_CARD[Type12PlanCard<br/>Render planned tour details]
        DETAIL[DetailType12Tour<br/>Read-only section view]
        APPROVE[ApprovalType12Tour<br/>Approval review view]
    end

    AP --> APT
    APT --> PLAN_CARD
    PLAN_CARD --> DETAIL
    PLAN_CARD --> APPROVE
```

---

## 2. Directory Structure

```
modules/activity-plans/features/type-12/
├── types/
│   └── index.ts               # Domain types (TourType, TourSize, Type12TargetItem, Type12PlanItem, Props)
├── application/
│   ├── mapper.ts              # Pure mappers (extractType12PlanTargets, mapType12ToSectionItems)
│   └── type12.strategy.ts    # Server-only WorkTypeStrategy implementation (validatePlan, savePlan, loadPlan)
├── shared/
│   ├── types.ts               # Re-exports domain types for backward compatibility
│   └── type12-plan-card.tsx  # Planned Tour display card component
├── create/                    # Create form components & validation
│   ├── type12-tour.tsx
│   ├── types.ts
│   └── validation.ts
├── edit/                      # Edit form components
│   └── edit-type12.tsx
├── detail/                    # Read-only Detail view
│   ├── detail-type12-tour.tsx
│   └── types.ts
├── approval/                  # Approval view
│   ├── approval-type12-tour.tsx
│   └── types.ts
├── hooks/
│   └── use-type12-form.ts     # React hook for creation/edit form state & payload mapping
├── index.ts                   # Public Feature Barrel Export (pure mappers & types, NO server strategies)
└── README.md                  # This documentation
```

---

## 3. Data Schema & Persistence

### 3.1 Database Tables

| Table | Prisma Model | Purpose |
|---|---|---|
| `activity_plans` | `ActivityPlan` | Header แผนงานกิจกรรม |
| `activity_plan_tours` | `ActivityPlanTour` | รายละเอียดทัวร์ศึกษาดูงานแบบ 1:1 กับ ActivityPlan (`tourType`, `tourSize`, `country`, `storeId`, `destination`) |

> **หมายเหตุ:** กิจกรรม Type 12 ไม่มีตาราง Actual Result (`hasActual: false`) เนื่องจากการศึกษาดูงานเป็นการยืนยันการเข้าร่วมในขั้นตอนแผนและอนุมัติ โดยไม่ต้องมีการบันทึกผลงานจริง (Actual Result Section)

---

## 4. Strategy & Mapper API

### 4.1 Application Mapper (`application/mapper.ts`)
- **`extractType12PlanTargets(plan, prevTarget)`**: ดึงข้อมูลทัวร์จาก `plan.tour` หรือ `plan.tourData` พร้อมรองรับโครงสร้างแบบหลายเป้าหมาย (`targets.t12` และ `targets.t12List`)
- **`mapType12ToSectionItems(tour, objectiveLines)`**: แปลงข้อมูลทัวร์เป็น Section Detail Items สำหรับหน้าแสดงผลสรุปแผนงาน

### 4.2 Strategy (`application/type12.strategy.ts`)
- **`code: "TYPE_12"`**
- **`validatePlan(planData, db)`**: ตรวจสอบความถูกต้องของแผนทัวร์ (หากเป็นทัวร์ร้านค้าต้องมีร้านค้าหรือสถานที่ หากเป็นทัวร์กลางต้องมีประเทศปลายทาง)
- **`savePlan(tx, activityPlanId, planData)`**: Sync บันทึก/ลบข้อมูลทัวร์ลงใน `ActivityPlanTour` ภายใน Transaction เดียวกัน
- **`loadPlan(db, activityPlanId)`**: Query ข้อมูลแผนทัวร์พร้อม relation `store`

---

## 5. UI Integration

Type 12 รองรับการเชื่อมต่อ UI ทั้งแบบ Props เดิมและแบบ Domain State:
- `targets.t12`: ข้อมูลเป้าหมายทัวร์หลัก
- `targets.t12List`: รายการเป้าหมายทัวร์ทั้งหมด
- `Type12PlanCard`, `DetailType12Tour`, `ApprovalType12Tour` รองรับทั้ง `target?: Type12TargetItem`, `targets?: Type12TargetItem[]` รวมถึง individual props (`tourType`, `tourSize`, `country`, `storeName`, `destination`)
