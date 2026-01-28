# Data Model - CRM System

> **Version**: 1.0.0 | **Updated**: 2026-01-28  
> **Source of Truth**: `prisma/schema.prisma`  
> **Related**: [DOMAIN_GLOSSARY.md](./DOMAIN_GLOSSARY.md) | [AI_CONTEXT.md](./AI_CONTEXT.md)

---

## 1. Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          ORGANIZATION STRUCTURE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────┐     ┌────────────┐     ┌──────────┐     ┌──────────┐         │
│  │Department│────▶│  Position  │     │   Role   │────▶│Permission│         │
│  └────┬─────┘     └─────┬──────┘     └────┬─────┘     └──────────┘         │
│       │                 │                 │                                 │
│       │ 1:N             │ 1:N             │ N:N (RolePermission)            │
│       ▼                 ▼                 ▼                                 │
│  ┌──────────────────────────────────────────────────────┐                  │
│  │                      USER                             │                  │
│  │  id, email, password, isActive                        │                  │
│  └────────────────────────┬─────────────────────────────┘                  │
│                           │ 1:1 (optional)                                  │
│                           ▼                                                 │
│  ┌──────────────────────────────────────────────────────┐                  │
│  │                    EMPLOYEE                           │                  │
│  │  id, employeeCode, name, departmentId, managerId      │                  │
│  │  (self-reference: manager → reports)                  │                  │
│  └──────────────────────────────────────────────────────┘                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                          CUSTOMER & CREDIT                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────────────────────────────┐                  │
│  │                    CUSTOMER                           │                  │
│  │  id, customerCode, customerType, name, status         │                  │
│  │  parentDealerId (self-ref), responsibleEmployeeId     │                  │
│  └────────────────────────┬─────────────────────────────┘                  │
│                           │                                                 │
│          ┌────────────────┼────────────────┐                               │
│          │ 1:N            │ 1:N            │                               │
│          ▼                ▼                ▼                               │
│  ┌─────────────┐  ┌─────────────────┐  ┌───────────┐                       │
│  │ CreditLimit │  │TemporaryCreditLimit│ │   Sale    │                       │
│  └─────────────┘  └─────────────────┘  └───────────┘                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                          PRODUCT & STOCK                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────────────────────────────┐                  │
│  │                    PRODUCT                            │                  │
│  │  id, productCode, name, price, pointPerUnit           │                  │
│  └────────────────────────┬─────────────────────────────┘                  │
│                           │                                                 │
│          ┌────────────────┼────────────────┐                               │
│          │ 1:1            │ 1:N            │                               │
│          ▼                ▼                ▼                               │
│  ┌─────────────┐  ┌────────────────┐  ┌──────────────┐                     │
│  │ProductStock │  │ProductStockLot │  │ProductImage  │                     │
│  └─────────────┘  └───────┬────────┘  └──────────────┘                     │
│                           │ 1:N                                             │
│                           ▼                                                 │
│                    ┌────────────┐                                           │
│                    │SaleItemLot │                                           │
│                    └────────────┘                                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                          SALES & POINTS                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────────────────────────────┐                  │
│  │                      SALE                             │                  │
│  │  id, saleNumber, customerId, employeeId, status       │                  │
│  │  paymentTerm, totalAmount                             │                  │
│  └────────────────────────┬─────────────────────────────┘                  │
│                           │                                                 │
│          ┌────────────────┼────────────────┐                               │
│          │ 1:N            │ 1:N            │                               │
│          ▼                ▼                ▼                               │
│  ┌─────────────┐  ┌─────────────────┐  ┌────────────────────┐              │
│  │  SaleItem   │  │SaleStatusHistory│  │EmployeePointHistory│              │
│  └──────┬──────┘  └─────────────────┘  └────────────────────┘              │
│         │ 1:1                                                               │
│         ▼                                                                   │
│  ┌──────────────────────┐                                                  │
│  │EmployeePointHistory  │──────────▶ EmployeePointSummary                  │
│  └──────────────────────┘                                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Tables

### 2.1 User
```prisma
model User {
  id           String    @id @default(cuid())
  email        String    @unique
  password     String
  isActive     Boolean   @default(true)
  departmentId String?
  positionId   String?
  deletedAt    DateTime?
  
  // Relations
  employeeProfile Employee?
  userRoles       UserRole[]
  permissionOverrides UserPermissionOverride[]
}
```

### 2.2 Employee
```prisma
model Employee {
  id           String    @id @default(cuid())
  employeeCode String?
  name         String
  email        String    @unique
  departmentId String?
  positionId   String?
  managerId    String?   // Self-reference for hierarchy
  userId       String?   @unique
  deletedAt    DateTime?
  
  // Relations
  user       User?          @relation(fields: [userId])
  manager    Employee?      @relation("EmployeeHierarchy", fields: [managerId])
  reports    Employee[]     @relation("EmployeeHierarchy")
  sales      Sale[]
  pointSummary EmployeePointSummary?
}
```

