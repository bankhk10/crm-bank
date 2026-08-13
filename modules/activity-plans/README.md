# คู่มือระบบการทำงานฟีเจอร์กิจกรรม (Trip Plan Feature Guide)

เอกสารนี้อธิบายสถาปัตยกรรม ฐานข้อมูล ลำดับขั้นตอนการอนุมัติ (Approval Flows) และการบูรณาการต่างๆ ของฟีเจอร์ "การทำกิจกรรม (Activity)" ในระบบ CRM

---

## 📂 โครงสร้างโมดูล (Module Architecture)

โมดูลนี้ถูกพัฒนาขึ้นภายใต้โฟลเดอร์ `modules/activity-plans/` ตามหลักการสถาปัตยกรรมแบบแยกชั้น (Layered Architecture):

```
modules/activity-plans/
├── application/                     # ชั้น Business Use Cases และ Flow Control
│   ├── activity-plan-flow.ts        # State Machine ควบคุม Flow ออนุมัติ 5 ขั้นตอน
│   ├── calendar-integration.ts      # ระบบจำลองการจดบันทึกปฏิทิน & Meet Link
│   ├── index.ts                     # Use Case Facade เข้าถึงภายนอก
│   └── validations.ts               # การตรวจสอบความถูกต้อง Zod Schemas
├── infrastructure/                  # ชั้นการติดต่อฐานข้อมูล (Data Access)
│   └── activity-plan.repository.ts  # Repository หลักสำหรับการเขียน/อ่านข้อมูลกิจกรรม
├── server/                          # ชั้น Server-Side Actions และสิทธิ์ RBAC
│   └── actions.ts                   # Next.js Server Actions รองรับความปลอดภัยฝั่ง UI
├── ui/                              # Shared UI Components ย่อย
│   └── activity-status-badge.tsx    # ป้ายสีแสดงสถานะกิจกรรมระดับพรีเมียม
├── features/                        # หน้าจอการทำงานหลัก (React Views)
│   ├── list-view/                   # หน้ารายการแผนงานและตารางข้อมูลของเซลส์
│   ├── form/                        # หน้าจอฟอร์ม บันทึก/แก้ไขข้อมูลหลัก
│   │   ├── activity-plan-form.tsx   # คอมโพเนนต์ฟอร์มหลัก (State Machine & Logic)
│   │   └── components/              # คอมโพเนนต์ย่อยแยกส่วนการทำงาน
│   │       ├── work-types/          # UI ฟอร์มจุดประสงค์งาน 11 รูปแบบ (เช่น Type1Visit: เข้าพบร้านค้า / Key Farmer)
│   │       ├── budget-section.tsx   # ส่วนการคำนวณงบประมาณ
│   │       ├── requisition-section.tsx # ส่วนระบุรายการขอเบิกสินค้า
│   │       └── location-team-section.tsx # ส่วนระบุสถานที่และค้นหาทีมงาน
│   ├── detail-view/                 # หน้ารายละเอียดกิจกรรม Timeline และปุ่มอนุมัติ (general)
│   └── approve-view/                # แดชบอร์ดตรวจสอบสำหรับหัวหน้างาน (Approval Inbox)
│       ├── activity-plan-approval-list-view.tsx  # รายการคิวอนุมัติแยกหมวดสำหรับหัวหน้างาน
│       └── activity-plan-approve-detail-view.tsx # หน้าอนุมัติรายการเดี่ยว (approve/reject/request-correction)
└── types/                           # นิยามประเภทข้อมูล TypeScript
    └── index.ts                     # โครงสร้างความสัมพันธ์ของข้อมูลย่อย
```

---

## 🗄️ โครงสร้างฐานข้อมูล (Database Schema)

ฟีเจอร์นี้สร้างตารางใหม่และเชื่อมโยงความสัมพันธ์ย้อนกลับ (Reverse Relations) โดยไม่กระทบโครงสร้างฐานข้อมูลเดิมที่มีอยู่ เพื่อรักษาเสถียรภาพของระบบ:

1.  **`ActivityPlan`:** ตารางเก็บหัวข้อแผนกิจกรรม (เลขที่แผน `code` รูปแบบ `TPYYMMXXXX` เช่น `TP26080001`, ชื่องาน, ประเภท, วันเวลาเริ่ม/จบ, งบประมาณที่ขอใช้, พื้นที่จัดงาน, และสถานะการอนุมัติ)
2.  **`ActivityHelper`:** ตารางเก็บรายชื่อและแผนกของพนักงานช่วยงานที่เชื่อมโยงกับกิจกรรม
3.  **`ActivityApprovalLog`:** ตารางเก็บประวัติความคืบหน้า รายละเอียดการกดอนุมัติ/ตีกลับ/ปฏิเสธ พร้อมความเห็นของผู้บริหารย้อนหลัง

### 🔢 การรันเลขที่แผนกิจกรรม (Plan Code Generation)
- **รูปแบบ:** `TPYYMMXXXX`
  - `TP` = Trip Plan Prefix
  - `YY` = ปี พ.ศ./ค.ศ. 2 หลัก (เช่น `26` สำหรับปี 2026)
  - `MM` = เดือน 2 หลัก (เช่น `08` สำหรับเดือนสิงหาคม)
  - `XXXX` = ลำดับแผนงานแบบ 4 หลัก (เช่น `0001`, `0002`)
- **การทำงาน:** สร้างเลขอัตโนมัติภายใน Database Transaction เมื่อมีการสร้าง `ActivityPlan` รายการใหม่

---

## 🔄 ลำดับขั้นตอนการอนุมัติ 5 ขั้นตอน (5-Step Approval Flow)

ระบบใช้ระบบควบคุมสถานะแบบ **State Machine** อัตโนมัติ:

1.  **บันทึกแผนงาน:**
    - สร้างร่างกิจกรรมเป็น `DRAFT` หรือ `WAITING_FOR_CORRECTION`
2.  **ตรวจสอบสายงาน (Line Approval):**
    - เมื่อกดส่ง ระบบจะวิ่งผ่านห่วงโซ่ผู้จัดการ `managerId` ของพนักงานไปทีละระดับเพื่อขออนุมัติ
    - สิ้นสุดที่พนักงานระดับ `position.level >= 3` หรือมีชื่อตำแหน่งเป็น **"ผู้จัดการแผนกบริหารงานขาย"** (Terminal Line Manager)
3.  **อนุมัติงบประมาณ (Budget Approval):**
    - ถ้างบส่งเสริมการขาย (`salesPromotionBudget` > 0) -> ส่งให้ ผจก.บริหารงานขาย อนุมัติ
    - ถ้างบการตลาด (`marketingBudget` > 0) -> ส่งให้ ผจก.แผนกการตลาด อนุมัติ
    - ถ้าขอทั้งคู่ -> ระบบจะเปิดช่องให้ผู้จัดการทั้งสองแผนกอนุมัติคู่ขนานพร้อมกัน
    - เมื่อผ่านการอนุมัติของแต่ละแผนกแล้ว -> ส่งต่อให้ **ผจก. ฝ่ายขาย (Sales Director)** อนุมัติงบประมาณทั้งหมดในภาพรวม
4.  **อนุมัติคนช่วยงาน (Helper Approval):**
    - ส่งคำขออนุญาตไปยังผู้จัดการแผนกของพนักงานช่วยงานแต่ละคน:
      - คนช่วยสังกัดฝ่ายขาย/ส่งเสริม -> ส่งหา ผจก.บริหารงานขาย
      - คนช่วยสังกัดการตลาด -> ส่งหา ผจก.การตลาด
5.  **อนุมัติเสร็จสิ้น:**
    - ระบบเปลี่ยนสถานะเป็น `APPROVED`
    - สร้างการนัดหมายปฏิทินและ Meet Link บันทึกลงตาราง `ApplicationLog`
    - ส่งข้อความแจ้งเตือนประเภท `APPROVED` ไปยังพนักงานผู้สร้าง และส่งรายละเอียดหน้าที่งานไปยังพนักงานช่วยงานทุกคน

---

## 🔔 การบูรณาการแจ้งเตือน (Notifications & Integrations)

