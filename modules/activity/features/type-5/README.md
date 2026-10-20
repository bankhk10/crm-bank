# Activity Type 5 — สำรวจตลาดของคู่แข่ง / Competitor Market Survey (README)

> **Feature Slice**: `modules/activity/features/type-5`  
> **Standard Reference**: ออกแบบตามแนวทาง Vertical Slice Architecture อิงตามแม่แบบ Gold Standard ใน `TYPE_SLICE_BLUEPRINT.md`  
> **Parent Module**: `modules/activity`  
> **Database Authority**: `prisma/schema.prisma` (`ActivityPlanType5Target`, `ActivityResultSurveyItem`, พร้อม sync สู่ `ActivityPlanStore`, `ActivityPlanProduct`)  
> **Status**: Production Ready / Active (v1.0.0)

---

## 1. Overview

### 1.1 วัตถุประสงค์ของ Type 5
**Type 5 (สำรวจตลาดของคู่แข่ง / Competitor Market Survey)** มีวัตถุประสงค์เพื่อรองรับการปฏิบัติงานของพนักงานฝ่ายขายและพัฒนาตลาดในการลงพื้นที่สำรวจราคาสินค้า โปรโมชั่น และความเคลื่อนไหวของผลิตภัณฑ์คู่แข่งทางการค้า ณ ร้านค้าตัวแทนจำหน่าย:
1. กำหนดเป้าหมายร้านค้าและผลิตภัณฑ์ที่จะนำไปเปรียบเทียบล่วงหน้า (Store & Compared Product Targets)
2. บันทึกข้อมูลแบรนด์คู่แข่ง (Competitor Brand) และชื่อสินค้าคู่แข่งที่พบจริงหน้างาน
3. สำรวจราคาขายของคู่แข่งแยกตาม 4 ระดับราคามาตรฐาน:
   - **ราคาขายหน้าร้าน / ณ จุดขาย (POS Price)**
   - **ราคาขายให้ Dealer (Dealer Price)**
   - **ราคาขายให้ Subdealer (Subdealer Price)**
   - **ราคาขายให้เกษตรกร (Farmers Price)**
4. บันทึกจุดเด่น / จุดขายของสินค้าคู่แข่ง (Selling Points)
5. ถ่ายภาพหลักฐานภาคสนามแยกเป็น 2 หมวดหมู่:
   - **ภาพถ่ายขวดผลิตภัณฑ์ (Bottle Photos)** สูงสุด 2 ภาพ
   - **ภาพสื่อส่งเสริมการขาย (Promotional Media Photos)** สูงสุด 3 ภาพ

### 1.2 รูปแบบการทำงานที่รองรับ
1. **Planned (ในแผนงาน Trip Plan):** กำหนดเป้าหมายร้านค้าและผลิตภัณฑ์ที่ต้องการเปรียบเทียบล่วงหน้าผ่าน `Type5PlannedForm`
2. **Planned Actual (บันทึกผลงานตามแผน):** นำเป้าหมายเดิมมาบันทึกผลการสำรวจจริงผ่าน `Type5ActualForm` (แบรนด์คู่แข่ง, ราคา 4 ระดับ, จุดเด่น, ภาพถ่ายขวดและสื่อ)
3. **Detail View:** แสดงผลการสำรวจเปรียบเทียบในหน้ารายละเอียดแผนงานผ่าน `Type5DetailView` พร้อมระบบดูภาพขนาดใหญ่ (Lightbox)
4. **Approval View:** การ์ดสำหรับผู้บังคับบัญชาพิจารณาอนุมัติผ่าน `Type5ApprovalCard` (แสดงเป้าหมายก่อนเริ่มงาน หรือผลงานจริงเมื่อมีบันทึกเข้ามา)

---

## 2. Architecture & Directory Structure

