# Type 12 Feature Module: พาลูกค้าศึกษาดูงาน (Tour)

> **Work Type Code:** `TYPE_12`  
> **Label:** พาลูกค้าศึกษาดูงาน (Tour)  
> **Status:** ✅ Vertical Slice Architecture, Relational Strategy Pattern, Clean Architecture

---

## 1. Overview & Architecture

Feature Module `type-12` รับผิดชอบกระบวนการวางแผนกิจกรรมพาลูกค้าศึกษาดูงาน (ทัวร์) ทั้งทัวร์กลาง (Central Tour) และทัวร์ร้านค้า (Store Tour):

```mermaid
flowchart TD
    subgraph Core Plan
        AP[activity_plans<br/>Activity Plan Header]
        APT[activity_plan_tours<br/>tourType: CENTRAL | STORE<br/>tourSize, country, storeId, destination]
    end

    AP --> APT
```

---

## 2. Directory Structure (Vertical Slice Architecture)

```
modules/activity-plans/features/type-12/
├── types/
│   └── index.ts                 # Consolidated domain types, props & validation contracts
├── application/
│   ├── mapper.ts                # Pure mappers (extractType12PlanTargets, mapType12ToSectionItems)
│   ├── validation.ts            # Pure validation functions (validateType12FormValues)
│   └── type12.strategy.ts      # Server-only WorkTypeStrategy implementation
├── components/
│   ├── type12-plan-card.tsx     # Plan overview card
│   ├── type12-plan-form.tsx     # Plan/Edit creation form (Type12PlanForm / Type12Tour)
│   ├── type12-detail-view.tsx   # Detail view (Type12DetailView / DetailType12Tour)
│   └── type12-approval-card.tsx # Approval view (Type12ApprovalCard / ApprovalType12Tour)
├── hooks/
│   └── use-type12-form.ts       # React hook for plan form state & payload mapping
├── index.ts                     # Public Feature Barrel Export (Client-safe, NO server strategy)
└── README.md                    # This documentation
```

---

## 3. Public API & Isolation Guard

- **Client Components & Hooks:** สามารถ import ตรงจาก `@/modules/activity-plans/features/type-12`
- **Strategy Isolation:** `type12Strategy` อยู่ใน `application/type12.strategy.ts` เท่านั้น และไม่ได้ re-export ผ่าน `index.ts` เพื่อป้องกัน Server bundle รั่วไหล

## 🔗 ความเชื่อมโยงกับระบบส่วนกลาง (Dependencies & External Functions Mapping)

### 1. ฟังก์ชันและโมดูลที่ Slice นี้เรียกใช้งาน (Inbound Dependencies)
| หมวดหมู่ | ฟังก์ชัน / โมดูลที่เรียกใช้ | ที่อยู่ไฟล์ (File Path) | วัตถุประสงค์การใช้งาน |
|---|---|---|---|
| **Infrastructure** | `db (PrismaClient)` | [`lib/db.ts`](file:///lib/db.ts) | ประมวลผล Transaction บันทึกตาราง activity_plan_tours |
| **Application** | `WorkTypeStrategy, PrismaTransaction, StrategyValidationResult` | [`modules/activity-plans/application/strategies/work-type-strategy.interface.ts`](file:///modules/activity-plans/application/strategies/work-type-strategy.interface.ts) | สัญญากลางสำหรับ Strategy Pattern |
| **External Module** | `listCustomersAction, ActivityCustomerSelect` | [`modules/customers/server/actions.ts / components/activity`](file:///modules/customers/server/actions.ts / components/activity) | ค้นหาร้านค้าที่ร่วมเดินทางในทัวร์ |

### 2. จุดที่ระบบส่วนกลางเรียกใช้งาน Slice นี้ (Outbound Integration Points)
| ส่วนกลางที่เรียกใช้ | ไฟล์ที่เรียกใช้ (Caller Path) | สิ่งที่นำไปใช้ (Export / Function) | วัตถุประสงค์ |
|---|---|---|---|
| **Strategy Registry** | [`modules/activity-plans/application/strategies/type-registry.ts`](file:///modules/activity-plans/application/strategies/type-registry.ts) | `Type12Strategy` | ลงทะเบียน Handler สำหรับ Type 12 |
| **Repository Query** | [`modules/activity-plans/infrastructure/activity-plan-include.ts`](file:///modules/activity-plans/infrastructure/activity-plan-include.ts) | `tour` | Eager load ข้อมูลทัวร์ใน findActivityPlanById |
| **Detail Mapper** | [`modules/activity-plans/features/shared/detail-view/utils.ts`](file:///modules/activity-plans/features/shared/detail-view/utils.ts) | `mapType12ToSectionItems` | แปลงข้อมูลทัวร์เพื่อแสดงใน Detail View |
| **Approval Queue** | [`modules/activity-plans/features/shared/approve-view/components/work-types/index.ts`](file:///modules/activity-plans/features/shared/approve-view/components/work-types/index.ts) | `Type12ApprovalCard` | การ์ดแสดงผลในหน้าอนุมัติ |
| **Plan Form** | [`modules/activity-plans/features/shared/form/components/tour-section.tsx`](file:///modules/activity-plans/features/shared/form/components/tour-section.tsx) | `Type12PlanForm` | ฟอร์มบันทึกข้อมูลการเดินทางทัวร์ |

