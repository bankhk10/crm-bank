---
description: Create a new feature or module using the project's standard architecture with a UI-First (Mock Data) approach.
---

# Create Feature / Module — UI-First Workflow

ใช้ Workflow นี้เมื่อสร้าง **Feature ใหม่** หรือ **Module ใหม่** ในโปรเจกต์

เป้าหมายคือ:

- ใช้ UI-First เพื่อให้ผู้ใช้เห็นและยืนยัน UX/UI ก่อน
- ใช้ Mock Data ก่อนเชื่อม Database
- ปฏิบัติตาม Module Architecture Contract
- Reuse Existing Pattern ก่อนสร้างสิ่งใหม่
- แยก UI, Application, Server และ Infrastructure อย่างถูกต้อง
- ไม่สร้าง Architecture ใหม่โดยไม่จำเป็น
- จัดการ Database Schema และ Prisma Migration อย่างถูกต้องและปลอดภัย
- ตรวจสอบงานอย่างสมบูรณ์ก่อนถือว่าเสร็จ

---

# ขั้นตอนการทำงาน

## Step 0: Understand the Requirement

ก่อนเริ่มเขียน Code ให้วิเคราะห์ Requirement ก่อน

ต้องระบุให้ชัดเจน:

- Module หรือ Feature ที่กำลังสร้าง
- เป้าหมายของ Feature
- User Flow
- Screen ที่ต้องมี
- ข้อมูลที่ UI ต้องแสดง
- ข้อมูลที่ User ต้องกรอก
- Action ที่ User สามารถทำได้
- Business Rules ที่ทราบแล้ว
- ขอบเขตของงาน

ห้ามเริ่มสร้าง Database หรือ Backend ทันที หากยังไม่เข้าใจ Requirement และ UI Flow

---

## Step 1: Inspect Existing Project Patterns

ก่อนสร้างไฟล์ใด ๆ MUST ตรวจสอบ Existing Pattern

ให้ตรวจสอบ:

1. `crm-coding-standards` Skill
2. `docs/ARCHITECTURE.md`
3. `docs/MODULE_ARCHITECTURE.md` ถ้ามี
4. โครงสร้างของ Target Module
5. Similar Modules
6. Similar Features
7. Shared Components
8. Existing Hooks
9. Existing Server Actions
10. Existing Application Logic
11. Existing Repository Patterns

ค้นหา implementation ที่มีพฤติกรรมใกล้เคียงกับ Requirement

หลักการ:

> Reuse Existing Pattern First

ห้ามสร้าง Pattern ใหม่ หาก Pattern ที่มีอยู่สามารถรองรับ Requirement ได้

ห้ามเลือก Pattern จากโปรเจกต์อื่นมาใช้เพียงเพราะเป็น Pattern ที่นิยม

หาก Existing Pattern ไม่สามารถรองรับ Requirement ได้ ให้ระบุเหตุผลก่อนสร้าง Pattern ใหม่

---

## Step 2: Define Module Structure

ถ้าเป็นการสร้าง Module ใหม่ ให้ใช้:

`Module Architecture Contract`

เป็นมาตรฐานหลัก

โครงสร้างมาตรฐาน:

```text
modules/<module-name>/
├── application/
├── features/
├── infrastructure/
├── server/
├── types/
├── ui/
├── constants.ts
├── index.ts
└── README.md
```

สร้างเฉพาะโฟลเดอร์/ไฟล์ที่จำเป็นต้องใช้งานจริงเท่านั้น

---

## Step 3: Implement UI-First with Mock Data

สร้าง UI เพื่อให้ผู้ใช้สามารถทดสอบ interaction และยืนยันความต้องการได้ทันที:

1. สร้าง Types และ Interfaces ของ Feature ใน `types/index.ts`
2. สร้าง Mock Data จำลองสถานการณ์จริง
3. พัฒนาหน้าจอใน `features/` และ Components ใน `ui/`
4. ใช้ Mobile-First Responsive Design (Tailwind CSS)
5. เชื่อมต่อ Mock State สำหรับ Form Submission, Filters, Pagination และ Actions

---

## Step 4: Review and Confirm UI with User

นำเสนอหน้าจอ UI และ User Flow ให้ผู้ใช้ตรวจสอบ:

- ตรวจสอบความถูกต้องของ UX/UI และข้อมูลที่แสดงผล
- ยืนยัน Fields ใน Form และ Business Validation Rules
- ได้รับการยืนยัน (Confirmation) จากผู้ใช้ก่อนดำเนินการเชื่อมต่อ Backend/Database

---

## Step 5: Determine Data Persistence Requirement

เมื่อ UI ได้รับการยืนยันแล้ว ให้ตรวจสอบความต้องการด้านการจัดเก็บข้อมูล:

