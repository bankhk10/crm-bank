# Coding Standards - CRM System

> **Version**: 1.1.0 | **Updated**: 2026-02-09  
> **Related**: [ARCHITECTURE.md](./ARCHITECTURE.md) | [AI_CONTEXT.md](./AI_CONTEXT.md)

---

## 1. File Naming

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `CustomerForm.tsx` |
| Pages | kebab-case folder | `app/(main)/customers/page.tsx` |
| API Routes | kebab-case folder | `app/api/credit-limits/route.ts` |
| Services | kebab-case | `sale-service.ts` |
| Types | kebab-case | `sale-types.ts` |
| Utils | kebab-case | `date-utils.ts` |

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

## 3. Folder Structure

```
app/
├── (auth)/                 # Authentication pages
│   ├── login/
│   └── register/
├── (main)/                 # Protected pages
│   ├── customers/
│   │   ├── page.tsx        # List page
│   │   ├── new/page.tsx    # Create page
│   │   └── [id]/page.tsx   # Detail page
│   └── layout.tsx          # Main layout with sidebar
├── api/
│   └── customers/
│       ├── route.ts        # GET (list), POST (create)
│       └── [customerId]/
│           └── route.ts    # GET (detail), PUT, DELETE
└── actions/                # Server Actions (dashboard, reports)

src/
├── core/                   # Domain logic
│   └── customers/
│       ├── customer-service.ts
│       └── customer-types.ts
├── infrastructure/         # External adapters
└── shared/                 # Shared utilities

components/
├── ui/                     # shadcn components
├── forms/                  # Form components
└── layout/                 # Layout components

features/
└── [feature]/
    ├── _components/
    ├── _hooks/
    ├── _lib/
    ├── _types/
    └── README.md

lib/
├── db.ts                   # Prisma client
├── auth.ts                 # NextAuth config
└── rbac.ts                 # Permission helpers

types/
└── api.ts                  # API types
```

---

## 4. Naming Conventions

### Variables & Functions
```typescript
// camelCase for variables and functions
const customerName = 'John';
function calculateDiscount() { }

// PascalCase for types and interfaces
interface CustomerData { }
type SaleStatus = 'PENDING' | 'APPROVED';

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
import { NextResponse } from 'next/server';
import { z } from 'zod';

// 2. Internal modules (absolute paths)
import { prisma } from '@/lib/db';
import { CustomerService } from '@/src/core/customers';

// 3. Relative imports
import { validateInput } from './utils';

// 4. Types (at end)
import type { Customer } from '@prisma/client';
```

---

## 6. API Route Pattern

```typescript
// app/api/customers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { z } from 'zod';
import prisma from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';

// Validation schema
const createSchema = z.object({
  customerCode: z.string().min(1),
  name: z.string().min(1),
  customerType: z.enum(['DEALER', 'SUBDEALER', 'FARMER', 'BROKER'])
});

export async function POST(req: NextRequest) {
  try {
    // 1. Auth check
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // 2. Permission check
    if (!await hasPermission(session.user.id, 'customer.create')) {
      return NextResponse.json(
        { error: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // 3. Validate input
    const body = await req.json();
    const data = createSchema.parse(body);

    // 4. Create record
    const customer = await prisma.customer.create({
      data: {
        ...data,
        createdById: session.user.id
      }
    });

    // 5. Return response
    return NextResponse.json(customer, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Create customer error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
```

---

## 7. Transaction Handling

```typescript
// ✅ Use transactions for multi-step operations
async function createSale(data: CreateSaleInput) {
  return prisma.$transaction(async (tx) => {
    // 1. Create sale
    const sale = await tx.sale.create({
      data: {
        customerId: data.customerId,
        employeeId: data.employeeId,
        status: 'PENDING'
      }
    });

    // 2. Create items
    await tx.saleItem.createMany({
      data: data.items.map(item => ({
        saleId: sale.id,
        ...item
      }))
    });

    // 3. Reserve stock
    for (const item of data.items) {
      await tx.productStock.update({
        where: { productId: item.productId },
        data: {
          reservedQuantity: { increment: item.quantity }
        }
      });
    }

    return sale;
  });
}
```

---

## 8. Error Handling

```typescript
// Define custom errors
class BusinessError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
  }
}

// Throw in service
throw new BusinessError(
  'INSUFFICIENT_CREDIT',
  'Customer does not have enough credit',
  400
);

// Handle in API
catch (error) {
  if (error instanceof BusinessError) {
    return NextResponse.json(
      { error: error.code, message: error.message },
      { status: error.statusCode }
    );
  }
  // Log unexpected errors
  console.error('Unexpected error:', error);
  return NextResponse.json(
    { error: 'INTERNAL_ERROR' },
    { status: 500 }
  );
}
```

---

## 9. Tailwind CSS (Mobile First)

```tsx
// ✅ Mobile first - start small, expand up
<div className="
  p-4                    // Mobile padding
  md:p-6                 // Tablet
  lg:p-8                 // Desktop
">

// ✅ Grid responsive
<div className="
  grid
  grid-cols-1            // Mobile: 1 column
  md:grid-cols-2         // Tablet: 2 columns
  lg:grid-cols-3         // Desktop: 3 columns
  gap-4
">

// ✅ Typography scale
<h1 className="text-xl md:text-2xl lg:text-3xl font-bold">

// ✅ Common patterns
// Card
<div className="rounded-lg border bg-card p-4 shadow-sm">

// Button
<button className="
  w-full md:w-auto       // Full width on mobile
  px-4 py-2
  bg-primary text-primary-foreground
  rounded-md
  hover:bg-primary/90
">
```

---

## 10. Query Patterns

```typescript
// ✅ Always filter soft deleted
await prisma.customer.findMany({
  where: { deletedAt: null }
});

// ✅ Pagination
const page = 1;
const limit = 20;
await prisma.customer.findMany({
  where: { deletedAt: null },
  skip: (page - 1) * limit,
  take: limit,
  orderBy: { createdAt: 'desc' }
});

// ✅ Include relations carefully
await prisma.sale.findUnique({
  where: { id },
  include: {
    customer: { select: { id: true, name: true } },
    items: {
      include: {
        product: { select: { id: true, name: true } }
      }
    }
  }
});
```

---

## 11. Testing Guidelines

```typescript
// Unit test naming
describe('CustomerService', () => {
  describe('createCustomer', () => {
    it('should create customer with valid data', async () => {});
    it('should throw error for duplicate customerCode', async () => {});
  });
});

// Mock Prisma
jest.mock('@/lib/db', () => ({
  customer: {
    create: jest.fn(),
    findMany: jest.fn()
  }
}));
```

---

**See Also**: [ARCHITECTURE.md](./ARCHITECTURE.md) | [API_CONTRACTS.md](./API_CONTRACTS.md)
