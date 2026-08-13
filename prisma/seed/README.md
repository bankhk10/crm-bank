# Database Seeding Strategy

## Current Structure

The seeding logic has been refactored into modular subfolders in `prisma/seed/`:

### 📂 `prisma/seed/core/` (ข้อมูลหลัก/ระบบหลัก)
- `index.ts`: Entry point สำหรับการ seed ข้อมูลหลักของระบบ
- `master.ts`: Companies, Departments, Units, Categories, Plants
- `product-master.ts`: TradeNameGroup, ProductGroup, Brand, ProductABCTypes
- `promotional-materials.ts`: Promotional Materials
- `rbac.ts`: Roles, Permissions (รวมสิทธิ์ของระบบการวางแผนกิจกรรม), และ RolePermissions
- `users.ts`: Default admin user (`b@b.com`) และ Positions หลัก

### 📂 `prisma/seed/activity/` (ข้อมูลทดสอบระบบกิจกรรม)
- `index.ts`: Entry point ประสานงานการรัน seed ข้อมูลทดสอบระบบกิจกรรม
- `permissions.ts`: การสร้างและกำหนด Activity Permissions และ RolePermissions (สิทธิ์มองเห็น activity-plans)
- `departments-positions.ts`: การสร้างแผนกและตำแหน่งเฉพาะระบบกิจกรรม

---

## Quick Command Reference

### 🔹 Development Environment

การพัฒนาบนเครื่องท้องถิ่น (Local Development):

```bash
# 1. สร้าง Migration ใหม่ (เมื่อแก้ไข schema.prisma)
npx prisma migrate dev --name <migration_name>

# 2. Generate Prisma Client (อัพเดท types)
npx prisma generate

# 3. Seed ข้อมูลระบบหลัก (Master, Products, RBAC, Admin user)
pnpm seed
# หรือ
pnpm seed:core

# 4. Seed ข้อมูลทดสอบกิจกรรม (เฉพาะเมื่อต้องการทดสอบระบบ Activity Flow)
pnpm seed:activity

# 5. Reset ฐานข้อมูลทั้งหมด (⚠️ ลบข้อมูลทั้งหมด)
npx prisma migrate reset

# 6. ดูสถานะ Migration
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

