# คู่มือ Deploy Production ด้วย Docker

คู่มือนี้จะแนะนำวิธีการ deploy แอปพลิเคชัน CRM Bank ไปยัง production server ด้วย Docker

## ภาพรวม Architecture

```
┌─────────────────────────────────────────┐
│         Production Server               │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │   Docker Container                │ │
│  │   ┌─────────────────────────┐    │ │
│  │   │   Next.js App           │    │ │
│  │   │   (Port 3000)           │    │ │
│  │   └─────────────────────────┘    │ │
│  └───────────────────────────────────┘ │
│                 │                       │
│                 ▼                       │
│  ┌───────────────────────────────────┐ │
│  │   External PostgreSQL Database    │ │
│  │   (บนเครื่องอื่น)                 │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │   Ngrok / Nginx (Optional)        │ │
│  │   HTTPS/SSL Termination           │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## ความต้องการของ Server

### Hardware Requirements (แนะนำ)

- **CPU:** 2 cores ขึ้นไป
- **RAM:** 4GB ขึ้นไป (แนะนำ 8GB)
- **Storage:** 20GB ขึ้นไป
- **Network:** Internet connection

### Software Requirements

- **OS:** Windows Server, Linux, หรือ macOS
- **Docker:** Version 20.x ขึ้นไป
- **Docker Compose:** Version 2.x ขึ้นไป
- **Git:** สำหรับ pull code (optional)

## ขั้นตอนการ Setup ครั้งแรก

### Step 1: ติดตั้ง Docker บน Production Server

**สำหรับ Windows Server:**

```powershell
# ดาวน์โหลดและติดตั้ง Docker Desktop for Windows
# https://www.docker.com/products/docker-desktop/

# ตรวจสอบการติดตั้ง
docker --version
docker-compose --version
```

**สำหรับ Linux (Ubuntu/Debian):**

```bash
# Update package index
sudo apt-get update

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt-get install docker-compose-plugin

# Add user to docker group
sudo usermod -aG docker $USER

# Verify installation
docker --version
docker compose version
```

### Step 2: เตรียม Code บน Server

**วิธีที่ 1: ใช้ Git (แนะนำ)**

```powershell
# Clone repository
git clone <your-repository-url> crm-bank
cd crm-bank
```

**วิธีที่ 2: Upload ด้วยตัวเอง**

- Copy โฟลเดอร์โปรเจกต์ทั้งหมดไปยัง server
- ใช้ FTP, SCP, หรือ Remote Desktop

### Step 3: เตรียม External Database

#### 3.1 ติดตั้ง PostgreSQL บนเครื่องแยก

**Windows:**

```powershell
# ดาวน์โหลด PostgreSQL installer
# https://www.postgresql.org/download/windows/

# หรือใช้ Docker
docker run -d \
  --name postgres-prod \
  -e POSTGRES_PASSWORD=your-password \
  -e POSTGRES_DB=crm_bank \
  -p 5432:5432 \
  -v postgres_data:/var/lib/postgresql/data \
  --restart always \
  postgres:16-alpine
```

#### 3.2 สร้าง Database

```sql
-- เชื่อมต่อกับ PostgreSQL
psql -U postgres

-- สร้าง database
CREATE DATABASE crm_bank;

-- สร้าง user (optional)
CREATE USER crm_user WITH PASSWORD 'secure-password';
GRANT ALL PRIVILEGES ON DATABASE crm_bank TO crm_user;
```

#### 3.3 ตั้งค่า Firewall

อนุญาตให้ production server เชื่อมต่อกับ PostgreSQL:

```powershell
# Windows Firewall
New-NetFirewallRule -DisplayName "PostgreSQL" -Direction Inbound -LocalPort 5432 -Protocol TCP -Action Allow
```

#### 3.4 แก้ไข PostgreSQL Configuration

แก้ไขไฟล์ `postgresql.conf`:

```conf
listen_addresses = '*'  # หรือระบุ IP ของ production server
```

แก้ไขไฟล์ `pg_hba.conf`:

```conf
# เพิ่มบรรทัดนี้ (แทนที่ IP ด้วย IP ของ production server)
host    crm_bank    all    192.168.1.100/32    md5
```

Restart PostgreSQL service

### Step 4: สร้าง Production Environment File

สร้างไฟล์ `.env.production`:

```powershell
cd d:\crm-bank  # หรือ path ที่เก็บโปรเจกต์

