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
│   ├── detail-view/                 # หน้ารายละเอียดกิจกรรม Timeline และปุ่มอนุมัติ
│   └── approve-view/                # ศูนย์ตรวจสอบและอนุมัติ Trip Plan (Approval Hub & Queue)
│       ├── activity-plan-approval-list-view.tsx # หน้าจอหลักแดชบอร์ดคิวงานอนุมัติ
│       └── components/
│           ├── approval-action-dialog.tsx       # Dialog ยืนยันการอนุมัติ / ตีกลับแก้ไข / ปฏิเสธ
│           └── approval-detail-drawer.tsx       # Drawer สรุปรายละเอียดก่อนการอนุมัติ
└── types/                           # นิยามประเภทข้อมูล TypeScript
    └── index.ts                     # โครงสร้างความสัมพันธ์ของข้อมูลย่อย
```

---

## 🗄️ โครงสร้างฐานข้อมูล (Database Schema) — Analytics-Ready

ออกแบบใหม่ทั้งหมด (2026-08-13) เพื่อรองรับ Data Analytics Dashboard โดยตรง แทนที่ schema เดิม 3 ตาราง:

### GROUP 1: Master / Lookup
1. **`activity_types`:** ตาราง Master 11 ประเภทงาน (`TYPE_1`–`TYPE_11`) พร้อม `code`, `name`, `shortName`, `sortOrder` — ใช้ FK จาก `activity_plans.activity_type_id` ทำให้ Filter/Group ใน Dashboard ได้

### GROUP 2: Core Transaction
2. **`activity_plans`:** หัวเรื่องแผนงาน (ปรับปรุงจากเดิม) เพิ่ม:
   - **Fiscal Dimensions:** `fiscal_year`, `fiscal_month`, `fiscal_quarter`, `duration_days` — คำนวณอัตโนมัติจาก `start_date` ใน application layer
   - **Geo Fields:** `province`, `district` — เลือกจาก Dropdown แยกต่างหาก
   - **Budget Split:** `sales_promotion_budget_requested` / `marketing_budget_requested` (ขอ) vs `*_approved` (อนุมัติ) — Variance Analysis
   - **TAT Timestamps:** `submitted_at`, `approved_at`, `rejected_at`, `cancelled_at`
3. **`activity_plan_items`:** **Wide Table แทน `details Json?` เดิม** — คอลัมน์ flat สำหรับ 11 ประเภทงาน Query ได้โดยตรง (`SUM`, `GROUP BY`, `AVG`)
4. **`activity_helpers`:** ตารางพนักงานช่วยงาน เพิ่ม `department_name` (denormalized snapshot) และ `responded_at`

### GROUP 3: Workflow
5. **`activity_approval_logs`:** ประวัติการอนุมัติ เพิ่ม `from_status`, `to_status`, `step_duration_seconds` — TAT per step

### GROUP 4: Post-Activity Result (ใหม่)
6. **`activity_results`:** บันทึกผลหลังกิจกรรม (1:1 กับ `activity_plans`) — เก็บ `actual_start_date`, `actual_attendees_count`, งบที่ใช้จริง, KPI ตามประเภทงาน (ยอดขาย, ยอดเก็บเงิน, จำนวนแปลง, จำนวนผู้เข้าร่วม)

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

### 2026-08-14: เพิ่มหน้าจอศูนย์ตรวจสอบและอนุมัติกิจกรรม (Trip Plan Approval Hub & Queue)
- **คอมโพเนนต์ที่พัฒนา/ปรับปรุง:** `activity-plan-approval-list-view.tsx`, `approval-action-dialog.tsx`, `approval-detail-drawer.tsx`, `activity-plan.repository.ts`, `server/actions.ts`
- **Routing:** `/activity-plans/approvals` และเพิ่มเมนูใน Sidebar + ปุ่มทางลัดใน Toolbar
- **ฟีเจอร์เด่น:**
  - **KPI Summary Cards:** แสดงจำนวนคำขออนุมัติตามสายงาน (พร้อมตัวบ่งชี้เมื่อมีงานที่รอการตัดสินใจของคุณ), คิวงบประมาณ, คิวคนช่วยงาน, และประวัติการดำเนินการ
  - **Tabbed Filter Navigation:** กรองรายการ 5 แท็บ: คิวสายงานของฉัน (`my_line`), ทั้งหมดที่รออนุมัติ (`all`), งบประมาณ (`budget`), พนักงานช่วยงาน (`helper`), และประวัติ (`history`)
  - **Search & Activity Type Filter:** ค้นหาแผนงาน รหัส ผู้สร้าง และตัวกรองประเภทกิจกรรม (Lookup master)
  - **Dual View Mode:** สลับการแสดงผลแบบการ์ด (Card View - Mobile Friendly) และตาราง (Table View - Desktop Scan)
  - **Quick Action Modal Dialog:** ยืนยันการอนุมัติ / ตีกลับแก้ไข / ปฏิเสธ พร้อมช่องระบุหมายเหตุโดยไม่ต้องเปลี่ยนหน้า
  - **Quick Detail Inspection Drawer:** เปิดดูรายละเอียดเป้าหมาย งบประมาณ รายการสินค้า และประวัติ Timeline (Audit Logs) ได้ทันที

### 2026-08-13: Redesign Schema ใหม่ — Analytics-Ready
- **ขอบเขต:** ลบ schema เก่าทิ้งทั้งหมด ออกแบบใหม่ 6 ตารางเพื่อรองรับ Data Analytics Dashboard
- **Migration:** `20260813084645_redesign_activity_plans_analytics`
- **สิ่งสำคัญที่เปลี่ยน:**
  - แทน `details Json?` ด้วย `activity_plan_items` (Wide Table, 11 ประเภทงาน คอลัมน์ flat)
  - เพิ่ม Fiscal Dimensions: `fiscal_year`, `fiscal_month`, `fiscal_quarter`
  - เพิ่ม Geo Fields: `province`, `district` (dropdown)
  - เพิ่ม Budget Requested vs Approved columns
  - เพิ่ม TAT Timestamps: `submitted_at`, `approved_at`
  - เพิ่มตาราง `activity_types` (Master 11 ประเภท, seed แล้ว)
  - เพิ่มตาราง `activity_results` (บันทึกผลหลังกิจกรรม)
  - เพิ่ม Enum `ActivityResultStatus` (COMPLETED / PARTIAL / FAILED)
  - เพิ่ม utilities: `computeFiscalFields()`, `computeTotalBudget()` ใน `validations.ts`
  - เพิ่ม `activityResultSchema` validation ใน `validations.ts`

### 2026-08-11: ดึงข้อมูลแปลงสาธิตจาก Database ใน Type 10 (จัดงาน Field Day)
- **คอมโพเนนต์ที่แก้ไข:** `type10-field-day.tsx`, `activity-plan-form.tsx`
- **รายละเอียด:**
  - ปรับการเลือกแปลงสาธิตให้ดึงข้อมูลจริงจาก Database ผ่าน Server Action `getDemoPlotsAction()` (รวมถึงแปลงที่ถูกสร้างจาก Type 7)
  - ใช้ `FormCombobox` รองรับการค้นหาชื่อแปลงสาธิตและเจ้าของแปลง
  - แสดงข้อความและหน่วยขนาดพื้นที่ / จำนวนต้น แบบไดนามิกตามหมวดพืช (เช่น หมวดพืชสวนแสดง "จำนวนต้น:" และหน่วย "ต้น", หมวดพืชไร่/ผักแสดง "ขนาดพื้นที่:" และหน่วย "ไร่") สอดคล้องกับหน้า Type 7
