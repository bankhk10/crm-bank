# Force Logout Implementation

## ภาพรวมระบบ

ได้ implement ระบบบังคับให้ผู้ใช้ทั้งหมด logout เมื่อเริ่มต้นโปรเจคหรือ deploy ใหม่แล้ว

## วิธีการทำงาน

### 1. Session Version System
- ใช้ session version ที่เก็บใน database เพื่อควบคุมการใช้งาน session
- ทุกครั้งที่มีการบังคับ logout จะอัปเดต session version
- JWT token จะเก็บ session version ไว้เพื่อตรวจสอบความถูกต้อง

### 2. Automatic Force Logout on Startup
- เมื่อ application เริ่มต้น จะเรียก `invalidateAllSessions()` โดยอัตโนมัติ
- ทำให้ session ทั้งหมดที่ยังคงอยู่กลายเป็น invalid
- ผู้ใช้จะถูกบังคับให้ login ใหม่ทั้งหมด

### 3. Session Validation
- ทุกครั้งที่มีการตรวจสอบ JWT token จะตรวจสอบ session version
- ถ้า version ไม่ตรงกัน จะถือว่า session หมดอายุและบังคับให้ logout

## ไฟล์ที่เพิ่ม/แก้ไข

### 1. `lib/force-logout.service.ts` (ใหม่)
- บริการหลักสำหรับจัดการการบังคับ logout
- `invalidateAllSessions()` - บังคับให้ session ทั้งหมดหมดอายุ
- `isSessionValid()` - ตรวจสอบความถูกต้องของ session
- `getSessionVersion()` - ดึง session version ปัจจุบัน

### 2. `lib/auth.ts` (แก้ไข)
- เพิ่ม session version ลงใน JWT token
- ตรวจสอบ session version ทุกครั้งที่มีการ refresh token
- ถ้า session invalid จะ return null เพื่อบังคับ logout

### 3. `lib/init-services.ts` (แก้ไข)
- เพิ่มการเรียก `invalidateAllSessions()` ตอนเริ่มต้น service
- ทำให้มีการบังคับ logout อัตโนมัติเมื่อ start server

### 4. `app/api/admin/force-logout/route.ts` (ใหม่)
- API endpoint สำหรับบังคับ logout จากภายนอก
- ใช้สำหรับ admin ที่ต้องการบังคับ logout แบบ manual

### 5. `scripts/test-force-logout.ts` (ใหม่)
- Script ทดสอบการทำงานของระบบ force logout
- ตรวจสอบว่า session version เปลี่ยนและ validation ทำงานถูกต้อง

## วิธีใช้งาน

### การทำงานอัตโนมัติ (เมื่อ start/deploy)
- เมื่อ start application จะบังคับให้ผู้ใช้ทั้งหมด logout โดยอัตโนมัติ
- ไม่ต้องทำอะไรเพิ่มเติม

### การบังคับ logout แบบ manual
```bash
# เรียก API endpoint (ถ้าต้องการ)
curl -X POST http://localhost:3000/api/admin/force-logout \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### การทดสอบ
```bash
# รัน script ทดสอบ (ต้องมี DATABASE_URL)
npx tsx scripts/test-force-logout.ts
```

## ผลลัพธ์

- ✅ ทุกครั้งที่ start/deploy application ผู้ใช้ทั้งหมดจะถูกบังคับให้ login ใหม่
- ✅ แก้ปัญหา "session expired or invalid. Please sign in again"
- ✅ มี API endpoint สำหรับบังคับ logout แบบ manual
- ✅ มี script ทดสอบการทำงาน

## หมายเหตุ

- ระบบใช้ User table ในการเก็บ session version ผ่าน field `updatedAt`
- ไม่กระทบกับข้อมูลผู้ใช้จริง ใช้เพียง system user พิเศษ
- การบังคับ logout จะมีผลกับ session ที่มีอยู่เท่านั้น ไม่ลบข้อมูลผู้ใช้
