# Companies Feature

This feature module manages company/customer data, including listing, creating, editing, and deleting companies.

## Directory Structure

- `_components/`: UI components (CompaniesTable, CompanyForm, etc.)
- `_hooks/`: Custom hooks (useCompanyColumns)
- `_lib/`: Utilities and constants
- `_types/`: Shared type definitions

---

## API Endpoints

### List Companies

| Method | Endpoint         | File Location                |
| ------ | ---------------- | ---------------------------- |
| `GET`  | `/api/companies` | `app/api/companies/route.ts` |

**Query Parameters:**

- `page` (number): Page number (default: 1)
- `perPage` (number): Items per page (default: 12, max: 100)
- `q` (string): Search query (searches name, shortName)
- `from` (date string): Filter by createdAt start date
- `to` (date string): Filter by createdAt end date

**Required Permissions:** `/api/companies` or `sale.create`

---

### Create Company

| Method | Endpoint         | File Location                |
| ------ | ---------------- | ---------------------------- |
| `POST` | `/api/companies` | `app/api/companies/route.ts` |

**Required Permissions:** `company.create`

---

### Get Single Company

| Method | Endpoint                     | File Location                            |
| ------ | ---------------------------- | ---------------------------------------- |
| `GET`  | `/api/companies/[companyId]` | `app/api/companies/[companyId]/route.ts` |

**Required Permissions:** `/api/companies`

---

### Update Company

| Method | Endpoint                     | File Location                            |
| ------ | ---------------------------- | ---------------------------------------- |
| `PUT`  | `/api/companies/[companyId]` | `app/api/companies/[companyId]/route.ts` |

**Required Permissions:** `company.edit`

---

### Delete Company (Soft Delete)

| Method   | Endpoint                     | File Location                            |
| -------- | ---------------------------- | ---------------------------------------- |
| `DELETE` | `/api/companies/[companyId]` | `app/api/companies/[companyId]/route.ts` |

**Required Permissions:** `company.delete`

---

## Database Schema

### Table: `Company`

| Column        | Type            | Description                               |
| ------------- | --------------- | ----------------------------------------- |
| `id`          | `String`        | Primary key (cuid)                        |
| `name`        | `String`        | ชื่อบริษัท (required)                     |
| `companyCode` | `String?`       | รหัสบริษัท (unique)                       |
| `shortName`   | `String?`       | ชื่อย่อบริษัท                             |
| `email`       | `String?`       | อีเมล (unique)                            |
| `phone`       | `String?`       | เบอร์โทรศัพท์                             |
| `taxId`       | `String?`       | เลขประจำตัวผู้เสียภาษี                    |
| `addressLine` | `String?`       | ที่อยู่ (บ้านเลขที่ หมู่ ซอย ถนน)         |
| `province`    | `String?`       | จังหวัด                                   |
| `district`    | `String?`       | อำเภอ/เขต                                 |
| `subdistrict` | `String?`       | ตำบล/แขวง                                 |
| `postalCode`  | `String?`       | รหัสไปรษณีย์                              |
| `status`      | `CompanyStatus` | สถานะ (ACTIVE/INACTIVE) - default: ACTIVE |
| `createdAt`   | `DateTime`      | วันที่สร้าง                               |
| `updatedAt`   | `DateTime`      | วันที่อัปเดต                              |
| `deletedAt`   | `DateTime?`     | วันที่ลบ (Soft delete)                    |

### Enum: `CompanyStatus`

```prisma
enum CompanyStatus {
  ACTIVE
  INACTIVE
}
```

### Relationships

```
Company
├── employees: Employee[] (One-to-Many)
│   └── Employee.companyId → Company.id
│
└── pickupSales: Sale[] (One-to-Many, relation: "SalePickupCompany")
    └── Sale.pickupCompanyId → Company.id
```

**ER Diagram:**

