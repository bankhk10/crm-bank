# Companies Feature

This module manages the companies data, including their basic info, contacts, address, and status. It follows the project's standard enterprise module architecture.

## Directory Structure

```
companies/
 ┣ features/                      ⭐ UI screens
 ┃ ┣ detail-view/
 ┃ ┃ ┗ company-detail-view.tsx
 ┃ ┣ form/
 ┃ ┃ ┣ company-form.tsx
 ┃ ┃ ┗ company-form-wrapper.tsx
 ┃ ┗ list-view/
 ┃   ┣ companies-table.tsx         (includes toolbar inline)
 ┃   ┣ companies-cards.tsx
 ┃   ┣ companies-kanban-board.tsx
 ┃   ┣ companies-view.tsx
 ┃   ┗ use-company-columns.tsx
 ┃
 ┣ application/                   ⭐ use cases (business logic)
 ┃ ┣ create-company.ts            create use case (complex)
 ┃ ┣ update-company.ts            update use case (complex)
 ┃ ┣ validations.ts               Zod schemas
 ┃ ┗ index.ts                     ⭐ facade + inline use cases
 ┃
 ┣ server/                        ⭐ transport (server actions)
 ┃ ┗ actions.ts
 ┃
 ┣ infrastructure/                ⭐ prisma / db access
 ┃ ┗ company.repository.ts
 ┃
 ┣ ui/                            ⭐ module-specific ui
 ┃ ┣ company-card.tsx
 ┃ ┗ company-status-badge.tsx
 ┃
 ┣ types/
 ┃ ┣ index.ts
 ┃ ┗ types.ts
 ┃
 ┣ constants.ts
 ┣ index.ts
 ┗ README.md
```

## Shared Components

The following components were previously duplicated and are now imported from `components/custom/` for project-wide reuse:

| Component    | Path                                | Used by                                        |
| ------------ | ----------------------------------- | ---------------------------------------------- |
| `DetailItem` | `components/custom/detail-item.tsx` | `features/detail-view/company-detail-view.tsx` |

---

## Architecture Layers

### 1. Features (`features/`)

UI screens and components that are directly rendered on pages.

- **`list-view/`**: Table, cards, kanban view, and column definitions.
- **`form/`**: The form UI component and its wrapper.
- **`detail-view/`**: The company detail page component.

### 2. Application (`application/`)

Pure business logic use cases.
| Use Case | Description |
| :----------------------------- | :-------------------------------------------------- |
| `createCompanyUseCase` | Validates and creates a company |
| `updateCompanyUseCase` | Validates and updates a company |
| `getCompanyDetailUseCase` | Retrieves a single company by ID (inline) |
| `listCompaniesUseCase` | Lists companies with pagination & filtering (inline)|
| `listAllActiveCompaniesUseCase`| Lists all active companies for dropdowns (inline) |

### 3. Server (`server/`)

Transport layer – Server Actions. Handles auth, permissions, revalidation.

### 4. Infrastructure (`infrastructure/`)

Data access layer – all Prisma/database interactions.

### 5. UI (`ui/`)

Module-specific atomic UI components (e.g., `CompanyStatusBadge`).

### 6. Types (`types/`)

Shared TypeScript type definitions specific to this module.
