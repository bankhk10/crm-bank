# Data Model - CRM System

> **Version**: 1.1.0 | **Updated**: 2026-02-09  
> **Source of Truth**: `prisma/schema.prisma`  
> **Related**: [DOMAIN_GLOSSARY.md](./DOMAIN_GLOSSARY.md) | [AI_CONTEXT.md](./AI_CONTEXT.md)

---

## 1. Source of Truth

`prisma/schema.prisma` คือแหล่งข้อมูลหลักของโครงสร้างฐานข้อมูล หากเอกสารนี้ขัดแย้งกับ schema ให้ถือ schema เป็นหลักเสมอ

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

> ตรวจสอบค่าล่าสุดจาก `prisma/schema.prisma`

### 3.1 SaleStatus

```
PENDING → PENDING_APPROVAL → APPROVED → AWAITING_PAYMENT → PAID
→ AWAITING_DELIVERY → DELIVERED → DELIVERY_COMPLETED → COMPLETED
(Note: AWAITING_DELIVERY can also go to PARTIALLY_DELIVERED if split shipment)

Alternative:
- PENDING_APPROVAL → REJECTED / WAITING_FOR_CORRECTION
- APPROVED → CANCELLED / EXPIRED / OVERDUE
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

### 3.5 Fulfillment

- `ShippingCompanyStatus`: ACTIVE, INACTIVE

### 3.4 RBAC Access

- `DataAccessLevel`: VIEW_OWN,VIEW_TEAM, VIEW_DEPARTMENT, VIEW_ALL
- `EditAccessLevel`: EDIT_NONE, EDIT_OWN, EDIT_TEAM, EDIT_DEPARTMENT, EDIT_ALL
- `DeleteAccessLevel`: DELETE_NONE, DELETE_OWN, DELETE_TEAM, DELETE_DEPARTMENT, DELETE_ALL

---

## 4. Relationship Notes (Essentials)

- **User ↔ Employee**: 1:1 optional (User มี employeeProfile)
- **Employee hierarchy**: Employee.managerId เป็น self-reference
- **Customer hierarchy**: Customer.parentDealerId เป็น self-reference
- **Sale** เชื่อมกับ Customer, Employee, User (createdBy/approvedBy)
- **SaleItem** เชื่อม Product และ Sale
- **ProductStock** เป็น 1:1 กับ Product, LOT อยู่ใน ProductStockLot
- **TemporaryCreditLimit** เชื่อมผู้ร้องขอ (requester) และผู้อนุมัติ (approver)

---

## 5. Soft Delete Convention

ตารางหลักส่วนใหญ่มี `deletedAt` เพื่อ soft delete

- Query ต้องกรอง `deletedAt: null`
- ห้าม hard delete เว้นแต่เป็น master data ที่ไม่ได้ใช้งาน

---

**See Also**: [AI_CONTEXT.md](./AI_CONTEXT.md) | [ARCHITECTURE.md](./ARCHITECTURE.md)
