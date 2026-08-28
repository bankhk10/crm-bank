# CRM System Documentation

> **Single Source of Truth** สำหรับ AI Agents และทีมพัฒนา  
> **Version**: 2.0.0 | **Updated**: 2026-02-24

---

## 📚 Document Index

### Global Documentation (System-Wide)

| Document | Description | Read First |
|---|---|:---:|
| [AI_CONTEXT.md](./AI_CONTEXT.md) | ภาพรวมระบบ, เป้าหมาย, กฎการทำงาน AI | ⭐ YES |
| [DOMAIN_GLOSSARY.md](./DOMAIN_GLOSSARY.md) | คำศัพท์, Entity, Status, Business Rules | ⭐ YES |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | สถาปัตยกรรม, Module Layers, Flows | |
| [DATA_MODEL.md](./DATA_MODEL.md) | ERD, Tables, Relationships | |
| [RBAC_POLICY.md](./RBAC_POLICY.md) | Roles, Permissions, Access Levels | |
| [CODING_STANDARDS.md](./CODING_STANDARDS.md) | Coding Style, Patterns | |
| [DECISIONS.md](./DECISIONS.md) | Architecture Decision Records (ADRs) | |
| [local-database-development.md](./local-database-development.md) | คู่มือการพัฒนาและจัดการฐานข้อมูลจำลองในเครื่อง (Local DB) | |

### Module Documentation (Domain & Specific Architecture)

| Module | Documentation Path | Key Topics |
|---|---|---|
| **Activity Plans** | [`modules/activity-plans/docs/`](../modules/activity-plans/docs/README.md) | [Architecture](../modules/activity-plans/docs/architecture.md), [Data Flow Audit](../modules/activity-plans/docs/audit/data-flow-audit.md), [Post-Impl Audit](../modules/activity-plans/docs/audit/post-implementation-audit.md) |
| **Products & Stock** | [`modules/products/docs/`](../modules/products/docs/README.md) | [Stock Reservation Business Rules](../modules/products/docs/stock-reservation-business-rules.md), [Stock Invariant Audits](../modules/products/docs/audit/stock-reserved-negative-global-audit.md) |

---

## 🎯 Quick Start for AI Agents

### Step 1: Understand Context

```
1. Read AI_CONTEXT.md first
2. Review DOMAIN_GLOSSARY.md for terminology
3. Check ARCHITECTURE.md for module structure
4. Check relevant sections as needed
```

### Step 2: Trust Hierarchy

```
LEVEL 1 (Highest): prisma/schema.prisma
LEVEL 2 (High):    modules/*/server/actions.ts, modules/*/application/**/*.ts
LEVEL 3 (Medium):  modules/*/types/**/*.ts, types/**/*.ts
LEVEL 4 (Ref):     docs/**/*.md
```

### Step 3: Key Files

```
Schema:             prisma/schema.prisma
DB Client:          lib/db.ts
Auth:               lib/auth.ts
RBAC:               lib/rbac.ts
Modules:            modules/           ← ⭐ Primary module location
Reference Module:   modules/employee/  ← Reference implementation
Shared Components:  components/custom/ ← TruncatedCell, ActionButton, DetailItem
Pages:              app/(main)/
```

---

## 🤖 AI Reading Commands (เพื่ออัปเดตฟีเจอร์ในอนาคต)

> ใช้คำสั่งด้านล่างเพื่อเก็บ context ล่าสุดก่อนเพิ่มฟีเจอร์ใหม่

