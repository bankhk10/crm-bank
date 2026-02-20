# Customers Feature

This module handles all customer-related functionalities, including management of different customer types (Dealer, Sub-dealer, Farmer, Broker), their details, orders, and hierarchies.

## Directory Structure

- `_components/`: UI components (Table, Forms, Badges, Detail Panels).
  - `forms/`: Form components for each customer type (Dealer, Sub-dealer, etc.).
- `_hooks/`: Custom hooks (e.g., table columns configuration).
- `_lib/`: Constants, utilities, and helper functions.
- `_types/`: TypeScript definitions specific to customers.

---

## API Endpoints

### List Customers

| Method | Endpoint         | File Location                |
| ------ | ---------------- | ---------------------------- |
| `GET`  | `/api/customers` | `app/api/customers/route.ts` |

**Query Parameters:**

- `page` (number): Page number (default: 1)
- `perPage` (number): Items per page (default: 12)
- `q` (string): Search query (Code, Name, Email, Phone)
- `type` (string): Filter by customer type (DEALER, SUBDEALER, FARMER, BROKER)
- `status` (string): Filter by status (ACTIVE, INACTIVE, SUSPENDED)
- `from`, `to` (date): Filter by creation date

**Required Permissions:** `/api/customers`

---

### Create Customer

| Method | Endpoint         | File Location                |
| ------ | ---------------- | ---------------------------- |
| `POST` | `/api/customers` | `app/api/customers/route.ts` |

**Required Permissions:** `customer.create` AND `customer.create.[type]` (e.g. `customer.create.dealer`)

---

### Get Single Customer

| Method | Endpoint                      | File Location                             |
| ------ | ----------------------------- | ----------------------------------------- |
| `GET`  | `/api/customers/[customerId]` | `app/api/customers/[customerId]/route.ts` |

**Required Permissions:** `/api/customers`

---

### Update Customer

| Method | Endpoint                      | File Location                             |
| ------ | ----------------------------- | ----------------------------------------- |
| `PUT`  | `/api/customers/[customerId]` | `app/api/customers/[customerId]/route.ts` |

**Required Permissions:** `customer.edit`

---

### Delete Customer (Soft Delete)

| Method   | Endpoint                      | File Location                             |
| -------- | ----------------------------- | ----------------------------------------- |
| `DELETE` | `/api/customers/[customerId]` | `app/api/customers/[customerId]/route.ts` |

**Required Permissions:** `customer.delete`

---

## Database Schema

### Table: `Customer`

| Column                  | Type             | Description                                           |
| ----------------------- | ---------------- | ----------------------------------------------------- |
| `id`                    | `String`         | Primary key (cuid)                                    |
| `customerCode`          | `String`         | รหัสลูกค้า (Unique, Auto-generated if empty)          |
| `customerType`          | `CustomerType`   | ประเภทลูกค้า (DEALER, SUBDEALER, ...)                 |
| `name`                  | `String`         | ชื่อลูกค้า                                            |
| `email`                 | `String?`        | อีเมล                                                 |
| `phone`                 | `String?`        | เบอร์โทรศัพท์                                         |
| `status`                | `CustomerStatus` | สถานะ (ACTIVE/INACTIVE/SUSPENDED)                     |
| `province`              | `String?`        | จังหวัด                                               |
| `parentDealerId`        | `String?`        | รหัส Dealer ต้นสังกัด (กรณี Sub-dealer)               |
| `responsibleEmployeeId` | `String?`        | พนักงานที่ดูแล                                        |
| `relationshipScore`     | `Int?`           | คะแนนความสัมพันธ์                                     |
| `createdAt`             | `DateTime`       | วันที่สร้าง                                           |
| `deletedAt`             | `DateTime?`      | วันที่ลบ                                              |
| _Specific Fields_       | _Varies_         | ฟิลด์เฉพาะตามประเภทลูกค้า (เช่น farmPlots, areaCrops) |

### Enum: `CustomerType`

```prisma
enum CustomerType {
  DEALER
  SUBDEALER
  FARMER
  BROKER
}
```

### Relationships

```
Customer
├── creditLimits: CreditLimit[]
├── temporaryCreditLimits: TemporaryCreditLimit[]
├── sales: Sale[]
├── responsibleEmployee: Employee (Many-to-One)
├── parentDealer: Customer (Self-relation, Many-to-One)
└── subDealers: Customer[] (Self-relation, One-to-Many)
```

---

## Validation Rules

### Zod Schema (Create/Update)

