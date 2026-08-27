# CRM-Bank: คำสั่งสำหรับ Development (Local)

> **Last Updated:** 2026-02-25  
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
10. [Workflow: การนำ Database จาก Production มาลง Local (เพื่อป้องกันปัญหาตอน Deploy)](#10-workflow-การนำ-database-จาก-production-มาลง-local)
11. [การสลับจาก Production กลับมาพัฒนา Local (Data-Safe Workflow)](#11-การสลับจาก-production-กลับมาพัฒนา-local-data-safe-workflow)
12. [Checklist การสลับ Production Data สู่ Local](#12-checklist-การสลับ-production-data-สู่-local)

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
pnpm seed

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

---

## 10. Workflow: การนำ Database จาก Production มาลง Local

ในกรณีที่คุณใช้วิธี dump ข้อมูลจาก Production มาใส่ Local เพื่อทดสอบกับข้อมูลจริง คุณจำเป็นต้องปฏิบัติตาม workflow นี้อย่างเคร่งครัด **เพื่อป้องกันปัญหาโครงสร้างพัง (Data Loss / Schema Mismatch) เมื่อมีการนำโค้ดขึ้น Production อีกครั้ง**

### 🛠️ วิธีการ Export / Import Database (PostgreSQL)

วิธีดึง Database จาก Server Production มาจำลองลงที่ Local ของคุณ แนะนำให้ใช้เครื่องมือ `pg_dump` และ `pg_restore` (กรณีใช้ PostgreSQL) มีขั้นตอนดังนี้:

**1. Export (Dump) ข้อมูลจาก Production**
รันคำสั่งเพื่อสำรองโครงสร้างและข้อมูลออกมาเป็นไฟล์:

```bash
# เลือกใช้แบบใดแบบหนึ่ง

# แบบที่ 1: แบบ Plain-text SQL (อ่านง่าย ไฟล์ใหญ่)
pg_dump -h <host_prod> -p <port_prod> -U <username_prod> -d <db_name_prod> -W -F p -f prod_backup.sql

# แบบที่ 2: แบบ Custom format (แนะนำ: บีบอัดขนาดไฟล์ และนำกลับมาลงได้เสถียรกว่า)
pg_dump -h <host_prod> -p <port_prod> -U <username_prod> -d <db_name_prod> -W -F c -f prod_backup.dump
```

**2. Import (Restore) นำข้อมูลเข้าเครื่อง Local**
เพื่อป้องกันปัญหาเรื่อง schema ทับซ้อน แนะนำให้ Reset ฐานข้อมูลฝั่ง Local ตัวเก่าก่อน

```bash
# เคลียร์ Local DB เก่า (ห้ามรันคำสั่งนี้บน Production!! รันเฉพาะที่เครื่อง Dev เท่านั้น!!)
npx prisma migrate reset --skip-seed

# จากนั้นนำก้อนข้อมูล Prod ใส่เข้า Local DB
# 2.1 กรณีใช้ไฟล์ Plain-text (แบบที่ 1)
psql -h localhost -p 5432 -U <username_local> -d <db_name_local> -W -f prod_backup.sql

# 2.2 กรณีใช้ไฟล์ Custom format (แบบที่ 2)
pg_restore -h localhost -p 5432 -U <username_local> -d <db_name_local> -W -1 -x -O -c prod_backup.dump
```

> **คำอธิบาย Option ของ `pg_restore`:**
>
> - `-1`: รันแบบ Single Transaction (ถ้ามีปัญหา ให้ Rollback ทิ้งทั้งหมด ไม่เซฟแค่ครึ่งเดียว)
> - `-x`: ไม่ต้องดึงสิทธิ (Privilege) ของ Prod มา เพราะ Local ระบบ user ไม่เหมือนกัน
> - `-O`: ยกเลิกระบบ Owner เดิมจาก Prod โดยตั้งค่าให้ user Local เป็นเจ้าของแทน
> - `-c`: สั่ง Drop (ลบ) ตารางเก่าทิ้งทั้งหมดก่อนทำการสร้างใหม่

_หลังจาก restore เสร็จ ให้คุณรัน `npx prisma generate` เพื่ออัพเดทสเปก Prisma Client ให้ sync กับ Database ล่าสุดครับ!_

### ⚠️ สิ่งที่ต้องเข้าใจเมื่อนำ Database จาก Prod มาลง Local

เมื่อคุณ restore ก้อนข้อมูลจาก Prod มาที่ Local สำเร็จ Database ของคุณที่ Local จะมีโครงสร้างและประวัติการแก้โครงสร้าง (ในตาราง `_prisma_migrations`) ตรงกับ Production 100% ณ เวลานั้นเสมอ

### 🔄 ขั้นตอนการทำงานที่ปลอดภัย

**1. ห้ามแก้ไข Database ฝั่ง Local ผ่าน GUI โดยตรงเด็ดขาด**
หากต้องการเพิ่มคอลัมน์ใหม่ หรือแก้ชื่อตาราง ให้ทำผ่านการเขียนโค้ดแก้ที่ไฟล์ `prisma/schema.prisma` เท่านั้น

**2. สร้าง Migration File หลังจากแก้ `schema.prisma`**
ให้รันคำสั่ง `prisma migrate dev` เสมอ เพื่อให้ตัว Prisma รวบรวมสิ่งที่แก้ไขมาแปลงเป็นคำสั่ง SQL สะสมไว้ในโฟลเดอร์ฝั่ง Local ก่อน

```bash
npx prisma migrate dev --name <ชื่อการแก้ไข_เช่น_add_user_address>
```

_Prisma จะเพิ่มคำสั่ง SQL ใหม่เข้าโฟลเดอร์ `prisma/migrations/` และรันลง Local Database ให้อัตโนมัติ_

**3. นำโค้ดที่สร้างใหม่ขึ้น Git เสมอ**
โปรดตรวจทานให้แน่ใจว่าได้ทำการ `git add` และ `git commit` ไฟล์โครงสร้างใหม่ ทั้งคู่:

- ไฟล์ `prisma/schema.prisma`
- โฟลเดอร์ที่เพิ่งถูกสร้างใน `prisma/migrations/<ชื่อการแก้ไข>`

**4. ตอนนำขึ้น Production (Deploy)**
Production ใช้คำสั่ง `deploy` (ไม่ใช่ `dev` เหมือนอย่างในเครื่องเรา)

```bash
# ใน Production Pipeline หรือ Server จริง
npx prisma migrate deploy
```

**5. การเช็คความถูกต้องของโค้ด (Type Checking)**
ก่อนที่จะทำการ deploy หรือ push โค้ดขึ้นไปบน Git ควรจะทำการเช็คความถูกต้องของโค้ดก่อน โดยใช้คำสั่ง

```bash
npx tsc --noEmit
```

_คำสั่งนี้จะไปอ่านประวัติและทำการรัน "เฉพาะ" ไฟล์ Migration ตัวใหม่ที่คุณเพิ่ง commit ลงไป ทำให้โครงสร้างฝั่ง Production ปรับไปตามการแก้โดยที่ข้อมูลเก่าไม่หาย_

### ⛔️ ข้อควรระวังขั้นสูง

- **ห้าม** รัน `npx prisma db push` เด็ดขาด เพราะมันจะไม่บันทึกประวัติ SQL ลงในโฟลเดอร์ migrations พอขึ้น Prod ไป Prod จะพังเพราะไม่มีการอัพเดท
- **ห้าม** กลับไปแก้ไขไฟล์ `.sql` เก่าๆ ที่ส่งขึ้น Production หรือ Commit ลง Git ไปแล้ว หากทำผิด ให้ทำตามขั้นตอนที่ 1 และ 2 ใหม่อีกครั้งเพื่อสร้างไฟล์แก้ทับไปเรื่อยๆ
- **ระวังการ Import ข้อมูลทับกัน**: หากดึงข้อมูล Production มาลง Local ให้ปฏิบัติตาม **Section 11 (Data-Safe Workflow)** ด้านล่างอย่างเคร่งครัด **ห้ามใช้ `npx prisma migrate reset` โดยอัตโนมัติ** เพราะจะทำให้ข้อมูล Production ที่ดึงมา (โดยเฉพาะ Product, Customer, Sales) สูญหายทั้งหมด

---

## 11. การสลับจาก Production กลับมาพัฒนา Local (Data-Safe Workflow)

> 🛡️ **เป้าหมายสำคัญ:** ห้ามทำข้อมูล Production ที่ Import เข้า Local สูญหายโดยไม่จำเป็น โดยเฉพาะข้อมูล Product และข้อมูลการขายที่ต้องใช้พัฒนาต่อ

---

### ⚡ Quick Commands / Quick Workflow (ใช้เป็นประจำ)

ลำดับคำสั่งที่ต้องรันจริงเมื่อสลับกลับมาพัฒนา Local:

```bash
# 1. ล้าง Local DB เดิม และ Import ข้อมูลจาก Production
# (กรณีไฟล์ .dump แบบ Custom Format - แนะนำ)
pg_restore -h localhost -p 5432 -U admin -d crm -W -1 -x -O -c prod_backup.dump

# หรือ (กรณีไฟล์ .sql แบบ Plain-text)
# psql -h localhost -p 5432 -U admin -d crm -W -f prod_backup.sql

# 2. ตรวจสอบข้อมูลสำคัญเบื้องต้น (Product, Customer, Sale)
npx prisma studio

# 3. Generate Prisma Client
npx prisma generate

# 4. ตรวจสอบสถานะ Migration
npx prisma migrate status

# 5. ถ้ามี Pending Migrations และไม่มี Drift → Apply ได้ทันที
npx prisma migrate deploy

# 6. Seed ข้อมูล Master, RBAC, Admin user
pnpm seed

# 7. ถ้าพัฒนา Feature Activity ให้ Seed ข้อมูล Activity เพิ่มเติม
pnpm seed:activity

# 8. ตรวจสอบ Type Safety
npx tsc --noEmit

# 9. Start Dev Server
pnpm dev
```

---

### ⚠️ Quick Decision: การรับมือกรณีสถานะ Migration

```text
npx prisma migrate status
          │
          ├─ "Database schema is up to date!"
          │         ↓
          │       pnpm seed → pnpm dev
          │
          ├─ "Following migrations have not yet been applied:" (Pending)
          │         ↓
          │       npx prisma migrate deploy
          │         ↓
          │       pnpm seed → pnpm dev
          │
          └─ "Drift detected: Your database schema is not in sync..."
                    ↓
              ❌ ห้าม npx prisma migrate reset เด็ดขาด!
              ❌ ห้าม npx prisma db push เด็ดขาด!
                    ↓
              🛑 หยุดก่อน และทำตามขั้นตอน Detailed Drift Handling ด้านล่าง
```

---

### 🔧 Detailed Drift Handling & Reference (สำหรับกรณีเกิดปัญหา)

#### ⚠️ กฎเหล็กและคำสั่งต้องห้าม
1. **ห้ามรัน `npx prisma migrate reset`** ทันทีเมื่อเจอ Drift เพราะคำสั่งนี้จะ Drop Schema และลบข้อมูล Production (Product, Customer, Sales) ทั้งหมดทิ้ง
2. **ห้ามรัน `npx prisma db push`** เพราะอาจทำให้ Schema ในเครื่องเพี้ยนและไม่มี Migration File สำหรับ Deploy
3. **ตรวจสอบจำนวนแถวของข้อมูลสำคัญ (Product, Customer, Sale)** ก่อนและหลังการทำ Migration เสมอ

#### ขั้นตอนแก้ไข Drift อย่างปลอดภัยทีละขั้นตอน:
1. **หาสาเหตุของ Drift**:
   - ดูว่า Prisma แจ้งว่ามีอะไรเกินมา เช่น `[+] Added enums` หรือ `[+] Added tables`
   - ตรวจสอบว่า Object นั้นมีข้อมูลจริงใช้งานอยู่หรือไม่
2. **หากเป็น Orphaned Objects (เช่น Enum หรือ Table ทดสอบที่ไม่มีข้อมูลใช้งาน)**:
   - สั่ง Drop เฉพาะ Object ที่ลอยอยู่ เพื่อให้ DB Clean ตรงกับประวัติ Migration ล่าสุด:
     ```sql
     DROP TYPE IF EXISTS "ActivityApprovalAction", "ActivityApprovalStep", "ActivityHelperStatus", "ActivityResultStatus", "ActivityStatus", "PromotionalMaterialStatus" CASCADE;
     ```
   - จากนั้นรัน `npx prisma migrate deploy` เพื่อให้ Prisma apply migration ตามลำดับที่ถูกต้อง
3. **หาก Database มีโครงสร้างใหม่ที่ถูกต้องอยู่แล้วแต่ขาดประวัติใน `_prisma_migrations`**:
   - ใช้ `npx prisma migrate resolve --applied <migration_name>` เฉพาะ Migration ที่แน่ใจว่าได้ apply ลง DB ไปแล้วจริงๆ **(ห้ามใช้ resolve แบบเดาสุ่ม)**
4. **หากมีการแก้ `prisma/schema.prisma` เพิ่มเติมที่ยังไม่มี Migration File**:
   - รัน `npx prisma migrate dev --name <migration_name>` เพื่อสร้าง migration ใหม่

#### ℹ️ ข้อมูลการทำงานของ Seed Scripts:
Seed Scripts ทั้งหมดใน `prisma/seed/` ถูกออกแบบให้เป็น **Idempotent (Add-Only / Upsert / skipDuplicates)**:
- `pnpm seed`: Seed Master Data, Promotional Materials, RBAC Permissions Sync, Default Users
- `pnpm seed:activity`: Seed Activity Types (11 ประเภทงาน) และโครงสร้างแผนก/ตำแหน่งสำหรับ Activity
- ไม่มีการลบหรือเขียนทับข้อมูลในตาราง `Product`, `Customer`, `Sale` เดิม

---

## 12. Quick Checklist การสลับ Production Data สู่ Local

```text
[ ] 1. ล้าง Local DB เดิม
[ ] 2. Import Production Data
[ ] 3. ตรวจสอบ Product / Customer / Sale
[ ] 4. npx prisma generate
[ ] 5. npx prisma migrate status
[ ] 6. ไม่มี Drift (⚠️ หากพบ Drift ห้าม migrate reset เด็ดขาด!)
[ ] 7. npx prisma migrate deploy (ถ้ามี Pending Migrations)
[ ] 8. pnpm seed
[ ] 9. pnpm seed:activity (ถ้าจำเป็นต้องใช้ Activity)
[ ] 10. ตรวจสอบข้อมูลอีกครั้ง
[ ] 11. npx tsc --noEmit
[ ] 12. pnpm dev
```


