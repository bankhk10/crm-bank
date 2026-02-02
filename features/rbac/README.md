# RBAC Feature

This module handles Role-Based Access Control (RBAC) functionalities, including managing roles, permissions, departments, positions, and user access levels.

## Directory Structure

- `_components/`: UI components (Console, Permission Editor).
- `_hooks/`: Custom hooks (RBAC data fetching).
- `_lib/`: Schemas and utilities (Zod validation).
- `_types/`: TypeScript definitions specific to RBAC.

## Usage

### Components

```tsx
import { RBACConsole, RolePermissionEditor } from "@/features/rbac";

// Use directly in pages
<RBACConsole />
<RolePermissionEditor role={...} allPermissions={...} />
```

### Hooks

```tsx
import { useRBACSummary } from "@/features/rbac";

const { summary, isLoading, fetchSummary, sortedRoles } = useRBACSummary();
```

### Types & Schemas

```tsx
import { 
  RBACSummaryResponse, 
  RoleWithPermissions,
  roleSchema 
} from "@/features/rbac";
```

## Routes

- `/rbac`: Main RBAC console.
- `/rbac/roles/[id]`: Edit role permissions.

## Permissions

- `menu.rbac`: Access to RBAC management.
- `rbac.manage`: Full RBAC management access.
- `rbac.roles`: Manage roles.
- `rbac.permissions`: Manage permissions.

## Dependencies

- `@/components/ui`: UI primitives.
- `@/src/infrastructure/database`: Prisma types.
- `zod`: Form validation.
- `react-hook-form`: Form state management.
