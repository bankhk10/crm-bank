# Data Model - CRM System

> **Version**: 2.0.0  
> **Updated**: 2026-08-28  
> **Source of Truth**: `prisma/schema.prisma`  
> **Related**: [DOMAIN_GLOSSARY.md](./DOMAIN_GLOSSARY.md) | [AI_CONTEXT.md](./AI_CONTEXT.md) | [ARCHITECTURE.md](./ARCHITECTURE.md) | [MODULE_ARCHITECTURE.md](./MODULE_ARCHITECTURE.md)

---

## 1. Source of Truth

`prisma/schema.prisma` คือแหล่งข้อมูลหลักของโครงสร้างฐานข้อมูล

หากเอกสารนี้ขัดแย้งกับ:

- Models
- Fields
- Relations
- Enums
- Constraints
- Indexes

ใน `prisma/schema.prisma` ให้ถือ `prisma/schema.prisma` เป็นหลักเสมอ

เอกสารนี้เป็น **Data Model Snapshot / Context Document** เพื่อช่วยให้ Developer และ AI Agent เข้าใจภาพรวมของข้อมูล ไม่ใช่ตัวแทนของ Schema จริง

---

## 2. Entity Groups (High-Level)

### 2.1 Identity & Organization

- **User**: บัญชีสำหรับ login + session
- **Employee**: โปรไฟล์พนักงาน (ผูกกับ User)
- **Company**: บริษัท/สาขา
- **Department / Position**: โครงสร้างองค์กร
- **Role / Permission / UserRole / RolePermission / UserPermissionOverride**: RBAC

### 2.2 Customers & Credit

- **Customer**: ลูกค้า (มี hierarchy และพนักงานรับผิดชอบ)
- **CustomerImage**: รูปลูกค้า
- **CreditLimit**: วงเงินเครดิตถาวร
- **TemporaryCreditLimit**: วงเงินเครดิตชั่วคราว (มี request/approve)
- **PromotionalBudget / PromotionalBudgetDetail**: งบประมาณส่งเสริมการขายและการตลาดรายปี

### 2.3 Products & Inventory

- **Product**: สินค้า (ราคา/คะแนน/คุณสมบัติ)
- **ProductCategory / ProductGroupMaster**: โครงสร้างกลุ่มสินค้า
- **ProductStock / ProductStockLot**: สต็อกและ LOT
- **ProductImage / ProductFreeItem / ProductPromotionItem**: สื่อและโปรโมชั่นสินค้า
- **Plant / ChemicalGroup / Brand / Unit**: Master data ที่ช่วยจัดหมวดสินค้า

### 2.4 Sales & Fulfillment

- **Sale**: ใบขาย (สถานะ + การชำระเงิน + จัดส่ง)
- **SaleItem / SaleItemLot**: รายการสินค้าและ LOT ที่ใช้
- **SaleStatusHistory**: ประวัติสถานะใบขาย
- **ShippingCompany / CustomerShippingCompany**: บริษัทขนส่งที่ให้บริการลูกค้า
- **Shipment**: รายการจัดส่งสินค้า (รองรับ Split Shipment)

### 2.5 Points & Reporting

- **EmployeePointHistory / EmployeePointSummary**: สะสมคะแนนพนักงาน
- **DailySalesSummary**: สรุปยอดขายรายวัน
- **SalesTarget / SalesTargetItem**: เป้าหมายยอดขายรายเดือน
- **ProductSalesTarget / ProductGroupSalesTarget**: เป้าหมายตามสินค้า/กลุ่มสินค้า

### 2.6 System Logs & Notifications

- **Notification**: แจ้งเตือนผู้ใช้
- **AuditLog / SecurityLog**: บันทึกเหตุการณ์ระบบและความปลอดภัย

---

## 3. Key Enums (Snapshot)

> ⚠️ ค่าด้านล่างเป็น Snapshot เพื่อช่วยในการทำความเข้าใจเท่านั้น  
> ให้ตรวจสอบค่าล่าสุดจาก `prisma/schema.prisma` ก่อนเขียนหรือแก้ไข Code ที่เกี่ยวข้องกับ Enum เสมอ

### 3.1 SaleStatus

```text
Credit sales:
PENDING_APPROVAL → APPROVED → AWAITING_DELIVERY → DELIVERY_COMPLETED → COMPLETED

Prepaid sales:
PENDING_APPROVAL → APPROVED → AWAITING_DELIVERY (Wait for payment) → PAID
→ DELIVERY_COMPLETED → COMPLETED

Note:
AWAITING_DELIVERY can also go to PARTIALLY_DELIVERED if split shipment.

Alternative:
PENDING_APPROVAL → REJECTED / WAITING_FOR_CORRECTION
APPROVED / AWAITING_DELIVERY → CANCELLED / OVERDUE
```

