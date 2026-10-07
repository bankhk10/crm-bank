# Employee Module

> **Module**: `employee`  
> **Purpose**: จัดการข้อมูลพนักงาน รวมข้อมูลส่วนตัว ข้อมูลการจ้างงาน บทบาท และสิทธิ์การเข้าถึง  
> **Architecture Authority**: [`docs/MODULE_ARCHITECTURE.md`](../../docs/MODULE_ARCHITECTURE.md)  
> **Coding Standards**: [`docs/CODING_STANDARDS.md`](../../docs/CODING_STANDARDS.md)  
> **RBAC Policy**: [`docs/RBAC_POLICY.md`](../../docs/RBAC_POLICY.md)

---

## 1. Module Overview

Employee Module รับผิดชอบข้อมูลและการทำงานที่เกี่ยวข้องกับพนักงาน เช่น:

- Employee profile
- Employee code
- Department
- Position
- Manager hierarchy
- Linked User
- Employee status
- Signature-related processing
- Employee-specific access information

Module นี้ต้องปฏิบัติตาม Project-wide Module Architecture Contract

> `employee` เป็น **Current Implementation** เท่านั้น ไม่ใช่ Architecture Authority ของ Module อื่น  
> มาตรฐานกลางกำหนดโดย `docs/MODULE_ARCHITECTURE.md`

---

## 2. Current Directory Structure

```text
modules/employee/
├── application/
│   ├── create-employee.ts
│   ├── signature-utils.ts
│   ├── update-employee.ts
│   ├── validations.ts
│   └── index.ts
│
├── features/
│   ├── detail-view/
│   │   └── employee-detail-view.tsx
│   │
│   ├── form/
│   │   ├── employee-edit-view.tsx
│   │   ├── employee-form-wrapper.tsx
│   │   ├── employee-form.tsx
│   │   └── employee-new-view.tsx
│   │
│   └── list-view/
│       ├── employee-cards.tsx
│       ├── employee-list-view.tsx
│       ├── employee-table.tsx
│       └── use-employee-columns.tsx
│
├── infrastructure/
│   └── employee.repository.ts
│
├── server/
│   └── actions.ts
│
├── types/
│   └── index.ts
│
├── ui/
│   └── employee-status-badge.tsx
│
├── constants.ts
├── index.ts
└── README.md
```

> โครงสร้างด้านบนเป็นภาพของ Current Implementation จากเอกสารของ Module  
> ไม่ได้หมายความว่า Module ใหม่ทุกตัวต้องมีทุกไฟล์เหมือนกันทั้งหมด

---

## 3. Module Architecture

Employee follows the standard project dependency direction:

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

### Layer Responsibilities

| Layer             | Responsibility                                           |
| ----------------- | -------------------------------------------------------- |
| `features/`       | UI screens, forms, lists, details, user interaction      |
| `server/`         | Authentication, permission, Server Actions, revalidation |
| `application/`    | Business logic, validation, use-case orchestration       |
| `infrastructure/` | Database / persistence access                            |
| `types/`          | Employee-specific TypeScript types                       |
| `ui/`             | Employee-specific reusable UI                            |
| `constants.ts`    | Employee-specific constants                              |
| `index.ts`        | Public module exports                                    |
| `README.md`       | Module documentation                                     |

---

## 4. Features

### List View

```text
features/list-view/
├── employee-cards.tsx
├── employee-list-view.tsx
├── employee-table.tsx
└── use-employee-columns.tsx
```

Responsibilities:

- แสดงรายการพนักงาน
- Table / Card presentation
- Column definitions
- UI-specific state and interaction

`features/` MUST NOT:

- Access database directly
- Import repositories directly
- Contain Prisma queries
- Contain core business rules

---

### Form

```text
features/form/
├── employee-edit-view.tsx
├── employee-form-wrapper.tsx
├── employee-form.tsx
└── employee-new-view.tsx
```

Responsibilities:

- Create Employee UI
- Edit Employee UI
- Form presentation
- User interaction
- Validation feedback
- Loading / pending UI

Server-side validation and business rules remain in Application/Server boundaries.

---

### Detail View

```text
features/detail-view/
└── employee-detail-view.tsx
```

Responsible for presenting Employee detail information.

It MUST NOT access the database directly.

---

## 5. Application

Application files:

