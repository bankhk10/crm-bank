# CRM-Bank: ขั้นตอนการ Update ระบบ (Deployment Update Guide)

> **Last Updated:** 2026-02-16  
> **Version:** 1.0  
> **สำหรับ:** ทีม DevOps / Developer ที่ดูแลการ deploy CRM-Bank

---

## สารบัญ

1. [ภาพรวมขั้นตอนการ Update](#1-ภาพรวมขั้นตอนการ-update)
2. [Pre-Update Checklist](#2-pre-update-checklist)
3. [Scenario A: Update เฉพาะ Code (ไม่มีการเปลี่ยน Database)](#3-scenario-a-update-เฉพาะ-code)
4. [Scenario B: Update Code + Database Schema (Migration)](#4-scenario-b-update-code--database-schema)
5. [Scenario C: Update Code + Database Schema + Seed Data](#5-scenario-c-update-code--database-schema--seed-data)
6. [Post-Update Verification](#6-post-update-verification)
7. [Rollback Procedures](#7-rollback-procedures)
8. [Migration File Management](#8-migration-file-management)
9. [Seed Script Guidelines](#9-seed-script-guidelines)
10. [Quick Reference (Cheat Sheet)](#10-quick-reference-cheat-sheet)

---

## 1. ภาพรวมขั้นตอนการ Update

การ update ระบบ CRM-Bank มี 3 รูปแบบหลัก:

```
┌────────────────────────────────────────────────────────────────┐
│                    Deployment Update Flow                      │
│                                                                │
│  ① Pull Code ──► ② มีเปลี่ยน DB?                              │
│                      │                                         │
│                  ┌───┴───┐                                     │
│                  │       │                                     │
│                 ไม่     ใช่ ──► ③ มี Seed ใหม่?                │
│                  │             │           │                    │
│                  │         ┌───┴───┐       │                   │
│                  │         │       │       │                   │
│                  ▼        ไม่     ใช่      │                   │
│            Code Only   DB + Code  DB + Code + Seed             │
│           Scenario A   Scenario B  Scenario C                  │
└────────────────────────────────────────────────────────────────┘
```

### วิธีตรวจสอบว่า Update ครั้งนี้ต้องทำอะไร

| ตรวจสอบ        | คำสั่ง                                              | ถ้าพบการเปลี่ยนแปลง                   |
| -------------- | --------------------------------------------------- | ------------------------------------- |
| Migration ใหม่ | `git diff HEAD~1 --name-only -- prisma/migrations/` | → ต้องรัน migrate (Scenario B หรือ C) |
| Schema เปลี่ยน | `git diff HEAD~1 -- prisma/schema.prisma`           | → ต้องสร้าง migration ก่อน deploy     |
| Seed เปลี่ยน   | `git diff HEAD~1 --name-only -- prisma/seed/`       | → ต้องรัน seed (Scenario C)           |
| Code เท่านั้น  | ไม่มีการเปลี่ยนใน prisma/                           | → Scenario A                          |

---

## 2. Pre-Update Checklist

### ⚠️ ทำทุกครั้งก่อน Update

```bash
# SSH เข้า VPS
ssh user@your-vps-ip

# เข้า project directory
cd /opt/crm-bank
```

- [ ] **Backup Database** (สำคัญมาก! โดยเฉพาะเมื่อมีการเปลี่ยน schema)

  ```bash
  docker exec crm-postgres pg_dump -U crm_admin crm > backup_$(date +%Y%m%d_%H%M%S).sql
  ```

- [ ] **ตรวจสอบ services ปัจจุบัน** (ต้อง healthy ทั้งหมดก่อน update)

  ```bash
  docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
  ```

- [ ] **ตรวจสอบ disk space** (ต้องมีพื้นที่เพียงพอสำหรับ build)

  ```bash
  df -h /opt
  ```

- [ ] **อ่าน Release Notes / Changelog** ของ commit ที่จะ deploy
  ```bash
  git fetch origin Production
  git log HEAD..origin/Production --oneline
  ```

---

## 3. Scenario A: Update เฉพาะ Code

> ใช้เมื่อ: ไม่มีการเปลี่ยนแปลงใน `prisma/schema.prisma`, `prisma/migrations/`, หรือ `prisma/seed/`

### ขั้นตอน

```bash
# ---- Step 1: Pull latest code ----
cd /opt/crm-bank
git reset --hard
git pull origin Production

# ---- Step 2: Rebuild & Restart app ----
cd deploy/app
docker compose -f docker-compose.app.yml --env-file ../env.production up -d --build app

# ---- Step 3: Verify ----
# รอ 30 วินาทีให้ app เริ่มต้น
sleep 30
docker ps | grep crm-app
docker logs crm-app --tail 20
```

### เวลาที่ใช้โดยประมาณ: **2-5 นาที**

---

## 4. Scenario B: Update Code + Database Schema

> ใช้เมื่อ: มีไฟล์ migration ใหม่ใน `prisma/migrations/` แต่ไม่มีการเปลี่ยน seed

### ขั้นตอน

```bash
# ---- Step 1: Pull latest code ----
cd /opt/crm-bank
git reset --hard
git pull origin Production

# ---- Step 2: Backup Database (จำเป็นมาก!) ----
docker exec crm-postgres pg_dump -U crm_admin crm > backup_pre_migrate_$(date +%Y%m%d_%H%M%S).sql
echo "✅ Database backup completed"

# ---- Step 3: Run Database Migration ----
cd deploy/app

# Build migrate container (ถ้ายังไม่ build)
docker compose -f docker-compose.app.yml --env-file ../env.production \
  --profile migrate build migrate

# Run migrations
docker compose -f docker-compose.app.yml --env-file ../env.production \
  --profile migrate up migrate

# ตรวจสอบ migration logs
docker logs crm-migrate

# ❗ ถ้า migration fail → ดู Section 7 (Rollback)
# ❗ ต้องเห็น "All migrations have been successfully applied" ก่อนไปต่อ

# ---- Step 4: Rebuild & Restart app ----
docker compose -f docker-compose.app.yml --env-file ../env.production up -d --build app

# ---- Step 5: Verify ----
sleep 30
docker ps | grep crm-app
docker logs crm-app --tail 20
```

### เวลาที่ใช้โดยประมาณ: **5-10 นาที**

---

## 5. Scenario C: Update Code + Database Schema + Seed Data

> ใช้เมื่อ: มีทั้ง migration ใหม่ **และ** มีการเปลี่ยนแปลง seed data (เช่น เพิ่ม permissions ใหม่, เพิ่ม roles, เพิ่ม master data)

### ตัวอย่างสถานการณ์ที่ต้องรัน Seed

- เพิ่ม module ใหม่ที่ต้องการ permissions (เช่น Shipping Companies module)
- เพิ่ม roles ใหม่
- เพิ่ม master data (เช่น companies, departments, product categories)
- อัปเดต permission assignments

### ขั้นตอน

```bash
# ---- Step 1: Pull latest code ----
cd /opt/crm-bank
git reset --hard
git pull origin Production

# ---- Step 2: Backup Database (จำเป็นมาก!) ----
docker exec crm-postgres pg_dump -U crm_admin crm > backup_pre_update_$(date +%Y%m%d_%H%M%S).sql
echo "✅ Database backup completed"

# ---- Step 3: Run Database Migration ----
cd deploy/app

docker compose -f docker-compose.app.yml --env-file ../env.production \
  --profile migrate build migrate

docker compose -f docker-compose.app.yml --env-file ../env.production \
  --profile migrate up migrate

# ตรวจสอบ migration logs
docker logs crm-migrate
# ❗ ต้องเห็น "All migrations have been successfully applied" ก่อนไปต่อ

# ---- Step 4: Run Seed (Update Permissions / Master Data) ----
docker compose -f docker-compose.app.yml --env-file ../env.production \
  --profile seed build seed

docker compose -f docker-compose.app.yml --env-file ../env.production \
  --profile seed up seed

# ตรวจสอบ seed logs
docker logs crm-seed
# ✅ ควรเห็น "Seeding completed successfully!" หรือ "All permissions already exist."

# ---- Step 5: Rebuild & Restart app ----
docker compose -f docker-compose.app.yml --env-file ../env.production up -d --build app

# ---- Step 6: Verify ----
sleep 30
docker ps | grep crm-app
docker logs crm-app --tail 20
```

### เวลาที่ใช้โดยประมาณ: **8-15 นาที**

---

## 6. Post-Update Verification

### ทำทุกครั้งหลัง Update

```bash
# ---- 1. ตรวจสอบ containers ทั้งหมด ----
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
# ✅ ต้องเห็น crm-app, crm-nginx, crm-postgres ทั้งหมด "Up"

# ---- 2. Health Check ----
docker exec crm-app wget -qO- http://localhost:3000/api/health
# ✅ ต้องได้ response กลับมา

# ---- 3. ตรวจสอบ App Logs (ไม่มี error) ----
docker logs crm-app --tail 50 | grep -i error
# ✅ ไม่ควรมี error ที่เกี่ยวกับ database หรือ module ใหม่

# ---- 4. ตรวจสอบ Nginx ----
docker logs crm-nginx --tail 20

# ---- 5. ตรวจสอบ Database Connection ----
docker exec crm-app sh -c 'PGPASSWORD=$POSTGRES_PASSWORD psql -h crm-postgres -U $POSTGRES_USER -d $POSTGRES_DB -c "SELECT 1"'

# ---- 6. ตรวจสอบ Migration Status ----
# ดู applied migrations ทั้งหมด
docker exec crm-postgres psql -U crm_admin crm -c "SELECT * FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 5;"

# ---- 7. ทดสอบหน้าเว็บ ----
# เปิด browser ไปที่ https://your-domain.com
# ✅ Login ได้ปกติ
# ✅ เมนูใหม่แสดง (ถ้ามี)
# ✅ ฟีเจอร์ใหม่ใช้งานได้
```

### Checklist Post-Update

- [ ] ทุก container status = "Up" + healthy
- [ ] Health check API ตอบกลับปกติ
- [ ] ไม่มี error ใน app logs
- [ ] Login ได้ปกติ
- [ ] เมนูและ permissions ใหม่แสดงถูกต้อง (ถ้ามี)
- [ ] ฟีเจอร์ใหม่ทำงานได้ (ทดสอบจากหน้าเว็บ)
- [ ] **ลบไฟล์ backup เก่า** ที่ไม่จำเป็น (เก็บไว้อย่างน้อย 3 versions)

---

## 7. Rollback Procedures

### 7.1 Rollback Code (ไม่เกี่ยวกับ DB)

```bash
cd /opt/crm-bank

# ดู commit ก่อนหน้า
git log --oneline -5

# Revert ไป commit ก่อนหน้า
git checkout <previous-commit-hash>

# Rebuild app
cd deploy/app
docker compose -f docker-compose.app.yml --env-file ../env.production up -d --build app
```

### 7.2 Rollback Database (Restore from Backup)

> ⚠️ **คำเตือน:** ข้อมูลที่ถูกเพิ่มหลังจาก backup จะหายไป

```bash
# ---- Step 1: หยุด app ก่อน ----
cd /opt/crm-bank/deploy/app
docker compose -f docker-compose.app.yml --env-file ../env.production stop app

# ---- Step 2: Restore database ----
cat backup_pre_migrate_YYYYMMDD_HHMMSS.sql | docker exec -i crm-postgres psql -U crm_admin -d crm

# ---- Step 3: Revert code ----
cd /opt/crm-bank
git checkout <previous-commit-hash>

# ---- Step 4: Rebuild & Start app ----
cd deploy/app
docker compose -f docker-compose.app.yml --env-file ../env.production up -d --build app
```

### 7.3 Rollback Migration เฉพาะตัว

> Prisma Migrate ไม่มี `migrate down` ต้องทำเอง

```bash
# วิธีที่ 1: ใช้ SQL revert script ด้วยตนเอง
docker exec -i crm-postgres psql -U crm_admin -d crm < revert_migration.sql

# วิธีที่ 2: Restore จาก backup (แนะนำ)
# ดู Section 7.2

# วิธีที่ 3: ลบ migration record ออกจาก _prisma_migrations
# ⚠️ ใช้เฉพาะกรณีฉุกเฉินเท่านั้น
docker exec crm-postgres psql -U crm_admin crm -c \
  "DELETE FROM _prisma_migrations WHERE migration_name = '20260211090301_add_shipping_company_module';"
```

---

## 8. Migration File Management

### โครงสร้าง Migrations Directory

```
prisma/
├── migrations/
│   ├── 20260209041622_init/
│   │   └── migration.sql          # Initial schema
│   ├── 20260211035502_remove_unique_productcategory_code/
│   │   └── migration.sql          # Remove unique constraint
│   ├── 20260211090301_add_shipping_company_module/
│   │   └── migration.sql          # Shipping company tables
│   └── migration_lock.toml
├── schema.prisma                   # Current schema definition
└── seed/
    ├── index.ts                    # Seed entry point
    ├── master.ts                   # Master data (companies, departments)
    ├── product-master.ts           # Product groups, brands
    ├── rbac.ts                     # Roles, permissions, assignments
    └── users.ts                    # Default users
```

### วิธีสร้าง Migration ใหม่ (Development)

```bash
# 1. แก้ไข prisma/schema.prisma

# 2. สร้าง migration file
npx prisma migrate dev --name <migration_name>
# ตัวอย่าง: npx prisma migrate dev --name add_shipping_company_to_sale

# 3. ตรวจสอบ SQL ที่ generate
cat prisma/migrations/<timestamp>_<name>/migration.sql

# 4. Commit migration file
git add prisma/migrations/ prisma/schema.prisma
git commit -m "feat: add shipping company to sale model"
```

### ข้อควรระวังเกี่ยวกับ Migration

| ⚠️ ข้อควรระวัง                                 | รายละเอียด                                                       |
| ---------------------------------------------- | ---------------------------------------------------------------- |
| **ห้ามลบ migration files**                     | Migration files ที่ commit แล้วห้ามลบ จะทำให้ deploy fail        |
| **ห้ามแก้ migration files ที่ deploy แล้ว**    | ถ้า migration apply ไปแล้ว ห้ามแก้ไข SQL จะทำให้ checksum ไม่ตรง |
| **ใช้ `prisma migrate dev` เฉพาะ development** | Production ใช้ `prisma migrate deploy` เท่านั้น                  |
| **ห้ามใช้ `prisma db push` บน production**     | `db push` อาจลบข้อมูล ใช้เฉพาะ development                       |
| **ทดสอบ migration ใน staging ก่อน**            | ก่อน merge เข้า Production branch ควรทดสอบก่อน                   |

### กรณี Migration ที่ใช้ `db push` ไปก่อนแล้ว

ถ้า dev ใช้ `prisma db push` แก้ schema ไปก่อนแล้ว (table มีอยู่ใน DB แล้วแต่ไม่มี migration file):

```bash
# สร้าง migration file จาก schema ปัจจุบัน (ไม่ apply)
npx prisma migrate dev --name <name> --create-only

# ในกรณีที่ต้อง mark migration ว่า applied แล้ว (เพราะ db push ไปก่อน)
npx prisma migrate resolve --applied <migration_folder_name>
```

---

## 9. Seed Script Guidelines

### โครงสร้าง Seed Files

| ไฟล์                     | หน้าที่                                           | ลำดับการรัน       |
| ------------------------ | ------------------------------------------------- | ----------------- |
| `seed/index.ts`          | Entry point, เรียก seed functions ตามลำดับ        | 1 (เรียกไฟล์อื่น) |
| `seed/master.ts`         | Companies, Departments, Units, Categories, Plants | 2                 |
| `seed/product-master.ts` | Product Groups, Chemical Groups, Brands           | 3                 |
| `seed/rbac.ts`           | Roles, Permissions, RolePermissions               | 4                 |
| `seed/users.ts`          | Default Users and Positions                       | 5                 |

### วิธี Seed ทำงาน

Seed script มีการ **ป้องกัน duplicate** ในตัว:

```
1. Master Data    → ตรวจสอบ existingCompany ก่อน → ถ้ามีแล้ว skip
2. Product Master → ตรวจสอบ existingProductGroup ก่อน → ถ้ามีแล้ว skip
3. RBAC           → ตรวจสอบ existingAdminRole ก่อน
                     → ถ้ามีแล้ว → upsert permissions ที่ยังไม่มี (เช่น shipping companies)
                     → ถ้ายังไม่มี → สร้างทั้งหมดตั้งแต่ต้น
4. Users          → ตรวจสอบ existingUser ก่อน → ถ้ามีแล้ว skip
```

### การเพิ่ม Permissions ใหม่ให้ Module ใหม่

เมื่อต้องการเพิ่ม module ใหม่ (เช่น Shipping Companies):

**1. เพิ่มใน `prisma/seed/rbac.ts` — ส่วน "full seed" (สำหรับ DB ใหม่):**

```typescript
// ภายใน prisma.permission.createMany / prisma.$transaction
// เพิ่ม permissions ใหม่ไปท้ายสุดของ list

prisma.permission.create({
  data: {
    key: "menu.shipping-companies",
    name: "เมนูบริษัทขนส่ง",
    category: "MENU",
    menuPath: "/shipping-companies",
  },
}),
prisma.permission.create({
  data: {
    key: "shipping-company.create",
    name: "สร้างบริษัทขนส่ง",
    category: "ACTION",
    resource: "shipping-company",
    action: "create",
  },
}),
// ... (edit, delete, manage)
```

**2. เพิ่มใน `prisma/seed/rbac.ts` — ส่วน "upsert" (สำหรับ DB ที่มีข้อมูลแล้ว):**

```typescript
// ภายใน if (existingAdminRole) { ... }
// เพิ่ม permissions ใหม่ใน newPermissions array

const newPermissions = [
  {
    key: "menu.shipping-companies",
    name: "เมนูบริษัทขนส่ง",
    category: "MENU" as const,
    menuPath: "/shipping-companies",
  },
  // ... permissions อื่นๆ
];
```

> ℹ️ ส่วน upsert จะตรวจสอบทีละ permission ว่ามีอยู่หรือยัง ถ้ายังไม่มีจะสร้างใหม่และ assign ให้ administrator role อัตโนมัติ

---

## 10. Quick Reference (Cheat Sheet)

### 🚀 Update Commands (Copy & Paste Ready)

#### Scenario A: Code Only

```bash
cd /opt/crm-bank && git reset --hard && git pull origin Production
cd deploy/app && docker compose -f docker-compose.app.yml --env-file ../env.production up -d --build app
```

#### Scenario B: Code + DB Migration

```bash
cd /opt/crm-bank && git reset --hard && git pull origin Production
docker exec crm-postgres pg_dump -U crm_admin crm > backup_$(date +%Y%m%d_%H%M%S).sql
cd deploy/app
docker compose -f docker-compose.app.yml --env-file ../env.production --profile migrate build migrate
docker compose -f docker-compose.app.yml --env-file ../env.production --profile migrate up migrate
docker logs crm-migrate
docker compose -f docker-compose.app.yml --env-file ../env.production up -d --build app
```

#### Scenario C: Code + DB Migration + Seed

```bash
cd /opt/crm-bank && git reset --hard && git pull origin Production
docker exec crm-postgres pg_dump -U crm_admin crm > backup_$(date +%Y%m%d_%H%M%S).sql
cd deploy/app
docker compose -f docker-compose.app.yml --env-file ../env.production --profile migrate build migrate
docker compose -f docker-compose.app.yml --env-file ../env.production --profile migrate up migrate
docker logs crm-migrate
docker compose -f docker-compose.app.yml --env-file ../env.production --profile seed build seed
docker compose -f docker-compose.app.yml --env-file ../env.production --profile seed up seed
docker logs crm-seed
docker compose -f docker-compose.app.yml --env-file ../env.production up -d --build app
```

#### Quick Verification

```bash
docker ps --format "table {{.Names}}\t{{.Status}}"
docker logs crm-app --tail 20
```

#### Emergency Rollback

```bash
cd /opt/crm-bank/deploy/app
docker compose -f docker-compose.app.yml --env-file ../env.production stop app
cat /opt/crm-bank/backup_FILENAME.sql | docker exec -i crm-postgres psql -U crm_admin -d crm
cd /opt/crm-bank && git checkout <previous-commit>
cd deploy/app && docker compose -f docker-compose.app.yml --env-file ../env.production up -d --build app
```

---

## ⚠️ สรุปข้อควรจำ

| #   | กฎ                                   | เหตุผล                                                    |
| --- | ------------------------------------ | --------------------------------------------------------- |
| 1   | **Backup ก่อน migrate เสมอ**         | Prisma ไม่มี `migrate down` — backup คือ safety net เดียว |
| 2   | **รัน migrate ก่อน rebuild app**     | App ใหม่อาจต้องการ column/table ที่ยังไม่มีใน DB          |
| 3   | **รัน seed หลัง migrate**            | Seed อาจต้องการ table ใหม่จาก migration                   |
| 4   | **ตรวจ logs ทุกครั้ง**               | ถ้า migrate/seed fail แต่ app ถูก rebuild อาจเกิด error   |
| 5   | **ห้าม `db push` บน production**     | `db push` อาจลบ column/table พร้อมข้อมูลโดยไม่เตือน       |
| 6   | **ทดสอบ migration ใน staging ก่อน**  | ป้องกัน migration fail บน production                      |
| 7   | **Seed design ต้อง idempotent**      | รัน seed กี่ครั้งก็ได้ผลลัพธ์เหมือนกัน ไม่ duplicate      |
| 8   | **เก็บ backup อย่างน้อย 3 versions** | กรณีต้อง rollback ไปหลายขั้น                              |
