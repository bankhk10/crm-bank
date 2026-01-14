# 📋 Import Path Migration Guide

This document lists all files that use old import paths and should be updated to use the new paths when convenient.

## Status: ✅ Backward Compatible

All old imports continue to work because the old files re-export from the new locations.
You can update imports gradually without breaking functionality.

---

## Files Using `@/lib/db`

Update to: `import { db } from "@/src/infrastructure/database"`

| File                                                    | Status     |
| ------------------------------------------------------- | ---------- |
| `app/api/sales/route.ts`                                | ⏳ Pending |
| `app/api/sales/[id]/route.ts`                           | ⏳ Pending |
| `app/api/sales/[id]/approve/route.ts`                   | ⏳ Pending |
| `app/api/sales/[id]/reject/route.ts`                    | ⏳ Pending |
| `app/api/sales/[id]/fulfillment/route.ts`               | ⏳ Pending |
| `app/api/sales/[id]/confirm-payment/route.ts`           | ⏳ Pending |
| `app/api/customers/route.ts`                            | ⏳ Pending |
| `app/api/customers/[customerId]/route.ts`               | ⏳ Pending |
| `app/api/customers/[customerId]/images/route.ts`        | ⏳ Pending |
| `app/api/customers/next-code/route.ts`                  | ⏳ Pending |
| `app/api/products/route.ts`                             | ⏳ Pending |
| `app/api/products/[productId]/route.ts`                 | ⏳ Pending |
| `app/api/products/[productId]/images/route.ts`          | ⏳ Pending |
| `app/api/products/[productId]/manage/route.ts`          | ⏳ Pending |
| `app/api/products/brands/route.ts`                      | ⏳ Pending |
| `app/api/products/product-groups/route.ts`              | ⏳ Pending |
| `app/api/employee/route.ts`                             | ⏳ Pending |
| `app/api/employee/[employeeId]/route.ts`                | ⏳ Pending |
| `app/api/rbac/roles/route.ts`                           | ⏳ Pending |
| `app/api/rbac/roles/[roleId]/route.ts`                  | ⏳ Pending |
| `app/api/rbac/roles/[roleId]/permissions/route.ts`      | ⏳ Pending |
| `app/api/rbac/permissions/route.ts`                     | ⏳ Pending |
| `app/api/rbac/permissions/[permissionId]/route.ts`      | ⏳ Pending |
| `app/api/rbac/departments/route.ts`                     | ⏳ Pending |
| `app/api/rbac/departments/[departmentId]/route.ts`      | ⏳ Pending |
| `app/api/rbac/positions/route.ts`                       | ⏳ Pending |
| `app/api/rbac/positions/[positionId]/route.ts`          | ⏳ Pending |
| `app/api/rbac/users/[userId]/roles/route.ts`            | ⏳ Pending |
| `app/api/rbac/users/[userId]/overrides/route.ts`        | ⏳ Pending |
| `app/api/rbac/summary/route.ts`                         | ⏳ Pending |
| `app/api/rbac/catalog/route.ts`                         | ⏳ Pending |
| `app/api/rbac/employees/create-with-user/route.ts`      | ⏳ Pending |
| `app/api/temporary-credit-limits/route.ts`              | ⏳ Pending |
| `app/api/temporary-credit-limits/[id]/route.ts`         | ⏳ Pending |
| `app/api/temporary-credit-limits/[id]/approve/route.ts` | ⏳ Pending |
| `app/api/temporary-credit-limits/expire/route.ts`       | ⏳ Pending |
| `app/actions/dashboard.ts`                              | ⏳ Pending |
| `app/actions/logs.ts`                                   | ⏳ Pending |
| `app/actions/sales-report.ts`                           | ⏳ Pending |
| `lib/logger/app-logger.ts`                              | ⏳ Pending |
| `lib/logger/audit-logger.ts`                            | ⏳ Pending |
| `lib/logger/security-logger.ts`                         | ⏳ Pending |
| `lib/stock-service.ts`                                  | ⏳ Pending |
| `lib/order-expiry-service.ts`                           | ⏳ Pending |
| `lib/sales-summary-service.ts`                          | ⏳ Pending |
| `lib/services/temporary-credit-expiry.service.ts`       | ⏳ Pending |
| `lib/random-fill/sale.ts`                               | ⏳ Pending |
| `scripts/sync-sales-summary.ts`                         | ⏳ Pending |

