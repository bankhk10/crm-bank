# Architecture Decisions - CRM System

> **Version**: 2.0.0 | **Updated**: 2026-02-24  
> **Related**: [ARCHITECTURE.md](./ARCHITECTURE.md) | [AI_CONTEXT.md](./AI_CONTEXT.md)

---

## Overview

เอกสารนี้บันทึกเหตุผลเชิงสถาปัตยกรรมสำหรับการตัดสินใจสำคัญในระบบ CRM (Architecture Decision Records - ADR แบบย่อ)

---

## ADR-001: Next.js App Router

### Decision

ใช้ Next.js 16 App Router แทน Pages Router

### Context

- ต้องการ Full-stack framework
- ต้องการ Server Components
- ต้องการ API Routes ใน project เดียว

### Rationale

- **Server Components**: ลด JavaScript bundle size
- **Streaming**: Better loading experience
- **Layouts**: Nested layouts สำหรับ main/auth
- **API Routes**: Co-located กับ pages

### Consequences

- ✅ Single codebase
- ✅ Better DX
- ⚠️ Learning curve for team
- ⚠️ Some libraries not compatible yet

---

## ADR-002: Prisma ORM

### Decision

ใช้ Prisma เป็น ORM หลัก

### Context

- ต้องการ Type-safe database access
- ต้องการ Schema management
- ต้องการ Migration support

### Rationale

- **Type Safety**: Auto-generated types จาก schema
- **Schema as Code**: `schema.prisma` = source of truth
- **Migrations**: Version control สำหรับ database
- **Relations**: Declarative relation definitions

### Consequences

- ✅ Fewer runtime errors
- ✅ Better autocomplete
- ⚠️ Cannot do all complex queries
- ⚠️ Performance overhead สำหรับบาง operations

---

## ADR-003: Soft Delete Pattern

### Decision

ใช้ `deletedAt` field แทน hard delete

### Context

- Business ต้องการ audit trail
- อาจต้อง restore ข้อมูล
- Relations อาจ break ถ้า hard delete

### Rationale

```prisma
model Entity {
  deletedAt DateTime?  // null = active
}
```

### Implementation

```typescript
// Always include in queries
where: {
  deletedAt: null;
}

// "Delete" = set timestamp
await prisma.entity.update({
  where: { id },
  data: { deletedAt: new Date() },
});
```

### Consequences

- ✅ Data recoverable
- ✅ Audit trail intact
- ⚠️ Must remember to filter
- ⚠️ Storage grows over time

---

## ADR-004: RBAC with Data Access Levels

### Decision

ใช้ 3-level data access control: VIEW, EDIT, DELETE

### Context

- Manager ต้องเห็นข้อมูลลูกน้อง
- Sales เห็นแค่ของตัวเอง
- Admin เห็นทั้งหมด

### Rationale

```prisma
enum DataAccessLevel {
  VIEW_OWN         // ตัวเอง
  VIEW_DEPARTMENT  // แผนก
  VIEW_ALL         // ทั้งหมด
}
```

### Implementation

```typescript
function getDataFilter(accessLevel: string, userId: string) {
  switch (accessLevel) {
    case "VIEW_OWN":
      return { createdById: userId };
    case "VIEW_DEPARTMENT":
      return { employee: { departmentId: user.departmentId } };
    case "VIEW_ALL":
      return {};
  }
}
```

### Consequences

- ✅ Fine-grained control
- ✅ Secure by default
- ⚠️ Complex permission checks
- ⚠️ Performance impact on queries

---

## ADR-005: Customer Hierarchy (Self-Reference)

### Decision

ใช้ self-referencing relation สำหรับ Customer hierarchy

### Context

- Dealer → Subdealer → Farmer
- แสดงสายอุปถัมภ์ได้

### Rationale

```prisma
model Customer {
  parentDealerId String?
  parentDealer   Customer? @relation("ParentDealer", fields: [parentDealerId])
  subDealers     Customer[] @relation("ParentDealer")
}
```

### Consequences

- ✅ Flexible hierarchy
- ✅ Query up/down the tree
- ⚠️ Recursive queries complex
- ⚠️ Must prevent cycles

---

## ADR-006: Employee Point System

### Decision

คำนวณคะแนนต่อ SaleItem ไม่ใช่ต่อ Sale

### Context

- แต่ละ Product มี pointPerUnit ต่างกัน
- ต้อง audit ได้ว่าคะแนนมาจากไหน

### Rationale

```prisma
model EmployeePointHistory {
  saleItemId String @unique  // 1 item = 1 history
  quantity   Int
  pointPerUnit Int
  totalPoints  Int           // = quantity × pointPerUnit
}
```

