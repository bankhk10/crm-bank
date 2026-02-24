# Architecture - CRM System

> **Version**: 2.0.0 | **Updated**: 2026-02-24  
> **Related**: [AI_CONTEXT.md](./AI_CONTEXT.md) | [CODING_STANDARDS.md](./CODING_STANDARDS.md)

---

## 1. System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            CLIENT LAYER                                │
│                      (Next.js React Components)                        │
│                         Mobile-First Design                            │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       MODULE LAYER (modules/)                          │
│   ┌─────────────┐  ┌──────────────┐  ┌────────┐  ┌────────────────┐   │
│   │  features/  │→ │ server/      │→ │ app/   │→ │ infrastructure/│   │
│   │  (UI)       │  │ (actions.ts) │  │ (logic)│  │ (repository)   │   │
│   └─────────────┘  └──────────────┘  └────────┘  └────────────────┘   │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           DATA LAYER                                   │
│                      (Prisma ORM + PostgreSQL)                         │
│                       prisma/schema.prisma                             │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Tech Stack

| Layer         | Technology                                   |
| ------------- | -------------------------------------------- |
| Frontend      | Next.js 16.1.5, React 19.2.0, Tailwind CSS 4 |
| UI Components | shadcn/ui, Radix UI, Lucide Icons            |
| Backend       | Next.js Server Actions + API Routes (legacy) |
| ORM           | Prisma 7.x                                   |
| Database      | PostgreSQL 15+                               |
| Auth          | NextAuth.js v5 (5.0.0-beta.30)               |
| Container     | Docker + Docker Compose                      |

---

## 3. Folder Structure

```
crm-bank/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth pages (login, register)
│   ├── (main)/                   # Main app pages (protected)
│   │   ├── customers/            # Customer management pages
│   │   ├── products/             # Product management pages
│   │   ├── sales/                # Sales management pages
│   │   ├── employee/             # Employee management pages
│   │   ├── companies/            # Company management pages
│   │   ├── credit-limits/        # Credit limits pages
│   │   ├── temporary-credit-limits/
│   │   ├── fulfillment/          # Fulfillment pages
│   │   ├── sales-targets/        # Sales targets pages
│   │   ├── reports/              # Reports & analytics
│   │   ├── notifications/        # Notifications
│   │   └── admin/                # System settings
│   ├── api/                      # API Routes (legacy, some still in use)
│   ├── actions/                  # Standalone Server Actions (dashboard, reports)
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Global styles
│
├── modules/                      # ⭐ Enterprise Modules (primary pattern)
│   ├── employee/                 # Reference implementation
│   ├── customers/
│   ├── companies/
│   ├── products/
│   ├── sales/
│   ├── fulfillment/
│   ├── credit-limits/
│   ├── temporary-credit-limits/
│   ├── sales-targets/
│   ├── shipping-companies/
│   ├── rbac/
│   ├── notifications/
│   └── layout/
│
├── components/                   # Shared UI components
│   ├── ui/                       # shadcn/ui components
│   ├── custom/                   # Project-wide reusable (TruncatedCell, ActionButton, DetailItem)
│   ├── forms/                    # Form components
│   └── layout/                   # Layout components
│
├── lib/                          # Library utilities
│   ├── db.ts                     # Prisma client instance
│   ├── auth.ts                   # NextAuth config
│   └── rbac.ts                   # RBAC helpers
│
├── prisma/                       # Database schema
│   └── schema.prisma             # Source of truth for data
│
├── types/                        # Global TypeScript definitions
│
└── docs/                         # Documentation (this folder)
```

---

## 4. Module Architecture (Enterprise Pattern)

> **Reference**: `modules/employee/` — ตัวอย่างเต็มที่ทำเสร็จแล้ว

### 4.1 Module Structure

```
modules/[MODULE_NAME]/
 ┣ features/                      ← UI screens
 ┃ ┣ detail-view/
 ┃ ┃ ┗ [MODULE]-detail-view.tsx
 ┃ ┣ form/
 ┃ ┃ ┣ [MODULE]-form.tsx
 ┃ ┃ ┗ [MODULE]-form-wrapper.tsx
 ┃ ┗ list-view/
 ┃   ┣ [MODULE]-table.tsx          (toolbar inline)
 ┃   ┣ [MODULE]-cards.tsx
 ┃   ┗ use-[MODULE]-columns.tsx
 ┃
 ┣ application/                   ← use cases (business logic)
 ┃ ┣ create-[MODULE].ts           (complex use case → แยกไฟล์)
 ┃ ┣ update-[MODULE].ts           (complex use case → แยกไฟล์)
 ┃ ┣ validations.ts               (Zod schemas ใช้ร่วม client/server)
 ┃ ┗ index.ts                     (facade + inline thin use cases)
 ┃
 ┣ server/                        ← transport (server actions only)
 ┃ ┗ actions.ts
 ┃
 ┣ infrastructure/                ← prisma / db access
 ┃ ┗ [MODULE].repository.ts
 ┃
 ┣ ui/                            ← module-specific ui (เช่น status badge)
 ┃ ┗ [MODULE]-status-badge.tsx
 ┃
 ┣ types/
 ┃ ┗ index.ts
 ┃
 ┣ constants.ts
 ┣ index.ts                       (barrel exports)
 ┗ README.md
```

### 4.2 Layer Responsibilities

#### Infrastructure Layer (`infrastructure/[MODULE].repository.ts`)

