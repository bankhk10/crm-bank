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

### 2026-08-14: แก้ไข Work Type 8 (Meeting) การบันทึกและโหลดข้อมูลยอดขาย/จำนวนแยกตามสินค้าในหน้า Actual
- **คอมโพเนนต์ที่แก้ไข:**
  - `modules/activity-plans/features/actual-view/components/work-types/actual-type8-meeting.tsx`
  - `modules/activity-plans/features/actual-view/activity-plan-actual-view.tsx`
- **การเปลี่ยนแปลงที่ดำเนินการ:**
  1. **การบันทึก (`handleSubmit`)**: เพิ่ม `t8ProductSalesDetails` (ยอดขายและจำนวนขายแยกตามสินค้า) ลงใน `resultSummary` ของผลกิจกรรม
  2. **การโหลดข้อมูล (`loadData`)**: เพิ่ม regex JSON parser เพื่อดึงประวัติการกรอกยอดขายและจำนวนขายแต่ละสินค้ากลับมาแสดงผลในฟอร์มเมื่อเปิดดูภายหลังได้อย่างถูกต้อง ไม่สูญหาย
  3. **State Synchronization**: ปรับปรุง `currentSalesList` ให้ merge ข้อมูลระหว่างสินค้าจากแผน (`productList`) และยอดขายที่บันทึกแล้ว (`productSalesDetails`) อย่างสมบูรณ์
- **ผลลัพธ์:** ข้อมูลจำนวนที่ขายได้/จอง และยอดขายรวม (บาท) ของแต่ละสินค้าใน Work Type 8 ถูกบันทึกและแสดงผลย้อนหลังได้อย่างถูกต้อง 100%

### 2026-08-14: ปรับปรุง UX/UI และ Data Flow ของ Demo Plot: แยกหน้าที่ Plan vs Actual, โครงสร้าง Master vs Visit และ History Timeline Modal
- **คอมโพเนนต์ที่แก้ไข/เพิ่มใหม่:**
  - `prisma/schema.prisma` (เพิ่ม `plantingDate`, `plantingAreaCondition`, `usageMethod` ใน `DemoPlot` และ `cropImageUrls`, `plotImageUrls` ใน `DemoPlotVisit`)
  - `modules/activity-plans/infrastructure/activity-plan.repository.ts` (อัปเดต `createDemoPlotRecord`, `recordDemoPlotVisit`, `getDemoPlotWithHistory`)
  - `modules/activity-plans/server/actions.ts` (ปรับปรุง `getDemoPlotHistoryAction`, `recordDemoPlotVisitAction`)
  - `modules/activity-plans/features/form/components/work-types/type7-demo.tsx`
  - `modules/activity-plans/features/actual-view/components/work-types/demo-plot-history-modal.tsx` (เพิ่มใหม่: Timeline Dialog ย้อนหลังทุกรอบตรวจ)
  - `modules/activity-plans/features/actual-view/components/work-types/actual-type7-demo.tsx`
  - `modules/activity-plans/features/actual-view/activity-plan-actual-view.tsx`
