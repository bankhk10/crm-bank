# 📋 Logging System Documentation

## ภาพรวม

ระบบ Logging สำหรับ CRM Bank ประกอบด้วย 3 ส่วนหลัก:

1. **Application Logger** - สำหรับ debug และ error tracking
2. **Audit Logger** - สำหรับติดตามการเปลี่ยนแปลงข้อมูลสำคัญ
3. **Security Logger** - สำหรับ security events

---

## 🚀 Quick Start

### 1. Generate Prisma Client

```bash
npx prisma generate
```

### 2. Run Database Migration

```bash
npx prisma db push
# หรือ
npx prisma migrate dev --name add-logging-system
```

### 3. ใช้งาน Logger

```typescript
import { logger, auditLogger, securityLogger } from "@/lib/logger";

// Application Logging
logger.info("User created successfully");
logger.error("Failed to process payment", error);

// Audit Logging
await auditLogger.logCreate("Sale", sale.id, sale, context);

// Security Logging
await securityLogger.logLoginSuccess(userId, email, name, ipAddress);
```

---

## 📖 Usage Examples

### Application Logger

```typescript
import { logger } from "@/lib/logger";

// Basic logging
logger.debug("Processing request...");
logger.info("Order placed successfully", { metadata: { orderId: "123" } });
logger.warn("Low stock warning", { metadata: { productId: "456", stock: 5 } });
logger.error("Payment failed", error, { module: "payments" });
logger.fatal("Database connection lost", error);

// With timing
const endTimer = logger.time("Database query");
// ... do work
endTimer(); // Logs: "Database query completed (150ms)"

// Wrapped async function with timing
const result = await logger.timed("Fetch user data", async () => {
  return await db.user.findMany();
});

// Child logger with context
const reqLogger = logger.child({
  requestId: "req_123",
  userId: "user_456",
});
reqLogger.info("Processing order"); // Includes context automatically
```

### Audit Logger

```typescript
import { auditLogger } from "@/lib/logger";
import { createRequestContext } from "@/lib/logger/middleware";

// Create context from request
const context = createRequestContext(
  request,
  session?.user?.id,
  session?.user?.email
);

// Log CREATE action
await auditLogger.logCreate(
  "Sale", // entityType
  sale.id, // entityId
  sale, // newValue (will be masked)
  context,
  { entityName: sale.saleNumber, module: "sales" }
);

// Log UPDATE action
await auditLogger.logUpdate(
  "Customer",
  customer.id,
  oldCustomer, // oldValue
  newCustomer, // newValue
  context,
  { entityName: customer.name, module: "customers" }
);

// Log DELETE action
await auditLogger.logDelete(
  "Product",
  product.id,
  product, // oldValue
  context,
  { entityName: product.name, module: "products" }
);

// Log APPROVE action
await auditLogger.logApprove("Sale", sale.id, oldSale, approvedSale, context, {
  entityName: sale.saleNumber,
  module: "sales",
});

// Log VIEW action (for sensitive data)
await auditLogger.logView("CreditLimit", creditLimit.id, context, {
  entityName: customer.name,
  module: "credit",
});

// Log EXPORT action
await auditLogger.logExport("Customer", context, {
  recordCount: 1500,
  exportFormat: "xlsx",
  filters: { status: "ACTIVE" },
  module: "customers",
});
```

### Security Logger

```typescript
import { securityLogger } from "@/lib/logger";

// Login events
await securityLogger.logLoginSuccess(userId, email, name, ipAddress, userAgent);
await securityLogger.logLoginFailed(
  email,
  ipAddress,
  userAgent,
  "Invalid password"
);
await securityLogger.logLogout(userId, email, ipAddress, userAgent);

// Password events
await securityLogger.logPasswordChange(
  userId,
  email,
  ipAddress,
  userAgent,
  true
);

// Permission changes
await securityLogger.logPermissionChange(
  targetUserId,
  targetUserEmail,
  { added: ["sales.create"], removed: ["admin.access"] },
  ipAddress,
  userAgent,
  context
);

// Role changes
await securityLogger.logRoleChange(
  targetUserId,
  targetUserEmail,
  ["user"], // oldRoles
  ["user", "admin"], // newRoles
  ipAddress,
  userAgent,
  context
);

// Admin actions
await securityLogger.logAdminAction(
  "Delete all inactive users",
  null,
  null,
  { count: 50, criteria: "inactive > 1 year" },
  ipAddress,
  userAgent,
  context
);

// Data export
await securityLogger.logDataExport(
  "Customer",
  1500,
  "xlsx",
  ipAddress,
  userAgent,
  context
);

// Suspicious activity
await securityLogger.logSuspiciousActivity(
  "Multiple failed login attempts from same IP",
  { attempts: 10, timeWindow: "5 minutes" },
  ipAddress,
  userAgent,
  85, // riskScore
  context
);

// Check if blocked
const isBlocked = await securityLogger.isBlocked(ipAddress, email);
```

---

## 🔒 Server Action with Logging

