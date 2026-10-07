# Architecture Decisions - CRM System

> **Version**: 3.0.0  
> **Updated**: 2026-08-28  
> **Related**: [ARCHITECTURE.md](./ARCHITECTURE.md) | [AI_CONTEXT.md](./AI_CONTEXT.md) | [CODING_STANDARDS.md](./CODING_STANDARDS.md) | [MODULE_ARCHITECTURE.md](./MODULE_ARCHITECTURE.md)

---

## Overview

เอกสารนี้บันทึกเหตุผลเชิงสถาปัตยกรรมสำหรับการตัดสินใจสำคัญของระบบ CRM ในรูปแบบ Architecture Decision Records (ADR)

ใช้สำหรับบันทึก:

- เหตุผลที่เลือกแนวทางทางเทคนิค
- ข้อจำกัดที่นำไปสู่การตัดสินใจ
- ผลกระทบของการตัดสินใจ
- กฎที่ควรรักษาไว้เมื่อมีการแก้ไขระบบในอนาคต

> **สำคัญ:** ADR เป็นบันทึกเหตุผลของการตัดสินใจ ไม่ใช่คู่มือ Implementation รายละเอียดทั้งหมด  
> สำหรับมาตรฐาน Module ให้ดู `MODULE_ARCHITECTURE.md`  
> สำหรับ Coding Standards ให้ดู `CODING_STANDARDS.md`

---

# ADR-001: Next.js App Router

## Decision

ใช้ Next.js App Router แทน Pages Router

## Context

- ต้องการ Full-stack framework
- ต้องการ Server Components
- ต้องการ API Routes ใน project เดียว

## Rationale

- **Server Components**: ลด JavaScript ที่ส่งไปยัง client เมื่อเหมาะสม
- **Streaming**: รองรับประสบการณ์การโหลดแบบ streaming
- **Layouts**: รองรับ nested layouts สำหรับ main/auth
- **API Routes**: อยู่ใน Next.js project เดียวกัน

## Consequences

- ✅ Single codebase
- ✅ Better developer experience
- ⚠️ มี learning curve สำหรับทีม
- ⚠️ Library บางตัวอาจมีข้อจำกัดด้าน compatibility

---

# ADR-002: Prisma ORM

## Decision

ใช้ Prisma เป็น ORM หลัก

## Context

- ต้องการ Type-safe database access
- ต้องการ Schema management
- ต้องการ Migration support
- ต้องการจัดการ Relations แบบชัดเจน

## Rationale

- **Type Safety**: มี generated types จาก schema
- **Schema as Code**: `schema.prisma` เป็น source of truth สำหรับ database structure
- **Migrations**: รองรับการ version-control database changes
- **Relations**: Declarative relation definitions

## Consequences

- ✅ Type safety และ autocomplete ดีขึ้น
- ✅ Database schema ชัดเจน
- ✅ Relations อยู่ใน schema เดียว
- ⚠️ Query บางประเภทอาจต้องใช้ Prisma-specific patterns
- ⚠️ ต้องพิจารณา performance สำหรับ query ที่ซับซ้อน

---

# ADR-003: Soft Delete Pattern

## Decision

ใช้ `deletedAt` แทนการ hard delete สำหรับ Entity ที่รองรับ Soft Delete

## Context

- Business ต้องการ audit trail
- อาจต้อง restore ข้อมูล
- Hard delete อาจทำให้ relations หรือ historical data สูญหาย

## Rationale

```prisma
model Entity {
  deletedAt DateTime?
}
```

ความหมาย:

```text
deletedAt = null
    → Active

deletedAt = date
    → Deleted
```

## Implementation Principle

Repository/query ที่เกี่ยวข้องต้องพิจารณา soft-deleted records และกรองออกเมื่อเหมาะสม:

```ts
where: {
  deletedAt: null,
}
```

การ hard delete อนุญาตเฉพาะเมื่อ Domain และ Project Architecture กำหนดไว้อย่างชัดเจน

## Consequences

- ✅ Data recoverable
- ✅ Historical records preserved
- ✅ ลดความเสี่ยงจากการลบข้อมูลถาวร
- ⚠️ ต้องไม่ลืม filter deleted records
- ⚠️ Storage เติบโตตามจำนวน records

---

# ADR-004: RBAC with Data Access Levels

## Decision

