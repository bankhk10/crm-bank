---
name: crm-coding-standards
description: Enforces the core CRM project coding standards, architecture, and best practices. Use this skill WHENEVER generating, modifying, or reviewing code for this project.
---

# CRM Coding Standards & Best Practices

When writing or modifying code in this project, you MUST strictly adhere to the following rules derived from `docs/CODING_STANDARDS.md`.

## 1. UI Design (Mobile-First)
- **Always** use a Mobile-First approach with Tailwind CSS.
- Start with mobile classes and scale up using breakpoints (`md:`, `lg:`).
- Example: `<div className="p-4 md:p-6 lg:p-8">`
- Grid Example: `<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">`
- **Use Shared Components**: Always check and use project-wide shared components from `@/components/custom/` first:
  - `TruncatedCell` for table cell truncation.
  - `ActionButton` for actions with pending/loading states.
  - `DetailItem` for showing label/value details.

## 2. Database & Repository (Soft Delete)
- **Soft Delete is Mandatory**: Never permanently delete records. Always use and check `deletedAt`.
- **Querying**: Always filter out soft-deleted records in queries (`where: { deletedAt: null }`).
- **Prisma Client**: Import `db` (and Prisma types/enums) from `@/lib/db` (e.g., `import { db } from "@/lib/db";`).
- **Responsibility**: Repositories (`infrastructure/`) must handle pure DB operations ONLY (no auth, no validation).

## 3. Architecture & Layers
Adhere to the strict module layer pattern (`modules/[MODULE_NAME]/`):
- `infrastructure/`: Database access only (`@/lib/db`).
- `application/`: Business logic, validation (`zod`), uniqueness checks.
- `server/`: Transport layer, Server Actions (`"use server"`).
- `features/`: UI screens (list, form, detail).

### Dependency Rules:
- UI (`features/`) imports from `server/actions.ts` and `application/validations.ts`.
- Server Actions (`server/`) import from `application/`.
- Application (`application/`) imports from `infrastructure/`.
- Infrastructure (`infrastructure/`) imports from `@/lib/db` only.
- **NO** circular imports or bypassing layers.

## 4. Server Actions Pattern
Every server action MUST follow these 4 steps sequentially:
1. **Auth check**: Verify the user session (`auth()`).
2. **Permission check**: Verify user has the required permission key.
3. **Business Logic**: Call the application use-case.
4. **Revalidate**: Revalidate the appropriate cache path (`revalidatePath()`).

## 5. Coding & Naming Conventions
### File Naming:
- Components, Repositories, Use Cases, Utils: `kebab-case` (e.g., `employee-form.tsx`, `employee.repository.ts`).
- Server Actions: Fixed name `actions.ts`.
- Validations: Fixed name `validations.ts`.
- Types Files: `index.ts` or `kebab-case.ts` (within `types/` folder).

### Symbol Naming:
- Classes, Types/Interfaces: `PascalCase` (e.g., `EmployeeInput`).
- Variables/Functions: `camelCase`.
- Constants: `SCREAMING_SNAKE_CASE`.

## 6. Transactions
- Use Prisma `$transaction` for any multi-step database write operations to ensure data integrity.

> **CRITICAL**: Before you complete your task, do a self-check. Did you follow the Mobile-First UI pattern? Did you handle `deletedAt` for database operations? Did you put the file in the correct architectural layer?