---

## Files Using `@/lib/rbac`

Update to: `import { isAuthorized, ... } from "@/src/core/rbac"`

| File                                                      | Status     |
| --------------------------------------------------------- | ---------- |
| `app/(main)/layout.tsx`                                   | ⏳ Pending |
| `app/(main)/rbac/page.tsx`                                | ⏳ Pending |
| `app/(main)/rbac/[roleId]/page.tsx`                       | ⏳ Pending |
| `app/(auth)/login/page.tsx`                               | ⏳ Pending |
| `app/api/products/route.ts`                               | ⏳ Pending |
| `app/api/products/[productId]/route.ts`                   | ⏳ Pending |
| `app/api/products/[productId]/images/route.ts`            | ⏳ Pending |
| `app/api/products/[productId]/manage/route.ts`            | ⏳ Pending |
| `app/api/products/brands/route.ts`                        | ⏳ Pending |
| `app/api/products/product-groups/route.ts`                | ⏳ Pending |
| `app/api/customers/route.ts`                              | ⏳ Pending |
| `app/api/customers/[customerId]/route.ts`                 | ⏳ Pending |
| `app/api/customers/next-code/route.ts`                    | ⏳ Pending |
| `app/api/employee/route.ts`                               | ⏳ Pending |
| `app/api/employee/[employeeId]/route.ts`                  | ⏳ Pending |
| `app/api/companies/route.ts`                              | ⏳ Pending |
| `app/api/companies/[companyId]/route.ts`                  | ⏳ Pending |
| `app/api/credit-limits/route.ts`                          | ⏳ Pending |
| `app/api/credit-limits/[creditLimitId]/route.ts`          | ⏳ Pending |
| `app/api/temporary-credit-limits/route.ts`                | ⏳ Pending |
| `app/api/temporary-credit-limits/[id]/route.ts`           | ⏳ Pending |
| `app/api/temporary-credit-limits/[id]/approve/route.ts`   | ⏳ Pending |
| `app/api/temporary-credit-limits/expire/route.ts`         | ⏳ Pending |
| `app/api/temporary-credit-limits/expire/trigger/route.ts` | ⏳ Pending |
| `app/api/random-fill/images/route.ts`                     | ⏳ Pending |
| `components/features/layout/sidebar.tsx`                  | ⏳ Pending |
| `proxy.ts`                                                | ⏳ Pending |

---

## Files Using `@/lib/helpers`

Update to: `import { formatDate, formatCurrency, ... } from "@/src/shared/utils"`

_No files currently using `@/lib/helpers` need migration._

---

## How to Update

### Before (old path):

```typescript
import { db } from "@/lib/db";
import { isAuthorized, hasPermission } from "@/lib/rbac";
import { formatDate, formatCurrency } from "@/lib/helpers";
```

### After (new path):

```typescript
import { db } from "@/src/infrastructure/database";
import { isAuthorized, hasPermission } from "@/src/core/rbac";
import { formatDate, formatCurrency } from "@/src/shared/utils";
```

### Or use the main entry point:

```typescript
import { db, isAuthorized, formatDate, formatCurrency } from "@/src";
```

---

## Notes

1. **No rush** - Old imports work thanks to re-exports
2. **Update gradually** - Fix imports when you're editing a file anyway
3. **Run tests** - After updating, verify functionality still works
4. **Remove old files later** - Once all imports are updated, delete deprecated files in `lib/`
