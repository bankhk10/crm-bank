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
│               Uploads: /uploads (Nginx) │ Uploads: /uploads (Proxy to App-Staging)     │
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
# 1. นำไฟล์ staging.conf จาก Staging repository ไปไว้ที่ conf.d
cp /opt/crm-bank-staging/nginx/conf.d/staging.conf /opt/crm-bank/nginx/conf.d/staging.conf

# 2. ทดสอบความถูกต้องของ Nginx config และ reload
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

# 3. สลับไป Branch สำหรับทดสอบ (Branch: Test)
git checkout Test

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

### Step 5: การเตรียมข้อมูลใน Staging Database

คุณสามารถเลือกได้ 2 แนวทาง:

#### ทางเลือก A: เริ่มจาก Database เปล่า + รัน Seed ข้อมูล
```bash
cd /opt/crm-bank-staging/deploy/app

# 1. รัน Migration
docker compose -f docker-compose.staging.yml --env-file ../.env.staging \
  --profile migrate up migrate

# 2. รัน Seed ข้อมูลระบบหลัก (Core Master Data, RBAC, Users)
docker compose -f docker-compose.staging.yml --env-file ../.env.staging \
  --profile seed up seed

# 3. (ทางเลือก) รัน Seed ข้อมูลทดสอบกิจกรรม (Activity Test Data)
docker compose -f docker-compose.staging.yml --env-file ../.env.staging \
  --profile seed-activity up seed-activity
```

#### ทางเลือก B: คัดลอกข้อมูลจริงและรูปภาพจาก Production (แนะนำ ⭐)
วิธีนี้จะทำให้ได้ข้อมูลเหมือน Production 100% พร้อมทดสอบ:

```bash
# 1. Dump ข้อมูลจาก Production DB แล้ว Restore เข้า Staging DB โดยตรง
docker exec crm-postgres pg_dump -U crm_admin -d crm | docker exec -i crm-postgres-staging psql -U crm_staging_admin -d crm_staging

# 2. คัดลอกไฟล์รูปภาพและเอกสาร (Uploads) จาก Production มายัง Staging
sudo cp -r /home/bank/crm-data/uploads/* /home/bank/crm-data-staging/uploads/
sudo chown -R $USER:$USER /home/bank/crm-data-staging/uploads

# 3. รัน Migration บน Staging เพื่ออัปเดต Schema ใหม่ (กรณี Branch Test มีตารางใหม่ที่ Production ยังไม่มี)
cd /opt/crm-bank-staging/deploy/app
docker compose -f docker-compose.staging.yml --env-file ../.env.staging \
  --profile migrate up migrate
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

## 4. ขั้นตอนการ Deploy และอัปเดตระบบทดสอบ (Standard Deployment Workflow)

เมื่อทีมพัฒนาต้องการ Deploy โค้ดใหม่มาทดสอบที่เครื่อง Staging ให้ใช้คำสั่งมาตรฐานนี้เป็นหลัก:

```bash
# 1. SSH เข้า VPS และเข้าโฟลเดอร์ Staging
ssh user@your-vps-ip
cd /opt/crm-bank-staging

# 2. ดึงโค้ดล่าสุดจาก Branch ทดสอบ (Test)
git reset --hard
git pull origin Test

# 3. รัน Deployment Script (จัดการ Build App, Sync Nginx Config, Safety Checks และ 0-Downtime Reload)
bash scripts/deploy-staging.sh
```

> **สิ่งที่ `scripts/deploy-staging.sh` จัดการให้อัตโนมัติและปลอดภัย:**
> 1. Build และ Start **เฉพาะ** service `app-staging` (ไม่แตะ Database หรือ Service อื่น)
> 2. สำรองข้อมูล (Backup) Active Staging Nginx Config พร้อม Timestamp
> 3. Sync `staging.conf` จาก Staging repository ไปยัง Shared Edge
> 4. รัน `nginx -t` ตรวจสอบ Syntax
> 5. ทำ **Pre-flight Safety Check 4 จุด** ยืนยันว่า Routing ของ Production และ Staging ถูกต้อง 100%
> 6. ส่งสัญญาณ `nginx -s reload` (0-Downtime Reload โดยไม่ Restart Container)
> 7. ทดสอบการเชื่อมต่อ HTTP และสรุปผล

---

## 5. การจัดการกรณีฉุกเฉินและกู้คืนระบบ (Emergency, Manual Sync & Rollback)

### 5.1 การกู้คืน Nginx Config เดิมทันที (Emergency Rollback)

หากเกิดปัญหาหลังการแก้ไข สามารถกู้คืน Nginx Config กลับสู่สถานะล่าสุดที่ทำงานได้ทันที:

```bash
# 1. คัดลอกไฟล์ Backup ล่าสุดกลับมา
LATEST_BACKUP=$(ls -t /opt/crm-bank/nginx/conf.d/.backup/staging.conf.* | head -1)
cp "$LATEST_BACKUP" /opt/crm-bank/nginx/conf.d/staging.conf