```
┌─────────────────┐         ┌─────────────────┐
│     Company     │         │    Employee     │
├─────────────────┤         ├─────────────────┤
│ id (PK)         │◄────────│ companyId (FK)  │
│ name            │         │ id (PK)         │
│ companyCode     │         │ name            │
│ shortName       │         │ ...             │
│ email           │         └─────────────────┘
│ phone           │
│ taxId           │         ┌─────────────────┐
│ addressLine     │         │      Sale       │
│ province        │         ├─────────────────┤
│ district        │◄────────│ pickupCompanyId │
│ subdistrict     │         │ id (PK)         │
│ postalCode      │         │ saleNumber      │
│ status          │         │ ...             │
│ createdAt       │         └─────────────────┘
│ updatedAt       │
│ deletedAt       │
└─────────────────┘
```

---

## Validation Rules

### Zod Schema (Create/Update)

| Field         | Rules                                                |
| ------------- | ---------------------------------------------------- |
| `name`        | `string`, **required**, min 2 characters             |
| `companyCode` | `string`, optional                                   |
| `shortName`   | `string`, optional                                   |
| `email`       | `string`, optional, **valid email format**           |
| `phone`       | `string`, optional                                   |
| `taxId`       | `string`, optional                                   |
| `addressLine` | `string`, optional                                   |
| `province`    | `string`, optional                                   |
| `district`    | `string`, optional                                   |
| `subdistrict` | `string`, optional                                   |
| `postalCode`  | `string`, optional (auto-coerced from number)        |
| `status`      | `enum`, optional, values: `"ACTIVE"` \| `"INACTIVE"` |

### Database Unique Constraints

- `companyCode`: Unique (ถ้าระบุ)
- `email`: Unique (ถ้าระบุ)

---

## Key Components

### CompaniesTable

Derived from `CustomTable`. Handles responsive views:

- **Desktop**: Data table with sorting and actions.
- **Mobile**: `CompaniesCards` view.
- **Toolbar**: `CompaniesToolbar` with search and date filters.

### CompanyForm

Form for creating and editing companies. Handles validation and API submission.
Includes "Random Fill" for development testing.

### CompaniesKanbanBoard

A Kanban-style view for companies (usage depends on requirements).

---

## Component Props

### `CompaniesTable`

| Prop                | Type                                      | Required | Description                    |
| ------------------- | ----------------------------------------- | -------- | ------------------------------ |
| `data`              | `CompanyRecord[]`                         | ✅       | รายการข้อมูลบริษัท             |
| `loading`           | `boolean`                                 | ❌       | สถานะกำลังโหลด                 |
| `canCreate`         | `boolean`                                 | ✅       | สิทธิ์ในการสร้างบริษัทใหม่     |
| `canDelete`         | `boolean`                                 | ✅       | สิทธิ์ในการลบบริษัท            |
| `onDeleteRequest`   | `(company: CompanyRecord) => void`        | ✅       | Callback เมื่อกดลบ             |
| `searchValue`       | `string`                                  | ✅       | ค่าการค้นหา                    |
| `onSearchChange`    | `(value: string) => void`                 | ✅       | Callback เมื่อค่าค้นหาเปลี่ยน  |
| `isTyping`          | `boolean`                                 | ❌       | สถานะกำลังพิมพ์                |
| `onSearchSubmit`    | `() => void`                              | ❌       | Callback เมื่อ submit การค้นหา |
| `dateRange`         | `DateRange`                               | ❌       | ช่วงวันที่กรอง                 |
| `onDateRangeChange` | `(range: DateRange \| undefined) => void` | ✅       | Callback เมื่อวันที่เปลี่ยน    |
| `pagination`        | `CompaniesPagination`                     | ✅       | ข้อมูล pagination              |

---

### `CompanyForm`

| Prop          | Type                                                 | Required | Description                              |
| ------------- | ---------------------------------------------------- | -------- | ---------------------------------------- |
| `initial`     | `Partial<CompanyPayload>`                            | ❌       | ข้อมูลเริ่มต้นสำหรับ edit mode           |
| `onSubmit`    | `(payload: CompanyPayload) => Promise<SubmitResult>` | ✅       | Callback เมื่อ submit form               |
| `onCancel`    | `() => void`                                         | ❌       | Callback เมื่อกดยกเลิก                   |
| `submitLabel` | `string`                                             | ❌       | Label ของปุ่ม submit (default: "บันทึก") |

