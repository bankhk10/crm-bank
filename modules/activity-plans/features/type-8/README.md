# Type 8 Feature Module: จัดประชุม (Meeting)

> **Work Type Code:** `TYPE_8`  
> **Label:** จัดประชุม / จัดประชุมการเกษตร / ดีลเลอร์ / ซับดีลเลอร์  
> **Status:** ✅ Relational Strategy Pattern, Multi-Target UI State, Clean Architecture

---

## 1. Overview & Architecture

Feature Module `type-8` รับผิดชอบกระบวนการวางแผนและบันทึกผลจริงของกิจกรรมการจัดประชุม (Meeting) ทั้งการประชุมเกษตรกร, การประชุมกลุ่มร้านค้าดีลเลอร์ และซับดีลเลอร์

```mermaid
flowchart TD
    subgraph Core Plan
        AP[activity_plans<br/>targetAttendeesCount]
        APS[activity_plan_stores<br/>workTypeCode: TYPE_8<br/>remarks: topic, notes: encoded]
        APP[activity_plan_products<br/>TYPE_8: Target Products<br/>TYPE_8_PROMOTION: Promo Products]
    end

    subgraph Actual Outcome
        AR[activity_results<br/>actualAttendeesCount<br/>resultSummary: Q&A]
        ARSI[activity_result_sale_items<br/>workTypeCode: TYPE_8<br/>Target & Additional Sales]
        ATT[activity_attachments<br/>Registration & Atmosphere Photos]
    end

    AP --> APS
    AP --> APP
    AP --> AR
    AR --> ARSI
    AR --> ATT
```

---

## 2. Directory Structure

```
modules/activity-plans/features/type-8/
├── types/
│   └── index.ts               # Domain types, UI Props, and form validation interfaces
├── application/
│   ├── mapper.ts              # Pure mappers (extractType8PlanTargets, parseType8ActualResult, mapType8ToSectionItems)
│   ├── validation.ts          # Pure form & actual validation functions
│   ├── notes.ts               # Storage encoding/decoding utilities (encodeType8StoreNotes, decodeType8StoreNotes)
│   └── type8.strategy.ts     # Server-only WorkTypeStrategy implementation
├── components/
│   ├── type8-plan-card.tsx   # Planned meeting display card component (supports PLANNED/UNPLANNED)
│   ├── type8-plan-form.tsx   # Create/Edit form component
│   ├── type8-actual-form.tsx # Actual result execution form & image upload
│   ├── type8-detail-view.tsx # Read-only result view with Lightbox modal
│   └── type8-approval-card.tsx# Approval view rendering Type8PlanCard(s)
├── hooks/
│   ├── use-type8-form.ts     # Plan form state management hook
│   └── use-type8-actual.ts   # Actual form state management hook
├── index.ts                   # Public Feature Barrel Export (pure components, hooks, mappers & types; NO server strategies)
└── README.md                  # This documentation
```

---

## 3. Data Schema & Persistence

### 3.1 Database Tables

| Table | Prisma Model | Purpose |
|---|---|---|
| `activity_plans` | `ActivityPlan` | เก็บ `targetAttendeesCount` (เป้าหมายจำนวนผู้เข้าร่วมประชุม) |
| `activity_plan_stores` | `ActivityPlanStore` | เก็บสถานที่/ร้านค้าที่จัดประชุม (`workTypeCode: "TYPE_8"`), หัวข้อประชุม (`remarks`), รายละเอียดและโปรโมชันย่อ (`notes` ผ่าน `encodeType8StoreNotes`) |
| `activity_plan_products` | `ActivityPlanProduct` | สินค้าเป้าหมายที่จะนำเสนอ (`workTypeCode: "TYPE_8"`) และรายการสินค้าโปรโมชัน (`workTypeCode: "TYPE_8_PROMOTION"`) |
| `activity_results` | `ActivityResult` | เก็บ `actualAttendeesCount` (จำนวนผู้เข้าร่วมจริง) และ `resultSummary` (ข้อเสนอแนะ / Q&A) |
| `activity_result_sale_items` | `ActivityResultSaleItem` | ยอดขายสินค้าเป้าหมายและสินค้านอกเหนือเป้าหมาย (`workTypeCode: "TYPE_8"`, `actualQuantity`, `actualUnitPrice`, `actualTotal`, `isAdditional`) |
| `activity_attachments` | `ActivityAttachment` | ภาพถ่ายบรรยากาศการประชุม และภาพถ่ายใบลงทะเบียนผู้เข้าร่วมงาน |

---

## 4. Strategy & Mapper API

