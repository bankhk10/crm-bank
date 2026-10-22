# Activity Type 7A — จัดทำแปลงสาธิต / Demo Plot Establishment (README)

> **Feature Slice**: `modules/activity/features/type-7a`  
> **Standard Reference**: ออกแบบตามแนวทาง Vertical Slice Architecture อิงตามแม่แบบ Gold Standard Type 1  
> **Parent Module**: `modules/activity`  
> **Database Authority**: `prisma/schema.prisma` (`DemoPlot`, `DemoPlotIrrigation`, `DemoPlotExternalProduct`, `DemoPlotProduct`, `DemoPlotVisit`, `ActivityPlanType7a`, `ActivityPlanType7aProduct`, `ActivityResultDemoItem`, `ActivityAttachment`, พร้อม sync สู่ `ActivityPlanStore`, `ActivityPlanProduct`)  
> **Status**: Production Ready / Active Reference (v1.8.0 — Updated 2026-10-22)

---

## 1. Overview

### 1.1 วัตถุประสงค์ของ Type 7A
**Type 7A (จัดทำแปลงสาธิต / Demo Plot Establishment)** มีวัตถุประสงค์เพื่อรองรับการปฏิบัติงานของเจ้าหน้าที่พัฒนาตลาดและนักวิชาการเกษตร (Market Development Representatives / Technical Agronomists / Promoters) ในการจัดตั้งแปลงสาธิตเชิงประจักษ์ใหม่ร่วมกับร้านค้าตัวแทนจำหน่ายและเกษตรกรชั้นนำ:
1. กำหนดเป้าหมายจัดตั้งแปลงสาธิตใหม่ล่วงหน้า พร้อมสร้างระเบียนแปลงหลัก (`DemoPlot`) ที่มีรหัสแปลงมาตรฐาน (`DPYYMMXXXX`) โดยอัตโนมัติ
2. บันทึกข้อมูลแปลงสาธิตและเกษตรกรเจ้าของแปลง (ชื่อแปลง, เจ้าของแปลง, ร้านค้าตัวแทนจำหน่ายที่ร่วมโครงการ, พิกัดแปลง GPS และขนาดพื้นที่)
3. ระบุชนิดพืชและเป้าหมายการทดสอบ (หมวดพืช, ชื่อพืช, วัตถุประสงค์การทดลอง, วันที่ปลูก และกำหนดการฉีดพ่น)
4. วางแผนรายการผลิตภัณฑ์และจำนวนสินค้าตัวอย่างที่จะนำไปทดสอบสาธิต (`demoProducts` / `products`)
5. บันทึกผลการจัดทำแปลงจริงหน้างาน (Actual Outcome) ครบ 7 หมวดหมู่:
   - **เกษตรกรเจ้าของแปลงและพิกัดแปลง:** กรองเกษตรกรตามจังหวัดที่เลือก หรือบันทึกเกษตรกรนอกระบบ (ที่อยู่ระดับจังหวัด/อำเภอ/ตำบล ผ่าน `ActivityAddressSelect`, ชื่อ-สกุล, เบอร์โทรศัพท์) พร้อมปักหมุดพิกัด GPS จริงหน้างาน (`ActivityGpsPicker`)
   - **ข้อมูลสภาพแปลงเริ่มต้น:** พืชประธาน, วิธีการทดลอง, ระบบน้ำ 8 ชนิด (`ActivityIrrigationCheckbox`), วันที่เริ่มปลูกจริง, วันที่ฉีดพ่นครั้งแรก, กำหนดพ่นครั้งต่อไป (`ActivityDatePicker`), อายุพืช (วัน/เดือน), ระยะการเจริญเติบโต และข้อมูลเพิ่มเติม
   - **วิธีการฉีดพ่นและยาภายนอก:** รองรับทั้งแบบฉีดเดี่ยว (Single) และผสมถัง (Tank-mixed) พร้อมตารางระบุยาภายนอก (บริษัท, ชื่อสินค้า, สารออกฤทธิ์, สูตร SL/SC/EC/อื่นๆ, อัตราการใช้)
   - **อุปกรณ์ที่ใช้ฉีดพ่น:** เครื่องพ่นสะพายหลัง, เครื่องพ่นปั๊มลากสาย, โดรนเพื่อการเกษตร, แอร์บัส/รถพ่นยา, หรืออื่นๆ ระบุ
   - **สินค้าที่เบิกตามแผน:** ดึงรายการยาตัวอย่างที่เบิกตามแผนมาแสดง พร้อมบันทึกจำนวนที่ใช้จริง (ขวด), ปริมาณที่ใช้เพิ่ม (ซีซี/กรัม) และอัตราการใช้
   - **สินค้าเพิ่มเติมในการปฏิบัติงาน:** บันทึกยาที่ใช้นอกเหนือจากแผน โดยเลือกสินค้าจากระบบ และบันทึกจำนวนจริง, ปริมาณเพิ่ม, อัตราการใช้
   - **ภาพถ่ายแปลงสาธิตเริ่มต้น:** อัปโหลดภาพถ่ายแปลงสาธิตเริ่มต้นสูงสุด 10 รูปต่อแปลง (หมวดหมู่ `PLOT`)

### 1.2 ขอบเขตของ Type 7A
- **กลุ่มเป้าหมายที่รองรับ:**
  - **ชื่อ ร้านค้า Dealer (`storeId` / `ownerName`):** เลือกเฉพาะร้านค้าตัวแทนจำหน่ายหลัก (`type="DEALER"`) ที่เข้าร่วมโครงการแปลงสาธิต พร้อมซิงค์จังหวัดและอำเภออัตโนมัติ
- **การจำแนกหมวดพืช ชื่อพืช ขนาดแปลง และวัตถุประสงค์ (Crop, Size & Objectives):**
  - **หมวดพืช (`CROP_CATEGORIES`):** มี 3 ตัวเลือก ได้แก่ `ผักและพืชล้มลุก`, `พืชไร่`, `พืชสวน`
  - **ชื่อพืชตามหมวดพืช (`CROP_NAMES_BY_CATEGORY`):**
    1. ถ้าเลือก **`ผักและพืชล้มลุก`**: ตัวเลือกมี `คะน้า`, `กะหล่ำปลี`, `พริก`, `ผักและพืชล้มลุกอื่นๆ` (หากเลือก `ผักและพืชล้มลุกอื่นๆ` จะแสดงช่อง **`ระบุชื่อพืชเพิ่มเติม *`** เก็บใน `customCropName`)
    2. ถ้าเลือก **`พืชไร่`**: ตัวเลือกมี `ข้าว`, `อ้อย`, `ยางพารา`, `พืชไร่อื่นๆ` (หากเลือก `พืชไร่อื่นๆ` จะแสดงช่อง **`ระบุชื่อพืชเพิ่มเติม *`** เก็บใน `customCropName`)
    3. ถ้าเลือก **`พืชสวน`**: ตัวเลือกมี `ทุเรียน`, `ชมพู่`, `ยางพารา`, `พืชสวนอื่นๆ` (หากเลือก `พืชสวนอื่นๆ` จะแสดงช่อง **`ระบุชื่อพืชเพิ่มเติม *`** เก็บใน `customCropName`)
  - **ขนาดแปลงตามหมวดพืช (`areaRai` vs `treeCount`):**
    - หากเลือกหมวดพืชเป็น **`พืชสวน`**: แสดงช่อง **`จำนวนต้น *`** (`treeCount`)
    - หากเลือกหมวดพืชเป็น **`ผักและพืชล้มลุก`** หรือ **`พืชไร่`**: แสดงช่อง **`พื้นที่ (ไร่) *`** (`areaRai`)
  - **วัตถุประสงค์การจัดทำแปลง (`objective`):** ช่องกรอกข้อความอิสระ (Free-text `ActivityInput`) ให้พิมพ์ระบุเอง
  - **สินค้าที่นำไปทดสอบสาธิต (`demoProducts` / `products`):** มีตัวเลือก **`หมวดสินค้า`** (`categoryId` จาก `ProductCategory`) ก่อน แล้วช่อง **`เลือกสินค้า`** (`ActivityProductSelect`) จะกรองเฉพาะสินค้าที่อยู่ในหมวดสินค้านั้น
- **ระบบออกรหัสแปลงสาธิตอัตโนมัติ (Automated DemoPlot Code Generation):**
  - สร้างรหัสแปลงรูปแบบ `DPYYMMXXXX` (เช่น `DP26100001`) ผ่านฟังก์ชัน `generateDemoPlotCode` โดยใช้ PostgreSQL Advisory Lock (`pg_advisory_xact_lock`) เพื่อรับประกันว่าจะไม่มีรหัสซ้ำกันแม้มีการบันทึกพร้อมกัน (Concurrent Requests)
