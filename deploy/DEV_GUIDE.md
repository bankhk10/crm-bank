# CRM-Bank: คำสั่งสำหรับ Development (Local)

> **Last Updated:** 2026-02-16  
> **สำหรับ:** Developer ที่ทำงานฝั่ง Local Development

---

## สารบัญ

1. [เริ่มต้นโปรเจกต์ (First Time Setup)](#1-เริ่มต้นโปรเจกต์)
2. [การรัน Dev Server](#2-การรัน-dev-server)
3. [การจัดการ Database Schema (Prisma Migrate)](#3-การจัดการ-database-schema)
4. [คำสั่ง Prisma ที่ใช้บ่อย](#4-คำสั่ง-prisma-ที่ใช้บ่อย)
5. [Workflow: เพิ่ม/แก้ไข Field ใน Database](#5-workflow-เพิ่มแก้ไข-field-ใน-database)
6. [กรณี db push ไปก่อนแล้ว (แก้ Drift)](#6-กรณี-db-push-ไปก่อนแล้ว)
7. [Seed Data](#7-seed-data)
8. [เปรียบเทียบคำสั่ง Prisma](#8-เปรียบเทียบคำสั่ง-prisma)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. เริ่มต้นโปรเจกต์

```bash
# Clone repository
git clone <repo-url> crm-bank
cd crm-bank

# ติดตั้ง dependencies
pnpm install

# Copy environment file
cp .env.example .env.local
# แก้ไข DATABASE_URL ให้ตรงกับ PostgreSQL ของคุณ

# สร้าง database และ apply migrations ทั้งหมด
npx prisma migrate dev

# Seed ข้อมูลเริ่มต้น
npx prisma db seed

# รัน dev server
pnpm dev
```

---

## 2. การรัน Dev Server

```bash
# รัน Next.js dev server
pnpm dev

# เปิด Prisma Studio (GUI จัดการ database)
npx prisma studio
```

---

## 3. การจัดการ Database Schema

### Flow ที่ถูกต้องสำหรับ Dev

```
แก้ schema.prisma  →  prisma migrate dev  →  commit migration file  →  push to Git
```

### คำสั่งหลักที่ใช้

```bash
# ✅ สร้าง migration + apply ลง local DB + generate client
npx prisma migrate dev --name <ชื่อ_migration>

# ตัวอย่าง:
npx prisma migrate dev --name add_sale_order_ref
npx prisma migrate dev --name add_shipping_company_module
npx prisma migrate dev --name remove_unique_constraint
```

### สิ่งที่ `prisma migrate dev` ทำให้อัตโนมัติ

1. สร้างไฟล์ `prisma/migrations/<timestamp>_<name>/migration.sql`
2. Apply SQL ลง local database
3. Run `prisma generate` (สร้าง TypeScript types ใหม่)

---

## 4. คำสั่ง Prisma ที่ใช้บ่อย

```bash
# ===== Schema & Migration =====

# สร้าง migration ใหม่ (ใช้คำสั่งนี้เป็นหลัก)
npx prisma migrate dev --name <ชื่อ>

# สร้างไฟล์ migration แต่ยังไม่ apply (สำหรับ review SQL ก่อน)
npx prisma migrate dev --name <ชื่อ> --create-only

# ดูสถานะ migration ทั้งหมด
npx prisma migrate status

# Reset database (⚠️ ลบข้อมูลทั้งหมด + re-apply migrations + re-seed)
npx prisma migrate reset

# ===== Generate =====

# Generate Prisma Client (TypeScript types)
npx prisma generate

# ===== Database Tools =====

# เปิด Prisma Studio (GUI)
npx prisma studio

# Seed data
npx prisma db seed

# ===== สำหรับ Prototyping เท่านั้น =====

# ⚠️ Sync schema ตรงๆ (ไม่สร้าง migration file) - ใช้ตอน prototyping เท่านั้น
npx prisma db push
```

---

## 5. Workflow: เพิ่ม/แก้ไข Field ใน Database

### ตัวอย่าง: เพิ่ม field `saleOrderRef` ใน model Sale

**Step 1:** แก้ไข `prisma/schema.prisma`

```prisma
model Sale {
  // ... existing fields ...
  saleOrderRef  String?   // เลขที่คำสั่งขาย (Ref จากระบบอื่น)
  // ...
}
```

**Step 2:** สร้าง migration

```bash
npx prisma migrate dev --name add_sale_order_ref
```

**Step 3:** ตรวจสอบ migration SQL ที่สร้าง

```bash
# ดูไฟล์ SQL ที่ generate
cat prisma/migrations/<timestamp>_add_sale_order_ref/migration.sql
```

ควรเห็น:

```sql
-- AlterTable
ALTER TABLE "Sale" ADD COLUMN "saleOrderRef" TEXT;
```

**Step 4:** Commit migration file

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add saleOrderRef field for external reference"
```

> ✅ เมื่อ deploy ขึ้น production แล้ว run `prisma migrate deploy` ระบบจะ apply migration นี้ให้อัตโนมัติ

---

## 6. กรณี db push ไปก่อนแล้ว (แก้ Drift)

ถ้าพลาดใช้ `prisma db push` ไปก่อน (database มี field ใหม่แล้วแต่ไม่มี migration file):

```bash
# ❌ prisma migrate dev จะ error ว่า "Drift detected"
npx prisma migrate dev --name add_sale_order_ref
# Error: Drift detected: Your database schema is not in sync with your migration history.

# ✅ วิธีแก้:

# วิธีที่ 1: สร้าง migration file โดยไม่ apply แล้ว mark เอง
npx prisma migrate dev --name <ชื่อ> --create-only
# จากนั้น mark ว่า applied แล้ว (เพราะ db push ไปก่อน)
npx prisma migrate resolve --applied <ชื่อ_folder_migration>

# วิธีที่ 2: สร้าง migration file ด้วยมือ
mkdir prisma/migrations/<timestamp>_<ชื่อ>
# สร้างไฟล์ migration.sql ด้วย SQL ที่ตรงกับ schema change
# แล้ว mark ว่า applied
npx prisma migrate resolve --applied <ชื่อ_folder_migration>

# วิธีที่ 3: Reset database (⚠️ ลบข้อมูลทั้งหมด)
npx prisma migrate reset
# จะ drop DB, re-apply migrations ทั้งหมด, re-seed

# ตรวจสอบว่า status ตรงกันแล้ว
npx prisma migrate status
# ✅ ควรเห็น "Database schema is up to date!"
```

---

## 7. Seed Data

```bash
# รัน seed ทั้งหมด
npx prisma db seed

# Seed script อยู่ที่:
# prisma/seed/index.ts    → Entry point
# prisma/seed/master.ts   → Companies, Departments, Units
# prisma/seed/rbac.ts     → Roles, Permissions
# prisma/seed/users.ts    → Default Users
```

### เมื่อเพิ่ม module ใหม่ที่ต้องการ permissions

1. แก้ไข `prisma/seed/rbac.ts` เพิ่ม permissions ใหม่
2. รัน `npx prisma db seed`
3. Commit ไฟล์ seed

> ℹ️ Seed script ออกแบบให้เป็น **idempotent** (รันกี่ครั้งก็ได้ผลเหมือนกัน ไม่ duplicate)

---

## 8. เปรียบเทียบคำสั่ง Prisma

| คำสั่ง                  | ใช้ที่ไหน               | สร้าง Migration File | Apply ลง DB               | ปลอดภัย            |
| ----------------------- | ----------------------- | -------------------- | ------------------------- | ------------------ |
| `prisma migrate dev`    | ✅ Local Dev            | ✅ ใช่               | ✅ ใช่                    | ✅ ปลอดภัย         |
| `prisma migrate deploy` | ✅ Production           | ❌ ไม่               | ✅ ใช่                    | ✅ ปลอดภัยที่สุด   |
| `prisma db push`        | ⚠️ Prototyping เท่านั้น | ❌ ไม่               | ✅ ใช่                    | ⚠️ อาจลบข้อมูล     |
| `prisma migrate reset`  | ⚠️ Dev เท่านั้น         | ❌ ไม่               | ✅ ใช่ (re-apply ทั้งหมด) | ❌ ลบข้อมูลทั้งหมด |
| `prisma generate`       | ✅ ทุกที่               | ❌ ไม่               | ❌ ไม่                    | ✅ ปลอดภัย         |

### ⚠️ กฎสำคัญ

| #   | กฎ                                                   | เหตุผล                                            |
| --- | ---------------------------------------------------- | ------------------------------------------------- |
| 1   | **ใช้ `prisma migrate dev` เป็นหลัก**                | สร้าง migration file ที่ track ได้ใน Git          |
| 2   | **ห้ามใช้ `prisma db push` บน Production**           | อาจลบข้อมูลโดยไม่เตือน                            |
| 3   | **Commit migration files เสมอ**                      | Production จะใช้ไฟล์นี้ในการ apply schema changes |
| 4   | **ห้ามลบ/แก้ migration files ที่ deploy แล้ว**       | จะทำให้ checksum ไม่ตรง, deploy fail              |
| 5   | **ใช้ `--create-only` เมื่อต้องการ review SQL ก่อน** | ดู SQL ก่อน apply เพื่อความปลอดภัย                |

---

## 9. Troubleshooting

### Migration Drift Detected

```bash
# Error: Drift detected: Your database schema is not in sync with your migration history.
# สาเหตุ: ใช้ db push ไปก่อน หรือแก้ DB โดยตรง

# วิธีแก้ (ไม่ลบข้อมูล):
npx prisma migrate dev --name <ชื่อ> --create-only
npx prisma migrate resolve --applied <ชื่อ_migration_folder>

# วิธีแก้ (ลบข้อมูล OK):
npx prisma migrate reset
```

### Prisma Client Out of Date

```bash
# Error: Property 'xxx' does not exist on type ...
# สาเหตุ: Prisma Client ยังไม่ได้ generate ใหม่หลังแก้ schema

npx prisma generate
```

### Database Connection Error

```bash
# ตรวจสอบว่า PostgreSQL กำลังรันอยู่
# ตรวจสอบ DATABASE_URL ใน .env.local ว่าถูกต้อง
```

### Migration Apply Error

```bash
# ดูสถานะ migration
npx prisma migrate status

# ดู migration ที่ failed
# แก้ไข SQL ใน migration file
# แล้วรันใหม่
npx prisma migrate dev
```