# 2. ตรวจสอบ syntax และ reload
docker exec crm-nginx nginx -t
docker exec crm-nginx nginx -s reload
```

### 5.2 การ Sync และตรวจสอบด้วยตนเองทีละขั้นตอน (Manual Step-by-Step for Debugging)

ใช้เฉพาะกรณีต้องการดีบักหรือทดสอบทีละบรรทัดด้วยตนเอง:

```bash
cd /opt/crm-bank-staging

# 1. Build เฉพาะ app-staging
docker compose \
  -f deploy/app/docker-compose.staging.yml \
  --env-file deploy/.env.staging \
  up -d --build app-staging

# 2. Backup config เดิม
mkdir -p /opt/crm-bank/nginx/conf.d/.backup
cp /opt/crm-bank/nginx/conf.d/staging.conf /opt/crm-bank/nginx/conf.d/.backup/staging.conf.$(date +"%Y%m%d_%H%M%S") 2>/dev/null || true

# 3. คัดลอก config ใหม่
cp /opt/crm-bank-staging/nginx/conf.d/staging.conf /opt/crm-bank/nginx/conf.d/staging.conf

# 4. ตรวจสอบ syntax และ safety
docker exec crm-nginx nginx -t
docker exec crm-nginx nginx -T | grep -A 25 "server_name csone.cropsciences.co.th" | grep "nextjs_app"
docker exec crm-nginx nginx -T | grep -A 25 "server_name test-csone.cropsciences.co.th" | grep "staging_upstream"

# 5. Reload
docker exec crm-nginx nginx -s reload
```

---

## 6. คำสั่งการจัดการและตรวจสอบ (Useful Commands)

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

---

## 6. การ Sync ข้อมูลจริงจาก Production มายัง Staging (Data & Uploads Sync)

เมื่อต้องการอัปเดตข้อมูลใน Staging ให้เป็นปัจจุบันเหมือน Production:

### วิธีที่ 1: รันคำสั่งผ่าน VPS โดยตรง (แนะนำ - รวดเร็วที่สุด)

```bash
# 1. สั่ง Dump ข้อมูลจาก Production และ Restore เข้า Staging ในคำสั่งเดียว
docker exec crm-postgres pg_dump -U crm_admin -d crm --clean --if-exists | \
  docker exec -i crm-postgres-staging psql -U crm_staging_admin -d crm_staging

# 2. คัดลอกไฟล์รูปภาพ/เอกสาร (Uploads) ล่าสุด
sudo cp -r /home/bank/crm-data/uploads/* /home/bank/crm-data-staging/uploads/
sudo chown -R $USER:$USER /home/bank/crm-data-staging/uploads

# 3. รัน Migration บน Staging เพื่ออัปเดต Schema ล่าสุดของ Branch Test
cd /opt/crm-bank-staging/deploy/app
docker compose -f docker-compose.staging.yml --env-file ../.env.staging --profile migrate up migrate

# 4. Restart Staging App เพื่อเคลียร์ Cache
docker compose -f docker-compose.staging.yml restart app-staging
```

### วิธีที่ 2: ผ่าน Navicat (GUI)
1. **Export จาก Production:** คลิกขวาที่ Database `crm` บน Connection Production $\rightarrow$ เลือก **Dump SQL File** $\rightarrow$ **Structure and Data**
2. **Import เข้า Staging:** คลิกขวาที่ Database `crm_staging` บน Connection Staging (Port 5433) $\rightarrow$ เลือก **Execute SQL File** $\rightarrow$ เลือกไฟล์ `.sql` ที่เพิ่ง Dump ออกมา
3. **Sync รูปภาพ:** รันคำสั่ง `sudo cp -r /home/bank/crm-data/uploads/* /home/bank/crm-data-staging/uploads/` บน VPS

---

## 7. การเชื่อมต่อ Database Staging ผ่าน Navicat / DBeaver (SSH Tunnel)

คุณสามารถเชื่อมต่อเข้ามาดูหรือแก้ไขข้อมูลใน Database Staging จากเครื่อง Local ได้เช่นเดียวกับ Production:

* **แท็บ General:**
  * **Host:** `127.0.0.1`
  * **Port:** `5433` *(Staging ใช้ Port 5433 เพื่อไม่ให้ชนกับ 5432 ของ Production)*
  * **Initial Database:** `crm_staging`
  * **User Name:** `crm_staging_admin`
  * **Password:** *(รหัสผ่านใน `.env.staging`)*

* **แท็บ SSH:**
  * ☑️ **Use SSH Tunnel**
  * **Host:** `IP_VPS_ของคุณ`
  * **Port:** `22`
  * **User Name:** `bank` *(หรือ user ที่ใช้ SSH)*
  * **Authentication Method:** `Password` หรือ `Private Key`
