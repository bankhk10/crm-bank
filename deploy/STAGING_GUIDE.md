# CRM-Bank Staging Deployment Guide (คู่มือระบบทดสอบ)

> **Domain ทดสอบ:** `https://test-csone.cropsciences.co.th`  
> **Domain Production:** `https://csone.cropsciences.co.th`  
> **Server Environment:** Single VPS (Ubuntu) — แยก App, Database และ Storage โดยสมบูรณ์

---

## 1. ภาพรวมสถาปัตยกรรมระบบ (Architecture Overview)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                     VPS (Ubuntu)                                       │
│                                                                                        │
│   [Domain: csone.cropsciences.co.th]          [Domain: test-csone.cropsciences.co.th]  │
│                   │                                            │                       │
│                   └──────────────────┬─────────────────────────┘                       │
│                                      ▼                                                 │
│                     ┌─────────────────────────────────┐                                │
│                     │   crm-nginx (Port 80, 443 + SSL)│ (Shared Edge Reverse Proxy)   │
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
│               Uploads: /uploads (Host)  │ Uploads: /uploads (Proxy to crm-app-staging) │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### สรุปหลักการของ Architecture:

1. **Shared Edge Reverse Proxy (`crm-nginx`):**  
   ใช้ Nginx Container เดียวรับทราฟฟิกพอร์ต 80/443 และ SSL Certificates ของทั้งสองโดเมน โดยแยกการส่งต่อ (Routing) ตาม Domain Name
   - `csone.cropsciences.co.th` $\rightarrow$ `http://nextjs_app` (Container: `crm-app`)
   - `test-csone.cropsciences.co.th` $\rightarrow$ `http://crm-app-staging:3000` via `$staging_upstream` (Container: `crm-app-staging`)
2. **Decoupled Upload Storage (การจัดการรูปภาพ):**
   - **Production:** จัดการผ่าน Storage ของ Production (`/home/bank/crm-data/uploads`)
   - **Staging:** ส่งคำขอ `/uploads/*` ตรงไปยัง `$staging_upstream` (`crm-app-staging`) ซึ่ง Mount โฟลเดอร์ `/home/bank/crm-data-staging/uploads` $\rightarrow$ `/app/public/uploads` ไว้อยู่แล้ว **โดย `crm-nginx` ไม่ต้อง Mount Storage ของ Staging เข้าไป**
3. **Source of Truth ของ Nginx Configuration:**
   - **Staging Source of Truth ใน Git:** `/opt/crm-bank-staging/nginx/conf.d/staging.conf`
   - **Active Runtime File ที่ `crm-nginx` ใช้งานจริง:** `/opt/crm-bank/nginx/conf.d/staging.conf`

---

## 2. ขั้นตอนการ Deploy มาตรฐาน (Standard Deployment Workflow)

ในการ Deploy โค้ดใหม่มายัง Staging ในสภาวะปกติ ให้รันคำสั่งมาตรฐานนี้:

```bash
# 1. SSH เข้า VPS และเข้าโฟลเดอร์ Staging
ssh user@your-vps-ip
cd /opt/crm-bank-staging

# 2. ตรวจสอบสถานะและดึงโค้ดล่าสุดจาก Branch Test
git status
git pull origin Test

# 3. รันคำสั่ง Deploy อัตโนมัติ (ปลอดภัย 100% มีระบบ Safety Checks)
bash scripts/deploy-staging.sh
```

> [!TIP]
> **ไม่ต้อง copy ไฟล์ `staging.conf` หรือ reload Nginx ด้วยตนเอง:**  
> คำสั่ง `bash scripts/deploy-staging.sh` จะทำการ Build App, Backup Config, Sync Nginx Config, รัน Safety Checks 4 ด่าน และ Reload Nginx แบบ 0-Downtime ให้ครบถ้วนโดยอัตโนมัติ

---

## 3. สิ่งที่ `scripts/deploy-staging.sh` จัดการให้อัตโนมัติ

เมื่อสั่งรัน `bash scripts/deploy-staging.sh` ระบบจะทำงานตามลำดับ 8 ขั้นตอน:

1. **Pre-flight Environment & Strict Branch Check:**  
   ตรวจสอบไฟล์ `.env.staging`, ตรวจสอบว่า `crm-nginx` ทำงานอยู่ และยืนยันว่ากำลังทำงานอยู่บน **Branch `Test`** เท่านั้น (หากเป็น Branch อื่นจะหยุดทำงานทันที)
