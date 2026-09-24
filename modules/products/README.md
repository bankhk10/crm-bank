# Products Module

> **Module**: `products`  
> **Purpose**: จัดการสินค้า รวมการแสดงรายการ สร้าง แก้ไข และลบสินค้า  
> **Architecture Authority**: [`docs/MODULE_ARCHITECTURE.md`](../../docs/MODULE_ARCHITECTURE.md)  
> **Coding Standards**: [`docs/CODING_STANDARDS.md`](../../docs/CODING_STANDARDS.md)

---

## 1. Module Architecture

This module follows the project-wide Module Architecture Contract.

Current structure:

```text
modules/products/
├── application/
│   ├── create-product.ts
│   ├── update-product.ts
│   ├── validations.ts
│   └── index.ts
│
├── features/
│   ├── form/
│   │   └── product-form.tsx
│   └── list-view/
│       ├── products-table.tsx
│       └── use-product-columns.tsx
│
├── infrastructure/
│   └── product.repository.ts
│
├── server/
│   └── actions.ts
│
├── types/
│   └── index.ts
│
├── ui/
│   └── product-status-badge.tsx
│
├── constants.ts
├── index.ts
└── README.md
```

> โครงสร้างนี้เป็นโครงสร้างปัจจุบันของ Module ณ เวลาที่จัดทำเอกสาร  
> ไม่ได้หมายความว่าทุก Module ต้องมีทุก Folder/File เหมือนกันทั้งหมด  
> ให้สร้างเฉพาะส่วนที่จำเป็นตาม Requirement และ Module Architecture Contract

---

## 2. Layer Responsibilities

| Layer             | Responsibility                                                 |
| ----------------- | -------------------------------------------------------------- |
| `features/`       | UI screens และ feature-specific UI behavior                    |
| `server/`         | Server Actions, authentication, permission และ revalidation    |
| `application/`    | Business logic, validation, uniqueness checks และ data mapping |
| `infrastructure/` | Prisma / Database access                                       |
| `types/`          | Module-specific TypeScript types                               |
| `ui/`             | Module-specific reusable UI components                         |
| `constants.ts`    | Static options และ configuration values                        |
| `index.ts`        | Public module exports                                          |
| `README.md`       | Module documentation                                           |

Dependency direction:

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

---

## 3. Infrastructure

Database access is located in:

```text
modules/products/infrastructure/product.repository.ts
```

Repository responsibilities:

- Product database queries
- Product CRUD operations
- Form option queries
- Persistence-related data mapping when necessary

Repository MUST remain focused on data access.

It must not contain:

- Authentication
- Authorization
- UI logic
- Business rules

Use the project's shared database client from:

```ts
import { db } from "@/lib/db";
```

---

## 4. Application

Application logic is located under:

```text
modules/products/application/
```

Current files:

```text
create-product.ts
update-product.ts
validations.ts
index.ts
```

Responsibilities:

- Create product use case
- Update product use case
- Validation
- Uniqueness checks
- Application-level data mapping

Business logic should remain in this layer rather than being duplicated in Server Actions or UI components.

---

## 5. Server Actions

Server Actions are located in:

```text
modules/products/server/actions.ts
```

Current public actions include:

```tsx
import {
  listProductsAction,
  getProductAction,
  createProductAction,
  updateProductAction,
  deleteProductAction,
  getProductFormOptionsAction,
} from "@/modules/products";
```

### Server Action Flow

Protected operations should follow:

```text
Authentication
    ↓
Permission
    ↓
Application Logic
    ↓
Revalidation
```

Server Actions should remain thin and should not contain duplicated business logic or direct database queries when the established Application/Infrastructure layers are available.

---

## 6. Features

### 6.1 List View

Located in:

```text
features/list-view/
```

Current implementation:

```text
products-table.tsx
use-product-columns.tsx
```

`ProductsTable` provides:

- Responsive product listing
- Desktop table
- Mobile cards
- Inline toolbar

The list view should remain responsible for presentation, interaction, and UI state rather than business rules or database access.

---

### 6.2 Form

Located in:

```text
features/form/
```

Current implementation:

```text
product-form.tsx
```

`ProductForm` provides:

- Product create/edit form
- Dynamic form options
- Gallery upload
- Validation feedback

---

## 7. Module UI

Module-specific reusable UI is located in:

```text
ui/
```

Current implementation:

```text
product-status-badge.tsx
```

`ProductStatusBadge` displays the ACTIVE/INACTIVE product status.

Before creating new reusable UI, check shared components under:

```text
@/components/custom/
```

