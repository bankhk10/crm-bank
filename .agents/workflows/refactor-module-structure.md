---
description: Refactor an existing module to comply with the project's standard Module Architecture Contract while preserving existing behavior.
---

# Refactor Module Structure

ใช้ Workflow นี้เมื่อปรับโครงสร้าง Module ที่มีอยู่แล้ว
ให้เป็นไปตาม **Module Architecture Contract** ของโปรเจกต์

เป้าหมาย:

- ทำให้ทุก Module ใช้ Architecture เดียวกัน
- รักษา Business Logic และ Behavior เดิม
- แยก Layer ให้ถูกต้อง (features, server, application, infrastructure, types, ui)
- ลด Layer Bypass
- Reuse Existing Pattern
- ไม่สร้าง Architecture ใหม่โดยไม่จำเป็น
- ไม่ผูกมาตรฐานกับ Module ใด Module หนึ่ง
- ตรวจสอบผลกระทบก่อนและหลัง Refactor
- ห้ามทำลายการทำงานเดิม

มาตรฐานหลักที่ต้องปฏิบัติตาม:

- `.agents/skills/crm-coding-standards/SKILL.md`
- `docs/ARCHITECTURE.md`
- `docs/MODULE_ARCHITECTURE.md` หากมี

---

# 1. Core Rules

ระหว่างการ Refactor MUST ปฏิบัติตามกฎต่อไปนี้:

1. ห้ามเปลี่ยน Business Behavior โดยไม่จำเป็น
2. ห้ามสร้าง Architecture ใหม่หาก Architecture ปัจจุบันรองรับได้
3. ต้องตรวจสอบ Existing Pattern ก่อนย้ายหรือสร้างไฟล์
4. ต้องรักษา Dependency Direction (features $\rightarrow$ server $\rightarrow$ application $\rightarrow$ infrastructure)
5. ต้องไม่สร้าง Layer ใหม่โดยพลการ
6. ต้องไม่แก้ไข Code นอก Scope
7. ต้องตรวจสอบทุก Import ที่ได้รับผลกระทบ
8. ต้องตรวจสอบ Runtime Behavior หลัง Refactor
9. ต้อง Update Documentation เมื่อโครงสร้างเปลี่ยน
10. ต้องทำ Final Validation ก่อนถือว่างานเสร็จ

---

# 2. Database & Migration Rules during Refactoring

1. **Code-Only Refactoring**: การ Refactor โค้ดที่ไม่มีการเปลี่ยนโครงสร้าง Database Schema **ไม่ต้องสร้าง Prisma Migration**
2. **Schema-Affecting Refactoring**: หากการ Refactor ส่งผลให้เกิด Persistent Schema Change (เช่น การเปลี่ยนชื่อตาราง/คอลัมน์, การเพิ่ม Index, หรือการปรับ Enum) **ต้องสร้าง Prisma Migration ควบคู่ไปด้วยเสมอ**
3. **Migration Inspection**: ต้องตรวจสอบ `migration.sql` เพื่อป้องกันการเกิด `DROP TABLE` หรือ `DROP COLUMN` ที่ไม่ตั้งใจ
4. **No Unrelated Bundling**: ห้ามรวบ Schema Change ที่ไม่เกี่ยวข้องกับการ Refactor โมดูลนี้เข้ามาใน Migration
5. **Separation of Apply**: ห้าม Apply Migration สู่ฐานข้อมูลโดยไม่ได้รับอนุมัติจากผู้ใช้
6. **Parity Check**: ตรวจสอบความสอดคล้องระหว่าง `schema.prisma` $\leftrightarrow$ `prisma/migrations/` $\leftrightarrow$ Database จริงเมื่อมี Database Change เกี่ยวข้อง

---

# 3. Target Module Architecture

Module ทุกตัวภายใต้ `modules/<module-name>/` ต้องปฏิบัติตามโครงสร้างมาตรฐาน:

```text
modules/<module-name>/
├── application/       # Business logic, use cases, validation (Zod)
├── features/          # User-facing screens & complex UI features
├── infrastructure/   # Database access & repositories (Prisma)
├── server/            # Server Actions (Auth, RBAC permission checks, cache revalidation)
├── types/             # Module TypeScript interfaces & types
├── ui/                # Shared reusable UI components for this module
├── constants.ts       # Module-specific constants
├── index.ts           # Public module API export
└── README.md          # Module architecture & behavior documentation
```

---

# 4. Refactoring Steps

## Step 1: Pre-Refactor Analysis & Inventory
- สำรวจไฟล์และโครงสร้างเดิมของโมดูล
- ระบุจุดที่มี Layer Bypass, Code Duplication, หรือการจัดวางผิด Layer
- สำรวจผลกระทบของ Import ในโมดูลอื่น

## Step 2: Plan Structural Changes & Database Impact Check
- วางแผนการย้ายโค้ดเข้าสู่ 5 Layers มาตรฐาน
- ตรวจสอบว่าต้องมีการแตะต้อง `prisma/schema.prisma` หรือไม่ (ถ้าไม่แตะ ให้ทำ Code Refactoring ล้วนโดยไม่สร้าง Migration)

## Step 3: Layer-by-Layer Relocation
- **Infrastructure**: ย้ายการติดต่อ Database เข้า `infrastructure/<module>.repository.ts`
- **Application**: ย้าย Business Rules, Calculation, และ Validation เข้า `application/`
- **Server**: สร้าง/จัดระเบียบ Server Actions ใน `server/actions.ts`
- **UI / Features**: จัดระเบียบ Presentation Components ใน `features/` และ `ui/`

## Step 4: Import & Dependency Resolution
- อัปเดต Import Path ทั้งหมดให้ถูกต้อง
- ตรวจสอบให้แน่ใจว่าไม่มี Circular Dependencies และไม่มีการ Bypass Layer

## Step 5: Clean Up Legacy Files
- ลบไฟล์เดิมที่ถูกย้ายออกไปแล้วอย่างระมัดระวัง
- อัปเดต `README.md` ของโมดูล

## Step 6: Post-Refactor Verification
- รัน TypeScript Type Check: `pnpm tsc --noEmit`
- รัน ESLint: `npx eslint <module-path>`
- ตรวจสอบ Automated Unit/Integration Tests
- ทดสอบ Runtime และ UI Behavior บน Browser