```bash
# 1) ตรวจ schema และ enum ล่าสุด (source of truth)
sed -n '1,200p' prisma/schema.prisma

# 2) ดูโครงสร้าง modules ทั้งหมด
find modules -maxdepth 2 -type d

# 3) ดู reference module (employee)
find modules/employee -type f

# 4) ดู Server Actions ทุก module
find modules -name 'actions.ts' -path '*/server/*'

# 5) ดู API routes ที่ยังใช้อยู่
find app/api -maxdepth 3 -type f -name 'route.ts'

# 6) ตรวจ RBAC seed เพื่อดู permission ล่าสุด
sed -n '1,200p' prisma/seed/rbac.ts
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

| Role    | View | Edit | Approve |
| ------- | ---- | ---- | ------- |
| Admin   | ALL  | ALL  | ALL     |
| Manager | DEPT | DEPT | YES     |
| Sales   | OWN  | OWN  | NO      |
| Viewer  | ALL  | NONE | NO      |

---

## 🛠️ Tech Stack

| Layer     | Technology                                   |
| --------- | -------------------------------------------- |
| Frontend  | Next.js 16.1.5, React 19.2.0, Tailwind CSS 4 |
| Backend   | Next.js Server Actions + API Routes          |
| ORM       | Prisma 7.x                                   |
| Database  | PostgreSQL 15+                               |
| Auth      | NextAuth.js 5.0.0-beta.30                    |
| Container | Docker                                       |

---

## 📦 Enterprise Modules

> **Pattern**: `modules/[MODULE_NAME]/` with layered architecture  
> **Reference**: `modules/employee/` — ดูตัวอย่างเต็ม

### Module Architecture

```
modules/[MODULE_NAME]/
├── infrastructure/              ← Database access (repository)
├── application/                 ← Business logic (use cases)
├── server/                      ← Transport (server actions)
├── features/                    ← UI screens
│   ├── list-view/
│   ├── form/
│   └── detail-view/
├── ui/                          ← Module-specific UI components
├── types/                       ← Type definitions
├── constants.ts
├── index.ts                     ← Barrel exports
└── README.md
```

| Module | Path | Description | Status |
|---|---|---|:---:|
| **activity-plans** | `modules/activity-plans/` | แผนงานและผลการทำกิจกรรม (Trip Plan) | ✅ |
| **employee** | `modules/employee/` | ⭐ Reference implementation | ✅ |
| **customers**               | `modules/customers/`               | ลูกค้าและผู้ดูแล            | ✅     |
| **companies**               | `modules/companies/`               | บริษัทและองค์กร             | ✅     |
| **products**                | `modules/products/`                | สินค้า กลุ่มสินค้า และราคา  | ✅     |
| **sales**                   | `modules/sales/`                   | ใบขายและ approval flow      | ✅     |
| **fulfillment**             | `modules/fulfillment/`             | การจัดส่งสินค้า             | ✅     |
| **credit-limits**           | `modules/credit-limits/`           | วงเงินเครดิตถาวร            | ✅     |
| **temporary-credit-limits** | `modules/temporary-credit-limits/` | วงเงินเครดิตชั่วคราว        | ✅     |
| **sales-targets**           | `modules/sales-targets/`           | เป้าหมายยอดขาย              | ✅     |
| **shipping-companies**      | `modules/shipping-companies/`      | บริษัทขนส่ง                 | ✅     |
| **rbac**                    | `modules/rbac/`                    | การจัดการสิทธิ์             | ✅     |
| **notifications**           | `modules/notifications/`           | ระบบแจ้งเตือน               | ✅     |
| **layout**                  | `modules/layout/`                  | Components สำหรับ Layout    | ✅     |

### Usage Example

```tsx
// Import from module
import { EmployeeTable, EmployeeForm } from "@/modules/employee";
import { CompaniesTable, CompanyForm } from "@/modules/companies";
```

---

## ⚠️ Important Rules

### DO

- ✅ Use `lib/db.ts` for Prisma client
- ✅ Include `where: { deletedAt: null }` in queries
- ✅ Check permissions in server actions
- ✅ Use transactions for multi-step operations
- ✅ Follow the 4-layer module architecture
- ✅ Use shared components from `@/components/custom/`

### DON'T

- ❌ Create new Prisma client instances
- ❌ Hard delete records
- ❌ Skip permission checks in server actions
- ❌ Use `any` types
- ❌ Put business logic in `server/actions.ts`
- ❌ Put database queries in `application/` layer

---

## 📝 Changelog

| Date       | Changes                                                         |
| ---------- | --------------------------------------------------------------- |
| 2026-02-24 | Major update: modules/ architecture, removed old features/ refs |
| 2026-02-09 | Updated AI reading commands + feature module list (v1.2.0)      |
| 2026-02-04 | Added feature modules structure (v1.1.0)                        |
| 2026-01-28 | Initial documentation created (v1.0.0)                          |

---

**Maintained by**: Development Team  
**For questions**: See AI_CONTEXT.md for decision framework
