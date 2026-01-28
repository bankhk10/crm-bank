# AI Context - CRM System

> **Document Type**: Master Context Document  
> **Version**: 1.0.0  
> **Last Updated**: 2026-01-28  
> **Related Documents**: [DOMAIN_GLOSSARY.md](./DOMAIN_GLOSSARY.md) | [ARCHITECTURE.md](./ARCHITECTURE.md) | [DATA_MODEL.md](./DATA_MODEL.md)

---

## 1. System Overview

### 1.1 What is this system?
ระบบ CRM (Customer Relationship Management) สำหรับบริหารจัดการ:
- **ลูกค้า** (Customer) - ร้านค้า/เกษตรกรในประเทศไทย
- **การขาย** (Sales) - ใบสั่งซื้อและกระบวนการจัดส่ง
- **สินค้า** (Product) - สินค้าเกษตร/เคมีภัณฑ์
- **พนักงาน** (Employee) - ทีมขายและผู้ดูแลระบบ
- **คะแนน** (Points) - ระบบสะสมคะแนนพนักงานจากยอดขาย
- **รายงาน** (Reports) - วิเคราะห์ยอดขายและ KPI

### 1.2 Business Domain
- **Industry**: Agricultural Chemicals / Agrochemicals
- **Geography**: Thailand (ใช้ระบบที่อยู่ไทย, ภาค, จังหวัด, อำเภอ, ตำบล)
- **Customer Types**: Dealer → Subdealer → Farmer → Broker (ลำดับชั้น)
- **Key Processes**: Order → Approve → Payment → Delivery → Complete

---

## 2. Goals & Objectives

### 2.1 Business Goals
| Goal | Priority | Measured By |
|------|----------|-------------|
| เพิ่มประสิทธิภาพการขาย | HIGH | ยอดขาย vs. เป้าหมายรายเดือน |
| ติดตามลูกค้าอย่างเป็นระบบ | HIGH | จำนวนลูกค้า Active / Customer Churn Rate |
| จัดการวงเงินเครดิต | HIGH | Credit Utilization Rate |
| กระตุ้นพนักงานด้วยระบบคะแนน | MEDIUM | คะแนนรวมพนักงาน vs. Target |
| วิเคราะห์ข้อมูลการขาย | MEDIUM | Report Accuracy / Time-to-Report |

### 2.2 Technical Goals
- **Mobile First**: ใช้งานบนมือถือเป็นหลัก
- **Real-time Data**: ข้อมูลอัปเดตทันที
- **Scalability**: รองรับการเติบโต
- **Auditability**: ติดตามการเปลี่ยนแปลงทั้งหมด

---

## 3. System Scope

### 3.1 In Scope (ภายในขอบเขต)
```
✅ Customer Management (CRUD, Credit, Hierarchy)
✅ Product Management (CRUD, Stock, LOT Tracking)
✅ Sales Order Management (Create → Approve → Deliver → Complete)
✅ Employee Management (Hierarchy, Department, Position)
✅ RBAC System (Role, Permission, Override)
✅ Point System (Accumulation based on Sale Items)
✅ Reporting Dashboard (Sales KPI, Employee KPI)
✅ Sales Target Management (Monthly, Region, Product Group)
✅ Audit Logging (Security, Application, Audit)
```

### 3.2 Out of Scope (นอกขอบเขต)
```
❌ Inventory Management (ไม่ใช่ระบบคลังสินค้าหลัก, แค่ track stock reference)
❌ Accounting / Finance (ไม่มี invoice, receipt, VAT calculation)
❌ HR System (ไม่มี payroll, leave, attendance)
❌ E-commerce / Online Store (ไม่ใช่ B2C)
❌ Third-party Integration (ยังไม่มี API sync กับระบบอื่น)
```

### 3.3 Module Dependency Map
```
┌─────────────────────────────────────────────────────────────┐
│                      RBAC Layer                             │
│            (Role, Permission, UserPermissionOverride)       │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│   Employee    │    │   Customer    │    │   Product     │
│   Module      │    │   Module      │    │   Module      │
└───────┬───────┘    └───────┬───────┘    └───────┬───────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             ▼
                   ┌───────────────────┐
                   │   Sales Module    │
                   │   (Core Process)  │
                   └─────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
       ┌──────────┐  ┌──────────────┐  ┌──────────┐
       │  Points  │  │   Reporting  │  │  Credit  │
       │  Module  │  │   Module     │  │  Module  │
       └──────────┘  └──────────────┘  └──────────┘
```

---

## 4. Key Terminology

> ⚠️ **IMPORTANT**: ดูรายละเอียดเพิ่มเติมที่ [DOMAIN_GLOSSARY.md](./DOMAIN_GLOSSARY.md)

### 4.1 Core Entities
| Term | Thai | Definition |
|------|------|------------|
| Customer | ลูกค้า | ร้านค้าหรือบุคคลที่ซื้อสินค้า |
| Employee | พนักงาน | ผู้ใช้งานระบบที่มี profile แยกจาก User |
| Sale | ใบขาย | คำสั่งซื้อจากลูกค้า |
| Product | สินค้า | สินค้าที่ขาย รวม stock และ LOT |
| User | ผู้ใช้ระบบ | บัญชีสำหรับ login + permission |

