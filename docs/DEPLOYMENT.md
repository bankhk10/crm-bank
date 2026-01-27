# 🚀 CRM-Bank Production Deployment Guide

คู่มือการ Deploy โปรเจกต์ CRM-Bank บน Production Server

## 📋 ข้อมูลระบบ

| รายการ         | ค่า                      |
| -------------- | ------------------------ |
| **Server OS**  | Ubuntu 24.04.3 LTS       |
| **IP Address** | 27.254.143.48            |
| **Domain**     | csone.cropsciences.co.th |
| **Runtime**    | Docker + Docker Compose  |

---

## 🏗️ โครงสร้างไฟล์สำหรับ Production

```
crm-bank/
├── Dockerfile                    # Multi-stage build for production
├── docker-compose.yml            # Production compose file
├── .dockerignore                 # Files to ignore in Docker build
├── .env.production.example       # Environment template
├── .env.production               # Actual env (DO NOT COMMIT!)
├── nginx/
│   ├── nginx.conf                # Nginx main config
│   ├── conf.d/
│   │   └── default.conf          # Server block config
│   ├── ssl/                      # SSL certificates
│   └── logs/                     # Nginx logs
├── scripts/
│   ├── deploy.sh                 # Main deployment script
│   ├── backup-db.sh              # Database backup
│   ├── restore-db.sh             # Database restore
│   └── update.sh                 # Zero-downtime update
├── backups/                      # Database backups
└── app/api/health/route.ts       # Health check endpoint
```

---

## 📝 ขั้นตอนการ Deploy ทีละขั้น

### ขั้นตอนที่ 1: เตรียม Server (บน Ubuntu Server)

```bash
# SSH เข้า server
ssh root@27.254.143.48

# สร้างโฟลเดอร์สำหรับโปรเจกต์
mkdir -p /opt/crm-bank
cd /opt/crm-bank

# Clone โปรเจกต์ (หรือ upload ไฟล์)
git clone <your-repo-url> .
# หรือ
scp -r ./crm-bank root@27.254.143.48:/opt/crm-bank
```

### ขั้นตอนที่ 2: ติดตั้ง Docker

```bash
# อัปเดต packages
sudo apt update && sudo apt upgrade -y

# ติดตั้ง required packages
sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release

# เพิ่ม Docker GPG key
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# เพิ่ม Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# ติดตั้ง Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# ตรวจสอบการติดตั้ง
docker --version
docker compose version

# เริ่มและ enable Docker
sudo systemctl start docker
sudo systemctl enable docker
```

### ขั้นตอนที่ 3: ตั้งค่า Firewall (UFW)

```bash
# ติดตั้งและตั้งค่า UFW
sudo apt install -y ufw

# ตั้งค่า default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# เปิด ports ที่จำเป็น
sudo ufw allow 22/tcp comment 'SSH'
sudo ufw allow 80/tcp comment 'HTTP'
sudo ufw allow 443/tcp comment 'HTTPS'

# เปิดใช้งาน Firewall
sudo ufw enable

# ตรวจสอบสถานะ
sudo ufw status verbose
```

### ขั้นตอนที่ 4: สร้าง Environment File

```bash
cd /opt/crm-bank

# คัดลอกไฟล์ตัวอย่าง
cp .env.production.example .env.production

# แก้ไขค่าต่างๆ
nano .env.production
```

**ค่าที่ต้องเปลี่ยน:**

```env
# สร้าง password ที่ปลอดภัย
POSTGRES_PASSWORD=สร้าง_password_ที่ยาว_และ_ซับซ้อน

# สร้าง AUTH_SECRET
# รันคำสั่งนี้แล้วคัดลอกผลลัพธ์
openssl rand -base64 64

AUTH_SECRET=ค่าที่ได้จากคำสั่งด้านบน

```

### ขั้นตอนที่ 5: ขอ SSL Certificate (ครั้งแรก)

