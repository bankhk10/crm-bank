# Auth Module

โมดูลสำหรับการจัดการ Authentication และ Authorization ภายในระบบ CRM โดยใช้ [NextAuth.js v5 (Beta)](https://authjs.dev/)

## โครงสร้างโมดูล

```text
modules/auth/
├── application/          # Business logic เช่น ระบบ Force Logout
├── features/             # UI Components (Login, Register)
├── infrastructure/       # การตั้งค่า NextAuth และ Logging
├── server/               # Server Actions สำหรับการจัดการผู้ใช้
├── types/                # Type definitions และ Module augmentation
└── index.ts              # จุด Export หลักของโมดูล
```

## คุณสมบัติหลัก

### 1. การจัดการ Session
- **Access Token (Refresh Cycle):** ตั้งค่าไว้ที่ 1 ชั่วโมง (`updateAge: 1h`) เพื่อตรวจสอบสิทธิ์และดึงข้อมูล permissions ล่าสุด
- **Refresh Token (Max Age):** ตั้งค่าไว้ที่ 10 ชั่วโมง (`maxAge: 10h`) สำหรับอายุการใช้งานสูงสุดของ Session

### 2. Role-Based Access Control (RBAC)
- ระบบดึงข้อมูล Roles และ Permissions จาก Database มาเก็บไว้ใน JWT Token
- ใช้ `buildPermissionMap` เพื่อจัดการ Permission ทั้งแบบ Role และแบบ Override รายบุคคล

### 3. ระบบ Force Logout (Security)
- ระบบมีการใช้ `sessionVersion` เพื่อตรวจสอบความถูกต้องของ Session
- สามารถบังคับให้ผู้ใช้งานทุกคน Logout ได้ผ่านการอัปเดต `system@session.version` ใน Database

### 4. Authentication Logging
- บันทึกประวัติการ Login สำเร็จ/ล้มเหลว
- บันทึกข้อมูล IP Address และ User Agent เพื่อความปลอดภัย
- มีระบบป้องกันการ Brute Force เบื้องต้น (Login Blocking)

## การใช้งาน

### การดึงข้อมูล Session ใน Server Side
```typescript
import { auth } from "@/modules/auth";

const session = await auth();
if (session) {
  console.log(session.user.name);
}
```

### การใช้ใน Client Side
```typescript
"use client";
import { useSession } from "next-auth/react";

const { data: session } = useSession();
```

## การตั้งค่า Environment Variables
ตรวจสอบไฟล์ `.env` ว่ามีค่าเหล่านี้ครบถ้วน:
- `AUTH_SECRET`: คีย์สำหรับเข้ารหัส Token
- `AUTH_TRUST_HOST`: ตั้งเป็น `true` เมื่อใช้งานบน Production
