# CRM System Documentation

> **Purpose**: Central documentation index and entry point for AI Agents and the development team  
> **Version**: 3.0.0  
> **Updated**: 2026-08-28

---

## 📚 Document Index

### Global Documentation

| Document                                                         | Description                                 | Read First |
| ---------------------------------------------------------------- | ------------------------------------------- | :--------: |
| [AI_CONTEXT.md](./AI_CONTEXT.md)                                 | ภาพรวมระบบ, เป้าหมาย, AI working rules      |   ⭐ YES   |
| [DOMAIN_GLOSSARY.md](./DOMAIN_GLOSSARY.md)                       | คำศัพท์, Entity, Status, Business Rules     |   ⭐ YES   |
| [ARCHITECTURE.md](./ARCHITECTURE.md)                             | สถาปัตยกรรมระบบและ Technical Boundaries     |   ⭐ YES   |
| [MODULE_ARCHITECTURE.md](./MODULE_ARCHITECTURE.md)               | มาตรฐานโครงสร้างและ Layer ของทุก Module     |   ⭐ YES   |
| [CODING_STANDARDS.md](./CODING_STANDARDS.md)                     | Coding Style, Naming, Implementation Rules  |   ⭐ YES   |
| [DATA_MODEL.md](./DATA_MODEL.md)                                 | Database Entities, Relations และ Data Rules |            |
| [RBAC_POLICY.md](./RBAC_POLICY.md)                               | Roles, Permissions และ Access Levels        |            |
| [DECISIONS.md](./DECISIONS.md)                                   | Architecture Decision Records (ADRs)        |            |
| [local-database-development.md](./local-database-development.md) | คู่มือ Local Database                       |            |

---

## 📦 Module Documentation

Module-specific documentation belongs with the relevant module:

```text
modules/<module-name>/
├── README.md
└── docs/
```

Typical detailed documentation may include:

```text
docs/
├── architecture.md
├── data-flow.md
├── business-rules.md
├── database.md
└── audit/
```

Only create documentation that is actually needed.

### Current Module Documentation

| Module               | Documentation Path                                                | Key Topics                                     |
| -------------------- | ----------------------------------------------------------------- | ---------------------------------------------- |
| **Activity Plans**   | [`modules/activity-plans/docs/`](../modules/activity-plans/docs/) | Architecture, Data Flow, Business Rules, Audit |
| **Products & Stock** | [`modules/products/docs/`](../modules/products/docs/)             | Stock Rules, Data Flow, Audits                 |

More modules should be added here when module-specific documentation is created.

---

# 🤖 Quick Start for AI Agents

Before creating, modifying, refactoring, or reviewing code:

## Step 1: Read the Rules

Read:

```text
.agents/skills/crm-coding-standards/SKILL.md
```

This contains the mandatory executable rules for coding tasks.

---

## Step 2: Read Project Context

Read the relevant documents:

```text
docs/AI_CONTEXT.md
docs/ARCHITECTURE.md
docs/MODULE_ARCHITECTURE.md
docs/CODING_STANDARDS.md
```

Then read only the additional documentation relevant to the task.

---

## Step 3: Inspect the Existing Implementation

Before creating something new:

1. Inspect the target module.
2. Search for similar features.
3. Search for existing shared components.
4. Search for existing application logic.
5. Search for existing repositories.
6. Search for existing Server Action patterns.
7. Reuse an existing project pattern whenever possible.

> **No existing module is the permanent architecture authority.**

The project architecture is defined by the documentation and Module Architecture Contract.

---

## Step 4: Check the Database When Relevant

For database-related work:

```text
prisma/schema.prisma
```

is the primary source of truth for:

- Models
- Fields
- Relations
- Enums
- Constraints
- Indexes

---

## Step 5: Follow the Standard Data Flow

Typical read:

```text
UI
 ↓
Server / Application
 ↓
Infrastructure / Repository
 ↓
Database
```

Typical write:

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

---

# 🏗️ System Overview

