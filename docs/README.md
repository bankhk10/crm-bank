# CRM System Documentation

> **Single Source of Truth** สำหรับ AI Agents และทีมพัฒนา  
> **Version**: 1.2.0 | **Updated**: 2026-02-09

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
LEVEL 2 (High):    app/api/**/route.ts, app/actions/*.ts, src/core/**/*.ts  
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
Actions:      app/actions/
Pages:        app/(main)/
Components:   components/
Features:     features/          # Feature modules
```

---

## 🤖 AI Reading Commands (เพื่ออัปเดตฟีเจอร์ในอนาคต)

> ใช้คำสั่งด้านล่างเพื่อเก็บ context ล่าสุดก่อนเพิ่มฟีเจอร์ใหม่

```bash
# 1) ตรวจ schema และ enum ล่าสุด (source of truth)
sed -n '1,200p' prisma/schema.prisma

# 2) ดูรายการ API routes ทั้งหมด
find app/api -maxdepth 3 -type f -name 'route.ts'

# 3) ดูโครงสร้าง feature modules
find features -maxdepth 2 -type d

# 4) ดู Server Actions
ls app/actions

# 5) ตรวจ RBAC seed เพื่อดู permission ล่าสุด
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
| Frontend | Next.js 16.1.5, React 19.2.0, Tailwind CSS 4 |
| Backend | Next.js API Routes + Server Actions |
| ORM | Prisma 7.x |
| Database | PostgreSQL 15+ |
| Auth | NextAuth.js 5.0.0-beta.30 |
| Container | Docker |

---

## 📦 Feature Modules

**Pattern**: `features/[feature-name]/_[layer]/`

| Feature | Description | Status |
|---------|-------------|--------|
| **companies** | บริษัทและองค์กร | ✅ |
| **credit-limits** | วงเงินเครดิตถาวร | ✅ |
| **customers** | ลูกค้าและผู้ดูแล | ✅ |
| **employee** | พนักงานและโครงสร้างองค์กร | ✅ |
| **fulfillment** | การจัดส่งสินค้า | ✅ |
| **layout** | Components สำหรับ Layout | ✅ |
| **notifications** | ระบบแจ้งเตือน | ✅ |
| **products** | สินค้า กลุ่มสินค้า และราคา | ✅ |
| **rbac** | การจัดการสิทธิ์ | ✅ |
| **sales** | ใบขายและ approval flow | ✅ |
| **temporary-credit-limits** | วงเงินเครดิตชั่วคราว | ✅ |

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
| 2026-02-09 | Updated AI reading commands + feature module list (v1.2.0) |
| 2026-02-04 | Added feature modules structure (v1.1.0) |
| 2026-01-28 | Initial documentation created (v1.0.0) |

---

**Maintained by**: Development Team  
**For questions**: See AI_CONTEXT.md for decision framework
