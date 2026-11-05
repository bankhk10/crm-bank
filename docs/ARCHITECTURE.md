# Architecture - CRM System

> **Version**: 3.0.0  
> **Updated**: 2026-08-28  
> **Related**: [AI_CONTEXT.md](./AI_CONTEXT.md) | [CODING_STANDARDS.md](./CODING_STANDARDS.md) | [MODULE_ARCHITECTURE.md](./MODULE_ARCHITECTURE.md)

---

# 1. System Overview

The CRM system follows a modular layered architecture.

The system is divided into:

1. Application Layer
2. Module Layer
3. Data Layer
4. Shared Infrastructure

The primary application flow is:

```text
User
  ↓
Next.js UI
  ↓
Module Features
  ↓
Server Actions
  ↓
Application / Business Logic
  ↓
Infrastructure / Repository
  ↓
Prisma
  ↓
PostgreSQL
```

High-level architecture:

```text
┌───────────────────────────────────────────────────────────────────────┐
│                           CLIENT / UI                                │
│                     Next.js + React + Tailwind                       │
│                         Mobile-First                                │
└──────────────────────────────────┬────────────────────────────────────┘
                                   │
                                   ▼
┌───────────────────────────────────────────────────────────────────────┐
│                         MODULE LAYER                                 │
│                                                                       │
│  ┌────────────┐    ┌────────────┐    ┌─────────────┐                 │
│  │  features/ │ →  │  server/   │ →  │ application/│                 │
│  │    UI      │    │  Actions   │    │ Business    │                 │
│  └────────────┘    └────────────┘    └──────┬──────┘                 │
│                                              │                        │
│                                              ▼                        │
│                                      ┌───────────────┐                │
│                                      │ infrastructure│                │
│                                      │  Repository   │                │
│                                      └───────┬───────┘                │
└─────────────────────────────────────────────┼────────────────────────┘
                                              │
                                              ▼
┌───────────────────────────────────────────────────────────────────────┐
│                           DATA LAYER                                  │
│                    Prisma + PostgreSQL                                │
└───────────────────────────────────────────────────────────────────────┘
```

---

# 2. Architecture Principles

The following principles apply across the entire project.

## 2.1 Modular Architecture

Business domains are organized under:

```text
modules/
```

Each module is responsible for its own:

- UI features
- Business logic
- Server actions
- Data access
- Module-specific types
- Module-specific UI
- Documentation

---

## 2.2 Consistent Module Architecture

Every module MUST follow the same architectural principles and dependency direction.

Modules may differ in:

- Business rules
- Features
- Data relationships
- Required components
- Domain-specific logic

However, their architectural responsibilities MUST remain consistent.

The project MUST NOT create a different layer architecture for each module.

The standard module architecture is defined in:

```text
docs/MODULE_ARCHITECTURE.md
```

This document defines the structure and responsibilities of module layers.

---

## 2.3 Separation of Concerns

Each layer has one primary responsibility.

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

Responsibilities:

```text
features/
    UI and user interaction

server/
    Authentication
    Authorization
    Server transport
    Revalidation

application/
    Business logic
    Validation
    Use-case orchestration

infrastructure/
    Database access
    Repository operations

database/
    Persistent data
```

---

# 3. Tech Stack

| Layer          | Technology                                   |
| -------------- | -------------------------------------------- |
| Frontend       | Next.js 16.1.5, React 19.2.0, Tailwind CSS 4 |
| UI Components  | shadcn/ui, Radix UI, Lucide Icons            |
| Backend        | Next.js Server Actions + API Routes (legacy) |
| ORM            | Prisma 7.x                                   |
| Database       | PostgreSQL 15+                               |
| Authentication | NextAuth.js v5                               |
| Authorization  | Custom RBAC                                  |
| Container      | Docker + Docker Compose                      |

---

# 4. Project Folder Structure