```typescript
// Pure database operations only — no auth, no validation, no business logic
// Export pure functions

import prisma from "@/lib/db";

export async function findEmployeeById(id: string) {
  return prisma.employee.findFirst({
    where: { id, deletedAt: null },
    include: { /* relations */ }
  });
}

export async function findAllEmployees(params: FilterParams) { ... }
export async function createEmployee(data: CreateData) { ... }
export async function updateEmployee(id: string, data: UpdateData) { ... }
export async function softDeleteEmployee(id: string) { ... }
```

#### Application Layer (`application/`)

```typescript
// Business logic: validation, uniqueness checks, data mapping
// Complex use cases → separate files (create-[MODULE].ts, update-[MODULE].ts)
// Thin use cases → inline in index.ts (get detail, list)
// validations.ts → Zod schemas shared between client form and server

// application/index.ts (facade)
export { createEmployeeUseCase } from "./create-employee";
export { updateEmployeeUseCase } from "./update-employee";

export async function getEmployeeDetailUseCase(id: string) {
  return repo.findEmployeeById(id);
}

export async function listEmployeesUseCase(params: ListParams) {
  return repo.findAllEmployees(params);
}
```

#### Server Layer (`server/actions.ts`)

```typescript
"use server";
// Thin layer — does ONLY 3 things:
// 1. Auth / Permission check
// 2. Call use case from application layer
// 3. revalidatePath

import { auth } from "@/lib/auth";
import { createEmployeeUseCase } from "../application";

export async function createEmployeeAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  // check permission...

  const result = await createEmployeeUseCase(data);
  revalidatePath("/employee");
  return result;
}
```

#### Features Layer (`features/`)

```typescript
// UI screens grouped by screen type: detail-view/, form/, list-view/
// Toolbar that's used in one place → inline in table file
// Uses shared components from @/components/custom/:
//   TruncatedCell, ActionButton, DetailItem
```

---

## 5. Layer Dependencies

```
features/ ──→ server/actions.ts ──→ application/ ──→ infrastructure/
   │                                     │                  │
   │                                     ▼                  ▼
   │                              validations.ts        prisma/db
   └── uses: @/components/custom/, @/components/ui/
```

**Rules**:

- `features/` imports from `server/` and `application/validations.ts`
- `server/` imports from `application/`
- `application/` imports from `infrastructure/`
- `infrastructure/` imports from `@/lib/db` only
- **No** circular dependencies between layers

---

## 6. Key Flows

### 6.1 Sale Creation Flow

```
1. User fills SaleForm (features/form/)
2. Form calls createSaleAction (server/actions.ts)
3. Action: auth check → permission check
4. Action calls createSaleUseCase (application/)
5. Use case:
   a. Validate with Zod schema
   b. Check customer credit
   c. Call repository to create Sale + SaleItems
   d. Update stock (reserve)
6. Action: revalidatePath("/sales")
7. Return result to client
```

### 6.2 Sale Approval Flow

```
1. Manager clicks Approve (features/detail-view/)
2. Calls approveSaleAction (server/actions.ts)
3. Action: auth + APPROVE permission check
4. Use case validates status transition
5. Repository updates status → APPROVED
6. Creates SaleStatusHistory
7. Sends notification
8. revalidatePath
```

### 6.3 Point Calculation Flow

```
1. Sale status → COMPLETED
2. PointService.calculatePoints() triggered
3. For each SaleItem:
   a. Get Product.pointPerUnit
   b. Calculate: quantity × pointPerUnit
   c. Create EmployeePointHistory
4. Update EmployeePointSummary.totalPoints
```

---

## 7. Design Principles

### 7.1 Separation of Concerns (Module Layers)

- **Infrastructure**: Database access only
- **Application**: Business logic only
- **Server**: Auth + transport only
- **Features**: UI only

### 7.2 Soft Delete Pattern

```typescript
model Entity {
  deletedAt DateTime?  // null = active, date = deleted
}
// Always include in queries
where: { deletedAt: null }
```

### 7.3 Transaction Safety

```typescript
await prisma.$transaction(async (tx) => {
  // All operations here are atomic
});
```

### 7.4 Error Handling

```typescript
{
  "error": "ERROR_CODE",
  "message": "Human readable message",
  "details": {} // Optional additional info
}
```

---

## 8. Shared Components

| Component       | Path                                   | Used by                                                                           |
| --------------- | -------------------------------------- | --------------------------------------------------------------------------------- |
| `TruncatedCell` | `components/custom/truncated-cell.tsx` | employee, products, sales, fulfillment, customers                                 |
| `ActionButton`  | `components/custom/action-button.tsx`  | employee, products, sales, fulfillment, customers, temporary-credit-limits        |
| `DetailItem`    | `components/custom/detail-item.tsx`    | employee, companies, shipping-companies, sales, products, temporary-credit-limits |

---

## 9. Infrastructure

### 9.1 Docker Setup

```yaml
services:
  app:
    build: .
    ports: ["3000:3000"]
    depends_on: [db]
  db:
    image: postgres:15
    volumes: [postgres_data:/var/lib/postgresql/data]
```

### 9.2 Environment Variables

```bash
DATABASE_URL=postgresql://user:pass@host:5432/db
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
```

---

## 10. Security Considerations

- **Authentication**: NextAuth.js session-based
- **Authorization**: Custom RBAC with permissions (checked in server actions)
- **Data Access**: Multi-level (OWN, DEPARTMENT, ALL)
- **Audit Trail**: All mutations logged
- **Soft Delete**: No data permanently removed

---

**See Also**: [CODING_STANDARDS.md](./CODING_STANDARDS.md) | [RBAC_POLICY.md](./RBAC_POLICY.md)
