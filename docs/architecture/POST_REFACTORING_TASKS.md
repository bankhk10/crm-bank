# 📋 Post-Refactoring Tasks

## Commands to Run

After the refactoring, please run these commands in your terminal:

```powershell
# 1. Remove empty lib/rbac folder
Remove-Item -Path "lib/rbac" -Recurse -Force

# 2. Install any missing dependencies (if needed)
pnpm install

# 3. Check TypeScript compilation
pnpm tsc --noEmit

# 4. Run linting
pnpm lint

# 5. Run dev server to verify
pnpm dev
```

## Files Created in Phase 1

### Infrastructure Layer (`src/infrastructure/`)

- [x] `database/prisma.ts` - Database client singleton
- [x] `database/index.ts` - Database exports
- [x] `auth/api-guard.ts` - API authentication utilities
- [x] `auth/index.ts` - Auth exports
- [x] `logging/index.ts` - Logging placeholder
- [x] `index.ts` - Infrastructure exports

### Shared Layer (`src/shared/`)

- [x] `utils/date.utils.ts` - Date formatting utilities
- [x] `utils/currency.utils.ts` - Currency formatting utilities
- [x] `utils/string.utils.ts` - String manipulation utilities
- [x] `utils/url.utils.ts` - URL utilities
- [x] `utils/index.ts` - Utils exports
- [x] `constants/sale-status.ts` - Sale status constants & styles
- [x] `constants/payment-term.ts` - Payment term constants
- [x] `constants/customer.ts` - Customer constants
- [x] `constants/app.ts` - Application-wide constants
- [x] `constants/index.ts` - Constants exports
- [x] `types/api.types.ts` - API response types
- [x] `types/common.types.ts` - Common utility types
- [x] `types/index.ts` - Types exports
- [x] `index.ts` - Shared module exports

### Core Layer (`src/core/`)

- [x] `stock/stock.types.ts` - Stock domain types
- [x] `stock/stock.repository.ts` - Stock data access layer
- [x] `stock/stock.service.ts` - Stock business logic
- [x] `stock/index.ts` - Stock module exports
- [x] `sales/sales.types.ts` - Sales domain types
- [x] `sales/order-expiry.service.ts` - Order expiry logic
- [x] `sales/index.ts` - Sales module exports
- [x] `rbac/rbac.types.ts` - RBAC types
- [x] `rbac/rbac.service.ts` - RBAC business logic
- [x] `rbac/index.ts` - RBAC module exports
- [x] `credit/credit.types.ts` - Credit domain types
- [x] `credit/index.ts` - Credit module exports
- [x] `customers/customer.types.ts` - Customer domain types
- [x] `customers/index.ts` - Customers module exports
- [x] `products/product.types.ts` - Product domain types
- [x] `products/index.ts` - Products module exports
- [x] `index.ts` - Core module exports

### Documentation

- [x] `docs/architecture/REFACTORING_GUIDE.md` - Migration guide

## Deprecated Files (lib/)

The following files now have deprecation notices:

- [x] `lib/db.ts` → Use `@/src/infrastructure/database`
- [x] `lib/rbac.ts` → Use `@/src/core/rbac`
- [x] `lib/stock-service.ts` → Use `@/src/core/stock`
- [x] `lib/order-expiry-service.ts` → Use `@/src/core/sales`
- [x] `lib/helpers.ts` → Use `@/src/shared/utils`

## Phase 2: Component Refactoring (Future Work)

These tasks are recommended for future phases:

### Giant Component Refactoring

1. `components/features/sales/sale-form.tsx` (1,577 lines)

   - [ ] Create `components/SaleItemRow.tsx`
   - [ ] Create `components/CustomerSelector.tsx`
   - [ ] Create `components/PaymentTermSelector.tsx`
   - [ ] Create `components/DeliveryMethodSection.tsx`
   - [ ] Create `components/AddressSection.tsx`
   - [ ] Create `hooks/useSaleForm.ts`
   - [ ] Create `hooks/useSaleItems.ts`
   - [ ] Create `hooks/useSaleValidation.ts`

2. `components/features/sales/sales-table.tsx` (938 lines)
   - [ ] Extract status badge component
   - [ ] Extract action buttons
   - [ ] Extract mobile card view

### API Route Refactoring

3. `app/api/sales/route.ts` (469 lines)
   - [ ] Create `src/core/sales/sales.service.ts`
   - [ ] Create `src/core/sales/sales.repository.ts`
   - [ ] Create `src/core/sales/sales.validator.ts`

### Import Path Updates

4. Update all existing files to use new import paths
   - [ ] Update imports in `app/` directory
   - [ ] Update imports in `components/` directory
   - [ ] Update imports in `hooks/` directory

## Project Structure After Phase 1

```
crm-bank/
├── src/                          ✅ NEW
│   ├── core/
│   │   ├── sales/
│   │   ├── stock/
│   │   ├── customers/
│   │   ├── products/
│   │   ├── credit/
│   │   └── rbac/
│   ├── shared/
│   │   ├── constants/
│   │   ├── utils/
│   │   └── types/
│   ├── infrastructure/
│   │   ├── database/
│   │   ├── auth/
│   │   └── logging/
│   └── index.ts
├── app/                          (unchanged)
├── components/                   (unchanged)
├── lib/                          ⚠️ DEPRECATED
├── types/                        (unchanged, will migrate later)
└── prisma/                       (unchanged)
```