---

### `CompanyCard`

| Prop        | Type                   | Required | Description            |
| ----------- | ---------------------- | -------- | ---------------------- |
| `id`        | `string`               | ✅       | Company ID             |
| `name`      | `string`               | ✅       | ชื่อบริษัท             |
| `shortName` | `string \| null`       | ❌       | ชื่อย่อบริษัท          |
| `email`     | `string \| null`       | ❌       | อีเมล                  |
| `phone`     | `string \| null`       | ❌       | เบอร์โทรศัพท์          |
| `taxId`     | `string \| null`       | ❌       | เลขประจำตัวผู้เสียภาษี |
| `status`    | `string \| null`       | ❌       | สถานะบริษัท            |
| `onDelete`  | `(id: string) => void` | ❌       | Callback เมื่อกดลบ     |

---

### `CompaniesCards`

| Prop              | Type                               | Required | Description         |
| ----------------- | ---------------------------------- | -------- | ------------------- |
| `data`            | `CompanyRecord[]`                  | ✅       | รายการข้อมูลบริษัท  |
| `loading`         | `boolean`                          | ❌       | สถานะกำลังโหลด      |
| `canDelete`       | `boolean`                          | ✅       | สิทธิ์ในการลบบริษัท |
| `onDeleteRequest` | `(company: CompanyRecord) => void` | ✅       | Callback เมื่อกดลบ  |
| `pagination`      | `CompaniesPagination`              | ✅       | ข้อมูล pagination   |

---

### `CompaniesToolbar`

| Prop                | Type                                      | Required | Description                    |
| ------------------- | ----------------------------------------- | -------- | ------------------------------ |
| `canCreate`         | `boolean`                                 | ✅       | สิทธิ์ในการสร้างบริษัทใหม่     |
| `searchValue`       | `string`                                  | ✅       | ค่าการค้นหา                    |
| `onSearchChange`    | `(value: string) => void`                 | ✅       | Callback เมื่อค่าค้นหาเปลี่ยน  |
| `onSearchSubmit`    | `() => void`                              | ❌       | Callback เมื่อ submit การค้นหา |
| `dateRange`         | `DateRange`                               | ❌       | ช่วงวันที่กรอง                 |
| `onDateRangeChange` | `(range: DateRange \| undefined) => void` | ✅       | Callback เมื่อวันที่เปลี่ยน    |

---

### `CompanyStatusBadge`

| Prop     | Type     | Required | Description                              |
| -------- | -------- | -------- | ---------------------------------------- |
| `status` | `string` | ❌       | สถานะบริษัท (`"ACTIVE"` \| `"INACTIVE"`) |

---

### `CompaniesKanbanBoard`

| Prop                | Type     | Required | Description                      |
| ------------------- | -------- | -------- | -------------------------------- |
| `selectedCompanyId` | `string` | ❌       | ID ของบริษัทที่เลือก (highlight) |

---

## Types

### `CompanyRecord`

```typescript
interface CompanyRecord {
  id: string;
  name: string;
  shortName?: string;
  email?: string;
  phone?: string;
  taxId?: string;
  status?: string;
  createdAt?: string;
}
```

### `CompanyPayload`

```typescript
interface CompanyPayload {
  name: string;
  companyCode?: string;
  shortName?: string;
  email?: string;
  phone?: string;
  taxId?: string;
  addressLine?: string;
  province?: string;
  district?: string;
  subdistrict?: string;
  postalCode?: string;
  status?: string;
}
```

### `CompaniesPagination`

```typescript
interface CompaniesPagination {
  page: number;
  perPage: number;
  total: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  perPageOptions?: number[];
}
```

### `SubmitResult`

```typescript
interface SubmitResult {
  success: boolean;
  issues?: Record<string, string[]>;
  error?: string;
}
```

---

## Usage

```tsx
import { CompaniesTable, CompanyForm } from "@/modules/companies";

// List View
<CompaniesTable
  data={companies}
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
<CompanyForm
  initial={existingCompany}
  onSubmit={handleSubmit}
  onCancel={handleCancel}
  submitLabel="บันทึก"
/>
```
