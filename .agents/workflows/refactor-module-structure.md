---
description: Refactor a module to follow the employee module's layered architecture (infrastructure → application → server → features)
---

# Refactor Module Structure (Employee Pattern)

ต้องการปรับโครงสร้างของ module `sales-targets` ให้เป็นไปตามรูปแบบเดียวกับ `modules/employee`

## โครงสร้างเป้าหมาย

```
modules/[MODULE_NAME]/
 ┣ features/                      ← UI screens
 ┃ ┣ detail-view/
 ┃ ┃ ┗ [MODULE]-detail-view.tsx
 ┃ ┣ form/
 ┃ ┃ ┣ [MODULE]-form.tsx
 ┃ ┃ ┗ [MODULE]-form-wrapper.tsx
 ┃ ┗ list-view/
 ┃   ┣ [MODULE]-table.tsx          (รวม toolbar inline)
 ┃   ┣ [MODULE]-cards.tsx
 ┃   ┗ use-[MODULE]-columns.tsx
 ┃
 ┣ application/                   ← use cases (business logic)
 ┃ ┣ create-[MODULE].ts           (complex use case → แยกไฟล์)
 ┃ ┣ update-[MODULE].ts           (complex use case → แยกไฟล์)
 ┃ ┣ validations.ts               (Zod schemas ใช้ร่วม client/server)
 ┃ ┗ index.ts                     (facade + inline thin use cases)
 ┃
 ┣ server/                        ← transport (server actions only)
 ┃ ┗ actions.ts
 ┃
 ┣ infrastructure/                ← prisma / db access
 ┃ ┗ [MODULE].repository.ts
 ┃
 ┣ ui/                            ← module-specific ui (เช่น status badge)
 ┃ ┗ [MODULE]-status-badge.tsx
 ┃
 ┣ types/
 ┃ ┗ index.ts
 ┃
 ┣ constants.ts
 ┣ index.ts                       (barrel exports)
 ┗ README.md
```

## กฎสำคัญ

### 1. Infrastructure Layer (`infrastructure/[MODULE].repository.ts`)

- **เฉพาะ** Prisma/database operations เท่านั้น
- ไม่มี business logic, ไม่มี auth check, ไม่มี validation
- export pure functions เช่น `findXxxById`, `findAllXxx`, `createXxx`, `updateXxx`, `softDeleteXxx`
- ดูตัวอย่างที่ `modules/employee/infrastructure/employee.repository.ts`

### 2. Application Layer (`application/`)

- **Business logic** อยู่ที่นี่: validation, uniqueness checks, data mapping
- Use case ที่ซับซ้อน (create, update) → แยกไฟล์ (`create-[MODULE].ts`, `update-[MODULE].ts`)
- Use case ที่บาง (get detail, list) → inline ใน `index.ts`
- `validations.ts` → Zod schemas ใช้ร่วมระหว่าง client form กับ server
- `index.ts` → facade รวม exports ทั้งหมด
- ดูตัวอย่างที่ `modules/employee/application/index.ts`

### 3. Server Layer (`server/actions.ts`)

- **"use server"** directive เท่านั้น
- ทำแค่ 3 สิ่ง: (1) Auth/Permission check, (2) เรียก use case, (3) revalidatePath
- **ห้าม** มี business logic ใน actions
- import use cases จาก `../application`
- ดูตัวอย่างที่ `modules/employee/server/actions.ts`

### 4. Features Layer (`features/`)

- UI screens จัดกลุ่มตาม screen: `detail-view/`, `form/`, `list-view/`
- Toolbar ที่ใช้ที่เดียว → inline ใน table file (ไม่แยกไฟล์)
- ใช้ shared components จาก `@/components/custom/`:
  - `TruncatedCell` → `@/components/custom/truncated-cell`
  - `ActionButton` → `@/components/custom/action-button`
  - `DetailItem` → `@/components/custom/detail-item`

### 5. Barrel Exports (`index.ts`)

- export ทุกอย่างที่ outsiders ต้องใช้: types, constants, application, ui, features

## ขั้นตอนทำงาน

### Step 1: วิเคราะห์โครงสร้างปัจจุบัน

- สำรวจ directory structure ปัจจุบันของ `modules/[MODULE_NAME]`
- ระบุไฟล์ทั้งหมดและหน้าที่ของแต่ละไฟล์
- ค้นหาทุก import path ที่อ้างอิง module นี้ (`grep "@/modules/[MODULE_NAME]"`)

### Step 2: สร้าง Infrastructure Layer

- สร้าง `infrastructure/[MODULE].repository.ts`
- ย้าย database operations ทั้งหมดจาก server actions/queries มารวมไว้ที่นี่
- แต่ละ function เป็น pure database operation (ไม่มี auth, validation)

### Step 3: สร้าง Application Layer

- สร้าง `application/validations.ts` ← ย้าย Zod schemas มาจาก server/validations
- สร้าง `application/create-[MODULE].ts` ← extract create logic (validation + persistence)
- สร้าง `application/update-[MODULE].ts` ← extract update logic
- สร้าง `application/index.ts` ← facade + inline thin use cases (get detail, list)

### Step 4: อัปเดต Server Layer

- เขียน `server/actions.ts` ใหม่ให้ thin: auth → use case → revalidate
- ลบ `server/queries.ts` และ `server/validations.ts` (ถ้ามี)
- แก้ imports ที่อ้างอิง queries/validations เดิม

### Step 5: จัดระเบียบ Features Layer

- ย้าย UI screens เข้า `features/` จัดกลุ่ม (detail-view, form, list-view)
- รวม toolbar เข้า table file (ถ้าใช้ที่เดียว)
- ใช้ shared components แทน inline duplicates:
  - `TruncatedCell`, `ActionButton`, `DetailItem` → import จาก `@/components/custom/`

### Step 6: Cleanup

- ลบไฟล์ที่ไม่ใช้แล้ว
- อัปเดต barrel `index.ts`
- อัปเดต `README.md`
- ตรวจสอบ imports ทั้งโปรเจค (`grep` หา path เดิม)

### Step 7: Verify

- รัน `npx tsc --noEmit` → 0 errors
- ทดสอบ CRUD ผ่านหน้าเว็บ

## ตัวอย่าง Reference

ดูโครงสร้างจริงที่ทำเสร็จแล้ว:

- `modules/employee/` — ตัวอย่างเต็ม
- `modules/employee/README.md` — อธิบาย architecture layers
- `modules/employee/infrastructure/employee.repository.ts` — ตัวอย่าง repository
- `modules/employee/application/index.ts` — ตัวอย่าง facade + inline use cases
- `modules/employee/server/actions.ts` — ตัวอย่าง thin server actions
