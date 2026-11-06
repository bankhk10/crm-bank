# CRM-Bank Production Deployment Guide

> **Domain Production:** `https://csone.icgone.com`
> **Domain Staging (Test):** `https://test-csone.icgone.com`
> **Edge & SSL:** Cloudflare Tunnel (`crm-tunnel`) — ไม่ต้องใช้ Nginx หรือต่ออายุ SSL Certbot อีกต่อไป

---

## 📌 สรุปคำสั่งเวลา Deploy โค้ดใหม่ในอนาคต (สั้นลงและง่ายขึ้นมาก)

- **เวลาอัปเดต Production (`csone.icgone.com`):**
  ```bash
  cd /opt/crm-bank && git pull origin Production
  cd deploy/app && docker compose -f docker-compose.app.yml --env-file ../.env.production up -d --build app
  ```
- **เวลาอัปเดต Staging (`test-csone.icgone.com`):**
  ```bash
  cd /opt/crm-bank-staging && git pull origin Test && bash scripts/deploy-staging.sh
  ```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     VPS (Ubuntu)                            │
│  ┌────────────────┐     ┌──────────────────────────────┐   │
│  │  compose-db    │     │        compose-app           │   │
│  │  ┌──────────┐  │     │  ┌─────┐ ┌───────┐ ┌───────┐│   │
│  │  │ postgres │◄─┼─────┼──┤ app │ │ nginx │ │certbot││   │
│  │  │crm-postgres│ │     │  └─────┘ └───────┘ └───────┘│   │
│  │  └──────────┘  │     │                              │   │
│  └────────────────┘     └──────────────────────────────┘   │
│           │                         │                       │
│           └─────────┬───────────────┘                       │
│                     │                                        │
│              [crm-network] (external)                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

- **Node.js**: 20.0.0 หรือสูงกว่า (สำหรับ local development)
- **npm/pnpm**: 10.0.0 หรือสูงกว่า
- Docker 24+ และ Docker Compose v2
- Git
- Domain pointing to VPS IP

---

## 1. First-Time Deployment (Initial Setup)

### Step 1: Clone Repository & Setup Environment

```bash
# SSH to VPS
ssh user@your-vps-ip

# Clone repository
cd /opt
git clone <your-repo-url> crm-bank
cd crm-bank

# Copy and edit environment file
cp deploy/.env.production.example deploy/.env.production
nano deploy/.env.production

# Generate AUTH_SECRET
openssl rand -base64 64

# Fill in all required values:
# - POSTGRES_PASSWORD (strong password)
# - AUTH_SECRET (from openssl command above)
```

### Step 2: Create External Docker Network

```bash
# สร้าง network กลางก่อน (ครั้งเดียว)
docker network create crm-network
```

### Step 3: Deploy Database Stack

```bash
cd /opt/crm-bank/deploy/db

# Start PostgreSQL
docker compose -f docker-compose.db.yml --env-file ../env.production up -d

# ตรวจสอบ database healthy
docker compose -f docker-compose.db.yml ps
docker logs crm-postgres

# รอจนกว่าจะแสดง "database system is ready to accept connections"
```

### Step 4: Apply Database Migrations

 Since we tracked migration history in git, we use `migrate deploy` to apply migrations safely.

 ```bash
 cd /opt/crm-bank/deploy/app

 # Build and Run migrate
 docker compose -f docker-compose.app.yml --env-file ../env.production \
   --profile migrate build migrate

 docker compose -f docker-compose.app.yml --env-file ../env.production \
   --profile migrate up migrate

 # Check logs
 docker logs crm-migrate
 ```

### Step 5: Seed Initial Data (Optional - One-time only)

```bash
cd /opt/crm-bank/deploy/app

# Build and Run seed
docker compose -f docker-compose.app.yml --env-file ../env.production \
  --profile seed build seed

docker compose -f docker-compose.app.yml --env-file ../env.production \
  --profile seed up seed

# Check seed success
docker logs crm-seed
```

### Step 6: Deploy Application Stack

