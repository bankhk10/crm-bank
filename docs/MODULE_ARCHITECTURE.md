# Module Architecture - CRM System

> **Version**: 1.0.0  
> **Updated**: 2026-08-28  
> **Related**: [ARCHITECTURE.md](./ARCHITECTURE.md) | [CODING_STANDARDS.md](./CODING_STANDARDS.md)

---

## 1. Purpose

This document defines the standard architecture for every business module under:

```text
modules/
```

The purpose is to ensure that all modules use the same:

- Layer responsibilities
- Dependency direction
- Naming conventions
- Structural conventions
- Data flow
- Development approach

Modules may have different business domains, features, data models, and business rules.

However:

> **All modules must follow the same architectural principles.**

The architecture is defined by this document and the project's coding standards.

No individual module is the permanent architectural authority.

---

## 2. Standard Module Structure

The standard module structure is:

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

Not every module must contain every folder or file.

Create only the folders and files that are required by the module.

Do NOT create empty folders or placeholder files only to make the tree look identical.

The requirement is:

> **Same architecture, different domain.**

---

## 3. Layer Overview

The standard module layers are:

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

Each layer has one primary responsibility.

| Layer | Responsibility |
|---|---|
| `features/` | UI, user interaction, presentation |
| `server/` | Server Actions, authentication, authorization, revalidation |
| `application/` | Business logic, validation, use-case orchestration |
| `infrastructure/` | Database and persistence access |
| `types/` | Module-specific TypeScript types |
| `ui/` | Reusable UI components specific to the module |
| `constants.ts` | Module-specific constants |
| `index.ts` | Public module exports |
| `README.md` | Module documentation |

---

## 4. `features/`

The `features/` layer contains user-facing screens and feature-specific UI behavior.

Typical structure:

```text
features/
├── list-view/
├── form/
└── detail-view/
```

Use only the screen types that the module actually requires.

### Responsibilities

`features/` may contain:

- React components
- Screen layouts
- User interaction
- Local UI state
- Loading presentation
- Error presentation
- Empty states
- UI-specific composition

### Restrictions

`features/` MUST NOT:

- Access the database directly.
- Import repositories directly.
- Contain Prisma queries.
- Contain persistence logic.
- Contain infrastructure logic.
- Duplicate business logic.
- Bypass the established server/application flow for mutations.

---

## 5. `features/list-view/`

When a module has a list screen, use:

```text
features/
└── list-view/
```

Typical files may include:

```text
list-view/
├── <module>-list-view.tsx
├── <module>-table.tsx
├── use-<module>-columns.tsx
└── use-<module>-list.ts
```

Create only the files that are actually needed.

### Responsibilities

The list feature should separate:

- Screen/container behavior
- State management
- Data/action coordination
- Presentation

Avoid putting business rules into table components.

When a list contains actions such as delete, the component responsible for the relevant interaction/state should coordinate the action according to the established project pattern.

---

## 6. `features/form/`

When a module has create/edit forms:

```text
features/
└── form/
```

Typical structure:

```text
form/
├── <module>-new-view.tsx
├── <module>-edit-view.tsx
├── <module>-form-wrapper.tsx
└── <module>-form.tsx
```

Create only the components required by the module.

Form UI is responsible for:

- Rendering fields
- User interaction
- Client-side presentation
- Showing validation feedback
- Loading/pending states

Business validation and business rules must remain in the appropriate application/server layers.

---

## 7. `features/detail-view/`

When a module has a detail screen:

```text
features/
└── detail-view/
    └── <module>-detail-view.tsx
```

The detail view is responsible for presenting data.

It must not perform direct database access.

---

## 8. `server/`

The `server/` layer is the transport boundary for module Server Actions.

Typical structure:

```text
server/
└── actions.ts
```

Server Actions must remain thin.

The standard flow is:

```text
Authentication
    ↓
Permission
    ↓
Application
    ↓
Revalidation
```

### Responsibilities

The server layer may handle:

- Authentication
- Authorization/permission checks
- Request/transport coordination
- Calling application use cases
- Cache/path revalidation

### Restrictions

`server/` MUST NOT:

- Contain complex business logic.
- Duplicate application logic.
- Access the database directly when the application/infrastructure architecture should be used.
- Become a second business-logic layer.
- Contain UI logic.

