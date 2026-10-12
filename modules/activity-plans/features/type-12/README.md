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