2. **Build & Deploy Service `app-staging`:**  
   สั่ง `docker compose ... up -d --build app-staging` เพื่อสร้างและเปิด Container `crm-app-staging` โดยไม่แตะต้อง Service อื่น
3. **Backup Active Staging Nginx Configuration:**  
   สร้างไฟล์ Backup ของ `staging.conf` เดิมเก็บไว้ที่ `/opt/crm-bank/nginx/conf.d/.backup/staging.conf.<timestamp>` (เก็บประวัติย้อนหลัง 10 ไฟล์ล่าสุด)
4. **Sync Staging Nginx Config:**  
   คัดลอกไฟล์ `nginx/conf.d/staging.conf` จาก Staging repository ไปยัง `/opt/crm-bank/nginx/conf.d/staging.conf`
5. **Nginx Syntax Validation (`nginx -t`):**  
   รัน `docker exec crm-nginx nginx -t` หากมีข้อผิดพลาดจะทำ Auto-Rollback ทันที
6. **Pre-flight Safety Checks (4 ด่านตรวจความปลอดภัย):**
   - **Safety Check 1:** ตรวจสอบว่า Production HTTPS (`csone`) ชี้ไปยัง Production upstream (`http://nextjs_app`) และไม่มี Staging targets ปะปน
   - **Safety Check 2:** ตรวจสอบว่า Staging HTTPS (`test-csone`) ชี้ไปยัง `$staging_upstream` (`http://crm-app-staging:3000`)
   - **Safety Check 3:** ตรวจสอบว่า Staging `/uploads/` ใช้ `proxy_pass $staging_upstream;` และไม่มี `alias`
   - **Safety Check 4 (Cross-Routing Isolation):** ยืนยันสองทิศทางว่า Production ไม่ Route ไป Staging และ Staging ไม่ Route ไป Production
7. **Safe Nginx Reload (0 Downtime):**  
   สั่ง `docker exec crm-nginx nginx -s reload` (ส่งสัญญาณ SIGHUP ปรับคอนฟิกโดยไม่ตัด Connection)
8. **Health Check & Summary:**  
   ทดสอบการเชื่อมต่อ Endpoint `/api/health` และสรุปผลการ Deploy

---

## 4. สถาปัตยกรรม Storage และการ Upload รูปภาพ (Storage Architecture)

การแยกส่วนการจัดเก็บไฟล์รูปภาพระหว่าง Production และ Staging:

```
[ผู้ใช้เรียกดูรูปภาพ: https://test-csone.cropsciences.co.th/uploads/activity-plans/.../image.jpg]
                                      │
                                      ▼
                      ┌─────────────────────────────────┐
                      │    crm-nginx (Shared Proxy)     │
                      │  location /uploads/ {           │
                      │    proxy_pass $staging_upstream;│
                      │  }                              │
                      └───────────────┬─────────────────┘
                                      │
                                      ▼
                      ┌─────────────────────────────────┐
                      │     crm-app-staging (Port 3000) │
                      │  (Next.js Standalone Runtime)   │
                      │  Internal: /app/public/uploads  │
                      └───────────────┬─────────────────┘
                                      │ (Docker Volume Mount: rw)
                                      ▼
                      ┌─────────────────────────────────┐
                      │            VPS Host             │
                      │ /home/bank/crm-data-staging/    │
                      │ uploads/activity-plans/...      │
                      └─────────────────────────────────┘
```

| รายการ             | Production                         | Staging                                   |
| :----------------- | :--------------------------------- | :---------------------------------------- |
| **Host Directory** | `/home/bank/crm-data/uploads`      | `/home/bank/crm-data-staging/uploads`     |
| **App Mount**      | `/app/public/uploads` (`crm-app`)  | `/app/public/uploads` (`crm-app-staging`) |
| **Nginx Mount**    | `/usr/share/nginx/uploads:ro`      | **ไม่มี Mount (Decoupled)**               |
| **Nginx Route**    | `alias /usr/share/nginx/uploads/;` | `proxy_pass $staging_upstream;`           |

---

## 5. การตรวจสอบการแสดงผลรูปภาพ (Image Upload Verification)

