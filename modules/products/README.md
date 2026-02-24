# Products Module

This module handles product management including listing, creating, editing, and deleting products.

## Architecture

```
modules/products/
 ┣ infrastructure/                    ← Prisma / DB access
 ┃ ┗ product.repository.ts            (CRUD + form options queries)
 ┣ application/                       ← Business logic (use cases)
 ┃ ┣ create-product.ts                (create use case with validation)
 ┃ ┣ update-product.ts                (update use case with validation)
 ┃ ┣ validations.ts                   (Zod schemas shared client/server)
 ┃ ┗ index.ts                         (facade + inline thin use cases)
 ┣ server/                            ← Transport (server actions)
 ┃ ┗ actions.ts                       (auth → use case → revalidate)
 ┣ features/                          ← UI screens
 ┃ ┣ form/
 ┃ ┃ ┗ product-form.tsx
 ┃ ┗ list-view/
 ┃   ┣ products-table.tsx              (includes toolbar inline)
 ┃   ┣ products-cards.tsx
 ┃   ┗ use-product-columns.tsx
 ┣ ui/                                ← module-specific UI components
 ┃ ┗ product-status-badge.tsx
 ┣ types/
 ┃ ┗ index.ts
 ┣ constants.ts
 ┣ index.ts                           ← barrel exports
 ┗ README.md
```

### Layer Responsibilities

| Layer             | Responsibility                                              |
| ----------------- | ----------------------------------------------------------- |
| `infrastructure/` | Pure Prisma/DB operations — no auth, no validation          |
| `application/`    | Business logic: validation, uniqueness checks, data mapping |
| `server/`         | Server actions: auth → use case → revalidatePath            |
| `features/`       | UI screen components grouped by screen type                 |
| `ui/`             | Module-specific reusable UI (e.g. status badge)             |
| `types/`          | TypeScript type definitions                                 |
| `constants.ts`    | Static options and configuration values                     |

## Server Actions

```tsx
import {
  listProductsAction,
  getProductAction,
  createProductAction,
  updateProductAction,
  deleteProductAction,
  getProductFormOptionsAction,
} from "@/modules/products";
```

### Key Design Decisions

- **`getProductFormOptionsAction`** consolidates 7 separate API calls (units, groups, brands, chemical groups, plants, categories, chains) into a single server action
- **Image upload** still uses API routes (`/api/products/[id]/images`) because server actions don't support upload progress tracking (`XHR.onprogress`)
- **Existing API routes are preserved** for backward compatibility — they can be deprecated later

## Components

### ProductsTable

Responsive product listing with desktop table + mobile cards + inline toolbar.

### ProductForm

Product create/edit form with dynamic options (via server action), gallery upload, and validation.

### ProductStatusBadge

Status indicator badge showing ACTIVE/INACTIVE state.

## Dependencies

- `@/components/custom/`: Shared UI components (TruncatedCell, ActionButton, etc.)
- `@/components/ui/`: UI primitives (Button, Card, Input, Select, etc.)
- `@/types/product`: Shared product type definitions
- `@/hooks/`: Shared hooks (useRandomFill, useFileUpload)
- `@/src/infrastructure/database`: Prisma client
- `@/lib/auth`: NextAuth session
- `@/src/core/rbac`: Permission checking
