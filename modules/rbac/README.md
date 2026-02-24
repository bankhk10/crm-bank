# RBAC Module

Role-Based Access Control management module.

## Architecture

```
modules/rbac/
 ┣ infrastructure/
 ┃ ┗ rbac.repository.ts       ← Prisma database operations only
 ┃
 ┣ application/
 ┃ ┣ validations.ts           ← Zod schemas (shared client/server)
 ┃ ┗ index.ts                 ← Facade + inline use cases
 ┃
 ┣ server/
 ┃ ┗ actions.ts               ← "use server" thin actions (auth → use case → revalidate)
 ┃
 ┣ features/
 ┃ ┣ detail-view/
 ┃ ┃ ┗ role-permission-editor.tsx
 ┃ ┗ list-view/
 ┃   ┗ rbac-console.tsx
 ┃
 ┣ types/
 ┃ ┗ index.ts
 ┃
 ┣ constants.ts
 ┣ index.ts                   ← barrel exports
 ┗ README.md
```

## Layers

### Infrastructure (`infrastructure/rbac.repository.ts`)

- Pure Prisma database operations
- No business logic, auth checks, or validation
- Functions: `findRBACSummary`, `findRBACCatalog`, `findAllRoles`, `createRole`, `updateRole`, `softDeleteRole`, `findAllPermissions`, `createPermission`, `updatePermission`, `softDeletePermission`, `findAllDepartments`, `createDepartment`, `updateDepartment`, `softDeleteDepartment`, `findAllPositions`, `createPosition`, `updatePosition`, `softDeletePosition`, `upsertRolePermissions`, `updateUserRoles`, `updateUserPermissionOverrides`

### Application (`application/`)

- Business logic: validation, uniqueness checks, data mapping
- `validations.ts` — Zod schemas shared between client forms and server
- `index.ts` — Facade + inline use cases (get summary, list, create, update, delete)

### Server (`server/actions.ts`)

- `"use server"` directive
- (1) Auth/Permission check, (2) Call use case, (3) revalidatePath
- No business logic

### Features (`features/`)

- `list-view/rbac-console.tsx` — Main RBAC admin console with tabs (Roles, Users, Organization)
- `detail-view/role-permission-editor.tsx` — Per-role permission toggle editor

## Notes

- `src/core/rbac/` contains cross-cutting RBAC utilities (permission map building, route authorization, etc.) used throughout the app (middleware, sidebar, proxy)
- API routes under `app/api/rbac/` are retained for backward compatibility with modules that still use `fetch()` (e.g., employee form)
- UI components use server actions for all mutations