หลัง Deploy สำเร็จ ให้ตรวจสอบว่าระบบ Upload และแสดงผลรูปภาพทำงานได้ถูกต้องสมบูรณ์:

### 1. ตรวจสอบไฟล์รูปภาพที่มีอยู่จริงใน Storage ของ Staging:

```bash
find /home/bank/crm-data-staging/uploads/activity-plans \
  -type f -printf '%TY-%Tm-%Td %TH:%TM:%TS %p\n' | sort -r | head -10
```

### 2. นำ Path รูปภาพที่มีอยู่จริงไปทดสอบ HTTP Status:

```bash
# ตัวอย่าง: ทดสอบรูปภาพที่เพิ่ง Upload
curl -I https://test-csone.cropsciences.co.th/uploads/activity-plans/<planId>/<itemId>/<category>/<filename>.jpg
```

**ผลลัพธ์ที่ถูกต้อง (Expected Result):**

```text
HTTP/2 200
content-type: image/jpeg (หรือ image/png)
cache-control: public, max-age=3600, must-revalidate
```

> [!NOTE]
> **ข้อควรระวังเรื่อง HTTP 404:**  
> หากเข้าหน้า Detail แล้วพบ Broken Image หรือได้ HTTP 404 ให้ตรวจสอบก่อนว่ามีไฟล์รูปนั้นอยู่ในโฟลเดอร์ `/home/bank/crm-data-staging/uploads/` หรือไม่ หากเป็น URL ของรูปเก่าที่เคยสร้างไว้ก่อนติดตั้งระบบ Storage จะได้ 404 ซึ่งไม่ใช่ความผิดพลาดของ Nginx ให้ทดลอง **Upload รูปภาพใหม่ 1 รูป** เพื่อทดสอบ Flow ปัจจุบัน

---

## 6. คำสั่งตรวจสอบ Routing ใน Nginx (Routing Verification)

รันคำสั่งนี้บน VPS เพื่อดูภาพรวม Routing ของทั้ง 2 โดเมนที่กำลังทำงานจริง:

```bash
docker exec crm-nginx nginx -T 2>&1 | grep -n -E \
"server_name csone.cropsciences|server_name test-csone.cropsciences|proxy_pass|staging_upstream"
```

**ผลลัพธ์ที่ถูกต้อง (Expected Output):**

```text
# Production:
server_name csone.cropsciences.co.th www.csone.cropsciences.co.th;
proxy_pass http://nextjs_app;

# Staging:
server_name test-csone.cropsciences.co.th;
set $staging_upstream http://crm-app-staging:3000;
proxy_pass $staging_upstream;
```

---

## 7. รายการตรวจสอบหลังการ Deploy (Post-Deployment Checklist)

หลังรัน `bash scripts/deploy-staging.sh` สำเร็จ ให้ตรวจสอบตามเช็กลิสต์ต่อไปนี้:

- [ ] **Staging App Status:** `crm-app-staging` มีสถานะ `Up (healthy)` (`docker ps`)
- [ ] **Production Unaffected:** `crm-app` (Production) ทำงานต่อเนื่องและไม่มีการ Restart
- [ ] **Staging Domain:** เข้าใช้งาน `https://test-csone.cropsciences.co.th` ได้ปกติ
- [ ] **Production Domain:** เข้าใช้งาน `https://csone.cropsciences.co.th` ได้ปกติ
- [ ] **Upload Functionality:** สามารถ Upload รูปภาพใน Activity Plan ใหม่ได้สำเร็จ
- [ ] **Detail View Rendering:** รูปภาพแสดงผลในหน้า Detail คมชัด ไม่มี Broken Icon
- [ ] **Image HTTP 200:** รัน `curl -I` บน URL รูปภาพจริงได้ `HTTP/2 200` พร้อม `content-type: image/*`
- [ ] **Storage Isolation:** ไฟล์ใน `/home/bank/crm-data/uploads` (Production) ไม่มีการเปลี่ยนแปลง

---

## 8. ข้อห้ามสำคัญในการ Deploy ปกติ (Strict Safety Rules)

เพื่อความปลอดภัยสูงสุดของระบบ Production **ห้ามทำสิ่งต่อไปนี้ในกระบวนการ Deploy ปกติ:**

