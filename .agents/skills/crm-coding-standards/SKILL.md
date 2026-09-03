---
name: crm-coding-standards
description: Enforces the core CRM project coding standards, architecture, module structure, and development practices. Use this skill WHENEVER generating, modifying, refactoring, or reviewing code for this project.
---

# CRM Coding Standards & Best Practices

This skill defines the mandatory coding, architecture, module structure, and development standards for this project.

When writing, modifying, refactoring, or reviewing code in this project, you MUST follow these rules.

The goal is to keep every module consistent, predictable, maintainable, and aligned with the same project-wide architecture.

---

# 1. Core Principles

The following principles are mandatory:

1. Follow the existing project architecture.
2. Reuse existing project patterns before creating new patterns.
3. Keep all modules structurally consistent.
4. Separate UI, business logic, server transport, and data access.
5. Do not bypass architectural layers.
6. Do not introduce new architectural patterns without justification.
7. Do not modify unrelated code.
8. Prefer simple solutions that follow existing conventions.
9. Preserve existing behavior outside the requested scope.
10. Before completing a task, perform the required self-validation.

---

# 2. Existing Pattern First

Before creating or modifying code, you MUST inspect the existing codebase.

You MUST:

1. Inspect the target module.
2. Search for existing implementations with similar behavior.
3. Check existing shared components.
4. Check existing utilities and hooks.
5. Check existing Server Action patterns.
6. Check existing application/business logic patterns.
7. Check existing repository patterns.
8. Check similar modules when applicable.
9. Reuse an existing project pattern whenever possible.

Do NOT create a new implementation when an existing project implementation can reasonably satisfy the requirement.

Do NOT introduce a new architectural pattern simply because another architecture is commonly used elsewhere.

If the existing project pattern cannot satisfy the requirement, explain the reason before introducing a new architectural approach.

---

# 3. Module Architecture Contract

Every module under `modules/` MUST follow the same project architecture.

The standard module structure is:

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

These folders/files are created only when they are actually required by the module.

Do NOT create empty or unnecessary folders/files just to match the structure.

The important requirement is architectural consistency, not identical file counts.

---

# 4. Module Layer Responsibilities

Each module layer has a specific responsibility.

## 4.1 features/

Responsible for user-facing UI and feature-specific UI behavior.

Examples:

features/
├── list-view/
├── form/
└── detail-view/

`features/` MUST NOT:

- Access the database directly.
- Import repositories directly.
- Contain database queries.
- Contain infrastructure logic.
- Bypass the server/application layers for data mutations.

---

## 4.2 application/

Responsible for business logic, validation, and application use cases.

Examples:

application/
├── create-<module>.ts
├── update-<module>.ts
├── validations.ts
└── index.ts

`application/` MAY contain:

- Business rules.
- Validation.
- Uniqueness checks.
- Use-case orchestration.
- Domain/application transformations.

`application/` MUST NOT contain:

- UI code.
- React components.
- Authentication transport concerns.
- Direct database client usage when repository access is available.

---

## 4.3 infrastructure/

Responsible for database and external data access.

Example:

infrastructure/
└── <module>.repository.ts

Infrastructure MUST:

- Handle database operations.
- Use the project's database access pattern.
- Keep repository operations focused and predictable.

Infrastructure MUST NOT:

- Contain UI logic.
- Perform authentication.
- Perform authorization.
- Contain business rules.
- Contain feature-specific presentation logic.

---

## 4.4 server/

Responsible for Server Actions and server-side transport concerns.

Example:

server/
└── actions.ts

Server Actions MUST:

1. Verify authentication.
2. Verify required permissions.
3. Call the appropriate application logic.
4. Revalidate the appropriate cache/path.

The Server layer MUST NOT duplicate business logic that belongs in `application/`.

---

## 4.5 types/

Contains module-specific TypeScript types.

Example:

types/
└── index.ts

Types should be shared across layers when appropriate without creating unnecessary dependencies or circular references.

---

## 4.6 ui/

Contains reusable UI components that are specific to the module.

Examples:

ui/
├── <module>-status-badge.tsx
└── <module>-type-badge.tsx

Shared components used across multiple modules SHOULD be placed in the project's shared component location instead of being duplicated inside individual modules.

---

## 4.7 constants.ts

Contains constants that are specific to the module.

Do NOT place module-specific constants into unrelated global files.

---

## 4.8 index.ts

Acts as the public export entry point for the module.

Expose only the module APIs that should be consumed externally.

Avoid unnecessary exports.

---

## 4.9 README.md

Every module MUST have a `README.md`.

The README should provide a concise overview of:

- Module purpose.
- Main features.
- Important architecture/layer information.
- Important business behavior.
- Important implementation notes when necessary.

Update the README when module structure, feature set, behavior, or significant functionality changes.

Do NOT update the README for trivial implementation changes that do not affect module behavior or structure.

---

# 5. Module Dependency Rules

The dependency direction MUST remain consistent.

The preferred dependency flow is:

features/
↓
server/
↓
application/
↓
infrastructure/
↓
database

Rules:

- `features/` MUST NOT access the database directly.
- `features/` MUST NOT import repositories.
- `features/` SHOULD NOT import application use-cases directly.
- `server/` imports from `application/`.
- `application/` imports from `infrastructure/`.
- `infrastructure/` imports the database client from `@/lib/db`.
- Infrastructure MUST NOT depend on UI.
- Application MUST NOT depend on UI.
- Server MUST NOT contain duplicated business logic.
- No circular dependencies.
- No layer bypassing.

Shared types and truly shared utilities may be imported where appropriate without violating architectural boundaries.

---

# 6. Do Not Introduce New Architectural Layers

The following folders MUST NOT be introduced into a module unless the project architecture explicitly defines them:

- `domain/`
- `services/`
- `controllers/`
- `repositories/`
- `use-cases/`
- `helpers/`
- `utils/`
- `lib/`
- `hooks/`

This does not mean these concepts can never exist.

It means a new architectural layer MUST NOT be created automatically.

If a new layer appears necessary:

1. Check whether the existing architecture can support the requirement.
2. Reuse the existing architecture if possible.
3. If it cannot, explain the reason.
4. Do not silently introduce a new architecture.

---

# 7. UI Design - Mobile First

Always use a Mobile-First approach with Tailwind CSS.

Start with mobile classes and scale up using responsive breakpoints such as:

- `sm:`
- `md:`
- `lg:`
- `xl:`

Example:

```tsx
<div className="p-4 md:p-6 lg:p-8">
```
