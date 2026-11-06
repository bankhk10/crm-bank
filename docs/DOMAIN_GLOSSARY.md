# Domain Glossary - CRM System

> **Version**: 2.0.0  
> **Updated**: 2026-08-28  
> **Related**: [AI_CONTEXT.md](./AI_CONTEXT.md) | [DATA_MODEL.md](./DATA_MODEL.md) | [ARCHITECTURE.md](./ARCHITECTURE.md) | [MODULE_ARCHITECTURE.md](./MODULE_ARCHITECTURE.md)

---

## 1. Purpose

เอกสารนี้เป็น Glossary สำหรับคำศัพท์และ Business Concepts ของระบบ CRM

ใช้เพื่อให้ Developer และ AI Agent ใช้คำศัพท์และความหมายเดียวกันทั่วทั้งโปรเจกต์

เอกสารนี้อธิบาย **Domain Meaning** และ Business Rules ที่สำคัญ

สำหรับโครงสร้างฐานข้อมูลจริง ให้ตรวจสอบ:

```text
prisma/schema.prisma
```

สำหรับสถาปัตยกรรม Module ให้ตรวจสอบ:

```text
docs/MODULE_ARCHITECTURE.md
```

หากข้อมูลในเอกสารนี้ขัดแย้งกับ Database Schema จริง ให้ตรวจสอบ `prisma/schema.prisma` ก่อนเสมอ

---

# 2. Core Entities

## User

บัญชีสำหรับ authentication

Common fields:

```text
id
email
password
isActive
```

Rules:

- `email` ต้อง unique ตาม schema
- รองรับ `deletedAt` หากกำหนดไว้ใน schema
- อาจมีความสัมพันธ์กับ Employee
- มีความสัมพันธ์กับ Role / Permission ตาม RBAC

---

## Employee

พนักงานบริษัท

Common concepts:

```text
employeeCode
name
departmentId
managerId
```

Rules:

- Employee สามารถมีผู้บังคับบัญชาแบบ self-reference ผ่าน `managerId`
- Employee สามารถเชื่อมโยงกับ User
- รายละเอียด field จริงให้ตรวจสอบจาก `prisma/schema.prisma`

---

## Customer

ลูกค้า เช่น ร้านค้า เกษตรกร หรือคู่ค้าที่อยู่ใน Customer Hierarchy

Common concepts:

```text
customerCode
customerType
name
status
```

Customer Types:

```text
DEALER
SUBDEALER
FARMER
BROKER
```

Rules:

- `customerCode` ต้อง unique ตาม schema
- Customer อาจมี hierarchy ผ่าน `parentDealerId`
- Customer อาจมี Employee ที่รับผิดชอบ
- Customer สามารถเกี่ยวข้องกับ Credit, Promotion, Shipping และ Sales

---

## Company

บริษัทหรือหน่วยงานที่เกี่ยวข้องกับระบบ

Common concepts:

```text
name
companyCode
status
```

อาจเกี่ยวข้องกับ:

- Employee
- Sale / Pickup Company
- องค์กรหรือโครงสร้างบริษัทตาม Domain

รายละเอียดความสัมพันธ์จริงให้ตรวจสอบจาก `prisma/schema.prisma`

---

## Product

สินค้าที่ระบบใช้สำหรับการขาย

Common concepts:

```text
productCode
name
price
pointPerUnit
```

Rules:

- `productCode` ต้อง unique ตาม schema
- `pointPerUnit × quantity` ใช้สำหรับการคำนวณคะแนนในกรณีที่ Point Rule กำหนดไว้
- Product สามารถมี Stock, LOT, Category, Brand, Unit และข้อมูลอื่นตาม schema

---

## Sale

ใบขาย / คำสั่งซื้อจากลูกค้า

Common concepts:

```text
saleNumber
customerId
employeeId
status
totalAmount
```

Rules:

- `saleNumber` ต้อง unique ตาม schema
- เชื่อมกับ Customer
- เชื่อมกับ Employee
- มี Sale Items
- มี Status History
- กระบวนการขายต้องปฏิบัติตาม Sale Status Flow

---

## PromotionalBudget

งบประมาณส่งเสริมการขายและการตลาด

Common concepts:

```text
customerId
year
salesPromotionLimit
marketingLimit
```

อาจมีรายละเอียดผ่าน `PromotionalBudgetDetail`

---

## ShippingCompany

บริษัทขนส่ง

Common concepts:

```text
name
status
```

สามารถเกี่ยวข้องกับ:

- CustomerShippingCompany
- Sale
- Shipment

---

# 3. Status Definitions

## 3.1 Sale Status Flow

### Credit Sales

```text
PENDING_APPROVAL
    ↓
APPROVED
    ↓
AWAITING_DELIVERY
    ↓
DELIVERY_COMPLETED
    ↓
COMPLETED
```

### Prepaid Sales