- ❌ **ห้ามรัน `docker compose down`** บนเครื่อง VPS
- ❌ **ห้าม Restart หรือ Recreate `crm-nginx`** (ใช้เฉพาะ `nginx -s reload` ผ่าน Script)
- ❌ **ห้าม Rebuild หรือ Restart `crm-app`** (Production Application)
- ❌ **ห้าม Restart `crm-postgres`** (Production Database)
- ❌ **ห้ามรัน Migration หรือแก้ไข Database ของ Production**
- ❌ **ห้ามคัดลอกไฟล์จาก Production Uploads มาทับ Staging โดยไม่ตั้งใจ**
- ❌ **ห้ามแก้ไขไฟล์ `/opt/crm-bank/nginx/conf.d/staging.conf` ด้วยมือโดยตรง** (ให้แก้ผ่าน Git Repository ใน `nginx/conf.d/staging.conf` เสมอ)

---

## 9. การจัดการกรณีฉุกเฉินและกู้คืนระบบ (Emergency & Manual Recovery)

### 9.1 การกู้คืน Nginx Config เดิมทันที (Emergency Rollback)

หากพบปัญหา Nginx Config หลังการ Deploy สามารถกู้คืนไฟล์ Backup ล่าสุดได้ทันที:

```bash
# 1. นำไฟล์ Backup ล่าสุดกลับมาแทนที่
LATEST_BACKUP=$(ls -t /opt/crm-bank/nginx/conf.d/.backup/staging.conf.* | head -1)
cp "$LATEST_BACKUP" /opt/crm-bank/nginx/conf.d/staging.conf

# 2. ตรวจสอบ Syntax และ Reload
docker exec crm-nginx nginx -t
docker exec crm-nginx nginx -s reload
```

### 9.2 การ Deploy และตรวจสอบทีละขั้นตอนด้วยตนเอง (Manual Debugging Flow)

ใช้เฉพาะกรณีที่ต้องการดีบักอย่างละเอียด:

```bash
cd /opt/crm-bank-staging

# 1. Build เฉพาะ app-staging
docker compose \
  -f deploy/app/docker-compose.staging.yml \
  --env-file deploy/.env.staging \
  up -d --build app-staging

# 2. สำรองข้อมูล Config เดิม
mkdir -p /opt/crm-bank/nginx/conf.d/.backup
cp /opt/crm-bank/nginx/conf.d/staging.conf /opt/crm-bank/nginx/conf.d/.backup/staging.conf.$(date +"%Y%m%d_%H%M%S") 2>/dev/null || true

# 3. ซิงค์ Config จาก Repository
cp /opt/crm-bank-staging/nginx/conf.d/staging.conf /opt/crm-bank/nginx/conf.d/staging.conf

# 4. ทดสอบ Syntax
docker exec crm-nginx nginx -t

# 5. Reload Nginx
docker exec crm-nginx nginx -s reload
```

---

## 10. การ Sync ข้อมูลจริงจาก Production มายัง Staging (Data & Uploads Sync)

เมื่อต้องการอัปเดตข้อมูลใน Staging ให้เป็นปัจจุบันเหมือน Production:

### วิธีรันคำสั่งผ่าน VPS โดยตรง:

```bash
# 1. Dump ข้อมูลจาก Production และ Restore เข้า Staging ในคำสั่งเดียว
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

---

## 11. การเชื่อมต่อ Database Staging ผ่าน Navicat / DBeaver (SSH Tunnel)

- **แท็บ General:**
  - **Host:** `127.0.0.1`
  - **Port:** `5433` _(Staging ใช้ Port 5433 เพื่อไม่ให้ชนกับ 5432 ของ Production)_
  - **Initial Database:** `crm_staging`
  - **User Name:** `crm_staging_admin`
  - **Password:** _(รหัสผ่านใน `.env.staging`)_

- **แท็บ SSH:**
  - ☑️ **Use SSH Tunnel**
  - **Host:** `IP_VPS_ของคุณ`
  - **Port:** `22`
  - **User Name:** `bank` _(หรือ user ที่ใช้ SSH)_
  - **Authentication Method:** `Password` หรือ `Private Key`

## 12. สรุป คำสั่ง

cd /opt/crm-bank-staging
git status
git pull origin Test
bash scripts/deploy-staging.sh