```bash
cd /opt/crm-bank

# สร้าง directories
mkdir -p nginx/ssl nginx/logs nginx/conf.d

# สำรองไฟล์ config หลักออกไปก่อน (เพราะมันต้องการ SSL cert ถึงจะรันผ่าน)
mv nginx/conf.d/default.conf nginx/conf.d/default.conf.bak

# สร้าง temp config สำหรับ ACME challenge
cat > nginx/conf.d/temp.conf << 'EOF'
server {
    listen 80;
    server_name csone.cropsciences.co.th www.csone.cropsciences.co.th;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 200 'SSL verification in progress...';
        add_header Content-Type text/plain;
    }
}
EOF

# Start nginx (ต้องระบุ --env-file เพราะ docker-compose.yml มีการอ้างอิง variables)
docker compose --env-file .env.production up -d --no-deps nginx

# ขอ certificate (ต้องระบุ --no-deps และ --entrypoint)
docker compose --env-file .env.production run --rm --no-deps --entrypoint certbot certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email atthapol@intercrop.co.th \
    --agree-tos \
    --no-eff-email \
    -d csone.cropsciences.co.th \
    -d www.csone.cropsciences.co.th

# ลบ temp config และนำ full config กลับมา
rm nginx/conf.d/temp.conf
mv nginx/conf.d/default.conf.bak nginx/conf.d/default.conf

# Restart nginx เพื่อเตรียมรันจริง
docker compose --env-file .env.production down
```

### ขั้นตอนที่ 6: Build และ Deploy

```bash
cd /opt/crm-bank

# Build images
docker compose --env-file .env.production build

# Start ทุก services
docker compose --env-file .env.production up -d

> [!TIP]
> หากเจอ error `ERR_PNPM_OUTDATED_LOCKFILE`:
> 1. รัน `pnpm install` บนเครื่อง Local เพื่ออัปเดต `pnpm-lock.yaml` แล้ว commit/push ใหม่
> 2. หรือแก้ไข `Dockerfile` ชั่วคราวโดยเปลี่ยนเป็น `RUN pnpm install --no-frozen-lockfile`

# ตรวจสอบ logs
docker compose logs -f

# รอให้ทุก service พร้อม (~60 วินาที)
sleep 60

# Run database migrations (ใช้ profile migrate เพื่อความปลอดภัยและแยกส่วน)
docker compose --env-file .env.production --profile migrate up migrate

# (Optional) Seed ข้อมูลเริ่มต้น
docker compose --env-file .env.production --profile seed up seed
```

### ขั้นตอนที่ 7: ตรวจสอบการทำงาน

```bash
# ตรวจสอบ container status
docker compose --env-file .env.production ps

# ตรวจสอบ health check
curl http://localhost:3000/api/health

# ตรวจสอบจาก internet
curl https://csone.cropsciences.co.th/api/health

# ดู resource usage
docker stats

# ดู logs
docker compose --env-file .env.production logs -f app
```

---

## 🔄 การอัปเดตระบบ (Zero-Downtime)

```bash
cd /opt/crm-bank

# ดึง code ใหม่
git pull origin main

# รัน update script
chmod +x scripts/update.sh
./scripts/update.sh
```

**หรือทำ manual:**

```bash
# Backup database ก่อน
./scripts/backup-db.sh

# Build image ใหม่
docker compose --env-file .env.production build app

# Update container (rolling update)
docker compose --env-file .env.production up -d --no-deps app

# Run migrations
docker compose --env-file .env.production --profile migrate up migrate
```

---

## 💾 การ Backup ฐานข้อมูล

### Backup Manual

```bash
cd /opt/crm-bank
chmod +x scripts/backup-db.sh
./scripts/backup-db.sh
```

### Setup Automatic Backup (Cron)

```bash
# เปิด crontab
crontab -e

# เพิ่มบรรทัดนี้ (backup ทุกวันตอน 02:00)
0 2 * * * /opt/crm-bank/scripts/backup-db.sh >> /var/log/crm-backup.log 2>&1
```

### Restore Database

```bash
cd /opt/crm-bank
chmod +x scripts/restore-db.sh
./scripts/restore-db.sh backups/crm_bank_backup_20260122_020000.sql.gz
```

---

## 📊 Monitoring & Logging

### ดู Logs