# Copy template
copy .env.production.example .env.production

# แก้ไขไฟล์
notepad .env.production
```

**ตัวอย่างค่าใน `.env.production`:**

```env
# Database - ระบุ IP และ credentials ของ external database
DATABASE_URL="postgresql://crm_user:secure-password@192.168.1.50:5432/crm_bank"

# Authentication - สร้าง secret ใหม่ด้วย openssl
AUTH_SECRET="<สร้างด้วย: openssl rand -base64 32>"
AUTH_TRUST_HOST="true"

# Application URL
# สำหรับ ngrok
NEXTAUTH_URL="https://your-subdomain.ngrok.io"
# หรือสำหรับ domain จริง
# NEXTAUTH_URL="https://yourdomain.com"

# Feature Flags
NEXT_PUBLIC_SHOW_RANDOM_FILL="false"

# Cloudinary - ใช้ค่าเดียวกับ development
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Node Environment
NODE_ENV="production"
```

### Step 5: สร้าง AUTH_SECRET

```powershell
# ใช้ OpenSSL (ถ้ามี)
openssl rand -base64 32

# หรือใช้ PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

Copy ค่าที่ได้ไปใส่ใน `.env.production`

### Step 6: รัน Database Migrations

```powershell
# ติดตั้ง dependencies (ถ้ายังไม่ได้ติดตั้ง)
npm install -g pnpm
pnpm install

# รัน migrations
pnpm exec prisma migrate deploy

# Seed ข้อมูลเริ่มต้น (optional)
pnpm exec tsx prisma/seed.ts
```

## การ Deploy ครั้งแรก

### วิธีที่ 1: ใช้ Script (แนะนำ)

```powershell
cd d:\crm-bank
.\scripts\deploy-prod.bat
```

Script จะทำงานดังนี้:

1. ✅ ตรวจสอบ Docker
2. ✅ ตรวจสอบ `.env.production`
3. 💾 Backup deployment เก่า
4. 🏗️ Build Docker image
5. 🔄 รัน database migrations
6. 🚀 Deploy containers
7. 🏥 Health check
8. 📊 แสดงสถานะ

### วิธีที่ 2: รันด้วยตัวเอง

```powershell
# Build image
docker-compose -f docker-compose.prod.yml build --no-cache

# รัน migrations
docker-compose -f docker-compose.prod.yml run --rm app npx prisma migrate deploy

# Start containers
docker-compose -f docker-compose.prod.yml up -d

# ตรวจสอบสถานะ
docker-compose -f docker-compose.prod.yml ps

# ดู logs
docker-compose -f docker-compose.prod.yml logs -f app
```

## การตั้งค่า HTTPS/SSL

### Option 1: ใช้ Ngrok (สำหรับทดสอบ)

1. **ติดตั้ง Ngrok:**

```powershell
# ดาวน์โหลดจาก https://ngrok.com/download
# Extract และเพิ่มเข้า PATH
```

2. **รัน Ngrok:**

```powershell
ngrok http 3000
```

3. **อัพเดท NEXTAUTH_URL:**

```env
NEXTAUTH_URL="https://abc123.ngrok.io"
```

4. **Restart application:**

```powershell
docker-compose -f docker-compose.prod.yml restart app
```

### Option 2: ใช้ Nginx + Let's Encrypt (Production จริง)

#### 2.1 สร้างไฟล์ `nginx/nginx.conf`