```bash
cd /opt/crm-bank/deploy/app

# Build and Start app + nginx + certbot
docker compose -f docker-compose.app.yml --env-file ../env.production up -d --build
```

### Step 7: Setup SSL Certificate (First Time)

```bash
cd /opt/crm-bank

# Stop nginx temporarily (needs env file for variable check)
docker compose -f deploy/app/docker-compose.app.yml --env-file deploy/.env.production stop nginx

# Request certificate
# Note: check volume names with 'docker volume ls' if unsure (e.g., app_certbot_*)
docker run --rm -it \
  -v app_certbot_certs:/etc/letsencrypt \
  -v app_certbot_data:/var/www/certbot \
  -p 80:80 \
  certbot/certbot certonly --standalone \
  -d csone.icgone.com \
  --agree-tos \
  --email your-email@domain.com

# Start nginx again
docker compose -f deploy/app/docker-compose.app.yml --env-file deploy/.env.production start nginx
```

---

## 2. Update Deployment (Code Updates)

When pushing new code:

```bash
# SSH to VPS
ssh user@your-vps-ip
cd /opt/crm-bank

# Pull latest code
git reset --hard
git pull origin Production

# ====================================
# Option A: Code-only update (no DB changes)
# ====================================
cd deploy/app
docker compose -f docker-compose.app.yml --env-file ../env.production up -d --build app

# ====================================
 # Option B: With database schema changes (Migrations)
 # ====================================
 cd deploy/app

 # Run migrate to apply new schema changes
 docker compose -f docker-compose.app.yml --env-file ../env.production \
   --profile migrate up migrate

 # Then rebuild and restart app
 docker compose -f docker-compose.app.yml --env-file ../env.production up -d --build app
 ```

---

## 3. Database Management Explained

 ### Primary Method: `prisma migrate deploy` (Production Safe)

 ```bash
 docker compose -f docker-compose.app.yml --env-file ../env.production \
   --profile migrate up migrate
 ```

 **Why use this:**
 - **Safest for Production**: Applies pending migrations from `prisma/migrations` folder.
 - **Version Control**: Tracks schema history via migration files committed in Git.
 - **Strict Validation**: Will fail if the database schema has drifted from migration history, preventing accidental data loss.

 ### Alternative: `prisma db push` (Development / Prototyping)

 Use this ONLY if you are prototyping and haven't generated migration files yet.
 **Warning:** `db push` may modify/delete data to match schema.prisma and ignores migration history files.

---

## 4. Seed Commands

### Run Seed (ครั้งแรก)

```bash
docker compose -f docker-compose.app.yml --env-file ../env.production \
  --profile seed up seed
```

### ป้องกัน Seed ซ้ำ

**วิธีที่ 1: Check ใน seed script**

```javascript
// prisma/seed.js
async function main() {
  // Check if already seeded
  const existingUsers = await prisma.user.count();
  if (existingUsers > 0) {
    console.log('Database already seeded, skipping...');
    return;
  }

  // ... seed logic
}
```

**วิธีที่ 2: ใช้ upsert แทน create**

```javascript
await prisma.role.upsert({
  where: { name: 'admin' },
  update: {},
  create: { name: 'admin', ... }
});
```

**วิธีที่ 3: สร้าง seed marker table**

```javascript
const seeded = await prisma.seedStatus.findFirst({ where: { name: 'initial' }});
if (seeded) {
  console.log('Already seeded');
  return;
}
// ... seed
await prisma.seedStatus.create({ data: { name: 'initial', completedAt: new Date() }});
```

---

## 5. Deployment Checklist

### Pre-deployment

- [ ] `.env.production` configured with secrets
- [ ] External network created: `docker network create crm-network`
- [ ] DNS pointing to VPS IP
- [ ] Firewall allows ports 80, 443

### Database Stack

- [ ] `docker network ls` shows `crm-network`
- [ ] crm-postgres running: `docker ps | grep crm-postgres`
- [ ] Healthcheck passing: `docker inspect crm-postgres --format='{{.State.Health.Status}}'`
- [ ] Can connect: `docker exec crm-postgres pg_isready`

