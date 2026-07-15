# Database Seeding Strategy

## Current Structure

The seeding logic has been refactored into modular files in `prisma/seed/`:

- `master.ts`: Companies, Departments, Units, Categories, Plants.
- `product-master.ts`: TradeNameGroup, ProductGroup, Brand, ProductABCTypes.
- `rbac.ts`: Roles, Permissions, and RolePermissions.
- `users.ts`: Default admin user and Positions.
- `test-last-year-data.ts`: Test sales data for last year (standalone script).
- `index.ts`: Main entry point.

## Seed Behavior (Idempotent)

### `master.ts`
- Uses `createMany({ skipDuplicates: true })` for models with `@unique` fields (Unit, Company, etc.).
- Uses `upsert` for Departments.
- ⚠️ Models **without** `@unique` on `code` (e.g., ProductCategory) may create duplicates on repeated runs.

### `product-master.ts`
- Uses `createMany({ skipDuplicates: true })`.
- ⚠️ Same duplicate risk for `ProductABCTypes` (no `@unique` on `code`).

### `rbac.ts`
- **First run** (no `administrator` role): Creates all Roles, Permissions, and RolePermissions from scratch.
- **Subsequent runs** (role exists): **Add-only** mode:
  - Creates new Permissions that don't exist in DB yet (assigns to `administrator` automatically).
  - Updates Permission metadata (name, resource, menuPath) if changed.
  - **Does NOT** delete existing Permissions from DB.
  - **Does NOT** modify existing RolePermissions (safe for Production UI changes).

### `users.ts`
- Uses `upsert` for admin user — safe to run multiple times.
- Uses `findFirst` for Positions — skips if already exists.

---

## Quick Command Reference

### 🔹 Development Environment

การพัฒนาบนเครื่องท้องถิ่น (Local Development):

```bash
# 1. สร้าง Migration ใหม่ (เมื่อแก้ไข schema.prisma)
npx prisma migrate dev --name <migration_name>
# ตัวอย่าง: npx prisma migrate dev --name add_customer_fields

# 2. Generate Prisma Client (อัพเดท types)
npx prisma generate

# 3. Seed ข้อมูล
pnpm seed

# 4. Reset ฐานข้อมูลทั้งหมด (⚠️ ลบข้อมูลทั้งหมด)
npx prisma migrate reset

# 5. ดูสถานะ Migration
npx prisma migrate status

# 6. เปิด Prisma Studio (GUI ดูข้อมูล)
npx prisma studio
```

### 🔹 Production Environment

การ Deploy ขึ้น Production Server:

```bash
# ⚠️ สำคัญ: ห้ามใช้ `migrate dev` หรือ `migrate reset` บน Production!

# 1. Apply Migrations (ใช้ migrations ที่มีอยู่แล้ว)
npx prisma migrate deploy

# 2. Generate Prisma Client
npx prisma generate

# 3. Seed ข้อมูล (Add-Only — ไม่ลบข้อมูลเดิม, ไม่เขียนทับสิทธิ์ที่แก้ผ่าน UI)
pnpm seed
```

### 🔹 Docker Deployment

**สำหรับ Local / Test (ใช้ docker-compose.local.yml):**

```bash
# 1. รัน Migration Container
docker compose -f docker-compose.local.yml run --rm migrate

# 2. รัน Seed Container
docker compose -f docker-compose.local.yml run --rm seed

# หรือ Start ทุก services
docker compose -f docker-compose.local.yml up -d
```

**สำหรับ Production (ใช้ Stack ในโฟลเดอร์ deploy/):**
ดูคู่มือฉบับเต็มได้ที่ [DEPLOY_GUIDE.md](file:///d:/code/crm-bank/deploy/DEPLOY_GUIDE.md) หรือใช้คำสั่ง:

```bash
# ไปที่โฟลเดอร์ deploy/app/
cd deploy/app

# รัน Migration
docker compose -f docker-compose.app.yml --env-file ../env.production --profile migrate up migrate

# รัน Seed
docker compose -f docker-compose.app.yml --env-file ../env.production --profile seed up seed
```

### 🔹 Summary: ขั้นตอนเมื่อแก้ไข schema.prisma

| ขั้นตอน                      | Development                                                | Production                           |
| ---------------------------- | ---------------------------------------------------------- | ------------------------------------ |
| 1. สร้าง Migration           | `npx prisma migrate dev --name <name>`                     | (สร้างบน Dev, commit ไว้)            |
| 2. Apply Migration           | (ทำอัตโนมัติตอน migrate dev)                               | `npx prisma migrate deploy`          |
| 3. Generate Client           | `npx prisma generate`                                      | `npx prisma generate`                |
| 4. Seed ข้อมูล               | `pnpm seed`                                                | `pnpm seed`                          |

### ⚠️ ข้อควรระวัง

1. **Production**: ห้ามใช้คำสั่ง `migrate dev` หรือ `migrate reset` โดยเด็ดขาด
2. **Migration Files**: ต้อง commit ไฟล์ใน `prisma/migrations/` ลง Git ทุกครั้ง
3. **RBAC on Production**: สิทธิ์ที่แก้ผ่าน UI จะไม่ถูกเขียนทับเมื่อรัน seed ซ้ำ แต่ Permission ที่เพิ่มใหม่ผ่าน UI จะไม่ถูกลบออก
4. **Backup**: ควร backup ฐานข้อมูลก่อน migrate บน Production เสมอ

