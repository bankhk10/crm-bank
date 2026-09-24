# Coding Standards - CRM System

> **Version**: 3.0.0
> **Updated**: 2026-08-28
> **Related**: [ARCHITECTURE.md](./ARCHITECTURE.md) | [AI_CONTEXT.md](./AI_CONTEXT.md) | [MODULE_ARCHITECTURE.md](./MODULE_ARCHITECTURE.md)

---

## 1. Core Principles

The following principles are mandatory across the project:

1. Follow the project-wide architecture.
2. Reuse existing project patterns before creating new patterns.
3. Keep all modules architecturally consistent.
4. Separate UI, server transport, business logic, and data access.
5. Do not bypass established architectural layers.
6. Do not introduce new architectural layers without justification.
7. Do not modify unrelated code.
8. Prefer simple solutions that follow established conventions.
9. Preserve existing behavior outside the requested scope.
10. Validate the implementation before considering the task complete.

The objective is:

> **Same architecture, different domain.**

Modules may contain different business rules and features, but their architectural responsibilities and dependency direction must remain consistent.

---

## 2. Existing Pattern First

Before creating or modifying code, inspect the existing project.

MUST:

1. Inspect the target module.
2. Search for similar existing implementations.
3. Check existing shared components.
4. Check existing hooks and utilities.
5. Check existing Server Action patterns.
6. Check existing application/business logic patterns.
7. Check existing repository patterns.
8. Check similar modules when applicable.
9. Reuse an existing pattern whenever reasonably possible.

Do NOT create a new implementation when an existing project implementation can reasonably satisfy the requirement.

Do NOT introduce a new architecture simply because it is common in another project.

If the existing pattern cannot satisfy the requirement, explain the reason before introducing a new architectural approach.

---

## 3. Module Architecture Contract

Every module under `modules/` MUST follow the project Module Architecture Contract.

The authoritative module architecture is documented in:

`docs/MODULE_ARCHITECTURE.md`

Standard structure:

```text
modules/<module-name>/
├── application/
├── features/
├── infrastructure/
├── server/
├── types/
├── ui/
├── constants.ts
├── index.ts
└── README.md
```

Not every module needs every folder or file.

Create only what the module actually requires.

Do NOT:

- Create empty folders.
- Create placeholder files without a purpose.
- Add architectural layers that are not defined by the project.
- Create a different architecture for each module.

The requirement is **architectural consistency**, not identical file counts.

---

## 4. Module Layer Responsibilities

### 4.1 `features/`

Responsible for user-facing UI and feature-specific presentation behavior.

Typical structure:

```text
features/
├── list-view/
├── form/
└── detail-view/
```

MUST NOT:

- Access the database directly.
- Import repositories directly.
- Contain database queries.
- Contain infrastructure logic.
- Bypass established server/application boundaries for mutations.

---

### 4.2 `server/`

Responsible for Server Actions and server-side transport concerns.

Typical structure:

```text
server/
└── actions.ts
```

Server Actions MUST remain thin and follow:

```text
Authentication
    ↓
Permission
    ↓
Application Logic
    ↓
Revalidation
```

Server Actions MUST NOT:

- Contain duplicated business logic.
- Contain direct database queries when repository/application layers are available.
- Become a second business-logic layer.
- Contain UI logic.

---

### 4.3 `application/`

Responsible for business logic and use-case orchestration.

Typical structure:

```text
application/
├── create-<module>.ts
├── update-<module>.ts
├── validations.ts
└── index.ts
```

May contain:

- Business rules.
- Validation.
- Uniqueness checks.
- Data mapping.
- Use-case orchestration.

MUST NOT contain:

- React components.
- UI presentation.
- Transport concerns.
- Authentication/authorization transport logic.
- Direct database client usage when repository access is available.

---

### 4.4 `infrastructure/`

Responsible for persistence and external data access.

Typical structure:

```text
infrastructure/
└── <module>.repository.ts
```

MUST:

- Handle database operations.
- Use the project's shared database client.
- Keep repository operations focused on data access.

MUST NOT:

- Contain authentication.
- Contain authorization.
- Contain business rules.
- Contain UI logic.
- Depend on presentation concerns.

---

### 4.5 `types/`

Contains module-specific TypeScript types.

Typical structure:

```text
types/
└── index.ts
```

Avoid duplicating equivalent types across multiple locations.

---

### 4.6 `ui/`

Contains reusable UI components that are specific to the module.

Examples:

```text
ui/
├── <module>-status-badge.tsx
└── <module>-type-badge.tsx
```

Before creating a module-specific reusable component, check:

`@/components/custom/`

for an existing shared component.

---

### 4.7 `constants.ts`

Contains constants that are specific to the module.

