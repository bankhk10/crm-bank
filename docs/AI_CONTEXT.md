# AI Context - CRM System

> **Document Type**: Master Context Document  
> **Version**: 3.0.0  
> **Last Updated**: 2026-08-28  
> **Related Documents**: [DOMAIN_GLOSSARY.md](./DOMAIN_GLOSSARY.md) | [ARCHITECTURE.md](./ARCHITECTURE.md) | [DATA_MODEL.md](./DATA_MODEL.md) | [CODING_STANDARDS.md](./CODING_STANDARDS.md) | [MODULE_ARCHITECTURE.md](./MODULE_ARCHITECTURE.md)

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
- **บริษัท** (Company) - โครงสร้างองค์กรที่ผูกกับพนักงาน
- **แจ้งเตือน** (Notifications) - แจ้งเตือนเหตุการณ์สำคัญในระบบ

### 1.2 Business Domain

- **Industry**: Agricultural Chemicals / Agrochemicals
- **Geography**: Thailand (ใช้ระบบที่อยู่ไทย, ภาค, จังหวัด, อำเภอ, ตำบล)
- **Customer Types**: Dealer → Subdealer → Farmer → Broker (ลำดับชั้น)
- **Key Processes**: Order → Approve → Payment → Delivery → Complete

---

## 2. Goals & Objectives

### 2.1 Business Goals

| Goal                        | Priority | Measured By                              |
| --------------------------- | -------- | ---------------------------------------- |
| เพิ่มประสิทธิภาพการขาย      | HIGH     | ยอดขาย vs. เป้าหมายรายเดือน              |
| ติดตามลูกค้าอย่างเป็นระบบ   | HIGH     | จำนวนลูกค้า Active / Customer Churn Rate |
| จัดการวงเงินเครดิต          | HIGH     | Credit Utilization Rate                  |
| กระตุ้นพนักงานด้วยระบบคะแนน | MEDIUM   | คะแนนรวมพนักงาน vs. Target               |
| วิเคราะห์ข้อมูลการขาย       | MEDIUM   | Report Accuracy / Time-to-Report         |

### 2.2 Technical Goals

- **Mobile First**: ใช้งานบนมือถือเป็นหลัก
- **Real-time Data**: ข้อมูลอัปเดตทันที
- **Scalability**: รองรับการเติบโต
- **Auditability**: ติดตามการเปลี่ยนแปลงทั้งหมด

---

## 3. System Scope

### 3.1 In Scope

```text
✅ Customer Management (CRUD, Credit, Hierarchy)
✅ Product Management (CRUD, Stock, LOT Tracking)
✅ Sales Order Management (Create → Approve → Deliver → Complete)
✅ Employee Management (Hierarchy, Department, Position)
✅ RBAC System (Role, Permission, Override)
✅ Point System (Accumulation based on Sale Items)
✅ Reporting Dashboard (Sales KPI, Employee KPI)
✅ Sales Target & Forecast (Monthly, Region, Product Group)
✅ Audit Logging (Security, Application, Audit)
✅ Notifications (User-level alerts)
✅ Fulfillment (จัดส่งสินค้า)
✅ Shipping Companies (บริษัทขนส่ง)
```

### 3.2 Out of Scope

```text
❌ Inventory Management (ไม่ใช่ระบบคลังสินค้าหลัก, แค่ track stock reference)
❌ Accounting / Finance (ไม่มี invoice, receipt, VAT calculation)
❌ HR System (ไม่มี payroll, leave, attendance)
❌ E-commerce / Online Store (ไม่ใช่ B2C)
❌ Third-party Integration (ยังไม่มี API sync กับระบบอื่น)
```

### 3.3 Module Dependency Map

```text
                         RBAC
                          │
             ┌────────────┼────────────┐
             ▼            ▼            ▼
         Employee      Customer      Product
             │            │            │
             └────────────┼────────────┘
                          ▼
                    Sales Module
                          │
             ┌────────────┼────────────┐
             ▼            ▼            ▼
          Points       Reporting     Credit
```

This map describes business relationships only. It does not replace the technical dependency rules defined in `MODULE_ARCHITECTURE.md`.

---

## 4. Key Terminology

