# Employee Feature Module

> **Module Type**: Feature Module  
> **Version**: 1.0.0  
> **Last Updated**: 2026-02-02

## 📁 Structure

```
features/employee/
├── _components/              # UI Components
│   ├── employee-cards.tsx    # Card view for mobile
│   ├── employee-form.tsx     # Create/Edit form
│   ├── employee-status-badge.tsx
│   ├── employee-table.tsx    # Main table (wrapper)
│   ├── employee-toolbar.tsx  # Search toolbar
│   └── index.ts
│
├── _hooks/                   # Custom Hooks
│   ├── use-employee-columns.tsx
│   └── index.ts
│
├── _types/                   # Types
│   ├── types.ts
│   └── index.ts
│
├── _lib/                     # Utilities & Constants
│   ├── constants.ts
│   └── index.ts
│
├── index.ts                  # Public API
└── README.md
```

## 🔌 Usage

```tsx
import { 
  EmployeeTable, 
  EmployeeForm,
  type Employee 
} from "@/features/employee";
```

## 📍 Related Routes

| Page | Path |
|------|------|
| List | `app/(main)/employee/page.tsx` |
| New | `app/(main)/employee/new/page.tsx` |
| Detail | `app/(main)/employee/[employeeId]/page.tsx` |
| Edit | `app/(main)/employee/[employeeId]/edit/page.tsx` |

## 🔒 Permissions

| Permission | Description |
|------------|-------------|
| `menu.employees` | View list |
| `employee.view` | View details |
| `employee.create` | Create new |
| `employee.edit` | Edit existing |
| `employee.delete` | Delete |
| `employee.manage` | Full access |

## 🔧 Dependencies

- `@/components/custom/custom-table`
- `@/components/custom/ThaiAddressPicker`
- `@/components/custom/DatePicker`
- `@/hooks/use-permission`