ใช้ RBAC พร้อม Data Access / Edit / Delete Levels เพื่อควบคุมสิทธิ์ตามทรัพยากร

## Context

- Manager ต้องเห็นข้อมูลลูกน้อง
- Sales อาจเห็นเฉพาะข้อมูลของตัวเอง
- Admin สามารถเห็นข้อมูลได้กว้างกว่า
- ต้องแยกสิทธิ์การ View/Edit/Delete

## Rationale

ตัวอย่างแนวคิด:

```prisma
enum DataAccessLevel {
  VIEW_OWN
  VIEW_TEAM
  VIEW_DEPARTMENT
  VIEW_ALL
}
```

ระดับจริงต้องยึดค่าปัจจุบันใน `prisma/schema.prisma`

## Implementation Principle

Protected server operations ต้องตรวจสอบ:

```text
Authentication
    ↓
Permission
    ↓
Data Access Rules
    ↓
Application Logic
```

## Consequences

- ✅ Fine-grained access control
- ✅ Secure server-side boundary
- ⚠️ Permission logic ซับซ้อนขึ้น
- ⚠️ Query อาจซับซ้อนและต้องคำนึงถึง performance

---

# ADR-005: Customer Hierarchy (Self-Reference)

## Decision

ใช้ self-referencing relation สำหรับ Customer hierarchy

## Context

- Dealer → Subdealer → Farmer
- ต้องการแสดง parent/child relationships

## Rationale

แนวคิด:

```prisma
model Customer {
  parentDealerId String?
}
```

และมี relation กลับไปยัง children

## Consequences

- ✅ Flexible hierarchy
- ✅ รองรับการ query ขึ้น/ลงใน tree
- ⚠️ Recursive operations ซับซ้อน
- ⚠️ ต้องป้องกัน invalid cycles

---

# ADR-006: Employee Point System

## Decision

คำนวณคะแนนต่อ `SaleItem` ไม่ใช่ต่อ `Sale`

## Context

- แต่ละ Product มี `pointPerUnit` ต่างกัน
- ต้องสามารถ trace ที่มาของคะแนนได้

## Rationale

แนวคิด:

```prisma
model EmployeePointHistory {
  saleItemId  String @unique
  quantity    Int
  pointPerUnit Int
  totalPoints Int
}
```

โดย:

```text
totalPoints = quantity × pointPerUnit
```

และการคำนวณเกิดตาม Business Rule ของ Sale completion

## Consequences

- ✅ Traceable points
- ✅ ลดโอกาสสร้าง Point History ซ้ำสำหรับ SaleItem เดียวกัน
- ⚠️ ต้อง aggregate เพื่อคำนวณ total points
- ⚠️ ต้องรักษาความถูกต้องของ Point History

---

# ADR-007: Sale Status State Machine

## Decision

ใช้ Enum และกำหนด Valid Transitions สำหรับ Sale Status

## Context

- Sale มีหลาย states
- ต้องป้องกัน invalid transitions
- ต้องสามารถตรวจสอบประวัติการเปลี่ยนสถานะได้

## Rationale

ตัวอย่าง Flow:

```text
PENDING_APPROVAL
    ↓
APPROVED
    ↓
AWAITING_DELIVERY
    ↓
DELIVERY_COMPLETED
    ↓
COMPLETED
```

Alternative paths อาจรวม:

```text
PENDING_APPROVAL → REJECTED
PENDING_APPROVAL → WAITING_FOR_CORRECTION
APPROVED / AWAITING_DELIVERY → CANCELLED
```

สถานะและ transitions จริงต้องตรวจสอบจาก schema และ implementation ปัจจุบัน

## Implementation Principle

Business logic ควรตรวจสอบว่า transition จากสถานะหนึ่งไปอีกสถานะหนึ่งถูกต้องก่อนบันทึก

ตัวอย่างแนวคิด:

```typescript
const validTransitions: Record<SaleStatus, SaleStatus[]> = {
  PENDING_APPROVAL: ["APPROVED", "REJECTED", "WAITING_FOR_CORRECTION"],
  // ...
};

function canTransition(from: SaleStatus, to: SaleStatus): boolean {
  return validTransitions[from]?.includes(to) ?? false;
}
```

## Consequences

- ✅ Predictable state changes
- ✅ ตรวจสอบสถานะได้ชัดเจน
- ✅ รองรับ audit/history
- ⚠️ ต้อง update transitions เมื่อเพิ่มสถานะ
- ⚠️ Business rules มีความซับซ้อนขึ้น

