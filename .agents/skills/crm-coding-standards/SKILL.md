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
3. **No Monolithic File Bloat**: Core Server Actions and Repositories MUST NOT contain massive, multi-thousand-line `if-else` / `switch` blocks for every type. Core files act strictly as gatekeepers (Auth, RBAC) and orchestrators, delegating type-specific execution to each slice's Strategy via `strategy.registry.ts`.
4. **Plug-and-Play Extensibility (Open-Closed Principle)**: Adding or modifying a feature/type slice must be completed entirely within its own folder without breaking or modifying unrelated slices.
5. **No Legacy Module Imports**: Never import from deprecated modules (such as `@/modules/activity-plans/` or `@/components/activity/`). Always use `@/modules/activity/`.
6. **Mobile-First Responsive UI**: All UI components must use a mobile-first approach with Tailwind CSS.
7. **Strict Database & Migration Integrity**: Schema modifications require corresponding, inspected Prisma migrations. Never leave unmigrated changes.
8. **Zero-Error Validation**: Always validate with `tsc --noEmit` before declaring any task complete.

---

# 2. Module Architecture Contract

Every domain module under `modules/<module-name>/` (e.g., `modules/activity/`) follows the Vertical Slice Architecture:

```text
modules/activity/
├── application/           # Module-level services & helpers (e.g., filters, media/image-uploader)
├── domain/                # Pure business rules, permissions (approval), and summary extractors
├── features/              # Vertical Feature Slices (แต่ละ Type ดูแลตัวเองเบ็ดเสร็จ)
│   ├── type-1/            # Gold Standard Reference Slice
│   ├── type-2/
│   └── ... (type-3 to type-14)
├── hooks/                 # Module-level shared React hooks
├── infrastructure/        # Core repositories, Prisma includes, and strategy.registry.ts
├── server/                # Modularized Server Actions (planned, unplanned, actual, approval, promotional)
├── types/                 # Shared cross-slice module types & strategy.interface.ts
├── ui/                    # Shared presentation components & inputs across the module
│   ├── basic-info/
│   ├── budget/
│   ├── inputs/            # Shared form inputs (Customer/Product/Address Select, PhotoUpload, GPSPicker)
│   ├── location-team/
│   └── notes/
├── views/                 # Orchestrator views (planned, unplanned, actual, detail, approvals, list, calendar)
├── constants.ts           # Module-level constants
├── index.ts               # Module public export barrel
└── README.md              # Module architecture documentation
```

---

# 3. Feature Slice Structure (Inside the Slice)

Each feature slice (e.g. modules/activity/features/type-X/) represents an independent, cohesive vertical unit split into planned/, unplanned/, and shared/ sub-slices (following the type-1 Gold Standard):

```text
features/type-X/
├── planned/                              # Sub-slice: กิจกรรมในแผนงาน & บันทึกผลตามแผน (Actual)
│   ├── application/
│   │   ├── actual-mapper.ts              # Pure mappers for Actual results (Form <-> DB Payload)
│   │   ├── actual-validation.ts          # Zod validation for Actual results
│   │   ├── planned-mapper.ts             # Pure mappers & hydration for Planned targets
│   │   └── planned-validation.ts         # Zod validation for Planned targets
│   ├── components/
│   │   ├── typeX-planned-form.tsx        # Form for creating/editing planned targets
│   │   ├── typeX-actual-form.tsx         # Form for recording actual outcomes
│   │   ├── typeX-plan-card.tsx           # Summary card for planned targets
│   │   ├── typeX-detail-view.tsx         # Full detail view for actual outcomes
│   │   └── typeX-approval-card.tsx       # Summary card for manager approval
│   ├── hooks/
│   │   ├── use-typeX-planned-form.ts     # State hook for planned targets
│   │   └── use-typeX-actual.ts           # State hook for actual outcomes & image uploads
│   ├── infrastructure/
│   │   └── typeX-planned.strategy.ts     # Server-only Strategy (savePlan, loadPlan, saveActual)
│   └── types/
│       ├── planned.types.ts
│       └── actual.types.ts
│
├── unplanned/                            # Sub-slice: กิจกรรมนอกแผน (2-in-1 Target + Actual)
│   ├── application/
│   │   ├── unplanned-mapper.ts
│   │   └── unplanned-validation.ts
│   ├── components/
│   │   └── typeX-unplanned-form.tsx
│   ├── hooks/
│   │   └── use-typeX-unplanned-form.ts
│   ├── infrastructure/
│   │   └── typeX-unplanned.strategy.ts
│   └── types/
│       └── unplanned.types.ts
│
├── shared/                               # Shared constants & types within Type X
│   ├── constants.ts
│   └── types.ts
│
├── index.ts                              # ⭐️ Public API contract (the ONLY entry point for outside consumers)
└── README.md                             # Feature slice documentation
```

### 3.1 Responsibilities Inside the Slice:

1. **`components/`**:
   - Presentation layer for creating, editing, viewing, and approving.
   - Must consume shared inputs (ActivityCustomerSelect, ActivityProductSelect, ActivityAddressSelect, ActivityPhotoUpload, ActivityGpsPicker, ActivityInput) from @/modules/activity/ui.