> ⚠️ **IMPORTANT**: ดูรายละเอียดเพิ่มเติมที่ [DOMAIN_GLOSSARY.md](./DOMAIN_GLOSSARY.md)

### 4.1 Core Entities

| Term     | Thai       | Definition                             |
| -------- | ---------- | -------------------------------------- |
| Customer | ลูกค้า     | ร้านค้าหรือบุคคลที่ซื้อสินค้า          |
| Employee | พนักงาน    | ผู้ใช้งานระบบที่มี profile แยกจาก User |
| Sale     | ใบขาย      | คำสั่งซื้อจากลูกค้า                    |
| Product  | สินค้า     | สินค้าที่ขาย รวม stock และ LOT         |
| User     | ผู้ใช้ระบบ | บัญชีสำหรับ login + permission         |

### 4.2 Critical Status Values

```typescript
// Sale Status Flow:
// Credit sales:
// PENDING_APPROVAL → APPROVED → AWAITING_DELIVERY → DELIVERY_COMPLETED → COMPLETED

// Prepaid sales:
// PENDING_APPROVAL → APPROVED → AWAITING_DELIVERY (Wait for payment) → PAID
// → DELIVERY_COMPLETED → COMPLETED

// Alternative paths:
// PENDING_APPROVAL → REJECTED
// APPROVED / AWAITING_DELIVERY → CANCELLED
// APPROVED / AWAITING_DELIVERY / PARTIALLY_DELIVERED / DELIVERY_COMPLETED
//   → OVERDUE (if creditDueDate has passed without payment)
// PENDING_APPROVAL → WAITING_FOR_CORRECTION
```

---

# 5. AI Agent Working Rules

## 5.1 Source of Truth Hierarchy

Use the appropriate source of truth for the type of information being checked.

```text
┌──────────────────────────────────────────────────────────────┐
│ DATA MODEL                                                   │
│ prisma/schema.prisma                                        │
│ Source of truth for database structure, fields and enums     │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ PROJECT ARCHITECTURE                                         │
│ docs/ARCHITECTURE.md                                         │
│ System-wide architecture and technical boundaries            │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ MODULE ARCHITECTURE                                          │
│ docs/MODULE_ARCHITECTURE.md                                  │
│ Module structure, layer responsibilities, dependency rules    │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ CODING STANDARDS                                              │
│ docs/CODING_STANDARDS.md                                     │
│ Coding, naming, UI, database and implementation conventions   │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ AI EXECUTABLE RULES                                          │
│ .agents/skills/crm-coding-standards/SKILL.md                 │
│ Rules the AI Agent must follow while performing code tasks     │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ IMPLEMENTATION                                               │
│ Current source code                                           │
│ Use to understand actual behavior and current implementation  │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ DOMAIN / CONTEXT DOCS                                        │
│ docs/**/*.md and modules/*/README.md                         │
│ Context, explanation and module-specific documentation        │
└──────────────────────────────────────────────────────────────┘
```

### Important

Do not treat the above as a blanket ranking for every kind of question.

Use:

- `prisma/schema.prisma` for actual data structure.
- `docs/ARCHITECTURE.md` for system architecture.
- `docs/MODULE_ARCHITECTURE.md` for module structure and layer boundaries.
- `docs/CODING_STANDARDS.md` for project coding conventions.
- `.agents/skills/crm-coding-standards/SKILL.md` for mandatory AI execution rules.
- Current implementation when verifying actual behavior.
- Domain/module documentation for context and explanation.

If sources conflict:

1. Identify the type of conflict.
2. Prefer the appropriate authority above.
3. Do not silently invent a new rule.
4. Document or report unresolved conflicts.

---

## 5.2 Code Conventions to Follow

```yaml
file_naming:
  - use kebab-case for files
  - use established project naming patterns

module_architecture:
  authority: docs/MODULE_ARCHITECTURE.md
  standard:
    - application/
    - features/
    - infrastructure/
    - server/
    - types/
    - ui/
    - constants.ts
    - index.ts
    - README.md
  note:
    - create only the folders/files that are required

dependency_direction:
  - features -> server
  - server -> application
  - application -> infrastructure
  - infrastructure -> database

shared:
  - components/custom/
  - components/ui/
  - lib/db.ts
  - lib/auth.ts
  - lib/rbac.ts

database:
  - use lib/db.ts for the shared Prisma client
  - use soft delete where applicable
  - use transactions when required for data integrity
```

