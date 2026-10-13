# Activity Plans Documentation

> **Module**: `modules/activity-plans/`  
> **Domain**: แผนงานและผลการปฏิบัติงานของทีมขาย/ส่งเสริมการเกษตร (Trip Plan)  
> **Architecture Version**: 4.0.0 (Vertical Slice Architecture + Universal Strategy Registry)  
> **Status**: ACTIVE STANDARD (Single Source of Truth)

---

## 📚 Document Index

| เอกสาร | หมวดหมู่ | คำอธิบาย |
|---|:---:|---|
| [architecture.md](./architecture.md) | **Architecture** | สถาปัตยกรรมข้อมูล Activity Plans, 14 Work Types (TYPE 1 – TYPE 14) ตาม Vertical Slice Architecture, Universal Strategy Pattern & Relational Isolation |
| [audit/data-flow-audit.md](./audit/data-flow-audit.md) | **Audit** | การ Audit และ Data Flow ตั้งแต่ Form Creation → Universal Strategy → DB Transaction → Detail View → Actual Outcome |
| [audit/post-implementation-audit.md](./audit/post-implementation-audit.md) | **Audit** | รายงานผลการตรวจสอบสถาปัตยกรรมหลังการ Rebuild และ Refactor สู่ Vertical Slice Architecture |

---

## 🎯 Architecture Summary (v4.0.0)

โมดูล Activity Plans ใช้สถาปัตยกรรม **Vertical Slice Architecture** ร่วมกับ **Universal Strategy Pattern** และ **Normalized Relational Data Architecture** ครอบคลุม **14 Work Types (TYPE 1 – TYPE 14)**:

### 1. Modular Vertical Slices (`features/`)
- **`type-1/` ถึง `type-14/`**: แต่ละประเภทงานเป็น Self-Contained Vertical Slice ที่สมบูรณ์ในตัวเอง:
  - `application/`: Business Logic, Pure Validation Layer (`validation.ts`), Mappers, และ Strategy (`typeX.strategy.ts`)
  - `components/`: UI Components ประจำ Slice (`plan-card`, `plan-form`, `actual-form`, `detail-view`, `approval-card`)
  - `hooks/`: Form hooks & Execution State hooks (`use-typeX-form`, `use-typeX-actual-state`)
  - `types/`: Consolidated Type Definitions (Domain, Props, State)
  - `index.ts`: Client-safe Public Barrel Export (ไม่มีการรั่วไหลของ Server Strategy)
  - `README.md`: คู่มือประจำ Slice พร้อม Inbound & Outbound Dependencies Mapping
- **`planned/`**: Entry point สำหรับแผนงานล่วงหน้า (Multi-type Selection, State Machine, Calendar Sync)
- **`unplanned/`**: Quick execution สำหรับกิจกรรมนอกแผน (บันทึกผลจริงทันที)
- **`shared/`**: คอมโพเนนต์และยูทิลิตี้ส่วนกลางที่ประสานงานกับแต่ละ Slice (`form`, `actual-view`, `approve-view`, `detail-view`)

### 2. Application & Strategy Layer (`application/`)
- **Universal Strategy Registry (`strategies/type-registry.ts`)**: รวมศูนย์การจัดเก็บและเรียกใช้ Strategy ของทั้ง 14 Work Types (`WorkTypeStrategy`)
- **Validations (`validations.ts`)**: รวมศูนย์ Orchestration Schema ของระบบ พร้อม Re-export Domain Schemas จากแต่ละ Slice
- **Workflows (`activity-plan-flow.ts`)**: State Machine จัดการวงจรชีวิตของแผนงาน (DRAFT → PENDING → APPROVED / REJECTED / CORRECTION → COMPLETED / CANCELLED)

### 3. Infrastructure & Persistence Layer (`infrastructure/`)
- **`activity-plan.repository.ts`**: Core persistence สำหรับบันทึกแผนงาน โดย Delegate การทำงานเฉพาะทางของแต่ละ Type ไปที่ `strategy.savePlan`
- **`activity-result.repository.ts`**: Core persistence สำหรับผลการปฏิบัติงานจริง โดย Delegate ไปที่ `strategy.saveActual`
- **`activity-plan-include.ts`**: รวมศูนย์ Prisma Relation Include Tree ทั้งหมดในจุดเดียว ป้องกันโค้ดบวมและรักษา Type Inference 100%
- **`demo-plot.repository.ts`**: รวมศูนย์การจัดการแปลงสาธิต (General Demo Plots & Hattack Plots)
- **`employee-lookup.repository.ts` & `product-category.repository.ts`**: แยก Core Lookup Functions ออกจาก Main Repository อย่างเป็นสัดส่วน

---

## 🔗 Related References
- Root Module Documentation: [modules/activity-plans/README.md](../README.md)
- Global Architecture: [docs/ARCHITECTURE.md](../../../docs/ARCHITECTURE.md)
- Global Data Model: [docs/DATA_MODEL.md](../../../docs/DATA_MODEL.md)
- Global Coding Standards: [docs/CODING_STANDARDS.md](../../../docs/CODING_STANDARDS.md)
