---
description: Create a new feature or module using a UI-First (Mock Data) approach, ensuring fast feedback and correct architecture.
---

# Create Feature (UI-First Approach)

Workflow สำหรับการสร้างฟีเจอร์ใหม่หรือ Module ใหม่ โดยเริ่มจากการทำ UI ให้เสร็จก่อน (ใช้ Mock Data) เพื่อให้เห็นภาพตรงกัน ก่อนที่จะไปลงลึกทำ Database และ Backend Logic

## ขั้นตอนการทำงาน (Step-by-Step)

### Step 1: ออกแบบและสร้าง UI ด้วย Mock Data (Features Layer)
- ให้ AI สร้างหน้าจอ UI ที่ผู้ใช้ต้องการใน `modules/[MODULE_NAME]/features/`
- **กฎสำคัญ:** ต้องเป็น Mobile-First UI 
- **กฎสำคัญ:** ใช้ **Mock Data (ข้อมูลสมมติ)** ไปก่อน ห้ามไปยุ่งกับ Prisma Schema หรือ Server Actions เด็ดขาด
- รอให้ผู้ใช้กดเล่นดูหน้าเว็บจนพอใจ และยืนยันว่า Flow ถูกต้อง (Fail Fast)

### Step 2: ออกแบบ Database (Infrastructure Layer)
- เมื่อ UI นิ่งแล้ว ให้ AI วิเคราะห์ว่า UI ชุดนี้ต้องใช้ฟิลด์ข้อมูลอะไรบ้าง (Data Shape)
- อัปเดต `prisma/schema.prisma` เพื่อสร้าง Table ที่รองรับ 
- **กฎสำคัญ:** ต้องมีระบบ Soft Delete (`deletedAt`) 
- รัน `npx prisma db push` (หรือสร้าง migration) ให้เรียบร้อย
- สร้างไฟล์ Repository ใน `modules/[MODULE_NAME]/infrastructure/` เพื่อเตรียม Query

### Step 3: สร้าง Logic และ API (Application & Server Layer)
- สร้าง Business Logic และ Zod Validations ใน `modules/[MODULE_NAME]/application/`
- สร้าง Server Actions ใน `modules/[MODULE_NAME]/server/actions.ts`
- **กฎสำคัญ:** Actions ต้องทำ 4 ขั้นตอน: Check Auth -> Check Permission -> Call Use Case -> RevalidatePath

### Step 4: เชื่อมต่อหน้าบ้านและหลังบ้าน (Integration)
- กลับไปที่ UI (Step 1) ลบ Mock Data ทิ้ง
- เปลี่ยนไปเรียกใช้ Server Actions (Step 3) เพื่อดึงและบันทึกข้อมูลจริง
- จัดการ Loading State และ Error Handling บนหน้า UI

## ประโยชน์ของ Workflow นี้
1. ป้องกัน AI สับสนจากการทำ Full-stack ใน Prompt เดียว
2. ลดการรื้อแก้ฐานข้อมูลหาก UX/UI ไม่ตอบโจทย์
3. ได้โค้ดที่ตรงตามมาตรฐาน Architecture ของโปรเจกต์ (crm-coding-standards) เสมอ