- **การเปลี่ยนแปลงที่ดำเนินการ:**
  1. **หน้าสร้างแผน (`type7-demo.tsx`)**: ในโหมด `FOLLOW_UP` ซ่อนช่องวันที่ติดตาม, จำนวนสินค้าที่จะสาธิต, และแถบสถิติสะสม (วันที่ผ่านมา, จำนวนครั้งที่ตรวจแล้ว, ค่าใช้จ่ายสะสม) โดยคงไว้เฉพาะการเลือกแปลงเดิมและการ์ดแสดงข้อมูลระบุตัวตนแปลงเดิมแบบ Read-only พร้อมช่องกรอกรายละเอียดที่ตั้งใจจะไปทำ
  2. **หน้าบันทึกผลจริง (`actual-type7-demo.tsx`)**:
     - กรณี `CREATE`: แสดงฟอร์มทำแปลงใหม่ (วันที่ปลูก *, สภาพพื้นที่ปลูก, วิธีการใช้เริ่มต้น, รูปสภาพพืช, รูปภาพสภาพแปลง)
     - กรณี `FOLLOW_UP`: แสดง **"ข้อมูลอ้างอิงของแปลงสาธิต (จากตอนเริ่มทำแปลง)"** (วันที่ปลูก, สภาพพื้นที่ตอนเริ่ม, วิธีใช้เริ่มต้น, เจ้าของ, พืช, พื้นที่, สินค้า) อัตโนมัติโดยผู้ใช้ไม่ต้องกรอกซ้ำ
     - เพิ่มปุ่มเด่น **"📋 ดูประวัติการติดตามแปลง (X ครั้ง)"** เพื่อเปิด Modal ประวัติการติดตาม
     - ฟอร์มบันทึกผลการติดตามรอบนี้: อายุพืช *, ระยะการเจริญเติบโต *, สภาพพืช *, ผลการใช้ผลิตภัณฑ์ *, วิธีการใช้รอบนี้, รูปสภาพพืช (รอบนี้), รูปภาพสภาพแปลง (รอบนี้)
  3. **History Timeline Modal (`demo-plot-history-modal.tsx`)**: แสดงประวัติการติดตามย้อนหลังทุกรอบตามลำดับเวลา (Visit #1, #2, #3...) พร้อมรูปถ่ายและผลการตรวจ โดยรูปภาพของแต่ละรอบจัดเก็บแยกกันอิสระ ไม่เขียนทับของเดิม
  4. **Graceful Demo Plot Auto-Creation & Legacy Resolution**: ใน `recordDemoPlotVisit` และ `getDemoPlotHistoryAction` หากรับ ID ที่เป็น legacy (`legacy-planId-itemId`) หรือแปลงที่เพิ่งสร้างในขั้นตอน Actual ระบบจะทำการเชื่อมโยงข้อมูลและ Auto-Create `DemoPlot` Master Record ให้โดยอัตโนมัติ ไม่เกิด Error 500
- **ผลลัพธ์:** การทำงานของ Demo Plot มีความชัดเจนในหน้าที่ ไม่ซ้ำซ้อน ใช้งานง่าย และรองรับการติดตามแปลงเดิมอย่างต่อเนื่องสมบูรณ์แบบ

### 2026-08-14: ปรับปรุง Work Type 7 (Demo Plot) แยกฟอร์ม Actual ตามประเภทงาน ("ทำแปลงสาธิต" vs "ติดตามแปลงสาธิต")
- **คอมโพเนนต์ที่แก้ไข:**
  - `modules/activity-plans/features/form/components/work-types/type7-demo.tsx`
  - `modules/activity-plans/features/actual-view/components/work-types/actual-type7-demo.tsx`
  - `modules/activity-plans/features/actual-view/activity-plan-actual-view.tsx`
- **การเปลี่ยนแปลงที่ดำเนินการ:**
  1. **Data Mapping จากฟิลด์ประเภทงานจริง:** ตรวจสอบจากค่า `plotActivityType` / `activityType` (`"CREATE"` vs `"FOLLOW_UP"`) ที่บันทึกในฐานข้อมูล ไม่ได้อิงจาก Label หน้าจอ
  2. **กรณีประเภทงาน = "ทำแปลงสาธิต" (CREATE - เริ่มทำแปลงใหม่):**
     - **ไม่แสดงช่องสำหรับการติดตาม:** ซ่อน อายุพืช, ระยะการเจริญเติบโต, สภาพพืช, ผลการใช้ผลิตภัณฑ์, และสถานะของแปลงสาธิต (Lifecycle Status)
     - **เพิ่มช่องสำหรับสร้างแปลงใหม่:**
       - **ข้อมูลการทำแปลง:** วันที่ปลูก (`plantingDate` *), สภาพพื้นที่ปลูก (`plantingAreaCondition`), วิธีการใช้ / อัตราการใช้ (`usageMethod`)
       - **รูปภาพประกอบการทำแปลง:** รูปสภาพพืช (`cropImages`), รูปภาพสภาพแปลง (`plotImages`)
  3. **กรณีประเภทงาน = "ติดตามแปลงสาธิต" (FOLLOW_UP - ติดตามแปลงเดิม):**
     - คงฟอร์มการติดตามแปลงสาธิตตามรูปแบบเดิมอย่างครบถ้วน 100% (อายุพืช, ระยะการเจริญเติบโต, สภาพพืช, ผลการใช้ผลิตภัณฑ์, รูปภาพสภาพแปลงล่าสุด, ประวัติการเข้าตรวจ, Lifecycle Status, และฟอร์มสรุปปิดแปลง)
- **ผลลัพธ์:** หน้า Trip Plan Actual แยกแบบฟอร์มการกรอกผลการปฏิบัติงานระหว่าง "การเริ่มทำแปลงใหม่" และ "การติดตามแปลงเดิม" ได้อย่างถูกต้อง ชัดเจน และสมบูรณ์แบบตาม Business Flow

### 2026-08-14: พัฒนาระบบติดตามแปลงสาธิตต่อเนื่องครบวงจร (Demo Plot Lifecycle, Duration/Cost Calculations & Plot Closing)
- **คอมโพเนนต์ที่แก้ไข/เพิ่มใหม่:**
  - `prisma/schema.prisma` (เพิ่ม `DemoPlotStatus`, `model DemoPlot`, `model DemoPlotVisit`)
  - `modules/activity-plans/infrastructure/activity-plan.repository.ts`
  - `modules/activity-plans/server/actions.ts`
  - `modules/activity-plans/features/form/constants.ts`
  - `modules/activity-plans/features/form/components/work-types/type7-demo.tsx`
  - `modules/activity-plans/features/form/activity-plan-form.tsx`
  - `modules/activity-plans/features/actual-view/components/work-types/actual-type7-demo.tsx`
  - `modules/activity-plans/features/actual-view/activity-plan-actual-view.tsx`
- **การเปลี่ยนแปลงที่ดำเนินการ:**
  1. **Master Entity & Database Schema:** สร้างตาราง `demo_plots` และ `demo_plot_visits` ในฐานข้อมูล เพื่อให้แปลงสาธิตมีตัวตนถาวร (Plot Identity) อยู่ยาวนานข้ามหลาย Trip Plan และรองรับการบันทึกประวัติการเข้าตรวจหลายครั้ง
  2. **Plan & FOLLOW_UP Linkage:** ปรับปรุง `type7-demo.tsx` และ `activity-plan-form.tsx` ให้โหลดแปลงสาธิตจริงจากฐานข้อมูลในโหมด `FOLLOW_UP` พร้อมแสดงการ์ดสรุปประวัติ: วันเริ่มทำแปลง, จำนวนวันสะสม, จำนวนครั้งที่ตรวจแล้ว, และค่าใช้จ่ายสะสม
  3. **การคำนวณระยะเวลารวมสะสม (Duration Calculation):** คำนวณ `Days Elapsed` จาก `startDate` ถึงวันตรวจจริงใน `actual-type7-demo.tsx` อย่างแม่นยำ ไม่สับสนกับอายุพืช (`cropAge`)
  4. **การคำนวณค่าใช้จ่ายสะสม (Cumulative Plot Costs):** คำนวณมูลค่าสินค้าสาธิต (`จำนวนสินค้า × ราคาต่อหน่วย`) และยอดค่าใช้จ่ายสะสมรวมทุกการเข้าตรวจ
  5. **ประวัติการตรวจแปลงย้อนหลัง (Visit History Timeline):** แสดง Accordion ประวัติการตรวจแปลงรอบก่อนๆ (วันที่, ระยะพืช, สภาพแปลง, ผลตอบสนอง, รูปภาพ)
  6. **วงจรชีวิตและการปิดแปลง (Plot Lifecycle & Harvest Evaluation):** เพิ่มตัวเลือกสถานะแปลง (`IN_PROGRESS`, `COMPLETED`, `FAILED`) พร้อมฟอร์มบันทึกผลผลิตเปรียบเทียบ (กก./ไร่), % ผลผลิตเพิ่มขึ้น (Auto Calc), ความพึงพอใจเกษตรกร (1-5 ดาว), โอกาสสั่งซื้อจริง, และข้อคิดเห็นสรุปผลสัมฤทธิ์
- **ผลลัพธ์:** ระบบแปลงสาธิตสามารถติดตามต่อเนื่องตั้งแต่เริ่มสร้างแปลง → ติดตามหลายรอบ → คำนวณวันและเงินสะสม → สรุปผลผลิตและปิดแปลงได้อย่างสมบูรณ์แบบ 100%

### 2026-08-14: เพิ่มช่องกรอก "จำนวนสินค้าที่จะสาธิต" และเชื่อมต่อ Data Flow สำหรับ Work Type 7 (ติดตามแปลงสาธิต / ทำแปลง)
- **คอมโพเนนต์ที่แก้ไข:**
  - `modules/activity-plans/features/form/components/work-types/type7-demo.tsx`
  - `modules/activity-plans/features/form/types.ts`
  - `modules/activity-plans/features/form/activity-plan-form.tsx`
  - `modules/activity-plans/infrastructure/activity-plan.repository.ts`
  - `modules/activity-plans/features/actual-view/activity-plan-actual-view.tsx`
  - `modules/activity-plans/features/actual-view/components/work-types/actual-type7-demo.tsx`
- **การเปลี่ยนแปลงที่ดำเนินการ:**
  1. **หน้า Create (Trip Plan Form):** เพิ่มช่องกรอก "จำนวนสินค้าที่จะสาธิต" (ตัวเลข >= 0) ใน `type7-demo.tsx` ทั้งในโหมดทำแปลงใหม่ (CREATE) และโหมดติดตามแปลงเดิม (FOLLOW_UP) และแยกการเก็บข้อมูลออกจาก `areaRai`/`treeCount`
  2. **Data Flow & Database Mapping:** ผูกข้อมูลเข้ากับฟิลด์ `plotsCount` ใน State และบันทึกลงคอลัมน์ `plot_count` (`plotCount`) ในตาราง `activity_plan_items` ของฐานข้อมูล รวมถึงรวม `objective` และ `experimentDetail` เข้าในฟิลด์ `detail` เพื่อบันทึกอย่างครบถ้วน
  3. **หน้า Actual (Trip Plan Actual):**
     - ดึงข้อมูล `plotCount`, `objective` (วัตถุประสงค์ของแปลง) และ `experimentDetail` (รายละเอียด / วิธีการทดลอง) จาก Database ส่งต่อไปยัง `targets.t7` และนำมาแสดงผลใน `actual-type7-demo.tsx` ทั้งในการ์ดเดี่ยว (`ActualTargetCard`) และการ์ดเป้าหมายแบบหลายแปลง (`target.items`) โดยแสดงเป็น `-` หากไม่ได้กรอก
     - แก้ไขข้อผิดพลาดเรื่องการบันทึกและโหลดข้อมูล Actual ของ Type 7 ได้แก่ **อายุพืช (`t7CropAgeValue`, `t7CropAgeUnit`)**, **ผลการใช้ผลิตภัณฑ์ (`t7ProductResponse`)**, และ **รายละเอียดปัญหาผลิตภัณฑ์ (`t7ProblemDescription`)** โดยบันทึกลงใน `resultSummary` และสกัดกลับคืนสู่ State อย่างแม่นยำ
     - แก้ไขบั๊กการดึงข้อมูลผิดช่องระหว่าง "ระบุปัญหาที่พบ (ผลการใช้ผลิตภัณฑ์)" และ "ระบุปัญหาที่พบ (สภาพพืช)" โดยยกเลิก fallback เก่าที่คัดลอก `problemFound` รวมไปใส่ `t7CropProblemDescription` และแยก Regex ดึงข้อมูลของแต่ละช่องออกจากกันอย่างชัดเจน
- **ผลลัพธ์:** ข้อมูลจำนวนสินค้าที่จะสาธิต, วัตถุประสงค์ของแปลง, รายละเอียดการทดลอง รวมถึงข้อมูลผลการลงพื้นที่จริง (อายุพืช, สภาพพืช, ปัญหาของพืช, ผลการใช้ผลิตภัณฑ์, ปัญหาของผลิตภัณฑ์) บันทึกและแสดงผลแยกช่องกันอย่างถูกต้อง 100% ใน Trip Plan Actual ไม่ปะปนกันและไม่สูญหายเมื่อเปิดกลับเข้ามาดูใหม่อีกครั้ง

### 2026-08-14: ปรับปรุง Data Flow และแก้ไขการแสดงผล Work Type 6 (แก้ปัญหา / รับเรื่องร้องเรียน) ในหน้า Trip Plan Actual
- **คอมโพเนนต์ที่แก้ไข:**
  - `modules/activity-plans/features/actual-view/components/work-types/actual-type6-issue.tsx`
  - `modules/activity-plans/features/actual-view/activity-plan-actual-view.tsx`
- **ปัญหาที่แก้ไข:**
  1. **รายละเอียดเพิ่มเติมไม่แสดงในหน้า Actual:** ในหน้า Create (`type6-issue.tsx`) มีการบันทึกฟิลด์ `detail` ลงฐานข้อมูลตาราง `activity_plan_items` เรียบร้อยแล้ว แต่ในหน้า Actual (`actual-type6-issue.tsx`) คอมโพเนนต์ `ActualTargetCard` แสดงเฉพาะ `ลูกค้า/ร้านค้า` และ `ประเภทปัญหา` โดยไม่ได้นำ `รายละเอียดเพิ่มเติม` (`target.detail`) มาแสดง
  2. **Multi-Item Issue Target Support:** ปรับปรุง `activity-plan-actual-view.tsx` ให้ map ทุกรายการร้องเรียน (`t6ItemsFromDb`) เข้าสู่ `targets.t6` และใน `actual-type6-issue.tsx` รองรับการแสดงผลทั้งแบบ 1 รายการ (`grid-cols-1 sm:grid-cols-3`) และแบบหลายรายการพร้อมรายละเอียดเพิ่มเติมครบถ้วน
- **ผลลัพธ์:** ข้อมูล "รายละเอียดเพิ่มเติม" ที่บันทึกไว้ตอนสร้างแผนถูกส่งต่อและนำมาแสดงผลในหน้า Trip Plan Actual อย่างถูกต้อง 100% ตรงกับที่บันทึกไว้ในฐานข้อมูล

### 2026-08-14: ปรับปรุง Data Flow และแก้ไขการแสดงผล Work Type 5 (สำรวจตลาดของคู่แข่ง) ในหน้า Trip Plan Actual
- **คอมโพเนนต์ที่แก้ไข:**
  - `modules/activity-plans/features/actual-view/components/work-types/actual-type5-survey.tsx`
  - `modules/activity-plans/features/actual-view/activity-plan-actual-view.tsx`
  - `modules/activity-plans/features/actual-view/components/actual-target-card.tsx`
- **ปัญหาที่แก้ไข:**
  1. **รายละเอียดเพิ่มเติมไม่แสดงในหน้า Actual:** ในหน้า Create (`type5-survey.tsx`) มีการบันทึกฟิลด์ `detail` ลงฐานข้อมูลตาราง `activity_plan_items` เรียบร้อยแล้ว แต่ในหน้า Actual (`actual-type5-survey.tsx`) ตัวคอมโพเนนต์ `ActualTargetCard` ส่งเฉพาะ `ร้านค้าที่สำรวจ` และ `สินค้าเปรียบเทียบ` โดยไม่ได้ใส่ `รายละเอียดเพิ่มเติม` เข้าไปในการ์ด
  2. **Multi-Item Survey Target Support:** ปรับปรุง `activity-plan-actual-view.tsx` ให้ map ทุกรายการสำรวจ (`t5ItemsFromDb`) เข้าสู่ `targets.t5` และใน `actual-type5-survey.tsx` รองรับการแสดงผลทั้งแบบ 1 รายการ (`grid-cols-1 sm:grid-cols-3`) และแบบหลายรายการพร้อมรายละเอียดเพิ่มเติมครบถ้วน
  3. **หน่วยนับคู่แข่งไม่ถูกบันทึก/โหลดกลับมา:** แก้ไข `activity-plan-actual-view.tsx` ให้บันทึก `t5CompetitorUnit` ลงใน `resultSummary` และดึงค่ากลับมาแสดงผลในช่องเลือกหน่วยนับเมื่อกลับมาเปิดดูหรือแก้ไขผลการปฏิบัติงาน
  4. **Text Wrapping Safety:** ปรับปรุง `actual-target-card.tsx` ให้มี `block break-words whitespace-pre-wrap` เพื่อรองรับข้อความรายละเอียดขนาดยาวโดยไม่ทำให้ UI Layout พัง
- **ผลลัพธ์:** ข้อมูล "รายละเอียดเพิ่มเติม" จากแผนเดิม และผลการบันทึกจริงรวมถึง "หน่วยนับ" ถูกจัดเก็บและนำมาแสดงผลในหน้า Trip Plan Actual อย่างถูกต้อง 100% ตรงกับที่บันทึกไว้จริง

### 2026-08-14: ปรับปรุง Data Flow และแก้ไขการแสดงผล Work Type 3 (เสนอขายสินค้า) ระหว่างหน้า Create และ Actual
- **คอมโพเนนต์ที่แก้ไข:**
  - `modules/activity-plans/features/actual-view/components/work-types/actual-type3-sales.tsx`
  - `modules/activity-plans/features/actual-view/activity-plan-actual-view.tsx`
  - `modules/activity-plans/features/form/components/work-types/type3-sales.tsx`
  - `modules/activity-plans/features/form/activity-plan-form.tsx`
  - `modules/activity-plans/infrastructure/activity-plan.repository.ts`
- **ปัญหาที่แก้ไข:**
  1. **จำนวนไม่แสดง:** ในหน้า Actual เดิมไม่ได้ส่ง `items` และ `targetQty` จาก DB ไปยัง `targets.t3` ส่งผลให้การ์ดแสดงผลไม่มีข้อมูลจำนวน
  2. **ราคาไม่ถูกต้อง & Fallback Hardcode:** ในหน้า Actual เดิมมีการ fallback เป็นราคาตัวอย่าง เช่น `500 บาท/ลัง`, `750 บาท/ลัง`, `500 บาท/หน่วย` และใส่ dummy data ใน `useEffect` (`actualQty: 20/10`, `actualSales: 10000/7500`)
  3. **Label:** ปรับ label จาก `"ราคา/หน่วย (บาท)"` เป็น `"ราคา (บาท)"` ให้สอดคล้องกันทุกจุด
  4. **Data Integrity:** ปรับ ternary condition ใน Repository (`activity-plan.repository.ts`) ให้ตรวจ `!= null` ป้องกันการบันทึกค่า `0` เป็น `null` สำหรับ `Decimal` fields
- **ผลลัพธ์:** ข้อมูลสินค้า จำนวน ราคา และยอดรวมในหน้า Trip Plan Actual ดึงมาจากข้อมูลที่บันทึกไว้ใน Trip Plan Create จริง 100% โดยตรง ไม่มีการ recalculate หรือ fallback ปลอม

### 2026-08-14: ยกระดับสิทธิ์ Roles Administrator ให้สามารถอนุมัติได้ทุกสายงานและทุกขั้นตอน
- **คอมโพเนนต์ที่พัฒนา/ปรับปรุง:** `activity-plan-approval-list-view.tsx`, `activity-plan-detail-view.tsx`, `activity-plan-flow.ts`, `server/actions.ts`
- **ฟีเจอร์เด่น:**
  - **Superuser Approval Authority:** บัญชีที่มี Role `administrator`, `admin` หรือ `ceo` สามารถ:
    - อนุมัติ / ปฏิเสธ / ส่งกลับแก้ไข แผนงานได้ทุกรายการในทุกขั้นตอน (Line Approval, Budget Approval, Helper Approval)
    - อนุมัติงบประมาณทุกประเภท (Sales Promotion, Marketing, Overall) ได้แบบเบ็ดเสร็จทันที
    - อนุมัติคำขอพนักงานช่วยงาน (Helper Requests) ได้ทั้งหมดในครั้งเดียว
  - **Full Visibility in Approval Hub:** แสดงรายการคิวงานทั้งหมดให้ Administrator มองเห็นและจัดการได้ทันที พร้อมแถบป้ายสถานะ `👑 สิทธิ์ Administrator`

### 2026-08-15: แก้ไข Console Warning Duplicate Key รายการสินค้าใน Type 11 (ตรวจเช็กสต็อกหน้าร้าน)
- **คอมโพเนนต์ที่แก้ไข:** `actual-type11-stock.tsx`
- **ปัญหา:** พบ Console Error `Encountered two children with the same key` เนื่องจากในฐานข้อมูลมีรายการสินค้าที่มีชื่อ/ขนาดซ้ำกัน ทำให้เกิด duplicate key และ duplicate value ใน SelectItem
- **การแก้ไข:** ใช้ `Array.from(new Set(list))` ใน `useMemo` เพื่อ Deduplicate รายชื่อสินค้าทั้งหมด พร้อมทั้งใส่ Indexed key ใน `SelectItem`

### 2026-08-15: ดึงสินค้าจริงจาก Database และแก้ไขการบันทึกจำนวนคงเหลือสต็อก สำหรับ Type 11 (ตรวจเช็กสต็อกหน้าร้าน)
- **คอมโพเนนต์ที่แก้ไข:** `actual-type11-stock.tsx`, `activity-plan-actual-view.tsx`
- **การเปลี่ยนแปลง:**
  1. **รายการสินค้า *:** ดึงรายการสินค้าจริงที่เปิดใช้งาน (`status = ACTIVE`) จากฐานข้อมูลผ่าน `listProductsAction` / `products` prop แทนการใช้ mock data เดิม พร้อมทั้งยังคงตัวเลือก **"ไม่พบข้อมูล / ระบุเพิ่มเติม"** สำหรับระบุชื่อสินค้าเอง
  2. **ช่อง จำนวนคงเหลือ & รายการสินค้าตรวจเช็ก:**
     - ใน `handleSubmit` ของ `activity-plan-actual-view.tsx` เพิ่มการ Serialize ข้อมูลรายการสต็อก `t11StockItems` (JSON), `t11ProductList` และ `t11RemainingQty` ลงใน `summaryParts`
     - ใน `loadData` เพิ่มการ Parse ข้อมูล `รายการตรวจเช็กสต็อก:`, `รายการสินค้าตรวจเช็ก:` และ `จำนวนคงเหลือสต็อก:` กลับมา Restore state `t11StockItems`, `t11ProductList` และ `t11RemainingQty` ทันที ทำให้ข้อมูลจำนวนคงเหลือและสินค้าไม่หายเมื่อเปิดกลับมาดู

### 2026-08-15: ดึงรายชื่อเกษตรกรจริงเข้าสู่ Dropdown "รายชื่อเกษตรกรเป้าหมายที่สนใจ" สำหรับ Type 10 (จัดงาน Field Day)
- **คอมโพเนนต์ที่แก้ไข:** `actual-type10-field-day.tsx`, `actions.ts`
- **การเปลี่ยนแปลง:**
  - สร้าง Server Action `getFarmerCustomersAction` ดึงรายชื่อเกษตรกรจริง (`Customer` ประเภท `FARMER`) พร้อมรายละเอียดแปลงเกษตร/พื้นที่เพาะปลูก (`farmPlots`) หรือที่ตั้ง
  - นำข้อมูลรายชื่อเกษตรกรจริงมาแสดงผลใน Dropdown **"รายชื่อเกษตรกรเป้าหมายที่สนใจ *"** ของ `actual-type10-field-day.tsx` แทน mock data เดิม
  - คงตัวเลือก **"ไม่พบข้อมูล / ระบุเพิ่มเติม"** ไว้อย่างสมบูรณ์ พร้อมช่อง Textarea ให้ระบุเพิ่มเติมได้ตามเดิม

### 2026-08-15: แก้ไขการบันทึกและแสดงผลยอดขาย/ยอดจองจริงสำหรับ Type 10 (จัดงาน Field Day)
- **คอมโพเนนต์ที่แก้ไข:** `activity-plan-actual-view.tsx`
- **ปัญหา:** เมื่อกรอก **"ยอดขายหรือยอดจองที่เกิดขึ้นจริง (บาท) *"** ในหน้า Actual ของ Type 10 แล้วกดบันทึก เมื่อเปิดกลับมาดูข้อมูลช่องดังกล่าวยังคงว่างเปล่า
- **สาเหตุ:**
  1. ในฟังก์ชัน `handleSubmit` ของ `activity-plan-actual-view.tsx` ยังไม่มีการใส่ `t10ActualSalesOrBooking` ลงใน `summaryParts` (`ยอดขายหรือยอดจอง Field Day จริง: ...`) และไม่ได้รวมใน `payload.salesResultAmount`
  2. ในฟังก์ชัน `loadData` ตอนโหลดข้อมูลบันทึกผลงานจริง ยังไม่มี parser ดึงค่า `ยอดขายหรือยอดจอง Field Day จริง` กลับมาใส่ใน state `t10ActualSalesOrBooking`
- **การแก้ไข:**
  - เพิ่ม `t10ActualSalesOrBooking` ลงใน `summaryParts` และ `payload.salesResultAmount` ตอน Submit
  - เพิ่ม Regex Parser สำหรับ `ยอดขายหรือยอดจอง Field Day จริง` พร้อม Fallback ดึงค่าจาก `resData.salesResultAmount` เมื่อโหลดข้อมูลกลับมาแสดงในหน้า Actual View

### 2026-08-15: แก้ปัญหา Data Flow และการแสดงผลประเภทงานสำหรับ Type 10 (จัดงาน Field Day)
- **คอมโพเนนต์ที่แก้ไข:** `activity-plan-form.tsx`, `activity-plan-actual-view.tsx`, `activity-plan-detail-view.tsx`, `activity-plan.repository.ts`, `actual-type10-field-day.tsx`
- **สาเหตุของปัญหา:**
  1. **แสดงประเภทงานผิด (มีส่วนทำแปลงสาธิต Type 7 โผล่ขึ้นมา):** ใน `activity-plan-actual-view.tsx` และ `activity-plan-detail-view.tsx` มี logic ตรวจจับข้อความ `objectiveText.includes("แปลงสาธิต")` แบบกว้างเกินไป ทำให้เมื่องาน Type 10 มีชื่อแปลงสาธิต เช่น "จัดงาน Field Day - แปลงสาธิต..." ระบบตรวจจับว่ามี Type 7 ปนมาด้วย และใน item loop ไม่ได้ยกเว้น `itemType === 'TYPE_10'`
  2. **ข้อมูล Field Day ไม่แสดงในหน้า Actual:** ใน `activity-plan-form.tsx` เมื่อส่งข้อมูล Type 10 ไม่ได้ส่ง `meetingAttendeesCount` (เป้าหมายผู้เข้าร่วม) และ `saleTotalPrice` (เป้ายอดขาย/จอง) เป็น structured fields แยกชัดเจน รวมทั้งตัวโหลด `targets.t10` ใน Actual View ไม่ได้ fallback ดึงค่าเป้าหมายอย่างครบถ้วน
- **การแก้ไข:**
  - ปรับปรุง `activity-plan-form.tsx` ให้ส่งค่า `meetingAttendeesCount`, `saleTotalPrice`, `targetAttendees`, `targetSales`, `bookingSales` ไปยัง backend อย่างครบถ้วน และรองรับการดึงข้อมูลคืนใน Edit mode
  - ปรับปรุง `activity-plan.repository.ts` ให้ map ข้อมูล `saleTotalPrice` และ `meetingAttendeesCount` สำหรับ Type 10 ทั้งตอน `createActivityPlan` และ `updateActivityPlan`
  - ปรับปรุง `activity-plan-actual-view.tsx` และ `activity-plan-detail-view.tsx` ให้แยกแยะ Type 10 และ Type 7 อย่างแม่นยำ ไม่ให้คำว่า "แปลงสาธิต" ไป trigger Type 7 โดยไม่ได้ตั้งใจ
  - ปรับปรุงตัวดึงข้อมูล `targets.t10` ให้ดึงทั้งจากฟิลด์ตัวเลขของ Item และข้อความรายละเอียด (Regex) พร้อม fallback ที่สมบูรณ์

### 2026-08-15: เชื่อมโยงข้อมูลพิกัด (Latitude / Longitude) จากแปลงเกษตรกรเข้าสู่ Type 10 (จัดงาน Field Day)
- **คอมโพเนนต์ที่พัฒนา/ปรับปรุง:** `type10-field-day.tsx`, `actions.ts`, `constants.ts`, `activity-plan-actual-view.tsx`, `actual-type10-field-day.tsx`
- **ความต้องการ:**
  - ในช่อง **สถานที่แปลง** ของ Type 10 ให้ดึงข้อมูล **Latitude / Longitude** จากข้อมูลแปลงเกษตรของเกษตรกร (`farmPlots`) ที่บันทึกไว้ในหน้า `customer-form-farmer.tsx`
  - หากมี Latitude / Longitude ให้แสดงค่าจริง (เช่น `13.7563, 100.5018`) พร้อมปุ่มเปิด Google Maps
  - หากไม่มีข้อมูล ให้แสดง `-`
  - นำข้อมูลที่มีอยู่เดิมมาแสดงโดยไม่สร้างข้อมูลซ้ำ และไม่กระทบ Work Type อื่น
- **การแก้ไข:**
  - เพิ่มฟิลด์ `latitude` และ `longitude` ใน `UserDemoPlotOption`
  - ปรับปรุง `getDemoPlotsAction` ให้ดึงข้อมูลแปลงเกษตรกร (`farmPlots`) ของ Customer ประเภท `FARMER` พร้อมสกัดค่า Latitude / Longitude และนำมารวมในรายการแปลงสาธิต/แปลงเกษตรกรโดยไม่ซ้ำซ้อน
  - ปรับปรุง `type10-field-day.tsx` ให้แสดงพิกัดจริง `Latitude, Longitude` ในช่องสถานที่แปลง และในป้ายกำกับของตัวเลือกแปลง
  - ปรับ `actual-type10-field-day.tsx` และ `activity-plan-actual-view.tsx` ให้แสดงข้อมูลสถานที่แปลงที่ผูกกับพิกัดใน Actual Target Card ได้ถูกต้อง

### 2026-08-15: ปรับปรุง Data Flow & บันทึกยอดขายจริงรายสินค้าสำหรับ Type 9 (จัดกิจกรรมส่งเสริมการขายหน้าร้าน)
- **คอมโพเนนต์ที่พัฒนา/ปรับปรุง:** `actual-type9-store.tsx`, `activity-plan-actual-view.tsx`, `activity-plan-form.tsx`
- **ปัญหา & ข้อกำหนดใหม่:**
  1. ในหน้าสร้าง/แก้ไขแผน (`type9-store.tsx`) มีการกรอก "ชื่อร้านค้า Sub Dealer" และ "รายการสินค้าที่เสนอขาย / โปรโมชันหน้าร้าน" แต่เมื่อเปิดหน้าบันทึกผลงานจริง (`actual-type9-store.tsx`) ข้อมูลดังกล่าวไม่แสดงผล
  2. ปรับหน้า Actual View Type 9 ไม่ต้องมีช่องกรอกจำนวนลูกค้าที่เข้าร่วมจริง (คน)
  3. ปรับยอดขายที่เกิดขึ้นจริง (บาท) ให้รองรับการกรอกยอดขายจริงและจำนวนลังจริงแยกตามรายสินค้าแต่ละตัว พร้อมคำนวณยอดขายรวมจริงอัตโนมัติ
  4. แก้ไขปัญหาเมื่อกดบันทึกแล้วกลับมาดู ข้อมูลจำนวนลังและยอดขายจริงรายสินค้าของ Type 9 ไม่ปรากฏในช่องกรอก (State & Persistence Sync)
- **การแก้ไข:**
  - อัปเดต `actual-type9-store.tsx` ให้ `ActualTargetCard` แสดงทั้งร้านค้าหลัก (Dealer) และร้านค้า Sub Dealer
  - เพิ่มระบบบันทึกยอดขายจริงแยกรายสินค้าแต่ละตัว (Per-Product Actual Recording) พร้อมผูก `productSalesDetails` และ `setProductSalesDetails` ซิงค์กับ `activity-plan-actual-view.tsx`
  - บันทึกและดึงข้อมูล `ยอดขายแยกสินค้าหน้าร้าน` (`t9ProductSalesDetails`) ผ่าน `resultSummary` ทำให้เมื่อบันทึกแล้วกลับมาเปิดดูอีกครั้ง ข้อมูลในช่องกรอกของสินค้าแต่ละตัวยังคงอยู่ครบถ้วน
  - นำช่องกรอก "จำนวนลูกค้าที่เข้าร่วมจริง (คน)" ออกจากหน้า Type 9 ตามที่ผู้ใช้ระบุ
  - ปรับ `activity-plan-actual-view.tsx` ให้กรองทุกไอเทมของ Type 9 (`type9DbItems`), คำนวณยอดขายเป้าหมายรวม (`t9TotalSales`), แยกชื่อร้านหลัก/Sub Dealer, และส่ง `items` array เข้าสู่ `targets.t9`
  - ปรับ `activity-plan-form.tsx` ให้ parse `type9Store`, `type9IsSubDealer`, `type9SubDealerStore`, `type9Sales`, `type9ProductItems` กลับมาในช่องกรอกได้อย่างถูกต้องใน Edit Mode

### 2026-08-14: เพิ่มตัวเลือกสถานะผลการทำกิจกรรม (Activity Result Status) & ระบบจัดการผลดำเนินงาน
- **คอมโพเนนต์ที่พัฒนา/ปรับปรุง:** `activity-plan-actual-view.tsx`, `validations.ts`, `activity-plan.repository.ts`, `application/index.ts`, `prisma/schema.prisma`
- **ฟีเจอร์เด่น:**
  - **4 สถานะผลการทำกิจกรรม:**
    - `PARTIAL` : สำเร็จบางส่วน (ค่าเริ่มต้น)
    - `COMPLETED` : สำเร็จ
    - `POSTPONED` : เลื่อน (เปิดช่องกรอก: วันที่และเวลาใหม่ด้วย `DateTimePicker`*, เหตุผลที่เลื่อน* [ลูกค้าขอเลื่อน, ผู้ปฏิบัติงานขอเลื่อน, ลูกค้าไม่สะดวก, สภาพอากาศ, เหตุสุดวิสัย, อื่น ๆ], ช่องกรอกหมายเหตุ)
    - `CANCELLED` : ยกเลิก (เปิดช่องกรอก: สาเหตุที่ยกเลิก*)
  - **Database Persistence & Edit Support:** รองรับการบันทึกลงฟิลด์เฉพาะในตาราง `activity_results` (`cancel_reason`, `postponed_date`, `postponed_time`, `postponed_reason`, `postponed_notes`) พร้อมดึงกลับมาแสดงผลและแก้ไขได้ทันที
  - **Validation:** ตรวจสอบความถูกต้องของข้อมูลกรณีเลือกเลื่อนหรือยกเลิกก่อนส่งบันทึก

### 2026-08-14: แก้ไข Bug ตรวจจับประเภทงานผิดพลาด & ป้องกัน Fallback Mock Data ในหน้า Actual View
- **คอมโพเนนต์ที่แก้ไข:** `activity-plan-form.tsx`, `activity-plan-actual-view.tsx`, `activity-plan-detail-view.tsx`, `actual-type2-followup.tsx`
- **ปัญหาที่พบ:**
  1. หน้าแก้ไขและหน้ารายละเอียดตรวจจับประเภทงานเพิ่มขึ้นมาเอง (จากรายการสื่อและส่งเสริมการขาย)
  2. ในหน้าบันทึกผลงานจริง (Actual View Type 2 และประเภทอื่นๆ) หากตอนสร้างแผนไม่ได้กรอก "รายละเอียดเพิ่มเติม" กลับมีข้อความตัวอย่างจำลอง (เช่น *"ติดตามผลหลังเกษตรกรนำสินค้าไปทดลองใช้งานในพื้นที่"*) ปรากฏขึ้นมาเอง
- **สาเหตุ:**
  1. รายการสื่อและรายการส่งเสริมการขายใช้ฟิลด์ร่วมใน `activity_plan_items` ทำให้ตัวตรวจจับตีความผิด
  2. State `targets` ใน `activity-plan-actual-view.tsx` มีการกำหนดข้อความจำลอง (Mock Defaults) ไว้ใน Initial State และเมื่อโหลดข้อมูลจาก DB หากฟิลด์ว่าง (`""`) มีการใช้ `|| prev.tX.detail` ทำให้ค่า Fallback กลับไปเป็นข้อความจำลองแทนที่จะเป็นค่าว่าง
  3. ใน `actual-type2-followup.tsx` มีการดึง `followupDetail || detail` ทำให้ช่องกรอกผลการติดตามจริงดึงข้อความจากแผนมาใส่แทน
- **การแก้ไข:**
  - กรอง `MARKETING_PRODUCT` และ `SALES_PROMOTION` ออกจากการตรวจจับประเภทงาน
  - ล้าง Mock Defaults ใน `targets` ให้เริ่มต้นเป็นค่าว่าง และกำหนดค่าจาก DB ตรงๆ โดยไม่ Fallback ไปหา Mock String
  - แยก `followupDetail` (ผลการติดตามจริง) ออกจาก `detail` (รายละเอียดจากแผน) อย่างเด็ดขาดใน `actual-type2-followup.tsx` ไม่ให้คัดลอกค่ามาใส่ในกล่องกรอกข้อมูลจริงอัตโนมัติ

### 2026-08-14: เพิ่มหน้าจอศูนย์ตรวจสอบและอนุมัติกิจกรรม & ปรับปรุง Actual Form Type 2
- **คอมโพเนนต์ที่พัฒนา/ปรับปรุง:** `actual-type2-followup.tsx`, `activity-plan-actual-view.tsx`, `activity-plan-approval-list-view.tsx`, `approval-action-dialog.tsx`, `approval-detail-drawer.tsx`, `activity-plan.repository.ts`, `server/actions.ts`
- **การปรับปรุง Actual Form Type 2 (ติดตามผลการใช้สินค้า):**
  - แยกช่องกรอก **"รายละเอียดการติดตาม"** (`followupDetail`) ออกจาก **"รายละเอียดเพิ่มเติม"** (`detail` จากแผนเดิม) อย่างชัดเจน
  - แสดง "รายละเอียดเพิ่มเติมจากแผน" เป็น Reference Box ให้อ่านอ้างอิง และให้ผู้ใช้กรอกผลการติดตามจริงในช่องกรอกแยกต่างหาก ไม่ทับซ้อนกัน
- **Routing & Approval Hub:** `/activity-plans/approvals` และเพิ่มเมนูใน Sidebar + ปุ่มทางลัดใน Toolbar
- **ฟีเจอร์เด่น Approval Hub:**
  - **KPI Summary Cards:** แสดงจำนวนคำขออนุมัติตามสายงาน, คิวงบประมาณ, คิวคนช่วยงาน, และประวัติการดำเนินการ
  - **Tabbed Filter Navigation:** กรองรายการ 5 แท็บ (`my_line`, `all`, `budget`, `helper`, `history`)
  - **Dual View Mode:** สลับการแสดงผลแบบการ์ด (Card View) และตาราง (Table View)
  - **Quick Actions & Inspection Drawer:** ยืนยันการอนุมัติ/ตีกลับ/ปฏิเสธ และเปิดดู Timeline ได้ทันที

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