### Implementation

```typescript
// When sale COMPLETED:
for (const item of sale.items) {
  await prisma.employeePointHistory.create({
    data: {
      employeeId: sale.employeeId,
      saleId: sale.id,
      saleItemId: item.id,
      productId: item.productId,
      quantity: item.quantity,
      pointPerUnit: item.product.pointPerUnit,
      totalPoints: item.quantity * item.product.pointPerUnit,
    },
  });
}
```

### Consequences

- ✅ Traceable points
- ✅ Unique constraint prevents duplicates
- ⚠️ More records to manage
- ⚠️ Need to sum for totals

---

## ADR-007: Sale Status State Machine

### Decision

ใช้ enum กำหนด status และควบคุม transitions

### Context

- Sale มีหลาย states
- ต้องป้องกัน invalid transitions
- ต้อง log ทุก transition

### Rationale

```
PENDING → PENDING_APPROVAL → APPROVED → DELIVERED → COMPLETED
                ↓                ↓
            REJECTED        CANCELLED
```

### Implementation

```typescript
const validTransitions: Record<SaleStatus, SaleStatus[]> = {
  PENDING: ["PENDING_APPROVAL"],
  PENDING_APPROVAL: ["APPROVED", "REJECTED", "WAITING_FOR_CORRECTION"],
  APPROVED: ["AWAITING_DELIVERY", "CANCELLED", "EXPIRED", "OVERDUE"],
  // ...
};

function canTransition(from: SaleStatus, to: SaleStatus): boolean {
  return validTransitions[from]?.includes(to) ?? false;
}
```

### Consequences

- ✅ Predictable state changes
- ✅ Full history in SaleStatusHistory
- ⚠️ Must update when adding states
- ⚠️ Complex validation

---

## ADR-008: Daily Sales Summary (Denormalization)

### Decision

Pre-aggregate sales data รายวันสำหรับ reporting

### Context

- Reports ช้าถ้า query real-time
- ต้องการ dashboard เร็ว

### Rationale

```prisma
model DailySalesSummary {
  date        DateTime @db.Date
  customerId  String
  employeeId  String
  productId   String
  quantity    Int
  totalAmount Decimal

  @@unique([date, customerId, employeeId, productId])
}
```

### Implementation

- Aggregate เมื่อ Sale COMPLETED
- Cron job recalculate รายคืน
- Query summary table for reports

### Consequences

- ✅ Fast dashboard queries
- ✅ Reduced load on main tables
- ⚠️ Data lag (not real-time)
- ⚠️ Extra storage

---

## ADR-009: Credit System Design

### Decision

แยก CreditLimit และ TemporaryCreditLimit เป็น 2 tables

### Context

- Credit ถาวรมี workflow ต่างจาก temporary
- Temporary มี expiry และต้อง revert

### Rationale

```prisma
model CreditLimit {
  limitAmount    Decimal  // วงเงินถาวร
  promoAmount    Decimal? // โปรโมชัน
  usedAmount     Decimal  // ใช้ไปแล้ว
  temporaryCreditAmount Decimal? // รวม temp ที่ active
}

model TemporaryCreditLimit {
  requestedAmount Decimal
  expiryDate     DateTime
  status         TemporaryCreditStatus // PENDING → APPROVED
  isReverted     Boolean
}
```

### Consequences

- ✅ Clear separation of concerns
- ✅ Audit trail for temp credits
- ⚠️ Must sync temp to main credit
- ⚠️ Cron job for expiry

---

## ADR-010: Tailwind Mobile-First

### Decision

ใช้ Tailwind CSS แบบ Mobile-First design

### Context

- Sales ใช้งานบน mobile เป็นหลัก
- ต้องการ responsive UI

### Rationale

```tsx
// Start with mobile, expand to larger screens
<div className="p-4 md:p-6 lg:p-8">
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
```

### Consequences

- ✅ Better mobile experience
- ✅ Consistent with Tailwind defaults
- ⚠️ Desktop may feel sparse if not careful
- ⚠️ Must test on all screen sizes

---

## ADR-011: JWT Token Optimization (Permission Keys)

### Decision

เก็บ permission keys เป็น array แทน full permission objects ใน JWT token

### Context

- เมื่อเพิ่ม permissions จำนวนมาก (90+ permissions)
- JWT token ขนาดใหญ่เก็บใน cookie
- เกิด HTTP 431 "Request Header Fields Too Large" error

### Rationale