1. ตรวจสอบว่า Feature นี้ต้องมีการบันทึกข้อมูลลงฐานข้อมูล (Persistent Storage) หรือไม่
2. ตรวจสอบ `prisma/schema.prisma` เพื่อดู Model และ Fields ปัจจุบัน
3. ตรวจสอบประวัติ Migration ใน `prisma/migrations/`
4. ระบุสถานะให้ชัดเจน:
   - **Database Change Required: YES** (ต้องสร้างตาราง/คอลัมน์/ความสัมพันธ์ใหม่)
   - **Database Change Required: NO** (ใช้ตารางเดิมที่มีอยู่แล้ว หรือเป็น Pure UI/Client feature)

---

## Step 6: Database Schema & Migration Workflow (เมื่อ Database Change = YES)

หากต้องมีการเปลี่ยนแปลง Database Schema ให้ปฏิบัติตามกฎอย่างเคร่งครัด:

1. **แก้ไข Schema**: แก้ไข `prisma/schema.prisma` ให้ตรงตามโครงสร้างที่ออกแบบ
2. **สร้าง Migration**: สร้างไฟล์ Prisma Migration ด้วยคำสั่งมาตรฐาน (เช่น `prisma migrate dev --create-only` หรือ `prisma migrate diff`)
3. **ตรวจสอบ `migration.sql` อย่างละเอียด**:
   - ตรวจสอบว่ามีเฉพาะ Schema Change ของ Feature นี้เท่านั้น
   - ตรวจสอบว่าไม่มีคำสั่งทำลายข้อมูล (`DROP TABLE`, `DROP COLUMN`, `DROP TYPE`)
   - ตรวจสอบว่าไม่มีคำสั่งแก้ไขข้อมูลผิดปกติ (`INSERT`, `UPDATE`, `DELETE`)
4. **ตรวจสอบ Schema Drift / Unrelated Changes**:
   - หากพบว่า Migration ที่สร้างมี Schema Change ที่ไม่เกี่ยวข้องกับ Feature ปัจจุบันติดมาด้วย (เช่น Unmigrated fields จากงานอื่น) **ต้อง STOP ทันทีและรายงานให้ผู้ใช้ทราบ** ห้ามรวบ Migration อัตโนมัติ
5. **รายงานและขออนุมัติ**:
   - แสดงชื่อ Migration และสรุปคำสั่ง SQL ให้ผู้ใช้ตรวจสอบ
   - **ขออนุมัติจากผู้ใช้ก่อน Apply Migration สู่ฐานข้อมูลจริงเสมอ** (ห้ามรัน `prisma migrate deploy` โดยไม่ได้รับอนุญาต)

---

## Step 7: Backend & Infrastructure Implementation

เมื่อ Database Schema พร้อมแล้ว ให้ดำเนินการพัฒนา Backend ตาม Layer Responsibilities:

1. **Infrastructure Layer (`infrastructure/<module>.repository.ts`)**:
   - พัฒนา Repository function สำหรับ Query และ Mutate ข้อมูลผ่าน Prisma Client
2. **Application Layer (`application/`)**:
   - สร้าง Use Cases สำหรับ Business Logic และ Data Transformation
   - สร้าง Validation Schema (Zod) ใน `validations.ts`
3. **Server Layer (`server/actions.ts`)**:
   - พัฒนา Server Actions สำหรับรับ Request จาก UI
   - ตรวจสอบ Authentication และ RBAC Permissions
   - บันทึก Audit Log เมื่อมีการแก้ไขข้อมูลสำคัญ
   - Revalidate Next.js Cache / Path
4. **เชื่อมต่อ UI**:
   - เปลี่ยน `features/` จากการใช้ Mock Data มาเรียกใช้งาน Server Actions จริง

---

## Step 8: Final Validation Checklist

ก่อนส่งมอบงาน ให้ตรวจสอบความสมบูรณ์ครบถ้วนทุกข้อ:

1. [ ] **Schema Validity**: รัน `npx prisma validate` ผ่านสมบูรณ์
2. [ ] **Migration Exists**: มีไฟล์ Migration รองรับทุก Schema Change ใน `schema.prisma`
3. [ ] **Migration SQL Reviewed**: ตรวจสอบ `migration.sql` แล้วว่าถูกต้อง ปลอดภัย และตรง Scope
4. [ ] **Migration Status**: ตรวจสอบ `npx prisma migrate status` แสดงสถานะ Up to date
5. [ ] **Database Consistency**: โครงสร้างในฐานข้อมูลสอดคล้องกับ Schema 100%
6. [ ] **Architecture Compliance**: ปฏิบัติตาม Module Architecture Contract และ Layer Dependency Rules
7. [ ] **TypeScript Check**: รัน `pnpm tsc --noEmit` ผ่าน 0 errors
8. [ ] **Lint Check**: รัน ESLint ผ่าน 0 errors / 0 warnings
9. [ ] **Functional Testing**: ทดสอบการทำงานทั้ง Happy Path และ Error Cases