Do not put module-specific constants into unrelated global files.

---

### 4.8 `index.ts`

Acts as the module's public export entry point.

Expose only APIs that other parts of the application legitimately need.

Avoid unnecessary exports.

---

### 4.9 `README.md`

Every module MUST have a `README.md`.

The README should document, as appropriate:

- Module purpose.
- Main features.
- Architecture overview.
- Important business behavior.
- Important implementation notes.

Update the README when module structure, feature set, business behavior, or significant functionality changes.

Do not update it for trivial implementation-only changes that do not affect module behavior or structure.

---

## 5. Module Dependency Rules

The preferred dependency direction is:

```text
features/
    ↓
server/
    ↓
application/
    ↓
infrastructure/
    ↓
database
```

Rules:

- `features/` MUST NOT access the database directly.
- `features/` MUST NOT import repositories directly.
- `server/` imports from `application/`.
- `application/` imports from `infrastructure/`.
- `infrastructure/` uses the project's shared database client.
- Infrastructure MUST NOT depend on UI.
- Application MUST NOT depend on UI.
- No circular dependencies.
- No layer bypassing.

Shared types and genuinely shared utilities may be imported where appropriate without breaking architectural boundaries.

---

## 6. No New Architectural Layers

Do not introduce new architectural layers such as:

- `domain/`
- `services/`
- `controllers/`
- `repositories/`
- `use-cases/`
- `helpers/`
- `utils/`
- `lib/`
- `hooks/`

inside a module unless that layer is explicitly defined by the project's architecture.

This rule does not prohibit these concepts in general. It prevents each module from inventing its own architecture.

If a new layer appears necessary:

1. Check whether the existing architecture can satisfy the requirement.
2. Reuse the existing architecture if possible.
3. Explain why a new layer is necessary if it is genuinely required.
4. Do not silently introduce a new architectural pattern.

---

## 7. File Naming

Use `kebab-case` for files.

Examples:

```text
employee-form.tsx
employee-table.tsx
employee.repository.ts
create-employee.ts
update-employee.ts
date-utils.ts
```

Fixed names:

```text
server/actions.ts
application/validations.ts
types/index.ts
```

Pages use the project's existing Next.js conventions.

---

## 8. Symbol Naming

Use:

- `PascalCase` for classes.
- `PascalCase` for types and interfaces.
- `camelCase` for variables.
- `camelCase` for functions.
- `SCREAMING_SNAKE_CASE` for constants.

Example:

```ts
class CompanyRepository {}

interface CompanyInput {}

type CompanyStatus = "ACTIVE" | "INACTIVE";

const companyId = "";

function createCompany() {}

const DEFAULT_PAGE_SIZE = 20;
```

---

## 9. TypeScript Standards

Prefer explicit, meaningful types.

Avoid `any`.

Bad:

```ts
function processData(data: any) {
  return data;
}
```

Preferred:

```ts
interface ProcessDataInput {
  id: string;
  name: string;
}

function processData(data: ProcessDataInput): string {
  return data.name;
}
```

Use interfaces or types according to the established project convention.

Use enums or union types for fixed values according to the existing project pattern.

---

## 10. React Standards

Use functional React components with TypeScript.

Example:

```tsx
interface Props {
  companyId: string;
}

export function CompanyDetailView({ companyId }: Props) {
  return <div>{companyId}</div>;
}
```

Use `"use client"` only when client-side behavior requires it.

Do not add `"use client"` unnecessarily.

Keep presentation components focused on presentation.

---

## 11. UI Design - Mobile First

Use a Mobile-First approach with Tailwind CSS.

Start with the smallest viewport and progressively add responsive behavior.

Example:

```tsx
<div className="p-4 md:p-6 lg:p-8">
```

Grid example:

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

UI should be:

- Mobile-first.
- Responsive.
- Consistent with the project design system.
- Reusable where appropriate.

---

## 12. Shared Components

Before creating a new reusable component:

1. Search `@/components/custom/`.
2. Search similar implementations in the project.
3. Reuse an existing component when appropriate.
4. Create a new component only when the existing implementation cannot reasonably satisfy the requirement.

Known shared components include:

- `TruncatedCell`
- `ActionButton`
- `DetailItem`

Do not create duplicate implementations without a clear reason.

---

## 13. Database Standards

### 13.1 Shared Database Client

Use the project's shared database client from:

```ts
import { db } from "@/lib/db";
```

Do not create separate Prisma client instances inside modules.

---

### 13.2 Soft Delete

Entities that support deletion MUST follow the project's soft-delete convention.

Typical field:

```prisma
deletedAt DateTime?
```

Meaning:

```text
deletedAt = null
    → Active

deletedAt = date
    → Deleted
```