---

## 9. `application/`

The `application/` layer contains business logic and use-case orchestration.

Typical structure:

```text
application/
├── create-<module>.ts
├── update-<module>.ts
├── validations.ts
└── index.ts
```

Create only the files required by the module.

### Responsibilities

`application/` may contain:

- Business rules
- Validation
- Uniqueness checks
- Data mapping
- Use-case orchestration
- Application-specific transformations

### Complex Use Cases

Complex operations should be separated into dedicated files.

Examples:

```text
create-<module>.ts
update-<module>.ts
```

### Thin Operations

Simple operations may be exposed through `index.ts` when that matches the established project pattern.

### Restrictions

`application/` MUST NOT:

- Contain React components.
- Contain UI presentation logic.
- Depend on UI.
- Contain transport-specific concerns.
- Perform direct database client access when repository access is available.

---

## 10. `application/validations.ts`

Validation that belongs to the application's business rules should be located in:

```text
application/validations.ts
```

Use Zod according to the project's established patterns.

Validation should cover, when applicable:

- Required fields
- Types
- Formats
- Length limits
- Business constraints
- Uniqueness requirements

Server-side validation is mandatory for mutations.

Client-side validation does not replace server-side validation.

---

## 11. `infrastructure/`

The `infrastructure/` layer is responsible for persistence and external data access.

Typical structure:

```text
infrastructure/
└── <module>.repository.ts
```

### Responsibilities

Infrastructure may contain:

- Database queries
- Database writes
- Repository operations
- Persistence-specific mapping
- External data access when explicitly part of the module's infrastructure

### Restrictions

Infrastructure MUST NOT contain:

- UI logic
- Authentication
- Authorization
- Business rules
- Presentation logic

Repository functions should remain focused on data access.

---

## 12. Repository Pattern

A repository should expose focused data operations appropriate to the module.

Typical operations may include:

```text
find<Module>ById
findAll<Modules>
create<Module>
update<Module>
softDelete<Module>
```

The exact function set depends on the module.

Do not create functions that are not needed.

Use the shared database client:

```ts
import { db } from "@/lib/db";
```

Do not create a separate Prisma client inside a module.

---

## 13. Soft Delete

Entities that support deletion should follow the project's soft-delete convention.

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

Permanent deletion is not allowed unless it is explicitly required by the domain and approved architecture.

---

## 14. `types/`

The `types/` folder contains module-specific TypeScript types.

Typical structure:

```text
types/
└── index.ts
```

Types should be placed here when they are specific to the module and shared by multiple parts of that module.

Do not create duplicate definitions for the same concept in multiple places.

Use existing project types when they already represent the required data.

---

## 15. `ui/`

The `ui/` layer contains reusable UI components that are specific to the module.

Examples:

```text
ui/
├── <module>-status-badge.tsx
└── <module>-type-badge.tsx
```

Before creating a module-specific component:

1. Check `@/components/custom/`.
2. Search for an existing implementation.
3. Reuse a shared component when appropriate.
4. Create a module-specific component only when the component truly belongs to that module.

Do not duplicate project-wide components inside a module.

---

## 16. `constants.ts`

Module-specific constants belong in:

```text
constants.ts
```

Examples may include:

- Module-specific limits
- Module-specific labels
- Configuration values
- Fixed domain values

Do not move a value into global constants merely because it is convenient.

Do not put global values into module constants if they are genuinely shared across the application.

---

## 17. `index.ts`

Each module may use:

```text
index.ts
```

as its public export entry point.

Example:

```text
modules/
└── companies/
    └── index.ts
```

Only expose APIs that other parts of the application should legitimately consume.

Avoid exporting every internal implementation detail.

Examples of public exports may include:

- Public types
- Public constants
- Public application APIs
- Public module-specific UI components

---

## 18. `README.md`

Every module MUST have:

```text
README.md
```

The README should document:

- Module purpose
- Main features
- High-level architecture
- Important business behavior
- Important implementation notes

Update the README when there are meaningful changes to:

- Module structure
- Features
- Business behavior
- Important implementation details

Do not update it for trivial code changes that do not affect the module's behavior or structure.

