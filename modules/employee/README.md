# Employee Feature

This module manages employee records, including their personal details, employment information, assigned roles, and access permissions.

## Directory Structure

- `_components/`: UI components (EmployeeTable, EmployeeForm, Cards, etc.)
- `_hooks/`: Custom hooks (useEmployeeColumns)
- `_lib/`: Utilities and Constants
- `_types/`: Shared type definitions

---

## API Endpoints

### List Employees
| Method | Endpoint | File Location |
|--------|----------|---------------|
| `GET` | `/api/employee` | `app/api/employee/route.ts` |

**Query Parameters:**
- None (Currently fetches all active employees)

**Required Permissions:** `employee.manage` OR `sale.create` (Partial access)

---

### Create Employee
| Method | Endpoint | File Location |
|--------|----------|---------------|
| `POST` | `/api/rbac/employees/create-with-user` | `app/api/rbac/employees/create-with-user/route.ts` |

*Note: The actual creation is handled by RBAC API to ensure User account creation.*

**Required Permissions:** `employee.manage`

---

### Get Single Employee
| Method | Endpoint | File Location |
|--------|----------|---------------|
| `GET` | `/api/employee/[employeeId]` | `app/api/employee/[employeeId]/route.ts` |

**Required Permissions:** `/api/employee`

---

### Update Employee
| Method | Endpoint | File Location |
|--------|----------|---------------|
| `PUT` | `/api/employee/[employeeId]` | `app/api/employee/[employeeId]/route.ts` |

**Required Permissions:** `employee.manage`

---

### Delete Employee (Soft Delete)
| Method | Endpoint | File Location |
|--------|----------|---------------|
| `DELETE` | `/api/employee/[employeeId]` | `app/api/employee/[employeeId]/route.ts` |

**Required Permissions:** `employee.manage`

---

## Database Schema

### Table: `Employee`

| Column | Type | Description |
|--------|------|-------------|
| `id` | `String` | Primary key (cuid) |
| `employeeCode` | `String?` | รหัสพนักงาน |
| `name` | `String` | ชื่อ-นามสกุล (Full Name) |
| `prefix` | `String?` | คำนำหน้า |
| `firstName` | `String?` | ชื่อจริง |
| `lastName` | `String?` | นามสกุล |
| `email` | `String` | อีเมล (Unique) |
| `phone` | `String?` | เบอร์โทรศัพท์ |
| `birthDate` | `DateTime?` | วันเกิด |
| `addressLine` | `String?` | ที่อยู่ |
| `province` | `String?` | จังหวัด |
| `district` | `String?` | อำเภอ/เขต |
| `subdistrict` | `String?` | ตำบล/แขวง |
| `postalCode` | `String?` | รหัสไปรษณีย์ |
| `status` | `String?` | สถานะ (ACTIVE/INACTIVE) |
| `companyId` | `String?` | สังกัดบริษัท |
| `departmentId` | `String?` | แผนก |
| `positionId` | `String?` | ตำแหน่ง |
| `managerId` | `String?` | หัวหน้างาน |
| `responsibilityArea` | `String?` | เขตที่รับผิดชอบ |
| `createdAt` | `DateTime` | วันที่สร้าง |
| `updatedAt` | `DateTime` | วันที่แก้ไข |
| `deletedAt` | `DateTime?` | วันที่ลบ |

### Relationships

```
Employee
├── user: User? (One-to-One, linked via email/logic)
├── company: Company? (Many-to-One)
├── department: Department? (Many-to-One)
├── position: Position? (Many-to-One)
├── manager: Employee? (Self-relation, Many-to-One)
├── subordinates: Employee[] (Self-relation, One-to-Many)
└── responsibleCustomers: Customer[] (One-to-Many)
```

---

## Validation Rules

### Client-side Validation (EmployeeForm)

| Field | Rules |
|-------|-------|
| `firstName` | **Required** |
| `lastName` | **Required** |
| `email` | **Required**, Valid Email format |
| `password` | Min 8 chars (Required for new employees) |
| `phone` | 9-10 digits numeric |
| `roleDefinitionId` | **Required** (Must select a role) |

### Server-side Validation (Zod - PUT)

| Field | Rules |
|-------|-------|
| `email` | Valid Email (Optional) |
| `password` | Min 8 chars (Optional) |
| `address` | Object (province, district, subdistrict, postalCode) |
| `user.roleId` | String (Optional) |

---

## Key Components

### EmployeeTable
Displays list of employees with columns for Name, Role, Department, Company, Status, and Actions.
- **Features**: Search, Filter, Pagination (Client-side in current implementation).

### EmployeeForm
Comprehensive form for creating/editing employees.
- **Sections**: Personal Info, Address (ThaiAddressPicker), Employment Info, Login Info.
- **Interactions**: Fetches dynamic options for Company, Department, Position, Manager, Roles.

---

## Component Props

### `EmployeeTable`
(Uses generic `CustomTable` props structure internally or fetches data)

*(Note: The current implementation often fetches data in the parent page and passes it down, or the component manages its own specific logic)*

### `EmployeeForm`
(Uses type `EmployeeFormProps`)

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `initial` | `Partial<EmployeeFormValues>` | ❌ | ข้อมูลเริ่มต้น (Edit mode) |
| `employeeId` | `string` | ❌ | ID พนักงาน (Edit mode) |
| `onSubmit` | `(payload) => Promise<Result>` | ❌ | Custom submit handler |
| `onCancel` | `() => void` | ❌ | Callback ยกเลิก |
| `registerRandomize` | `(fn) => void` | ❌ | For development data seeding |

---

## Types

### `Employee`
```typescript
interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string;
  companyId: string;
  employeeCode?: string;
  status?: string;
  position?: { id: string; name: string };
  company?: { id: string; name: string };
  // ...
}
```

## Usage

```tsx
import { EmployeeTable, EmployeeForm } from "@/features/employee";

// List Page
<div className="space-y-4">
  <EmployeeToolbar />
  <EmployeeTable data={employees} />
</div>

// Edit Page
<EmployeeForm
  employeeId={params.id}
  initial={employeeData}
  onCancel={() => router.back()}
/>
```