Queries for soft-deletable entities should exclude deleted records when appropriate:

```ts
where: {
  deletedAt: null,
}
```

Permanent deletion is not allowed unless explicitly required by the domain and project architecture.

---

### 13.3 Repository Responsibility

Repositories belong under:

```text
modules/<module-name>/infrastructure/
```

Repositories are responsible for database access only.

They MUST NOT contain:

- Authentication.
- Authorization.
- Business rules.
- UI logic.

---

## 14. Query Patterns

For soft-deletable records:

```ts
await db.customer.findMany({
  where: {
    deletedAt: null,
  },
});
```

For pagination:

```ts
const page = 1;
const limit = 20;

await db.customer.findMany({
  where: {
    deletedAt: null,
  },
  skip: (page - 1) * limit,
  take: limit,
  orderBy: {
    createdAt: "desc",
  },
});
```

When including relations, select only the fields required by the use case when practical.

---

## 15. Server Action Pattern

All module Server Actions must follow:

```text
Auth
→ Permission
→ Application
→ Revalidate
```

Example:

```ts
"use server";

import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { createCompanyUseCase } from "../application";

export async function createCompanyAction(data: CompanyInput) {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const permissionKeys = session.user.permissionKeys ?? [];

  if (!permissionKeys.includes("company.create")) {
    throw new Error("Forbidden");
  }

  const result = await createCompanyUseCase(data);

  revalidatePath("/companies");

  return result;
}
```

Server Actions must remain transport-focused.

---

## 16. Validation

Validate user input on the server.

Use the project's established Zod validation pattern.

Validation may include:

- Required fields.
- Data types.
- Formats.
- Length limits.
- Business constraints.
- Uniqueness requirements.

Do not rely only on client-side validation.

Shared validation schemas should live in:

```text
application/validations.ts
```

when that is consistent with the module architecture.

---

## 17. Transactions

Use Prisma transactions for multi-step writes that require atomicity.

Example:

```ts
await db.$transaction(async (tx) => {
  const company = await tx.company.create({
    data: companyData,
  });

  await tx.companyContact.createMany({
    data: contacts,
  });

  return company;
});
```

Use transactions when data integrity depends on multiple related operations succeeding together.

Do not use transactions unnecessarily for independent reads.

---

## 18. Data Flow

For data reads/writes, follow the established architectural flow.

### Read

```text
UI
 ↓
Server / Application
 ↓
Infrastructure / Repository
 ↓
Database
```

### Write

```text
UI
 ↓
Server Action
 ↓
Authentication
 ↓
Permission
 ↓
Application
 ↓
Validation / Business Rules
 ↓
Infrastructure / Repository
 ↓
Database
 ↓
Revalidation
```

Do not bypass layers for convenience.

---

## 19. Error Handling

Use the project's existing error-handling conventions.

Do not silently swallow errors.

Do not expose sensitive internal implementation details to clients.

Application/business errors should remain meaningful and consistent.

Example:

```ts
class BusinessError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400,
  ) {
    super(message);
  }
}
```

Use the existing project error pattern instead of creating a second error architecture.

---

## 20. Import Order

Use the project's established import ordering.

Preferred order:

```ts
// 1. External packages
import { z } from "zod";
import { revalidatePath } from "next/cache";

// 2. Absolute internal imports
import { db } from "@/lib/db";
import { createCompanyUseCase } from "@/modules/companies/application";

// 3. Relative imports
import { validateCompany } from "./validation";

// 4. Type-only imports
import type { Company } from "@prisma/client";
```

Keep import ordering consistent within each file.

---

## 21. Barrel Exports

Use `index.ts` as the module public API where appropriate.

Export only what external consumers need.

Do not expose internal implementation details unnecessarily.

Avoid importing through a barrel when a direct internal import is required to preserve the intended layer boundary.

---

## 22. Legacy Paths

Some legacy application patterns may remain in the project, such as:

```text
app/api/
app/actions/
```

Existing legacy functionality may continue to use these paths.

However:

- New module development should follow the current Module Architecture Contract.
- Do not migrate unrelated legacy code during a feature task.
- Legacy migration should be intentional and scoped.

---

## 23. Documentation Standards

Global project documentation belongs under:

```text
docs/
```

Module-specific documentation belongs under:

```text
modules/<module-name>/
```

and may use:

```text
modules/<module-name>/docs/
```

when detailed documentation is required.

Do not duplicate global standards inside individual modules.

Keep documentation consistent with the implementation.

---

## 24. Testing Standards

When modifying business logic, validation, database behavior, or significant UI behavior:

1. Check existing tests first.
2. Update or add tests when behavior changes.
3. Do not remove tests simply to make the implementation pass.
4. Run the relevant tests.
5. Run type checking.
6. Run linting when applicable.