- **การจัดเก็บข้อมูลและการส่งต่อสู่ Type 7B (Persistence & Type 7B Handover):**
  - **Master Table:** สร้างและอัปเดตระเบียนแปลงสาธิตหลักลงตาราง `DemoPlot` (`demo_plots`) มีสถานะเริ่มต้นเป็น `IN_PROGRESS`
  - **Dedicated Child Tables:** บันทึกระบบน้ำลง `DemoPlotIrrigation`, ยาภายนอกลง `DemoPlotExternalProduct`, สินค้าที่ใช้จริงลง `DemoPlotProduct` และบันทึกประวัติลงพื้นที่รอบแรกเป็น `DemoPlotVisit` (Visit #1, `workTypeCode = "TYPE_7A"`)
  - **Dedicated Plan Tables:** บันทึกรายละเอียดแผนงานลง `ActivityPlanType7a` (`activity_plan_type_7a`) และรายการสินค้าลง `ActivityPlanType7aProduct` (`activity_plan_type_7a_products`)
  - **Generic Tables Sync:** ซิงค์สำเนาแปลงลง `ActivityPlanStore` และสินค้าตัวอย่างลง `ActivityPlanProduct` (`workTypeCode = "TYPE_7A"`) เพื่อให้ปฏิทินงาน รายงานภาพรวม และระบบเดิมทำงานร่วมกันได้อย่างสมบูรณ์
  - **Type 7B Integration:** เมื่อจัดทำแปลงสำเร็จ โมดูล Type 7B (ติดตามแปลงสาธิต) สามารถดึงข้อมูลแปลงนี้ขึ้นมาติดตามต่อในรอบที่ 2..N ได้ทันทีผ่าน `findMasterDemoPlots()` และ `getAvailableDemoPlots()`
  - **Actual Outcome Tables:** บันทึกผลการใช้สินค้าตัวอย่างลง `ActivityResultDemoItem` (`activity_result_demo_items`) และรูปภาพลง `ActivityAttachment` (`category = "PLOT"`, สูงสุด 10 รูป)

### 1.3 รูปแบบการทำงานที่รองรับ
1. **Planned (ในแผนงาน Trip Plan):** กำหนดเป้าหมายแปลงสาธิต ร้านค้า เกษตรกร ชนิดพืช และสินค้าตัวอย่างล่วงหน้า ส่งขออนุมัติตามสายงาน
2. **Planned Actual (บันทึกผลงานตามแผน):** เมื่อแผนได้รับอนุมัติ นำแผนเดิมมารายงานผลการจัดตั้งแปลงจริง ปักหมุด GPS ยืนยันเกษตรกร ระบุสภาพแปลงและระบบน้ำ บันทึกการใช้สินค้าจริง และอัปโหลดภาพถ่ายแปลงเริ่มต้นสูงสุด 10 รูป
3. **Unplanned (กิจกรรมนอกแผน 2-in-1):** รองรับกรณีเข้าจัดทำแปลงสาธิตหน้างานทันที สามารถกรอกข้อมูลแปลง เกษตรกร ชนิดพืช พิกัด GPS สินค้าตัวอย่าง และถ่ายรูปแปลงสาธิตจบในฟอร์มเดียว พร้อมสร้าง `DemoPlot` และแผนงานสถานะ `COMPLETED` ทันที
4. **Detail View:** แสดงข้อมูลแปลงสาธิตเต็มรูปแบบผ่าน `Type7aDetailView` ทั้งชื่อแปลง เกษตรกร พิกัด ชนิดพืช สินค้าที่ใช้ และรูปถ่าย
5. **Approval View:** การ์ดสำหรับผู้บังคับบัญชาพิจารณาอนุมัติผ่าน `Type7aApprovalCard` สรุปจำนวนแปลง เกษตรกร และชนิดพืชที่ขอจัดทำ

---

## 2. Business Flows

### 2.1 Planned (สร้างและแก้ไขแผนงาน)
```mermaid
graph TD
    A["ผู้ใช้สร้างแผนงานใหม่"] --> B["กรอกข้อมูลทั่วไปและงบประมาณส่วนกลาง"]
    B --> C["เลือกประเภทงาน Type 7A: จัดทำแปลงสาธิต"]
    C --> D["กรอกฟอร์ม Type7aPlannedForm"]
    D --> E["ระบุชื่อแปลงสาธิต และเลือกร้านค้า Dealer (type=DEALER)"]
    E --> F["เลือกหมวดพืช (ผักและพืชล้มลุก / พืชไร่ / พืชสวน)"]
    F --> G["เลือกชื่อพืชตามหมวดพืช (หากเลือก อื่นๆ ให้ระบุชื่อพืชเพิ่มเติม)"]
    G --> H["ระบุ จำนวนต้น (กรณีพืชสวน) หรือ พื้นที่ไร่ (กรณีพืชไร่/ผัก) และพิมพ์วัตถุประสงค์"]
    H --> I["เลือกหมวดสินค้า แล้วเลือกสินค้าที่อยู่ในหมวดนั้น พร้อมระบุจำนวนที่ใช้"]
    I --> J{"ต้องการเพิ่มแปลงสาธิตอื่น?"}
    J -->|"เพิ่มแปลง"| D
    J -->|"เสร็จสิ้น"| K["กดบันทึกแบบร่าง DRAFT หรือ ส่งขออนุมัติ"]
    K --> L["type7aPlannedStrategy สร้าง DemoPlot (รหัส DPYYMMXXXX) และบันทึกลง ActivityPlanType7a"]
    L --> M["Sync สำเนาสู่ activity_plan_stores และ activity_plan_products (workTypeCode: TYPE_7A)"]
```

### 2.2 Planned Actual (บันทึกผลการปฏิบัติงานตามแผน)
```mermaid
graph TD
    A["เปิดหน้า Activity Plan Actual"] --> B["โหลดแผนงานและ Hydrate เป้าหมายเดิม extractType7aPlanTargets"]
    B --> C["เลือกสถานะผลการทำกิจกรรม: COMPLETED / PARTIAL / POSTPONED / CANCELLED"]
    C -->|"COMPLETED หรือ PARTIAL"| D["แสดงฟอร์ม Type7aActualForm ตามแปลงสาธิตเดิม"]
    D --> E["1. ระบุเกษตรกร (กรองตามจังหวัด หรือ เกษตรกรนอกระบบ) + ปักหมุด GPS"]
    E --> F["2. สภาพแปลงเริ่มต้น (พืชประธาน, วิธีทดลอง, ระบบน้ำ 8 ข้อ, วันที่ปลูก/พ่น, อายุพืช, ระยะโต)"]
    F --> G["3. วิธีการฉีดพ่น (Single/Tank-mixed) + ยาภายนอก + อุปกรณ์ที่ใช้พ่น"]
    G --> H["4. สินค้าที่ใช้จริง (ยาตามแผน + ยาเพิ่มเติม: จำนวนขวด, ปริมาณเพิ่ม ซีซี/กรัม, อัตราใช้)"]
    H --> I["5. ถ่ายภาพแปลงสาธิตเริ่มต้น (สูงสุด 10 รูป) ผ่าน ActivityPhotoUpload"]
    I --> J["กดบันทึกผลการปฏิบัติงาน"]
    J --> K["uploadImages() อัปโหลดภาพไปยัง Storage หมวดหมู่ PLOT"]
    K --> L["syncType7aActualData บันทึกลง DemoPlot, Irrigations, ExternalProducts, Products, DemoPlotVisit Round 1"]
    L --> M["บันทึกสำเนาลง activity_result_demo_items และ activity_attachments"]
    M --> N["แปลงพร้อมสำหรับให้ Type 7B ดึงไปติดตามต่อในรอบถัดไป"]
    C -->|"POSTPONED"| O["ระบุวันเวลานัดหมายใหม่และเหตุผลที่เลื่อน"]
    C -->|"CANCELLED"| P["ระบุเหตุผลการยกเลิก"]
```

### 2.3 Unplanned (กิจกรรมนอกแผน 2-in-1)
- ผู้ใช้งานเข้าหน้า `/activity-plans/unplanned/new`
- ฟอร์ม `Type7aUnplannedForm` ผสานทั้งส่วนตั้งต้นแปลง (ชื่อแปลง, เกษตรกร, ร้านค้า, ชนิดพืช, วัตถุประสงค์) และส่วนผลงานจริง (พิกัด GPS, สินค้าตัวอย่าง, และภาพถ่ายแปลงสาธิต) จบในฟอร์มเดียว
- เมื่อกดบันทึก ระบบตรวจสอบผ่าน `validateType7aUnplannedItems` และแปลง Payload ผ่าน `mapType7aUnplannedToPayload`
- `type7aUnplannedStrategy.savePlan()` จะสร้าง `DemoPlot` พร้อมรหัส `DPYYMMXXXX` อัตโนมัติ ซิงค์เข้า `activity_plan_stores` / `activity_plan_products` และบันทึกผลงานลง `activity_result_demo_items` ภายใน `$transaction` เดียวกัน โดยแผนงานมีสถานะเสร็จสิ้นสมบูรณ์

### 2.4 Detail and Approval (ดูรายละเอียดและพิจารณาอนุมัติ)
- **Detail View:** `DetailWorkTypeList` เรียกใช้ `Type7aDetailView` เพื่อแสดงข้อมูลแปลงสาธิตแต่ละแปลง ชนิดพืช เกษตรกร พื้นที่ พิกัด GPS สินค้าตัวอย่าง และภาพถ่ายแปลงเริ่มต้น
- **Approval View:** `ApprovalWorkTypeList` เรียกใช้ `Type7aApprovalCard` เพื่อให้หัวหน้างานพิจารณาอนุมัติการขอจัดตั้งแปลงสาธิต สรุปชื่อแปลง เกษตรกร พืชที่ทดสอบ และพื้นที่ไร่

---

## 3. Architecture

### 3.1 Folder Structure
```text
modules/activity/features/type-7a/
├── index.ts                                    # Unified Public API Contract (ส่งออกเฉพาะสิ่งที่ภายนอกต้องใช้)
├── README.md                                   # เอกสารคู่มือทางเทคนิค (ไฟล์นี้)
│
├── planned/                                    # Sub-slice: กิจกรรมในแผนงานและบันทึกผลตามแผน
│   ├── application/                            # Business Logic, Validation, Mappers
│   │   ├── actual-mapper.ts                    # แปลงผลงานจริง Form <-> DB/Payload (parseType7aActualResult)
│   │   ├── actual-validation.ts                # ตรวจสอบความถูกต้องของผลงานจริง (validateType7aActual)
│   │   ├── planned-mapper.ts                   # แปลงเป้าหมายในแผน Form <-> DB / Hydration (extractType7aPlanTargets, hydrateType7aPlannedData, mapType7aToSectionItems)
│   │   └── planned-validation.ts               # ตรวจสอบความถูกต้องของแผน (validateType7aFormItems)
│   ├── components/                             # UI Components ประจำ Type 7A ในแผน
│   │   ├── type7a-planned-form.tsx             # ฟอร์มสร้าง/แก้ไขแปลงสาธิตตามแผน
│   │   ├── type7a-actual-form.tsx              # ฟอร์มบันทึกผลจัดตั้งแปลงจริง (GPS + สินค้า + รูปถ่าย)
│   │   ├── type7a-plan-card.tsx                # การ์ดสรุปเป้าหมายแปลงสาธิตตามแผนงาน
│   │   ├── type7a-detail-view.tsx              # คอมโพเนนต์แสดงผลเต็มรูปแบบในหน้ารายละเอียด
│   │   └── type7a-approval-card.tsx            # การ์ดสรุปสำหรับหน้าพิจารณาอนุมัติ
│   ├── hooks/                                  # Custom State Hooks
│   │   ├── use-type7a-planned-form.ts          # จัดการ State แปลงสาธิตและสินค้าตามแผน
│   │   └── use-type7a-actual.ts                # จัดการ State ผลการจัดทำแปลงจริงและอัปโหลดรูปภาพ
│   ├── infrastructure/                         # Database Strategies & Repositories
│   │   ├── type7a.repository.ts                # generateDemoPlotCode, syncType7aPlots, findType7aByPlanId
│   │   └── type7a-planned.strategy.ts          # Strategy บันทึก/โหลดข้อมูล DemoPlot & ActivityResultDemoItem
│   └── types/                                  # Type Definitions ในแผน
│       ├── planned.types.ts                    # Type7aPlanItem, Type7aTargetItem, Type7aPlanCardProps ฯลฯ
│       └── actual.types.ts                     # Type7aActualRecord, Type7aActualFormProps, Type7aDetailViewProps ฯลฯ
│
├── unplanned/                                  # Sub-slice: กิจกรรมนอกแผน (2-in-1)
│   ├── application/                            # Logic และ Mappers กิจกรรมนอกแผน
│   │   ├── unplanned-mapper.ts                 # Hydration และ Data mapping นอกแผน (hydrateType7aUnplannedData, mapType7aUnplannedToPayload)
│   │   └── unplanned-validation.ts             # Validation กิจกรรมนอกแผน (validateType7aUnplannedItems)
│   ├── components/                             # UI Components กิจกรรมนอกแผน
│   │   └── type7a-unplanned-form.tsx           # ฟอร์ม 2-in-1 (ตั้งแปลง + บันทึกผลจริง + GPS + รูปถ่าย)
│   ├── hooks/                                  # Custom State Hooks
│   │   └── use-type7a-unplanned-form.ts        # จัดการ State แปลงสาธิตนอกแผน
│   ├── infrastructure/                         # Database Strategies นอกแผน
│   │   └── type7a-unplanned.strategy.ts        # บันทึกกิจกรรมนอกแผนลง Prisma ผสาน DemoPlot และผลงานจริง
│   └── types/                                  # Type Definitions นอกแผน
│       └── unplanned.types.ts                  # Type7aUnplannedItem, Type7aUnplannedFormProps
│
└── shared/                                     # ชิ้นส่วนที่ใช้ร่วมกันภายใน Feature Type 7A
    ├── constants.ts                            # CROP_CATEGORIES, PLOT_OBJECTIVES, IRRIGATION_METHODS, SPRAY_METHODS
    └── types.ts                                # CustomerOption, ProductOption, Type7aDemoProductItem, Type7aPlotInput, Type7aImageFile
```

### 3.2 Type 7A vs Shared Activity
| ความรับผิดชอบ | จัดการที่ Type 7A Feature (`features/type-7a`) | จัดการที่ Activity ส่วนกลาง (`ui/`, `views/`) |
| :--- | :--- | :--- |
| **ข้อมูลทั่วไป** | - | ชื่องาน, วันที่เริ่ม-สิ้นสุด, วัตถุประสงค์หลัก, ผู้ร่วมเดินทาง |
| **พื้นที่ & ทีมงาน** | - | จังหวัด, อำเภอ, ตำบล, พนักงานร่วมเดินทาง |
| **งบประมาณ** | - | งบเบิกสินค้าสาธิต, ค่าใช้จ่ายเดินทาง |
| **เป้าหมายแปลงสาธิต** | ชื่อแปลง, เกษตรกร, ร้านค้า, ชนิดพืช, พื้นที่ไร่, สินค้าตัวอย่าง | - |
| **ผลการจัดตั้งแปลงจริง** | พิกัดแปลง GPS, การใช้สินค้าจริง, เหตุผลการเปลี่ยน, รูปถ่ายแปลง | ผลสรุปภาพรวมแผน (สำเร็จ/เลื่อน/ยกเลิก) |
| **Database Persistence** | ตาราง `DemoPlot`, `ActivityPlanType7a`, `ActivityPlanType7aProduct`, `ActivityResultDemoItem`, sync `ActivityPlanStore`, `ActivityPlanProduct` | ตารางหลัก `ActivityPlan`, `ActivityPlanApprovalLog`, `ActivityAttachment` |

### 3.3 Dependency and Import Map
- **ทิศทางการเรียกใช้ (Allowed):**
  - `views/` ➔ เรียกใช้ ➔ `features/type-7a` (ผ่าน `index.ts` เท่านั้น)
  - `features/type-7a` ➔ เรียกใช้ ➔ `@/modules/activity/ui` (`ActivityInput`, `ActivityTextarea`, `ActivityCombobox`, `ActivityCustomerSelect`, `ActivityProductSelect`, `ActivityPhotoUpload`, `ActivityGpsPicker`)
  - `features/type-7a` ➔ เรียกใช้ ➔ `@/modules/activity/constants`
  - `features/type-7a` ➔ เรียกใช้ ➔ `@/modules/activity/types/strategy.interface`
  - `features/type-7a` ➔ เรียกใช้ ➔ `@/modules/activity/application/media/image-uploader` (`uploadActivityPlanImageGroup`, `deleteActivityPlanImagePaths`)
- **Server Actions & Database Flow:**
  - `views/` ➔ ส่งข้อมูลไปยัง ➔ Server Actions ใน `@/modules/activity/server/`:
    - `planned.actions.ts` (`createActivityPlanAction`, `updateActivityPlanAction`, `getActivityPlanAction`)
    - `unplanned.actions.ts` (`createUnplannedActivityAction`, `updateUnplannedActivityAction`, `getUnplannedActivityAction`)
    - `actual.actions.ts` (`recordActivityResultAction`)
  - Server Actions ➔ ทำงานร่วมกับ ➔ `@/modules/activity/infrastructure/strategy.registry` ➔ เรียกใช้ `type7aPlannedStrategy` / `type7aUnplannedStrategy` บันทึกลงตาราง Master (`DemoPlot`) และ Generic Tables ภายใน `$transaction`
- **สิ่งต้องห้าม (Strictly Forbidden):**
  - ❌ ภายนอก Import เจาะลึกเข้าไปในโฟลเดอร์ย่อย เช่น `features/type-7a/planned/components/...`
  - ❌ `features/type-7a` เรียกใช้ข้อมูลข้ามไปยัง `features/type-1` ถึง `type-6` หรือ `type-7b` ถึง `type-14`
  - ❌ Import ย้อนกลับไปยังโมดูลเก่า `@/modules/activity-plans/...` โดยเด็ดขาด

### 3.4 Entry Points and Public Exports
ไฟล์ [modules/activity/features/type-7a/index.ts](file:///d:/code/crm-bank/modules/activity/features/type-7a/index.ts) ทำหน้าที่เป็น **Single Public API Contract** สำหรับฝั่ง UI / Application โดยส่งออกเฉพาะ:
- **Components:** `Type7aPlannedForm` (`Type7aPlanForm`, `Type7NewDemo`, `EditType7aNewDemo`), `Type7aPlanCard`, `Type7aActualForm` (`ActualType7NewDemo`), `Type7aDetailView` (`DetailType7NewDemo`), `Type7aApprovalCard` (`ApprovalType7aDemo`), `Type7aUnplannedForm`
- **Hooks:** `useType7aPlannedForm` (`useType7aForm`), `useType7aActual`, `useType7aUnplannedForm`
- **Mappers & Hydrators:** `extractType7aPlanTargets`, `hydrateType7aPlannedData`, `mapType7aToSectionItems`, `parseType7aActualResult`, `hydrateType7aUnplannedData`, `mapType7aUnplannedToPayload`
- **Validators & Schemas:** `validateType7aFormItems`, `validateType7aActual`, `validateType7aUnplannedItems`
- **Constants & Types:** `WORK_TYPE_CODE`, `WORK_TYPE_NAME`, `CROP_CATEGORIES`, `CROP_NAMES_BY_CATEGORY`, `OTHER_CROP_OPTIONS`, `PLOT_OBJECTIVES`, `IRRIGATION_METHODS`, `SPRAY_METHODS`, `DEMO_PLOT_STATUSES`, `Type7aPlanItem`, `Type7aTargetItem`, `Type7aPlanCardTarget`, `Type7aPlanCardProps`, `Type7aPlannedFormProps`, `Type7aActualRecord`, `Type7aActualFormProps`, `Type7aDetailViewProps`, `Type7aApprovalCardProps`, `Type7aUnplannedItem`, `Type7aUnplannedFormProps`, `CustomerOption`, `ProductOption`, `ProductCategoryOption`, `Type7aDemoProductItem`, `Type7aPlotInput`, `Type7aImageFile`
- *(หมายเหตุ: `type7aPlannedStrategy` และ `type7aUnplannedStrategy` ถูกนำเข้าโดยตรงที่ `modules/activity/infrastructure/strategy.registry.ts` เพื่อแยกโค้ดฝั่ง Server/Database ออกจาก Client Bundle)*

---

## 4. File Responsibilities

### 4.1 Planned & Actual
- **`use-type7a-planned-form.ts`:** จัดการ State แปลงสาธิตในแผน (Array of `Type7aPlanItem`), รองรับการเพิ่มแปลง (`addType7aRow`), แก้ไขแปลง (`updateType7aRow`), ลบแปลง (`deleteType7aRow`), เพิ่มสินค้าตัวอย่างในแปลง (`addProductToDemoPlot`), และปรับปรุงสินค้าในแปลง
- **`type7a-planned-form.tsx`:** ฟอร์มสร้าง/แก้ไขแปลงสาธิตตามแผน แสดงการ์ดของแต่ละแปลง กรอกชื่อแปลง เกษตรกร เลือกร้านค้าตัวแทนจำหน่าย เลือกชนิดพืช วัตถุประสงค์ และเลือกสินค้าตัวอย่างผ่าน `ActivityProductSelect`
- **`type7a-plan-card.tsx`:** การ์ดสรุปเป้าหมายแปลงสาธิตตามแผน แสดงชื่อแปลง เกษตรกร พืชที่ทดสอบ และขนาดพื้นที่
- **`type7a-actual-form.tsx`:** ฟอร์มบันทึกผลการจัดทำแปลงจริงหน้างาน ปักหมุดพิกัด GPS ผ่าน `ActivityGpsPicker`, ยืนยันการใช้สินค้าตัวอย่าง, ระบุวิธีการฉีดพ่น, และอัปโหลดภาพถ่ายแปลงสาธิตเริ่มต้น (ไม่เกิน 5 รูป)
- **`use-type7a-actual.ts`:** จัดการ State ผลการจัดทำแปลงจริง, รองรับการ Hydrate ข้อมูลเดิม, อัปโหลดภาพถ่ายแปลงสาธิตหมวดหมู่ `PLOT`, และสร้าง Payload สำหรับบันทึกผล
- **`type7a-detail-view.tsx`:** การ์ดแสดงผลในหน้ารายละเอียด แสดงข้อมูลแปลงสาธิต เกษตรกร พิกัด ชนิดพืช และแกลเลอรีรูปถ่าย
- **`type7a-approval-card.tsx`:** การ์ดสำหรับหน้าพิจารณาอนุมัติของหัวหน้างาน สรุปจำนวนแปลงสาธิตและรายละเอียดเบื้องต้น
- **`type7a.repository.ts`:** ฟังก์ชันระดับล่างสำหรับฐานข้อมูล:
  - `generateDemoPlotCode`: สร้างรหัสแปลง `DPYYMMXXXX` ด้วย Advisory Lock
  - `syncType7aPlots`: สร้างระเบียน `DemoPlot` และ Dual-sync ไปยัง `ActivityPlanStore` และ `ActivityPlanProduct`
  - `findType7aByPlanId`: ดึงข้อมูลแปลงสาธิตตาม `activityPlanId`
- **`type7a-planned.strategy.ts`:** จัดการการตรวจสอบเงื่อนไข (`validatePlan`), บันทึกแผนงานและสร้าง `DemoPlot` (`savePlan`), บันทึกผลการใช้สินค้าลง `ActivityResultDemoItem` (`saveActual`), และโหลดข้อมูล (`loadPlan`)
- **`planned-mapper.ts`:** ดึงเป้าหมายจากแผน (`extractType7aPlanTargets`) และ Hydrate ข้อมูลเดิมสำหรับหน้าแก้ไข (`hydrateType7aPlannedData`)
- **`actual-mapper.ts`:** แปลงผลงานจริงจากฐานข้อมูลเข้าสู่โครงสร้าง `Type7aActualRecord` สำหรับ UI
- **`planned-validation.ts` & `actual-validation.ts`:** ตรวจสอบความถูกต้องของแผนงาน (`validateType7aFormItems`) และผลงานจริง (`validateType7aActual`)

### 4.2 Unplanned
- **`use-type7a-unplanned-form.ts`:** จัดการ State กิจกรรมนอกแผน 2-in-1 ที่รวมทั้งข้อมูลแปลงสาธิต พิกัด GPS สินค้าตัวอย่าง และภาพถ่ายหน้างาน
- **`type7a-unplanned-form.tsx`:** ฟอร์ม 2-in-1 สำหรับกิจกรรมนอกแผน แสดงข้อมูลการตั้งแปลง พืชที่ทดสอบ สินค้าตัวอย่าง พิกัด GPS และกล้องถ่ายภาพแปลงสาธิต
- **`unplanned-mapper.ts`:**
  - `hydrateType7aUnplannedData`: กู้คืนข้อมูลกิจกรรมนอกแผนเดิมเมื่อเปิดหน้าแก้ไข
  - `mapType7aUnplannedToPayload`: แปลงข้อมูลนอกแผนให้เป็นทั้ง `type7aPlots` (สำหรับสร้าง DemoPlot) และ `actualOutcome`
- **`unplanned-validation.ts`:** ตรวจสอบความถูกต้องของรายการนอกแผน (`validateType7aUnplannedItems`) ต้องระบุชื่อแปลง เกษตรกร และชนิดพืชครบถ้วน
- **`type7a-unplanned.strategy.ts`:** บันทึกทั้งการสร้าง `DemoPlot` และผลการจัดทำแปลงสาธิตพร้อมกันผ่าน `type7aPlannedStrategy.savePlan()` และ `type7aPlannedStrategy.saveActual()`

### 4.3 Shared Types and Constants
- **`shared/constants.ts`:** กำหนด `WORK_TYPE_CODE = "TYPE_7A"`, `CROP_CATEGORIES`, `PLOT_OBJECTIVES`, `IRRIGATION_METHODS`, `SPRAY_METHODS`, และ `DEMO_PLOT_STATUSES`
- **`shared/types.ts`:** กำหนดประเภทข้อมูล `CustomerOption`, `ProductOption`, `Type7aDemoProductItem`, `Type7aPlotInput`, `Type7aImageFile`

### 4.4 Shared UI and Views
- `planned-activity-form.tsx`, `unplanned-activity-form.tsx`, `activity-plan-actual-view.tsx`, `actual-work-type-list.tsx`, `detail-work-type-list.tsx`, และ `approval-work-type-list.tsx` ทำหน้าที่เป็น Orchestrators ในการเลือกเรนเดอร์และประมวลผล Type 7A ตามเงื่อนไข `isType7aActive`

---

## 5. Data Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as เจ้าหน้าที่พัฒนาตลาด
    participant Form as Type7aActualForm (UI)
    participant Hook as useType7aActual (Hook)
    participant Action as recordActivityResultAction
    participant Strategy as type7aPlannedStrategy
    participant Repo as type7a.repository
    participant DB as PostgreSQL (Prisma)

    User->>Form: ปักหมุด GPS / ยืนยันสินค้าตัวอย่าง / อัปโหลดภาพแปลง
    Form->>Hook: อัปเดต State ผ่าน setters
    User->>Form: กดปุ่ม "บันทึกผลการปฏิบัติงาน"
    Form->>Hook: uploadImages(planId, newlyUploadedUrls)
    Hook->>Hook: อัปโหลดภาพแปลงสาธิต (หมวดหมู่ PLOT) ได้ Permanent URLs
    Hook-->>Form: ได้รับ cleanImages
    Form->>Hook: buildPayload() ➔ สร้าง Payload
    Form->>Action: ส่ง Payload ไปยัง Server Action
    Action->>Strategy: saveActual(tx, resultId, actualData)
    Strategy->>DB: deleteMany() ลบผลงานเดิมใน activity_result_demo_items
    Strategy->>DB: createMany() บันทึกข้อมูลลง activity_result_demo_items
    DB-->>Strategy: บันทึกสำเร็จ (Commit)
    Strategy-->>Action: Success
    Action-->>Form: แสดง Toast "บันทึกผลเรียบร้อยแล้ว"
```

### 5.1 Create Planned (สร้างแผนใหม่)
1. `create-view.tsx` หรือ `planned-activity-form.tsx` เรียกใช้ `useType7aPlannedForm()`
2. ผู้ใช้ระบุข้อมูลแปลงสาธิต ชนิดพืช และสินค้าตัวอย่างใน `Type7aPlannedForm`
3. ผู้ใช้กดส่งขออนุมัติ ➔ รัน `validateType7aFormItems(type7a.type7aPlots)`
4. Map ข้อมูลเป็น `type7aPlots` ส่งไปยัง Server Action `createActivityPlanAction`
5. Server Action เรียก `type7aPlannedStrategy.savePlan()` ภายใน `$transaction`
6. Repository รัน `generateDemoPlotCode()` ได้รหัส `DPYYMMXXXX` ➔ สร้างระเบียนใน `DemoPlot` ➔ Dual-sync สำเนาลง `activity_plan_stores` และ `activity_plan_products`

### 5.2 Edit Planned (แก้ไขแผนงานเดิม)
1. `edit-view.tsx` ดึงข้อมูลแผนเดิมจากฐานข้อมูล
2. เรียก `hydrateType7aPlannedData(initialData)` เพื่อแปลงข้อมูลแปลงสาธิต
3. ส่งข้อมูลเข้า `useType7aPlannedForm({ initial })`
4. ฟอร์มแสดงข้อมูลเดิมพร้อมให้แก้ไข เพิ่ม หรือลบแปลงและสินค้าได้อย่างสมบูรณ์

### 5.3 Save Actual (บันทึกผลการปฏิบัติงานจริง)
1. `activity-plan-actual-view.tsx` รันกระบวนการบันทึกผล
2. ตรวจสอบความถูกต้องด้วย `validateType7aActual()`
3. เรียก `type7aActual.uploadImages(id, newlyUploadedUrls)` เพื่ออัปโหลดภาพแปลง ได้ URL ถาวร
4. เรียก `type7aActual.buildPayload()` เพื่อรวบรวมข้อมูลแปลงจริง
5. ส่ง Payload เข้า `recordActivityResultAction(id, payload)`
6. `type7aPlannedStrategy.saveActual()` ลบผลงานเก่าแล้วสร้างระเบียนใหม่ลงตาราง `activity_result_demo_items` และบันทึกรูปภาพลง `activity_attachments`

### 5.4 Load Actual (โหลดผลงานเดิมมาแสดงในหน้าบันทึกผล)
1. หน้า Actual ดึงข้อมูลแผนและผลงานเดิม
2. `extractType7aPlanTargets(plan)` แปลงเป้าหมายเดิมเข้าสู่ `targets`
3. เรียก `type7aActual.hydrate(plan, parsed, { t7a: extractedT7a.primary })`
4. ฟอร์มแสดงข้อมูลแปลง พืช พิกัด GPS สินค้า และรูปภาพที่เคยบันทึกไว้

### 5.5 Create/Edit Unplanned (กิจกรรมนอกแผน)
1. ผู้ใช้กรอกฟอร์ม `Type7aUnplannedForm` (ระบุชื่อแปลง เกษตรกร ชนิดพืช สินค้า พิกัด GPS และรูปถ่าย)
2. ตรวจสอบความถูกต้องด้วย `validateType7aUnplannedItems(type7a.items)`
3. แปลง Payload ผ่าน `mapType7aUnplannedToPayload(type7a.items)`
4. `type7aUnplannedStrategy.savePlan()` สร้างระเบียน `DemoPlot` และบันทึกผลตรวจลง `activity_result_demo_items` พร้อมกันใน `$transaction` เดียวกัน

### 5.6 Detail and Approval (การแสดงผลหน้ารายละเอียดและพิจารณาอนุมัติ)
1. โหลดข้อมูลแผนงานผ่าน Loader
2. ระบบตรวจจับประเภทงานว่าเป็น Type 7A ผ่าน `WORK_TYPE_STRATEGY_REGISTRY.TYPE_7A.hasData()`
3. หน้ารายละเอียดเรนเดอร์ `<Type7aDetailView />` พร้อมข้อมูลแปลงและรูปภาพ
4. หน้าอนุมัติเรนเดอร์ `<Type7aApprovalCard />` สรุปชื่อแปลง เกษตรกร และชนิดพืช

---

## 6. Data Models and Mapping

### 6.1 Database CRUD Matrix (สิทธิ์และการจัดการตารางในฐานข้อมูล)
| ตารางในฐานข้อมูล (`Prisma Model`) | Create (สร้าง) | Read (อ่าน/แสดงผล) | Update (แก้ไข) | Delete (ลบ) | หมายเหตุ |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`demo_plots`**<br>(`DemoPlot`) | `syncType7aPlots()` ใน `savePlan()` | หน้ารายการแปลงสาธิต, Detail / Actual | `syncType7aActualData()` ใน `saveActual()` | Cascade หรือ Soft-delete | ตารางหลัก Master Data แปลงสาธิต รหัส `DPYYMMXXXX` พร้อมฟิลด์พิกัด สภาพแปลง และเกษตรกร |
| **`demo_plot_irrigations`**<br>(`DemoPlotIrrigation`) | `syncType7aActualData()` ใน `saveActual()` | Actual / Detail / Type 7B | ลบและสร้างใหม่ตามแปลง (`deleteMany` + `createMany`) | Cascade เมื่อลบ `DemoPlot` | จัดเก็บระบบน้ำประจำแปลง เลือกได้มากกว่า 1 รูปแบบ (8 ตัวเลือกมาตรฐาน) |
| **`demo_plot_external_products`**<br>(`DemoPlotExternalProduct`) | `syncType7aActualData()` ใน `saveActual()` | Actual / Detail / Type 7B | ลบและสร้างใหม่ตามแปลง (`deleteMany` + `createMany`) | Cascade เมื่อลบ `DemoPlot` | จัดเก็บสารเคมีภายนอก/ยาคู่เปรียบเทียบกรณีฉีดพ่นแบบผสมถัง (Tank-mixed) |
| **`demo_plot_products`**<br>(`DemoPlotProduct`) | `syncType7aActualData()` ใน `saveActual()` | Actual / Detail / Type 7B | ซิงค์จำนวนเบิก ยอดใช้จริง ปริมาณเพิ่ม และสินค้าหน้างาน | Cascade เมื่อลบ `DemoPlot` | เก็บคลังสินค้าตัวอย่างประจำแปลง (ทั้งสินค้าตามแผนและสินค้าเพิ่มเติมหน้างาน) |
| **`demo_plot_visits`**<br>(`DemoPlotVisit`) | `syncType7aActualData()` ใน `saveActual()` (Visit #1) | หน้าไทม์ไลน์การตรวจแปลง / Type 7B | อัปเดตผลตรวจครั้งที่ 1 | Cascade เมื่อลบ `DemoPlot` | บันทึกประวัติการตรวจแปลงครั้งแรก (Baseline Visit) ส่งมอบฐานข้อมูลต่อเนื่องไปยัง Type 7B |
| **`activity_plan_type_7a`**<br>(`ActivityPlanType7a`) | Dedicated Plan Table | โหลดรายละเอียดแผน Type 7A | อัปเดตข้อมูลแผนแปลง | Cascade เมื่อลบ `ActivityPlan` | เก็บรายละเอียดเป้าหมายแผนแปลงสาธิต |
| **`activity_plan_type_7a_products`**<br>(`ActivityPlanType7aProduct`) | Dedicated Plan Table | รายการสินค้าตัวอย่างประจำแปลง | ลบและสร้างใหม่ตามแปลง | Cascade เมื่อลบ `ActivityPlanType7a` | เก็บสินค้าตัวอย่างประจำแผน |
| **`activity_result_demo_items`**<br>(`ActivityResultDemoItem`) | `saveActual()` ใน Actual/Unplanned | `plan.result.demoResults` | `deleteMany()` + `createMany()` ใน `saveActual()` | Cascade เมื่อลบ `ActivityResult` | เก็บผลการใช้สินค้าตัวอย่างและการทดสอบ |
| **`activity_plan_stores`**<br>(`ActivityPlanStore`) | Dual-write sync ใน `syncType7aPlots()` | Generic store queries | `deleteMany()` + `createMany()` (`workTypeCode: "TYPE_7A"`) | Cascade เมื่อลบ `ActivityPlan` | ซิงค์สำเนาเป้าหมายร้านค้า/แปลง |
| **`activity_plan_products`**<br>(`ActivityPlanProduct`) | Dual-write sync ใน `syncType7aPlots()` | Generic product queries | `deleteMany()` + `createMany()` (`workTypeCode: "TYPE_7A"`) | Cascade เมื่อลบ `ActivityPlan` | ซิงค์สำเนาสินค้าตัวอย่าง |
| **`activity_attachments`**<br>(`ActivityAttachment`) | Storage Upload + `saveActual()` | `plan.attachments` (หมวดหมู่ PLOT) | ลบรายการเก่าและสร้างใหม่ | Cascade เมื่อลบ `ActivityPlan` | เก็บล็อก URL ภาพถ่ายแปลงสาธิต (สูงสุด 10 รูป) |

### 6.2 Complete Field-to-Database Mapping (ตารางจับคู่ฟิลด์ครบถ้วนทุกจุด)
ไล่จาก **Form Field (UI) ➔ TypeScript Field ➔ Mapper / Hook ➔ Prisma Model ➔ DB Column Name ➔ Data Type**:

| Form Field (UI) | TypeScript Type Field | Mapper / Hook Handler | Prisma Model | DB Column Name | Data Type | Nullable? | Default |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **ชื่อแปลงสาธิต** | `plotName` / `name` | `syncType7aPlots` / `extractType7aPlanTargets` | `DemoPlot` / `ActivityPlanType7a` | `name` / `plot_name` | `VARCHAR` | No | - |
| **ชื่อ ร้านค้า Dealer** | `storeId`, `ownerName`, `farmerName` | `syncType7aPlots` / `extractType7aPlanTargets` | `DemoPlot` / `ActivityPlanType7a` | `customer_id` / `store_id`, `owner_name` | `VARCHAR` | Yes / No | `null` / `""` |
| **จังหวัด** | `province` | `syncType7aPlots` / `syncType7aActualData` | `DemoPlot` / `ActivityPlanType7a` | `province` | `VARCHAR` | Yes | `null` |
| **อำเภอ** | `district` | `syncType7aPlots` / `syncType7aActualData` | `DemoPlot` / `ActivityPlanType7a` | `district` | `VARCHAR` | Yes | `null` |
| **ตำบล** | `ownerSubdistrict` | `syncType7aActualData` | `DemoPlot` | `owner_subdistrict` | `VARCHAR` | Yes | `null` |
| **ชื่อ-สกุล เกษตรกร** | `farmerName` / `ownerName` | `syncType7aActualData` | `DemoPlot` | `owner_name` | `VARCHAR` | No | `""` |
| **เบอร์โทรศัพท์เกษตรกร** | `farmerPhone` / `ownerPhone` | `syncType7aActualData` | `DemoPlot` | `owner_phone` | `VARCHAR` | Yes | `null` |
| **เกษตรกรที่ไม่มีในระบบ** | `isUnregisteredFarmer` | `syncType7aActualData` | `DemoPlot` | `is_unregistered_farmer` | `BOOLEAN` | No | `false` |
| **หมวดพืช** | `cropCategory` | `syncType7aPlots` | `DemoPlot` / `ActivityPlanType7a` | `crop_category` | `VARCHAR` | Yes / No | `"พืชทั่วไป"` |
| **ชื่อพืช** | `cropName` | `syncType7aPlots` | `DemoPlot` / `ActivityPlanType7a` | `crop_name` | `VARCHAR` | Yes / No | `"พืชทั่วไป"` |
| **ระบุชื่อพืชเพิ่มเติม** | `customCropName` | `syncType7aPlots` | `DemoPlot` / `ActivityPlanType7a` | `custom_crop_name` | `VARCHAR` | Yes | `null` |
| **พื้นที่ (ไร่)** *(ผัก/พืชไร่)* | `areaRai` | `syncType7aPlots` (`Prisma.Decimal`) | `DemoPlot` / `ActivityPlanType7a` | `area_rai` | `DECIMAL(10,2)` | Yes | `null` |
| **จำนวนต้น** *(พืชสวน)* | `treeCount` | `syncType7aPlots` | `DemoPlot` / `ActivityPlanType7a` | `tree_count` | `INTEGER` | Yes | `null` |
| **พิกัดแปลง (GPS ละติจูด)** | `latitude` | `parseDecimalCoord` | `DemoPlot` | `latitude` | `DECIMAL(10,7)` | Yes | `null` |
| **พิกัดแปลง (GPS ลองจิจูด)** | `longitude` | `parseDecimalCoord` | `DemoPlot` | `longitude` | `DECIMAL(10,7)` | Yes | `null` |
| **ข้อมูลพืชประธาน** | `mainCropInfo` | `syncType7aActualData` | `DemoPlot` | `main_crop_info` | `VARCHAR` | Yes | `null` |
| **วิธีการทดลอง** | `experimentDetail` | `syncType7aActualData` | `DemoPlot` | `experiment_detail` | `TEXT` | Yes | `null` |
| **ระบบน้ำ (8 รูปแบบ)** | `irrigations` (`string[]`) | `syncType7aActualData` | `DemoPlotIrrigation` | `method` | `VARCHAR` | No | - |
| **วันที่เริ่มปลูกจริง** | `plantingDate` | `syncType7aActualData` | `DemoPlot` | `planting_date` | `TIMESTAMP` | Yes | `null` |
| **วันที่ฉีดพ่นครั้งแรก** | `initialSprayDate` | `syncType7aActualData` | `DemoPlot` | `initial_spray_date` | `TIMESTAMP` | Yes | `null` |
| **กำหนดฉีดพ่นครั้งต่อไป** | `nextSprayDate` | `syncType7aActualData` | `DemoPlot` | `next_spray_date` | `TIMESTAMP` | Yes | `null` |
| **อายุพืช (วันหลังปลูก)** | `cropAge` (`number`), `cropAgeUnit` | `syncType7aActualData` | `DemoPlotVisit` | `crop_age_value`, `crop_age_unit` | `INT`, `VARCHAR` | Yes | `null` |
| **ระยะการเจริญเติบโต** | `growthStage` | `syncType7aActualData` | `DemoPlotVisit` | `growth_stage` | `VARCHAR` | Yes | `null` |
| **ข้อมูลเพิ่มเติม** | `additionalNotes` / `notes` | `syncType7aActualData` | `DemoPlot` / `DemoPlotVisit` | `notes` | `TEXT` | Yes | `null` |
| **วิธีการฉีดพ่น (Single/Tank)** | `sprayMethod` | `syncType7aActualData` | `DemoPlot` / `DemoPlotVisit` | `spray_method` | `VARCHAR` | Yes | `"SINGLE"` |
| **อุปกรณ์ที่ใช้ฉีดพ่น** | `sprayEquipment`, `otherEquipment` | `syncType7aActualData` | `DemoPlot` / `DemoPlotVisit` | `spray_equipment`, `other_equipment` | `VARCHAR` | Yes | `null` |
| **ยาภายนอก (บริษัท/ชื่อ/สูตร/อัตรา)** | `externalChemicals` | `syncType7aActualData` | `DemoPlotExternalProduct` | multiple columns | `VARCHAR` | Yes | - |
| **สินค้าตามแผน (จำนวนเบิก/ใช้จริง/เพิ่ม/อัตรา)** | `plannedProducts` | `syncType7aActualData` | `DemoPlotProduct` | `quantity`, `extra_quantity`, etc. | `DECIMAL`, `VARCHAR` | Yes | - |
| **สินค้าเพิ่มเติมหน้างาน** | `additionalProducts` | `syncType7aActualData` | `DemoPlotProduct` | `is_additional: true` | `BOOLEAN`, `DECIMAL` | Yes | `false` |
| **ภาพถ่ายสภาพแปลงเริ่มต้น (10 รูป)** | `initialPhotos` / `plotImages` | `uploadImages()` (`PLOT`, max 10) | `ActivityAttachment` | `file_url`, `category: "PLOT"` | `TEXT` | No | - |

### 6.3 รายละเอียดตารางสินค้า รูปภาพ และความสัมพันธ์ (Relations & Schema)

```prisma
// 1. ตาราง Master Data แปลงสาธิต
model DemoPlot {
  id                   String         @id @default(cuid())
  code                 String         @unique // รหัสแปลงสาธิต เช่น DP26100001
  name                 String         // ชื่อแปลง เช่น "แปลงสาธิตทุเรียนหมอนทอง นายสมชาย"
  ownerName            String         @map("owner_name") // เจ้าของแปลง/ลูกค้า
  customerId           String?        @map("customer_id") // FK -> Customer (ร้านค้า Dealer)
  employeeId           String         @map("employee_id") // พนักงานผู้ดูแลแปลง
  plotType             String         @default("GENERAL_DEMO") @map("plot_type")

  cropCategory         String?        @map("crop_category")
  cropName             String?        @map("crop_name")
  customCropName       String?        @map("custom_crop_name")
  areaRai              Decimal?       @map("area_rai") @db.Decimal(10, 2)
  treeCount            Int?           @map("tree_count")
  province             String?        @map("province")
  district             String?        @map("district")
  objective            String?        @map("objective")
  experimentDetail     String?        @map("experiment_detail") // วิธีการทดลอง

  startDate            DateTime       @map("start_date")
  plantingDate         DateTime?      @map("planting_date")
  initialSprayDate     DateTime?      @map("initial_spray_date")
  nextSprayDate        DateTime?      @map("next_spray_date")
  mainCropInfo         String?        @map("main_crop_info") // ข้อมูลพืชประธาน
  sprayMethod          String?        @map("spray_method") // SINGLE / TANK_MIXED
  sprayEquipment       String?        @map("spray_equipment") // อุปกรณ์ที่ใช้ฉีดพ่น
  otherEquipment       String?        @map("other_equipment") // ระบุอุปกรณ์กรณีเลือกอื่นๆ
  hasExternalChemicals Boolean        @default(false) @map("has_external_chemicals")
  notes                String?        @map("notes") // ข้อมูลเพิ่มเติม
  ownerPhone           String?        @map("owner_phone") // เบอร์โทรศัพท์เกษตรกร
  ownerProvince        String?        @map("owner_province") // จังหวัดเกษตรกร
  ownerDistrict        String?        @map("owner_district") // อำเภอเกษตรกร
  ownerSubdistrict     String?        @map("owner_subdistrict") // ตำบลเกษตรกร
  isUnregisteredFarmer Boolean        @default(false) @map("is_unregistered_farmer")
  latitude             Decimal?       @map("latitude") @db.Decimal(10, 7)
  longitude            Decimal?       @map("longitude") @db.Decimal(10, 7)
  status               DemoPlotStatus @default(IN_PROGRESS)

  customer             Customer?      @relation("CustomerDemoPlots", fields: [customerId], references: [id], onDelete: SetNull)
  visits               DemoPlotVisit[]
  demoProducts         DemoPlotProduct[]
  externalProducts     DemoPlotExternalProduct[]
  irrigations          DemoPlotIrrigation[]
  attachments          ActivityAttachment[]

  createdAt            DateTime       @default(now()) @map("created_at")
  updatedAt            DateTime       @updatedAt @map("updated_at")
  deletedAt            DateTime?      @map("deleted_at")

  @@map("demo_plots")
}

// 2. ตารางระบบน้ำประจำแปลง (เลือกได้มากกว่า 1 รูปแบบ)
model DemoPlotIrrigation {
  id         String   @id @default(cuid())
  demoPlotId String   @map("demo_plot_id")
  method     String   @map("method") // น้ำหยด, สายยาง, สปิงเกอร์, ให้ตามร่อง, ปล่อยท่วม(flooding), รอน้ำฝน, นาหว่านน้ำตม, นาดำ

  demoPlot   DemoPlot @relation(fields: [demoPlotId], references: [id], onDelete: Cascade)

  @@unique([demoPlotId, method])
  @@index([demoPlotId])
  @@map("demo_plot_irrigations")
}

// 3. ตารางสารเคมีภายนอก/ยาคู่เปรียบเทียบ (กรณีฉีดพ่นแบบ Tank-mixed)
model DemoPlotExternalProduct {
  id               String   @id @default(cuid())
  demoPlotId       String   @map("demo_plot_id")
  company          String   @map("company") // บริษัท
  productName      String   @map("product_name") // ชื่อสินค้า
  activeIngredient String?  @map("active_ingredient") // สารออกฤทธิ์
  formula          String   @map("formula") // SL, SC, EC, อื่นๆ
  customFormula    String?  @map("custom_formula") // ระบุสูตรถ้าเลือกอื่นๆ
  applicationRate  String   @map("application_rate") // อัตราการใช้
  sortOrder        Int      @default(0) @map("sort_order")

  demoPlot         DemoPlot @relation(fields: [demoPlotId], references: [id], onDelete: Cascade)

  @@index([demoPlotId])
  @@map("demo_plot_external_products")
}

// 4. ตารางสินค้าตัวอย่างประจำแปลง (สินค้าตามแผน + สินค้าเพิ่มเติมหน้างาน)
model DemoPlotProduct {
  id                String   @id @default(cuid())
  demoPlotId        String   @map("demo_plot_id")
  productId         String   @map("product_id")
  productName       String?  @map("product_name")
  applicationRate   String   @map("application_rate") // อัตราการใช้
  quantity          Decimal? @map("quantity") @db.Decimal(10, 2) // จำนวนที่ใช้จริง
  remainingQuantity Decimal? @map("remaining_quantity") @db.Decimal(10, 2)
  extraQuantity     Decimal? @map("extra_quantity") @db.Decimal(10, 2) // ปริมาณที่ใช้เพิ่ม
  extraUnit         String?  @map("extra_unit") // ซีซี หรือ กรัม
  isAdditional      Boolean  @default(false) @map("is_additional") // เพิ่มเติมหน้างานหรือไม่
  withdrawnQuantity Decimal? @map("withdrawn_quantity") @db.Decimal(10, 2) // จำนวนที่เบิก
  unit              String?  @map("unit") // หน่วยนับหลัก (ขวด/ซอง)
  sortOrder         Int      @default(0) @map("sort_order")

  demoPlot          DemoPlot @relation(fields: [demoPlotId], references: [id], onDelete: Cascade)
  product           Product  @relation("DemoPlotProductRef", fields: [productId], references: [id], onDelete: Restrict)

  @@index([demoPlotId])
  @@index([productId])
  @@map("demo_plot_products")
}

// 5. ตารางประวัติการตรวจเยี่ยมและบันทึกแปลง (Visit #1 สำหรับ Baseline Setup)
model DemoPlotVisit {
  id             String   @id @default(cuid())
  demoPlotId     String   @map("demo_plot_id")
  activityPlanId String?  @map("activity_plan_id")
  workTypeCode   String?  @map("work_type_code") // "TYPE_7A", "TYPE_7B"
  visitNumber    Int      @default(1) @map("visit_number") // ครั้งที่ 1
  visitDate      DateTime @map("visit_date")
  cropAgeValue   Int?     @map("crop_age_value") // อายุพืช
  cropAgeUnit    String?  @map("crop_age_unit") // วัน / เดือน
  growthStage    String?  @map("growth_stage") // ระยะการเจริญเติบโต
  notes          String?
  sprayMethod    String?  @map("spray_method") // SINGLE / TANK_MIXED
  sprayEquipment String?  @map("spray_equipment") // อุปกรณ์ที่ใช้ฉีดพ่น
  otherEquipment String?  @map("other_equipment")

  demoPlot       DemoPlot @relation(fields: [demoPlotId], references: [id], onDelete: Cascade)

  @@index([demoPlotId])
  @@map("demo_plot_visits")
}

// 6. ตารางบันทึกรูปภาพแปลงสาธิต (สูงสุด 10 รูป)
model ActivityAttachment {
  id               String         @id @default(cuid())
  activityPlanId   String         @map("activity_plan_id")
  activityResultId String?        @map("activity_result_id")
  category         String         @map("category") // "PLOT"
  fileUrl          String         @map("file_url")
  fileName         String?        @map("file_name")
  fileSize         Int?           @map("file_size")
  mimeType         String?        @map("mime_type")

  @@index([activityPlanId])
  @@map("activity_attachments")
}
```

### 6.4 Transaction & Persistence Strategy (ขาเขียนและขาอ่าน)
- **การจัดการ Transaction (Isolation & Atomicity):**
  - ทุกการบันทึกของ Type 7A ดำเนินการภายใต้ `tx` (`PrismaTransaction`) ของระบบ
  - มีการใช้ PostgreSQL Advisory Lock ใน `generateDemoPlotCode()` ป้องกันรหัสแปลงซ้ำซ้อน
  - การบันทึก Actual ดำเนินการผ่านฟังก์ชัน `syncType7aActualData()` ซึ่งผูกข้อมูล 5 ตารางหลัก (`DemoPlot`, `DemoPlotIrrigation`, `DemoPlotExternalProduct`, `DemoPlotProduct`, `DemoPlotVisit`) ภายใน $transaction เดียวกันอย่างสมบูรณ์แบบ
- **ขาเขียน (Write Flow):**
  1. *Planned:* ดึงรายการแปลงสาธิต ➔ รัน `syncType7aPlots()` เพื่อสร้างระเบียน `DemoPlot` ใหม่ (หากยังไม่มี `demoPlotId`) ➔ Dual-sync ข้อมูลร้านค้า/แปลงลง `activity_plan_stores` (`workTypeCode: "TYPE_7A"`) และสินค้าตัวอย่างลง `activity_plan_products`
  2. *Actual:* อัปโหลดภาพถ่ายแปลงสาธิตหมวดหมู่ `PLOT` (สูงสุด 10 ภาพ) ➔ รัน `syncType7aActualData()` ใน `type7aPlannedStrategy.saveActual()`:
     - อัปเดตพิกัด GPS, ข้อมูลพืชประธาน, วิธีการทดลอง, วันที่ปลูกจริง/ฉีดพ่น, วิธีการฉีดพ่น, อุปกรณ์ฉีดพ่น, และข้อมูลเกษตรกรลงใน `DemoPlot`
     - ซิงค์ระบบน้ำลง `DemoPlotIrrigation` (ลบและสร้างใหม่ตามที่เลือก)
     - ซิงค์ยาภายนอกลง `DemoPlotExternalProduct` (กรณีฉีดผสมถัง)
     - ซิงค์ยอดใช้จริงและปริมาณใช้เพิ่มลง `DemoPlotProduct` (รวมสินค้าตามแผนและสินค้าเพิ่มเติมหน้างาน)
     - บันทึกการตรวจเยี่ยมครั้งที่ 1 (Visit #1) ลง `DemoPlotVisit`
     - ซิงค์ผลการใช้สินค้าตัวอย่างลง `ActivityResultDemoItem`
     - บันทึก URL ภาพถ่ายลง `ActivityAttachment`
  3. *Unplanned:* สร้าง `DemoPlot` พร้อมรหัส `DPYYMMXXXX` ➔ บันทึกลง `activity_plan_stores` / `activity_plan_products` และบันทึกผลงานลง `activity_result_demo_items` ภายใน `$transaction` เดียวกัน
- **ขาอ่าน (Read / Hydration Flow):**
  1. *Planned Edit:* ดึง `plan.type7aPlots` (หรือ fallback `stores`/`products`) ➔ ส่งผ่าน `hydrateType7aPlannedData()` เพื่อเติมลงใน State ของฟอร์ม
  2. *Actual & Detail View:* ดึง `plan.type7aPlots` + `plan.result.demoResults` + `attachments` ➔ ส่งผ่าน `extractType7aPlanTargets()` และเรียก `type7aActual.hydrate()` เพื่อกู้คืนข้อมูลแปลง พิกัด สินค้าตามแผน และรูปภาพ
  3. *Unplanned Edit:* ดึงข้อมูลแผนผ่าน `getActivityPlanAction` ➔ ส่งผ่าน `hydrateType7aUnplannedData()` เพื่อกู้คืนข้อมูลแปลงและสินค้า
- **การลบข้อมูล (Delete Policy):**
  - ใช้ **Cascade Delete** จาก `ActivityPlan` สำหรับระเบียนในแผนงาน และ Soft-delete / Keep Master สำหรับ `DemoPlot` ที่ถูกสร้างขึ้นแล้วเพื่อรักษาประวัติการติดตามใน Type 7B

---

## 7. Business Rules

### 7.1 Validation Rules
- **การวางแผนเป้าหมาย (`Type7aPlannedForm`):**
  - ต้องมีแปลงสาธิตอย่างน้อย 1 แปลง
  - แต่ละแปลงต้องระบุชื่อแปลงสาธิต (`plotName` ห้ามว่าง)
  - แต่ละแปลงต้องเลือกร้านค้า Dealer (`storeId` / `ownerName` ห้ามว่าง)
  - แต่ละแปลงต้องเลือกหมวดพืช (`cropCategory`) และชื่อพืช (`cropName`)
  - หากเลือกชื่อพืชเป็น `"ผักและพืชล้มลุกอื่นๆ"`, `"พืชไร่อื่นๆ"`, หรือ `"พืชสวนอื่นๆ"` (`OTHER_CROP_OPTIONS`) ต้องกรอกช่อง **ระบุชื่อพืชเพิ่มเติม** (`customCropName` ห้ามว่าง)
  - หากเลือกหมวดพืชเป็น **`"พืชสวน"`** ต้องระบุ **จำนวนต้น** (`treeCount > 0`)
  - หากเลือกหมวดพืชเป็น **`"ผักและพืชล้มลุก"`** หรือ **`"พืชไร่"`** ต้องระบุ **พื้นที่ (ไร่)** (`areaRai > 0`)
- **การบันทึกผลงานจริง (`Type7aActualForm`):**
  - ต้องมีข้อมูลชื่อแปลงสาธิตหรือชื่อเกษตรกร
  - ต้องระบุชนิดพืชที่ทำการสาธิต
- **การบันทึกกิจกรรมนอกแผน (`Type7aUnplannedForm`):**
  - ต้องระบุชื่อแปลง เกษตรกรเจ้าของแปลง และชนิดพืชครบถ้วนทุกรายการ

### 7.2 Default Values
- `workTypeCode`: `"TYPE_7A"`
- `plotType`: `"GENERAL_DEMO"`
- `status` (DemoPlot): `IN_PROGRESS`
- `cropCategory`: ค่าเริ่มต้นกรณีไม่ได้เลือกคือ `"พืชทั่วไป"`
- `cropName`: ค่าเริ่มต้นกรณีไม่ได้เลือกคือ `"พืชทั่วไป"`

### 7.3 Conditional Fields
- **ชื่อพืชตามหมวดพืช (`CROP_NAMES_BY_CATEGORY`) และช่องระบุชื่อพืชเพิ่มเติม (`customCropName`):**
  - `ผักและพืชล้มลุก` ➔ `คะน้า`, `กะหล่ำปลี`, `พริก`, `ผักและพืชล้มลุกอื่นๆ`
  - `พืชไร่` ➔ `ข้าว`, `อ้อย`, `ยางพารา`, `พืชไร่อื่นๆ`
  - `พืชสวน` ➔ `ทุเรียน`, `ชมพู่`, `ยางพารา`, `พืชสวนอื่นๆ`
  - เมื่อเลือกตัวเลือกที่ลงท้ายด้วย `"อื่นๆ"` ระบบจะแสดงช่อง **ระบุชื่อพืชเพิ่มเติม \*** (`customCropName`)
- **พื้นที่ (ไร่) vs จำนวนต้น (`areaRai` vs `treeCount`):**
  - ถ้า `cropCategory === "พืชสวน"` แสดงช่อง **จำนวนต้น \*** (`treeCount`)
  - ถ้าไม่ใช่ `"พืชสวน"` แสดงช่อง **พื้นที่ (ไร่) \*** (`areaRai`)
- **การกรองสินค้าตามหมวดสินค้า (`categoryId`):**
  - ในส่วน `สินค้าที่นำไปทดสอบสาธิต` ต้องเลือก **หมวดสินค้า** ก่อน แล้วช่อง **เลือกสินค้า** จะกรองแสดงเฉพาะสินค้าที่อยู่ในหมวดสินค้านั้น
- **การกรองเกษตรกรและการระบุเกษตรกรนอกระบบ (Unregistered Farmer Mode):**
  - เมื่อเลือกจังหวัดในหน้า Actual ช่องเลือกเกษตรกรจะกรองแสดงเฉพาะเกษตรกรที่อยู่ในจังหวัดนั้น
  - เมื่อติ๊ก **"เกษตรกรที่ไม่มีในระบบ"** ช่องเลือกลูกค้าจะถูกซ่อน และเปิดช่องให้กรอก จังหวัด/ตำบล (`ActivityAddressSelect`), ชื่อ-สกุล เกษตรกร, และเบอร์โทรศัพท์โดยตรง
- **วิธีการฉีดพ่น (Spray Method) และตารางสารเคมีภายนอก (External Chemicals):**
  - เลือกได้ระหว่าง `ฉีดเดี่ยว (Single)` หรือ `ผสมถัง (Tank-mixed)`
  - เมื่อเลือก **`ผสมถัง (Tank-mixed)`** จะแสดงตัวเลือก **"มียาภายนอก"** เพื่อเปิดตารางกรอกข้อมูลสารเคมีภายนอก (บริษัท, ชื่อสินค้า, สารออกฤทธิ์, สูตร: SL/SC/EC/อื่นๆ, และอัตราการใช้)
- **หน่วยปริมาณที่ใช้เพิ่ม (Extra Quantity Units):**
  - หากหน่วยนับหลักของสินค้าเป็น **"ขวด"** หน่วยปริมาณที่ใช้เพิ่มจะเป็น **"ซีซี"**
  - หากหน่วยนับหลักของสินค้าเป็น **"ซอง"** หน่วยปริมาณที่ใช้เพิ่มจะเป็น **"กรัม"**
- **ข้อจำกัดจำนวนภาพถ่ายสภาพแปลงเริ่มต้น:**
  - รูปภาพแปลงสาธิต (`PLOT`): รองรับสูงสุด 10 ภาพต่อแปลง (`ActivityPhotoUpload maxFiles={10}`)

### 7.4 Status and Approval Rules
- **การบันทึกผลงานจริง (Trip Plan Actual):** สามารถบันทึกได้เฉพาะเมื่อแผนมีสถานะเป็น `APPROVED` (อนุมัติแล้ว) เท่านั้น
- **สิทธิ์การบันทึกผล:** เฉพาะเจ้าของแผนงาน (Creator) และ Administrator เท่านั้น ผู้ช่วยงาน (Helper) ไม่สามารถบันทึกผลแทนได้
- **การแสดงผลฟอร์มจริง:** ฟอร์ม Type 7A Actual จะแสดงขึ้นมาให้กรอกเมื่อสถานะกิจกรรมเป็น **`COMPLETED` (ปฏิบัติงานแล้วเสร็จ)** หรือ **`PARTIAL` (สำเร็จบางส่วน)**

---

## 8. Shared Dependencies

โมดูล Type 7A ทำงานร่วมกับชิ้นส่วนส่วนกลางต่อไปนี้:
1. **`@/modules/activity/ui`:**
   - `ActivityInput`: คอมโพเนนต์ Input มาตรฐานประจำโมดูล Activity
   - `ActivityTextarea`: คอมโพเนนต์กรอกข้อความหลายบรรทัดสำหรับวัตถุประสงค์แปลงและสภาพแปลง
   - `ActivityCombobox`: คอมโพเนนต์ตัวเลือกหมวดพืชและชนิดพืช
   - `ActivityCustomerSelect`: คอมโพเนนต์ค้นหาและเลือกร้านค้าตัวแทนจำหน่าย/เกษตรกร (รองรับการกรองตามจังหวัด)
   - `ActivityProductSelect`: คอมโพเนนต์ค้นหาและเลือกสินค้าตัวอย่าง
   - `ActivityPhotoUpload`: คอมโพเนนต์อัปโหลดรูปภาพแปลงสาธิตพร้อมบีบอัดไฟล์ในตัว (รองรับสูงสุด 10 ภาพ)
   - `ActivityGpsPicker`: คอมโพเนนต์ดึงพิกัดแปลงสาธิตปัจจุบันผ่าน Geolocation
   - `ActivityIrrigationCheckbox`: คอมโพเนนต์เลือกระบบน้ำประจำแปลง 8 รูปแบบ (เลือกได้มากกว่า 1 ข้อ)
   - `ActivityDatePicker`: คอมโพเนนต์เลือกวันที่พร้อมปุ่มล้างค่า สำหรับวันเริ่มปลูกจริง วันฉีดพ่นแรก และกำหนดฉีดพ่นครั้งต่อไป
   - `ActivityAddressSelect`: คอมโพเนนต์เลือกจังหวัด อำเภอ และตำบล สำหรับกรณีเกษตรกรนอกระบบ
2. **`@/modules/activity/views`:**
   - `planned-activity-form.tsx`: ฟอร์มหลักสำหรับสร้าง/แก้ไขแผนงาน
   - `unplanned-activity-form.tsx`: ฟอร์มหลักสำหรับกิจกรรมนอกแผน 2-in-1
   - `activity-plan-actual-view.tsx` & `actual-work-type-list.tsx`: ตัวกระจายฟอร์มผลการปฏิบัติงานจริง
   - `detail-work-type-list.tsx`: ตัวกระจายการ์ดแสดงผลในหน้ารายละเอียด
   - `approval-work-type-list.tsx`: ตัวกระจายการ์ดในหน้าพิจารณาอนุมัติ
3. **`@/modules/activity/constants`:**
   - `WORK_TYPE_CONFIG`: การตั้งค่าและรหัสประเภทงาน (`TYPE_7A`)
   - `ACTIVITY_RESULT_STATUS_LABELS`: ป้ายแสดงสถานะผลกิจกรรม
4. **`@/modules/activity/infrastructure/strategy.registry`:**
   - `saveStrategiesForPlan`: จัดการบันทึกข้อมูล Type Strategies ตาม Work Type Codes
   - `WORK_TYPE_STRATEGY_REGISTRY.TYPE_7A`: ลงทะเบียน `type7aPlannedStrategy` และ `type7aUnplannedStrategy`
5. **Server Actions ที่ใช้งานจริง (`@/modules/activity/server/`):**
   - **`planned.actions.ts`**: `createActivityPlanAction`, `updateActivityPlanAction`, `getActivityPlanAction`
   - **`unplanned.actions.ts`**: `createUnplannedActivityAction`, `updateUnplannedActivityAction`, `getUnplannedActivityAction`
   - **`actual.actions.ts`**: `recordActivityResultAction`

---

## 9. How to Modify Type 7A

### 9.0 โครงสร้างเอกสารงานพัฒนาแบบแยก Task (`modules/activity/features/type-7a/tasks/`)
การพัฒนาและปรับปรุงโมดูล Type 7A ถูกแบ่งออกเป็น Task ย่อยและบันทึกไว้อย่างเป็นระบบในโฟลเดอร์ `tasks/`:
- `task-1-schema.md`: การออกแบบ Database Schema และ Prisma Migration สำหรับรองรับ Actual Form และ Type 7B
- `task-2-ui-components.md`: การสร้าง Reusable UI Components (`ActivityIrrigationCheckbox`, `ActivityDatePicker`)
- `task-3-types-hook.md`: การสร้าง Type Definitions และ `useType7aActual` Custom Hook
- `task-4-actual-form.md`: การจัดหน้าตา Form ใหม่ทั้ง 7 หัวข้อตามข้อกำหนด
- `task-5-repo-strategy.md`: การเชื่อมต่อ Repository Transaction (`syncType7aActualData`) และ Strategy Save Actual
- `task-6-validation.md`: การทำ Validation และทดสอบ E2E Type-check Zero Errors

### 9.1 การเพิ่มฟิลด์ใหม่บนฟอร์ม (Add a Form Field)
1. เพิ่มฟิลด์ใน Type Definitions:
   - ฟอร์มในแผน: `planned/types/planned.types.ts` (`Type7aPlanItem`)
   - ฟอร์มผลจริง: `planned/types/actual.types.ts` (`Type7aActualRecord`)
   - ฟอร์มนอกแผน: `unplanned/types/unplanned.types.ts` (`Type7aUnplannedItem`)
   - โมเดลรวม: `shared/types.ts` (`Type7aPlotInput`)
2. เพิ่ม Validation Schema ใน `planned-validation.ts`, `actual-validation.ts`, หรือ `unplanned-validation.ts`
3. เพิ่ม Input Field ใน UI Component:
   - ในแผน: `planned/components/type7a-planned-form.tsx`
   - ผลจริง: `planned/components/type7a-actual-form.tsx`
   - นอกแผน: `unplanned/components/type7a-unplanned-form.tsx`
   - หน้ารายละเอียด: `planned/components/type7a-detail-view.tsx`
4. อัปเดต Mapper และ Hook ใน `use-type7a-actual.ts`, `actual-mapper.ts`, หรือ `planned-mapper.ts`
5. อัปเดต Repository และ Strategy ใน `type7a.repository.ts` (`syncType7aActualData`) และ `type7a-planned.strategy.ts` เพื่อบันทึกลงฐานข้อมูล

### 9.2 การปรับแก้ Validation (Change Validation)
- ปรับแก้เงื่อนไขการตรวจสอบใน:
  - `planned/application/planned-validation.ts` (`validateType7aFormItems`)
  - `planned/application/actual-validation.ts` (`validateType7aActual`)
  - `unplanned/application/unplanned-validation.ts` (`validateType7aUnplannedItems`)

### 9.3 การปรับ Database Mapping (Change Database Mapping)
- หากมีการเปลี่ยนแปลงคอลัมน์ใน `DemoPlot`, `DemoPlotIrrigation`, `DemoPlotExternalProduct`, `DemoPlotProduct` หรือ `DemoPlotVisit` ให้แก้ไขใน:
  - `planned/infrastructure/type7a.repository.ts` ตรงฟังก์ชัน `syncType7aPlots` และ `syncType7aActualData`
  - `planned/infrastructure/type7a-planned.strategy.ts` ตรง `saveActual`

### 9.4 การปรับแก้ Actual Loading or Hydration
- ตรวจสอบฟังก์ชัน `extractType7aPlanTargets` และ `hydrateType7aPlannedData` ใน `planned/application/planned-mapper.ts` และ `hydrate` ใน `use-type7a-actual.ts` เพื่อให้รองรับ fallback ฟิลด์เดิมอย่างครอบคลุม

### 9.5 การแก้ไข Shared Components อย่างปลอดภัย
- หากต้องปรับปรุง Shared Components ใน `modules/activity/ui/` ให้คง Props Interface เดิมไว้เสมอเพื่อไม่ให้ส่งผลกระทบต่อประเภทงานอื่น

---

## 10. Troubleshooting & Tracing Pipeline

### 10.1 Step-by-Step Tracing Pipeline (คู่มือการไล่โค้ดเมื่อพบปัญหา)

เมื่อพบว่าข้อมูลบางจุดไม่แสดงผล (เช่น รหัสแปลงสาธิตไม่ถูกสร้าง หรือพิกัด GPS ไม่แสดงหลัง Reload) ให้ไล่ตรวจสอบตาม 8 ขั้นตอนนี้ตามลำดับ:

```text
[Step 1: UI Field] ➔ Type7aActualForm.tsx (ตรวจว่า ActivityGpsPicker ผูกกับ latitude/longitude หรือไม่)
        ↓
[Step 2: Hook State] ➔ use-type7a-actual.ts (ตรวจว่า t7Latitude และ t7Longitude มีค่าถูกต้องหรือไม่)
        ↓
[Step 3: Save Mapper] ➔ buildPayload() (ตรวจว่าส่ง t7Latitude และ t7Longitude ครบถ้วนหรือไม่)
        ↓
[Step 4: Server Action] ➔ recordActivityResultAction ➔ recordActivityResultUseCase
        ↓
[Step 5: Strategy Write] ➔ type7a-planned.strategy.ts: saveActual() ➔ syncType7aActualData()
                          (ตรวจว่าบันทึกลง DemoPlot, Irrigations, Products, ExternalProducts, Visits หรือไม่)
        ↓
[Step 6: Prisma Table] ➔ DemoPlot, DemoPlotIrrigation, DemoPlotExternalProduct, DemoPlotProduct, DemoPlotVisit
                          (ข้อมูลใน DB แต่ละตารางมีค่าจริงหรือไม่)
        ↓
[Step 7: Loader & Include] ➔ getActivityPlanAction (ตรวจว่า include type7aPlots, demoPlotData หรือไม่)
        ↓
[Step 8: Load Hydrator] ➔ planned-mapper.ts: extractType7aPlanTargets() & useType7aActual.hydrate()
                          (ตรวจว่ากู้คืนค่าพิกัดและข้อมูลแปลงสาธิตครบถ้วนหรือไม่)
```

### 10.2 ตารางวิเคราะห์ปัญหาที่พบบ่อย (Common Pitfalls)

| อาการ | จุดที่ต้องตรวจสอบ | ต้นตอและวิธีแก้ไข |
| :--- | :--- | :--- |
| **รหัสแปลงสาธิต (`code`) ชนกันกรณีบันทึกพร้อมกัน** | `type7a.repository.ts` ➔ `generateDemoPlotCode` | ตรวจสอบว่ามีคำสั่ง `pg_advisory_xact_lock` ทำงานอยู่หรือไม่ หากไม่มี lock ธุรกรรมที่บันทึกพร้อมกันอาจได้เลขลำดับเดียวกัน |
| **ข้อมูลแปลงสาธิตไม่ขึ้นในหน้าแก้ไขแผน** | `planned-mapper.ts` ➔ `hydrateType7aPlannedData` | ข้อมูลส่งมาเป็น `type7aPlots` แต่โค้ดอ่าน `demoPlotData` หรือ `stores` ให้ตรวจเช็คว่าฟังก์ชันอ่านครบทั้ง 3 คีย์ |
| **หน้า Actual ไม่แสดงช่องกรอกข้อมูล Type 7A** | `activity-plan-actual-view.tsx` | ตรวจสอบเงื่อนไข `isType7aActive` ว่าครอบคลุมทั้ง `"TYPE_7A"`, `"จัดทำแปลงสาธิต"` และ `plan?.type7aPlots?.length` |
| **พิกัดแปลง GPS บันทึกแล้วเป็น null** | `type7a.repository.ts` ➔ `parseDecimalCoord` | ค่าพิกัดส่งมาเป็น String ว่าง `""` หรือ NaN ต้องตรวจสอบผ่าน `parseDecimalCoord` ก่อนแปลงเป็น `new Prisma.Decimal()` |
| **ภาพถ่ายแปลงสาธิตหายหลัง Reload** | `use-type7a-actual.ts` ➔ `uploadImages` | ตรวจสอบว่า `uploadActivityPlanImageGroup` บันทึกหมวดหมู่ `"plot"` หรือ `"issue"` ถูกต้องหรือไม่ |
| **บันทึกกิจกรรมนอกแผนแล้วแปลงไม่แสดงในหน้า Type 7B** | `type7a-unplanned.strategy.ts` ➔ `savePlan` | กิจกรรมนอกแผนต้องเรียก `type7aPlannedStrategy.savePlan()` เสมอเพื่อสร้างระเบียน `DemoPlot` ในระบบ Master |

---

## 11. Testing and Manual UAT

### แผนการทดสอบแบบครบวงจร (End-to-End Test Checklist):
- [ ] **TC-01 (Planned Create):** สร้างแผนจัดทำแปลงสาธิต ระบุชื่อแปลง เกษตรกร เลือกร้านค้า ชนิดพืช และเพิ่มสินค้าตัวอย่าง บันทึกแบบร่าง (DRAFT) และส่งขออนุมัติได้สำเร็จ ตรวจสอบรหัส `DPYYMMXXXX` ในตาราง `demo_plots`
- [ ] **TC-02 (Dual-write Sync Check):** ตรวจสอบว่าใน `activity_plan_stores` และ `activity_plan_products` มีระเบียนที่ซิงค์ `workTypeCode = "TYPE_7A"` ถูกต้องตรงกัน
- [ ] **TC-03 (Planned Edit):** เข้าหน้าแก้ไข (`/activity-plans/[id]/edit`) ข้อมูลแปลงสาธิตและสินค้าตัวอย่างต้องแสดงครบถ้วน แก้ไขข้อมูลแล้วบันทึกสำเร็จ
- [ ] **TC-04 (Detail View - Planned):** เข้าหน้ารายละเอียดก่อนเริ่มงาน การ์ดเป้าหมาย Type 7A (`Type7aPlanCard`) ต้องแสดงชื่อแปลง เกษตรกร และพืชที่ทดสอบถูกต้อง
- [ ] **TC-05 (Actual - Redesigned Form):** เข้าหน้าบันทึกผลจริง ตรวจสอบว่ามีครบทั้ง 7 ส่วน: กรองเกษตรกรตามจังหวัด/โหมดเกษตรกรนอกระบบ, ข้อมูลสภาพแปลงเริ่มต้น (พืชประธาน, วิธีการทดลอง, เช็คบ็อกซ์ระบบน้ำ 8 ข้อ, วันที่เริ่มปลูกจริง, วันที่ฉีดพ่นแรก/ถัดไป, อายุพืช+หน่วย, ระยะการเจริญเติบโต, วิธีฉีดพ่นเดี่ยว/ผสมถัง+ตารางยาภายนอก, รูปถ่าย 10 รูป), สินค้าตามแผน (เบิก/ใช้จริง/ใช้เพิ่ม ซีซีหรือกรัม/อัตราการใช้), สินค้าเพิ่มเติมหน้างาน, และอุปกรณ์ฉีดพ่น บันทึกผลสำเร็จ
- [ ] **TC-06 (Actual - Partial):** บันทึกผลแบบ "สำเร็จบางส่วน" ตรวจสอบว่าฟอร์มยังคงแสดงและบันทึกผลได้ตามปกติ
- [ ] **TC-07 (Unplanned 2-in-1):** สร้างกิจกรรมนอกแผน Type 7A ระบุแปลง เกษตรกร สินค้า พิกัด GPS และรูปถ่ายในหน้าเดียว บันทึกแล้วต้องได้สถานะ `COMPLETED` และสร้าง `DemoPlot` สำเร็จทันที
- [ ] **TC-08 (Detail View - Actual):** เข้าหน้ารายละเอียดหลังบันทึกผลจริง ข้อมูลการจัดทำแปลง พิกัด GPS และรูปถ่ายแปลงต้องแสดงครบถ้วน
- [ ] **TC-09 (Approval View):** ผู้บังคับบัญชาเข้าหน้าอนุมัติ ข้อมูลเป้าหมายแปลงสาธิตต้องแสดงในการ์ดอนุมัติอย่างถูกต้อง
- [ ] **TC-10 (Type 7B Integration Check):** แปลงสาธิตที่บันทึกข้อมูลจัดทำเสร็จแล้วใน Type 7A ต้องมีประวัติ Baseline Visit (#1), ข้อมูลระบบน้ำ, และสินค้าตัวอย่างพร้อมสำหรับการติดตามผลต่อเนื่องใน Type 7B (ติดตามผลแปลงสาธิต)

---

## 12. Known Limitations and Important Notes

1. **Master Table Persistence (`DemoPlot`):**
   - Type 7A ทำหน้าที่เป็นตัวกำเนิด Master Data ของแปลงสาธิตในตาราง `demo_plots` เพื่อให้กิจกรรม Type 7B (ติดตามผลแปลงสาธิต) สามารถนำรหัสแปลงไปอ้างอิงและบันทึกผลการติดตามต่อเนื่องได้
2. **PostgreSQL Advisory Lock:**
   - การออกรหัสแปลงสาธิต `DPYYMMXXXX` อาศัย `pg_advisory_xact_lock` ซึ่งทำงานเฉพาะบนฐานข้อมูล PostgreSQL จริง ในสภาพแวดล้อมทดสอบที่ไม่มีฟังก์ชันนี้จะสลับไปใช้การสแกนหาเลขลำดับสูงสุดแทน
3. **การจัดการรูปภาพแปลงสาธิต:**
   - ก่อนส่ง Payload บันทึกผลจริง ระบบต้องเรียก `type7aActual.uploadImages()` เสมอ เพื่อแปลงไฟล์รูปภาพจาก `Blob/File` ให้กลายเป็น `URL String` ก่อนบันทึกลงฐานข้อมูล โดยกำหนดหมวดหมู่เป็น `PLOT` (สูงสุด 10 ภาพต่อแปลง)
4. **Decoupling Dependency:**
   - ต้องนำเข้าค่าคงที่และฟังก์ชันจาก `@/modules/activity/constants` และคอมโพเนนต์จาก `@/modules/activity/ui` เท่านั้น ห้ามนำเข้าจาก `@/modules/activity-plans` โดยเด็ดขาด

---

## 13. Change Log

| วันที่ | เวอร์ชัน | รายละเอียดการปรับปรุง | ผู้ดำเนินการ |
| :--- | :--- | :--- | :--- |
| **2026-10-16** | 1.0.0 | สร้างโมดูล Type 7A เป็น Vertical Slice Architecture สำหรับการจัดทำแปลงสาธิตใหม่ | Antigravity AI |
| **2026-10-18** | 1.1.0 | พัฒนาระบบออกรหัสแปลงสาธิตอัตโนมัติ `DPYYMMXXXX` ผ่าน Advisory Lock ใน `type7a.repository.ts` | Antigravity AI |
| **2026-10-19** | 1.2.0 | ปลด Dependency เก่า สลับมาใช้ `@/modules/activity/ui` (`ActivityInput`, `ActivityCustomerSelect`, `ActivityProductSelect`, `ActivityPhotoUpload`, `ActivityGpsPicker`) | Antigravity AI |
| **2026-10-20** | 1.3.0 | พัฒนา Sub-slice `unplanned/` (Type 7A Unplanned Form 2-in-1, Strategy, Mappers, Hooks) | Antigravity AI |
| **2026-10-21** | 1.4.0 | เชื่อมต่อเข้ากับ `strategy.registry.ts` และ Server Actions ใหม่ (`planned.actions.ts`, `unplanned.actions.ts`, `actual.actions.ts`) | Antigravity AI |
| **2026-10-21** | 1.5.0 | ปรับปรุงการซิงค์ `ActivityPlanStore` และ `ActivityPlanProduct` พร้อมรองรับการเชื่อมต่อไปยัง Type 7B | Antigravity AI |
| **2026-10-22** | 1.6.0 | ปรับปรุงเอกสารคู่มือทางเทคนิคฉบับสมบูรณ์ (`README.md`) ครบทั้ง 13 หัวข้อตามมาตรฐาน Gold Standard Type 1 พร้อมรายละเอียดสถาปัตยกรรม แผนภาพ Flow และ Data Models ครบถ้วน 100% | Antigravity AI |
| **2026-10-22** | 1.7.0 | ปรับปรุงฟอร์ม `Type7aPlannedForm`: เปลี่ยนช่องลูกค้าเป็น `ชื่อ ร้านค้า Dealer` (`DEALER`), ปรับ `หมวดพืช` 3 หมวด (`ผักและพืชล้มลุก`, `พืชไร่`, `พืชสวน`) พร้อมตัวเลือก `ชื่อพืช` ตามหมวดและช่อง `ระบุชื่อพืชเพิ่มเติม`, สลับช่อง `จำนวนต้น *` / `พื้นที่ (ไร่) *` ตามหมวดพืช, ปรับ `วัตถุประสงค์การจัดทำแปลง` ให้พิมพ์เอง และเพิ่มตัวเลือก `หมวดสินค้า` เพื่อกรองรายการสินค้า | Antigravity AI |
| **2026-10-22** | 1.8.0 | ออกแบบฟอร์มบันทึกผลงานจริง (`Type7aActualForm`) ใหม่ทั้งหมด 7 หัวข้อหลัก: 1) ลบฟิลด์เดิมออกทั้งหมด, 2) เกษตรกรเจ้าของแปลงและพิกัด (กรองเกษตรกรตามจังหวัด + โหมดเกษตรกรนอกระบบพร้อมที่อยู่/เบอร์), 3) พิกัดแปลง GPS, 4) สภาพแปลงเริ่มต้น (พืชประธาน, วิธีการทดลอง, เช็คบ็อกซ์ระบบน้ำ 8 แบบ, วันที่เริ่มปลูกจริง, วันฉีดพ่นแรก/ถัดไป, อายุพืช วัน/เดือน, ระยะเจริญเติบโต, วิธีฉีดพ่น เดี่ยว/ผสมถัง พร้อมตารางยาภายนอก, ภาพถ่ายแปลงเริ่มต้นสูงสุด 10 ภาพ), 5) สินค้าตามแผน (แสดงยอดเบิก, ช่องกรอกยอดใช้จริง, ปริมาณใช้เพิ่ม ซีซี/กรัม, อัตราการใช้), 6) สินค้าเพิ่มเติมหน้างาน, 7) อุปกรณ์ฉีดพ่น พร้อมซิงค์ฐานข้อมูล 5 ตารางหลัก (`DemoPlot`, `DemoPlotIrrigation`, `DemoPlotExternalProduct`, `DemoPlotProduct`, `DemoPlotVisit`) ส่งมอบให้ Type 7B ใช้งานต่อเนื่องได้อย่างสมบูรณ์แบบ | Antigravity AI |
