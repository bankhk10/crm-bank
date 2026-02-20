# Products Feature

This feature module manages products, including their details, images, stock lots, pricing, and master data (brands, categories, etc.).

## Directory Structure

- `_components/`: UI components (Table, Form, Cards, Toolbar).
- `_hooks/`: Custom hooks (e.g., table columns).
- `_lib/`: Utilities and Constants.
- `_types/`: Shared type definitions.

---

## API Endpoints

### List Products

| Method | Endpoint        | File Location               |
| ------ | --------------- | --------------------------- |
| `GET`  | `/api/products` | `app/api/products/route.ts` |

**Query Parameters:**

- `page` (number): Page number
- `perPage` (number): Items per page
- `q` (string): Search query (Code, Name, Common Name)
- `status` (string): ACTIVE / INACTIVE
- `from`, `to` (date): Filter by creation date

**Required Permissions:** `menu.products` (or specific `product.view` if applicable)

---

### Create Product

| Method | Endpoint        | File Location               |
| ------ | --------------- | --------------------------- |
| `POST` | `/api/products` | `app/api/products/route.ts` |

**Required Permissions:** `product.create`

---

### Get Single Product

| Method | Endpoint                    | File Location                           |
| ------ | --------------------------- | --------------------------------------- |
| `GET`  | `/api/products/[productId]` | `app/api/products/[productId]/route.ts` |

**Required Permissions:** `menu.products`

---

### Update Product

| Method  | Endpoint                    | File Location                           |
| ------- | --------------------------- | --------------------------------------- |
| `PATCH` | `/api/products/[productId]` | `app/api/products/[productId]/route.ts` |

**Required Permissions:** `product.update`

---

### Delete Product (Soft Delete)

| Method   | Endpoint                    | File Location                           |
| -------- | --------------------------- | --------------------------------------- |
| `DELETE` | `/api/products/[productId]` | `app/api/products/[productId]/route.ts` |

**Required Permissions:** `product.delete`

---

## Database Schema

### Table: `Product`

| Column         | Type            | Description               |
| -------------- | --------------- | ------------------------- |
| `id`           | `String`        | Primary key (cuid)        |
| `productCode`  | `String`        | รหัสสินค้า (Unique)       |
| `name`         | `String`        | ชื่อสินค้า                |
| `commonName`   | `String?`       | ชื่อสามัญ                 |
| `status`       | `ProductStatus` | สถานะ (ACTIVE/INACTIVE)   |
| `productGroup` | `String?`       | กลุ่มสินค้า               |
| `brand`        | `String?`       | ยี่ห้อ                    |
| `unit`         | `String?`       | หน่วยนับ                  |
| `price`        | `Decimal?`      | ราคาขาย                   |
| `stock`        | `ProductStock?` | ข้อมูลสต็อกรวม (Relation) |

### Table: `ProductStock`

| Column              | Type     | Description                        |
| ------------------- | -------- | ---------------------------------- |
| `id`                | `String` | PK                                 |
| `productId`         | `String` | FK to Product                      |
| `physicalBalance`   | `Int`    | ของที่มีจริงในคลัง                 |
| `reservedQuantity`  | `Int`    | ของที่ถูกจอง (รอส่ง)               |
| `availableQuantity` | `Int`    | ของที่ขายได้ (Physical - Reserved) |

### Relationships

```
Product
├── images: ProductImage[]
├── stock: ProductStock (One-to-One)
├── stockLots: ProductStockLot[]
├── promotionItems: ProductPromotionItem[]
├── freeItems: ProductFreeItem[]
└── saleItems: SaleItem[]
```

---

## Validation Rules

### Zod Schema (Create/Update)

| Field           | Rules                                    |
| --------------- | ---------------------------------------- |
| `productCode`   | **Required**                             |
| `name`          | **Required**                             |
| `pointPerUnit`  | Non-negative integer (Default: 0)        |
| `status`        | Enum: ACTIVE, INACTIVE (Default: ACTIVE) |
| `usedForPlants` | Array of strings (Default: [])           |

**Unique Constraint Handling:**

- Checks for duplicate `productCode` and returns 409 Conflict if found.

---

## Key Components

### ProductsTable

Displays the list of products with search and filtering.

- **Features**: Sortable columns, Status badges, Stock display, Responsive design.
- **Props**: `ProductsTableProps`

### ProductForm

Form for creating and editing products.

- **Features**: Image upload, Master data dropdowns (Brands, Categories), Validation.
- **Props**: `ProductFormProps`

---

## Component Props

### `ProductsTable`

(Uses type `ProductsTableProps`)

| Prop             | Type                 | Required | Description         |
| ---------------- | -------------------- | -------- | ------------------- |
| `data`           | `ProductRecord[]`    | ✅       | ข้อมูลสินค้า        |
| `loading`        | `boolean`            | ❌       | สถานะโหลด           |
| `canCreate`      | `boolean`            | ✅       | สิทธิ์สร้าง         |
| `canUpdate`      | `boolean`            | ❌       | สิทธิ์แก้ไข         |
| `canDelete`      | `boolean`            | ✅       | สิทธิ์ลบ            |
| `searchValue`    | `string`             | ✅       | คำค้นหา             |
| `onSearchChange` | `(val) => void`      | ✅       | Callback พิมพ์ค้นหา |
| `statusFilter`   | `string`             | ❌       | ตัวกรองสถานะ        |
| `pagination`     | `ProductsPagination` | ✅       | Pagination setup    |

### `ProductForm`

(Uses type `ProductFormProps`)

| Prop          | Type                           | Required | Description                     |
| ------------- | ------------------------------ | -------- | ------------------------------- |
| `initialData` | `Partial<ProductFormData>`     | ❌       | ข้อมูลเริ่มต้น (Edit mode)      |
| `productId`   | `string`                       | ❌       | ID สินค้า (Edit mode)           |
| `onSubmit`    | `(payload) => Promise<Result>` | ❌       | Custom submit handler           |
| `onCancel`    | `() => void`                   | ❌       | Callback ยกเลิก                 |
| `canEdit`     | `boolean`                      | ❌       | ควบคุมการแก้ไข (View only mode) |

---

## Types

### `ProductRecord`

Extends `Product` model with calculated fields:

```typescript
interface ProductRecord extends Product {
  stockQuantity?: number;
  availableQuantity?: number;
  reservedQuantity?: number;
  _count?: {
    stockLots: number;
    // ...
  };
}
```

## Usage

```tsx
import { ProductsTable, ProductForm } from "@/modules/products";

// Table View
<ProductsTable
  data={products}
  loading={isLoading}
  canCreate={true}
  canDelete={true}
  pagination={pagination}
  searchValue={search}
  onSearchChange={setSearch}
/>

// Form View
<ProductForm
  initialData={product}
  onSubmit={handleSubmit}
  onCancel={() => router.back()}
/>
```
