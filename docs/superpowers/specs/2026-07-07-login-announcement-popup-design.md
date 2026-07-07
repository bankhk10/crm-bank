# Login Announcement Popup – Design Spec

**Date:** 2026-07-07
**Status:** Approved

## Overview

เพิ่มระบบ Popup ประกาศ (Announcement Popup) ที่แสดงหลัง login สำเร็จบนหน้า Dashboard
Admin สามารถอัปโหลดรูปภาพ กำหนด Role ที่จะเห็น และเรียงลำดับการแสดง
Popup จะแสดงทีละรูปแบบ Slideshow โดยกด OK/ปิดเพื่อดูรูปถัดไป

## Goals

- Admin สามารถจัดการ (เพิ่ม/ลบ/เรียงลำดับ/เปิดปิด) popup images ผ่าน Admin UI
- กำหนดได้ว่า popup แต่ละรูปแสดงกับ Role ใดบ้าง
- Popup แสดงหลัง login สำเร็จ ทุกครั้งที่ login (ไม่มีการจดจำ "seen")
- แสดงทีละรูปแบบ Slideshow: กด OK/ปิด → รูปถัดไป → จนครบ
- ใส่รูปกี่รูปก็ได้ (0 รูป = ไม่แสดง popup)

## Non-Goals

- ไม่มีระบบ "อ่านแล้ว" หรือ "ไม่แสดงอีก" (แสดงทุกครั้ง)
- ไม่รองรับ video หรือ content แบบ rich text (รูปภาพอย่างเดียว)
- ไม่มี countdown timer

## Architecture

### Database Model

```prisma
model LoginAnnouncement {
  id        String   @id @default(cuid())
  imageUrl  String                        // relative path จาก /uploads/
  title     String?                       // ชื่อสั้นๆ สำหรับแสดงใน Admin UI
  roles     String[]                      // role slugs ที่จะเห็น popup นี้
  sortOrder Int      @default(0)          // ลำดับการแสดง (น้อย = แสดงก่อน)
  isActive  Boolean  @default(true)       // เปิด/ปิดการแสดง
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?                     // soft delete
}
```

### Module Structure

```
modules/login-announcements/
├── infrastructure/
│   └── login-announcement.repository.ts    # Pure DB queries
├── application/
│   └── index.ts                            # Use cases (CRUD, reorder)
├── server/
│   └── actions.ts                          # Server Actions ("use server")
├── features/
│   ├── admin/
│   │   ├── login-announcement-list.tsx     # Admin list + manage UI
│   │   └── login-announcement-form.tsx     # Form เพิ่ม/แก้ไข popup
│   └── popup/
│       └── login-announcement-popup.tsx    # Client popup component
└── index.ts                                # Module exports
```

### File Upload

ใช้ระบบ upload เดิมที่มีอยู่แล้วใน `/app/api/upload/` และเก็บไฟล์ใน `/public/uploads/`

### Popup Flow

1. `DashboardShell` (client component) โหลด announcements ที่ match กับ roles ของ user ผ่าน server action
2. เก็บ list ไว้ใน state `[currentIndex, announcements]`
3. แสดง Modal overlay ที่ `currentIndex`
4. กด OK/ปิด → `currentIndex + 1`
5. ครบทุกรูป → ปิด Modal

### Admin Page

Route: `/admin/login-announcements` (ใต้ existing `/admin` area)
เฉพาะ users ที่มี role `admin`

Features:
- ตาราง list แสดงรายการ popup (sortOrder, thumbnail, roles, isActive)
- ปุ่ม เพิ่ม/แก้ไข → Dialog/Modal form
- ปุ่ม เปิด/ปิด toggle (isActive)
- ปุ่ม ลบ (soft delete)
- ปุ่ม ขึ้น/ลง เพื่อเรียง sortOrder

## Data Flow

```
Admin UI → Server Action (auth + permission check) → Use Case → Repository → DB
Dashboard → Server Action (auth) → Use Case → Repository → filtered by user roles
```

## Permission

ใช้ role slug โดยตรง ไม่ต้องสร้าง permission ใหม่ใน RBAC
ตรวจสอบว่า user มี role `admin` ก่อนเข้าหน้า admin page (via `auth()`)

## Constraints

- Mobile-first UI ด้วย Tailwind CSS
- Soft delete (`deletedAt`) สำหรับทุก delete operation
- Server Actions ต้องตรวจ auth ก่อนทุกครั้ง
- kebab-case สำหรับชื่อไฟล์
