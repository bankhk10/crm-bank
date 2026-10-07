# Activity Plans Documentation

> **Module**: `modules/activity-plans/`  
> **Domain**: แผนงานและผลการปฏิบัติงานของทีมขาย/ส่งเสริมการเกษตร (Trip Plan)  
> **Status**: Active Standard (Standardized Modular & Relational Architecture)

---

## 📚 Document Index

| เอกสาร | หมวดหมู่ | คำอธิบาย |
|---|:---:|---|
| [architecture.md](./architecture.md) | **Architecture** | สถาปัตยกรรมข้อมูล Activity Plans, 14 Work Types (TYPE 1 – TYPE 14), Modular Features, Pure Validation & Data Normalization |
| [audit/data-flow-audit.md](./audit/data-flow-audit.md) | **Audit** | การ Audit และ Data Flow ตั้งแต่ Form Creation → DB Transaction → Detail View → Actual Outcome (Historical Record) |
| [audit/post-implementation-audit.md](./audit/post-implementation-audit.md) | **Audit** | รายงานผลการตรวจสอบสถาปัตยกรรมหลังการ Rebuild Normalization Layers 1–4 (Historical Record) |

---

## 🎯 Architecture Summary

โมดูล Activity Plans ใช้สถาปัตยกรรม **Standardized Feature-Based Modular Architecture** ร่วมกับ **Normalized Relational Data Architecture** ครอบคลุม **14 Work Types (TYPE 1 – TYPE 14)**:

### 1. Modular Structure (`features/`)
- **`planned/`**: จัดการ Entry point, Multi-type Forms, Pre-calculated Budgets และ State Machine สำหรับแผนงานล่วงหน้า
- **`unplanned/`**: จัดการ Quick execution สำหรับกิจกรรมด่วน/นอกแผน พร้อมบันทึกผลจริงทันที
- **`type-1/` ถึง `type-14/`**: แยกแต่ละประเภทงานออกเป็น 6 สับโฟลเดอร์มาตรฐาน (`shared/`, `create/`, `edit/`, `actual/`, `detail/`, `approval/`) พร้อม **Pure Validation Layer** (`validation.ts`)
- **`shared/`**: คอมโพเนนต์และยูทิลิตี้ส่วนกลางที่แชร์ข้ามประเภทงาน

### 2. Plan Data (ข้อมูลแผนงาน)
- **ตารางหลัก:** `activity_plans`
- **ประเภทงาน (Source of Truth):** `activity_plan_work_types` (ผูกกับ Master `activity_types`)
- **ร้านค้าเป้าหมาย:** `activity_plan_stores` (FK: `store_id` → `Customer.id`)
- **สินค้าเป้าหมาย:** `activity_plan_products` (FK: `store_id`, `product_id` → `Product.id`)
- **ทัวร์ (TYPE 12 - No Actual):** `activity_plan_tours`
- **แปลงสาธิต (TYPE 7A):** เชื่อมโยงกับ `DemoPlot`
- **ผู้ช่วยงาน:** `activity_helpers` (FK: `employee_id` → `Employee.id`)
- **ประวัติการอนุมัติ:** `activity_approval_logs`

### 3. Actual Data (ข้อมูลผลงานจริง)
- **ตารางหลัก:** `activity_results` (1:1 ผูกกับ `activity_plans`)
- **ผลงานย่อยตามประเภทงาน:**
  - `activity_result_sale_items` (TYPE 3, 9, 10)
  - `activity_result_stock_items` (TYPE 11)
  - `activity_result_survey_items` (TYPE 5)
  - `activity_result_demo_items` (TYPE 7B DemoPlotVisit)
- **ไฟล์แนบ/รูปภาพ:** `activity_attachments`
- **ระบบยาและการติดตามเฉพาะทาง:** Drug Withdrawal Synthesis (TYPE 13) และ Supplemental Drug Withdrawal (TYPE 14)

---

## 🔗 Related References
- Root Module Documentation: [modules/activity-plans/README.md](../README.md)
- Global Architecture: [docs/ARCHITECTURE.md](../../../docs/ARCHITECTURE.md)
- Global Data Model: [docs/DATA_MODEL.md](../../../docs/DATA_MODEL.md)
- Global Coding Standards: [docs/CODING_STANDARDS.md](../../../docs/CODING_STANDARDS.md)
