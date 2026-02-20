# Shipping Companies Feature

This feature module manages shipping company data, including listing, creating, editing, and deleting shipping companies with customer relationships.

## Directory Structure

- `_components/`: UI components (ShippingCompaniesTable, ShippingCompanyForm, etc.)
- `_hooks/`: Custom hooks (useShippingCompanyColumns)
- `_lib/`: Utilities and constants
- `_types/`: Shared type definitions

---

## API Endpoints

### List Shipping Companies
| Method | Endpoint | File Location |
|--------|----------|---------------|
| `GET` | `/api/shipping-companies` | `app/api/shipping-companies/route.ts` |

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `perPage` (number): Items per page (default: 12, max: 100)
- `q` (string): Search query (searches name, phone, address)
- `from` (date string): Filter by createdAt start date
- `to` (date string): Filter by createdAt end date

**Required Permissions:** `/api/shipping-companies`

---

### Create Shipping Company
| Method | Endpoint | File Location |
|--------|----------|---------------|
| `POST` | `/api/shipping-companies` | `app/api/shipping-companies/route.ts` |

**Required Permissions:** `shipping-company.create`

---

### Get Single Shipping Company
| Method | Endpoint | File Location |
|--------|----------|---------------|
| `GET` | `/api/shipping-companies/[shippingCompanyId]` | `app/api/shipping-companies/[shippingCompanyId]/route.ts` |

**Required Permissions:** `/api/shipping-companies`

---

### Update Shipping Company
| Method | Endpoint | File Location |
|--------|----------|---------------|
| `PUT` | `/api/shipping-companies/[shippingCompanyId]` | `app/api/shipping-companies/[shippingCompanyId]/route.ts` |

**Required Permissions:** `shipping-company.edit`

---

### Delete Shipping Company (Soft Delete)
| Method | Endpoint | File Location |
|--------|----------|---------------|
| `DELETE` | `/api/shipping-companies/[shippingCompanyId]` | `app/api/shipping-companies/[shippingCompanyId]/route.ts` |

**Required Permissions:** `shipping-company.delete`

---

## Database Schema

### Table: `ShippingCompany`

| Column | Type | Description |
|--------|------|-------------|
| `id` | `String` | Primary key (cuid) |
| `name` | `String` | ชื่อบริษัทขนส่ง (required) |
| `phone` | `String?` | เบอร์โทร |
| `address` | `String?` | ที่อยู่บริษัทขนส่ง |
| `notes` | `String?` | หมายเหตุ |
| `status` | `ShippingCompanyStatus` | สถานะ (ACTIVE/INACTIVE) - default: ACTIVE |
| `createdAt` | `DateTime` | วันที่สร้าง |
| `updatedAt` | `DateTime` | วันที่อัปเดต |
| `deletedAt` | `DateTime?` | วันที่ลบ (Soft delete) |

### Table: `CustomerShippingCompany` (Junction Table)

| Column | Type | Description |
|--------|------|-------------|
| `id` | `String` | Primary key (cuid) |
| `customerId` | `String` | FK to Customer |
| `shippingCompanyId` | `String` | FK to ShippingCompany |
| `createdAt` | `DateTime` | วันที่สร้าง |

### Enum: `ShippingCompanyStatus`
```prisma
enum ShippingCompanyStatus {
  ACTIVE
  INACTIVE
}
```

### Relationships

```
ShippingCompany
├── customers: CustomerShippingCompany[] (One-to-Many)
│   └── CustomerShippingCompany.shippingCompanyId → ShippingCompany.id

Customer
├── shippingCompanies: CustomerShippingCompany[] (One-to-Many)
    └── CustomerShippingCompany.customerId → Customer.id
```

**ER Diagram:**
```
┌─────────────────────┐         ┌──────────────────────────┐         ┌─────────────────┐
│  ShippingCompany    │         │ CustomerShippingCompany  │         │    Customer     │
├─────────────────────┤         ├──────────────────────────┤         ├─────────────────┤
│ id (PK)             │◄────────│ shippingCompanyId (FK)   │────────►│ id (PK)         │
│ name                │         │ customerId (FK)          │         │ name            │
│ phone               │         │ id (PK)                  │         │ customerCode    │
│ address             │         │ createdAt                │         │ ...             │
│ notes               │         └──────────────────────────┘         └─────────────────┘
│ status              │
│ createdAt           │
│ updatedAt           │
│ deletedAt           │
└─────────────────────┘
```

---

## Validation Rules

### Zod Schema (Create/Update)

| Field | Rules |
|-------|-------|
| `name` | `string`, **required**, min 2 characters |
| `phone` | `string`, optional |
| `address` | `string`, optional |
| `notes` | `string`, optional |
| `status` | `enum`, optional, values: `"ACTIVE"` \| `"INACTIVE"` |
| `customerIds` | `array of strings`, optional |

---

## Key Components

### ShippingCompaniesTable
Main table component for displaying shipping companies with search, filter, and pagination.

### ShippingCompanyForm
Form for creating and editing shipping companies with customer multi-select.

### ShippingCompanyStatusBadge
Badge component for displaying status with color indicators.

---

## Types

### `ShippingCompanyRecord`
```typescript
interface ShippingCompanyRecord {
  id: string;
  name: string;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
  status?: string | null;
  createdAt?: string;
  customerList?: Array<{
    id: string;
    name: string;
    customerCode: string;
  }>;
}
```

### `ShippingCompanyPayload`
```typescript
interface ShippingCompanyPayload {
  name: string;
  phone?: string;
  address?: string;
  notes?: string;
  status?: string;
  customerIds?: string[];
}
```

---

## Usage

```tsx
import { ShippingCompaniesTable, ShippingCompanyForm } from "@/features/shipping-companies";

// List View
<ShippingCompaniesTable
  data={shippingCompanies}
  loading={loading}
  canCreate={canCreate}
  canDelete={canDelete}
  onDeleteRequest={handleDelete}
  searchValue={search}
  onSearchChange={setSearch}
  onSearchSubmit={handleSearchSubmit}
  dateRange={dateRange}
  onDateRangeChange={setDateRange}
  pagination={{
    page: 1,
    perPage: 12,
    total: 100,
    onPageChange: setPage,
    onPerPageChange: setPerPage,
  }}
/>

// Form
<ShippingCompanyForm
  initial={existingShippingCompany}
  onSubmit={handleSubmit}
  onCancel={handleCancel}
  submitLabel="บันทึก"
/>
```

---

## Pages

- `/shipping-companies` - List all shipping companies
- `/shipping-companies/new` - Create new shipping company
- `/shipping-companies/[id]` - View shipping company details
- `/shipping-companies/[id]/edit` - Edit shipping company

---

## Permissions Required

- `menu.shipping-companies` - Access to shipping companies menu
- `shipping-company.create` - Create new shipping company
- `shipping-company.edit` - Edit existing shipping company
- `shipping-company.delete` - Delete shipping company
- `shipping-company.manage` - Full management access