```text
crm-bank/
├── .agents/                         # AI Agent configuration
│   ├── skills/
│   │   ├── crm-coding-standards/
│   │   │   └── SKILL.md
│   │   └── vercel-react-best-practices/
│   │       ├── SKILL.md
│   │       ├── AGENTS.md
│   │       └── rules/
│   │
│   └── workflows/
│       ├── create-feature-ui-first.md
│       └── refactor-module-structure.md
│
├── app/                             # Next.js App Router
│   ├── (auth)/
│   ├── (main)/
│   │   ├── customers/
│   │   ├── products/
│   │   ├── sales/
│   │   ├── employee/
│   │   ├── companies/
│   │   ├── credit-limits/
│   │   ├── temporary-credit-limits/
│   │   ├── fulfillment/
│   │   ├── sales-targets/
│   │   ├── reports/
│   │   ├── notifications/
│   │   └── admin/
│   ├── api/                         # Legacy API routes
│   ├── actions/                     # Standalone actions
│   ├── layout.tsx
│   └── globals.css
│
├── modules/                         # Business modules
│   ├── employee/
│   ├── customers/
│   ├── companies/
│   ├── products/
│   ├── sales/
│   ├── fulfillment/
│   ├── credit-limits/
│   ├── temporary-credit-limits/
│   ├── sales-targets/
│   ├── shipping-companies/
│   ├── rbac/
│   ├── notifications/
│   └── layout/
│
├── components/                      # Shared UI
│   ├── ui/
│   ├── custom/
│   ├── forms/
│   └── layout/
│
├── lib/                             # Shared infrastructure utilities
│   ├── db.ts
│   ├── auth.ts
│   └── rbac.ts
│
├── prisma/
│   └── schema.prisma
│
├── types/                           # Global TypeScript types
│
└── docs/                            # Project documentation
```

---

# 5. Module Architecture

All business modules under:

```text
modules/
```

follow the Module Architecture Contract defined in:

```text
docs/MODULE_ARCHITECTURE.md
```

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

Not every module must contain every folder or file.

A folder or file is created only when required by the module.

The goal is:

> Same architecture, different domain.

---

# 6. Module Layer Responsibilities

## 6.1 features/

UI and feature-specific presentation logic.

Typical structure:

```text
features/
├── list-view/
├── form/
└── detail-view/
```

Responsibilities:

- Rendering UI
- User interaction
- Local UI state
- Calling Server Actions through the established pattern
- Loading and error presentation

Must NOT:

- Access Database directly
- Import Repository directly
- Contain Infrastructure logic
- Bypass Server/Application architecture

---

## 6.2 server/

Server transport layer.

Typical structure:

```text
server/
└── actions.ts
```

Responsibilities:

- Authentication
- Permission checks
- Calling Application logic
- Revalidation

Server Actions must remain thin.

Flow:

```text
Authentication
    ↓
Permission
    ↓
Application
    ↓
Revalidate
```

Business logic MUST NOT be duplicated here.

---

## 6.3 application/

Business logic and use-case orchestration.

Responsibilities:

- Business rules
- Validation
- Uniqueness checks
- Data mapping
- Use-case orchestration

Typical structure:

```text
application/
├── create-<module>.ts
├── update-<module>.ts
├── validations.ts
└── index.ts
```

Files are split according to complexity and project conventions.

---

## 6.4 infrastructure/

Database and external data access.

Typical structure:

```text
infrastructure/
└── <module>.repository.ts
```

Responsibilities:

- Database queries
- Database writes
- Repository operations
- Persistence-specific behavior

Infrastructure MUST NOT contain:

- Authentication
- Authorization
- Business rules
- UI logic

---

## 6.5 types/

Module-specific TypeScript types.

Example:

```text
types/
└── index.ts
```

---

## 6.6 ui/

Reusable UI components that are specific to the module.

Examples:

```text
ui/
├── <module>-status-badge.tsx
└── <module>-type-badge.tsx
```

Components shared across modules should be placed in:

```text
components/custom/
```

when appropriate.

---

## 6.7 constants.ts

Contains constants specific to the module.

---

## 6.8 index.ts

The module's public export entry point.

Only expose APIs that other parts of the application legitimately need.

---

## 6.9 README.md

Each module must contain:

```text
README.md
```

The README should describe:

- Module purpose
- Main features
- Architecture
- Important business behavior
- Important implementation notes

---

# 7. Layer Dependencies

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

Detailed rules:

```text
features/
    ↓
server/
    ↓
application/
    ↓
infrastructure/
    ↓
@/lib/db
```

Rules:

- `features/` MUST NOT access the database directly.
- `features/` MUST NOT import repositories.
- `features/` SHOULD NOT import application use-cases directly unless an established project pattern explicitly requires it.
- `server/` imports from `application/`.
- `application/` imports from `infrastructure/`.
- `infrastructure/` uses the shared database client.
- Infrastructure MUST NOT depend on UI.
- Application MUST NOT depend on UI.
- No circular dependencies.
- No layer bypassing.

---

# 8. Database Architecture

The database layer uses:

```text
Prisma
    ↓
PostgreSQL
```

Database schema source of truth:

```text
prisma/schema.prisma
```

Database access from modules must go through the Infrastructure layer.

Use:

```ts
import { db } from "@/lib/db";
```

Do not create independent database clients inside modules.

---

# 9. Soft Delete

Entities that support deletion should use Soft Delete.

Pattern:

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

Queries must exclude deleted records when appropriate:

```ts
where: {
  deletedAt: null,
}
```

Permanent deletion is not allowed unless explicitly defined and justified by the domain.

---

# 10. Transaction Safety

Use Prisma transactions when multiple database writes must succeed or fail together.

Example:

```ts
await db.$transaction(async (tx) => {
  // Atomic operations
});
```

Transactions are required when data integrity depends on multiple related writes.

---

# 11. Server Action Architecture

All Server Actions should follow:

```text
Client
  ↓
Server Action
  ↓
Authentication
  ↓
Permission
  ↓
Application Use Case
  ↓
Infrastructure
  ↓
Database
  ↓
Revalidate
```

The Server layer acts as the transport boundary.

It must not become another Business Logic layer.

---

# 12. Data Flow

## 12.1 Read Flow

Typical read flow:

```text
UI
 ↓
Server / Application
 ↓
Repository
 ↓
Database
 ↓
Repository
 ↓
Application
 ↓
UI
```

## 12.2 Write Flow

Typical write flow:

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
Validation
 ↓
Business Rules
 ↓
Repository
 ↓
Database
 ↓
Revalidate
 ↓
UI
```

The exact implementation may vary according to the operation, but layer responsibilities must remain consistent.

---

# 13. UI Architecture

The UI uses:

- Next.js
- React
- Tailwind CSS
- shadcn/ui
- Radix UI
- Lucide Icons

UI design must be:

- Mobile-first
- Responsive
- Consistent with the project design system
- Reusable where appropriate

Shared components should be preferred over duplicate implementations.

---

# 14. Shared Components

Project-wide reusable components are located under:

```text
components/custom/
```

Examples:

```text
TruncatedCell
ActionButton
DetailItem
```

Before creating a new reusable component:

1. Search existing shared components.
2. Search similar implementations.
3. Reuse existing components when possible.
4. Create a new shared component only when the existing components cannot reasonably satisfy the requirement.

---

# 15. Legacy Architecture

Some legacy patterns may still exist in the project.

Examples:

```text
app/api/
app/actions/
```

These may continue to exist when required by existing functionality.

However, new module development should follow the current Module Architecture Contract unless a specific exception is required.

Legacy code should be migrated gradually rather than being rewritten unnecessarily.

---

# 16. Security Architecture

## Authentication

Authentication uses:

```text
NextAuth.js
```

Authentication is enforced in server-side operations.

## Authorization

Authorization uses the project's RBAC system.

Permissions must be checked before protected mutations.

Typical flow:

```text
auth()
 ↓
permission check
 ↓
application logic
```

## Data Access

Data access must remain within the appropriate infrastructure boundaries.

Do not expose unrestricted database access to the UI.

---

# 17. Error Handling

Errors should be handled consistently across the system.

Application and Server layers should return or propagate meaningful error information according to the project's established patterns.

Do not:

- Silently swallow errors
- Expose sensitive internal errors
- Introduce a second error-handling architecture without justification

Example response shape when applicable:

```json
{
  "error": "ERROR_CODE",
  "message": "Human readable message",
  "details": {}
}
```

---

# 18. Module Creation Principles

When creating a new module:

```text
Requirement
    ↓
Inspect Existing Patterns
    ↓
Read Module Architecture Contract
    ↓
Define Required Features
    ↓
Create Module Structure
    ↓
Implement
    ↓
Validate
    ↓