---

# ADR-008: Daily Sales Summary (Denormalization)

## Decision

ใช้การ pre-aggregate ข้อมูลการขายรายวันสำหรับ Reporting เมื่อจำเป็น

## Context

- Reporting query จาก transaction tables โดยตรงอาจมีค่าใช้จ่ายสูง
- Dashboard ต้องการ response ที่รวดเร็ว
- ข้อมูล summary สามารถลด load ของ reporting queries

## Rationale

แนวคิด:

```prisma
model DailySalesSummary {
  date       DateTime
  customerId String
  employeeId String
  productId  String
  quantity   Int
  totalAmount Decimal

  @@unique([date, customerId, employeeId, productId])
}
```

## Implementation Principle

Summary ต้องสามารถ rebuild/recalculate ได้จาก source transactions

## Consequences

- ✅ Faster reporting queries
- ✅ ลด load บน transaction tables
- ⚠️ Summary อาจ lag จาก source data
- ⚠️ ต้องจัดการ synchronization / recalculation
- ⚠️ มี storage เพิ่มขึ้น

---

# ADR-009: Credit System Design

## Decision

แยก `CreditLimit` และ `TemporaryCreditLimit` เป็นคนละ Domain/Data Model

## Context

- Credit ถาวรมี workflow แตกต่างจาก temporary credit
- Temporary credit มี expiry
- Temporary credit ต้องมี request/approval/revert lifecycle

## Rationale

แยกความรับผิดชอบ:

```text
CreditLimit
    → วงเงินหลัก

TemporaryCreditLimit
    → วงเงินชั่วคราว
    → request
    → approve
    → expiry
    → revert
```

## Consequences

- ✅ Separation of concerns ชัดเจน
- ✅ Audit lifecycle ของ temporary credit ได้
- ⚠️ ต้องคำนึงถึงการคำนวณวงเงินรวม
- ⚠️ ต้องจัดการ expiry/revert อย่างถูกต้อง

---

# ADR-010: Tailwind Mobile-First

## Decision

ใช้ Tailwind CSS แบบ Mobile-First

## Context

- Sales และผู้ใช้งานภาคสนามใช้ Mobile เป็นหลัก
- ต้องรองรับ Desktop และ Tablet ด้วย

## Rationale

เริ่มจาก Mobile และขยายด้วย responsive breakpoints:

```tsx
<div className="p-4 md:p-6 lg:p-8">
```

## Consequences

- ✅ Mobile experience ดีขึ้น
- ✅ Responsive behavior สอดคล้องกับ Tailwind conventions
- ⚠️ Desktop layout ต้องได้รับการตรวจสอบด้วย
- ⚠️ ต้องทดสอบหลาย viewport

---

# ADR-011: JWT Token Optimization (Permission Keys)

## Decision

เก็บ permission keys แบบ compact แทนการเก็บ full permission objects ใน JWT

## Context

- จำนวน permissions เพิ่มขึ้นได้มาก
- Full permission objects ทำให้ JWT/cookie ใหญ่
- เคยมีความเสี่ยง HTTP 431 จาก request headers ที่ใหญ่เกินไป

## Rationale

รูปแบบที่ต้องการคือข้อมูลที่ compact เช่น:

```typescript
{
  permissionKeys: ["sale.create", "sale.view"],
  dataAccessByResource: {
    sale: "VIEW_ALL",
  },
  editAccessByResource: {
    sale: "EDIT_ALL",
  },
  deleteAccessByResource: {
    sale: "DELETE_ALL",
  },
}
```

การตรวจ Permission:

```typescript
session.user.permissionKeys?.includes("sale.create");
```

## Consequences

- ✅ JWT ขนาดเล็กลง
- ✅ ลดความเสี่ยงจาก oversized request headers
- ✅ Permission lookup ทำได้ง่าย
- ⚠️ เป็น breaking change เมื่อเปลี่ยนจาก full objects
- ⚠️ ต้องจัดการ session/token ที่ค้างอยู่เมื่อมีการ deploy schema ใหม่

---

# ADR-012: Project-wide Module Architecture

## Decision

ใช้ `modules/` เป็นศูนย์กลางสำหรับ Business Modules และกำหนด Architecture กลางร่วมกันทุก Module

## Context

