# RBAC Feature

This module handles Role-Based Access Control (RBAC) functionalities, including managing roles, permissions, departments, positions, and user access levels.

## Directory Structure

- `_components/`: UI components (Console, Permission Editor, User List).
- `_hooks/`: Custom hooks for data fetching (useRBACSummary).
- `_lib/`: Zod schemas and utilities.
- `_types/`: Types for RBAC responses and structures.

---

## API Endpoints

### Get RBAC Summary

| Method | Endpoint            | File Location                   |
| ------ | ------------------- | ------------------------------- |
| `GET`  | `/api/rbac/summary` | `app/api/rbac/summary/route.ts` |

**Description:** Fetches all RBAC related data (Roles, Permissions, Departments, Positions, Users) in one call for the console dashboard.

**Required Permissions:** `rbac.manage`

---

### List Roles

| Method | Endpoint          | File Location                 |
| ------ | ----------------- | ----------------------------- |
| `GET`  | `/api/rbac/roles` | `app/api/rbac/roles/route.ts` |

**Description:** Fetches list of roles. Used in dropdowns and settings.

**Required Permissions:** `employee.manage` OR `rbac.manage` (See api-guard logic)

---

### Create Role

| Method | Endpoint          | File Location                 |
| ------ | ----------------- | ----------------------------- |
| `POST` | `/api/rbac/roles` | `app/api/rbac/roles/route.ts` |

**Required Permissions:** `rbac.manage`

---

## Database Schema

### Table: `Role`

| Column     | Type      | Description                |
| ---------- | --------- | -------------------------- |
| `id`       | `String`  | PK                         |
| `name`     | `String`  | Display Name               |
| `slug`     | `String`  | System identifier (Unique) |
| `isSystem` | `Boolean` | If true, cannot be deleted |

### Table: `Permission`

| Column              | Type     | Description                   |
| ------------------- | -------- | ----------------------------- |
| `id`                | `String` | PK                            |
| `key`               | `String` | Key string (e.g. `menu.rbac`) |
| `category`          | `Enum`   | MENU, ACTION, DATA            |
| `defaultDataAccess` | `Enum`   | VIEW_OWN, VIEW_ALL, etc.      |

### Table: `RolePermission` (Pivot)

| Column         | Type     | Description                     |
| -------------- | -------- | ------------------------------- |
| `roleId`       | `String` | FK to Role                      |
| `permissionId` | `String` | FK to Permission                |
| `dataAccess`   | `Enum`   | Custom data scope for this role |
| `editAccess`   | `Enum`   | Custom edit scope               |
| `deleteAccess` | `Enum`   | Custom delete scope             |

### Relationships

```
Role
├── permissions: RolePermission[]
└── userRoles: UserRole[] (Users assigned to this role)

User
└── userRoles: UserRole[]
    └── role: Role
```

---

## Validation Rules

### Role Creation (Zod)

| Field      | Rules                               |
| ---------- | ----------------------------------- |
| `name`     | Min 2 chars                         |
| `slug`     | Min 2 chars, Regex `^[a-z0-9_\-]+$` |
| `isActive` | Boolean (Optional)                  |

---

## Key Components

### RBACConsole

The main dashboard for managing RBAC.

- **Features**: Tabs for monitoring Overview, Roles, Permissions, Users.
- **Props**: None (Fetches data internally via `useRBACSummary`).

### RolePermissionEditor

Component to toggle permissions for a specific role.

- **Features**: Matrix view of permissions, Granular control (View/Edit/Delete scopes).
- **Props**: `RolePermissionEditorProps`

---

## Component Props

### `RolePermissionEditor`

(Uses type `RolePermissionEditorProps`)

| Prop             | Type                  | Required | Description                              |
| ---------------- | --------------------- | -------- | ---------------------------------------- |
| `role`           | `RoleWithPermissions` | ✅       | Role object with current permissions     |
| `allPermissions` | `Permission[]`        | ✅       | List of all available system permissions |

### `RBACSummaryResponse`

(Type returned by `useRBACSummary`)

```typescript
interface RBACSummaryResponse {
  departments: Department[];
  positions: Position[];
  roles: RoleWithPermissions[];
  permissions: Permission[];
  users: UserWithRoles[];
}
```

## Usage

```tsx
import { RBACConsole, RolePermissionEditor } from "@/modules/rbac";

// Main Page
<RBACConsole />

// Editor usage
<RolePermissionEditor
  role={selectedRole}
  allPermissions={permissionsList}
/>
```