```nginx
events {
    worker_connections 1024;
}

http {
    upstream nextjs {
        server app:3000;
    }

    server {
        listen 80;
        server_name yourdomain.com;

        # Redirect HTTP to HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name yourdomain.com;

        # SSL certificates
        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;

        # SSL configuration
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;

        # Security headers
        add_header Strict-Transport-Security "max-age=31536000" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;

        # Gzip compression
        gzip on;
        gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

        location / {
            proxy_pass http://nextjs;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }
    }
}
```

#### 2.2 แก้ไข `docker-compose.prod.yml`

Uncomment nginx service:

```yaml
nginx:
  image: nginx:alpine
  container_name: crm-bank-nginx
  restart: always
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    - ./nginx/ssl:/etc/nginx/ssl:ro
  depends_on:
    - app
  networks:
    - crm-network
```

#### 2.3 ติดตั้ง SSL Certificate

**ใช้ Let's Encrypt (ฟรี):**

```powershell
# ติดตั้ง Certbot
# https://certbot.eff.org/

# สร้าง certificate
certbot certonly --standalone -d yourdomain.com

# Copy certificates
mkdir nginx\ssl
copy C:\Certbot\live\yourdomain.com\fullchain.pem nginx\ssl\
copy C:\Certbot\live\yourdomain.com\privkey.pem nginx\ssl\
```

## การ Update/Deploy ใหม่

เมื่อมีการแก้ไข code:

```powershell
# 1. Pull code ใหม่ (ถ้าใช้ Git)
git pull

# 2. รัน deployment script
.\scripts\deploy-prod.bat
```

Script จะ:

- Backup deployment เก่า
- Build image ใหม่
- รัน migrations
- Deploy แบบ zero-downtime
- Health check

## Monitoring และ Logs

### ดู Logs

```powershell
# Real-time logs
docker-compose -f docker-compose.prod.yml logs -f app

# Logs ย้อนหลัง 100 บรรทัด
docker-compose -f docker-compose.prod.yml logs --tail=100 app

# Save logs to file
docker-compose -f docker-compose.prod.yml logs app > logs.txt
```

### ตรวจสอบ Resource Usage

```powershell
# CPU, Memory usage
docker stats

# Disk usage
docker system df
```

### Health Check

```powershell
# Manual health check
docker-compose -f docker-compose.prod.yml exec app curl http://localhost:3000/api/health

# หรือจากภายนอก
curl https://yourdomain.com/api/health
```

## Backup Strategy

### 1. Backup Database

```powershell
# สร้างโฟลเดอร์ backup
mkdir backups

# Backup database
docker exec postgres-prod pg_dump -U postgres crm_bank > backups/backup_$(date +%Y%m%d_%H%M%S).sql

# หรือถ้า database อยู่คนละเครื่อง
pg_dump -h 192.168.1.50 -U crm_user crm_bank > backups/backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Automated Backup (Windows Task Scheduler)

สร้างไฟล์ `scripts/backup.bat`:

```batch
@echo off
set BACKUP_DIR=D:\backups\crm-bank
set DATE=%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set DATE=%DATE: =0%

mkdir "%BACKUP_DIR%\%DATE%"

REM Backup database
pg_dump -h 192.168.1.50 -U crm_user crm_bank > "%BACKUP_DIR%\%DATE%\database.sql"

REM Backup .env.production
copy .env.production "%BACKUP_DIR%\%DATE%\"

REM Delete backups older than 30 days
forfiles /p "%BACKUP_DIR%" /d -30 /c "cmd /c rd /s /q @path"
```

ตั้ง Task Scheduler ให้รันทุกวันเวลา 2:00 AM

## Rollback Procedure

หากเกิดปัญหาหลัง deploy:

```powershell
# 1. Stop current deployment
docker-compose -f docker-compose.prod.yml down

# 2. Restore database backup (ถ้าจำเป็น)
psql -h 192.168.1.50 -U crm_user crm_bank < backups/backup_20231225_020000.sql

