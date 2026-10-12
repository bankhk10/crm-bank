---
name: crm-coding-standards
description: Enforces the core CRM project coding standards, architecture, module structure, and development practices. Use this skill WHENEVER generating, modifying, refactoring, or reviewing code for this project.
---

# CRM Coding Standards & Best Practices: Vertical Slice Architecture

This skill defines the mandatory coding, architecture, module structure, and development standards for this project.

When writing, modifying, refactoring, or reviewing code in this project, you MUST follow these rules.

The primary architectural paradigm for this codebase is **Vertical Slice Architecture (Feature-Based Slices)**. The goal is high cohesion, loose coupling, encapsulation, predictability, and maintainability.

---

# 1. Core Principles

The following principles are mandatory:

1. **Self-Contained Vertical Slices**: Every feature/type slice encapsulates its own UI, state, domain logic, validation, and data strategy within its own folder.
2. **Encapsulation & Public Contract**: Outside consumers MUST interact with a feature slice exclusively through its public entry point (`index.ts`). Internal implementation details are private to the slice.
3. **No Monolithic File Bloat**: Core Server Actions and Repositories MUST NOT contain massive, multi-thousand-line `if-else` / `switch` blocks for every type. Core files act strictly as gatekeepers (Auth, RBAC) and orchestrators, delegating type-specific execution to each slice's Strategy.
4. **Plug-and-Play Extensibility (Open-Closed Principle)**: Adding or modifying a feature/type slice must be completed entirely within its own folder without breaking or modifying unrelated slices.
5. **Mobile-First Responsive UI**: All UI components must use a mobile-first approach with Tailwind CSS.
6. **Strict Database & Migration Integrity**: Schema modifications require corresponding, inspected Prisma migrations. Never leave unmigrated changes.
7. **Zero-Error Validation**: Always validate with `tsc --noEmit` before declaring any task complete.

---

# 2. Module Architecture Contract

Every module under `modules/<module-name>/` follows the Vertical Slice Architecture:

```text
modules/<module-name>/
├── features/              # Vertical Feature Slices (แต่ละ Slice ดูแลตัวเองเบ็ดเสร็จ)
│   ├── <feature-or-type-1>/
│   ├── <feature-or-type-2>/
│   └── ...
├── application/           # Module-level orchestration & Strategy Registries
│   ├── strategies/        # Type/Feature Strategy Registry & Universal Interface
│   └── use-cases/         # Module-wide shared orchestrations
├── infrastructure/        # Shared core database repositories (Header/Parent models)
├── server/                # Module-level Server Actions (Auth, RBAC gatekeeper, cache revalidation)
├── types/                 # Shared cross-slice module types
├── ui/                    # Truly shared presentation components across the module
├── constants.ts           # Module-level constants
├── index.ts               # Module public export barrel
└── README.md              # Module architecture documentation
```

---

# 3. Feature Slice Structure (Inside the Slice)

Each feature slice (e.g. `modules/activity-plans/features/type-X/`) represents an independent, cohesive vertical unit:

```text
features/<feature-slice>/
├── components/            # UI components (Forms, Cards, Detail, Preview, Approval)
├── hooks/                 # React hooks for form state, lifecycle, and interaction
├── types/                 # Domain types, DTOs, and Zod validation schemas
├── application/           # Domain logic, mappers, and Server Strategy
│   ├── mapper.ts          # Pure data mappers (Form State <-> DTO <-> Section Items)
│   └── <slice>.strategy.ts # Server-only Strategy implementation (validatePlan, savePlan, loadPlan, saveActual)
├── index.ts               # ⭐️ Public API contract (the ONLY entry point for outside consumers)
└── README.md              # Feature slice documentation
```

### 3.1 Responsibilities Inside the Slice:

1. **`components/`**:
   - Presentation layer for creating, editing, viewing, and approving.
   - Clean separation of view states (form mode, read-only mode).
   - Reusable local UI elements (e.g. plot cards, upload zones).

2. **`hooks/`**:
   - Manages state hydration, validation trigger, and payload generation for this slice.
   - Decoupled from outside pages.

3. **`types/` (or `types/index.ts`)**:
   - Source of truth for TypeScript interfaces and Zod schemas belonging to this slice.

4. **`application/mapper.ts`**:
   - Pure functions without side effects.
   - Maps raw database entities into UI view models, and UI form state into database payloads.

