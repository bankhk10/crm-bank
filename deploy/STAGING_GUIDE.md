# CRM-Bank Staging Deployment Guide (เครื่องทดสอบ)

> **Domain:** `test-csone.cropsciences.co.th`  
> **Production Domain:** `csone.cropsciences.co.th`  
> **Host Environment:** Same VPS (Isolated Docker Containers & Databases)

---

## 1. ภาพรวมสถาปัตยกรรม (Architecture)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                     VPS (Ubuntu)                                       │
│                                                                                        │
│   [Domain: csone.cropsciences.co.th]          [Domain: test-csone.cropsciences.co.th]  │
│                   │                                            │                       │
│                   └──────────────────┬─────────────────────────┘                       │
│                                      ▼                                                 │
│                     ┌─────────────────────────────────┐                                │
│                     │   crm-nginx (Port 80, 443 + SSL)│ (Reverse Proxy แยกตาม Domain)  │
│                     └───────┬─────────────────┬───────┘                                │
│                             │                 │                                        │
│          [crm-network]      │                 │            [crm-network]               │
│         ────────────────────┼─               ─┼─────────────────────────               │
│                             ▼                 ▼                                        │
│               ┌───────────────────┐     ┌────────────────────────┐                     │
│  PRODUCTION   │   crm-app (3000)  │     │ crm-app-staging (3000) │   STAGING / TEST    │
│  (/opt/crm-bank)        │         │     │           │            │ (/opt/crm-bank-staging)│
│                         ▼         │     │           ▼            │                     │
│               ┌───────────────────┐     │ ┌──────────────────────┐                     │
│               │crm-postgres (5432)│     │ │crm-postgres-staging  │ (Port 5433)         │
│               └───────────────────┘     │ └──────────────────────┘                     │
│               Volume: crm_data          │ Volume: crm_staging_data                     │
│               Uploads: /uploads         │ Uploads: /uploads-staging                    │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. สิ่งที่ต้องเตรียมก่อนเริ่ม (Prerequisites)

- [ ] **DNS A Record:** ชี้ `test-csone.cropsciences.co.th` ไปที่ IP เดียวกับ VPS ของ Production
- [ ] **Production Stack:** รันอยู่ปกติ (มี network `crm-network` และ container `crm-nginx` ทำงานอยู่)

---

## 3. ขั้นตอนการติดตั้งครั้งแรก (First-Time Setup)

### Step 1: ขอ SSL Certificate ให้กับ Domain ทดสอบ

รันคำสั่งบน VPS เพื่อขอ SSL Certificate ผ่าน Certbot:

```bash
# 1. เข้าโฟลเดอร์ Production App
cd /opt/crm-bank/deploy/app

# 2. หยุด Nginx ชั่วคราว (ใช้เวลาไม่กี่วินาที)
docker compose -f docker-compose.app.yml --env-file ../.env.production stop nginx

# 3. ขอ Certificate สำหรับ test-csone.cropsciences.co.th
docker run --rm -it \
  -v app_certbot_certs:/etc/letsencrypt \
  -v app_certbot_data:/var/www/certbot \
  -p 80:80 \
  certbot/certbot certonly --standalone \
  -d test-csone.cropsciences.co.th \
  --agree-tos \
  --email your-email@cropsciences.co.th

# 4. สตาร์ท Nginx กลับขึ้นมา
docker compose -f docker-compose.app.yml --env-file ../.env.production start nginx
```

---

### Step 2: เปิดใช้งาน Nginx Config สำหรับ Staging

```bash
# 1. เข้าโฟลเดอร์ Production
cd /opt/crm-bank

# 2. ดึงโค้ดล่าสุดเพื่อเอาไฟล์ nginx staging template
git pull origin Production

# 3. Copy ไฟล์ config ไปที่ conf.d
cp nginx/conf.d/staging.conf.example nginx/conf.d/staging.conf

# 4. ทดสอบความถูกต้องของ Nginx config และ reload
docker exec crm-nginx nginx -t
docker exec crm-nginx nginx -s reload
```

---

### Step 3: เตรียมโฟลเดอร์และโค้ด Staging

```bash
# 1. สร้างโฟลเดอร์สำหรับ Uploads ของ Staging
mkdir -p /home/bank/crm-data-staging/uploads

# 2. Clone โครงการมาไว้ที่ /opt/crm-bank-staging
cd /opt
git clone <your-git-repo-url> crm-bank-staging
cd crm-bank-staging

# 3. สลับไป Branch สำหรับทดสอบ (เช่น develop หรือ staging)
git checkout develop

# 4. สร้างและตั้งค่าไฟล์ .env.staging
cp deploy/.env.staging.example deploy/.env.staging
nano deploy/.env.staging
```