```bash
# ดู logs ทั้งหมด
docker compose --env-file .env.production logs -f

# ดู logs เฉพาะ service
docker compose --env-file .env.production logs -f app
docker compose --env-file .env.production logs -f postgres
docker compose --env-file .env.production logs -f nginx

# ดู logs ย้อนหลัง 100 บรรทัด
docker compose --env-file .env.production logs --tail=100 app
```

### ตรวจสอบ Resources

```bash
# Real-time stats
docker stats

# Disk usage
docker system df

# Clean unused resources
docker system prune -f
```

### Nginx Logs

```bash
# Access logs
tail -f nginx/logs/access.log

# Error logs
tail -f nginx/logs/error.log
```

---

## 🛡️ Security Checklist

- [x] ใช้ non-root user ใน container
- [x] ไม่ expose database port สู่ภายนอก
- [x] ใช้ environment variables สำหรับ secrets
- [x] ตั้งค่า UFW firewall
- [x] ใช้ HTTPS (Let's Encrypt)
- [x] Rate limiting สำหรับ API
- [x] Security headers ใน Nginx
- [x] Health check endpoints

### เพิ่มเติมที่แนะนำ:

```bash
# ปิด password authentication สำหรับ SSH
sudo nano /etc/ssh/sshd_config
# เปลี่ยน: PasswordAuthentication no

# ติดตั้ง fail2ban
sudo apt install fail2ban
sudo systemctl enable fail2ban
```

---

## 📈 คำแนะนำสำหรับ Scaling ในอนาคต

### 1. Horizontal Scaling (เพิ่ม Replicas)

```yaml
# แก้ไข docker-compose.yml
services:
  app:
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: "0.5"
          memory: 512M
```

### 2. Database Scaling

- พิจารณาใช้ **Read Replicas** สำหรับ query-heavy workloads
- ใช้ **Connection Pooling** (เช่น PgBouncer)
- ย้ายไปใช้ **Managed Database** (เช่น AWS RDS, DigitalOcean Managed DB)

### 3. Caching Layer

```bash
# เพิ่ม Redis สำหรับ caching
# แก้ไข docker-compose.yml เพิ่ม redis service
```

### 4. CDN

- ใช้ **Cloudflare** หรือ **AWS CloudFront** สำหรับ static assets
- ตั้งค่า DNS ให้ชี้ผ่าน CDN

### 5. Load Balancer

- สำหรับ High Availability ให้ใช้ **HAProxy** หรือ **Cloud Load Balancer**
- ตั้งค่า health check และ failover

---

## ❓ Troubleshooting

### Container ไม่ start

```bash
# ดู logs
docker compose --env-file .env.production logs app

# ตรวจสอบ env
docker compose --env-file .env.production config
```

### Database Connection Error

```bash
# ตรวจสอบ postgres
docker compose --env-file .env.production exec postgres pg_isready

# ตรวจสอบ connection string
docker compose --env-file .env.production exec app printenv DATABASE_URL
```

### SSL Certificate Error

```bash
# ตรวจสอบ certificate
docker compose --env-file .env.production run --rm certbot certificates

# Force renew
docker compose --env-file .env.production run --rm certbot renew --force-renewal
```

### Port 80/443 Already in Use

หากเจอ Runtime Error: `failed to bind host port 0.0.0.0:80/tcp: address already in use`

1. ตรวจสอบว่ามี process อะไรใช้งานอยู่:
   ```bash
   sudo lsof -i :80
   # หรือ
   sudo ss -lptn 'sport = :80'
   ```
2. หากเป็น `nginx` หรือ `apache2` ที่รันบน host ให้หยุดและปิดการใช้งาน:
   ```bash
   sudo systemctl stop nginx
   sudo systemctl disable nginx
   # หรือ
   sudo systemctl stop apache2
   sudo systemctl disable apache2
   ```
3. ลองรันคำสั่ง Docker อีกครั้ง

---

## 📞 Contact & Support

หากพบปัญหาหรือต้องการความช่วยเหลือ:

- **Email**: admin@cropsciences.co.th
- **Documentation**: `/docs` folder