---

## 5.3 New Module Decision Rules

When creating a new module:

```text
1. Understand the requirement.
2. Read docs/MODULE_ARCHITECTURE.md.
3. Read docs/CODING_STANDARDS.md.
4. Inspect similar existing modules and features.
5. Search for existing shared components and utilities.
6. Reuse existing patterns whenever possible.
7. Create only the structure required by the new module.
8. Implement according to the standard dependency direction.
9. Validate the implementation.
10. Update module documentation when required.
```

Important:

> No existing module is the permanent source of architectural truth.

Existing modules are implementation references only.

Do not copy a module's domain-specific business logic merely because its structure is useful.

---

## 5.4 Existing Module Refactoring Rules

When editing or refactoring an existing module:

```text
1. Read the current Module Architecture Contract.
2. Audit the current module structure.
3. Identify the responsibility of each relevant file.
4. Compare the module with the current architecture.
5. Preserve existing business behavior.
6. Move responsibilities into the correct layers.
7. Update imports and exports.
8. Check all references before deleting or renaming files.
9. Update documentation when required.
10. Validate the result.
```

Do not modify unrelated modules unless explicitly required.

---

## 5.5 Feature Development Workflow

For UI-First development:

```text
Requirement
    ↓
Inspect Existing Pattern
    ↓
UI + Mock Data
    ↓
User Review
    ↓
Data Shape
    ↓
Database / Infrastructure
    ↓
Application / Validation
    ↓
Server Actions
    ↓
Integration
    ↓
Validation
    ↓
Documentation
```

Follow the workflow defined in:

`.agents/workflows/create-feature-ui-first.md`

---

## 5.6 Refactoring Workflow

For structural refactoring:

```text
Current Module
    ↓
Audit
    ↓
Compare with Module Architecture Contract
    ↓
Map Responsibilities
    ↓
Move Code to Correct Layers
    ↓
Update Imports / Exports
    ↓
Cleanup
    ↓
Validation
    ↓
Documentation
```

Follow the workflow defined in:

`.agents/workflows/refactor-module-structure.md`

---

## 5.7 When Uncertain

When architectural or implementation details are unclear:

1. Inspect the relevant project documentation.
2. Inspect the current implementation.
3. Search for similar existing patterns.
4. Check the database schema when the issue concerns data structure.
5. Do not invent a new architecture.
6. Ask for clarification when an unresolved decision would materially change architecture or behavior.

---

## 5.8 Mandatory Rules

The AI Agent MUST:

- Follow the current Module Architecture Contract.
- Follow the project Coding Standards.
- Reuse existing project patterns where appropriate.
- Keep module layer responsibilities consistent.
- Keep business logic in `application/`.
- Keep database access in `infrastructure/`.
- Keep Server Actions thin.
- Keep UI separate from direct database access.
- Respect authentication and authorization boundaries.
- Handle soft delete correctly when applicable.
- Use transactions when required.
- Validate before considering work complete.
- Avoid unrelated changes.

The AI Agent MUST NOT:

- Use an existing module as the permanent architecture authority.
- Invent new layers without justification.
- Bypass established layers for convenience.
- Duplicate existing components or business logic unnecessarily.
- Modify unrelated modules.
- Silently change project-wide architecture.
- Assume missing requirements.
- Mark work complete without validation.

---

## 5.9 Common Pitfalls to Avoid

```yaml
# ❌ DON'T
- create a new Prisma client inside a module
- skip permission checks for protected actions
- hard-delete soft-deletable records
- put business logic in server/actions.ts
- put database queries directly in UI
- put business logic in infrastructure
- create a new architectural layer for one module
- duplicate shared components without justification
- copy another module's domain-specific business logic
- refactor unrelated modules during a feature task

# ✅ DO
- use the shared database client
- check authentication and permission
- use deletedAt when soft delete applies
- keep Server Actions thin
- keep business logic in application/
- keep database access in infrastructure/
- reuse existing patterns
- follow docs/MODULE_ARCHITECTURE.md
- validate type-check, lint, tests and relevant flows
- update documentation when required
```