```text
application/
├── create-employee.ts
├── signature-utils.ts
├── update-employee.ts
├── validations.ts
└── index.ts
```

### Current Use Cases

| Use Case                   | Responsibility                                            |
| -------------------------- | --------------------------------------------------------- |
| `createEmployeeUseCase`    | Validate, check uniqueness, create employee + linked user |
| `updateEmployeeUseCase`    | Validate, update employee and sync linked user            |
| `getEmployeeDetailUseCase` | Retrieve a single employee by ID                          |
| `listEmployeesUseCase`     | List employees with pagination/filtering                  |
| `listAllEmployeesUseCase`  | List employees for dropdown/use-case consumption          |

Business logic MUST remain in Application.

Application MUST NOT:

- Contain React components
- Contain UI presentation
- Perform authentication transport logic
- Depend on UI
- Duplicate database access when repository access is available

---

## 6. Validation

Employee input must be validated according to the project's Application validation standard.

Current location:

```text
modules/employee/application/validations.ts
```

Use Zod according to project standards.

Validation should cover applicable requirements such as:

- Required fields
- Data formats
- Length constraints
- Business constraints
- Uniqueness-related input rules

Server-side validation is required for mutations.

---

## 7. Signature Processing

The module currently contains:

```text
application/signature-utils.ts
```

This file is specific to Employee signature upload/processing behavior.

Keep signature-related business/application behavior within the Employee Module.

If the implementation later becomes a project-wide shared capability, evaluate promotion to shared infrastructure only when there is actual cross-module reuse.

---

## 8. Server Actions

Current Server Action file:

```text
server/actions.ts
```

Protected operations must follow:

```text
Authentication
    ↓
Permission
    ↓
Application
    ↓
Revalidation
```

Server Actions should remain thin.

They MUST NOT:

- Contain duplicated business logic
- Directly query the database when Application/Infrastructure is available
- Contain UI logic

---

## 9. Infrastructure

Current repository:

```text
infrastructure/
└── employee.repository.ts
```

Infrastructure is responsible for:

- Database queries
- Employee persistence
- Related data access required by Employee use cases

Use the shared database client:

```ts
import { db } from "@/lib/db";
```

Repository code MUST NOT contain:

- Authentication
- Authorization
- UI presentation
- Business rules

For entities that support soft delete, repository queries must apply the project's soft-delete convention.

---

## 10. Types

Current module types:

```text
types/
└── index.ts
```

Use this location for Employee-specific shared types.

Avoid duplicate definitions of the same concept across Application, Features, and Server.

---

## 11. Module UI

Current module-specific UI:

```text
ui/
└── employee-status-badge.tsx
```

Use `ui/` for reusable components that specifically belong to Employee.

Before creating a new component:

1. Check `@/components/custom/`.
2. Search similar implementations.
3. Reuse shared components when appropriate.
4. Create an Employee-specific component only when ownership clearly belongs to Employee.

---

## 12. Shared Components

The project-wide reusable components currently include:

| Component       | Path                                   |
| --------------- | -------------------------------------- |
| `TruncatedCell` | `components/custom/truncated-cell.tsx` |
| `ActionButton`  | `components/custom/action-button.tsx`  |
| `DetailItem`    | `components/custom/detail-item.tsx`    |

Employee should reuse these components where applicable.

Do not duplicate shared components inside the module.

---

## 13. Data Flow

### Create Employee

```text
Employee Form
     ↓
Server Action
     ↓
Authentication
     ↓
Permission
     ↓
createEmployeeUseCase
     ↓
Validation / Business Rules
     ↓
employee.repository.ts
     ↓
Database
     ↓
Revalidation
     ↓
UI
```

### Update Employee

```text
Employee Form
     ↓
Server Action
     ↓
Authentication
     ↓
Permission
     ↓
updateEmployeeUseCase
     ↓
Validation / Business Rules
     ↓
employee.repository.ts
     ↓
Database
     ↓
Revalidation
```

### Read Employee

```text
UI
 ↓
Server / Application
 ↓
Repository
 ↓
Database
```

Actual implementation should always be verified against current source code before making changes.

---

## 14. RBAC Integration

Employee-related protected actions must follow:

```text
Authentication
    ↓
Permission
    ↓
Application
```

RBAC rules are defined globally in:

```text
docs/RBAC_POLICY.md
```

Do not create a separate Employee-specific authorization system.