```typescript
// Before (v1.1.0) - ~5KB+
{
  permissions: {
    "sale.create": { key: "...", category: "ACTION", allow: true, dataAccess: "VIEW_ALL", ... },
    // ... 90+ full objects
  }
}

// After (v1.2.0) - ~1KB
{
  permissionKeys: ["sale.create", "sale.view", ...],  // Just an array of strings
  dataAccessByResource: { "sale": "VIEW_ALL" },       // Separate compact maps
  editAccessByResource: { "sale": "EDIT_ALL" },
  deleteAccessByResource: { "sale": "DELETE_ALL" }
}
```

### Implementation

```typescript
// Permission check: Before
session.user.permissions?.["sale.create"]?.allow;

// Permission check: After
session.user.permissionKeys?.includes("sale.create");
```

### Consequences

- ✅ ลดขนาด JWT token ~80%
- ✅ แก้ไข HTTP 431 error
- ✅ เร็วขึ้นในการ parse/serialize
- ⚠️ Breaking change ต้อง migrate code
- ⚠️ ต้องล้าง session เก่าเมื่อ deploy

---

## ADR-012: Enterprise Module Architecture

### Decision

ปรับโครงสร้างจาก `features/` + `src/core/` + `app/api/` เป็น `modules/` ที่มี 4 layers

### Context

- Business logic กระจายอยู่หลายที่ (API routes, services, components)
- ไม่มีรูปแบบที่ชัดเจนสำหรับ separation of concerns
- ทีมเพิ่มฟีเจอร์ใหม่โดยไม่มี standard pattern
- Server actions ถูกนำมาใช้แทน API routes

### Rationale

```
modules/[MODULE_NAME]/
├── infrastructure/    ← Pure database access (repository)
├── application/       ← Business logic (use cases + validations)
├── server/            ← Transport (server actions: auth + revalidate)
├── features/          ← UI screens (list-view, form, detail-view)
├── ui/                ← Module-specific UI components
├── types/             ← Type definitions
├── constants.ts
├── index.ts           ← Barrel exports
└── README.md
```

### Layer Rules

| Layer          | Does                                        | Does NOT                         |
| -------------- | ------------------------------------------- | -------------------------------- |
| Infrastructure | Prisma queries                              | Auth, Validation, Business logic |
| Application    | Validation, Uniqueness checks, Data mapping | Auth, HTTP, DB queries           |
| Server         | Auth, Permission check, revalidatePath      | Business logic, DB queries       |
| Features       | UI rendering, Form handling                 | Business logic, DB queries       |

### Implementation

- **Reference**: `modules/employee/` เป็น reference implementation
- ทุก module ต้องมี 4 layers: infrastructure → application → server → features
- Server actions ทำแค่ 3 สิ่ง: auth → use case → revalidate
- Shared components ย้ายไป `components/custom/`: TruncatedCell, ActionButton, DetailItem
- Barrel export ผ่าน `index.ts`

### Consequences

- ✅ Clear separation of concerns
- ✅ Consistent pattern across all modules
- ✅ Testable layers (each layer can be tested independently)
- ✅ Easy onboarding (just look at employee module)
- ⚠️ Migration effort for existing modules
- ⚠️ Some API routes still exist (products, customers, etc.)

---

## Decision Log

| ID      | Title                          | Date       | Status   |
| ------- | ------------------------------ | ---------- | -------- |
| ADR-001 | Next.js App Router             | 2026-01-28 | Accepted |
| ADR-002 | Prisma ORM                     | 2026-01-28 | Accepted |
| ADR-003 | Soft Delete Pattern            | 2026-01-28 | Accepted |
| ADR-004 | RBAC Data Access Levels        | 2026-01-28 | Accepted |
| ADR-005 | Customer Hierarchy             | 2026-01-28 | Accepted |
| ADR-006 | Point System per SaleItem      | 2026-01-28 | Accepted |
| ADR-007 | Sale Status State Machine      | 2026-01-28 | Accepted |
| ADR-008 | Daily Sales Summary            | 2026-01-28 | Accepted |
| ADR-009 | Credit System Design           | 2026-01-28 | Accepted |
| ADR-010 | Tailwind Mobile-First          | 2026-01-28 | Accepted |
| ADR-011 | JWT Token Optimization         | 2026-01-28 | Accepted |
| ADR-012 | Enterprise Module Architecture | 2026-02-24 | Accepted |

---

**See Also**: [ARCHITECTURE.md](./ARCHITECTURE.md) | [DATA_MODEL.md](./DATA_MODEL.md) | [RBAC_POLICY.md](./RBAC_POLICY.md)
