# 🏗️ Project Structure Refactoring Guide

## Overview

This document describes the refactored project structure following Clean Architecture principles.

## New Directory Structure

```
crm-bank/
├── src/                          # 🆕 New source code location
│   ├── core/                     # Business logic by domain
│   │   ├── sales/
│   │   ├── stock/
│   │   ├── customers/
│   │   ├── products/
│   │   ├── credit/
│   │   └── rbac/
│   ├── shared/                   # Cross-cutting concerns
│   │   ├── constants/
│   │   ├── utils/
│   │   └── types/
│   └── infrastructure/           # Technical implementations
│       ├── database/
│       ├── auth/
│       └── logging/
├── app/                          # Next.js App Router (unchanged)
├── components/                   # React components (unchanged)
├── hooks/                        # React hooks (unchanged)
├── lib/                          # Legacy utilities (to be deprecated)
├── types/                        # Legacy types (to be migrated)
└── prisma/                       # Database schema (unchanged)
```

## Import Path Changes

### Old Imports → New Imports

```typescript
// Database
// OLD: import { db } from "@/lib/db";
// NEW: import { db } from "@/src/infrastructure/database";

// Stock Service
// OLD: import { allocateStock } from "@/lib/stock-service";
// NEW: import { allocateStock } from "@/src/core/stock";

// Order Expiry Service
// OLD: import { checkExpiredOrders } from "@/lib/order-expiry-service";
// NEW: import { checkExpiredOrders } from "@/src/core/sales";

// RBAC
// OLD: import { buildPermissionMap } from "@/lib/rbac";
// NEW: import { buildPermissionMap } from "@/src/core/rbac";

// Utilities
// OLD: import { formatDate, formatCurrency } from "@/lib/helpers";
// NEW: import { formatDate, formatCurrency } from "@/src/shared/utils";

// Constants
// NEW: import { SALE_STATUS_LABELS } from "@/src/shared/constants";
```

## Backward Compatibility

During the migration period, the old `lib/` files are still available. They will be deprecated once all imports are updated.

### Files to Update (Manual Migration Required)

1. `lib/db.ts` → Redirect to `src/infrastructure/database`
2. `lib/rbac.ts` → Redirect to `src/core/rbac`
3. `lib/stock-service.ts` → Redirect to `src/core/stock`
4. `lib/order-expiry-service.ts` → Redirect to `src/core/sales`
5. `lib/helpers.ts` → Redirect to `src/shared/utils`

## Phase 2: Component Refactoring (Future)

The next phase will involve:

- Breaking down large components (e.g., `sale-form.tsx`)
- Creating feature-specific hooks
- Separating UI from business logic

## Commands to Run

After the refactoring, run these commands to verify:

```bash
# Check TypeScript compilation
pnpm tsc --noEmit

# Run linting
pnpm lint

# Run dev server
pnpm dev
```

## Migration Checklist

### Phase 1: Core Structure ✅

- [x] Create `src/` folder structure
- [x] Create `src/infrastructure/database`
- [x] Create `src/infrastructure/auth`
- [x] Create `src/shared/utils`
- [x] Create `src/shared/constants`
- [x] Create `src/shared/types`
- [x] Create `src/core/stock`
- [x] Create `src/core/sales`
- [x] Create `src/core/rbac`
- [x] Create `src/core/credit`
- [x] Create `src/core/customers`
- [x] Create `src/core/products`

### Phase 2: Component Refactoring 🔄

- [x] Create `components/features/sales/types.ts`
- [x] Create `components/features/sales/utils/address.utils.ts`
- [x] Create `components/features/sales/hooks/use-sale-form-data.ts`
- [x] Create `components/features/sales/hooks/use-sale-form-validation.ts`
- [x] Create `components/features/sales/hooks/use-sale-items.ts`
- [x] Create `components/features/sales/components/delivery-method-section.tsx`
- [x] Create `components/features/sales/components/sale-item-row.tsx`
- [x] Create `components/features/sales/components/sale-summary.tsx`
- [x] Create `components/features/sales/components/product-detail-modal.tsx`
- [x] Create `components/features/sales/components/customer-credit-info.tsx`
- [x] Create `components/features/sales/components/section-header.tsx`
- [x] Create `components/features/sales/components/form-action-buttons.tsx`
- [ ] Refactor `sale-form.tsx` to use new components
- [ ] Refactor `sales-table.tsx` into sub-components

### Phase 3: API Route Refactoring (Future)

- [ ] Create `src/core/sales/sales.service.ts`
- [ ] Create `src/core/sales/sales.repository.ts`
- [ ] Refactor `app/api/sales/route.ts`

### Phase 4: Import Path Updates (Future)

- [ ] Update imports in `app/` directory
- [ ] Update imports in `components/` directory
- [ ] Update imports in `hooks/` directory
- [ ] Remove deprecated `lib/` files

## Benefits

1. **Separation of Concerns**: Business logic is now isolated from infrastructure
2. **Testability**: Core services can be unit tested independently
3. **Maintainability**: Clear boundaries between domains
4. **Discoverability**: Logical folder structure makes it easier to find code
5. **Scalability**: New features follow established patterns