- **Notification Engine:** มีการส่งข้อความแจ้งเตือนอัตโนมัติลงฐานข้อมูล (ตาราง `Notification`) ครอบคลุมการยื่นแผนงาน การเปลี่ยนผู้อนุมัติตามคิวงาน การส่งกลับแก้ไขชี้เป้าลิงก์ตรง และการปฏิเสธแผน
- **Calendar Sync Simulation:** เมื่ออนุมัติสำเร็จ จะสร้าง Event ปฏิทินและส่ง Audit Log ด้วยประเภทความรุนแรง `INFO` ลงตาราง `ApplicationLog` เพื่อเก็บข้อมูลประวัตินัดหมายการเดินทาง

---

## 🛠️ การแก้ไขปัญหาตอนรันระบบ (Troubleshooting)

### 1. Build/Dev Error: `Module not found: Can't resolve '@prisma/client-runtime-utils'`

- **สาเหตุ:** เกิดจากการไปอ้างอิง `import { ActivityStatus, ... } from "@prisma/client"` โดยตรงในฝั่ง Client Components (`"use client"`) ทำให้ Next.js/Turbopack พยายามทำการบันเดิล Prisma Client ฝั่งเบราว์เซอร์เข้ามา ซึ่งจะล้มเหลวเนื่องจากไม่มีโมดูล Node.js และ Runtime Utils
- **การแก้ไข:**
  - ทางระบบมีการนำเข้าและ Re-export Enums เหล่านี้ผ่านไฟล์ตัวกลาง **`lib/db.ts`**
  - การนำเข้าประเภท Enums ในฝั่ง UI และ Client Component ทั้งหมดจึงได้รับการแก้ไขให้ดึงมาจาก `@/lib/db` แทน เช่น `import { ActivityStatus } from "@/lib/db";` ซึ่งทำให้บันเดิลได้อย่างปลอดภัย 100%

---

## 📝 บันทึกการอัปเดตฟีเจอร์ (Feature Change Log)

### 2026-08-11: ดึงข้อมูลแปลงสาธิตจาก Database ใน Type 10 (จัดงาน Field Day)
- **คอมโพเนนต์ที่แก้ไข:** `type10-field-day.tsx`, `activity-plan-form.tsx`
- **รายละเอียด:**
  - ปรับการเลือกแปลงสาธิตให้ดึงข้อมูลจริงจาก Database ผ่าน Server Action `getDemoPlotsAction()` (รวมถึงแปลงที่ถูกสร้างจาก Type 7)
  - ใช้ `FormCombobox` รองรับการค้นหาชื่อแปลงสาธิตและเจ้าของแปลง
  - แสดงข้อความและหน่วยขนาดพื้นที่ / จำนวนต้น แบบไดนามิกตามหมวดพืช (เช่น หมวดพืชสวนแสดง "จำนวนต้น:" และหน่วย "ต้น", หมวดพืชไร่/ผักแสดง "ขนาดพื้นที่:" และหน่วย "ไร่") สอดคล้องกับหน้า Type 7

### 2026-08-13: เชื่อมต่อระบบบันทึกผลการปฏิบัติงาน (Trip Plan Actual) กับ Database (1 ต่อ 1 ตามแผนงาน)
- **คอมโพเนนต์ที่แก้ไข:** `activity-plan-actual-view.tsx`, `actions.ts`, `index.ts`, `activity-plan.repository.ts`
- **รายละเอียด:**
  - เพิ่ม Server Action `saveActivityPlanActualAction` และ repository function `saveActivityPlanActual` เพื่อบันทึกข้อมูลผลการปฏิบัติงานจริงลงใน `ActivityPlan.details.actualRecord`
  - ปรับ `ActivityPlanActualView` ให้ดึงเฉพาะประเภทกิจกรรมที่ถูกระบุไว้ในแผนงานมาแสดงให้กรอกแบบ 1 ต่อ 1 (Strict Filtering) โดยซ่อนกิจกรรมที่ไม่ได้ถูกเลือกไว้ในแผนงาน
  - แมปข้อมูลเป้าหมายย่อยและข้อมูลสรุปแผนงานจาก DB มาแสดงเปรียบเทียบในหน้าบันทึกผลการปฏิบัติงาน


