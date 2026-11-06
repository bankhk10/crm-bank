---
name: crm-coding-standards
description: Enforces the core CRM project coding standards, architecture, module structure, Server vs. Client data fetching rules, Prisma migration integrity, and development practices. Use this skill WHENEVER generating, modifying, refactoring, or reviewing code for this project.
---

# CRM Coding Standards & Best Practices

This skill defines the mandatory coding, architecture, module structure, Server/Client boundary, database migration, and development standards for this project.

When writing, modifying, refactoring, or reviewing code in this project, you **MUST** follow these rules.

> **Authority References**:
> - System Architecture: `docs/ARCHITECTURE.md`
> - Module Architecture Contract: `docs/MODULE_ARCHITECTURE.md`
> - Coding Standards: `docs/CODING_STANDARDS.md`
> - Data Model Source of Truth: `prisma/schema.prisma`

---

# 1. Core Principles

The following principles are mandatory across the entire codebase:

1. **Same Architecture, Different Domain**: Reuse existing project patterns before creating new patterns. Keep all modules architecturally consistent.
2. **Strict Layer Separation & Encapsulation**: Separate UI (`features/` / `views/` / `ui/`), Server Transport (`server/`), Business Logic (`application/` / `domain/`), and Data Access (`infrastructure/`). Outside consumers MUST interact with a module or feature slice exclusively through its public entry point (`index.ts`).
3. **Server-First Initial Data Loading (Zero-POST Initial Load)**: Initial page data and master data MUST be fetched on the server in Server Components (`app/(main)/.../page.tsx`) using `Promise.all` and passed down as initial props. Never trigger a burst of Server Actions inside client-side `useEffect` on initial mount.
4. **No Monolithic File Bloat**: Core Server Actions and Repositories MUST NOT contain massive, multi-thousand-line `if-else` / `switch` blocks. In multi-type modules (`modules/activity/`), core files act strictly as gatekeepers (Auth, RBAC) and orchestrators, delegating type-specific execution to each slice's Strategy via `strategy.registry.ts`.
5. **Plug-and-Play Extensibility (Open-Closed Principle)**: Adding or modifying a feature slice must be completed within its own folder without breaking unrelated slices or modules.
6. **No Legacy Module Imports**: Never import from deprecated modules (such as `@/modules/activity-plans/` or `@/components/activity/`). Always use `@/modules/activity/`.
7. **Mobile-First Responsive UI**: All UI components must use a mobile-first approach with Tailwind CSS.
8. **Strict Database & Migration Integrity**: Schema modifications require corresponding, inspected Prisma migrations (`prisma/migrations/`), soft-delete compliance (`deletedAt: null`), and Prisma client regeneration (`npx prisma generate`).
9. **Mandatory Documentation Sync**: Update `modules/<module-name>/README.md` whenever module structure, data flow, feature set, or business behavior changes.
10. **Zero-Error Validation**: Always validate with `npx tsc --noEmit` before declaring any task complete.

---

# 2. Module Architecture Contract (2 Standard Paradigms)

All domain modules live under `modules/<module-name>/` and follow one of two standardized structures depending on domain complexity:

## 2.1 Standard Domain Modules (`customers`, `products`, `sales`, `employee`, `companies`, `credit-limits`, `rbac`, etc.)

Follows `docs/MODULE_ARCHITECTURE.md`:

```text
modules/<module-name>/
├── application/           # Use-cases, business rules, Zod validations (validations.ts), data mappers
├── features/              # Feature UI views & forms (list-view/, form/, detail-view/)
├── infrastructure/        # Prisma repositories (<module>.repository.ts) — data access ONLY
├── server/                # Thin Server Actions (actions.ts) — Auth -> RBAC -> Data Scope -> Application -> Revalidate
├── types/                 # Module-specific TypeScript interfaces (index.ts)
├── ui/                    # Reusable module-specific UI components (check @/components/custom/ first)
├── constants.ts           # Module-specific constants
├── index.ts               # Module public export barrel
└── README.md              # Module documentation (mandatory)
```