2. **`hooks/`**:
   - Manages state hydration, validation triggers, image upload orchestration, and payload generation for this slice.

3. **`types/`**:
   - Source of truth for TypeScript interfaces belonging to this slice.

4. **`application/*-mapper.ts & *-validation.ts`**:
   - Pure functions without side effects.
   - Maps raw database entities into UI view models, and UI form state into database payloads.

5. **`infrastructure/*-strategy.ts`**:
   - Server-side strategy implementing the universal strategy interface (@/modules/activity/types/strategy.interface).
   - Encapsulates how this slice saves/loads its dedicated database tables within atomic Prisma transactions (tx).

6. **`index.ts` (Public Contract)**:
   - Exports ONLY components, hooks, mappers, validations, strategies, and types intended for consumer usage.
   - External files MUST import from @/modules/activity/features/type-X and NEVER reach into private internal paths.

---

# 4. Core Orchestration & Consumer Rules

### 4.1 Server Actions (server/\*.actions.ts)

The module-level Server Actions layer is modularized by workflow (planned.actions.ts, unplanned.actions.ts, actual.actions.ts, approval.actions.ts, promotional.actions.ts) and re-exported via server/index.ts and server/actions.ts. It serves as a Gatekeeper and Orchestrator:

1. Authenticates session and checks RBAC permissions (using @/modules/activity/domain/approval).
2. Validates incoming payload.
3. Delegates slice-specific processing to the appropriate Strategy registered in infrastructure/strategy.registry.ts.
4. Handles cache revalidation and error serialization.
5. **MUST NOT** hardcode inline database queries or sprawling `if-else` business logic for individual feature slices.

### 4.2 Repositories (infrastructure/)

The module-level Infrastructure layer handles Core/Header persistence:

1. Manages parent tables (e.g. ActivityPlan, ActivityResult) and full Prisma includes (activity-plan-include.ts).
2. Provides atomic Prisma transactions (tx) to feature strategies via strategy.registry.ts.
3. Feature slices execute their dedicated table mutations via their Strategy inside the provided transaction.

### 4.3 UI Consumers (views/)

Orchestrator views (views/planned/, views/unplanned/, views/actual/, views/detail/, views/approvals/) consume feature slices dynamically:

- Import feature components/hooks exclusively from @/modules/activity/features/type-X.
- Pass standard props and delegate internal form management to the slice.

---

# 5. Dependency & Boundary Rules

```text
External Consumer (App Pages / Orchestrator Views / Server Actions)
   ↓ (imports ONLY from index.ts)
Feature Slice Public API (features/type-X/index.ts)
   ↓
Internal Slice Elements (planned / unplanned / shared)
   ↓ (delegated via tx)
Prisma Database Transaction (Dedicated Type Tables)
```

Rules:

1. \*\*No Cross-Slice Private Imports: features/type-1 MUST NOT import internal files of features/type-2.
2. \*\*No Deep Import Bypassing: Consumers MUST NOT import internal paths like features/type-1/planned/components/.... Always import from features/type-1.
3. \*\*No Database Direct Access from UI: UI components MUST NOT call Prisma directly. All mutations go through Server Actions and Strategy transactions.
4. \*\*No Circular Dependencies: Ensure clear top-down flow within each slice.

---

# 6. UI Design - Mobile First

Always use a Mobile-First approach with Tailwind CSS:

- Start with mobile classes and scale up using responsive breakpoints (sm:, md:, lg:, xl:).
- Keep interactive controls accessible, with proper touch targets (minimum 36px–40px height).
- Example:
  ```tsx
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
  ```

---

# 7. Database Schema & Prisma Migration Standards

When modifying or extending database models, tables, columns, enums, or relations:

1. \*\*Schema & Migration Coupling: Any change to prisma/schema.prisma introducing persistent database changes MUST be accompanied by a generated Prisma migration. Never leave unmigrated schema changes.
2. \*\*SQL Inspection: Always inspect the generated migration.sql to verify it contains ONLY intended changes. Check for destructive DDL (DROP TABLE, DROP COLUMN).
3. \*\*Separation of Creation vs Application: Creating migrations and applying them to the database are distinct steps. Do NOT apply migrations without user authorization. Never use prisma db push for production-tracked changes.
4. \*\*Migration History & Drift: If drift or migration conflicts occur, STOP and report immediately. Never execute forced resets (prisma migrate reset) unprompted.
5. \*\*Parity Validation: Ensure schema.prisma, prisma/migrations/, and the database catalog remain synchronized.

---

# 8. Pre-Completion Self-Validation

Before declaring any task complete, verify:

1. Feature slice complies with the Vertical Slice Architecture contract (planned/, unplanned/, shared/, index.ts).
2. Slice exports all necessary components and strategies cleanly in index.ts.
3. TypeScript compiler check passes with ZERO errors (npx tsc --noEmit).
4. If database schema was modified, corresponding Prisma migrations exist and are verified.
5. Automated tests or dev server run without regressions.
6. Git working tree integrity is preserved (do not commit unless explicitly requested by the user).