# 3. Checkout code เวอร์ชันเก่า (ถ้าใช้ Git)
git checkout <previous-commit-hash>

# 4. Deploy เวอร์ชันเก่า
.\scripts\deploy-prod.bat
```

## Troubleshooting

### ปัญหา: Cannot connect to database

**วิธีแก้:**

1. ตรวจสอบ `DATABASE_URL` ใน `.env.production`
2. ตรวจสอบว่า database server รันอยู่
3. ตรวจสอบ firewall rules
4. ทดสอบ connection:

```powershell
docker-compose -f docker-compose.prod.yml exec app npx prisma db pull
```

### ปัญหา: Application crashes after deployment

**วิธีแก้:**

1. ดู logs:

```powershell
docker-compose -f docker-compose.prod.yml logs app
```

2. ตรวจสอบ environment variables
3. ตรวจสอบ database migrations:

```powershell
docker-compose -f docker-compose.prod.yml exec app npx prisma migrate status
```

### ปัญหา: Out of memory

**วิธีแก้:**

1. เพิ่ม memory limit ใน `docker-compose.prod.yml`:

```yaml
deploy:
  resources:
    limits:
      memory: 4G # เพิ่มจาก 2G
```

2. Restart:

```powershell
docker-compose -f docker-compose.prod.yml up -d
```

### ปัญหา: SSL certificate expired

**วิธีแก้:**

```powershell
# Renew certificate
certbot renew

# Copy new certificates
copy C:\Certbot\live\yourdomain.com\fullchain.pem nginx\ssl\
copy C:\Certbot\live\yourdomain.com\privkey.pem nginx\ssl\

# Restart nginx
docker-compose -f docker-compose.prod.yml restart nginx
```

## Security Best Practices

1. ✅ ใช้ strong passwords สำหรับ database
2. ✅ เปลี่ยน `AUTH_SECRET` เป็นค่าที่ปลอดภัย
3. ✅ ใช้ HTTPS/SSL
4. ✅ จำกัด database access ด้วย firewall
5. ✅ Backup database เป็นประจำ
6. ✅ Update Docker images เป็นประจำ
7. ✅ Monitor logs สำหรับ suspicious activities
8. ✅ ใช้ environment variables สำหรับ secrets (ห้าม hardcode)

## Performance Optimization

### 1. Enable Caching

แก้ไข `nginx.conf`:

```nginx
location /_next/static {
    proxy_pass http://nextjs;
    proxy_cache_valid 200 60m;
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 2. Database Connection Pooling

Prisma จัดการ connection pooling อัตโนมัติ แต่สามารถปรับแต่งได้:

```env
DATABASE_URL="postgresql://user:password@host:5432/db?connection_limit=10&pool_timeout=20"
```

### 3. Resource Limits

ปรับ resource limits ใน `docker-compose.prod.yml` ตามความเหมาะสม

## Checklist ก่อน Deploy Production

- [ ] ✅ ทดสอบ local สำเร็จแล้ว
- [ ] ✅ Database พร้อมใช้งานและ migrate แล้ว
- [ ] ✅ `.env.production` ครบถ้วนและถูกต้อง
- [ ] ✅ `AUTH_SECRET` สร้างใหม่และปลอดภัย
- [ ] ✅ Cloudinary credentials ถูกต้อง
- [ ] ✅ Backup database เก่า (ถ้ามี)
- [ ] ✅ Firewall rules ตั้งค่าแล้ว
- [ ] ✅ SSL certificate พร้อม (ถ้าใช้)
- [ ] ✅ Monitoring setup
- [ ] ✅ Rollback plan พร้อม

## Next Steps

หลังจาก deploy สำเร็จ:

1. ✅ ทดสอบทุก features บน production
2. ✅ Setup automated backups
3. ✅ Setup monitoring และ alerts
4. ✅ Document production URLs และ credentials
5. ✅ Train users
