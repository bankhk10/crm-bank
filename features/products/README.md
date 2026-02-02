# Products Feature Module

> **Module Type**: Feature Module  
> **Version**: 1.2.0  
> **Last Updated**: 2026-02-02

## 📁 Structure

```
features/products/
├── _components/              # UI Components
│   ├── action-button.tsx     # Action button with tooltip
│   ├── product-form.tsx      # Product create/edit form
│   ├── product-status-badge.tsx  # Status badge (Active/Inactive)
│   ├── products-cards.tsx    # Card view for mobile/tablet
│   ├── products-table.tsx    # Table view for desktop
│   ├── products-toolbar.tsx  # Search/filter toolbar
│   ├── truncated-cell.tsx    # Truncated text cell
│   └── index.ts
│
├── _hooks/                   # Custom React Hooks
│   ├── use-product-columns.tsx  # Table column definitions
│   └── index.ts
│
├── _types/                   # TypeScript Types
│   ├── types.ts              # Feature-specific types
│   └── index.ts              # Re-exports from @/types/product
│
├── _lib/                     # Internal utilities
│   ├── constants.ts          # STATUS_STYLE, PACKAGE_UNIT_OPTIONS
│   └── index.ts
│
├── index.ts                  # Public API (barrel exports)
└── README.md                 # This file
```

## 🔌 Usage

```tsx
import { 
  ProductsTable, 
  ProductForm, 
  ProductStatusBadge,
  useProductColumns,
  type Product,
  type ProductFormData,
  type ProductRecord,
  STATUS_STYLE,
} from "@/features/products";
```

## 📍 Related Routes

| Type | Path |
|------|------|
| **List Page** | `app/(main)/products/page.tsx` |
| **New Page** | `app/(main)/products/new/page.tsx` |
| **Detail Page** | `app/(main)/products/[productId]/page.tsx` |
| **Edit Page** | `app/(main)/products/[productId]/edit/page.tsx` |
| **Manage Page** | `app/(main)/products/[productId]/manage/page.tsx` |
| **API Routes** | `app/api/products/**` |

## 🔗 Sub-Features (Master Data)

Each sub-feature has its own page in `app/(main)/products/`:

| Feature | Page | API |
|---------|------|-----|
| Brands | `/products/brands` | `/api/products/brands` |
| Categories | `/products/categories` | `/api/products/categories` |
| Groups | `/products/groups` | `/api/products/groups` |
| Chemical Groups | `/products/chemical-groups` | `/api/products/chemical-groups` |
| Units | `/products/units` | `/api/products/units` |
| Plants | `/products/plants` | `/api/products/plants` |

## 📦 Exported Items

### Components
- `ProductForm` - Product creation/edit form
- `ProductsTable` - Main table/card view component
- `ProductsToolbar` - Search and filter toolbar
- `ProductsCards` - Card layout for mobile
- `ProductStatusBadge` - Status indicator
- `ActionButton` - Icon button with tooltip
- `TruncatedCell` - Truncated text display

### Hooks
- `useProductColumns` - Column definitions for data table

### Types
- `Product` - Core product entity
- `ProductRecord` - Extended product with stock info
- `ProductFormData` - Form input data
- `ProductFormProps` - Form component props
- `ProductsTableProps` - Table component props
- `ProductsPagination` - Pagination configuration

### Constants
- `STATUS_STYLE` - Status display configuration
- `PACKAGE_UNIT_OPTIONS` - Package unit options
- `ALL_STATUS_VALUE` - Sentinel value for "all" filter

## 🔒 Permissions

| Permission | Description |
|------------|-------------|
| `menu.products` | View products menu |
| `product.create` | Create new products |
| `product.update` | Edit existing products |
| `product.delete` | Delete products |
| `product.manage` | Manage stock/pricing |

## 🔧 Dependencies

- `@/components/ui/*` - shadcn/ui components
- `@/components/custom/*` - Custom UI components
- `@/hooks/use-permission` - RBAC hook
- `@/hooks/use-random-fill` - Random fill hook for dev
- `@/lib/auth` - Authentication
- `@tanstack/react-table` - Table library

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2026-02-02 | 1.2.0 | Legacy files removed, migration complete |
| 2026-02-02 | 1.1.0 | Migrated ProductForm & updated all page imports |
| 2026-02-02 | 1.0.0 | Initial feature module structure |
