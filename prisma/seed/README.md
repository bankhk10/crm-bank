# Database Seeding Strategy

## Current Structure

The seeding logic has been refactored into modular files in `prisma/seed/`:

- `clear.ts`: Clears all data (Dev only).
- `master.ts`: Companies, Departments, Master data.
- `product-master.ts`: Product categories, groups, chemical groups.
- `rbac.ts`: Roles and Permissions.
- `users.ts`: Default users.
- `index.ts`: Main entry point.

## Proposed Multi-Environment Strategy

To support Dev, Staging, and Production environments safely, we can implement a `SEED_MODE` environment variable strategy.

### 1. Development (Default)

- **Mode**: `dev`
- **Behavior**: Partial/Full Reset + Full Seed.
- **Action**: Runs `clear.ts` then seeds everything.
- **Command**:
  ```bash
  npm run seed
  # OR
  SEED_MODE=dev npm run seed
  ```

### 2. Staging

- **Mode**: `staging`
- **Behavior**: No Clear. Update Master Data & RBAC.
- **Action**: Skips `clear.ts`. Runs `master.ts` and `rbac.ts` (idempotent checks needed).
- **Command**:
  ```bash
  SEED_MODE=staging npm run seed
  ```

### 3. Production

- **Mode**: `production`
- **Behavior**: **Conservative Add-Only**.
- **Action**:
  - NEVER run `clear.ts`.
  - Only adds _missing_ permissions or roles.
  - Does not touch existing business data (Products, Companies, Users).
- **Command**:
  ```bash
  SEED_MODE=production npm run seed
  ```

## Recommended Implementation Plan

1. **Update `index.ts` to handle modes**:

   ```typescript
   const mode = process.env.SEED_MODE || "dev";

   if (mode === "dev") {
     await seedClear(prisma);
   }

   if (["dev", "staging"].includes(mode)) {
     await seedMaster(prisma);
     await seedProductMaster(prisma);
   }

   // RBAC runs in all modes, but Production version might need to be "Create Only"
   // We might need a separate 'seedRBACSafe' for production that uses upsert/connect
   await seedRBAC(prisma);

   if (mode === "dev") {
     await seedUsers(prisma);
   }
   ```

2. **Refactor `rbac.ts` for Safety**:
   - Currently, `rbac.ts` might assume clean state or use `create`.
   - For Production, ensure `upsert` or `findFirst` check is used to avoid Unique Constraint violations.

3. **CI/CD Integration**:
   - Configure the deployment pipeline to set the appropriate `SEED_MODE` var.

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

# 3. Seed ข้อมูล (Clear + Full Seed)
npm run seed
# หรือระบุ mode ชัดเจน
SEED_MODE=dev npm run seed

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
# หรือ
npm run db:migrate

# 2. Generate Prisma Client
npx prisma generate

# 3. Seed ข้อมูล (Conservative Add-Only - ไม่ลบข้อมูลเดิม)
SEED_MODE=production npm run seed
```

### 🔹 Docker Deployment

สำหรับ Production ที่ใช้ Docker:

```bash
# 1. รัน Migration Container
docker compose run --rm migrate

# 2. รัน Seed Container
docker compose run --rm seed

# หรือ Start ทุก services
docker compose up -d
```

### 🔹 Summary: ขั้นตอนเมื่อแก้ไข schema.prisma

| ขั้นตอน                      | Development                                                | Production                           |
| ---------------------------- | ---------------------------------------------------------- | ------------------------------------ |
| 1. สร้าง Migration           | `npx prisma migrate dev --name <name>`                     | (สร้างบน Dev, commit ไว้)            |
| 2. Apply Migration           | (ทำอัตโนมัติตอน migrate dev)                               | `npx prisma migrate deploy`          |
| 3. Generate Client           | `npx prisma generate`                                      | `npx prisma generate`                |
| 4. Seed ข้อมูล               | `npm run seed`                                             | `SEED_MODE=production npm run seed`  |

### ⚠️ ข้อควรระวัง

1. **Production**: ห้ามใช้คำสั่ง `migrate dev` หรือ `migrate reset` โดยเด็ดขาด
2. **Migration Files**: ต้อง commit ไฟล์ใน `prisma/migrations/` ลง Git ทุกครั้ง
3. **Seed Mode**: Production ใช้ `SEED_MODE=production` เพื่อป้องกันการลบข้อมูล
4. **Backup**: ควร backup ฐานข้อมูลก่อน migrate บน Production เสมอ