```text
PENDING_APPROVAL
    ↓
APPROVED
    ↓
AWAITING_DELIVERY
    ↓
PAID
    ↓
DELIVERY_COMPLETED
    ↓
COMPLETED
```

### Alternative Paths

```text
PENDING_APPROVAL
    ├── REJECTED
    └── WAITING_FOR_CORRECTION

APPROVED / AWAITING_DELIVERY
    └── CANCELLED

APPROVED / AWAITING_DELIVERY / PARTIALLY_DELIVERED / DELIVERY_COMPLETED
    └── OVERDUE
```

หมายเหตุ:

- `AWAITING_DELIVERY` สามารถนำไปสู่ `PARTIALLY_DELIVERED` เมื่อมีการ Split Shipment
- กฎ Auto-expiry และ `creditDueDate` ต้องตรวจสอบกับ Business Logic จริงในโปรเจกต์

### Status Meaning

| Status                | Thai           | Meaning                        |
| --------------------- | -------------- | ------------------------------ |
| `PENDING_APPROVAL`    | รออนุมัติ      | รอผู้มีสิทธิ์อนุมัติ           |
| `APPROVED`            | อนุมัติแล้ว    | ใบขายได้รับอนุมัติ             |
| `REJECTED`            | ไม่อนุมัติ     | สิ้นสุดด้วยการปฏิเสธ           |
| `PAID`                | ชำระเงินแล้ว   | ได้รับชำระเงินตามเงื่อนไข      |
| `AWAITING_DELIVERY`   | รอจัดส่ง       | พร้อมเข้าสู่กระบวนการจัดส่ง    |
| `PARTIALLY_DELIVERED` | ส่งบางส่วนแล้ว | มีการจัดส่งเพียงบางส่วน        |
| `DELIVERY_COMPLETED`  | ส่งเสร็จแล้ว   | การจัดส่งเสร็จสมบูรณ์          |
| `COMPLETED`           | เสร็จสิ้น      | กระบวนการเสร็จสมบูรณ์          |
| `CANCELLED`           | ยกเลิก         | กระบวนการถูกยกเลิก             |
| `OVERDUE`             | เลยกำหนดชำระ   | เกินกำหนดชำระตาม Business Rule |

---

## 3.2 Customer Status

| Status      | Meaning    | Can Order? |
| ----------- | ---------- | ---------- |
| `ACTIVE`    | ใช้งานปกติ | ✅         |
| `INACTIVE`  | ไม่ใช้งาน  | ❌         |
| `SUSPENDED` | ระงับ      | ❌         |

---

## 3.3 Credit Status

| Status      | Meaning   | Can Use? |
| ----------- | --------- | -------- |
| `ACTIVE`    | ใช้งานได้ | ✅       |
| `SUSPENDED` | ระงับ     | ❌       |
| `EXPIRED`   | หมดอายุ   | ❌       |

---

# 4. Payment Terms

| Term                | Thai                    | Credit Days |
| ------------------- | ----------------------- | ----------: |
| `PREPAID`           | ชำระเงินก่อน            |           0 |
| `CASH_7`            | เงินสด ไม่ลด 7 วัน      |           7 |
| `CASH_DISCOUNT_3_7` | เงินสด ลด 3% 7 วัน      |           7 |
| `CREDIT_90`         | เครดิต 90 วัน           |          90 |
| `CREDIT_OVER_90`    | เครดิต >90 (Admin only) |         >90 |

> ตรวจสอบค่า Enum ล่าสุดจาก `prisma/schema.prisma` ก่อนใช้ใน Code

---

# 5. KPI Definitions

## Sales KPIs

### Total Sales

```text
SUM(Sale.totalAmount)
WHERE status = COMPLETED
```

### AOV

```text
Total Sales / Order Count
```

### Target %

```text
(Actual / Target) × 100
```

---

## Employee KPIs

### Total Points

```text
SUM(EmployeePointHistory.totalPoints)
```

### Units Sold

```text
SUM(SaleItem.quantity)
```

---

## Customer KPIs

### Credit Utilization

```text
usedAmount / limitAmount × 100
```

> KPI formulas are domain definitions. Verify the implementing query and current business rules before changing reporting code.

---

# 6. Business Rules

## 6.1 Credit Rules

Current business concept:

```text
availableAmount =
    limitAmount
    + promoAmount
    + tempCredit
    - usedAmount
```

Before creating a Sale, the system should evaluate the applicable credit rules, including:

```text
creditLimit.status = ACTIVE
availableAmount >= totalAmount
```

The exact source and calculation of each amount must be verified against the current application logic and schema.

---

## 6.2 Point Rules

Points are calculated per `SaleItem`, not directly from the Sale total.

Concept:

```text
points =
    quantity × product.pointPerUnit
```

Current rule:

```text
Only COMPLETED sales count for points
```

Any uniqueness rule connecting SaleItem and PointHistory must be verified against the current schema and implementation.

---

## 6.3 Sale Rules

Current domain concepts include:

```text
creditDueDate
orderExpiryDate
approvedAt
deliveryDate
```

Business rules include:

- A sale can become `OVERDUE` when the applicable credit due date has passed without payment.
- An approved sale may be automatically cancelled when the configured delivery-date requirement is not satisfied within the configured expiry period.
- Exact expiry behavior must be verified against the current application logic before changing it.

---

# 7. Uniqueness Concepts

Known unique concepts include:

| Entity            | Unique Field(s)                             |
| ----------------- | ------------------------------------------- |
| User              | `email`                                     |
| Customer          | `customerCode`                              |
| Product           | `productCode`                               |
| Employee          | `email`                                     |
| Department        | `code`                                      |
| Role              | `slug`                                      |
| Permission        | `key`                                       |
| DailySalesSummary | `(date, customerId, employeeId, productId)` |

Always verify the actual unique constraints in:

```text
prisma/schema.prisma
```

before adding or modifying uniqueness checks.

---

# 8. Geographic Terminology

## Thailand Regions

```text
ภาคเหนือ (Northern)
ภาคอีสาน (Northeastern)
ภาคกลาง (Central)
ภาคตะวันออก (Eastern)
ภาคตะวันตก (Western)
ภาคใต้ (Southern)
```

## Address Hierarchy

```text
province
    ↓
district
    ↓
subdistrict
    ↓
postalCode
    ↓
addressLine
```

Use the project's established Thai address terminology consistently.

---

# 9. Domain Relationships

High-level relationships currently include:

```text
User
  ↕
Employee
  ↓
Department / Position

Employee
  ↕ managerId
Employee

Customer
  ↕ parentDealerId
Customer

Customer
  ↓
Sale
  ↓
SaleItem
  ↓
Product

Product
  ↓
ProductStock
  ↓
ProductStockLot

Customer
  ↓
CreditLimit / TemporaryCreditLimit

Customer
  ↓
Shipping / Shipment
```

These are conceptual relationships.

For exact cardinality, foreign keys, optionality, and relation names, use `prisma/schema.prisma`.

---

# 10. Domain Ownership and Module Boundaries

Domain concepts are implemented through business modules where applicable.

The module architecture is:

```text
features/
    ↓
server/
    ↓
application/
    ↓
infrastructure/
    ↓
database
```

General principle:

- The module owns the business behavior of its domain.
- Application logic belongs to the module's `application/`.
- Database persistence belongs to the module's `infrastructure/`.
- UI belongs to `features/` and module `ui/`.
- Global/shared concepts should not be duplicated across modules without justification.

Do not assume that an entity name alone determines module ownership.

Use the actual domain responsibility and current architecture.

---

# 11. AI Usage Rules

When an AI Agent is working with domain concepts:

1. Use this document for terminology and business meaning.
2. Check `prisma/schema.prisma` for the actual data model.
3. Check `docs/MODULE_ARCHITECTURE.md` for module boundaries and layer responsibilities.
4. Check `docs/CODING_STANDARDS.md` for implementation conventions.
5. Check current application code when verifying actual behavior.
6. Check relevant module documentation when working on a specific module.
7. Do not invent business rules that are not documented or implemented.
8. When documentation and implementation disagree, investigate the conflict before changing behavior.

For database facts:

> Trust `prisma/schema.prisma`.

For actual implemented behavior:

> Verify the current application code.

For architectural structure:

> Follow `docs/MODULE_ARCHITECTURE.md`.

For coding conventions:

> Follow `docs/CODING_STANDARDS.md`.

---

# 12. Change Management

When a domain rule changes:

1. Identify affected modules.
2. Identify affected database models.
3. Identify affected application logic.
4. Identify affected UI and workflows.
5. Update the relevant domain documentation.
6. Update tests when behavior changes.
7. Verify dependent modules.

Do not update only the Glossary while leaving the actual implementation or related documentation inconsistent.

---

# 13. Source of Truth

Use the following sources according to their responsibility:

```text
Database Structure
    → prisma/schema.prisma

System Architecture
    → docs/ARCHITECTURE.md

Module Architecture
    → docs/MODULE_ARCHITECTURE.md

Coding Standards
    → docs/CODING_STANDARDS.md

AI Execution Rules
    → .agents/skills/crm-coding-standards/SKILL.md

Domain Terminology / Business Context
    → docs/DOMAIN_GLOSSARY.md

Actual Runtime Behavior
    → Current source code
```

If these sources conflict:

1. Identify what kind of fact is being requested.
2. Use the appropriate source above.
3. Do not silently invent or overwrite a rule.
4. Report unresolved conflicts when they affect implementation decisions.

---

# 14. See Also

- [AI Context](./AI_CONTEXT.md)
- [Architecture](./ARCHITECTURE.md)
- [Module Architecture](./MODULE_ARCHITECTURE.md)
- [Data Model](./DATA_MODEL.md)
- [Coding Standards](./CODING_STANDARDS.md)
