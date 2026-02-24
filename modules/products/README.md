# Products Module

This module handles product management including listing, creating, and editing products.

## Architecture

```
modules/products/
 ┣ features/                      ← UI screens
 ┃ ┣ form/
 ┃ ┃ ┗ product-form.tsx
 ┃ ┗ list-view/
 ┃   ┣ products-table.tsx          (รวม toolbar inline)
 ┃   ┣ products-cards.tsx
 ┃   ┗ use-product-columns.tsx
 ┣ ui/                            ← module-specific UI components
 ┃ ┗ product-status-badge.tsx
 ┣ types/
 ┃ ┗ index.ts
 ┣ constants.ts                   ← STATUS_STYLE, PACKAGE_UNIT_OPTIONS
 ┣ index.ts                       ← barrel exports
 ┗ README.md
```

### Layer Responsibilities

| Layer          | Responsibility                                  |
| -------------- | ----------------------------------------------- |
| `features/`    | UI screen components grouped by screen type     |
| `ui/`          | Module-specific reusable UI (e.g. status badge) |
| `types/`       | TypeScript type definitions                     |
| `constants.ts` | Static options and configuration values         |

> **Note**: This module currently uses API routes for data fetching
> rather than server actions. No `infrastructure/`, `application/`,
> or `server/` layers are needed at this time.

## Usage

### Components

```tsx
import {
  ProductsTable,
  ProductForm,
  ProductStatusBadge,
  type ProductRecord,
} from "@/modules/products";
```

### Table Columns Hook

```tsx
import { useProductColumns } from "@/modules/products";

const columns = useProductColumns(
  onDeleteRequest,
  canView,
  canUpdate,
  canDelete,
  canManage,
);
```

### Constants

```tsx
import {
  STATUS_STYLE,
  PACKAGE_UNIT_OPTIONS,
  ALL_STATUS_VALUE,
} from "@/modules/products";
```

## Components

### ProductsTable

Responsive product listing with:

- Desktop: Data table with sortable columns
- Mobile/Tablet: Card layout
- Inline toolbar with search and status filter
- Pagination support

### ProductForm

Product create/edit form with:

- Dynamic options fetched from API
- Image gallery upload with drag-and-drop
- Form validation
- Random fill for development

### ProductStatusBadge

Status indicator badge showing ACTIVE/INACTIVE state.

## Dependencies

- `@/components/custom/`: Shared UI components (TruncatedCell, ActionButton, etc.)
- `@/components/ui/`: UI primitives (Button, Card, Input, Select, etc.)
- `@/types/product`: Shared product type definitions
- `@/hooks/`: Shared hooks (useRandomFill, useFileUpload)