```text
modules/activity/features/type-5/
├── index.ts                                    # Unified Public API Contract
├── README.md                                   # คู่มือทางเทคนิค (ไฟล์นี้)
│
├── shared/                                     # ส่วนที่ใช้ร่วมกันใน Type 5
│   ├── constants.ts                            # SURVEY_IMAGE_CATEGORIES
│   └── types.ts                                # CustomerOption, StoreOption, ProductOption, Type5ImageFile
│
└── planned/                                    # Sub-slice แผนงานและผลงานจริงในแผน
    ├── types/
    │   ├── planned.types.ts                    # Type5SurveyItem, Type5TargetItem, Type5PlanCardProps, Type5PlannedFormProps
    │   └── actual.types.ts                     # Type5SurveyRecord, Type5ActualFormProps, Type5DetailViewProps, Type5ApprovalCardProps
    ├── application/
    │   ├── planned-validation.ts               # validateType5FormItems, type5SurveyItemSchema
    │   ├── planned-mapper.ts                   # extractType5PlanTargets, hydrateType5PlannedData, mapType5FormToPayload, mapType5ToSectionItems
    │   ├── actual-validation.ts                # validateType5Actual, type5SurveyRecordSchema
    │   └── actual-mapper.ts                    # parseType5ActualResult
    ├── hooks/
    │   ├── use-type5-planned-form.ts           # Hook จัดการสถานะฟอร์มในแผน (เพิ่ม/ลบร้านค้า, สินค้าเปรียบเทียบ)
    │   └── use-type5-actual.ts                 # Hook จัดการผลงานจริง (ราคา 4 ระดับ, อัปโหลดรูปภาพขวดและสื่อ)
    ├── infrastructure/
    │   └── type5-planned.strategy.ts           # Native Strategy (Dual Persistence & Atomic Transaction)
    └── components/
        ├── type5-planned-form.tsx              # ฟอร์มสร้าง/แก้ไขแผนงาน Type 5 (Type5PlannedForm / alias: Type5PlanForm, Type5Survey)
        ├── type5-plan-card.tsx                 # การ์ดสรุปเป้าหมายสำรวจตามแผน
        ├── type5-actual-form.tsx               # ฟอร์มบันทึกผลงานจริงตามแผน (Actual Form)
        ├── type5-detail-view.tsx               # การ์ดแสดงผลเปรียบเทียบเป้าหมาย vs ผลสำรวจจริง
        └── type5-approval-card.tsx             # การ์ดสำหรับหน้าพิจารณาอนุมัติ
```

---

## 3. Database Schema & Data Mapping

### 3.1 ตารางฐานข้อมูลที่เกี่ยวข้อง
1. **เป้าหมายสำรวจตลาด Type 5 (Dedicated Table):** `ActivityPlanType5Target`
2. **ผลการสำรวจคู่แข่งจริง (Actual Outcome Table):** `ActivityResultSurveyItem`
3. **Generic Tables Sync (Dual Persistence):**
   - `ActivityPlanStore`: บันทึก `storeId`, `storeName`, `workTypeCode: "TYPE_5"`
   - `ActivityPlanProduct`: บันทึก `storeId`, `productId`, `productName`, `workTypeCode: "TYPE_5"`
   - `ActivityPlanAttachment`: บันทึกรูปภาพหมวด `SURVEY_BOTTLE` และ `SURVEY_PROMO_MATERIAL` ผูก `surveyItemId`

---

## 4. Integration with Views & Orchestrators

| จุดเชื่อมต่อ (Integration Point) | ไฟล์เป้าหมาย (Target File) | สิ่งที่เชื่อมต่อ (Integration Content) |
|---|---|---|
| **Strategy Registry** | `modules/activity/infrastructure/strategy.registry.ts` | ลงทะเบียน `type5PlannedStrategy` ใน `WORK_TYPE_STRATEGY_REGISTRY` |
| **Target Registry** | `modules/activity/domain/summary/plan-targets-registry.ts` | ลงทะเบียน `extractType5PlanTargets` ใน `TARGET_EXTRACTORS` |
| **Planned Form View** | `modules/activity/views/planned/components/planned-activity-form.tsx` | ผูก `useType5PlannedForm` และเรนเดอร์ `Type5PlannedForm` |
| **Actual View** | `modules/activity/views/actual/activity-plan-actual-view.tsx` & `actual-work-type-list.tsx` | ผูก `useType5Actual`, validate, hydrate, อัปโหลดภาพ และเรนเดอร์ `Type5ActualForm` |
| **Detail View** | `modules/activity/views/detail/components/detail-work-type-list.tsx` | เรนเดอร์ `Type5DetailView` พร้อมแสดงราคา 4 ระดับและ Lightbox ภาพถ่าย |
| **Approval View** | `modules/activity/views/approvals/components/approval-work-type-list.tsx` | เรนเดอร์ `Type5ApprovalCard` หรือ `Type5DetailView` ตามสถานะ |

---

## 5. Verification & Quality Assurance

- **TypeScript Compilation:** ตรวจสอบความถูกต้องด้วย `npx tsc --noEmit` โดยมี Error = 0
- **Decoupling Guarantee:** ตัดขาดจาก `@/modules/activity-plans` 100%
- **Multi-Level Price Structure:** รองรับการบันทึกราคาครบทั้ง 4 ระดับ (POS, Dealer, Subdealer, Farmer)