Known Employee permissions include:

```text
employee.view
employee.create
employee.edit
employee.delete
```

Verify the current permission definitions against the RBAC source of truth before implementing new protected functionality.

---

## 15. Database Rules

When changing Employee data:

1. Check `prisma/schema.prisma`.
2. Check existing Employee relationships.
3. Check existing repository methods.
4. Check Application business rules.
5. Respect `deletedAt` when the entity supports soft delete.
6. Use transactions when multiple writes must be atomic.
7. Update relevant documentation when the data model meaning changes.

Do not infer database structure from this README when the current Prisma schema can be checked.

---

## 16. Public Module API

The module entry point is:

```text
modules/employee/index.ts
```

Use it to expose public Employee APIs to other parts of the application.

Avoid exposing unnecessary internal implementation details.

Do not create cross-module deep imports into internal Employee files unless the project architecture explicitly permits them.

---

## 17. Development Rules for AI

When modifying Employee:

1. Read `.agents/skills/crm-coding-standards/SKILL.md`.
2. Read `docs/MODULE_ARCHITECTURE.md`.
3. Read `docs/CODING_STANDARDS.md`.
4. Read relevant RBAC rules when the task is permission-related.
5. Inspect the current Employee implementation.
6. Search for similar existing patterns.
7. Check shared components before creating new ones.
8. Preserve existing behavior unless change is explicitly required.
9. Keep business logic in `application/`.
10. Keep database access in `infrastructure/`.
11. Keep Server Actions thin.
12. Update this README when meaningful module behavior or structure changes.
13. Validate the result before completion.

### Important

`employee` is an existing implementation reference only.

It MUST NOT be treated as the permanent architecture authority for other modules.

The architecture authority is:

```text
docs/MODULE_ARCHITECTURE.md
```

---

## 18. Refactoring Rules

When refactoring Employee:

```text
Current Implementation
        ↓
Audit
        ↓
Compare with Module Architecture Contract
        ↓
Identify deviations
        ↓
Move responsibilities to correct layers
        ↓
Update imports/exports
        ↓
Verify behavior
        ↓
Update documentation
        ↓
Validate
```

Preserve existing business behavior unless the task explicitly requires a behavior change.

Do not refactor unrelated modules during an Employee task.

---

## 19. Validation Checklist

### Architecture

- [ ] Correct layer used.
- [ ] Dependency direction preserved.
- [ ] No layer bypass.
- [ ] No circular dependency.
- [ ] No unnecessary new architecture.

### Features

- [ ] UI remains in `features/`.
- [ ] No direct database access.
- [ ] Shared components checked first.
- [ ] Mobile-first standards followed.

### Application

- [ ] Business logic remains in `application/`.
- [ ] Validation remains in the correct layer.
- [ ] No duplicated business logic.

### Server

- [ ] Authentication checked.
- [ ] Permission checked.
- [ ] Application logic called.
- [ ] Revalidation handled.

### Infrastructure

- [ ] Database operations remain in `infrastructure/`.
- [ ] Shared database client used.
- [ ] Soft delete handled when applicable.
- [ ] Transaction used when required.

### Quality

- [ ] No unnecessary duplication.
- [ ] No unrelated files changed.
- [ ] Type check passes.
- [ ] Lint passes.
- [ ] Relevant tests pass.
- [ ] No broken imports/references.

### Documentation

- [ ] README updated when module structure/behavior meaningfully changes.
- [ ] Relevant global documentation updated when required.

---

## 20. Related Documentation

- [`docs/AI_CONTEXT.md`](../../docs/AI_CONTEXT.md)
- [`docs/ARCHITECTURE.md`](../../docs/ARCHITECTURE.md)
- [`docs/MODULE_ARCHITECTURE.md`](../../docs/MODULE_ARCHITECTURE.md)
- [`docs/CODING_STANDARDS.md`](../../docs/CODING_STANDARDS.md)
- [`docs/DATA_MODEL.md`](../../docs/DATA_MODEL.md)
- [`docs/DOMAIN_GLOSSARY.md`](../../docs/DOMAIN_GLOSSARY.md)
- [`docs/RBAC_POLICY.md`](../../docs/RBAC_POLICY.md)
- [`docs/DECISIONS.md`](../../docs/DECISIONS.md)

---

**Maintained by**: Development Team