and reuse existing components when appropriate.

---

## 8. Shared Dependencies

This module currently uses shared project resources such as:

```text
@/components/custom/
@/components/ui/
@/types/product
@/hooks/
@/lib/auth
```

For the current implementation, `useFileUpload` is used from:

```text
@/hooks/
```

Shared resources should be reused rather than duplicated inside the module.

---

## 9. Product Form Options

`getProductFormOptionsAction` consolidates the Product form's option loading into a single server action.

Current documented behavior:

- Consolidates 7 separate option sources into one Server Action.
- Sources include units, groups, brands, product groups, plants, categories, and ABC types.
- Deduplicates option values to prevent React key collisions.

Do not duplicate this option-loading logic across multiple Product components.

---

## 10. Image Upload

Product image upload currently uses an API route:

```text
/api/products/[id]/images
```

This is retained because the current implementation uses upload progress tracking that depends on XHR progress behavior.

This is a documented exception to the module's preferred Server Action flow.

Do not replace the upload mechanism during unrelated feature work.

If the upload architecture is changed later, document the decision and update affected workflows/documentation.

---

## 11. Legacy API Compatibility

Existing Product API routes are preserved for backward compatibility.

They may be deprecated later as the module's server architecture evolves.

Do not remove or migrate legacy API routes as part of unrelated Product feature changes.

Any migration should be intentional, scoped, tested, and documented.

---

## 12. Data & Security Rules

When changing Product data behavior:

- Verify `prisma/schema.prisma`.
- Use the repository for database operations.
- Apply soft-delete rules where the Product entity supports `deletedAt`.
- Validate server-side before mutation.
- Check authentication and permission in protected Server Actions.
- Use transactions when multiple writes must be atomic.
- Do not bypass the established module data flow.

---

## 13. Development Rules for AI

When modifying this module, the AI Agent MUST:

1. Read `docs/MODULE_ARCHITECTURE.md`.
2. Read `docs/CODING_STANDARDS.md`.
3. Inspect the current `products` implementation.
4. Search for similar project patterns before introducing new code.
5. Check shared components before creating new UI components.
6. Preserve existing Product behavior unless change is explicitly required.
7. Keep business logic in `application/`.
8. Keep database access in `infrastructure/`.
9. Keep Server Actions thin.
10. Keep UI inside `features/` and module-specific reusable UI inside `ui/`.
11. Update this README when module structure or significant functionality changes.
12. Run relevant validation before completing the task.

The AI Agent MUST NOT:

- Use `products` as the permanent architecture authority for other modules.
- Introduce a new architectural layer without justification.
- Put database access directly into UI components.
- Put business logic into `server/actions.ts`.
- Duplicate existing shared components without reason.
- Perform unrelated refactoring.

---

## 14. Validation Checklist

Before considering a Product module change complete:

### Architecture

- [ ] Correct module layer used.
- [ ] Dependency direction is preserved.
- [ ] No layer bypass.
- [ ] No circular dependency.
- [ ] No unnecessary architectural layer introduced.

### Database

- [ ] Repository handles database access.
- [ ] Shared database client is used.
- [ ] Soft delete handled when applicable.
- [ ] Transaction used when required.

### Server

- [ ] Authentication checked.
- [ ] Permission checked.
- [ ] Application logic called.
- [ ] Revalidation handled.
- [ ] No duplicated business logic.

### UI

- [ ] Mobile-first.
- [ ] Shared components checked first.
- [ ] No direct database access from UI.
- [ ] Existing UX behavior preserved unless explicitly changed.

### Code Quality

- [ ] Naming conventions followed.
- [ ] No unnecessary duplicate logic.
- [ ] No unrelated files changed.
- [ ] Relevant type-check/lint/tests pass.

### Documentation

- [ ] README updated when meaningful module changes are made.
- [ ] Relevant global/module documentation updated when required.

---

## 15. Related Documentation

- [`docs/AI_CONTEXT.md`](../../docs/AI_CONTEXT.md)
- [`docs/ARCHITECTURE.md`](../../docs/ARCHITECTURE.md)
- [`docs/MODULE_ARCHITECTURE.md`](../../docs/MODULE_ARCHITECTURE.md)
- [`docs/CODING_STANDARDS.md`](../../docs/CODING_STANDARDS.md)
- [`docs/DATA_MODEL.md`](../../docs/DATA_MODEL.md)
- [`docs/RBAC_POLICY.md`](../../docs/RBAC_POLICY.md)
- [`docs/DECISIONS.md`](../../docs/DECISIONS.md)

---

**Maintained by**: Development Team