> **สร้าง Auth Secret ใหม่สำหรับ Staging:**
> ```bash
> openssl rand -base64 64
> ```
> นำค่าที่ได้ไปใส่ใน `AUTH_SECRET` ในไฟล์ `deploy/.env.staging` และตั้งค่ารหัสผ่าน DB ให้เรียบร้อย

---

### Step 4: Start Staging Database

```bash
cd /opt/crm-bank-staging/deploy/db

# Start PostgreSQL Staging
docker compose -f docker-compose.staging.yml --env-file ../.env.staging up -d

# ตรวจสอบสถานะ DB Staging
docker logs crm-postgres-staging
```

---

### Step 5: รัน Migration และ Seed ข้อมูลทดสอบ

```bash
cd /opt/crm-bank-staging/deploy/app

# รัน Migration
docker compose -f docker-compose.staging.yml --env-file ../.env.staging \
  --profile migrate up migrate

# ตรวจสอบ log migration
docker logs crm-migrate-staging

# รัน Seed ข้อมูลเริ่มต้น
docker compose -f docker-compose.staging.yml --env-file ../.env.staging \
  --profile seed up seed

# ตรวจสอบ log seed
docker logs crm-seed-staging
```

---

### Step 6: Start Staging Application Stack

```bash
cd /opt/crm-bank-staging/deploy/app

# Build และเปิดใช้งาน App Staging
docker compose -f docker-compose.staging.yml --env-file ../.env.staging up -d --build app-staging

# ตรวจสอบว่า Container ทำงานและ Healthy
docker ps | grep staging
docker logs crm-app-staging -f
```

ทดสอบเข้าใช้งานผ่าน Browser ที่: **`https://test-csone.cropsciences.co.th`**

---

## 4. ขั้นตอนการอัปเดตระบบทดสอบ (Update Workflow)

เมื่อทีมพัฒนาต้องการ Deploy โค้ดใหม่มาทดสอบที่เครื่อง Staging:

```bash
# SSH เข้า VPS
ssh user@your-vps-ip

# เข้าโฟลเดอร์ Staging
cd /opt/crm-bank-staging

# 1. ดึงโค้ดล่าสุดจาก Branch ทดสอบ
git reset --hard
git pull origin develop

# ============================================================
# กรณี A: อัปเดตเฉพาะ Code (ไม่มีการเปลี่ยน DB Schema)
# ============================================================
cd deploy/app
docker compose -f docker-compose.staging.yml --env-file ../.env.staging up -d --build app-staging

# ============================================================
# กรณี B: มีการเปลี่ยน Database Schema (Migration)
# ============================================================
cd deploy/app

# 1. สั่งรัน migrate
docker compose -f docker-compose.staging.yml --env-file ../.env.staging \
  --profile migrate up migrate

# 2. Rebuild app
docker compose -f docker-compose.staging.yml --env-file ../.env.staging up -d --build app-staging
```

---

## 5. คำสั่งการจัดการและตรวจสอบ (Useful Commands)

### ดูสถานะ Logs
```bash
# App Staging Logs
docker logs crm-app-staging -f --tail 100

# Database Staging Logs
docker logs crm-postgres-staging -f --tail 100

# Nginx Staging Access Logs
docker exec crm-nginx tail -f /var/log/nginx/access_staging.log
```

### การสั่ง Restart Staging Services
```bash
# Restart App Staging
cd /opt/crm-bank-staging/deploy/app
docker compose -f docker-compose.staging.yml restart app-staging

# Restart DB Staging
cd /opt/crm-bank-staging/deploy/db
docker compose -f docker-compose.staging.yml restart postgres-staging
```

### การล้างข้อมูลและ Reset Staging Database (เมื่อต้องการเริ่มทดสอบใหม่จาก 0)
```bash
cd /opt/crm-bank-staging/deploy/db

# 1. Stop DB Staging และลบ Volume Staging (ไม่มีผลกระทบต่อ Production)
docker compose -f docker-compose.staging.yml down -v

# 2. Start DB ใหม่
docker compose -f docker-compose.staging.yml --env-file ../.env.staging up -d

# 3. รัน Migrate & Seed ใหม่
cd ../app
docker compose -f docker-compose.staging.yml --env-file ../.env.staging --profile migrate up migrate
docker compose -f docker-compose.staging.yml --env-file ../.env.staging --profile seed up seed
```
