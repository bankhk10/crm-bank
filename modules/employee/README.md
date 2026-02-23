# Employee Feature

This module manages employee records, including their personal details, employment information, assigned roles, and access permissions. It follows the project's standard enterprise module architecture using Next.js App Router features like Server Components, Server Actions, and Data Transfer Objects (DTOs).

## Directory Structure

- `features/`: Complex modular features:
  - `list-view/`: List-related components (`employee-table.tsx`, `employee-cards.tsx`, `employee-toolbar.tsx`, `use-employee-columns.tsx`)
  - `form/`: Form-related components (`employee-form.tsx`, `employee-form-wrapper.tsx`)
- `server/`: Server-side logic:
  - `actions.ts`: Server Actions for mutations (create, update, delete)
  - `queries.ts`: Server Queries for data fetching (getEmployees, getEmployee)
  - `validations.ts`: Zod schemas for data validation
- `types/`: Shared type definitions specific to this module
- `ui/`: Shared atomic UI components (e.g., `employee-status-badge.tsx`)
- `constants.ts`: Shared constants and dropdown options (Prefix, Status, etc.)
- `index.ts`: Public API export barrel file

---

## Server Layer (Data Access)

This module uses Server Actions for mutations and Server Queries (inside Server Components) for fetching. It does not use traditional API Routes for internal operations.

### Queries (`server/queries.ts`)

- `getEmployees(params)`: Retrieves a list of employees with optional filtering (search) and pagination support.
- `getEmployee(id)`: Retrieves a single employee's details including relations like company, department, and user roles.

### Actions (`server/actions.ts`)

These are Server Actions built to be called from client components:

- `createEmployeeAction(data)`: Creates an employee record and optionally constructs an associated `User` account.
- `updateEmployeeAction(id, data)`: Synchronizes employee profile updates and manages linked user account details.
- `deleteEmployeeAction(id)`: Performs a soft-delete by setting the `deletedAt` timestamp.
- `getEmployeesAction()`: Server Action version used in client components for manual fetching or list synchronization.

---

## Database Schema

### Table: `Employee`

| Column               | Type        | Description              |
| -------------------- | ----------- | ------------------------ |
| `id`                 | `String`    | Primary key (cuid)       |
| `employeeCode`       | `String?`   | รหัสพนักงาน              |
| `name`               | `String`    | ชื่อ-นามสกุล (Full Name) |
| `prefix`             | `String?`   | คำนำหน้า                 |
| `firstName`          | `String?`   | ชื่อจริง                 |
| `lastName`           | `String?`   | นามสกุล                  |
| `email`              | `String`    | อีเมล (Unique)           |
| `phone`              | `String?`   | เบอร์โทรศัพท์            |
| `birthDate`          | `DateTime?` | วันเกิด                  |
| `addressLine`        | `String?`   | ที่อยู่                  |
| `province`           | `String?`   | จังหวัด                  |
| `district`           | `String?`   | อำเภอ/เขต                |
| `subdistrict`        | `String?`   | ตำบล/แขวง                |
| `postalCode`         | `String?`   | รหัสไปรษณีย์             |
| `status`             | `String?`   | สถานะ (ACTIVE/INACTIVE)  |
| `companyId`          | `String?`   | สังกัดบริษัท             |
| `departmentId`       | `String?`   | แผนก                     |
| `positionId`         | `String?`   | ตำแหน่ง                  |
| `managerId`          | `String?`   | หัวหน้างาน               |
| `responsibilityArea` | `String?`   | เขตที่รับผิดชอบ          |
| `createdAt`          | `DateTime`  | วันที่สร้าง              |
| `updatedAt`          | `DateTime`  | วันที่แก้ไข              |
| `deletedAt`          | `DateTime?` | วันที่ลบ                 |

### Relationships

```
Employee
├── user: User? (One-to-One, linked via userId)
├── company: Company? (Many-to-One)
├── department: Department? (Many-to-One)
├── position: Position? (Many-to-One)
├── manager: Employee? (Self-relation, Many-to-One)
├── subordinates: Employee[] (Self-relation, One-to-Many)
└── responsibleCustomers: Customer[] (One-to-Many)
```

---

## Validation Rules (`server/validations.ts`)

Validation is handled via Zod schemas, shared between the client forms and server actions.

| Field              | Rules                                          |
| :----------------- | :--------------------------------------------- |
| `firstName`        | **Required**, Minimum 1 character              |
| `lastName`         | **Required**, Minimum 1 character              |
| `email`            | **Required**, Valid Email format               |
| `roleDefinitionId` | **Required**, Must select a valid role         |
| `password`         | Optional (Required for new users if requested) |
| `phone`            | Optional                                       |

---

## Key Components

### EmployeeTable (`features/list-view/employee-table.tsx`)

The main desktop data grid. Supports search, pagination, and direct integration with `deleteEmployeeAction`.

### EmployeeCards (`features/list-view/employee-cards.tsx`)

A mobile-responsive card layout for employee records, used as an alternative to the table for smaller screens.

### EmployeeFormWrapper (`features/form/employee-form-wrapper.tsx`)

A higher-order component that manages data preparation (fetching existing data for edits) and coordinates the submission process with Toast notifications and redirects.

### EmployeeForm (`features/form/employee-form.tsx`)

The core form UI using `react-hook-form`. Includes automatic Age calculation from birthDate and "Random Fill" capabilities for development.

---

## Usage Example

### List Page (Server Component)

```tsx
import { getEmployees } from "@/modules/employee/server/queries";
import { EmployeeTable } from "@/modules/employee";

export default async function EmployeePage(props: { searchParams: any }) {
  const { employees } = await getEmployees(props.searchParams);

  return (
    <div className="space-y-4">
      <EmployeeTable employees={employees} />
    </div>
  );
}
```

### Form Page (Client/Server Hybrid)

```tsx
import { EmployeeFormWrapper } from "@/modules/employee";

export default function Page({ params }: { params: { employeeId: string } }) {
  return (
    <EmployeeFormWrapper
      employeeId={params.employeeId} // Undefined for "Create", String for "Edit"
    />
  );
}
```
