# คู่มือทดสอบ Docker ที่ Local

คู่มือนี้จะแนะนำวิธีการทดสอบแอปพลิเคชัน CRM Bank ด้วย Docker บนเครื่อง local ของคุณ

## Prerequisites (สิ่งที่ต้องเตรียม)

### 1. ติดตั้ง Docker Desktop

**Windows:**

- ดาวน์โหลด [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/)
- ติดตั้งและรัน Docker Desktop
- ตรวจสอบว่า Docker รันอยู่: เปิด PowerShell แล้วรัน `docker --version`

**ผลลัพธ์ที่ควรได้:**

```
Docker version 24.x.x, build xxxxxxx
```

### 2. ตรวจสอบ Docker Compose

Docker Compose มักจะมาพร้อมกับ Docker Desktop แล้ว ตรวจสอบด้วย:

```powershell
docker-compose --version
```

## ขั้นตอนการทดสอบ

### Step 1: เตรียม Environment Variables

1. ตรวจสอบว่ามีไฟล์ `.env.local` อยู่แล้วในโปรเจกต์
2. ตรวจสอบว่ามีค่าที่จำเป็นครบถ้วน:

```env
DATABASE_URL="postgresql://postgres:postgres@postgres:5432/crm_bank"
AUTH_SECRET="your-secret-key"
AUTH_TRUST_HOST="true"
NEXT_PUBLIC_SHOW_RANDOM_FILL="true"
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

> **หมายเหตุ:** สำหรับการทดสอบ local, `DATABASE_URL` จะถูก override ใน `docker-compose.yml` ให้ชี้ไปที่ PostgreSQL container

### Step 2: Build และ Run Containers

**วิธีที่ 1: ใช้ Script (แนะนำ)**

```powershell
cd d:\code\crm-bank
.\scripts\deploy-local.bat
```

Script จะทำงานดังนี้:

- ✅ ตรวจสอบว่า Docker รันอยู่
- ✅ ตรวจสอบไฟล์ environment
- 🧹 ลบ containers เก่า (ถ้ามี)
- 🏗️ Build Docker images
- 🚀 Start containers
- 📊 แสดงสถานะ containers

**วิธีที่ 2: รันด้วยตัวเอง**

```powershell
# เข้าไปที่โฟลเดอร์โปรเจกต์
cd d:\code\crm-bank

# Build images
docker-compose build

# Start containers
docker-compose up -d

# ดู logs
docker-compose logs -f
```

### Step 3: ตรวจสอบว่า Services รันอยู่

```powershell
docker-compose ps
```

ควรเห็น 2 containers:

- `crm-bank-app-local` - Next.js application (port 3000)
- `crm-bank-postgres-local` - PostgreSQL database (port 5432)

### Step 4: เข้าใช้งานแอปพลิเคชัน

เปิดเบราว์เซอร์และไปที่:

```
http://localhost:3000
```

## การจัดการ Database

### ดู Database Logs

```powershell
docker-compose logs -f postgres
```

### เชื่อมต่อกับ PostgreSQL

```powershell
docker-compose exec postgres psql -U postgres -d crm_bank
```

### รัน Prisma Migrations

```powershell
# เข้าไปใน app container
docker-compose exec app sh

# รัน migration
npx prisma migrate deploy

# ออกจาก container
exit
```

### Seed ข้อมูลทดสอบ

```powershell
docker-compose exec app npx tsx prisma/seed.ts
```

## คำสั่งที่มีประโยชน์

### ดู Logs แบบ Real-time

```powershell
# ดู logs ทั้งหมด
docker-compose logs -f

# ดู logs เฉพาะ app
docker-compose logs -f app

# ดู logs เฉพาะ database
docker-compose logs -f postgres
```

### Restart Services

```powershell
# Restart ทั้งหมด
docker-compose restart

# Restart เฉพาะ app
docker-compose restart app
```

### Stop และ Remove Containers

```powershell
# Stop containers (เก็บ data ไว้)
docker-compose stop

# Stop และลบ containers + volumes (ลบ data ทั้งหมด)
docker-compose down -v

# Stop และลบ containers (เก็บ data ไว้)
docker-compose down
```

### Rebuild Containers

เมื่อมีการเปลี่ยนแปลง code:

```powershell
# Stop containers
docker-compose down

# Rebuild และ start ใหม่
docker-compose up --build -d
```

## Troubleshooting

### ปัญหา: Port 3000 ถูกใช้งานอยู่แล้ว

**วิธีแก้:**

1. หา process ที่ใช้ port 3000:

```powershell
netstat -ano | findstr :3000
```

2. ปิด process หรือเปลี่ยน port ใน `docker-compose.yml`:

```yaml
ports:
  - "3001:3000" # เปลี่ยนจาก 3000 เป็น 3001
```

### ปัญหา: Database connection failed

**วิธีแก้:**

1. ตรวจสอบว่า postgres container รันอยู่:

```powershell
docker-compose ps postgres
```

2. ดู logs ของ postgres:

```powershell
docker-compose logs postgres
```

3. Restart postgres:

```powershell
docker-compose restart postgres
```

### ปัญหา: Prisma Client ไม่อัพเดท

**วิธีแก้:**

```powershell
# เข้าไปใน container
docker-compose exec app sh

# Generate Prisma Client ใหม่
npx prisma generate

# ออกจาก container
exit

# Restart app
docker-compose restart app
```

### ปัญหา: Build ล้มเหลว

**วิธีแก้:**

```powershell
# ลบ images และ build ใหม่
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### ปัญหา: Out of disk space

**วิธีแก้:**

```powershell
# ลบ unused images, containers, volumes
docker system prune -a --volumes
```

⚠️ **คำเตือน:** คำสั่งนี้จะลบทุกอย่างที่ไม่ได้ใช้งาน รวมถึง data ใน volumes

## การทดสอบ Features

### 1. ทดสอบ Login

- ไปที่ http://localhost:3000
- ใช้ user ที่ seed ไว้ในการ login

### 2. ทดสอบ CRUD Operations

- สร้าง/แก้ไข/ลบ Customer
- สร้าง/แก้ไข/ลบ Product
- สร้าง Sale

### 3. ทดสอบ File Upload

- อัพโหลดรูปภาพ Customer
- อัพโหลดรูปภาพ Product
- ตรวจสอบว่ารูปแสดงผลถูกต้อง (ผ่าน Cloudinary)

### 4. ทดสอบ Permissions

- ทดสอบ role-based access control
- ทดสอบ data access levels

## เปรียบเทียบ Local Testing vs Production

| Feature          | Local Testing          | Production                |
| ---------------- | ---------------------- | ------------------------- |
| Database         | PostgreSQL in Docker   | External PostgreSQL       |
| Environment      | `.env.local`           | `.env.production`         |
| Docker Compose   | `docker-compose.yml`   | `docker-compose.prod.yml` |
| Hot Reload       | ❌ No (ต้อง rebuild)   | ❌ No                     |
| Data Persistence | ✅ Yes (Docker volume) | ✅ Yes (External DB)      |
| SSL/HTTPS        | ❌ No                  | ✅ Yes (via ngrok/nginx)  |

## Next Steps

เมื่อทดสอบ local สำเร็จแล้ว:

1. ✅ ตรวจสอบว่าทุก features ทำงานถูกต้อง
2. ✅ เตรียม `.env.production` สำหรับ production
3. ✅ อ่านคู่มือ [Production Deployment](./production-deployment.md)
4. 🚀 Deploy to production!