Document
```

The AI Agent MUST inspect existing project patterns before implementing.

However:

> No existing module is the permanent architectural authority.

The architecture is defined by the project standards and Module Architecture Contract.

Existing modules should be treated as implementation references, not as the source of architectural truth.

---

# 19. Module Refactoring Principles

When refactoring an existing module:

1. Read the Module Architecture Contract.
2. Audit the current structure.
3. Identify deviations.
4. Preserve business behavior.
5. Move responsibilities into the correct layers.
6. Update imports.
7. Remove obsolete files only after references are checked.
8. Update documentation.
9. Run validation.

The goal is architectural consistency without unnecessary behavioral changes.

---

# 20. Documentation Architecture

Documentation is divided into two levels.

## Global Documentation

Located under:

```text
docs/
```

Global documentation includes:

- System Architecture
- Coding Standards
- Data Model
- RBAC Policy
- Domain Glossary
- Decisions
- AI Context
- Development standards

## Module Documentation

Documentation specific to a module belongs under:

```text
modules/<module-name>/
```

and may include:

```text
modules/<module-name>/
├── README.md
└── docs/
```

when detailed module documentation is required.

Do not duplicate global documentation inside individual modules.

---

# 21. AI Agent Architecture

AI development rules are maintained under:

```text
.agents/
```

Structure:

```text
.agents/
├── skills/
│   ├── crm-coding-standards/
│   │   └── SKILL.md
│   │
│   └── vercel-react-best-practices/
│       ├── SKILL.md
│       ├── AGENTS.md
│       └── rules/
│
└── workflows/
    ├── create-feature-ui-first.md
    └── refactor-module-structure.md
```

Responsibilities:

```text
Skills
    ↓
Rules and standards

Workflows
    ↓
Development procedures

docs/
    ↓
Project knowledge and source documentation
```

---

# 22. Architecture Governance

The project should evolve according to the following rule:

```text
Existing implementation
        ↓
Compare with standards
        ↓
Identify deviations
        ↓
Refactor when necessary
        ↓
Align with project architecture
```

Do NOT change the architecture simply to match an existing module.

Do NOT create a new architecture for each domain.

When the project requires an architectural change:

1. Document the reason.
2. Update the appropriate architecture documentation.
3. Update the AI coding rules if necessary.
4. Update relevant workflows.
5. Gradually migrate affected modules.

---

# 23. Key Architectural Rules

The following rules are mandatory:

1. One project-wide architecture.

2. All modules follow the same layer responsibilities.

3. Modules are domain-specific, not architecture-specific.

4. No module is the permanent source of architectural truth.

5. Global architecture is defined by project documentation.

6. AI Agents must follow project skills and workflows.

7. Existing patterns should be reused before creating new patterns.

8. Layer boundaries must not be bypassed.

9. Business logic belongs in application.

10. Database access belongs in infrastructure.

11. Server Actions remain thin.

12. UI remains separate from business logic and database access.

13. Architecture changes must be deliberate and documented.

---

# 24. Validation

Before considering an architectural change complete, verify:

## Structure

- [ ] Module follows Module Architecture Contract.
- [ ] Layer responsibilities are correct.
- [ ] No unnecessary folders.
- [ ] No unnecessary files.

## Dependencies

- [ ] Correct dependency direction.
- [ ] No circular dependencies.
- [ ] No layer bypass.

## Data

- [ ] Database access is in infrastructure.
- [ ] Soft Delete handled when applicable.
- [ ] Transactions used when required.

## Server

- [ ] Authentication handled.
- [ ] Permission handled.
- [ ] Application logic called.
- [ ] Revalidation handled.

## UI

- [ ] Mobile-first.
- [ ] Shared components reused.
- [ ] No direct database access.

## Code Quality

- [ ] Naming conventions followed.
- [ ] No unnecessary duplication.
- [ ] No unrelated refactoring.

## Documentation

- [ ] Relevant documentation updated.
- [ ] Module README updated when required.
- [ ] Architecture documentation remains consistent.

---

# 25. See Also

- [AI_CONTEXT.md](./AI_CONTEXT.md)
- [CODING_STANDARDS.md](./CODING_STANDARDS.md)
- [MODULE_ARCHITECTURE.md](./MODULE_ARCHITECTURE.md)
- [RBAC_POLICY.md](./RBAC_POLICY.md)
