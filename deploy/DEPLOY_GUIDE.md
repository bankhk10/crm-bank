# CRM-Bank Production Deployment Guide

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

### Step 4: Run Database Migration

```bash
cd /opt/crm-bank/deploy/app

# Build และ Run migration (ใช้ migrate deploy สำหรับ production)
docker compose -f docker-compose.app.yml --env-file ../env.production \
  --profile migrate build migrate

docker compose -f docker-compose.app.yml --env-file ../env.production \
  --profile migrate up migrate

# ตรวจสอบ migration สำเร็จ
docker logs crm-migrate
```

### Step 5: Seed Initial Data (Optional - ครั้งแรกเท่านั้น)

```bash
cd /opt/crm-bank/deploy/app

# Build และ Run seed
docker compose -f docker-compose.app.yml --env-file ../env.production \
  --profile seed build seed

docker compose -f docker-compose.app.yml --env-file ../env.production \
  --profile seed up seed

# ตรวจสอบ seed สำเร็จ
docker logs crm-seed
```

### Step 6: Deploy Application Stack

```bash
cd /opt/crm-bank/deploy/app

# Build และ Start app + nginx + certbot
docker compose -f docker-compose.app.yml --env-file ../env.production up -d --build

# ตรวจสอบ status
docker compose -f docker-compose.app.yml ps
```

### Step 7: Setup SSL Certificate (First Time)

```bash
# หยุด nginx ชั่วคราวเพื่อ certbot standalone
docker compose -f docker-compose.app.yml stop nginx

# ขอ certificate
docker run --rm -it \
  -v crm-bank_certbot_certs:/etc/letsencrypt \
  -v crm-bank_certbot_data:/var/www/certbot \
  -p 80:80 \
  certbot/certbot certonly --standalone \
  -d csone.cropsciences.co.th \
  --agree-tos \
  --email your-email@domain.com

# Start nginx กลับมา
docker compose -f docker-compose.app.yml start nginx
```

---

## 2. Update Deployment (Code Updates)

เมื่อมีการ push code ใหม่:

```bash
# SSH to VPS
ssh user@your-vps-ip
cd /opt/crm-bank

# Pull latest code
git pull origin main

# ====================================
# Option A: Code-only update (no DB changes)
# ====================================
cd deploy/app
docker compose -f docker-compose.app.yml --env-file ../env.production up -d --build app

# Nginx จะ restart อัตโนมัติถ้า app healthy

# ====================================
# Option B: With database migration
# ====================================
cd deploy/app

# Run migration first
docker compose -f docker-compose.app.yml --env-file ../env.production \
  --profile migrate up migrate

# Then rebuild and restart app
docker compose -f docker-compose.app.yml --env-file ../env.production up -d --build app

# ====================================
# Option C: Full rebuild (both app + nginx)
# ====================================
cd deploy/app
docker compose -f docker-compose.app.yml --env-file ../env.production up -d --build
```

---

## 3. Migration Commands Explained

### Recommended: `prisma migrate deploy`

```bash
# ใช้สำหรับ production - apply migration files ที่มีอยู่
docker compose -f docker-compose.app.yml --env-file ../env.production \
  --profile migrate up migrate
```

**เมื่อไหร่ควรใช้:**
- Production deployment
- มี migration files ใน `prisma/migrations/`
- ต้องการ version control schema changes
- ทำงานกับ team และต้อง sync schema

### Alternative: `prisma db push` (ใช้ด้วยความระวัง!)

```bash
# ⚠️ WARNING: --accept-data-loss อาจลบข้อมูลได้!
docker compose -f docker-compose.app.yml --env-file ../env.production \
  --profile db-push up db-push
```

**เมื่อไหร่อาจจำเป็น:**
- Development/staging environment
- ต้องการ sync schema โดยไม่สนใจ migration history
- Reset database ใหม่ทั้งหมด
- Prototype/POC ที่ไม่มี production data

**⚠️ ความเสี่ยง:**
- `--accept-data-loss` อาจ DROP columns/tables
- ไม่มี rollback
- ไม่ track history ใน `_prisma_migrations`

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