Use the existing project testing conventions.

Do not introduce a new testing framework without justification.

---

## 25. Scope Control

Only modify what is required for the requested task.

Do NOT:

- Refactor unrelated modules.
- Rename unrelated files.
- Move unrelated files.
- Change global architecture without explicit reason.
- Change unrelated database schema.
- Add unnecessary dependencies.
- Perform unrelated cleanup.
- Rewrite working code without a clear need.

If an unrelated problem is discovered, report it separately instead of silently fixing it.

---

## 26. Module Creation Rules

When creating a new module:

1. Read the project coding standards.
2. Read the Module Architecture Contract.
3. Inspect similar existing modules and features.
4. Identify the required features.
5. Create only the required folders/files.
6. Implement using the established architecture.
7. Validate the module against the standards.
8. Update documentation when required.

No existing module is the permanent source of architectural truth.

The project standards and Module Architecture Contract define the architecture.

Existing modules are implementation references only.

---

## 27. Module Refactoring Rules

When refactoring an existing module:

1. Read the Module Architecture Contract.
2. Audit the current module.
3. Identify architectural deviations.
4. Preserve existing behavior.
5. Move responsibilities to the correct layers.
6. Update imports and exports.
7. Remove obsolete files only after checking references.
8. Update documentation.
9. Validate the result.

The objective is:

> Align the module with the project architecture without unnecessary behavioral changes.

---

## 28. Architecture Consistency

All modules should have the same architectural responsibilities.

Example:

```text
modules/
├── employee/
├── companies/
├── customers/
├── products/
├── activity-plans/
└── stock/
```

These modules may differ in domain behavior, but they should follow the same principles:

```text
features
server
application
infrastructure
types
ui
```

when applicable.

Do not create separate architectures for separate domains.

---

## 29. Final Validation

Before completing ANY coding task, perform a self-check.

### Architecture

- [ ] Correct module.
- [ ] Correct layer.
- [ ] Correct dependency direction.
- [ ] No layer bypass.
- [ ] No circular dependency.
- [ ] Existing pattern reused when appropriate.
- [ ] No unnecessary architectural layer introduced.

### Module Structure

- [ ] Module follows Module Architecture Contract.
- [ ] Only required folders/files were created.
- [ ] File naming is correct.
- [ ] `index.ts` is correct.
- [ ] `README.md` is updated when required.

### UI

- [ ] Mobile-first.
- [ ] Responsive.
- [ ] Existing shared components checked first.
- [ ] No duplicate components created unnecessarily.
- [ ] No direct database access from UI.

### Application

- [ ] Business logic is in application.
- [ ] Validation is in the correct layer.
- [ ] Uniqueness checks are handled where required.
- [ ] No duplicated business logic.

### Infrastructure

- [ ] Database access is in infrastructure.
- [ ] Repository is focused on data access.
- [ ] Soft delete is handled when applicable.
- [ ] Transaction is used when required.

### Server

- [ ] Authentication checked.
- [ ] Permission checked.
- [ ] Application logic called.
- [ ] Revalidation handled.
- [ ] No business logic duplicated.

### Security

- [ ] Authentication enforced.
- [ ] Authorization enforced.
- [ ] Input validated.
- [ ] Sensitive data not exposed.

### Code Quality

- [ ] Naming conventions followed.
- [ ] No unnecessary abstractions.
- [ ] No duplicate logic.
- [ ] No unrelated files changed.
- [ ] No unnecessary dependency added.

### Documentation

- [ ] Module README updated when required.
- [ ] Relevant module documentation updated.
- [ ] Global documentation updated when required.
- [ ] Documentation remains consistent with the implementation.

### Verification

- [ ] TypeScript/type check passes.
- [ ] Lint passes.
- [ ] Relevant tests pass.
- [ ] No broken imports.
- [ ] No broken references.

If any required validation fails, fix it before completing the task.

---

## 30. Critical Rules

The following rules are mandatory:

1. Follow the project-wide architecture.
2. Treat `docs/MODULE_ARCHITECTURE.md` as the module architecture authority.
3. Treat `docs/CODING_STANDARDS.md` as the coding standards authority.
4. Reuse existing patterns before creating new ones.
5. Do not use a specific existing module as the permanent architecture authority.
6. Do not introduce new architectural layers without justification.
7. Do not bypass layer boundaries.
8. Keep Server Actions thin.
9. Keep business logic in `application/`.
10. Keep database access in `infrastructure/`.
11. Keep UI separate from business logic and direct database access.
12. Preserve behavior during structural refactoring unless behavior change is explicitly required.
13. Do not modify unrelated code.
14. Do not consider a task complete until Final Validation has been performed.
