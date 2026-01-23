# 🐳 Local Docker Testing Guide

คู่มือการทดสอบระบบบน localhost โดยใช้ Docker เพื่อให้เหมือนกับ Production environment

## 📋 สารบัญ

1. [ภาพรวม](#ภาพรวม)
2. [ความต้องการเบื้องต้น](#ความต้องการเบื้องต้น)
3. [การเริ่มต้นใช้งาน](#การเริ่มต้นใช้งาน)
4. [คำสั่งที่ใช้บ่อย](#คำสั่งที่ใช้บ่อย)
5. [การ Migrate และ Seed](#การ-migrate-และ-seed)
6. [การ Debug](#การ-debug)
7. [ความแตกต่าง Local vs Production](#ความแตกต่าง-local-vs-production)
8. [การแก้ปัญหา](#การแก้ปัญหา)

---

## ภาพรวม

### ทำไมต้องทดสอบด้วย Docker?

| ปัญหา                     | Docker แก้ยังไง                     |
| ------------------------- | ----------------------------------- |
| "ทำงานได้บนเครื่องผม"     | สภาพแวดล้อมเหมือนกันทุกเครื่อง      |
| Database version ต่างกัน  | ใช้ PostgreSQL 16 เหมือน production |
| Environment variables หาย | กำหนดไว้ใน `.env.local.docker`      |
| Dependencies ไม่ตรงกัน    | Multi-stage build ใน Dockerfile     |

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Network                        │
│                  (crm-local-network)                     │
│                                                          │
│  ┌─────────────────┐     ┌──────────────────────────┐   │
│  │   PostgreSQL    │     │      Next.js App          │   │
│  │   (postgres)    │◄────│        (app)              │   │
│  │   Port: 5433    │     │    Port: 3000             │   │
│  └─────────────────┘     └──────────────────────────┘   │
│                                                          │
└─────────────────────────────────────────────────────────┘
         ▲                           ▲
         │                           │
    localhost:5433              localhost:3000
    (Database)                  (Application)
```

---

## ความต้องการเบื้องต้น

### ซอฟต์แวร์ที่ต้องติดตั้ง

- **Docker Desktop** (Windows/Mac) หรือ **Docker Engine** (Linux)
- **Docker Compose** (มาพร้อมกับ Docker Desktop)

### พื้นที่และ Resource

- **พื้นที่ว่าง**: อย่างน้อย 5 GB
- **RAM**: อย่างน้อย 4 GB สำหรับ Docker

### ตรวจสอบการติดตั้ง

```bash
# ตรวจสอบ Docker version
docker --version

# ตรวจสอบ Docker Compose version
docker compose version
```

---

## การเริ่มต้นใช้งาน

### วิธีที่ 1: ใช้ Script (แนะนำ)

#### Windows

```batch
# ดับเบิลคลิกหรือรันจาก terminal
scripts\local-docker-test.bat
```

#### Linux/Mac

```bash
# ให้สิทธิ์รันได้
chmod +x scripts/local-docker-test.sh

# รัน script
./scripts/local-docker-test.sh
```

### วิธีที่ 2: รันคำสั่งเอง

#### Step 1: สร้าง Environment File

```bash
# คัดลอก environment file
cp .env.local.docker .env.docker
```

#### Step 2: Build และ Start Services

```bash
# Build และ start ทุก services
docker compose -f docker-compose.local.yml --env-file .env.local.docker up --build -d
```

#### Step 3: รัน Migration

```bash
# รัน database migration
docker compose -f docker-compose.local.yml --env-file .env.local.docker --profile migrate up migrate
```

#### Step 4: รัน Seed (ถ้าต้องการ)

```bash
# รัน database seed
docker compose -f docker-compose.local.yml --env-file .env.local.docker --profile seed up seed
```

#### Step 5: เปิดใช้งาน

เข้าใช้งานที่: **http://localhost:3000**

---

## คำสั่งที่ใช้บ่อย

### จัดการ Services

```bash
# Start services (ไม่ต้อง build ใหม่)
docker compose -f docker-compose.local.yml --env-file .env.local.docker up -d

# Stop services
docker compose -f docker-compose.local.yml down

# Restart services
docker compose -f docker-compose.local.yml restart

# ดู logs
docker compose -f docker-compose.local.yml logs -f

# ดู logs เฉพาะ app
docker compose -f docker-compose.local.yml logs -f app
```

### จัดการ Database

```bash
# เข้า PostgreSQL CLI
docker compose -f docker-compose.local.yml exec postgres psql -U crm_admin -d crm_bank

# Backup database
docker compose -f docker-compose.local.yml exec postgres pg_dump -U crm_admin crm_bank > backup.sql

# Restore database
docker compose -f docker-compose.local.yml exec -T postgres psql -U crm_admin -d crm_bank < backup.sql
```

### ทำความสะอาด

```bash
# หยุดและลบ containers (เก็บ data)
docker compose -f docker-compose.local.yml down

# หยุดและลบทุกอย่าง รวมถึง volumes (data หาย!)
docker compose -f docker-compose.local.yml down -v --remove-orphans

# ลบ images ที่ไม่ใช้
docker image prune -f
```

---

## การ Migrate และ Seed

### รัน Migration เท่านั้น

```bash
docker compose -f docker-compose.local.yml --env-file .env.local.docker --profile migrate up migrate
```

### รัน Seed เท่านั้น

```bash
docker compose -f docker-compose.local.yml --env-file .env.local.docker --profile seed up seed
```

### รัน Migration + Seed พร้อมกัน

```bash
docker compose -f docker-compose.local.yml --env-file .env.local.docker --profile migrate --profile seed up migrate seed
```

---

## การ Debug

### ดู Container Logs

```bash
# ทุก containers
docker compose -f docker-compose.local.yml logs -f

# เฉพาะ app
docker compose -f docker-compose.local.yml logs -f app

# ย้อนหลัง 100 บรรทัด
docker compose -f docker-compose.local.yml logs --tail=100 app
```

### เข้าไปใน Container

```bash
# เข้า app container
docker compose -f docker-compose.local.yml exec app sh

# เข้า postgres container
docker compose -f docker-compose.local.yml exec postgres bash
```

### ตรวจสอบ Health

```bash
# ดู status ของ containers
docker compose -f docker-compose.local.yml ps

# ตรวจสอบ health check
docker inspect crm-app-local --format='{{.State.Health.Status}}'
```

### ทดสอบ API Health

```bash
# ใช้ curl (Linux/Mac)
curl http://localhost:3000/api/health

# ใช้ PowerShell (Windows)
Invoke-WebRequest -Uri http://localhost:3000/api/health
```

---

## ความแตกต่าง Local vs Production

| รายการ                  | Local                      | Production           |
| ----------------------- | -------------------------- | -------------------- |
| **Docker Compose File** | `docker-compose.local.yml` | `docker-compose.yml` |
| **Environment File**    | `.env.local.docker`        | `.env.production`    |
| **Database Port**       | 5433 (exposed)             | ไม่ expose           |
| **App Port**            | 3000 (direct)              | 80/443 via Nginx     |
| **SSL**                 | ไม่มี                      | Let's Encrypt        |
| **Nginx**               | ไม่มี                      | มี (reverse proxy)   |
| **NEXTAUTH_URL**        | http://localhost:3000      | https://domain.com   |
| **AUTH_SECRET**         | Test secret                | Strong secret        |

---

## การแก้ปัญหา

### ปัญหา: Port 3000 ถูกใช้งานอยู่

```bash
# ตรวจสอบ process ที่ใช้ port 3000
# Windows
netstat -ano | findstr :3000

# Linux/Mac
lsof -i :3000

# หยุด process หรือเปลี่ยน port ใน docker-compose.local.yml
```

### ปัญหา: Database connection failed

```bash
# ตรวจสอบ postgres container
docker compose -f docker-compose.local.yml logs postgres

# รอให้ postgres พร้อม
docker compose -f docker-compose.local.yml exec postgres pg_isready -U crm_admin
```

### ปัญหา: Build ล้มเหลว

```bash
# ล้าง Docker cache และ build ใหม่
docker compose -f docker-compose.local.yml build --no-cache

# ตรวจสอบ disk space
docker system df
```

### ปัญหา: No migration found in prisma/migrations

หากรัน `migrate` แล้วพบว่าไม่มี migration files (ในโฟลเดอร์ `prisma/migrations` ว่างเปล่า) ระบบจะแสดงข้อความว่าไม่มีอะไรให้ทำ

**วิธีแก้:**
ใน `docker-compose.local.yml` เราได้ตั้งค่าเริ่มต้นให้ใช้ `npx prisma db push` แทน เพื่อความสะดวกในการทดสอบ Local ที่ยังไม่ต้องการจัดการ Migration History แต่ต้องการให้โครงสร้าง Database ตรงกับ `schema.prisma` ทันที

หากต้องการใช้ Migration แบบ Production จริงๆ ให้รันคำสั่งนี้บนเครื่องตัวเองก่อนเพื่อสร้าง Migration File แรก:

```bash
npx prisma migrate dev --name init
```

### ปัญหา: App ไม่ start

```bash
# ดู logs ของ app
docker compose -f docker-compose.local.yml logs app

# เข้าไปใน container ตรวจสอบ
docker compose -f docker-compose.local.yml exec app sh
ls -la
cat package.json
```

### Reset ทุกอย่าง (Clean Start)

```bash
# หยุดและลบทุกอย่าง
docker compose -f docker-compose.local.yml down -v --remove-orphans

# ลบ images
docker image prune -a -f

# Build ใหม่ทั้งหมด
docker compose -f docker-compose.local.yml --env-file .env.local.docker up --build -d
```

---

## 🔗 ลิงก์ที่เกี่ยวข้อง

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Prisma with Docker](https://www.prisma.io/docs/concepts/components/prisma-client/deployment)
- [Next.js Docker Deployment](https://nextjs.org/docs/deployment#docker-image)

---

## 📞 ติดต่อ

หากพบปัญหาในการใช้งาน กรุณาติดต่อทีมพัฒนา
