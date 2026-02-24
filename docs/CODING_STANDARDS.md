# Coding Standards - CRM System

> **Version**: 2.0.0 | **Updated**: 2026-02-24  
> **Related**: [ARCHITECTURE.md](./ARCHITECTURE.md) | [AI_CONTEXT.md](./AI_CONTEXT.md)

---

## 1. File Naming

| Type           | Convention        | Example                                    |
| -------------- | ----------------- | ------------------------------------------ |
| Components     | kebab-case        | `employee-form.tsx`, `employee-table.tsx`  |
| Pages          | kebab-case folder | `app/(main)/customers/page.tsx`            |
| Repository     | kebab-case        | `employee.repository.ts`                   |
| Use Cases      | kebab-case        | `create-employee.ts`, `update-employee.ts` |
| Server Actions | fixed name        | `actions.ts` (in `server/`)                |
| Validations    | fixed name        | `validations.ts` (in `application/`)       |
| Types          | kebab-case        | `index.ts` (in `types/`)                   |
| Utils          | kebab-case        | `date-utils.ts`                            |

---

## 2. Code Style

### TypeScript

```typescript
// ✅ Use explicit types
function calculateTotal(items: SaleItem[]): number {
  return items.reduce((sum, item) => sum + item.totalPrice, 0);
}

// ❌ Avoid 'any'
function processData(data: any) { ... } // BAD

// ✅ Use interfaces for objects
interface CreateSaleInput {
  customerId: string;
  items: SaleItemInput[];
}

// ✅ Use enums for fixed values
enum SaleStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED'
}
```

### React Components

```tsx
// ✅ Functional components with TypeScript
interface Props {
  customerId: string;
  onSave: (data: Customer) => void;
}

export function CustomerForm({ customerId, onSave }: Props) {
  return <form>...</form>;
}

// ✅ Use 'use client' for client components
'use client';

export function InteractiveComponent() { ... }
```

---

## 3. Module Structure

> **Primary pattern**: `modules/[MODULE_NAME]/`  
> **Reference**: `modules/employee/` — ดูตัวอย่างเต็ม

```
modules/[MODULE_NAME]/
├── infrastructure/              # Database access only
│   └── [MODULE].repository.ts   # Pure Prisma operations
│
├── application/                 # Business logic
│   ├── create-[MODULE].ts       # Complex use case (separate file)
│   ├── update-[MODULE].ts       # Complex use case (separate file)
│   ├── validations.ts           # Zod schemas (shared client/server)
│   └── index.ts                 # Facade + inline thin use cases
│
├── server/                      # Transport layer
│   └── actions.ts               # "use server" — auth + use case + revalidate
│
├── features/                    # UI screens
│   ├── list-view/               # Table, cards, columns
│   ├── form/                    # Form + wrapper
│   └── detail-view/             # Detail page
│
├── ui/                          # Module-specific UI (badges, etc.)
├── types/                       # Type definitions
├── constants.ts
├── index.ts                     # Barrel exports
└── README.md
```

### Layer Rules

| Layer             | Imports from                            | Responsibilities                              |
| ----------------- | --------------------------------------- | --------------------------------------------- |
| `infrastructure/` | `@/lib/db`                              | Pure database operations                      |
| `application/`    | `infrastructure/`                       | Business logic, validation, uniqueness checks |
| `server/`         | `application/`                          | Auth, permissions, revalidation               |
| `features/`       | `server/`, `application/validations.ts` | UI rendering                                  |

### Legacy Paths (ยังมีใช้บางส่วน)

```
app/api/          # API Routes — ยังมี products, customers, sales, rbac, etc.
app/actions/      # Standalone server actions (dashboard, reports, logs)
```

---

## 4. Naming Conventions

### Variables & Functions

```typescript
// camelCase for variables and functions
const customerName = "John";
function calculateDiscount() {}

// PascalCase for types and interfaces
interface CustomerData {}
type SaleStatus = "PENDING" | "APPROVED";

// SCREAMING_SNAKE_CASE for constants
const MAX_DELIVERY_UPDATES = 3;
const DEFAULT_PAGE_SIZE = 20;
```