```text
┌────────────────────┐
│       Client       │
│ Next.js + React UI │
└─────────┬──────────┘
          │
          ▼
┌─────────────────────────────┐
│          Modules            │
│                             │
│ features                    │
│    ↓                        │
│ server                      │
│    ↓                        │
│ application                 │
│    ↓                        │
│ infrastructure              │
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│ Prisma + PostgreSQL         │
└─────────────────────────────┘
```

---

# 📋 Core Business Flows

## Sale Flow

```text
Create
  ↓
Submit
  ↓
Approve
  ↓
Pay (when applicable)
  ↓
Deliver
  ↓
Complete
```

Alternative paths include rejection, correction, cancellation, partial delivery, and overdue handling according to the domain rules.

See:

- [DOMAIN_GLOSSARY.md](./DOMAIN_GLOSSARY.md)
- [DATA_MODEL.md](./DATA_MODEL.md)

---

## Credit Flow

```text
Customer
   │
   ├── CreditLimit
   │
   └── TemporaryCreditLimit
          ↓
       Request
          ↓
       Approve
          ↓
        Use
          ↓
       Expire / Revert
```

---

## Points Flow

```text
Sale COMPLETED
      ↓
Calculate per SaleItem
      ↓
EmployeePointHistory
      ↓
Point Summary
```

---

# 🔐 RBAC Summary

RBAC is enforced primarily at the server boundary.

Typical flow:

```text
Authentication
      ↓
Permission
      ↓
Data Access Scope
      ↓
Application Logic
```

The detailed and current RBAC policy is documented in:

```text
docs/RBAC_POLICY.md
```

The RBAC source of truth is:

```text
prisma/seed/rbac.ts
```

---

# 🛠️ Tech Stack

| Layer          | Technology                                   |
| -------------- | -------------------------------------------- |
| Frontend       | Next.js 16.1.5, React 19.2.0, Tailwind CSS 4 |
| UI Components  | shadcn/ui, Radix UI, Lucide Icons            |
| Backend        | Next.js Server Actions + legacy API Routes   |
| ORM            | Prisma 7.x                                   |
| Database       | PostgreSQL 15+                               |
| Authentication | NextAuth.js v5                               |
| Authorization  | Custom RBAC                                  |
| Container      | Docker + Docker Compose                      |

---

# 📁 Project Structure

```text
crm-bank/
├── .agents/
│   ├── skills/
│   │   ├── crm-coding-standards/
│   │   │   └── SKILL.md
│   │   └── vercel-react-best-practices/
│   │       ├── SKILL.md
│   │       ├── AGENTS.md
│   │       └── rules/
│   └── workflows/
│       ├── create-feature-ui-first.md
│       └── refactor-module-structure.md
│
├── app/
├── modules/
├── components/
├── lib/
├── prisma/
├── types/
└── docs/
```

---

# 📦 Module Standard

Every business module under:

```text
modules/
```

follows the Module Architecture Contract.

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

Not every module must contain every folder/file.

Create only the folders and files required by the module.

The standard dependency direction is:

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

[MODULE_ARCHITECTURE.md](./MODULE_ARCHITECTURE.md)

---

# 🧠 AI Agent Architecture

AI development configuration is maintained under:

```text
.agents/
```

## Skills

```text
.agents/skills/
```

Skills define rules and standards that the Agent follows.

Primary project Skill:

```text
.agents/skills/crm-coding-standards/SKILL.md
```

React/Next.js performance Skill:

```text
.agents/skills/vercel-react-best-practices/SKILL.md
```

---

## Workflows

```text
.agents/workflows/
```

Current workflows:

```text
create-feature-ui-first.md
refactor-module-structure.md
```

Workflows define development procedures.

They must remain consistent with:

```text
docs/MODULE_ARCHITECTURE.md
docs/CODING_STANDARDS.md
.agents/skills/crm-coding-standards/SKILL.md
```

---

# 🧭 Documentation Authority

Use each document according to its responsibility.

```text
Project Architecture
    → docs/ARCHITECTURE.md

Module Architecture
    → docs/MODULE_ARCHITECTURE.md

Coding Standards
    → docs/CODING_STANDARDS.md

AI Executable Rules
    → .agents/skills/crm-coding-standards/SKILL.md

Domain Terminology / Business Context
    → docs/DOMAIN_GLOSSARY.md

Database Structure
    → prisma/schema.prisma

RBAC Definitions
    → prisma/seed/rbac.ts

Actual Runtime Behavior
    → Current source code
```

