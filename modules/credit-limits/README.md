# Credit Limits Feature

This feature module manages customer credit limits, including displaying credit status, temporary limits, and editing limits.

## Directory Structure

- `_components/`: UI components (CreditLimitTable, CreditLimitForm, Cards, etc.)
- `_hooks/`: Custom hooks (useCreditLimitColumns)
- `_lib/`: Utilities for credit calculations
- `_types/`: Shared type definitions

---

## API Endpoints

### List Credit Limits

| Method | Endpoint             | File Location                    |
| ------ | -------------------- | -------------------------------- |
| `GET`  | `/api/credit-limits` | `app/api/credit-limits/route.ts` |

**Query Parameters:**

- `page` (number): Page number
- `perPage` (number): Items per page
- `q` (string): Search query (Customer name or code)
- `customerId` (string): Filter by specific customer
- `status` (string): Filter by status (ACTIVE, SUSPENDED, EXPIRED)
- `from`, `to` (date string): Filter by creation date

**Required Permissions:** `/api/credit-limits` (plus RBAC: VIEW_OWN, VIEW_DEPARTMENT, VIEW_ALL)

---

### Create Credit Limit

| Method | Endpoint             | File Location                    |
| ------ | -------------------- | -------------------------------- |
| `POST` | `/api/credit-limits` | `app/api/credit-limits/route.ts` |

---

### Get Single Credit Limit

| Method | Endpoint                             | File Location                                    |
| ------ | ------------------------------------ | ------------------------------------------------ |
| `GET`  | `/api/credit-limits/[creditLimitId]` | `app/api/credit-limits/[creditLimitId]/route.ts` |

**Required Permissions:** `/api/credit-limits`

---

### Update Credit Limit

| Method | Endpoint                             | File Location                                    |
| ------ | ------------------------------------ | ------------------------------------------------ |
| `PUT`  | `/api/credit-limits/[creditLimitId]` | `app/api/credit-limits/[creditLimitId]/route.ts` |

**Required Permissions:** `creditlimit.edit`

---

### Delete Credit Limit (Soft Delete)

| Method   | Endpoint                             | File Location                                    |
| -------- | ------------------------------------ | ------------------------------------------------ |
| `DELETE` | `/api/credit-limits/[creditLimitId]` | `app/api/credit-limits/[creditLimitId]/route.ts` |

---

## Database Schema

### Table: `CreditLimit`

| Column                      | Type                | Description                      |
| --------------------------- | ------------------- | -------------------------------- |
| `id`                        | `String`            | Primary key (cuid)               |
| `customerId`                | `String`            | Foreign Key to Customer          |
| `limitAmount`               | `Decimal`           | วงเงินเครดิต                     |
| `promoAmount`               | `Decimal?`          | วงเงินส่งเสริมการขาย             |
| `usedAmount`                | `Decimal`           | วงเงินที่ใช้ไป (default: 0)      |
| `availableAmount`           | `Decimal`           | วงเงินคงเหลือ (default: 0)       |
| `status`                    | `CreditLimitStatus` | สถานะ (ACTIVE/SUSPENDED/EXPIRED) |
| `effectiveDate`             | `DateTime`          | วันที่มีผล                       |
| `expiryDate`                | `DateTime?`         | วันหมดอายุ                       |
| `notes`                     | `String?`           | หมายเหตุ                         |
| `createdById`               | `String?`           | ผู้สร้าง                         |
| `createdAt`                 | `DateTime`          | วันที่สร้าง                      |
| `updatedAt`                 | `DateTime`          | วันที่อัปเดต                     |
| `deletedAt`                 | `DateTime?`         | วันที่ลบ (Soft delete)           |
| `temporaryCreditAmount`     | `Decimal?`          | วงเงินชั่วคราว                   |
| `temporaryCreditExpiryDate` | `DateTime?`         | วันหมดอายุวงเงินชั่วคราว         |

### Enum: `CreditLimitStatus`

```prisma
enum CreditLimitStatus {
  ACTIVE
  SUSPENDED
  EXPIRED
}
```

### Relationships

```
CreditLimit
└── customer: Customer (Many-to-One)
    └── CreditLimit.customerId → Customer.id
```

**ER Diagram:**

```
┌─────────────────┐         ┌─────────────────┐
│   CreditLimit   │         │    Customer     │
├─────────────────┤         ├─────────────────┤
│ id (PK)         │         │ id (PK)         │
│ customerId (FK) │────────►│ name            │
│ limitAmount     │         │ customerCode    │
│ usedAmount      │         │ ...             │
│ availableAmount │         └─────────────────┘
│ status          │
│ ...             │
└─────────────────┘
```

