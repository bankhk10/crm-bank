# CRM System Documentation

> **Single Source of Truth** สำหรับ AI Agents และทีมพัฒนา  
> **Version**: 1.1.0 | **Updated**: 2026-02-04

---

## 📚 Document Index

| Document | Description | Read First |
|----------|-------------|------------|
| [AI_CONTEXT.md](./AI_CONTEXT.md) | ภาพรวมระบบ, เป้าหมาย, กฎการทำงาน AI | ⭐ YES |
| [DOMAIN_GLOSSARY.md](./DOMAIN_GLOSSARY.md) | คำศัพท์, Entity, Status, Business Rules | ⭐ YES |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | สถาปัตยกรรม, Layers, Flows | |
| [DATA_MODEL.md](./DATA_MODEL.md) | ERD, Tables, Relationships | |
| [API_CONTRACTS.md](./API_CONTRACTS.md) | Endpoints, Request/Response | |
| [RBAC_POLICY.md](./RBAC_POLICY.md) | Roles, Permissions, Access Levels | |
| [CODING_STANDARDS.md](./CODING_STANDARDS.md) | Coding Style, Patterns | |
| [DECISIONS.md](./DECISIONS.md) | Architecture Decision Records | |

---

## 🎯 Quick Start for AI Agents

### Step 1: Understand Context
```
1. Read AI_CONTEXT.md first
2. Review DOMAIN_GLOSSARY.md for terminology
3. Check relevant sections as needed
```

### Step 2: Trust Hierarchy
```
LEVEL 1 (Highest): prisma/schema.prisma
LEVEL 2 (High):    app/api/**/route.ts, src/core/**/*.ts  
LEVEL 3 (Medium):  types/**/*.ts
LEVEL 4 (Ref):     docs/**/*.md
```

### Step 3: Key Files
```
Schema:       prisma/schema.prisma
DB Client:    lib/db.ts
Auth:         lib/auth.ts  
RBAC:         lib/rbac.ts
Core Logic:   src/core/
API Routes:   app/api/
Pages:        app/(main)/
Components:   components/
Features:     features/          # Feature modules (new)
```

---

## 🏗️ System Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Customer     │────▶│      Sale       │◀────│    Employee     │
│  (DEALER etc.)  │     │  (Order Flow)   │     │  (Sales Team)   │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Credit Limit   │     │    SaleItem     │     │     Points      │
│  (วงเงิน)        │     │   + Product     │     │  (คะแนนสะสม)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

## 📋 Core Business Flows

### Sale Flow
```
Create → Submit → Approve → Pay → Deliver → Complete
                    ↓
               Reject/Cancel
```

### Credit Flow  
```
Customer → CreditLimit (permanent)
        → TemporaryCreditLimit (request → approve → use → expire)
```

### Points Flow
```
Sale COMPLETED → Calculate per SaleItem → EmployeePointHistory → Summary
```

---

## 🔐 RBAC Summary

| Role | View | Edit | Approve |
|------|------|------|---------|
| Admin | ALL | ALL | ALL |
| Manager | DEPT | DEPT | YES |
| Sales | OWN | OWN | NO |
| Viewer | ALL | NONE | NO |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, Tailwind CSS, shadcn/ui |
| Backend | Next.js API Routes |
| ORM | Prisma 6 |
| Database | PostgreSQL 15+ |
| Auth | NextAuth.js |
| Container | Docker |

---

## 📦 Feature Modules

**Pattern**: `features/[feature-name]/_[layer]/`

| Feature | Description | Status |
|---------|-------------|--------|
| **companies** | บริษัทและองค์กร (Table, Form, Kanban) | ✅ |
| **credit-limits** | วงเงินเครดิตถาวร (Table, Form, Cards) | ✅ |
| **temporary-credit-limits** | วงเงินเครดิตชั่วคราว (Approval flow) | ✅ |
| **notifications** | ระบบแจ้งเตือน (Bell, Polling, Navigation) | ✅ |
| **fulfillment** | การจัดส่งสินค้า | ✅ |
| **layout** | Components สำหรับ Layout | ✅ |

### Module Structure
```
features/[feature-name]/
├── _components/     # UI components
├── _hooks/          # Custom hooks
├── _lib/            # Utils, constants
├── _types/          # Type definitions
├── index.ts         # Barrel export
└── README.md        # Feature documentation
```

### Usage Example
```tsx
// Import from feature module
import { CompaniesTable, CompanyForm } from "@/features/companies";
import { NotificationBell } from "@/features/notifications";
```

---

## ⚠️ Important Rules

### DO
- ✅ Use `lib/db.ts` for Prisma client
- ✅ Include `where: { deletedAt: null }` in queries
- ✅ Check permissions before data access
- ✅ Use transactions for multi-step operations
- ✅ Log security-sensitive actions

### DON'T
- ❌ Create new Prisma client instances
- ❌ Hard delete records
- ❌ Skip permission checks
- ❌ Use `any` types
- ❌ Bypass credit limit validation

---

## 📝 Changelog

| Date | Changes |
|------|---------|
| 2026-02-04 | Added feature modules structure (v1.1.0) |
| 2026-02-04 | Refactored: companies, credit-limits, temporary-credit-limits, notifications |
| 2026-01-28 | Initial documentation created (v1.0.0) |

---

**Maintained by**: Development Team  
**For questions**: See AI_CONTEXT.md for decision framework