---

# 6. Tech Stack Summary

| Layer            | Technology                          | Version         |
| ---------------- | ----------------------------------- | --------------- |
| Frontend         | Next.js + React                     | 16.1.5 + 19.2.0 |
| Styling          | Tailwind CSS                        | 4.x             |
| UI Components    | shadcn/ui (Radix UI)                | latest          |
| Backend          | Next.js Server Actions + API Routes | 16.x            |
| ORM              | Prisma                              | 7.x             |
| Database         | PostgreSQL                          | 15+             |
| Auth             | NextAuth.js                         | 5.0.0-beta.30   |
| Containerization | Docker + Docker Compose             | latest          |
| State Management | React (built-in)                    | 19.x            |

---

# 7. Quick Reference Links

### Related Docs

- [Domain Glossary](./DOMAIN_GLOSSARY.md) - คำศัพท์และ business rules
- [Architecture](./ARCHITECTURE.md) - สถาปัตยกรรมระบบ
- [Module Architecture](./MODULE_ARCHITECTURE.md) - มาตรฐานโครงสร้างทุก Module
- [Data Model](./DATA_MODEL.md) - อธิบาย entities และ relationships
- [RBAC Policy](./RBAC_POLICY.md) - กฎการเข้าถึงข้อมูล
- [Coding Standards](./CODING_STANDARDS.md) - มาตรฐานการเขียน code
- [Decisions](./DECISIONS.md) - เหตุผลเชิงสถาปัตยกรรม

### AI Agent

```text
.agents/skills/crm-coding-standards/SKILL.md
.agents/workflows/create-feature-ui-first.md
.agents/workflows/refactor-module-structure.md
```

### Key Files in Codebase

```yaml
schema: prisma/schema.prisma
main_layout: app/(main)/layout.tsx
auth: lib/auth.ts
db_client: lib/db.ts
rbac: lib/rbac.ts
modules: modules/
shared_components: components/custom/
pages: app/(main)/
```

---

## 8. Current Modules

| Module                  | Path                               | Description                         |
| ----------------------- | ---------------------------------- | ----------------------------------- |
| activity-plans          | `modules/activity-plans/`          | แผนงานและผลการทำกิจกรรม (Trip Plan) |
| employee                | `modules/employee/`                | พนักงานและโครงสร้างผู้ใช้งาน        |
| customers               | `modules/customers/`               | ลูกค้าและผู้ดูแล                    |
| companies               | `modules/companies/`               | บริษัทและองค์กร                     |
| products                | `modules/products/`                | สินค้า กลุ่มสินค้า และราคา          |
| sales                   | `modules/sales/`                   | ใบขายและ approval flow              |
| fulfillment             | `modules/fulfillment/`             | การจัดส่งสินค้า                     |
| credit-limits           | `modules/credit-limits/`           | วงเงินเครดิตถาวร                    |
| temporary-credit-limits | `modules/temporary-credit-limits/` | วงเงินเครดิตชั่วคราว                |
| sales-targets           | `modules/sales-targets/`           | เป้าหมายยอดขาย                      |
| shipping-companies      | `modules/shipping-companies/`      | บริษัทขนส่ง                         |
| rbac                    | `modules/rbac/`                    | การจัดการสิทธิ์                     |
| notifications           | `modules/notifications/`           | ระบบแจ้งเตือน                       |
| layout                  | `modules/layout/`                  | Components สำหรับ Layout            |

---

## 9. Changelog

| Date       | Version | Changes                                                                                                                                                   |
| ---------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-28 | 3.0.0   | Reworked AI context to align with the project-wide Module Architecture Contract and removed dependency on any single module as the architecture reference |
| 2026-02-24 | 2.0.0   | Major update: reflect modules/ architecture, updated paths, added module context                                                                          |
| 2026-02-09 | 1.2.0   | Updated sale status flow + scope alignment with notifications and forecast                                                                                |
| 2026-02-02 | 1.1.0   | Updated Tech Stack versions                                                                                                                               |
| 2026-01-28 | 1.0.0   | Initial documentation created                                                                                                                             |

---

**END OF DOCUMENT**