---

## Validation Rules

### Zod Schema (Create)

| Field           | Rules                                |
| --------------- | ------------------------------------ |
| `customerId`    | `string`, **required**, min 1 char   |
| `limitAmount`   | `number`, **required**, non-negative |
| `promoAmount`   | `number`, optional, non-negative     |
| `effectiveDate` | `string` or `date`, **required**     |
| `expiryDate`    | `string` or `date`, optional         |
| `notes`         | `string`, optional                   |

### Zod Schema (Update)

| Field           | Rules                                               |
| --------------- | --------------------------------------------------- |
| `limitAmount`   | `number`, optional, non-negative                    |
| `promoAmount`   | `number`, optional, non-negative                    |
| `usedAmount`    | `number`, optional                                  |
| `effectiveDate` | `string` or `date`, optional                        |
| `expiryDate`    | `string` or `date`, optional                        |
| `status`        | `enum`, optional (`ACTIVE`, `SUSPENDED`, `EXPIRED`) |
| `notes`         | `string`, optional                                  |

---

## Key Components

### CreditLimitTable

Displays list of customers with their credit info.

- **Desktop**: Table view via `CustomTable`.
- **Mobile**: Card view via `CreditLimitCards`.
- **Toolbar**: `CreditLimitToolbar` for search.

### CreditLimitForm

Form for creating or editing credit limits (regular and promo amounts).

---

## Component Props

### `CreditLimitTable`

(Uses type `CustomersCreditTableProps`)

| Prop             | Type                    | Required | Description                  |
| ---------------- | ----------------------- | -------- | ---------------------------- |
| `data`           | `CustomerRecord[]`      | ✅       | ข้อมูลลูกค้าและวงเงิน        |
| `loading`        | `boolean`               | ❌       | สถานะกำลังโหลด               |
| `pagination`     | `CreditLimitPagination` | ❌       | ข้อมูล Pagination            |
| `searchValue`    | `string`                | ❌       | คำค้นหา                      |
| `onSearchChange` | `(val: string) => void` | ❌       | Callback เมื่อพิมพ์ค้นหา     |
| `onSearchSubmit` | `() => void`            | ❌       | Callback เมื่อกด Enter ค้นหา |

### `CreditLimitForm`

| Prop          | Type                                 | Required | Description                        |
| ------------- | ------------------------------------ | -------- | ---------------------------------- |
| `initial`     | `Partial<CreditLimitPayload>`        | ❌       | ข้อมูลเริ่มต้น (สำหรับแก้ไข)       |
| `customers`   | `Array<{id, name, ...}>`             | ❌       | รายชื่อลูกค้า (สำหรับเลือกในฟอร์ม) |
| `onSubmit`    | `(payload) => Promise<SubmitResult>` | ✅       | Callback เมื่อบันทึก               |
| `onCancel`    | `() => void`                         | ❌       | Callback เมื่อยกเลิก               |
| `submitLabel` | `string`                             | ❌       | ข้อความปุ่มบันทึก ("บันทึก")       |

### `CreditLimitToolbar`

| Prop             | Type                    | Required | Description                  |
| ---------------- | ----------------------- | -------- | ---------------------------- |
| `searchValue`    | `string`                | ✅       | คำค้นหา                      |
| `onSearchChange` | `(val: string) => void` | ✅       | Callback เมื่อพิมพ์ค้นหา     |
| `onSearchSubmit` | `() => void`            | ❌       | Callback เมื่อกด Enter ค้นหา |

---

## Types

### `CreditLimitPayload`

```typescript
interface CreditLimitPayload {
  customerId: string;
  limitAmount: number;
  promoAmount?: number;
  usedAmount?: number;
  availableAmount?: number;
  effectiveDate: Date;
  expiryDate?: Date;
  notes?: string;
}
```

### `CustomerRecord`

```typescript
interface CustomerRecord {
  id: string;
  customerCode: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  creditLimits?: CreditLimit[];
  temporaryCreditLimits?: TemporaryCreditLimit[];
}
```

### `CreditLimit`

```typescript
interface CreditLimit {
  id: string;
  limitAmount: number;
  usedAmount?: number;
  availableAmount?: number;
  promoAmount?: number;
}
```

## Usage

```tsx
import { CreditLimitTable } from "@/modules/credit-limits";

<CreditLimitTable
  data={customers}
  loading={loading}
  pagination={{
    page: 1,
    perPage: 10,
    total: 50,
    onPageChange: setPage,
    onPerPageChange: setPerPage,
  }}
  searchValue={search}
  onSearchChange={setSearch}
  onSearchSubmit={handleSearch}
/>;
```