```typescript
"use server";

import { auth } from "@/lib/auth";
import { auditLogger, logger } from "@/lib/logger";
import { createRequestContext } from "@/lib/logger/middleware";
import { headers } from "next/headers";

export async function createSale(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const headersList = await headers();
  const headersObj = Object.fromEntries(headersList.entries());

  const context = {
    requestId: `action_${Date.now()}`,
    userId: session.user.id,
    userEmail: session.user.email,
    userName: session.user.name,
    ipAddress: headersObj["x-forwarded-for"] || "unknown",
    userAgent: headersObj["user-agent"] || "unknown",
    endpoint: "action:createSale",
    method: "ACTION",
  };

  const actionLogger = logger.child(context);
  const startTime = Date.now();

  try {
    actionLogger.info("Creating new sale");

    // ... create sale logic
    const sale = await db.sale.create({ data: saleData });

    // Log audit
    await auditLogger.logCreate("Sale", sale.id, sale, context, {
      entityName: sale.saleNumber,
      module: "sales",
      duration: Date.now() - startTime,
    });

    actionLogger.info("Sale created successfully", {
      duration: Date.now() - startTime,
      metadata: { saleId: sale.id },
    });

    return { success: true, sale };
  } catch (error) {
    actionLogger.error("Failed to create sale", error, {
      duration: Date.now() - startTime,
    });
    throw error;
  }
}
```

---

## 🔧 API Route with Logging Middleware

```typescript
import { NextRequest, NextResponse } from "next/server";
import { withLogging } from "@/lib/logger/middleware";

// Wrap handler with logging middleware
export const GET = withLogging(async (request: NextRequest) => {
  // Your handler code
  // Request start/end is automatically logged
  return NextResponse.json({ data: "..." });
});

export const POST = withLogging(async (request: NextRequest) => {
  // Logs: POST /api/endpoint
  const data = await request.json();
  // ... process
  // Logs: POST /api/endpoint completed (150ms)
  return NextResponse.json({ success: true });
});
```

---

## 🛡️ Authentication Flow Logging

### In Login Form (after successful login)

```typescript
// After successful signIn:
import { logSuccessfulLogin, logFailedLogin } from "@/app/actions/auth-logging";

const result = await signIn("credentials", { ... });

if (result?.error) {
  await logFailedLogin(email, "Invalid credentials");
} else {
  // Note: Need to get user info from session after redirect
  // Or use callback in NextAuth
}
```

### In Logout

```typescript
import { logUserLogout } from "@/app/actions/auth-logging";

async function handleLogout() {
  const session = await getSession();
  if (session?.user) {
    await logUserLogout(session.user.id, session.user.email);
  }
  await signOut();
}
```

---

## 📊 Log Viewer

เข้าถึง Log Viewer ที่: `/admin/logs`

**Requirements:**

- ต้อง login ด้วย admin role
- หรือมี permission `logs.view`

**Features:**

- ดู Audit Logs, Security Logs, Application Logs
- Filter ตาม entity type, action, severity, event type
- Pagination
- View log detail พร้อม old/new values

---

## 📁 File Structure

```
lib/logger/
├── index.ts           # Main exports
├── types.ts           # TypeScript types
├── config.ts          # Configuration
├── utils.ts           # Utility functions
├── app-logger.ts      # Application logger
├── audit-logger.ts    # Audit logger
├── security-logger.ts # Security logger
└── middleware.ts      # API/Action middleware

lib/
├── auth-logging.ts    # Auth logging helpers

app/actions/
├── auth-logging.ts    # Auth logging server actions
└── logs.ts            # Log viewer server actions

app/(main)/admin/logs/
├── page.tsx           # Log viewer page
└── log-viewer-client.tsx  # Log viewer client component
```

---

## ⚙️ Configuration

### Environment Variables

```env
# Log level: debug, info, warn, error, fatal
LOG_LEVEL=info

# Enable console output (default: true in dev)
LOG_CONSOLE=true

# Enable file logging
LOG_FILE=true
LOG_FILE_PATH=./logs

# Enable database logging (default: true in prod)
LOG_DATABASE=true
```

### Log Retention

| Log Type      | Retention |
| ------------- | --------- |
| Debug logs    | 7 days    |
| Info+ logs    | 30 days   |
| Audit logs    | 7 years   |
| Security logs | 7 years   |

### Rate Limiting (Security)

| Event          | Max Attempts | Window | Lockout |
| -------------- | ------------ | ------ | ------- |
| Login          | 5            | 15 min | 30 min  |
| Password Reset | 3            | 60 min | -       |

---

## 🔐 Sensitive Data Masking

ข้อมูลที่ถูก mask อัตโนมัติ:

- password, token, secret, apiKey
- creditCard, cardNumber, cvv, pin
- ssn, taxId, bankAccount

ข้อมูลที่ถูก partial mask:

- email → `a***@example.com`
- phone → `08***1234`

---

## 📌 Best Practices

1. **ใช้ child logger** สำหรับ request-specific context
2. **Log ทั้ง success และ failure** ของ critical operations
3. **อย่า log sensitive data** โดยตรง - ใช้ maskSensitiveData()
4. **ใส่ requestId** เพื่อ trace requests
5. **ใช้ appropriate log level** - debug สำหรับ dev, info+ สำหรับ prod
6. **Audit all CRUD operations** สำหรับ critical entities
7. **Log security events** ทันทีหลังเกิด event