5. **`application/<slice>.strategy.ts`**:
   - Server-side strategy implementing the universal `WorkTypeStrategy` interface.
   - Encapsulates how this slice validates business rules and saves/loads its specific database records within atomic Prisma transactions.

6. **`index.ts` (Public Contract)**:
   - Exports ONLY components, hooks, mappers, strategy, and types intended for consumer usage.
   - External files MUST import from `@/modules/<module>/features/<slice>` and NEVER reach into private internal paths.

---

# 4. Core Orchestration & Consumer Rules

### 4.1 Server Actions (`server/actions.ts`)
The module-level Server Actions layer serves as a **Gatekeeper and Orchestrator**:
1. Authenticates session and checks RBAC permissions.
2. Validates incoming payload.
3. Delegates slice-specific processing to the appropriate Strategy registered in `type-registry.ts`.
4. Handles cache revalidation and error serialization.
5. **MUST NOT** hardcode inline database queries or sprawling `if-else` business logic for individual feature slices.

### 4.2 Repositories (`infrastructure/`)
The module-level Infrastructure layer handles **Core/Header persistence**:
1. Manages parent tables (e.g. `ActivityPlan`, `ActivityResult`).
2. Provides atomic Prisma transactions (`tx`) to feature strategies.
3. Feature slices execute their specific table mutations via their Strategy inside the provided transaction.

### 4.3 UI Consumers (Main Pages & Modals)
Main creation, edit, and detail pages consume feature slices dynamically:
- Resolve components via standard Registry or clean barrel imports.
- Pass standard props (`value`, `onChange`, `readonly`, `initialData`).
- Never micromanage slice-internal inputs.

---

# 5. Dependency & Boundary Rules

```text
External Consumer (Pages / Modals / Core Actions)
   ↓ (imports ONLY from index.ts)
Feature Slice Public API (features/<slice>/index.ts)
   ↓
Internal Slice Elements (components / hooks / types / application)
   ↓ (delegated via tx)
Prisma Database Transaction
```

Rules:
1. **No Cross-Slice Private Imports**: `features/type-1` MUST NOT import internal private files of `features/type-2`.
2. **No Deep Import Bypassing**: Consumers MUST NOT import internal paths like `features/type-1/components/private-item.tsx`. Always import from the slice's `index.ts`.
3. **No Database Direct Access from UI**: UI components MUST NOT call Prisma or database clients directly. All mutations go through Server Actions / Strategy transactions.
4. **No Circular Dependencies**: Ensure clear top-down flow within each slice.

---

# 6. UI Design - Mobile First

Always use a Mobile-First approach with Tailwind CSS:
- Start with mobile classes and scale up using responsive breakpoints (`sm:`, `md:`, `lg:`, `xl:`).
- Keep interactive controls accessible, with proper touch targets (minimum 36px–40px height).
- Example:
  ```tsx
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
  ```

---

# 7. Database Schema & Prisma Migration Standards

When modifying or extending database models, tables, columns, enums, or relations:

1. **Schema & Migration Coupling**: Any change to `prisma/schema.prisma` introducing persistent database changes MUST be accompanied by a generated Prisma migration. Never leave unmigrated schema changes.
2. **SQL Inspection**: Always inspect the generated `migration.sql` to verify it contains ONLY intended changes. Check for destructive DDL (`DROP TABLE`, `DROP COLUMN`).
3. **Separation of Creation vs Application**: Creating migrations and applying them to the database are distinct steps. Do NOT apply migrations without user authorization. Never use `prisma db push` for production-tracked changes.
4. **Migration History & Drift**: If drift or migration conflicts occur, STOP and report immediately. Never execute forced resets (`prisma migrate reset`) unprompted.
5. **Parity Validation**: Ensure `schema.prisma`, `prisma/migrations/`, and the database catalog remain synchronized.

---

# 8. Pre-Completion Self-Validation

Before declaring any task complete, verify:

1. Feature slice complies with the Vertical Slice Architecture contract.
2. Slice exports all necessary components and strategies cleanly in `index.ts`.
3. TypeScript compiler check passes with ZERO errors (`npx tsc --noEmit`).
4. If database schema was modified, corresponding Prisma migrations exist and are verified.
5. Automated tests or dev server run without regressions.
6. Git working tree integrity is preserved (do not commit unless explicitly requested by the user).