### 3.2 PaymentTerm

- `CREDIT_90`
- `CASH_7` (ชำระเงินสด ไม่ลด (เครดิต 7 วัน ))
- `CASH_DISCOUNT_3_7` (ชำระเงินสด ลด 3% (เครดิต 7 วัน))
- `PREPAID`
- `CREDIT_OVER_90`

### 3.3 Customer & Credit

- `CustomerType`: DEALER, SUBDEALER, FARMER, BROKER
- `CustomerStatus`: ACTIVE, INACTIVE, SUSPENDED
- `CreditLimitStatus`: ACTIVE, SUSPENDED, EXPIRED
- `TemporaryCreditStatus`: PENDING, APPROVED, REJECTED, EXPIRED
- `PromotionalBudgetType`: SALES_PROMOTION, MARKETING

### 3.4 RBAC Access

- `DataAccessLevel`: VIEW_OWN, VIEW_TEAM, VIEW_DEPARTMENT, VIEW_ALL
- `EditAccessLevel`: EDIT_NONE, EDIT_OWN, EDIT_TEAM, EDIT_DEPARTMENT, EDIT_ALL
- `DeleteAccessLevel`: DELETE_NONE, DELETE_OWN, DELETE_TEAM, DELETE_DEPARTMENT, DELETE_ALL

### 3.5 Fulfillment

- `ShippingCompanyStatus`: ACTIVE, INACTIVE

---

## 4. Relationship Notes (Essentials)

These are high-level relationship notes only. Always verify the exact relation definitions in `prisma/schema.prisma`.

- **User ↔ Employee**: 1:1 optional (User มี employeeProfile)
- **Employee hierarchy**: Employee.managerId เป็น self-reference
- **Customer hierarchy**: Customer.parentDealerId เป็น self-reference
- **Sale** เชื่อมกับ Customer, Employee, User (createdBy/approvedBy)
- **SaleItem** เชื่อม Product และ Sale
- **ProductStock** เป็น 1:1 กับ Product, LOT อยู่ใน ProductStockLot
- **TemporaryCreditLimit** เชื่อมผู้ร้องขอ (requester) และผู้อนุมัติ (approver)

---

## 5. Data Ownership & Module Context

Database entities are implemented through business modules where applicable.

The module architecture defines responsibility boundaries:

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

General ownership principle:

- UI does not own database access.
- `server/` coordinates authenticated server operations.
- `application/` owns business rules and use-case orchestration.
- `infrastructure/` owns persistence/database access.
- `prisma/schema.prisma` owns the database schema definition.

Do not assume that the database model name alone determines which module should own business logic.

Use the module's domain responsibility and existing project conventions.

---

## 6. Soft Delete Convention

ตาราง/Entity ที่รองรับการลบควรใช้ `deletedAt` ตาม Project Standard

Typical pattern:

```prisma
deletedAt DateTime?
```

Meaning:

```text
deletedAt = null
    → Active

deletedAt = date
    → Deleted
```

For soft-deletable records:

- Queries should exclude deleted records when appropriate.
- Use `where: { deletedAt: null }` according to the established repository/query pattern.
- Do not hard delete records unless the domain and project architecture explicitly require it.
- Verify the actual schema before assuming that every table supports `deletedAt`.

---

## 7. Data Integrity

When changing the data model, consider:

- Required vs optional fields
- Unique constraints
- Foreign keys and relations
- Referential integrity
- Indexes
- Enum values
- Soft-delete behavior
- Transaction requirements

Do not add or modify schema elements based only on this document.

Always verify the current Prisma schema first.

---

## 8. AI Rules for Data Model Changes

Before modifying database-related code:

1. Read `prisma/schema.prisma`.
2. Read the relevant module documentation.
3. Identify existing relationships and constraints.
4. Search existing repositories and application logic.
5. Reuse existing data patterns where possible.
6. Do not duplicate existing entities or relationships without justification.
7. Verify Soft Delete behavior when applicable.
8. Use transactions when multiple related writes require atomicity.
9. Update relevant documentation when the data model meaningfully changes.
10. Validate the resulting schema and affected code.

If documentation conflicts with the current Prisma schema:

> **Trust `prisma/schema.prisma`.**

Do not silently rewrite the database model to match outdated documentation.

---

## 9. See Also

- [AI Context](./AI_CONTEXT.md)
- [Architecture](./ARCHITECTURE.md)
- [Module Architecture](./MODULE_ARCHITECTURE.md)
- [Domain Glossary](./DOMAIN_GLOSSARY.md)
- [Coding Standards](./CODING_STANDARDS.md)
