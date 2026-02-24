# Sales Targets Module

## Architecture Layers

```
modules/sales-targets/
 ┣ features/                      ← UI screens
 ┃ ┣ detail-view/
 ┃ ┃ ┗ sales-target-detail-dialog.tsx
 ┃ ┣ form/
 ┃ ┃ ┗ sales-target-form.tsx
 ┃ ┗ list-view/
 ┃   ┣ sales-target-table.tsx
 ┃   ┣ sales-target-filters.tsx
 ┃   ┗ yearly-target-card.tsx
 ┃
 ┣ application/                   ← use cases (business logic)
 ┃ ┣ create-sales-target.ts
 ┃ ┣ update-sales-target.ts
 ┃ ┣ validations.ts               (Zod schemas)
 ┃ ┗ index.ts                     (facade + inline thin use cases)
 ┃
 ┣ server/                        ← transport (server actions only)
 ┃ ┗ actions.ts
 ┃
 ┣ infrastructure/                ← prisma / db access
 ┃ ┗ sales-target.repository.ts
 ┃
 ┣ types/
 ┃ ┗ index.ts
 ┃
 ┣ constants.ts
 ┣ index.ts                       (barrel exports)
 ┗ README.md
```

## Layer Rules

### Infrastructure (`infrastructure/sales-target.repository.ts`)

- Pure Prisma/database operations only
- No business logic, no auth, no validation
- Functions: `findSalesTargetById`, `findSalesTargets`, `createSalesTarget`, `updateSalesTarget`, `deleteSalesTargetById`

### Application (`application/`)

- Business logic: validation, data mapping
- Complex use cases (create, update) → separate files
- Thin use cases (get detail, list) → inline in `index.ts`
- `validations.ts` → Zod schemas shared between client/server

### Server (`server/actions.ts`)

- `"use server"` directive
- Auth/Permission check → call use case → revalidatePath
- No business logic in actions

### Features (`features/`)

- UI screens grouped by screen type
- Uses shared components from `@/components/custom/`
