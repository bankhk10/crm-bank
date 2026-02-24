# Shipping Companies Module

## Architecture

โมดูลนี้ใช้สถาปัตยกรรมแบบ Layered Architecture ตามแพทเทิร์นเดียวกับ `modules/employee`

```
modules/shipping-companies/
 ┣ features/                        ← UI screens
 ┃ ┣ detail-view/
 ┃ ┃ ┗ shipping-company-detail-view.tsx
 ┃ ┣ form/
 ┃ ┃ ┣ shipping-company-form.tsx
 ┃ ┃ ┣ shipping-company-new-view.tsx
 ┃ ┃ ┗ shipping-company-edit-view.tsx
 ┃ ┗ list-view/
 ┃   ┣ shipping-companies-table.tsx   (รวม toolbar inline)
 ┃   ┗ use-shipping-company-columns.tsx
 ┃
 ┣ application/                     ← use cases (business logic)
 ┃ ┣ create-shipping-company.ts     (create use case)
 ┃ ┣ update-shipping-company.ts     (update use case)
 ┃ ┣ validations.ts                 (Zod schemas ใช้ร่วม client/server)
 ┃ ┗ index.ts                       (facade + inline thin use cases)
 ┃
 ┣ server/                          ← transport (server actions only)
 ┃ ┗ actions.ts
 ┃
 ┣ infrastructure/                  ← prisma / db access
 ┃ ┗ shipping-company.repository.ts
 ┃
 ┣ ui/                              ← module-specific ui
 ┃ ┗ shipping-company-status-badge.tsx
 ┃
 ┣ types/
 ┃ ┗ index.ts
 ┃
 ┣ constants.ts
 ┣ index.ts                         (barrel exports)
 ┗ README.md
```

## Layer Rules

### 1. Infrastructure (`infrastructure/shipping-company.repository.ts`)

- **เฉพาะ** Prisma/database operations เท่านั้น
- ไม่มี business logic, ไม่มี auth check, ไม่มี validation
- Functions: `findShippingCompanies`, `findShippingCompanyById`, `createShippingCompany`, `updateShippingCompany`, `softDeleteShippingCompany`

### 2. Application (`application/`)

- **Business logic** อยู่ที่นี่: validation, data mapping
- Use case ที่ซับซ้อน (create, update) → แยกไฟล์
- Use case ที่บาง (get detail, list) → inline ใน `index.ts`
- `validations.ts` → Zod schemas ใช้ร่วมระหว่าง client form กับ server

### 3. Server (`server/actions.ts`)

- **"use server"** directive เท่านั้น
- ทำแค่ 3 สิ่ง: (1) Auth/Permission check, (2) เรียก use case, (3) revalidatePath
- **ห้าม** มี business logic ใน actions

### 4. Features (`features/`)

- UI screens จัดกลุ่มตาม screen: `detail-view/`, `form/`, `list-view/`
- Table component รวม toolbar inline
- ใช้ shared components จาก `@/components/custom/`