| Field            | Rules                                                          |
| ---------------- | -------------------------------------------------------------- |
| `customerType`   | **Required** (Enum)                                            |
| `name`           | **Required**, min 2 chars                                      |
| `customerCode`   | Optional (Auto-generated pattern: `[Prefix][YY][MM][Running]`) |
| `email`          | Optional, Valid Email                                          |
| `phone`          | Optional                                                       |
| `parentDealerId` | Optional (Required logic handled in UI for Sub-dealers)        |

**Auto-generation Pattern:**

- Dealer: `D` + ...
- Sub-dealer: `S` + ...
- Farmer: `F` + ...
- Broker: `B` + ...

---

## Key Components

### CustomersTable

Main table view with search, filters, and pagination.

- **Props**: `CustomersTableProps`
- **Features**: Sortable columns, action buttons, mobile card view.

### CustomersToolbar

Toolbar containing:

- Search input
- Type filter dropdown
- Status filter dropdown
- "Create Customer" buttons (split by allowed types)

### Customer Forms

Located in `_components/forms/`. One form per customer type:

- `CustomerFormDealer`
- `CustomerFormSubdealer`
- `CustomerFormFarmer`
- `CustomerFormBroker`
  All share a common interface `CustomerFormProps`.

---

## Component Props

### `CustomersTable`

(Uses type `CustomersTableProps`)

| Prop                 | Type                  | Required | Description                                         |
| -------------------- | --------------------- | -------- | --------------------------------------------------- |
| `data`               | `CustomerRecord[]`    | ✅       | ข้อมูลลูกค้า                                        |
| `loading`            | `boolean`             | ❌       | สถานะโหลด                                           |
| `canCreate`          | `boolean`             | ✅       | สิทธิ์สร้างลูกค้าทั่วไป                             |
| `canCreate...`       | `boolean`             | ❌       | สิทธิ์สร้างลูกค้าแต่ละประเภท (Dealer, Farmer, etc.) |
| `canDelete`          | `boolean`             | ✅       | สิทธิ์ลบลูกค้า                                      |
| `onDeleteRequest`    | `(customer) => void`  | ❌       | Callback ลบ                                         |
| `searchValue`        | `string`              | ❌       | คำค้นหา                                             |
| `onSearchChange`     | `(val) => void`       | ❌       | Callback พิมพ์ค้นหา                                 |
| `customerTypeFilter` | `string`              | ❌       | ตัวกรองประเภท                                       |
| `statusFilter`       | `string`              | ❌       | ตัวกรองสถานะ                                        |
| `pagination`         | `CustomersPagination` | ✅       | Pagination props                                    |

### `CustomersToolbar`

| Prop                 | Type            | Required | Description                  |
| -------------------- | --------------- | -------- | ---------------------------- |
| `searchValue`        | `string`        | ✅       | คำค้นหา                      |
| `onSearchChange`     | `(val) => void` | ✅       | Callback พิมพ์ค้นหา          |
| `customerTypeFilter` | `string`        | ❌       | ตัวกรองประเภท                |
| `statusFilter`       | `string`        | ❌       | ตัวกรองสถานะ                 |
| `canCreate...`       | `boolean`       | ❌       | สิทธิ์สร้างลูกค้าแต่ละประเภท |

### `CustomerForm` (Generic)

(Uses type `CustomerFormProps`)

| Prop          | Type                                 | Required | Description                |
| ------------- | ------------------------------------ | -------- | -------------------------- |
| `initial`     | `Partial<CustomerPayload>`           | ❌       | ข้อมูลเริ่มต้น (Edit mode) |
| `onSubmit`    | `(payload) => Promise<SubmitResult>` | ✅       | Callback บันทึก            |
| `onCancel`    | `() => void`                         | ❌       | Callback ยกเลิก            |
| `submitLabel` | `string`                             | ❌       | ข้อความปุ่มบันทึก          |

---

## Types

### `CustomerRecord`

```typescript
interface CustomerRecord {
  id: string;
  customerCode: string;
  customerType: CustomerType;
  name: string;
  email?: string;
  phone?: string;
  status?: string;
  // ...
}
```

### `CustomerPayload`

```typescript
type CustomerPayload = {
  customerCode: string;
  customerType: CustomerType;
  name: string;
  // ... many specific fields
};
```

## Usage

```tsx
import { CustomersTable, CustomerFormDealer } from "@/modules/customers";

// Table
<CustomersTable
  data={customers}
  loading={isLoading}
  canCreate={true}
  canCreateDealer={true}
  searchValue={search}
  onSearchChange={setSearch}
  pagination={pagination}
/>

// Form
<CustomerFormDealer
  initial={customerData}
  onSubmit={handleSubmit}
  onCancel={() => router.back()}
/>
```
