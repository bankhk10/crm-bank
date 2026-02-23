# Employee Feature

This module manages employee records, including their personal details, employment information, assigned roles, and access permissions. It follows the project's standard enterprise module architecture.

## Directory Structure

```
employee/
 ┣ features/                      ⭐ UI screens
 ┃ ┣ detail-view/
 ┃ ┃ ┗ employee-detail-view.tsx
 ┃ ┣ form/
 ┃ ┃ ┣ employee-form.tsx
 ┃ ┃ ┗ employee-form-wrapper.tsx
 ┃ ┗ list-view/
 ┃   ┣ employee-table.tsx          (includes toolbar inline)
 ┃   ┣ employee-cards.tsx
 ┃   ┗ use-employee-columns.tsx
 ┃
 ┣ application/                   ⭐ use cases (business logic)
 ┃ ┣ create-employee.ts           create use case (complex)
 ┃ ┣ update-employee.ts           update use case (complex)
 ┃ ┣ validations.ts               Zod schemas
 ┃ ┗ index.ts                     ⭐ facade + inline use cases
 ┃
 ┣ server/                        ⭐ transport (server actions)
 ┃ ┗ actions.ts
 ┃
 ┣ infrastructure/                ⭐ prisma / db access
 ┃ ┗ employee.repository.ts
 ┃
 ┣ ui/                            ⭐ module-specific ui
 ┃ ┗ employee-status-badge.tsx
 ┃
 ┣ types/
 ┃ ┗ index.ts
 ┃
 ┣ constants.ts
 ┣ index.ts
 ┗ README.md
```

## Shared Components

The following components were extracted to `components/custom/` for project-wide reuse:

| Component       | Path                                   | Used by                                                                           |
| --------------- | -------------------------------------- | --------------------------------------------------------------------------------- |
| `TruncatedCell` | `components/custom/truncated-cell.tsx` | employee, products, sales, fulfillment, customers                                 |
| `ActionButton`  | `components/custom/action-button.tsx`  | employee, products, sales, fulfillment, customers, temporary-credit-limits        |
| `DetailItem`    | `components/custom/detail-item.tsx`    | employee, companies, shipping-companies, sales, products, temporary-credit-limits |

---

## Architecture Layers

### 1. Features (`features/`)

UI screens and components that are directly rendered on pages.

- **`list-view/`**: Table (with toolbar), cards, and column definitions.
- **`form/`**: The form UI component and its wrapper.
- **`detail-view/`**: The employee detail page component.

### 2. Application (`application/`)

Pure business logic use cases.

| Use Case                   | Description                                          |
| :------------------------- | :--------------------------------------------------- |
| `createEmployeeUseCase`    | Validates, checks uniqueness, creates employee+user  |
| `updateEmployeeUseCase`    | Validates, updates employee and syncs linked user    |
| `getEmployeeDetailUseCase` | Retrieves a single employee by ID (inline)           |
| `listEmployeesUseCase`     | Lists employees with pagination & filtering (inline) |
| `listAllEmployeesUseCase`  | Lists all employees for dropdowns (inline)           |

### 3. Server (`server/`)

Transport layer – Server Actions. Handles auth, permissions, revalidation.

### 4. Infrastructure (`infrastructure/`)

Data access layer – all Prisma/database interactions.

### 5. UI (`ui/`)

Module-specific atomic UI components (e.g., `EmployeeStatusBadge`).

### 6. Types (`types/`)

Shared TypeScript type definitions specific to this module.