### 4.1 Application Mapper (`application/mapper.ts`)
- **`extractType8PlanTargets(plan, prevTarget)`**: ดึงข้อมูลเป้าหมายการจัดประชุมจาก `plan.stores` และ `plan.products` พร้อมรองรับโครงสร้างแบบหลายเป้าหมาย (`targets.t8` และ `targets.t8List`)
- **`parseType8ActualResult(resData)`**: แกะข้อมูลผลจริงจากการบันทึก: จำนวนผู้เข้าร่วมจริง, ยอดขายสินค้าเป้าหมาย/เพิ่มเติม, ข้อเสนอแนะ Q&A, และรูปภาพลงทะเบียน/บรรยากาศ
- **`mapType8ToSectionItems(target)`**: แปลงข้อมูลเป้าหมายการประชุมเป็น Section Detail Items แสดงผลในหน้าข้อมูลสรุปแผน

### 4.2 Strategy (`application/type8.strategy.ts`)
- **`code: "TYPE_8"`**
- **`validatePlan(planData, db)`**: ตรวจสอบความถูกต้องของสถานที่หรือร้านค้าที่จัดประชุม
- **`savePlan(tx, activityPlanId, planData)`**: Sync บันทึกร้านค้าและสินค้าเป้าหมาย/โปรโมชัน
- **`saveActual(tx, resultId, actualData)`**: บันทึกรายการยอดขายจากการประชุมลงใน `ActivityResultSaleItem`
- **`loadPlan(db, activityPlanId)`**: Query ข้อมูลแผนการจัดประชุมพร้อม relations `stores` และ `products`

---

## 5. Multi-Target UI State

Type 8 รองรับการจัดประชุมหลายสถานที่หรือหลายหัวข้อภายในหนึ่งแผนงาน:
- `targets.t8`: รายการเป้าหมายแรกสำหรับ fallback
- `targets.t8List`: รายการเป้าหมายการจัดประชุมทั้งหมด
- ส่วนประกอบ UI ทั้งหมด (`ActualType8Meeting`, `DetailType8Meeting`, `ApprovalType8Meeting`) รองรับ prop `targets?: Type8TargetItem[]` เพื่อแสดงการ์ดเป้าหมายอย่างครบถ้วนทุกรายการ

## 🔗 ความเชื่อมโยงกับระบบส่วนกลาง (Dependencies & External Functions Mapping)

### 1. ฟังก์ชันและโมดูลที่ Slice นี้เรียกใช้งาน (Inbound Dependencies)
| หมวดหมู่ | ฟังก์ชัน / โมดูลที่เรียกใช้ | ที่อยู่ไฟล์ (File Path) | วัตถุประสงค์การใช้งาน |
|---|---|---|---|
| **Infrastructure** | `db (PrismaClient)` | [`lib/db.ts`](file:///lib/db.ts) | ประมวลผล Transaction บันทึกข้อมูล targetAttendeesCount และเป้าหมาย |
| **Application** | `WorkTypeStrategy, PrismaTransaction, StrategyValidationResult` | [`modules/activity-plans/application/strategies/work-type-strategy.interface.ts`](file:///modules/activity-plans/application/strategies/work-type-strategy.interface.ts) | สัญญากลางสำหรับ Strategy Pattern |
| **Shared UI / Utils** | `uploadActivityPlanImageGroup, collectPermanentUrls` | [`modules/activity-plans/features/shared/actual-view/utils/index.ts`](file:///modules/activity-plans/features/shared/actual-view/utils/index.ts) | อัปโหลดรูปภาพการประชุมเกษตรกร |
| **External Module** | `listCustomersAction` | [`modules/customers/server/actions.ts`](file:///modules/customers/server/actions.ts) | เลือกร้านค้าหรือพื้นที่เป้าหมาย |

### 2. จุดที่ระบบส่วนกลางเรียกใช้งาน Slice นี้ (Outbound Integration Points)
| ส่วนกลางที่เรียกใช้ | ไฟล์ที่เรียกใช้ (Caller Path) | สิ่งที่นำไปใช้ (Export / Function) | วัตถุประสงค์ |
|---|---|---|---|
| **Strategy Registry** | [`modules/activity-plans/application/strategies/type-registry.ts`](file:///modules/activity-plans/application/strategies/type-registry.ts) | `Type8Strategy` | ลงทะเบียน Handler สำหรับ Type 8 |
| **Detail Mapper** | [`modules/activity-plans/features/shared/detail-view/utils.ts`](file:///modules/activity-plans/features/shared/detail-view/utils.ts) | `mapType8ToSectionItems` | แปลงข้อมูลเพื่อแสดงเป้าหมายและจำนวนผู้เข้าร่วมใน Detail View |
| **Approval Queue** | [`modules/activity-plans/features/shared/approve-view/components/work-types/index.ts`](file:///modules/activity-plans/features/shared/approve-view/components/work-types/index.ts) | `Type8ApprovalCard` | การ์ดแสดงผลในหน้าอนุมัติ |
| **Actual Form** | [`modules/activity-plans/features/shared/actual-view/components/work-types/index.ts`](file:///modules/activity-plans/features/shared/actual-view/components/work-types/index.ts) | `Type8ActualForm` | ฟอร์มบันทึกผลการประชุมกลุ่มเกษตรกร |

