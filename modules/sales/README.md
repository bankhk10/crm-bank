# Sales Feature

This module handles sales management functionalities, including creating sale records (Sales Note), managing payment terms, delivery methods, and tracking sale statuses.

## Directory Structure

- `_components/`: UI components (Form, Table, Toolbar, Cards).
- `_hooks/`: Custom hooks (Form logic, validation, table columns).
- `_lib/`: Constants and utilities.
- `_types/`: Feature-specific type definitions.

---

## API Endpoints

### List Sales

| Method | Endpoint     | File Location            |
| ------ | ------------ | ------------------------ |
| `GET`  | `/api/sales` | `app/api/sales/route.ts` |

**Query Parameters:**

- `search` (string): Search by Sale No, Customer Name/Code.
- `status` (string): Filter by SaleStatus.
- `customerId`, `employeeId`, `paymentTerm` (string): Exact match filters.
- `dateFrom`, `dateTo` (date): Filter by Sale Date.
- `page`, `perPage` (number): Pagination.

**Required Permissions:** `menu.sales` (subject to `VIEW_OWN`, `VIEW_DEPARTMENT`, `VIEW_ALL` scopes).

---

### Create Sale

| Method | Endpoint     | File Location            |
| ------ | ------------ | ------------------------ |
| `POST` | `/api/sales` | `app/api/sales/route.ts` |

**Description:** Creates a new sale, checks credit limit, validates stock (returns warnings), and notifies manager.

**Required Permissions:** `sale.create`

---

### Get Sale Detail

| Method | Endpoint              | File Location                     |
| ------ | --------------------- | --------------------------------- |
| `GET`  | `/api/sales/[saleId]` | `app/api/sales/[saleId]/route.ts` |

**Description:** Fetches full sale details including items, customer credit info, and stock warnings.

**Required Permissions:** `menu.sales`

---

### Update Sale

| Method | Endpoint              | File Location                     |
| ------ | --------------------- | --------------------------------- |
| `PUT`  | `/api/sales/[saleId]` | `app/api/sales/[saleId]/route.ts` |

**Description:** Updates sale details. If status was APPROVED/REJECTED, it may reset to PENDING and release stock.

**Required Permissions:** `sale.edit` (Creator/Admin checks apply for specific statuses).

---

### Delete Sale

| Method   | Endpoint              | File Location                     |
| -------- | --------------------- | --------------------------------- |
| `DELETE` | `/api/sales/[saleId]` | `app/api/sales/[saleId]/route.ts` |

**Description:** Soft deletes a sale. Returns credit and stock if applicable.

**Required Permissions:** `sale.delete`

---

## Database Schema

### Table: `Sale`

| Column        | Type          | Description                        |
| ------------- | ------------- | ---------------------------------- |
| `id`          | `String`      | PK                                 |
| `saleNumber`  | `String`      | Auto-generated (e.g. SO2023100001) |
| `customerId`  | `String`      | FK to Customer                     |
| `employeeId`  | `String`      | FK to Employee (Salesperson)       |
| `status`      | `SaleStatus`  | PENDING, APPROVED, etc.            |
| `paymentTerm` | `PaymentTerm` | CREDIT_90, CASH, etc.              |
| `totalAmount` | `Decimal`     | Net total                          |
| `items`       | `SaleItem[]`  | Relation to items                  |

### Table: `SaleItem`

| Column       | Type      | Description              |
| ------------ | --------- | ------------------------ |
| `saleId`     | `String`  | FK to Sale               |
| `productId`  | `String`  | FK to Product            |
| `quantity`   | `Int`     | Quantity (Cartons/Units) |
| `unitPrice`  | `Decimal` | Price per unit           |
| `totalPrice` | `Decimal` | Total line amount        |

### Relationships

```
Sale
├── customer: Customer
├── employee: Employee
├── items: SaleItem[]
├── createdBy: User
├── approvedBy: User
└── statusHistory: SaleStatusHistory[]
```

---

## Validation Rules

### Server-side Validation (POST/PUT)

1. **Credit Limit**:
   - For CREDIT terms, `Total Amount` must not exceed `Available Credit + Promo Credit`.
   - Returns 400 if exceeded.
2. **Stock Availability**:
   - Checks if `Physical Stock < Requested Quantity`.
   - Returns **Warnings** (does not block creation, but alerts user).
3. **Status Checks**:
   - Only Creator or Admin can edit `REJECTED` / `WAITING_FOR_CORRECTION` sales.
   - Max 3 delivery date updates allowed.

### Client-side Validation (Form)

- Required fields: Customer, Employee, Items.
- Items must have usage Quantity > 0.

---

## Key Components

### SalesTable

Main list view for sales.

- **Features**: Advanced filtering, Status badges, Role-based actions (Approve/Edit/Delete).
- **Props**: `SalesTableProps`

### SaleForm

Complex form for creating/editing sales.

- **Features**:
  - Dynamic product search & addition.
  - Auto-calculation of totals (Unit Price _ Qty _ Package Size).
  - Credit limit real-time check.
  - Address auto-fill from Customer.
- **Props**: `SaleFormProps`

---

## Component Props

### `SalesTable`

(Uses type `SalesTableProps`)

| Prop          | Type                | Required | Description                |
| ------------- | ------------------- | -------- | -------------------------- |
| `sales`       | `SaleRecord[]`      | ✅       | List of sales              |
| `total`       | `number`            | ✅       | Total records              |
| `page`        | `number`            | ✅       | Current page               |
| `perPage`     | `number`            | ✅       | Per page count             |
| `canCreate`   | `boolean`           | ❌       | Permission flag            |
| `canApprove`  | `boolean`           | ❌       | Permission flag            |
| `canEditItem` | `(item) => boolean` | ❌       | Row-level permission check |

### `SaleForm`

(Uses type `SaleFormProps`)

| Prop          | Type                      | Required | Description    |
| ------------- | ------------------------- | -------- | -------------- |
| `initialData` | `Partial<SaleFormData>`   | ❌       | For Edit mode  |
| `onSubmit`    | `(data) => Promise<void>` | ✅       | Submit handler |
| `onCancel`    | `() => void`              | ❌       | Cancel handler |
| `isEdit`      | `boolean`                 | ❌       | Edit mode flag |

---

## Calculation Formula

- **Item Total**: `Quantity` × `Unit Price` × `Package Size Multiplier`
  - _Note: Package Size Multiplier defaults to 1 if invalid._
- **Net Total**: `Sum(Item Totals)` - `Shipping Cost` - `Other Costs`

## Usage

```tsx
import { SalesTable, SaleForm } from "@/modules/sales";

// List Page
<SalesTable
  sales={salesData}
  canCreate={hasCreatePermission}
  onDelete={handleDelete}
/>

// Create Page
<SaleForm
  onSubmit={createSale}
  onCancel={() => router.back()}
/>
```