### 2.3 Customer
```prisma
model Customer {
  id           String         @id @default(cuid())
  customerCode String         @unique
  customerType CustomerType   // DEALER, SUBDEALER, FARMER, BROKER
  name         String
  status       CustomerStatus @default(ACTIVE)
  region       String?
  parentDealerId String?      // Self-reference for hierarchy
  responsibleEmployeeId String?
  deletedAt    DateTime?
  
  // Relations
  parentDealer        Customer?      @relation("ParentDealer", fields: [parentDealerId])
  subDealers          Customer[]     @relation("ParentDealer")
  responsibleEmployee Employee?
  creditLimits        CreditLimit[]
  sales               Sale[]
}

enum CustomerType { DEALER, SUBDEALER, FARMER, BROKER }
enum CustomerStatus { ACTIVE, INACTIVE, SUSPENDED }
```

### 2.4 Product
```prisma
model Product {
  id           String        @id @default(cuid())
  productCode  String        @unique
  name         String
  price        Decimal?      @db.Decimal(15, 2)
  pointPerUnit Int           @default(0)
  status       ProductStatus @default(ACTIVE)
  deletedAt    DateTime?
  
  // Relations
  stock        ProductStock?
  stockLots    ProductStockLot[]
  saleItems    SaleItem[]
}

enum ProductStatus { ACTIVE, INACTIVE }
```

### 2.5 Sale
```prisma
model Sale {
  id          String      @id @default(cuid())
  saleNumber  String      @unique
  customerId  String
  employeeId  String
  status      SaleStatus  @default(PENDING)
  paymentTerm PaymentTerm
  totalAmount Decimal     @db.Decimal(15, 2)
  
  // Delivery tracking
  deliveryUpdateCount Int  @default(0)
  maxDeliveryUpdates  Int  @default(3)
  isDeliveryLocked    Boolean @default(false)
  orderExpiryDate     DateTime?
  
  // Approval
  approvedById String?
  approvedAt   DateTime?
  
  // Audit
  createdById String
  createdAt   DateTime @default(now())
  deletedAt   DateTime?
  
  // Relations
  customer      Customer
  employee      Employee
  items         SaleItem[]
  statusHistory SaleStatusHistory[]
  pointHistories EmployeePointHistory[]
}

enum SaleStatus {
  PENDING, PENDING_APPROVAL, APPROVED, REJECTED
  AWAITING_PAYMENT, PAID, AWAITING_DELIVERY
  DELIVERED, DELIVERY_COMPLETED, COMPLETED
  EXPIRED, OVERDUE, WAITING_FOR_CORRECTION, CANCELLED
}

enum PaymentTerm {
  CREDIT_90, CASH_7, PREPAID, CREDIT_OVER_90
}
```

---

## 3. Relationship Summary

| From | To | Type | Description |
|------|----|------|-------------|
| User | Employee | 1:1 | Optional profile |
| User | Role | N:N | Via UserRole |
| User | Permission | N:N | Via UserPermissionOverride |
| Employee | Employee | N:1 | manager/reports hierarchy |
| Employee | Department | N:1 | Organization |
| Customer | Customer | N:1 | parentDealer hierarchy |
| Customer | Employee | N:1 | responsibleEmployee |
| Customer | CreditLimit | 1:N | Credit management |
| Customer | Sale | 1:N | Orders |
| Product | ProductStock | 1:1 | Stock tracking |
| Product | SaleItem | 1:N | Order items |
| Sale | SaleItem | 1:N | Line items |
| Sale | StatusHistory | 1:N | Status changes |
| SaleItem | PointHistory | 1:1 | Points calculation |

---

## 4. Constraints & Indexes

### Unique Constraints
```prisma
@@unique([roleId, permissionId])          // RolePermission
@@unique([userId, roleId])                 // UserRole  
@@unique([userId, permissionId])           // UserPermissionOverride
@@unique([saleItemId])                     // EmployeePointHistory
@@unique([date, customerId, employeeId, productId]) // DailySalesSummary
```

### Important Indexes
```prisma
@@index([userId, timestamp])               // AuditLog
@@index([customerId, saleDate])            // Sale
@@index([employeeId, saleDate])            // Sale
@@index([year, customerId])                // DailySalesSummary
@@index([year, employeeId])                // DailySalesSummary
```

---

## 5. Soft Delete Pattern

All major entities use `deletedAt` for soft deletion:
```prisma
model Entity {
  deletedAt DateTime?
}

// Query pattern - always filter
await prisma.entity.findMany({
  where: { deletedAt: null }
});
```

---

## 6. Key Formulas

### Credit Available
```
availableAmount = limitAmount + promoAmount + temporaryCreditAmount - usedAmount
```

### Employee Points
```
For each SaleItem in COMPLETED Sale:
  totalPoints += quantity × product.pointPerUnit
```

### Stock
```
availableQuantity = physicalBalance - reservedQuantity
```

---

**See Also**: [DOMAIN_GLOSSARY.md](./DOMAIN_GLOSSARY.md) | [API_CONTRACTS.md](./API_CONTRACTS.md)
