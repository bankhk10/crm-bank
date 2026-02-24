# Temporary Credit Limits Module

คำขอวงเงินเครดิตชั่วคราว (Temporary Credit Limits)

## โครงสร้าง

```
modules/temporary-credit-limits/
 ┣ features/                      ← UI screens
 ┃ ┣ form/
 ┃ ┃ ┗ temporary-credit-limit-form.tsx
 ┃ ┗ list-view/
 ┃   ┣ temporary-credit-limit-table.tsx    (รวม toolbar inline)
 ┃   ┣ temporary-credit-limit-cards.tsx
 ┃   ┗ use-temporary-credit-limit-columns.tsx
 ┃
 ┣ application/                   ← use cases (business logic)
 ┃ ┣ create-temporary-credit-limit.ts
 ┃ ┣ update-temporary-credit-limit.ts
 ┃ ┣ approve-temporary-credit-limit.ts
 ┃ ┣ expire-temporary-credit-limit.ts
 ┃ ┣ validations.ts               (Zod schemas ใช้ร่วม client/server)
 ┃ ┗ index.ts                     (facade + inline thin use cases)
 ┃
 ┣ server/                        ← transport (server actions only)
 ┃ ┗ actions.ts
 ┃
 ┣ infrastructure/                ← prisma / db access
 ┃ ┗ temporary-credit-limit.repository.ts
 ┃
 ┣ ui/                            ← module-specific ui
 ┃ ┗ temporary-credit-limit-status-badge.tsx
 ┃
 ┣ types/
 ┃ ┗ index.ts
 ┃
 ┣ constants.ts
 ┣ index.ts                       (barrel exports)
 ┗ README.md
```

## Architecture Layers

### 1. Infrastructure (`infrastructure/`)

- เฉพาะ Prisma/database operations
- Pure functions ไม่มี business logic หรือ auth check
- Functions: `findTemporaryCreditLimits`, `findTemporaryCreditLimitById`, `createTemporaryCreditLimit`, `updateTemporaryCreditLimit`, `softDeleteTemporaryCreditLimit`, `processTemporaryCreditApprovalTransaction`, `findExpiredTemporaryCredits`

### 2. Application (`application/`)

- Business logic: validation, business rules, data mapping
- Complex use cases แยกไฟล์: create, update, approve, expire
- Thin use cases inline ใน `index.ts`: get detail, list, delete
- `validations.ts` → Zod schemas ใช้ร่วมระหว่าง client form กับ server

### 3. Server (`server/actions.ts`)

- `"use server"` directive
- ทำแค่ 3 สิ่ง: Auth/Permission → use case → revalidatePath
- ไม่มี business logic

### 4. Features (`features/`)

- UI screens: form, list-view (table + cards + columns)
- Toolbar inline ใน table file

### 5. UI (`ui/`)

- Module-specific UI components เช่น status badge

## หมายเหตุ

- API routes ที่ `/api/temporary-credit-limits/` ยังคงอยู่สำหรับ GET requests ที่ใช้จาก client-side pages
- Background expiry service (`lib/services/temporary-credit-expiry.service.ts`) ยังคงอยู่แยกต่างหาก