### Database Fields

```typescript
// Prisma uses camelCase in code
customer.firstName
customer.createdAt

// Maps to snake_case in database
@map("first_name")
@map("created_at")
```

---

## 5. Import Order

```typescript
// 1. External packages
import { NextResponse } from "next/server";
import { z } from "zod";

// 2. Internal modules (absolute paths)
import { prisma } from "@/lib/db";
import { createEmployeeUseCase } from "@/modules/employee/application";

// 3. Relative imports
import { validateInput } from "./utils";

// 4. Types (at end)
import type { Employee } from "@prisma/client";
```

---

## 6. Server Action Pattern

```typescript
// modules/[MODULE]/server/actions.ts
"use server";

import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { createEmployeeUseCase } from "../application";

export async function createEmployeeAction(data: CreateEmployeeInput) {
  // 1. Auth check
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  // 2. Permission check
  const permissionKeys = session.user.permissionKeys ?? [];
  if (!permissionKeys.includes("employee.create")) {
    throw new Error("Forbidden");
  }

  // 3. Call use case (business logic)
  const result = await createEmployeeUseCase(data);

  // 4. Revalidate
  revalidatePath("/employee");

  return result;
}
```

---

## 7. Repository Pattern

```typescript
// modules/[MODULE]/infrastructure/[MODULE].repository.ts
import prisma from "@/lib/db";

// ✅ Pure database operations — no auth, no validation
export async function findEmployeeById(id: string) {
  return prisma.employee.findFirst({
    where: { id, deletedAt: null },
    include: { department: true, position: true },
  });
}

export async function createEmployee(data: CreateEmployeeData) {
  return prisma.employee.create({ data });
}

// ✅ Always filter soft deleted records
export async function findAllEmployees(filters: Filters) {
  return prisma.employee.findMany({
    where: { deletedAt: null, ...filters },
    orderBy: { createdAt: "desc" },
  });
}
```

---

## 8. Transaction Handling

```typescript
// ✅ Use transactions for multi-step operations
async function createSaleUseCase(data: CreateSaleInput) {
  return prisma.$transaction(async (tx) => {
    const sale = await tx.sale.create({ data: { ... } });
    await tx.saleItem.createMany({ data: items });
    // Reserve stock, log audit, etc.
    return sale;
  });
}
```

---

## 9. Tailwind CSS (Mobile First)

```tsx
// ✅ Mobile first - start small, expand up
<div className="p-4 md:p-6 lg:p-8">

// ✅ Grid responsive
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// ✅ Common patterns
// Card
<div className="rounded-lg border bg-card p-4 shadow-sm">

// Button
<button className="w-full md:w-auto px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
```

---

## 10. Query Patterns

```typescript
// ✅ Always filter soft deleted
await prisma.customer.findMany({
  where: { deletedAt: null },
});

// ✅ Pagination
const page = 1;
const limit = 20;
await prisma.customer.findMany({
  where: { deletedAt: null },
  skip: (page - 1) * limit,
  take: limit,
  orderBy: { createdAt: "desc" },
});

// ✅ Include relations carefully
await prisma.sale.findUnique({
  where: { id },
  include: {
    customer: { select: { id: true, name: true } },
    items: {
      include: {
        product: { select: { id: true, name: true } },
      },
    },
  },
});
```

---

## 11. Error Handling

```typescript
// Define custom errors
class BusinessError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400,
  ) {
    super(message);
  }
}

// Throw in use case
throw new BusinessError(
  "INSUFFICIENT_CREDIT",
  "Customer does not have enough credit",
  400,
);
```

---

## 12. Testing Guidelines

```typescript
// Unit test naming
describe("CustomerService", () => {
  describe("createCustomer", () => {
    it("should create customer with valid data", async () => {});
    it("should throw error for duplicate customerCode", async () => {});
  });
});
```

---

**See Also**: [ARCHITECTURE.md](./ARCHITECTURE.md) | [DECISIONS.md](./DECISIONS.md)
