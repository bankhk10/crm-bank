# Companies Feature

This feature module manages company/customer data, including listing, creating, editing, and deleting companies.

## Directory Structure

- `features/`: Feature-specific components (list-view, detail-view, form)
- `server/`: Server Actions and Data Access Queries
- `types/`: Shared type definitions
- `ui/`: Shared UI components

---

## Server Actions

Instead of traditional API routes, this module uses **Server Actions** located in `modules/companies/server/actions.ts`.

### Create Company

- **Action:** `createCompanyAction(rawData: unknown)`
- **Required Permissions:** `company.create`

### Update Company

- **Action:** `updateCompanyAction(id: string, rawData: unknown)`
- **Required Permissions:** `company.edit`

### Delete Company (Soft Delete)

- **Action:** `deleteCompanyAction(id: string)`
- **Required Permissions:** `company.delete`

## Server Queries

Data fetching operations are located in `modules/companies/server/queries.ts`.

### List Companies

- **Query:** `getCompanies(params: GetCompaniesParams)`
- **Query Parameters:**
  - `page` (number): Page number (default: 1)
  - `perPage` (number): Items per page (default: 12, max: 100)
  - `q` (string): Search query (searches name, shortName)
  - `from` (date): Filter by createdAt start date
  - `to` (date): Filter by createdAt end date

### Get Single Company

- **Query:** `getCompany(id: string)`

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

### CompanyFormWrapper

A wrapper component that handles fetching initial data (if editing), checking user permissions, and submitting to the appropriate Server Action (Create or Update).

### CompanyForm

Form for creating and editing companies. Driven by `react-hook-form` and `@hookform/resolvers/zod` using `companySchema` for real-time validation.

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

### `CompanyFormWrapper`

| Prop        | Type     | Required | Description                                |
| ----------- | -------- | -------- | ------------------------------------------ |
| `companyId` | `string` | ❌       | Company ID (if provided, enters Edit mode) |

---

### `CompanyForm`

| Prop          | Type                                                    | Required | Description                              |
| ------------- | ------------------------------------------------------- | -------- | ---------------------------------------- |
| `initial`     | `Partial<CompanyFormValues>`                            | ❌       | ข้อมูลเริ่มต้นสำหรับ edit mode           |
| `onSubmit`    | `(payload: CompanyFormValues) => Promise<SubmitResult>` | ✅       | Callback เมื่อ submit form               |
| `onCancel`    | `() => void`                                            | ❌       | Callback เมื่อกดยกเลิก                   |
| `submitLabel` | `string`                                                | ❌       | Label ของปุ่ม submit (default: "บันทึก") |

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

### `CompanyFormValues`

Generated from Zod schema in `server/validations.ts`:

```typescript
export const companySchema = z.object({
  name: z.string().min(2),
  companyCode: z.string().optional(),
  // ...
});

export type CompanyFormValues = z.infer<typeof companySchema>;
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
import { CompaniesView } from "@/modules/companies/features/list-view/companies-view";
import { CompanyFormWrapper } from "@/modules/companies/features/form/company-form-wrapper";

// List View (Server Component calling Client Component)
export default async function CompaniesPage({ searchParams }) {
  const { total, companies } = await getCompanies({...});
  return <CompaniesView initialCompanies={companies} total={total} />;
}

// Form (Create Mode)
export default function NewCompanyPage() {
  return <CompanyFormWrapper />;
}

// Form (Edit Mode)
export default function EditCompanyPage() {
  const { companyId } = useParams();
  return <CompanyFormWrapper companyId={companyId} />;
}
```
