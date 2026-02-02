# Sales Feature

This module handles sales management functionalities, including creating sale records (Sales Note), managing payment terms, delivery methods, and tracking sale statuses.

## Directory Structure

- `_components/`: UI components.
  - `forms/`: Form components (SaleForm parts).
  - `tables/`: Table components (Table, Toolbar, Cards).
  - `sale-form.tsx`: Main Sale Form component.
- `_hooks/`: Custom hooks (Form logic, validation, table columns).
- `_lib/`: Constants and utilities (Address parsing, etc.).
- `_types/`: TypeScript definitions specific to sales.

## Usage

### Components

```tsx
import { SalesTable, SaleForm } from "@/features/sales";

// Use directly in pages
<SalesTable sales={...} ... />
<SaleForm onSubmit={...} ... />
```

### Types

```tsx
import { SaleRecord, SaleFormProps } from "@/features/sales";
```

## Routes

- `/sales`: Main list view.
- `/sales/new`: Create new sale.
- `/sales/[id]`: View sale details.
- `/sales/[id]/edit`: Edit sale.
- `/sales/[id]/approve`: Approve sale.

## Permissions

- `menu.sales`: Access to sales module.
- `sale.create`: Create new sales.
- `sale.edit`: Edit existing sales.
- `sale.delete`: Delete sales.
- `sale.approve`: Approve sales.
- `sales_manager`, `sales_admin`: Special roles for viewing all sales.

## Dependencies

- `@/components/ui`: UI primitives.
- `@/components/custom`: Custom shared components (Table, DatePicker, Combobox).
- `@/types/sales`: Core Prisma-related types.