### 4.2 Critical Status Values
```typescript
// Sale Status Flow:
PENDING → PENDING_APPROVAL → APPROVED → AWAITING_DELIVERY → 
DELIVERED → DELIVERY_COMPLETED → COMPLETED

// Alternative paths:
PENDING_APPROVAL → REJECTED
APPROVED → CANCELLED
APPROVED → EXPIRED (ไม่ระบุวันส่ง + เลย 3 วัน)
APPROVED → OVERDUE (แก้วันส่ง > 3 ครั้ง)
PENDING_APPROVAL → WAITING_FOR_CORRECTION
```

---

## 5. AI Agent Working Rules

### 5.1 Data Trust Hierarchy (ลำดับความน่าเชื่อถือของข้อมูล)

```
🔴 LEVEL 1 (Highest Trust): Prisma Schema
   └── prisma/schema.prisma
   └── เป็น source of truth สำหรับ data model
   └── ถ้า docs ขัดแย้งกับ schema → เชื่อ schema

🟠 LEVEL 2 (High Trust): API Implementation  
   └── app/api/**/route.ts
   └── src/core/**/*.ts
   └── เป็น source of truth สำหรับ business logic
   └── ถ้า docs ขัดแย้งกับ code → เชื่อ code

🟡 LEVEL 3 (Medium Trust): Type Definitions
   └── types/**/*.ts
   └── เป็น contract ระหว่าง frontend/backend

🟢 LEVEL 4 (Reference): Documentation
   └── docs/**/*.md
   └── ใช้เป็น context และ explanation
   └── อาจ outdated ได้
```

### 5.2 Code Conventions to Follow
```yaml
# ดูรายละเอียดที่ CODING_STANDARDS.md

file_naming:
  - use kebab-case for files: create-sale.ts
  - use PascalCase for components: SaleForm.tsx
  
folder_structure:
  - app/(main)/* for pages
  - app/api/* for API routes
  - src/core/* for domain logic
  - components/* for UI components
  
database:
  - always use lib/db.ts for prisma client
  - wrap mutations in transactions when needed
  - use soft delete (deletedAt) not hard delete
```

### 5.3 Decision Making Rules
```yaml
when_creating_new_feature:
  1. Check if entity exists in schema.prisma
  2. Check existing API patterns in app/api/
  3. Follow RBAC rules from RBAC_POLICY.md
  4. Match UI patterns from existing components

when_editing_existing_code:
  1. Preserve existing patterns
  2. Don't break backward compatibility
  3. Add type safety (no 'any' types)
  4. Maintain audit log where applicable

when_uncertain:
  1. Ask for clarification
  2. Refer to schema.prisma first
  3. Check existing similar implementations
  4. Document assumptions made
```

### 5.4 Common Pitfalls to Avoid
```yaml
# ❌ DON'T do these:
- Don't create new prisma client instances (use lib/db.ts)
- Don't skip permission checks in API routes
- Don't hard-delete records (use deletedAt)
- Don't calculate points manually (use EmployeePointHistory)
- Don't bypass credit limit validation
- Don't use deprecated Sale statuses

# ✅ DO these:
- Always include `where: { deletedAt: null }` in queries
- Always check user permissions before data access
- Always use transactions for multi-step operations
- Always log security-sensitive actions
- Always validate input with Zod or similar
```

---

## 6. Tech Stack Summary

| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | Next.js + React | 15.x |
| Styling | Tailwind CSS | 3.x |
| UI Components | shadcn/ui | latest |
| Backend | Next.js API Routes | 15.x |
| ORM | Prisma | 6.x |
| Database | PostgreSQL | 15+ |
| Auth | NextAuth.js | 4.x |
| Containerization | Docker + Docker Compose | latest |
| State Management | React Query / SWR | latest |

---

## 7. Quick Reference Links

### Related Docs
- [Domain Glossary](./DOMAIN_GLOSSARY.md) - คำศัพท์และ business rules
- [Architecture](./ARCHITECTURE.md) - สถาปัตยกรรมระบบ
- [Data Model](./DATA_MODEL.md) - อธิบาย entities และ relationships
- [API Contracts](./API_CONTRACTS.md) - รายละเอียด endpoints
- [RBAC Policy](./RBAC_POLICY.md) - กฎการเข้าถึงข้อมูล
- [Coding Standards](./CODING_STANDARDS.md) - มาตรฐานการเขียน code
- [Decisions](./DECISIONS.md) - เหตุผลเชิงสถาปัตยกรรม

### Key Files in Codebase
```yaml
schema: prisma/schema.prisma
main_layout: app/(main)/layout.tsx  
auth: lib/auth.ts
db_client: lib/db.ts
rbac: lib/rbac.ts
api: app/api/
core_logic: src/core/
components: components/
types: types/
```

---

## 8. Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-28 | 1.0.0 | Initial documentation created |

---

**END OF DOCUMENT**