### Application Stack

- [ ] crm-app running and healthy: `docker ps | grep crm-app`
- [ ] App healthcheck: `docker exec crm-app wget -qO- http://localhost:3000/api/health`
- [ ] crm-nginx running: `docker ps | grep crm-nginx`
- [ ] Port 80 accessible: `curl -I http://your-domain.com`
- [ ] Port 443 accessible: `curl -I https://your-domain.com`
- [ ] SSL valid: `curl -v https://your-domain.com 2>&1 | grep "SSL certificate"`

---

## 6. Useful Log Commands

```bash
# Database logs
docker logs crm-postgres -f --tail 100

# App logs
docker logs crm-app -f --tail 100

# Nginx logs
docker logs crm-nginx -f --tail 100

# Nginx access/error logs (from volume)
tail -f /opt/crm-bank/nginx/logs/access.log
tail -f /opt/crm-bank/nginx/logs/error.log

# Migration logs
docker logs crm-migrate

# Seed logs
docker logs crm-seed

# All app stack logs
cd /opt/crm-bank/deploy/app
docker compose -f docker-compose.app.yml logs -f

# Container resource usage
docker stats crm-postgres crm-app crm-nginx
```

---

## 7. Troubleshooting

### Network Issues

```bash
# ตรวจสอบ network
docker network ls
docker network inspect crm-network

# ดู containers ใน network
docker network inspect crm-network --format='{{range .Containers}}{{.Name}} {{end}}'

# Test connectivity จาก app ไปยัง db
docker exec crm-app ping -c 3 crm-postgres
```

### Database Connection Issues

```bash
# Test connection จาก app container
docker exec crm-app sh -c 'PGPASSWORD=$POSTGRES_PASSWORD psql -h crm-postgres -U $POSTGRES_USER -d $POSTGRES_DB -c "SELECT 1"'

# หรือใช้ pg_isready
docker exec crm-migrate pg_isready -h crm-postgres -p 5432
```

### Restart Services

```bash
cd /opt/crm-bank/deploy

# Restart database
cd db && docker compose -f docker-compose.db.yml restart

# Restart app only
cd ../app && docker compose -f docker-compose.app.yml restart app

# Restart nginx
docker compose -f docker-compose.app.yml restart nginx

# Full app stack restart
docker compose -f docker-compose.app.yml restart
```

### Cleanup

```bash
# Remove stopped containers
docker container prune

# Remove unused images
docker image prune

# Remove all (use with caution!)
docker system prune -a
```

---

## 8. Backup & Restore

### Backup Database

```bash
# Backup to file
docker exec crm-postgres pg_dump -U crm_admin crm_bank > backup_$(date +%Y%m%d_%H%M%S).sql

# หรือ backup ผ่าน volume mount
docker exec crm-postgres pg_dump -U crm_admin crm_bank > /backups/backup_$(date +%Y%m%d).sql
```

### Restore Database

```bash
# Restore from file
cat backup.sql | docker exec -i crm-postgres psql -U crm_admin -d crm_bank
```

---

## ⚠️ Important Notes

1. **Network Order**: ต้องสร้าง network ก่อน deploy compose ใดๆ
2. **DB First**: Deploy database stack ก่อน app stack เสมอ
3. **No depends_on cross-compose**: App ไม่สามารถ depends_on postgres ได้ ใช้ wait-for-db script แทน
4. **Container Name Resolution**: ใช้ `crm-postgres` ไม่ใช่ `postgres` ใน DATABASE_URL
5. **Migrate vs Push**: ใน production ควรใช้ `migrate deploy` เท่านั้น
6. **Seed Once**: ควร seed ครั้งเดียวและมี logic ป้องกัน duplicate

---

## 9. การจัดการและตรวจสอบ SSL Certificate (Cloudflare Managed SSL)