Do not assume that one document is the authority for every type of information.

---

# ✅ Before Creating a New Module

Use this sequence:

```text
Requirement
    ↓
Read AI Skill
    ↓
Read Module Architecture Contract
    ↓
Inspect Similar Modules
    ↓
Inspect Shared Components
    ↓
Define Required Features
    ↓
Create Only Required Structure
    ↓
Implement
    ↓
Validate
    ↓
Document
```

Do not use an existing module as the permanent architecture authority.

Existing modules are implementation references only.

---

# 🔄 Before Refactoring a Module

Use this sequence:

```text
Current Module
    ↓
Audit Current Structure
    ↓
Read Module Architecture Contract
    ↓
Map Responsibilities
    ↓
Move to Correct Layers
    ↓
Update Imports / Exports
    ↓
Cleanup
    ↓
Validate
    ↓
Update Documentation
```

Preserve existing behavior unless behavior change is explicitly required.

---

# ⚠️ Important Rules

### DO

- ✅ Follow `docs/MODULE_ARCHITECTURE.md`
- ✅ Follow `docs/CODING_STANDARDS.md`
- ✅ Follow `.agents/skills/crm-coding-standards/SKILL.md`
- ✅ Reuse existing project patterns
- ✅ Use `lib/db.ts` for the shared Prisma client
- ✅ Check permissions in protected Server Actions
- ✅ Use soft delete where applicable
- ✅ Use transactions when required
- ✅ Keep database access in `infrastructure/`
- ✅ Keep business logic in `application/`
- ✅ Keep Server Actions thin
- ✅ Keep UI separate from direct database access
- ✅ Update documentation when meaningful changes are made

### DON'T

- ❌ Use an existing module as the permanent architecture authority
- ❌ Invent new architectural layers without justification
- ❌ Bypass established layers
- ❌ Create duplicate shared components without reason
- ❌ Create a new database client inside a module
- ❌ Hard-delete soft-deletable records
- ❌ Skip server-side permission checks
- ❌ Put business logic in `server/actions.ts`
- ❌ Put database queries directly in UI
- ❌ Modify unrelated modules
- ❌ Mark work complete without validation

---

# 🔍 Validation Before Completion

Before an AI Agent considers a coding task complete:

```text
Architecture
✓ Correct Module
✓ Correct Layer
✓ Correct Dependency Direction
✓ No Layer Bypass
✓ No Circular Dependency

Database
✓ Correct Repository
✓ Soft Delete handled when applicable
✓ Transaction used when required

Server
✓ Authentication
✓ Permission
✓ Application
✓ Revalidation

UI
✓ Mobile-First
✓ Shared Components checked
✓ No direct Database Access

Quality
✓ Type Check
✓ Lint
✓ Relevant Tests
✓ No Broken Imports

Documentation
✓ Module README updated when required
✓ Relevant Documentation updated
```

The complete validation rules are defined in:

```text
docs/CODING_STANDARDS.md
```

---

# 📖 Related Documents

- [AI_CONTEXT.md](./AI_CONTEXT.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [MODULE_ARCHITECTURE.md](./MODULE_ARCHITECTURE.md)
- [CODING_STANDARDS.md](./CODING_STANDARDS.md)
- [DATA_MODEL.md](./DATA_MODEL.md)
- [DOMAIN_GLOSSARY.md](./DOMAIN_GLOSSARY.md)
- [RBAC_POLICY.md](./RBAC_POLICY.md)
- [DECISIONS.md](./DECISIONS.md)

---

# 📝 Documentation Maintenance

When changing project architecture:

1. Update the appropriate Source of Truth.
2. Update dependent documentation.
3. Update AI Skill rules when Agent behavior must change.
4. Update Workflows when development procedures change.
5. Update affected Module documentation.
6. Validate links and references.

Do not allow multiple documents to define conflicting versions of the same architectural rule.

---

**Maintained by**: Development Team
