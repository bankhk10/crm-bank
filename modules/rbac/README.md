# RBAC Module

Role-Based Access Control module for managing roles, permissions, departments, positions, and user access assignments.

## Architecture

```
modules/rbac/
 ┣ features/                          ← UI screens
 ┃ ┣ detail-view/
 ┃ ┃ ┗ role-permission-editor.tsx     (Role permission assignment editor)
 ┃ ┗ list-view/
 ┃   ┗ rbac-console.tsx               (Main RBAC dashboard with tabs)
 ┃
 ┣ application/                       ← use cases (business logic)
 ┃ ┣ validations.ts                   (Zod schemas, shared client/server)
 ┃ ┗ index.ts                         (facade + inline thin use cases)
 ┃
 ┣ server/                            ← transport (server actions only)
 ┃ ┗ actions.ts
 ┃
 ┣ infrastructure/                    ← prisma / db access
 ┃ ┗ rbac.repository.ts
 ┃
 ┣ types/
 ┃ ┗ index.ts
 ┃
 ┣ constants.ts                       (access level options, group overrides)
 ┣ index.ts                           (barrel exports)
 ┗ README.md
```

## Layers

### Infrastructure (`infrastructure/rbac.repository.ts`)

- Pure Prisma/database operations only
- No business logic, no auth check, no validation
- Functions: `findRBACSummary`, `findAllRoles`, `createRole`, `updateRole`, `softDeleteRole`, etc.

### Application (`application/`)

- Business logic lives here: validation, uniqueness checks, data mapping
- `validations.ts` → Zod schemas shared between client forms and server
- `index.ts` → Facade with inline thin use cases + re-exports

### Server (`server/actions.ts`)

- `"use server"` directive only
- Each action: (1) Auth/Permission check → (2) Validate → (3) Call use case → (4) revalidatePath
- No business logic in actions

### Features (`features/`)

- `list-view/rbac-console.tsx` — Main RBAC dashboard with Roles, Permissions, Users, Organization tabs
- `detail-view/role-permission-editor.tsx` — Granular permission assignment per role

## Usage

```tsx
import { RBACConsole, RolePermissionEditor } from "@/modules/rbac";
```

## API Routes (kept for client-side fetch compatibility)

The RBAC console uses client-side `fetch()` for real-time CRUD operations.
API routes are thin wrappers that delegate to application layer use cases:

- `GET /api/rbac/summary` — Full RBAC summary
- `GET/POST /api/rbac/roles` — List/Create roles
- `PATCH/DELETE /api/rbac/roles/[roleId]` — Update/Delete role
- `PUT /api/rbac/roles/[roleId]/permissions` — Bulk update role permissions
- `GET/POST /api/rbac/permissions` — List/Create permissions
- `PATCH/DELETE /api/rbac/permissions/[id]` — Update/Delete permission
- `GET/POST /api/rbac/departments` — List/Create departments
- `PATCH/DELETE /api/rbac/departments/[id]` — Update/Delete department
- `GET/POST /api/rbac/positions` — List/Create positions
- `PATCH/DELETE /api/rbac/positions/[id]` — Update/Delete position
- `PUT /api/rbac/users/[userId]/roles` — Update user role assignments
- `PUT /api/rbac/users/[userId]/overrides` — Update user permission overrides
- `GET /api/rbac/catalog` — Catalog for dropdowns