---

## 19. Dependency Rules

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

- `features/` MUST NOT import infrastructure directly.
- `features/` MUST NOT access the database directly.
- `features/` MUST NOT import repositories directly.
- `server/` imports application APIs.
- `application/` imports infrastructure/repository APIs.
- `infrastructure/` uses the shared database client.
- `infrastructure/` MUST NOT depend on UI.
- `application/` MUST NOT depend on UI.
- Avoid circular dependencies.
- Do not bypass layers for convenience.

Shared types and genuinely shared utilities may be used when they do not violate these boundaries.

---

## 20. Public vs Internal Module APIs

Prefer module boundaries that make responsibilities clear.

External consumers should normally depend on:

```text
modules/<module-name>/index.ts
```

when a public API is required.

Internal files may use relative imports within the same layer/module when appropriate.

Do not create unnecessary cross-module dependencies.

When one module needs another module:

- Depend only on the public API needed.
- Do not reach deeply into the other module's internal implementation unless the architecture explicitly permits it.

---

## 21. Cross-Module Dependencies

Modules may depend on other modules when business requirements require it.

However:

- The dependency must be intentional.
- Avoid circular module dependencies.
- Do not duplicate another module's business rules.
- Prefer consuming a module's public API.
- Keep ownership of business logic in the module that owns the domain concept.

Example:

```text
sales
  ↓
customers
```

is valid when Sales genuinely needs Customer information.

However, Sales should not copy Customer business rules into the Sales module.

---

## 22. Shared Components and Utilities

Use project-wide shared resources when the behavior is genuinely shared.

Shared UI:

```text
components/custom/
components/ui/
```

Shared infrastructure utilities:

```text
lib/
```

Do not move module-specific code into global folders merely to reduce the number of files inside a module.

Promotion from module-specific to shared code should be based on real reuse, not anticipated reuse.

---

## 23. Data Flow

### Read Flow

A typical read flow is:

```text
UI
 ↓
Server / Application
 ↓
Infrastructure / Repository
 ↓
Database
```

### Write Flow

A typical write flow is:

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

The exact implementation may vary by operation, but the responsibilities of each layer must remain consistent.

---

## 24. Server Action Rules

For protected mutations, the standard flow is:

```text
Auth
→ Permission
→ Application
→ Revalidate
```

Example:

```ts
"use server";

export async function createCompanyAction(data: CompanyInput) {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // Permission check

  const result = await createCompanyUseCase(data);

  revalidatePath("/companies");

  return result;
}
```

Do not put business rules into `actions.ts`.

---

## 25. Transactions

Use database transactions when multiple writes must succeed or fail together.

Example:

```ts
await db.$transaction(async (tx) => {
  // Multiple related writes
});
```

Transactions should be used when required for data integrity.

Do not use them unnecessarily for independent operations.

---

## 26. Error Handling

Use the existing project error-handling pattern.

Do not create a different error architecture for a single module.

Errors should:

- Preserve useful information for debugging.
- Avoid exposing sensitive internal implementation details.
- Remain consistent across application and server layers.

Business errors should be raised from the appropriate business/application layer.

---

## 27. Module Creation Standard

When creating a new module:

### Step 1 — Understand Requirement

Identify:

- Module purpose
- Required screens
- User flows
- Data requirements
- Business rules
- Required actions

### Step 2 — Read Standards

Read:

```text
.agents/skills/crm-coding-standards/SKILL.md
docs/ARCHITECTURE.md
docs/MODULE_ARCHITECTURE.md
```

when available and applicable.

### Step 3 — Inspect Existing Patterns

Search the codebase for:

- Similar modules
- Similar screens
- Similar forms
- Similar list views
- Similar repositories
- Similar Server Actions
- Similar business logic
- Shared components

Existing modules are implementation references.

They are NOT the permanent source of architectural truth.

### Step 4 — Define Structure

Create only the required structure under:

```text
modules/<module-name>/
```

### Step 5 — Implement

Implement according to the architecture.

### Step 6 — Validate

Perform the module validation checklist.

### Step 7 — Document

Update:

```text
modules/<module-name>/README.md
```

when required.

---

## 28. Module Refactoring Standard

When refactoring an existing module:

1. Read the Module Architecture Contract.
2. Audit the current structure.
3. Identify responsibilities of existing files.
4. Map each responsibility to the correct layer.
5. Preserve existing behavior.
6. Move code to the correct layer.
7. Update imports and exports.
8. Remove obsolete files only after checking all references.
9. Update module documentation.
10. Run validation.

Do not change the project architecture to match a legacy module.

Refactor the legacy module toward the current architecture.

---

## 29. No Architecture by Module

The following is NOT allowed:

```text
employee/
  → architecture A

companies/
  → architecture B

products/
  → architecture C
```

All modules must follow the same architecture:

```text
features
server
application
infrastructure
types
ui
```

when applicable.

The domain may differ.

The architecture must not.

---

## 30. No Silent Architecture Changes

Do not silently introduce:

- New layers
- New dependency directions
- New repository patterns
- New service architectures
- New transport architectures
- New validation architectures
- New state-management architectures

If the existing architecture cannot support a legitimate requirement:

1. Document the limitation.
2. Explain why the existing pattern is insufficient.
3. Propose the smallest necessary architectural change.
4. Update the architecture documentation before broadly adopting the new pattern.

---

## 31. Existing Module Migration

Existing modules may not perfectly match the current architecture.

The migration principle is:

```text
Existing Module
      ↓
Audit
      ↓
Compare with Contract
      ↓
Identify Deviations
      ↓
Refactor
      ↓
Validate
```

Do not perform broad migrations during unrelated feature work.

Migrations should be intentional and scoped.

---

## 32. Validation Checklist

Before considering a module complete or a module refactor complete:

### Structure

- [ ] Module follows the Module Architecture Contract.
- [ ] Only required folders exist.
- [ ] Only required files exist.
- [ ] Naming is consistent.

### Layers

- [ ] UI is in `features/` or module `ui/`.
- [ ] Server Actions are in `server/`.
- [ ] Business logic is in `application/`.
- [ ] Database access is in `infrastructure/`.
- [ ] Module types are in `types/`.

### Dependencies

- [ ] Dependency direction is correct.
- [ ] No layer bypass.
- [ ] No circular dependency.
- [ ] No direct database access from UI.

### Database

- [ ] Repository pattern is used.
- [ ] Soft Delete is handled when applicable.
- [ ] Transactions are used when required.

### Server

- [ ] Authentication is checked.
- [ ] Permission is checked.
- [ ] Application logic is called.
- [ ] Revalidation is handled.
- [ ] Business logic is not duplicated in Server Actions.

### UI

- [ ] Mobile-first design is used.
- [ ] Shared components were checked before creating new ones.
- [ ] No unnecessary duplicate components exist.
- [ ] Loading/error/empty states are handled where required.

### Code Quality

- [ ] Naming conventions are followed.
- [ ] No unnecessary abstraction.
- [ ] No unnecessary new architecture.
- [ ] No unrelated code was modified.

### Documentation

- [ ] Module README exists.
- [ ] README reflects meaningful module changes.
- [ ] Relevant documentation is updated.

### Verification

- [ ] Type check passes.
- [ ] Lint passes.
- [ ] Relevant tests pass.
- [ ] No broken imports.
- [ ] No broken references.

---

## 33. Architectural Authority

The project uses the following hierarchy:

```text
Project Architecture
        ↓
docs/ARCHITECTURE.md

Module Architecture Contract
        ↓
docs/MODULE_ARCHITECTURE.md

Coding Rules
        ↓
docs/CODING_STANDARDS.md

AI Executable Rules
        ↓
.agents/skills/crm-coding-standards/SKILL.md

Development Workflows
        ↓
.agents/workflows/
```

When documents overlap:

1. Follow the appropriate Source of Truth.
2. Do not create conflicting rules.
3. Update dependent documentation when the architecture changes.

---

## 34. Final Principle

The objective of the module architecture is not to make every module identical.

The objective is to make every module:

- Predictable
- Consistent
- Maintainable
- Easy to understand
- Easy for AI Agents to work with
- Easy to refactor
- Consistent in data flow
- Consistent in dependency direction

while allowing each module to implement its own domain-specific requirements.

> **One architecture.  
> Multiple domains.**
