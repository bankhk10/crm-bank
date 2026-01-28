# Architecture - CRM System

> **Version**: 1.0.0 | **Updated**: 2026-01-28  
> **Related**: [AI_CONTEXT.md](./AI_CONTEXT.md) | [CODING_STANDARDS.md](./CODING_STANDARDS.md)

---

## 1. System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            CLIENT LAYER                                  │
│                      (Next.js React Components)                          │
│                         Mobile-First Design                              │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │ 
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            API LAYER                                     │
│                     (Next.js App Router API)                             │
│                   app/api/**/route.ts                                    │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          SERVICE LAYER                                   │
│                    (Business Logic Services)                             │
│                      src/core/**/*.ts                                    │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           DATA LAYER                                     │
│                      (Prisma ORM + PostgreSQL)                           │
│                       prisma/schema.prisma                               │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React, Tailwind CSS |
| UI Components | shadcn/ui |
| Backend | Next.js API Routes (App Router) |
| ORM | Prisma 6.x |
| Database | PostgreSQL 15+ |
| Auth | NextAuth.js v4 |
| Container | Docker + Docker Compose |

---

## 3. Folder Structure

```
d:\crm\
├── app/                      # Next.js App Router
│   ├── (auth)/               # Auth pages (login, logout)
│   ├── (main)/               # Main app pages (protected)
│   │   ├── customers/        # Customer management
│   │   ├── products/         # Product management
│   │   ├── sales/            # Sales management
│   │   ├── employee/         # Employee management
│   │   ├── reports/          # Reports & analytics
│   │   └── settings/         # System settings
│   ├── api/                  # API Routes
│   │   ├── auth/             # NextAuth endpoints
│   │   ├── customers/        # Customer APIs
│   │   ├── products/         # Product APIs
│   │   ├── sales/            # Sales APIs
│   │   └── rbac/             # RBAC APIs
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Global styles
│
├── components/               # Shared UI components
│   ├── ui/                   # shadcn/ui components
│   ├── forms/                # Form components
│   └── layout/               # Layout components
│
├── src/                      # Core business logic
│   ├── core/                 # Domain services
│   │   ├── customers/        # Customer service
│   │   ├── sales/            # Sales service
│   │   ├── rbac/             # RBAC service
│   │   └── points/           # Points service
│   ├── infrastructure/       # External adapters
│   └── shared/               # Shared utilities
│
├── lib/                      # Library utilities
│   ├── db.ts                 # Prisma client instance
│   ├── auth.ts               # NextAuth config
│   └── rbac.ts               # RBAC helpers
│
├── prisma/                   # Database schema
│   └── schema.prisma         # Source of truth for data
│
├── types/                    # TypeScript definitions
│
└── docs/                     # Documentation (this folder)
```

---

## 4. Layer Responsibilities

### 4.1 API Layer (`app/api/`)
```typescript
// Responsibilities:
// 1. Request validation (Zod)
// 2. Authentication check (getServerSession)
// 3. Permission check (lib/rbac.ts)
// 4. Call service layer
// 5. Format response

// Pattern:
export async function GET(req: Request) {
  // 1. Auth
  const session = await getServerSession(authOptions);
  if (!session) return unauthorized();

  // 2. Permission check
  if (!hasPermission(session, 'resource.read')) {
    return forbidden();
  }

  // 3. Parse & validate  
  const params = validateInput(req);

  // 4. Call service
  const result = await someService.getData(params);

  // 5. Return
  return NextResponse.json(result);
}
```

### 4.2 Service Layer (`src/core/`)
```typescript
// Responsibilities:
// 1. Business logic
// 2. Data validation rules
// 3. Transaction management
// 4. Audit logging

// Pattern:
class SaleService {
  async createSale(data: CreateSaleInput) {
    return prisma.$transaction(async (tx) => {
      // 1. Validate credit
      await this.validateCredit(tx, data);
      
      // 2. Create sale
      const sale = await tx.sale.create({ data });
      
      // 3. Reserve stock
      await this.reserveStock(tx, sale.items);
      
      // 4. Log audit
      await this.logAudit('CREATE', sale);
      
      return sale;
    });
  }
}
```

### 4.3 Data Layer (Prisma)
```typescript
// Responsibilities:
// 1. Database queries
// 2. Relationship resolution
// 3. Constraint enforcement

// Access Pattern:
import prisma from '@/lib/db';

// Always filter soft deleted records
await prisma.customer.findMany({
  where: { deletedAt: null }
});
```

---

## 5. Key Flows

### 5.1 Sale Creation Flow
```
1. User → POST /api/sales
2. API validates request + checks permission
3. SaleService.createSale() called
4. Transaction:
   a. Validate customer credit
   b. Create Sale record
   c. Create SaleItems
   d. Update stock (reserve)
   e. Log audit
5. Return sale with saleNumber
```

### 5.2 Sale Approval Flow
```
1. Manager → POST /api/sales/[id]/approve
2. API checks APPROVE permission
3. SaleService.approveSale() called
4. Transaction:
   a. Validate current status = PENDING_APPROVAL
   b. Update status → APPROVED
   c. Set approvedBy, approvedAt
   d. Set orderExpiryDate = now + 3 days
   e. Create SaleStatusHistory
   f. Send notification to creator
5. Return updated sale
```

### 5.3 Point Calculation Flow
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

## 6. Design Principles

### 6.1 Separation of Concerns
- API routes: HTTP handling only
- Services: Business logic only  
- Prisma: Data access only

### 6.2 Soft Delete Pattern
```typescript
// All entities use deletedAt instead of hard delete
model Entity {
  deletedAt DateTime?  // null = active, date = deleted
}

// Always include in queries
where: { deletedAt: null }
```

### 6.3 Transaction Safety
```typescript
// Multi-step operations MUST use transactions
await prisma.$transaction(async (tx) => {
  // All operations here are atomic
});
```

### 6.4 Error Handling
```typescript
// Standard error response format
{
  "error": "ERROR_CODE",
  "message": "Human readable message",
  "details": {} // Optional additional info
}
```

---

## 7. Infrastructure

### 7.1 Docker Setup
```yaml
# docker-compose.yml
services:
  app:
    build: .
    ports: ["3000:3000"]
    depends_on: [db]
    
  db:
    image: postgres:15
    volumes: [postgres_data:/var/lib/postgresql/data]
```

### 7.2 Environment Variables
```bash
DATABASE_URL=postgresql://user:pass@host:5432/db
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
```

---

## 8. Security Considerations

- **Authentication**: NextAuth.js session-based
- **Authorization**: Custom RBAC with permissions
- **Data Access**: Multi-level (OWN, DEPARTMENT, ALL)
- **Audit Trail**: All mutations logged
- **Soft Delete**: No data permanently removed

---

**See Also**: [CODING_STANDARDS.md](./CODING_STANDARDS.md) | [RBAC_POLICY.md](./RBAC_POLICY.md)