> [!TIP]
> **ไม่ต้องต่ออายุเองอีกต่อไป (100% Auto-Renewed by Cloudflare):**
> เมื่อเปลี่ยนมาใช้ **Cloudflare Tunnel (`crm-tunnel`)** ทาง Cloudflare จะเป็นผู้ออกและต่ออายุใบรับรอง SSL (Universal Edge Certificate) ให้อัตโนมัติ 100% ตลอดอายุการใช้งาน (ต่ออายุอัตโนมัติล่วงหน้า 30 วันก่อนหมดอายุเสมอ) โดยไม่ต้องรัน `certbot` บน VPS อีกต่อไป

### วิธีเช็ควันหมดอายุของ SSL (3 วิธี)

1. **วิธีที่ 1: เช็คผ่านคำสั่ง `curl` ใน Terminal (เร็วที่สุด)**
   ```bash
   curl -vI https://csone.icgone.com 2>&1 | grep -E "subject:|start date:|expire date:|issuer:"
   curl -vI https://test-csone.icgone.com 2>&1 | grep -E "subject:|start date:|expire date:|issuer:"
   ```
2. **วิธีที่ 2: เช็คผ่านหน้าเว็บ Cloudflare Dashboard**
   - เข้าไปที่โดเมน `icgone.com` $\rightarrow$ เมนู **SSL/TLS** $\rightarrow$ **Edge Certificates**
   - ดูที่รายการ `*.icgone.com, icgone.com` จะแสดงสถานะ **Active (สีเขียว)** พร้อมวันหมดอายุ (`Expires on...`)
3. **วิธีที่ 3: เช็คผ่าน Browser (Chrome / Edge)**
   - เปิดหน้าเว็บ `https://csone.icgone.com`
   - คลิกไอคอนด้านซ้ายสุดของช่อง URL $\rightarrow$ **Connection is secure (การเชื่อมต่อปลอดภัย)** $\rightarrow$ **Certificate is valid (ใบรับรองถูกต้อง)**

---

### (Legacy) การจัดการ SSL ด้วย Certbot เดิม (กรณีไม่ได้ใช้ Cloudflare Tunnel)

### รอบการต่ออายุอัตโนมัติ (Auto-Renewal)
- ใบรับรอง SSL ของ Let's Encrypt มีอายุ **90 วัน**
- Container `crm-certbot` ตั้งค่าให้รัน `certbot renew` เช็คทุกๆ **12 ชั่วโมง**
- Certbot จะทำการต่ออายุจริงเมื่อใบรับรองเหลืออายุน้อยกว่า **30 วัน** (หรือต่ออายุใหม่ทุกๆ **~60 วัน**)

### 1. เช็ควันหมดอายุและจำนวนวันที่เหลือของ SSL ทุกโดเมน
```bash
# เช็คผ่าน Volume โดยตรง (ใช้ได้แม้ container crm-certbot หยุดทำงานอยู่)
docker run --rm -v app_certbot_certs:/etc/letsencrypt certbot/certbot certificates

# หรือถ้า crm-certbot รันอยู่ (Up)
docker exec crm-certbot certbot certificates

# เช็คผ่าน curl จากหน้าเว็บจริง
curl -vI https://csone.icgone.com 2>&1 | grep -E "subject:|start date:|expire date:|issuer:"
curl -vI https://test-csone.icgone.com 2>&1 | grep -E "subject:|start date:|expire date:|issuer:"
```

### 2. คำสั่งต่ออายุ SSL ด้วยตนเอง (Manual Renew)

**วิธีที่ 1: ต่ออายุผ่าน Webroot (ไม่ต้องหยุด Nginx - แนะนำ)**
```bash
# ต่ออายุทุกโดเมนที่ใกล้หมดอายุ (< 30 วัน)
docker run --rm \
  -v app_certbot_certs:/etc/letsencrypt \
  -v app_certbot_data:/var/www/certbot \
  certbot/certbot renew --webroot -w /var/www/certbot

# หรือระบุต่ออายุเฉพาะโดเมน เช่น test-csone.icgone.com
docker run --rm \
  -v app_certbot_certs:/etc/letsencrypt \
  -v app_certbot_data:/var/www/certbot \
  certbot/certbot renew --cert-name test-csone.icgone.com --webroot -w /var/www/certbot

# ทดสอบจำลองการต่ออายุ (Dry-run) ว่าผ่านหรือไม่
docker run --rm \
  -v app_certbot_certs:/etc/letsencrypt \
  -v app_certbot_data:/var/www/certbot \
  certbot/certbot renew --dry-run --webroot -w /var/www/certbot

# หลังต่ออายุสำเร็จ สั่ง Reload Nginx เพื่อรับใบรับรองใหม่ (0-Downtime)
docker exec crm-nginx nginx -s reload
```

