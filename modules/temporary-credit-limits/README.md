# Temporary Credit Limits Feature

This feature module manages temporary credit limit requests, approvals, and their lifecycle. It allows sales staff to request temporary limit increases for customers, which can then be approved by authorized personnel.

## Directory Structure

- `_components/`: UI components (Table, Form, Cards, Toolbar, etc.)
- `_hooks/`: Custom hooks (e.g., table columns configuration).
- `_lib/`: Constants and utilities.
- `_types/`: Feature-specific type definitions.

---

## API Endpoints

### List Temporary Credit Limits

| Method | Endpoint                       | File Location                              |
| ------ | ------------------------------ | ------------------------------------------ |
| `GET`  | `/api/temporary-credit-limits` | `app/api/temporary-credit-limits/route.ts` |

**Query Parameters:**

- `q` (string): Search by Customer Name/Code.
- `customerId` (string): Exact customer ID filter.
- `status` (string): PENDING, APPROVED, REJECTED.
- `from`, `to` (date): Filter by creation date.
- `page`, `perPage` (number): Pagination.

**Required Permissions:** `menu.temporary_credit_limit`

---

### Create Request

| Method | Endpoint                       | File Location                              |
| ------ | ------------------------------ | ------------------------------------------ |
| `POST` | `/api/temporary-credit-limits` | `app/api/temporary-credit-limits/route.ts` |

**Required Permissions:** `temporary_creditlimit.create`

---

### Get Single Request

| Method | Endpoint                            | File Location                                   |
| ------ | ----------------------------------- | ----------------------------------------------- |
| `GET`  | `/api/temporary-credit-limits/[id]` | `app/api/temporary-credit-limits/[id]/route.ts` |

**Required Permissions:** `menu.temporary_credit_limit`

---

### Update Request

| Method | Endpoint                            | File Location                                   |
| ------ | ----------------------------------- | ----------------------------------------------- |
| `PUT`  | `/api/temporary-credit-limits/[id]` | `app/api/temporary-credit-limits/[id]/route.ts` |

**Description:** Allows editing of PENDING or REJECTED requests. If rejected, status resets to PENDING.

**Required Permissions:** `temporary_creditlimit.edit`

---

### Delete Request

| Method   | Endpoint                            | File Location                                   |
| -------- | ----------------------------------- | ----------------------------------------------- |
| `DELETE` | `/api/temporary-credit-limits/[id]` | `app/api/temporary-credit-limits/[id]/route.ts` |

**Description:** Soft deletes the request. Cannot delete APPROVED requests.

**Required Permissions:** `temporary_creditlimit.delete`

---

## Database Schema

### Table: `TemporaryCreditLimit`

| Column                   | Type                    | Description                              |
| ------------------------ | ----------------------- | ---------------------------------------- |
| `id`                     | `String`                | PK                                       |
| `customerId`             | `String`                | FK to Customer                           |
| `requestedAmount`        | `Decimal`               | Amount requested                         |
| `expiryDate`             | `DateTime`              | When this temp limit expires             |
| `status`                 | `TemporaryCreditStatus` | PENDING, APPROVED, REJECTED, EXPIRED     |
| `rejectionReason`        | `String?`               | Reason if rejected                       |
| `requestedById`          | `String?`               | FK to User (Requester)                   |
| `approvedById`           | `String?`               | FK to User (Approver)                    |
| `appliedToCreditLimitId` | `String?`               | Track integration with main Credit Limit |

### Relationships

```
TemporaryCreditLimit
├── customer: Customer
├── requestedBy: User
└── approvedBy: User
```

---

## Validation Rules

### Server-side Validation (Zod)

| Field             | Rules                                      |
| ----------------- | ------------------------------------------ |
| `customerId`      | **Required** (Non-empty string)            |
| `requestedAmount` | **Required**, Positive Number > 0          |
| `expiryDate`      | **Required**, Date (String or Date object) |
| `notes`           | Optional string                            |

**Status Constraints:**

- Cannot Edit/Delete if status is **APPROVED**.
- Editing a **REJECTED** request resets status to **PENDING**.

---

## Key Components

### TemporaryCreditLimitTable

Displays the list of temporary credit limit requests.

- **Features**: Responsive (Table/Cards), Search, Date Filter, Status Badges.
- **Props**: `TemporaryCreditLimitTableProps`

### TemporaryCreditLimitForm

Form for creating and editing requests.

- **Features**: Customer Combobox, Date Picker, Amount Validation.
- **Usage**: Used in `pages.tsx` for new/edit views.

---

## Component Props

### `TemporaryCreditLimitTable`

(Uses type `TemporaryCreditLimitTableProps`)

| Prop          | Type                     | Required | Description         |
| ------------- | ------------------------ | -------- | ------------------- |
| `data`        | `TemporaryCreditLimit[]` | ✅       | List of records     |
| `loading`     | `boolean`                | ❌       | Loading state       |
| `pagination`  | `Object`                 | ✅       | Pagination handlers |
| `canCreate`   | `boolean`                | ❌       | Permission flag     |
| `canApprove`  | `boolean`                | ❌       | Permission flag     |
| `searchValue` | `string`                 | ❌       | Search query        |

### `TemporaryCreditLimitForm`

| Prop          | Type                | Required | Description    |
| ------------- | ------------------- | -------- | -------------- |
| `initialData` | `Object`            | ❌       | For Edit mode  |
| `onSubmit`    | `(data) => Promise` | ✅       | Submit handler |
| `isEdit`      | `boolean`           | ❌       | Edit mode flag |

## Usage

```tsx
import { TemporaryCreditLimitTable } from "@/modules/temporary-credit-limits";

<TemporaryCreditLimitTable
  data={data}
  loading={loading}
  canCreate={true}
  onSearchChange={handleSearch}
/>;
```
