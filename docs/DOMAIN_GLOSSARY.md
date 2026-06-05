# Domain Glossary - CRM System

> **Version**: 1.1.0 | **Updated**: 2026-02-09  
> **Related**: [AI_CONTEXT.md](./AI_CONTEXT.md) | [DATA_MODEL.md](./DATA_MODEL.md)

---

## 1. Core Entities

### User
บัญชีสำหรับ authentication | Fields: `id`, `email`, `password`, `isActive`
- Unique: `email`
- Soft Delete: Yes (`deletedAt`)
- Related: Employee (1:1 optional), Role (N:N)

### Employee  
พนักงานบริษัท | Fields: `id`, `employeeCode`, `name`, `departmentId`, `managerId`
- Unique: `email`
- Hierarchy: `managerId` → self-reference
- Related: User (1:1), Department, Position, Manager

### Customer
ลูกค้า | Fields: `id`, `customerCode`, `customerType`, `name`, `status`
- Types: `DEALER` → `SUBDEALER` → `FARMER` (uses `farmPlots` JSON) / `BROKER`
- Unique: `customerCode`
- Related: CreditLimit, PromotionalBudget, ShippingCompany, Sale, parentDealer, responsibleEmployee

### Company
บริษัท | Fields: `id`, `name`, `companyCode`, `status`
- Related: Employee, Sale (pickupCompany)

### Product
สินค้า | Fields: `id`, `productCode`, `name`, `price`, `pointPerUnit`
- Unique: `productCode`
- Point: `pointPerUnit` × quantity = คะแนนพนักงาน
- Related: ProductStock (1:1), SaleItem (1:N)

### Sale
ใบขาย | Fields: `id`, `saleNumber`, `customerId`, `employeeId`, `status`, `totalAmount`
- Unique: `saleNumber`
- Related: Customer, Employee, SaleItem[], StatusHistory[]

### PromotionalBudget
งบโปรโมชั่น | Fields: `id`, `customerId`, `year`, `salesPromotionLimit`, `marketingLimit`
- Related: Customer, PromotionalBudgetDetail[]

### ShippingCompany
บริษัทขนส่ง | Fields: `id`, `name`, `status`
- Related: CustomerShippingCompany[], Sale[], Shipment[]

---

## 2. Status Definitions

### Sale Status Flow
```
PENDING → PENDING_APPROVAL → APPROVED → AWAITING_PAYMENT → PAID → AWAITING_DELIVERY
→ DELIVERED → DELIVERY_COMPLETED → COMPLETED
(Note: AWAITING_DELIVERY can also go to PARTIALLY_DELIVERED if split shipment)

Alternative:
- PENDING_APPROVAL → REJECTED
- PENDING_APPROVAL → WAITING_FOR_CORRECTION  
- APPROVED → CANCELLED / EXPIRED / OVERDUE
```

| Status | Thai | Next Action |
|--------|------|-------------|
| PENDING | รอดำเนินการ | Submit |
| PENDING_APPROVAL | รออนุมัติ | Approve/Reject |
| APPROVED | อนุมัติแล้ว | Deliver |
| REJECTED | ไม่อนุมัติ | Terminal |
| AWAITING_PAYMENT | รอชำระเงิน | Confirm payment |
| PAID | ชำระเงินแล้ว | Deliver |
| AWAITING_DELIVERY | รอจัดส่ง | Mark delivered |
| DELIVERED | ระหว่างขนส่ง | Confirm |
| PARTIALLY_DELIVERED | ส่งบางส่วนแล้ว | Confirm rest of shipments |
| DELIVERY_COMPLETED | ส่งเสร็จแล้ว | Complete |
| COMPLETED | เสร็จสิ้น | Terminal |
| CANCELLED | ยกเลิก | Terminal |
| EXPIRED | หมดอายุ | Terminal (ไม่ระบุวันส่ง 3 วัน) |
| OVERDUE | เลยกำหนด | Terminal (แก้วันส่ง >3 ครั้ง) |

### Customer Status
| Status | Meaning | Can Order? |
|--------|---------|------------|
| ACTIVE | ใช้งานปกติ | ✅ |
| INACTIVE | ไม่ใช้งาน | ❌ |
| SUSPENDED | ระงับ | ❌ |

### Credit Status
| Status | Meaning | Can Use? |
|--------|---------|----------|
| ACTIVE | ใช้งานได้ | ✅ |
| SUSPENDED | ระงับ | ❌ |
| EXPIRED | หมดอายุ | ❌ |

---

## 3. Payment Terms

| Term | Thai | Credit Days |
|------|------|-------------|
| CREDIT_90 | เครดิต 90 วัน | 90 |
| CASH_7 | เงินสด 7 วัน | 7 |
| PREPAID | โอนก่อนส่ง | 0 |
| CREDIT_OVER_90 | เครดิต >90 (Admin only) | >90 |

---

## 4. KPI Formulas

### Sales KPIs
- **Total Sales**: `SUM(Sale.totalAmount) WHERE status=COMPLETED`
- **AOV**: `Total Sales / Order Count`
- **Target %**: `(Actual / Target) × 100`

### Employee KPIs
- **Total Points**: `SUM(EmployeePointHistory.totalPoints)`
- **Units Sold**: `SUM(SaleItem.quantity)`

### Customer KPIs
- **Credit Utilization**: `usedAmount / limitAmount × 100`

---

## 5. Business Rules

### Credit Rules
```
availableAmount = limitAmount + promoAmount + tempCredit - usedAmount

BEFORE create Sale:
- Check creditLimit.status = ACTIVE
- Check availableAmount >= totalAmount
```

### Point Rules
```
Points calculated per SaleItem (not Sale):
  points = quantity × product.pointPerUnit

Only COMPLETED sales count for points
Unique constraint: one SaleItem = one PointHistory
```

### Sale Rules
```
- maxDeliveryUpdates = 3 (แก้เกิน = OVERDUE)
- orderExpiryDate = approvedAt + 3 วัน
- ไม่ระบุ deliveryDate ภายใน 3 วัน = EXPIRED
```

---

## 6. Uniqueness Constraints

| Entity | Unique Field(s) |
|--------|-----------------|
| User | email |
| Customer | customerCode |
| Product | productCode |
| Employee | email |
| Department | code |
| Role | slug |
| Permission | key |
| DailySalesSummary | (date, customerId, employeeId, productId) |

---

## 7. Thailand Geography

### Regions (ภาค)
- ภาคเหนือ (Northern)
- ภาคอีสาน (Northeastern)  
- ภาคกลาง (Central)
- ภาคตะวันออก (Eastern)
- ภาคตะวันตก (Western)
- ภาคใต้ (Southern)

### Address Hierarchy
`province → district → subdistrict → postalCode → addressLine`

---

**See Also**: [AI_CONTEXT.md](./AI_CONTEXT.md) | [DATA_MODEL.md](./DATA_MODEL.md)