**วิธีที่ 2: ต่ออายุแบบ Standalone (กรณีใช้ Port 80 โดยตรง ต้องหยุด Nginx ชั่วคราว)**
```bash
docker stop crm-nginx

docker run --rm \
  -v app_certbot_certs:/etc/letsencrypt \
  -v app_certbot_data:/var/www/certbot \
  -p 80:80 \
  certbot/certbot renew

docker start crm-nginx
```

---

## 10. รวมคำสั่งที่ใช้งานบ่อย (Quick Command Cheat Sheet)

### 🔍 เช็คสถานะระบบและพอร์ต (Status & Port Checks)
```bash
# ดู Container ที่กำลังทำงานอยู่ทั้งหมดแบบอ่านง่าย
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# ดู Container ทั้งหมดรวมตัวที่หยุดทำงาน (Exited) เช่น crm-nginx, crm-certbot
docker ps -a | grep -E "crm-|nginx|certbot"

# เช็คว่าโปรแกรมอะไรกำลังใช้พอร์ต 80 และ 443 อยู่ (กรณีฟ้อง address already in use)
sudo ss -tulpn | grep -E ':80|:443'

# ดูปริมาณการใช้ CPU / RAM ของแต่ละ Container แบบ Real-time
docker stats crm-postgres crm-app crm-app-staging crm-nginx
```

### 🛠️ แก้ปัญหา Nginx ของเครื่อง Ubuntu แย่งพอร์ต 80/443 หลังรีบูต VPS
```bash
# 1. หยุดและปิด Auto-start ของ Nginx บน Host
sudo systemctl stop nginx
sudo systemctl disable nginx

# 2. เปิด crm-nginx และ crm-certbot ของ Docker ขึ้นมาแทน
docker start crm-nginx crm-certbot

# 3. ตรวจสอบและ Reload Nginx ใน Docker
docker exec crm-nginx nginx -t
docker exec crm-nginx nginx -s reload
```

### 🚀 คำสั่ง Deploy ด่วน (Production & Staging)
```bash
# --- Deploy Production (เฉพาะแก้โค้ด) ---
cd /opt/crm-bank && git reset --hard && git pull origin Production
cd deploy/app && docker compose -f docker-compose.app.yml --env-file ../.env.production up -d --build app

# --- Deploy Staging (Test) ---
cd /opt/crm-bank-staging && git pull origin Test && bash scripts/deploy-staging.sh
```

### 📜 คำสั่งดู Logs ที่ใช้บ่อย
```bash
# ดู Log ของ Production App ล่าสุด 100 บรรทัดพร้อมติดตามแบบ Real-time
docker logs crm-app -f --tail 100

# ดู Log ของ Staging App ล่าสุด 100 บรรทัด
docker logs crm-app-staging -f --tail 100

# ดู Log ของ Nginx และ Certbot
docker logs crm-nginx --tail 50
docker logs crm-certbot --tail 50
```

### 💾 คำสั่ง Backup Database ด่วน
```bash
# Backup Production Database
docker exec crm-postgres pg_dump -U crm_admin crm > /opt/crm-bank/backup_prod_$(date +%Y%m%d_%H%M%S).sql

# Backup Staging Database
docker exec crm-postgres-staging pg_dump -U crm_staging_admin crm_staging > /opt/crm-bank-staging/backup_staging_$(date +%Y%m%d_%H%M%S).sql
```