- Create only the folders/files that the module actually requires (no empty folders or placeholder files).
- Do NOT invent non-standard folders (`services/`, `controllers/`, `helpers/`, `utils/`) inside standard modules unless explicitly defined by the project architecture.

## 2.2 Multi-Type Vertical Slice Module (`modules/activity/`)

For complex multi-workflow domains (14 Work Types), `modules/activity/` uses **Vertical Slice Architecture**:

```text
modules/activity/
├── application/           # Module-level services & helpers (e.g., filters, media/image-uploader, activity-plan-flow)
├── domain/                # Pure business rules, permissions (approval), and summary extractors
├── features/              # Vertical Feature Slices (แต่ละ Type ดูแลตัวเองเบ็ดเสร็จ)
│   ├── type-1/            # Gold Standard Reference Slice
│   ├── type-2/
│   └── ... (type-3 to type-14)
├── hooks/                 # Module-level shared React hooks
├── infrastructure/        # Core repositories, Prisma includes, and strategy.registry.ts
├── server/                # Modularized Server Actions & Server Loaders (planned, unplanned, actual, approval, promotional, master-data)
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

# 3. Feature Slice Structure (Inside `modules/activity/features/type-X/`)

Each feature slice represents an independent, cohesive vertical unit split into `planned/`, `unplanned/`, and `shared/` sub-slices (following the `type-1` Gold Standard):

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

1. **`components/`**: Presentation layer for creating, editing, viewing, and approving. Must consume shared inputs (`ActivityCustomerSelect`, `ActivityProductSelect`, `ActivityAddressSelect`, `ActivityPhotoUpload`, `ActivityGpsPicker`, `ActivityInput`) from `@/modules/activity/ui`.
2. **`hooks/`**: Manages state hydration, validation triggers, image upload orchestration, and payload generation for this slice.
3. **`types/`**: Source of truth for TypeScript interfaces belonging to this slice.
4. **`application/*-mapper.ts & *-validation.ts`**: Pure functions without side effects. Maps raw database entities into UI view models, and UI form state into database payloads.
5. **`infrastructure/*-strategy.ts`**: Server-side strategy implementing `@/modules/activity/types/strategy.interface`. Encapsulates how this slice saves/loads its dedicated database tables within atomic Prisma transactions (`tx`).
6. **`index.ts` (Client-Safe Public Contract)**:
   - Exports ONLY client-safe components, hooks, mappers, validations, and types intended for consumer usage.
   - **NEVER** export Server Strategies (`*.strategy.ts`) from a client-imported `index.ts` barrel to prevent leaking server-only Node modules (`pg`, `fs`, `net`, `tls`) into the client bundle. Strategies are registered directly in `infrastructure/strategy.registry.ts`.

---

# 4. Server vs. Client Responsibilities & Data Fetching Rules

## 4.1 When to Use Server Components (`app/(main)/.../page.tsx`)
- **Initial Page Data & Master Data Pre-fetching**:
  - Route `page.tsx` files are Server Components by default. Use `async` Server Components to fetch initial page data and form master data (e.g., employees, customers, products, categories, activity types, target entity for Detail/Edit views) in a single server-side pass using `Promise.all`.
  - Pass the pre-fetched data as initial props (e.g., `initialMasterData`, `initialEditData`, `initialPlan`, `initialFilterData`) into the Client View component.
  - Add `export const dynamic = "force-dynamic";` on pages whose data depends on the authenticated user session, permissions, or live database state.
- **Avoid Request Waterfalls**:
  - When loading an Edit page where secondary options depend on the loaded record (e.g., follow-up plans for `plan.employeeId`), chain the dependent promise on the server inside `Promise.all` so all data is resolved in a single server pass before rendering.

## 4.2 When to Use Client Components (`"use client"`)
- Add `"use client";` at line 1 **ONLY** when the file uses React state/lifecycle hooks (`useState`, `useEffect`, `useMemo`, `useCallback`, `useRef`), browser APIs, or interactive event handlers.
- **Forbidden Anti-Pattern (No Initial Mount POST Storms)**:
  - **DO NOT** fire multiple Server Actions inside `useEffect` on initial component mount to load master data or initial page state. In Next.js App Router, every client-invoked Server Action triggers a separate HTTP `POST` request through middleware (`proxy.ts`) (and doubles in React `StrictMode` during development).
  - Client Views accepting initial server props (`initialMasterData`, `initialPlan`, etc.) MUST initialize state directly from those props, set `loading` to `false`, and bypass the `useEffect` network fetch when initial props are provided (keeping the `useEffect` fetch only as a fallback when props are omitted).
- **Legitimate Client-Side Server Action Usage**:
  - Use Server Actions from Client Components for **data mutations** (`Create`, `Update`, `Delete`, `Submit`, `Approve`, `Reject`) or user-triggered dynamic actions (e.g., explicit refresh after a mutation, paginated table filtering).

## 4.3 `"use server"` Directive & Serialization Rules
1. **Strict `"use server"` File Exports**:
   - Files declaring `"use server";` MUST export **ONLY `async` functions**.
   - **NEVER** export TypeScript `type` / `interface` definitions, constants, or plain objects from a `"use server"` file. Place types in `server/types.ts` or `types/index.ts`.
   - Barrel files (`server/index.ts`, `server/actions.ts`) MUST **NOT** declare `"use server";` to avoid Next.js/Turbopack bundling conflicts.
2. **RSC & Server Action Serialization**:
   - Prisma `Decimal` fields and complex objects MUST be serialized into plain JSON-safe values (`JSON.parse(JSON.stringify(data))` or explicit `Number(...)` mapping) before being returned from Server Actions or passed from Server Components to Client Components.
3. **No Binary Files (`File` / `Blob`) in Server Action Payloads**:
   - **NEVER** pass raw `File` or `Blob` instances into a Next.js Server Action (causes `413 Payload Too Large` due to the 1 MB body limit).
   - Always upload images/files first via the dedicated storage service (`uploadActivityPlanImageGroup` / Presigned R2 PUT / Multipart API route) and strip binary fields (`rawFile`, `file`) before sending permanent file URLs to the Server Action.

---

# 5. Core Orchestration, Security & Layer Boundary Rules

## 5.1 Server Actions (`server/*.actions.ts`) — Mandatory Gatekeeper Flow
Every mutating or data-fetching Server Action and API Route MUST enforce this exact sequence:

```text
1. Authentication   -> const session = await auth(); (reject if !session?.user)
2. Authorization    -> Check RBAC via isAuthorized() or module permission helpers
3. Data Scope       -> Apply applyDataScope() for scoped resources (e.g., customers, plans)
4. Validation       -> Validate input on the server using Zod schemas (never trust client-only validation)
5. Execution        -> Delegate to Application Use-Case or Strategy Registry inside a Prisma transaction (tx)
6. Revalidation     -> Call revalidatePath() for affected routes and return serialized result
```

## 5.2 Repositories (`infrastructure/`)
1. Always use the shared Prisma client (`import { db } from "@/lib/db";`). Never instantiate a new `PrismaClient` inside modules.
2. **Soft Delete Enforcement**: For all models with a `deletedAt` column, every read query (`findMany`, `findFirst`, `count`) MUST filter `where: { deletedAt: null }` unless explicitly querying archived records. Use soft delete (`update({ data: { deletedAt: new Date() } })`) instead of hard delete.
3. **Atomic Transactions**: Multi-table writes MUST execute inside `db.$transaction(async (tx) => { ... })`.

## 5.3 Dependency Direction & Boundary Rules

```text
External Consumer (App Pages / Orchestrator Views)
   ↓ (imports ONLY from public index.ts / server index.ts)
Module / Feature Slice Public API (index.ts)
   ↓
Application / Domain Layer (Use-Cases, Mappers, Validations)
   ↓
Infrastructure Layer (Repositories & Strategy Registry via tx)
   ↓
Database (Prisma / PostgreSQL)
```

1. **No Cross-Slice Private Imports**: `features/type-1` MUST NOT import internal files of `features/type-2`.
2. **No Deep Import Bypassing**: Consumers MUST NOT import internal paths like `features/type-1/planned/components/...`. Always import from `@/modules/activity/features/type-1` or `@/modules/<module>`.
3. **No Direct Database Access from UI**: UI components and client hooks MUST NOT import `@/lib/db` or repositories directly.
4. **No Circular Dependencies**: Maintain a strict top-down dependency graph.

---

# 6. UI Design — Mobile First & Shared Components

1. **Mobile-First Responsive Tailwind CSS**:
   - Start with mobile styles and scale up using responsive breakpoints (`sm:`, `md:`, `lg:`, `xl:`).
   - Keep interactive controls accessible with proper touch targets (minimum `36px–40px` height).
   - Example:
     ```tsx
     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 p-4 md:p-6">
     ```
2. **Reuse Shared Components First**:
   - Before creating a new UI component, check `@/components/ui/`, `@/components/custom/` (e.g., `TruncatedCell`, `ActionButton`, `DetailItem`, `MultiSelect`), and module-level `ui/` (e.g., `@/modules/activity/ui`).

---

# 7. Database Schema & Prisma Migration Standards

When modifying or extending database models, tables, columns, enums, or relations in `prisma/schema.prisma`:

1. **Mandatory Migration File Creation**:
   - Every persistent change to `prisma/schema.prisma` MUST have a corresponding migration folder under `prisma/migrations/YYYYMMDDHHMMSS_<descriptive_snake_case_name>/migration.sql`.
   - Never leave unmigrated schema changes in `prisma/schema.prisma`.
2. **SQL Inspection & Destructive DDL Guard**:
   - Always read and inspect the generated `migration.sql` to verify it contains ONLY the intended changes.
   - Check for destructive DDL (`DROP TABLE`, `DROP COLUMN`, `TRUNCATE`, type casts that lose data). Warn the user and get explicit confirmation before applying any destructive change.
3. **Forbidden Prisma Commands**:
   - **NEVER** use `prisma db push` for production-tracked schema changes (it bypasses migration history).
   - **NEVER** execute `prisma migrate reset` or force-drop database schemas unprompted under any circumstances.
   - Creating a migration file and applying it to a live database are distinct steps—do not apply migrations to the database without user authorization if drift or destructive changes are detected.
4. **Prisma Client Synchronization**:
   - Always run `npx prisma generate` after modifying `prisma/schema.prisma` so that `@prisma/client` types are updated before running `npx tsc --noEmit`.

---

# 8. Pre-Completion Self-Validation Checklist

Before declaring any task complete, verify ALL of the following:

- [ ] **Architecture & Boundaries**: Module structure and dependency direction comply with the contract; no deep private imports or circular dependencies.
- [ ] **Server vs. Client Data Flow**: Initial page/master data is loaded on the Server Component (`page.tsx`), not via client-side `useEffect` Server Action storms; `"use server"` files export only `async` functions.
- [ ] **Security & Validation**: Auth, RBAC permissions, Data Scope (`applyDataScope`), and server-side Zod validation are enforced on all Server Actions/APIs.
- [ ] **Database & Migrations**: Queries respect `deletedAt: null`; multi-step writes use `db.$transaction`; any `schema.prisma` change has a verified `migration.sql` and `npx prisma generate` has been run.
- [ ] **TypeScript Zero-Error Check**: `npx tsc --noEmit` passes with **ZERO errors** (Exit code 0).
- [ ] **Documentation Sync**: `modules/<module-name>/README.md` (and relevant docs in `docs/`) is updated if module files, data flow, or behavior changed.
- [ ] **Git Working Tree Integrity**: Unrelated files are untouched, and changes are not committed unless explicitly requested by the user.
