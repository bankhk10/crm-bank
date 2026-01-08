# API Logging Integration Guide

## สถานะการ Integrate Logging ในแต่ละ Route

### ✅ Routes ที่ Integrate แล้ว

| Route                         | Entity   | Actions | สถานะ |
| ----------------------------- | -------- | ------- | ----- |
| `/api/products/[productId]`   | Product  | UPDATE  | ✅    |
| `/api/sales/route.ts`         | Sale     | CREATE  | ✅    |
| `/api/sales/[id]/route.ts`    | Sale     | UPDATE  | ✅    |
| `/api/sales/[id]/approve`     | Sale     | APPROVE | ✅    |
| `/api/customers/[customerId]` | Customer | UPDATE  | ✅    |

### 🔄 Routes ที่ต้อง Integrate

| Route                                  | Entity               | Actions                         | Priority |
| -------------------------------------- | -------------------- | ------------------------------- | -------- |
| `/api/sales/[id]/reject`               | Sale                 | REJECT                          | สูง      |
| `/api/sales/[id]` (DELETE)             | Sale                 | DELETE                          | สูง      |
| `/api/products`                        | Product              | CREATE                          | ปานกลาง  |
| `/api/products/[productId]` (DELETE)   | Product              | DELETE                          | ปานกลาง  |
| `/api/customers/route.ts`              | Customer             | CREATE                          | ปานกลาง  |
| `/api/customers/[customerId]` (DELETE) | Customer             | DELETE                          | ปานกลาง  |
| `/api/credit-limits/*`                 | CreditLimit          | CREATE, UPDATE, DELETE          | ปานกลาง  |
| `/api/temporary-credit-limits/*`       | TemporaryCreditLimit | CREATE, UPDATE, DELETE, APPROVE | ปานกลาง  |
| `/api/rbac/*`                          | Role, Permission     | All CRUD                        | ต่ำ      |

---

## วิธี Integrate Logging ให้ Route ใหม่

### 1. เพิ่ม Imports

```typescript
import {
  createApiContext,
  createApiLogger,
  logCreate,
  logUpdate,
  logDelete,
  logApprove,
  logReject,
} from "@/lib/logger";
```

### 2. สร้าง Context และ Logger

```typescript
// หลังจาก authenticate แล้ว
const context = createApiContext(request, session.user);
const reqLogger = createApiLogger(context);
```

### 3. Log Actions

#### CREATE

```typescript
await logCreate(
  "EntityType", // e.g., "Sale", "Product", "Customer"
  entity.id,
  {
    // fields ที่ต้องการ log
    name: entity.name,
    status: entity.status,
  },
  context,
  {
    entityName: entity.name, // ชื่อที่แสดงใน Log Viewer
    module: "module-name", // e.g., "sales", "products"
  }
);
```

#### UPDATE

```typescript
await logUpdate(
  "EntityType",
  entity.id,
  {
    /* old values */
  },
  {
    /* new values */
  },
  context,
  { entityName, module, duration }
);
```

#### DELETE

```typescript
await logDelete(
  "EntityType",
  entity.id,
  {
    /* deleted entity data */
  },
  context,
  { entityName, module }
);
```

#### APPROVE / REJECT

```typescript
await logApprove("Sale", id, oldData, newData, context, options);
await logReject("Sale", id, oldData, newData, context, options);
```

---

## Pattern ที่ใช้ใน Project

### Sales (POST - Create)

```typescript
// หลังจาก create sale สำเร็จ
const context = createApiContext(request, session.user);
const reqLogger = createApiLogger(context);

await logCreate(
  "Sale",
  sale.id,
  {
    saleNumber: sale.saleNumber,
    customerId: sale.customerId,
    customerName: sale.customer?.name,
    status: sale.status,
    totalAmount: sale.totalAmount.toString(),
  },
  context,
  {
    entityName: sale.saleNumber,
    module: "sales",
  }
);

reqLogger.info("Sale created successfully", {
  module: "sales",
  metadata: { saleId: sale.id, saleNumber: sale.saleNumber },
});
```

### Products (PATCH - Update)

```typescript
const startTime = Date.now();
// ... auth และ validation ...

// Create context สำหรับ logging
const headersObj = Object.fromEntries(request.headers.entries());
const context: RequestContext = {
  requestId: generateRequestId(),
  userId: session.user.id,
  userEmail: session.user.email ?? undefined,
  userName: session.user.name ?? undefined,
  ipAddress: extractClientIp(headersObj),
  userAgent: extractUserAgent(headersObj),
  endpoint: "/api/products/[productId]",
  method: "PATCH",
};
const reqLogger = logger.child(context);

// Get existing (old value)
const existing = await db.product.findFirst({ where: { id: productId } });

// Log update action
reqLogger.info("Updating product", {
  module: "products",
  metadata: { productId, productCode: existing.productCode },
});

// Update product
const product = await db.product.update({ ... });

// Log audit
const duration = Date.now() - startTime;
await auditLogger.logUpdate(
  "Product",
  productId,
  { /* old values */ },
  { /* new values */ },
  context,
  { entityName: product.name, module: "products", duration }
);

reqLogger.info("Product updated successfully", {
  module: "products",
  duration,
  metadata: { productId, productCode: product.productCode },
});
```

---

## Entity Types ที่รองรับ

ดูรายการ Entity Types ที่รองรับได้ที่ `lib/logger/types.ts`:

```typescript
export type AuditableEntity =
  | "Sale"
  | "SaleItem"
  | "Customer"
  | "Product"
  | "CreditLimit"
  | "TemporaryCreditLimit"
  | "User"
  | "Role"
  | "Permission"
  | "Employee"
  | "Department"
  | "Position"
  | "Company"
  | "StockLot"
  | "System";
```

---

## Log Viewer

ไปที่ `/admin/logs` เพื่อดู:

- **Audit Logs**: การเปลี่ยนแปลงข้อมูลทั้งหมด (CREATE, UPDATE, DELETE, APPROVE, REJECT)
- **Security Logs**: Login/Logout, Permission changes
- **Application Logs**: Error logs, Debug logs

### Filter Options

- Entity Type (Sale, Product, Customer, etc.)
- Action (CREATE, UPDATE, DELETE, APPROVE, REJECT)
- User
- Date Range