ก่อนกำหนดมาตรฐานกลาง Business Logic และ UI อาจกระจายอยู่หลายที่ เช่น:

- API Routes
- Server Actions
- Components
- Queries
- Services
- Module-specific implementations

เมื่อจำนวน Module เพิ่มขึ้น การมีหลายรูปแบบทำให้:

- AI Agent ทำงานไม่สม่ำเสมอ
- Developer ต้องเรียนรู้หลาย Pattern
- Maintenance และ Refactoring ยากขึ้น
- Layer boundaries ไม่ชัดเจน

## Rationale

กำหนด Module Architecture กลาง:

```text
modules/<module-name>/
├── application/
├── features/
├── infrastructure/
├── server/
├── types/
├── ui/
├── constants.ts
├── index.ts
└── README.md
```

ไม่จำเป็นต้องมีทุก Folder/File

สร้างเฉพาะสิ่งที่ Module ต้องใช้จริง

### Layer Responsibilities

```text
features/
    ↓
server/
    ↓
application/
    ↓
infrastructure/
    ↓
database
```

```text
features/
    UI / user interaction

server/
    Authentication / authorization / transport / revalidation

application/
    Business logic / validation / use-case orchestration

infrastructure/
    Database / persistence access
```

### Architectural Authority

มาตรฐาน Module อยู่ที่:

```text
docs/MODULE_ARCHITECTURE.md
```

Coding rules อยู่ที่:

```text
docs/CODING_STANDARDS.md
```

AI execution rules อยู่ที่:

```text
.agents/skills/crm-coding-standards/SKILL.md
```

Development procedures อยู่ที่:

```text
.agents/workflows/
```

ไม่มี Module ใดเป็น permanent architecture authority

Existing modules เป็น implementation references เท่านั้น

## Consequences

- ✅ Consistent architecture across modules
- ✅ Clear separation of concerns
- ✅ Easier onboarding
- ✅ Easier AI-assisted development
- ✅ Easier refactoring
- ✅ Predictable dependency direction
- ⚠️ Existing modules require migration over time
- ⚠️ Legacy paths may continue to exist temporarily
- ⚠️ Architectural governance is required when introducing new patterns

---

# Decision Log

| ID      | Title                            | Date       | Status   |
| ------- | -------------------------------- | ---------- | -------- |
| ADR-001 | Next.js App Router               | 2026-01-28 | Accepted |
| ADR-002 | Prisma ORM                       | 2026-01-28 | Accepted |
| ADR-003 | Soft Delete Pattern              | 2026-01-28 | Accepted |
| ADR-004 | RBAC Data Access Levels          | 2026-01-28 | Accepted |
| ADR-005 | Customer Hierarchy               | 2026-01-28 | Accepted |
| ADR-006 | Point System per SaleItem        | 2026-01-28 | Accepted |
| ADR-007 | Sale Status State Machine        | 2026-01-28 | Accepted |
| ADR-008 | Daily Sales Summary              | 2026-01-28 | Accepted |
| ADR-009 | Credit System Design             | 2026-01-28 | Accepted |
| ADR-010 | Tailwind Mobile-First            | 2026-01-28 | Accepted |
| ADR-011 | JWT Token Optimization           | 2026-01-28 | Accepted |
| ADR-012 | Project-wide Module Architecture | 2026-08-28 | Accepted |

---

# ADR Maintenance Rules

When a future architectural decision changes the system:

1. Add a new ADR rather than silently rewriting an old decision.
2. Keep accepted historical decisions for traceability.
3. Mark an ADR as Superseded when a newer decision replaces it.
4. Update `ARCHITECTURE.md` when the architectural structure changes.
5. Update `MODULE_ARCHITECTURE.md` when module structure or layer responsibilities change.
6. Update `CODING_STANDARDS.md` when coding rules change.
7. Update relevant AI Skill/Workflow files when AI execution behavior must change.
8. Keep related documentation synchronized.

Do not modify historical ADR rationale merely to make it match the current implementation.

---

**See Also**: [ARCHITECTURE.md](./ARCHITECTURE.md) | [AI_CONTEXT.md](./AI_CONTEXT.md) | [CODING_STANDARDS.md](./CODING_STANDARDS.md) | [MODULE_ARCHITECTURE.md](./MODULE_ARCHITECTURE.md) | [DATA_MODEL.md](./DATA_MODEL.md)
