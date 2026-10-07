# คู่มือระบบการทำงานฟีเจอร์กิจกรรม (Trip Plan Feature Guide)

> **Module**: `activity-plans`  
> **Purpose**: อธิบาย Domain, Architecture, Database, Data Flow, Approval Flow และการเปลี่ยนแปลงสำคัญของ Module `activity-plans`  
> **Architecture Authority**: [MODULE_ARCHITECTURE.md](../../../docs/MODULE_ARCHITECTURE.md)  
> **Coding Standards**: [CODING_STANDARDS.md](../../../docs/CODING_STANDARDS.md)  
> **System Architecture**: [ARCHITECTURE.md](../../../docs/ARCHITECTURE.md)

---

## 📂 Module Architecture

Module นี้อยู่ภายใต้:

```text
modules/activity-plans/
```

และปฏิบัติตาม **Module Architecture Contract** ของโปรเจกต์อย่างสมบูรณ์แบบ

### โครงสร้างโมดูลปัจจุบัน (Standardized Modular Architecture)

```text
modules/activity-plans/
├── application/                    # Use Cases, Zod Validations, Workflow & Flow Orchestration
│   ├── activity-plan-flow.ts
│   ├── calendar-integration.ts
│   ├── promotional-materials.ts
│   ├── validations.ts
│   └── index.ts
│
├── infrastructure/                # Database Repositories & Data Access
│   ├── activity-plan.repository.ts
│   └── promotional-material.repository.ts
│
├── server/                         # Server Actions, Auth/RBAC, Revalidation
│   └── actions.ts
│
├── features/                       # Standardized Feature Modules
│   ├── list-view/                  # ตารางค้นหาและรายการแผนงาน (Activity Plans List & Approvals Queue)
│   ├── planned/                    # Planned Activity Flow (สร้าง/แก้ไขแผนงานล่วงหน้า)
│   │   ├── components/             # PlannedActivityForm, Action Buttons
│   │   ├── hooks/                  # usePlannedActivityForm
│   │   └── index.ts
│   │
│   ├── unplanned/                  # Unplanned Activity Flow (สร้าง/แก้ไขกิจกรรมย้อนหลัง)
│   │   ├── components/             # UnplannedActivityForm, Action Buttons
│   │   ├── hooks/                  # useUnplannedActivityForm
│   │   └── index.ts
│   │
│   ├── type-1/ ถึง type-14/        # 14 Work Type Modules (Standardized 6 Sub-folders)
│   │   ├── shared/types.ts         # Base domain types & payload interfaces
│   │   ├── create/                 # Create Form Component, Types & Pure Validation
│   │   │   ├── types.ts
│   │   │   ├── validation.ts
│   │   │   └── typeXX-*.tsx
│   │   ├── edit/                   # Edit Facade / Wrapper
│   │   ├── actual/                 # Actual Component, Hook & Types (ยกเว้น TYPE 12)
│   │   ├── detail/                 # Detail View Component & Types
│   │   ├── approval/               # Approval View Component & Types
│   │   ├── hooks/                  # useTypeXXForm Hook
│   │   └── index.ts                # Public Barrel Exports
│   │
│   ├── shared/                     # Presentation & Shared Infrastructure
│   │   ├── form/                   # Form State, Hooks (useAllTypeForms), PlanWorkTypeRenderer, Shared Types
│   │   ├── actual-view/            # Actual Orchestrator (useActualOrchestrator), Result Section, Image Utils
│   │   ├── detail-view/            # Read-Only Detail View & Drawer
│   │   ├── approve-view/           # Approval Detail View & Queue
│   │   └── budget/                 # Shared Budget Hook & Section
│   │
│   └── promotional-materials/      # หน้าจอจัดการสื่อส่งเสริมการขาย (CRUD Master)
│
├── ui/                             # Module-specific Reusable UI Components
│   ├── activity-status-badge.tsx
│   └── form-action-buttons.tsx
│
├── types/                          # Module Global Types
├── constants.ts                    # Work Types, Lists & Configuration Constants
├── index.ts                        # Module Public API & Exports
└── README.md                       # Module Documentation Guide
```

---

## 🎯 14 Work Types Specification (TYPE 1 – TYPE 14)

ระบบรองรับประเภทงานทั้งหมด 14 ประเภทตามมาตรฐานสถาปัตยกรรม:

| Work Type Code | ชื่อประเภทงาน (Thai Label) | มีผลงานจริง (Actual) | มีการเบิกยา (Withdrawal) | หมายเหตุทางสถาปัตยกรรม |
| :--- | :--- | :---: | :---: | :--- |
| `TYPE_1` | เข้าพบร้านค้า / Key Farmer | ✅ | ❌ | แผน/ผลการเข้าพบ, แนะนำสินค้า, โอกาสการขาย |
| `TYPE_2` | ติดตามผลการใช้สินค้า | ✅ | ❌ | Multi-store / Multi-product follow-up |
| `TYPE_3` | เสนอขายสินค้า | ✅ | ❌ | Target vs Actual Sales รายสินค้า, เหตุผลที่ปิดไม่ได้ |
| `TYPE_4` | วางบิล / เก็บเงิน | ✅ | ❌ | ยอดเก็บเงิน, รูปถ่ายหลักฐานการชำระ |
| `TYPE_5` | สำรวจตลาดของคู่แข่ง | ✅ | ❌ | สำรวจราคา, โปรโมชั่น, รูปถ่ายป้ายราคา/ชั้นวางสินค้า |
| `TYPE_6` | ตรวจสอบเรื่องร้องเรียน / แก้ปัญหา | ✅ | ❌ | ปัญหาที่พบ, แนวทางแก้ไข, สถานะการจัดการ |
| `TYPE_7A` | ทำแปลงสาธิต (เริ่มทำแปลงใหม่) | ✅ | ❌ | สร้าง DemoPlot ใหม่, วันที่ปลูก, สภาพแปลง, รูปภาพ |
| `TYPE_7B` | ติดตามแปลงสาธิต (ตรวจแปลงเดิม) | ✅ | ✅ | ตรวจแปลงเดิม (DemoPlotVisit), Timeline ประวัติ, ปิดแปลง |
| `TYPE_8` | จัดประชุม (Meeting) | ✅ | ❌ | Target Farmer/Dealer, ยอดขาย/จอง, รูปภาพ 2 กลุ่ม |
| `TYPE_9` | จัดกิจกรรมหน้าร้าน (Store Event) | ✅ | ❌ | เป้าหมายยอดขาย, ยอดขายจริง, รูปภาพกิจกรรม |
| `TYPE_10` | จัดงาน Field Day | ✅ | ❌ | เกษตรกรเป้าหมาย, จัดประชุมภาคสนาม, ยอดขาย/จอง |
| `TYPE_11` | ตรวจเช็กสต็อกหน้าร้าน (Stock Check) | ✅ | ❌ | ตรวจสต็อกสินค้า, วันหมดอายุ, โอกาสสั่งซื้อซ้ำ |
| `TYPE_12` | ทัวร์ (Tour) | ❌ *(No Actual)* | ❌ | ทัวร์กลาง / ทัวร์ร้านค้า, กำหนดแผนงานล่วงหน้าเท่านั้น |
| `TYPE_13` | ฉีดแปลงแฮตแทค (Hattack Plot Spraying) | ✅ | ✅ | Multi-plot Spraying (1–10 แปลง), รอบการฉีด, รูปก่อน-หลัง |
| `TYPE_14` | ติดตามแปลงแฮทแทค (Hattack Follow-up) | ✅ | ✅ *(Supplemental)* | ตรวจแปลงเดิม, ยา 3 กลุ่ม (A/B/C), Workflow เบิกยาเพิ่ม |

---

## 🔄 Data Flow ของ Module

### 1. Planned Activity Flow (สร้าง/แก้ไขแผนงานล่วงหน้า)

```text
PlannedActivityForm (features/planned/)
       ↓
useAllTypeForms & PlanWorkTypeRenderer (features/shared/form/)
       ↓ Pure Validation (create/validation.ts)
submitActivityPlanAction / updateActivityPlanAction (server/actions.ts)
       ↓
ActivityPlanRepository (infrastructure/)
       ↓
PostgreSQL Transaction (activity_plans, activity_plan_stores, activity_plan_products, etc.)
       ↓
Revalidate & Redirect to Detail View
```

### 2. Unplanned Activity Flow (บันทึกกิจกรรมย้อนหลัง)

```text
UnplannedActivityForm (features/unplanned/)
       ↓
useAllTypeForms & PlanWorkTypeRenderer (features/shared/form/)
       ↓ Pure Validation (create/validation.ts)
submitUnplannedActivityAction (server/actions.ts)
       ↓
ActivityPlanRepository (infrastructure/)
       ↓
PostgreSQL Transaction (บันทึก Plan + บันทึก Actual Outcome ทันที)
```

### 3. Actual Result Recording Flow (บันทึกผลงานจริง)

```text
ActivityPlanActualView (features/shared/actual-view/)
       ↓
useActualOrchestrator & Type-Specific Actual States
       ↓ (Multi-round Spraying / Group A-B-C / Image Uploads)
recordActivityResultAction (server/actions.ts)
       ↓
ActivityPlanRepository (infrastructure/)
       ↓
PostgreSQL Transaction (activity_results, activity_attachments, demo_plot_visits)
```

---

## 🗄️ โครงสร้างฐานข้อมูล (Database Schema)

### GROUP 1: Master / Lookup
1. **`activity_types`:** Master Types (`TYPE_1`–`TYPE_14`) พร้อม Code, Name, ShortName, SortOrder
2. **`promotional_materials`:** Master สื่อส่งเสริมการขาย (Full CRUD)

