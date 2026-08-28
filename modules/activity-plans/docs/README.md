# Activity Plans Documentation

> **Module**: `modules/activity-plans/`  
> **Domain**: แผนงานและผลการปฏิบัติงานของทีมขาย/ส่งเสริมการเกษตร (Trip Plan)  
> **Status**: Active Standard (Normalized Relational Architecture)

---

## 📚 Document Index

| เอกสาร | หมวดหมู่ | คำอธิบาย |
|---|:---:|---|
| [architecture.md](./architecture.md) | **Architecture** | สถาปัตยกรรมข้อมูล Activity Plans, 12 Work Types, Data Normalization & Relational Architecture |
| [audit/data-flow-audit.md](./audit/data-flow-audit.md) | **Audit** | การ Audit และ Data Flow ตั้งแต่ Form Creation → DB Transaction → Detail View → Actual Outcome (Focus TYPE_1) |
| [audit/post-implementation-audit.md](./audit/post-implementation-audit.md) | **Audit** | รายงานผลการตรวจสอบสถาปัตยกรรมหลังการ Rebuild Normalization Layers 1–4 |

---

## 🎯 Architecture Summary

โมดูล Activity Plans ใช้สถาปัตยกรรม **Normalized Relational Architecture** โดยแยก Plan Data และ Actual Data ออกจากกันอย่างเด็ดขาด:

### 1. Plan Data (ข้อมูลแผนงาน)
- **ตารางหลัก:** `activity_plans`
- **ประเภทงาน (Source of Truth):** `activity_plan_work_types` (ผูกกับ Master `activity_types`)
- **ร้านค้าเป้าหมาย:** `activity_plan_stores` (FK: `store_id` → `Customer.id`)
- **สินค้าเป้าหมาย:** `activity_plan_products` (FK: `store_id`, `product_id` → `Product.id`)
- **ทัวร์ (TYPE_12):** `activity_plan_tours`
- **ผู้ช่วยงาน:** `activity_helpers` (FK: `employee_id` → `Employee.id`)
- **ประวัติการอนุมัติ:** `activity_approval_logs`

### 2. Actual Data (ข้อมูลผลงานจริง)
- **ตารางหลัก:** `activity_results` (1:1 ผูกกับ `activity_plans`)
- **ผลงานย่อยตามประเภทงาน:** `activity_result_sale_items`, `activity_result_stock_items`, `activity_result_survey_items`, `activity_result_demo_items`
- **ไฟล์แนบ/รูปภาพ:** `activity_attachments`

---

## 🔗 Related References
- Global Architecture: [docs/ARCHITECTURE.md](../../../docs/ARCHITECTURE.md)
- Global Data Model: [docs/DATA_MODEL.md](../../../docs/DATA_MODEL.md)
- Global Coding Standards: [docs/CODING_STANDARDS.md](../../../docs/CODING_STANDARDS.md)