### GROUP 2: Plan Transactions (Normalized Relational)
3. **`activity_plans`:** หัวเรื่องแผนงาน (`plan_no`, `plan_type`: `PLANNED` | `UNPLANNED`, `start_date`, `end_date`, `province`, `district`, Budget Variance)
4. **`activity_plan_work_types`:** ประเภทงานที่เลือกในแผนงาน (Source of Truth)
5. **`activity_plan_stores`:** ร้านค้าเป้าหมายในแผนงาน (FK: `store_id` → `Customer.id`)
6. **`activity_plan_products`:** สินค้าเป้าหมายในแผนงาน (FK: `product_id` → `Product.id`)
7. **`activity_plan_tours`:** รายละเอียดทัวร์ของ TYPE 12 (`tour_type`, `tour_size`, `country`, `store_id`, `destination`)
8. **`activity_helpers`:** พนักงานช่วยงาน
9. **`activity_plan_type_7a` & `activity_plan_type_7a_products`:** ตารางเก็บข้อมูลเฉพาะของ TYPE_7A (ทำแปลงสาธิตใหม่)
10. **`activity_plan_type_7b`, `activity_plan_type_7b_plots`, `activity_plan_type_7b_products`:** ตารางเก็บข้อมูลเฉพาะของ TYPE_7B (ติดตามแปลงสาธิต)
11. **`activity_plan_type_13`, `activity_plan_type_13_plots`, `activity_plan_type_13_products`:** ตารางเก็บข้อมูลเฉพาะของ TYPE_13 (ฉีดแปลงแฮตแทค Multi-plot 1–10 แปลง)
12. **`activity_plan_type_14`, `activity_plan_type_14_plots`, `activity_plan_type_14_products`:** ตารางเก็บข้อมูลเฉพาะของ TYPE_14 (ติดตามแปลงแฮทแทค)

### GROUP 3: Demo Plot Master & Life Cycle
13. **`demo_plots`:** Master Entity ของแปลงสาธิตและแปลงแฮตแทค
14. **`demo_plot_visits`:** ประวัติการเข้าตรวจแปลงแต่ละครั้ง (Timeline Visit History)

### GROUP 4: Workflow & Approvals
15. **`activity_approval_logs`:** ประวัติการอนุมัติ 5-Step Workflow
13. **`supplemental_drug_withdrawals`:** คำขอเบิกยาเพิ่มเติมหน้างาน (TYPE 14)

### GROUP 5: Post-Activity Results
14. **`activity_results`:** ผลการปฏิบัติงานจริง (1:1 กับ `activity_plans`)
15. **`activity_result_sale_items`**, **`activity_result_stock_items`**, **`activity_result_survey_items`**, **`activity_result_demo_items`**
16. **`activity_attachments`:** รูปภาพและเอกสารแนบแยกตามประเภทงานและรอบการปฏิบัติงาน

---

## 🔄 ลำดับขั้นตอนการอนุมัติ 5 ขั้นตอน (5-Step Approval Flow)

1. **บันทึกแผนงาน:** สร้างร่างกิจกรรมเป็น `DRAFT` หรือ `WAITING_FOR_CORRECTION`
2. **ตรวจสอบสายงาน (Line Approval):** วิ่งผ่านห่วงโซ่ผู้จัดการ `managerId` ตามระดับตำแหน่ง
3. **อนุมัติงบประมาณ (Budget Approval):** อนุมัติงบส่งเสริมการขาย / งบการตลาด / ผจก.ฝ่ายขาย
4. **อนุมัติคนช่วยงาน (Helper Approval):** ส่งคำขออนุญาตไปยังผู้จัดการแผนกของพนักงานช่วยงาน
5. **อนุมัติเสร็จสิ้น:** ระบบเปลี่ยนสถานะเป็น `APPROVED` และส่งการแจ้งเตือนอัตโนมัติ

---

## 📝 บันทึกการปรับปรุงสถาปัตยกรรมระบบ (Architecture Modernization Log)

### 2026-10-01: Modular Architecture Standardization & Planned / Unplanned Separation
- **Planned vs Unplanned Separation:**
  - แยกหน้าจอและ State Management ระหว่าง `features/planned/` และ `features/unplanned/` อย่างเด็ดขาด
- **TYPE 1 – TYPE 14 Standardization:**
  - จัดโครงสร้าง 14 Work Types ให้มีมาตรฐานเดียวกัน (6 Sub-folders: `shared/`, `create/`, `edit/`, `actual/`, `detail/`, `approval/`, `hooks/`)
  - สกัด Pure Validation Function แยกจาก React Components
  - แยก TYPE 7A (ทำแปลงสาธิต) และ TYPE 7B (ติดตามแปลงสาธิต) ออกเป็นอิสระ
  - กำหนดให้ TYPE 12 (ทัวร์) เป็น No Dedicated Actual ตาม Business Requirement
  - บูรณาการ TYPE 13 (Multi-plot Spraying & Drug Withdrawal) และ TYPE 14 (Multi-round Follow-up & Supplemental Drug Withdrawal)
- **Final Cleanup:**
  - ลบโฟลเดอร์ Legacy Shims (`features/form/`, `features/actual-view/`) ออกอย่างปลอดภัย
  - ปรับ Canonical Import Paths ทั่วทั้งโปรเจกต์สู่ `@/modules/activity-plans/features/shared/...` และ `@/modules/activity-plans/features/type-X/...`
