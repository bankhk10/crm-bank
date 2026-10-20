# Activity Type 4 — วางบิล / เก็บเงิน / Billing & Payment Collection (README)

> **Feature Slice**: `modules/activity/features/type-4`  
> **Standard Reference**: ออกแบบตามแนวทาง Vertical Slice Architecture อิงตามต้นแบบ Gold Standard Type 1, Type 2 และ Type 3  
> **Parent Module**: `modules/activity`  
> **Database Authority**: `prisma/schema.prisma` (`ActivityPlanType4Target`, `ActivityResultType4`, `ActivityResultType4Item`, พร้อม sync สู่ `ActivityPlanStore`, `ActivityPlanAttachment`)  
> **Status**: Production Ready / Active Reference (v1.0.0)

---

## 1. Overview

### 1.1 วัตถุประสงค์ของ Type 4
**Type 4 (วางบิล / เก็บเงิน / Billing & Payment Collection)** มีวัตถุประสงค์เพื่อรองรับกระบวนการปฏิบัติงานด้านการเงินและการชำระหนี้ของพนักงานขาย (Sales Reps) และพนักงานส่งสินค้า/บัญชีในการเข้าพบร้านค้าตัวแทนจำหน่าย:
1. วางแผนการเข้าวางบิลล่วงหน้า (Billing / Invoice Delivery) พร้อมกำหนดวันนัดหมายและเงื่อนไขเครดิต
2. วางแผนการเข้าเก็บเงิน/รับชำระหนี้ (Payment Collection) พร้อมระบุยอดเงินเป้าหมายที่ต้องเก็บ (Target Amount)
3. รองรับการระบุเป้าหมายหลายร้านค้าในแผนเดียวกัน (Multi-target Collection)
4. บันทึกผลการวางบิลจริง (สำเร็จ / เลื่อน / พบปัญหา) และยอดเงินที่รับชำระได้จริง (Received Amount vs Target Amount)
5. บันทึกเลขที่เอกสาร/ใบเสร็จรับเงิน (Receipt / Invoice Number) พร้อมแนบหลักฐานสลิปการโอนหรือภาพถ่ายใบเสร็จ (Payment Receipts / Slips)
6. รองรับการจัดเก็บข้อมูลผลงานลงใน Dedicated Tables (`ActivityResultType4` และ `ActivityResultType4Item`) พร้อมอัปเดตสรุปยอดเงิน `activity_results.collect_result_amount`

### 1.2 ขอบเขตของ Type 4
- **ประเภทการดำเนินการ (Collect Type):**
  - **วางบิล (BILLING):** นำส่งใบแจ้งหนี้/ใบวางบิล ไม่มียอดเงินที่ต้องรับชำระ ณ วันดังกล่าว แต่ต้องติดตามสถานะการรับวางบิล
  - **เก็บเงิน (COLLECT):** รับชำระหนี้ค่าสินค้า มีการระบุยอดเงินเป้าหมาย (Target Amount) และบันทึกยอดเงินที่รับจริง (Received Amount)
- **สถานะการวางบิล (Billing Status):**
  - `วางบิลสำเร็จ`: ร้านค้ารับวางบิลเรียบร้อย นัดหมายวันรับเงินตามรอบ
  - `เลื่อนวางบิล`: ร้านค้ายังไม่พร้อมรับวางบิล ให้ระบุเหตุผลและวันนัดใหม่
  - `พบปัญหา`: บิลไม่ถูกต้อง ยอดไม่ตรง สินค้ามีปัญหา ฯลฯ
- **การจัดเก็บข้อมูลแบบ Dual Persistence:**
  - บันทึกลงใน Dedicated Tables: `ActivityPlanType4Target` (สำหรับแผน) และ `ActivityResultType4` / `ActivityResultType4Item` (สำหรับผลงาน)
  - Sync สำเนาอัตโนมัติลงใน Generic Tables: `ActivityPlanStore` (`workTypeCode = "TYPE_4"`, `remarks = collectType`) เพื่อให้ระบบรายงานภาพรวมองค์กรและ Timeline ทำงานได้อย่างต่อเนื่อง
  - Sync ไฟล์สลิปหลักฐานการชำระเงินลงใน `ActivityPlanAttachment` (`category = "PAYMENT"`, `workTypeCode = "TYPE_4"`)

### 1.3 รูปแบบการทำงานที่รองรับ
1. **Planned (ในแผนงาน Trip Plan):** วางแผนวางบิลหรือเก็บเงินล่วงหน้า เลือกร้านค้า กำหนดยอดเงินเป้าหมายและหมายเหตุ
2. **Planned Actual (บันทึกผลงานตามแผน):** รายงานผลการรับชำระเงินจริง ระบุเลขที่บิล ยอดเงินที่ได้รับ สถานะการวางบิล พร้อมอัปโหลดสลิป/หลักฐานการชำระเงิน
3. **Unplanned (กิจกรรมนอกแผน 2-in-1):** รองรับการเข้าวางบิล/เก็บเงินกะทันหันหน้างาน บันทึกร้านค้า ยอดเป้าหมาย ยอดรับจริง และหลักฐานเสร็จสิ้นในหน้าเดียว สถานะแผนเป็น `COMPLETED` ทันที
4. **Detail View:** การ์ดแสดงผลรายละเอียดแผนงานและผลการวางบิล/เก็บเงินจริง พร้อมรูปภาพหลักฐานการชำระเงิน
5. **Approval View:** การ์ดสรุปเป้าหมายยอดเก็บเงินและร้านค้า สำหรับหัวหน้างานพิจารณาอนุมัติ

---

## 2. Business Flows

### 2.1 Planned (สร้างและแก้ไขแผนงาน)
```mermaid
graph TD
    A[ผู้ใช้สร้างแผนงานใหม่] --> B[กรอกข้อมูลทั่วไปและงบประมาณส่วนกลาง]
    B --> C[เลือกประเภทงาน Type 4: วางบิล / เก็บเงิน]
    C --> D[กรอกฟอร์ม Type4PlanForm]
    D --> E{เลือกประเภทการเข้าพบ}
    E -->|วางบิล BILLING| F[เลือกร้านค้า + ระบุรายละเอียดการวางบิล]
    E -->|เก็บเงิน COLLECT| G[เลือกร้านค้า + ระบวยอดเงินเป้าหมาย targetAmount]
    F --> H[สามารถกดเพิ่มร้านค้าเป้าหมายได้หลายร้าน]
    G --> H
    H --> I[ระบบคำนวณยอดเงินเป้าหมายรวมอัตโนมัติ]
    I --> J[กดบันทึกแบบร่าง DRAFT หรือ ส่งขออนุมัติ]
    J --> K[type4PlannedStrategy บันทึกลง ActivityPlanType4Target]
    K --> L[Sync สำเนาสู่ ActivityPlanStore workTypeCode = TYPE_4]
```

### 2.2 Planned Actual (บันทึกผลการปฏิบัติงานตามแผน)
```mermaid
graph TD
    A[เปิดหน้า Activity Plan Actual] --> B[โหลดแผนงานและ Hydrate เป้าหมายเดิม type4Targets]
    B --> C[เลือกสถานะผลงาน: COMPLETED / PARTIAL / POSTPONED / CANCELLED]
    C -->|COMPLETED หรือ PARTIAL| D[แสดงฟอร์ม Type4ActualForm]
    D --> E[ระบุเลขที่เอกสาร/ใบเสร็จ orderNo]
    D --> F[ระบุยอดเงินที่รับชำระจริง receivedAmount]
    D --> G[เลือกสถานะการวางบิล billingStatus และระบุรายละเอียด]
    D --> H[แนบรูปภาพสลิปหลักฐานการชำระเงิน paymentImages]
    E & F & G & H --> I[กดบันทึกผลการปฏิบัติงาน]
    I --> J[อัปโหลดรูปภาพลง Storage และ sync ลง ActivityPlanAttachment]
    J --> K[บันทึกลง ActivityResultType4 & ActivityResultType4Item]
    K --> L[อัปเดต collect_result_amount ใน ActivityResult]
    C -->|POSTPONED / CANCELLED| M[ระบุวันเวลานัดใหม่ หรือเหตุผลการยกเลิก]
```

### 2.3 Unplanned (กิจกรรมนอกแผน 2-in-1)
```mermaid
graph TD
    A[เปิดหน้า Unplanned Form] --> B[กรอกข้อมูลทั่วไปและพื้นที่/ทีมงาน]
    B --> C[เลือกประเภทงาน Type 4: วางบิล / เก็บเงิน]
    C --> D[แสดงฟอร์ม Type4UnplannedForm]
    D --> E[ระบุร้านค้า + เลือกว่าวางบิลหรือเก็บเงิน]
    E --> F[ระบุยอดเป้าหมาย + ยอดเงินที่รับจริง + เลขที่บิล + สลิปการชำระเงิน]
    F --> G[กดบันทึกกิจกรรมนอกแผน]
    G --> H[type4UnplannedStrategy ทำงานใน 1 Atomic Transaction]
    H --> I[บันทึก ActivityPlan สถานะ COMPLETED]
    H --> J[บันทึก ActivityPlanType4Target + Sync ลง ActivityPlanStore]
    H --> K[บันทึก ActivityResultType4 + ActivityResultType4Item + Attachments]
```

---

## 3. Architecture & Directory Structure

```text
modules/activity/features/type-4/
├── index.ts                                    # Unified Public API Contract
├── README.md                                   # คู่มือทางเทคนิค (ไฟล์นี้)
│
├── shared/                                     # ส่วนที่ใช้ร่วมกันใน Type 4
│   ├── constants.ts                            # COLLECT_TYPES, BILLING_STATUSES, COLLECT_STATUS_CONFIG, BADGES
│   └── types.ts                                # StoreOption, Type4ImageFile
│
├── planned/                                    # Sub-slice แผนงานและผลงานจริงในแผน
│   ├── types/
│   │   ├── planned.types.ts                    # Type4CollectItem, TargetCollectCompanyItem, Type4TargetItem
│   │   ├── actual.types.ts                     # Type4ActualData, Type4ActualFormProps, Type4DetailViewProps
│   │   └── index.ts
│   ├── application/
│   │   ├── planned-validation.ts               # validateType4FormItems, type4CollectItemSchema
│   │   ├── planned-mapper.ts                   # extractType4PlanTargets, hydrateType4PlannedData, mapType4FormToPayload
│   │   ├── actual-validation.ts                # validateType4Actual, type4ActualSchema
│   │   └── actual-mapper.ts                    # parseType4ActualResult, mapType4ActualFormToDb
│   ├── hooks/
│   │   ├── use-type4-form.ts                   # Hook จัดการสถานะฟอร์มในแผน (เพิ่ม/ลบร้านค้า, ประเภทเก็บเงิน, รวมยอด)
│   │   └── use-type4-actual.ts                 # Hook จัดการสถานะผลการวางบิล/เก็บเงินจริง (ยอดรับจริง, สลิป, อัปโหลด)
│   ├── infrastructure/
│   │   └── type4-planned.strategy.ts           # Strategy บันทึกแผนงานและผลงานจริง (Dual Persistence & Atomic Transaction)
│   └── components/
│       ├── type4-plan-form.tsx                 # ฟอร์มสร้าง/แก้ไขแผนงาน Type 4
│       ├── type4-plan-card.tsx                 # การ์ดสรุปเป้าหมายวางบิล/เก็บเงินตามแผน
│       ├── type4-actual-form.tsx               # ฟอร์มบันทึกผลงานจริงตามแผน (เลขบิล, ยอดเงินจริง, รูปสลิป)
│       ├── type4-detail-view.tsx               # การ์ดแสดงผลเปรียบเทียบเป้าหมาย vs ผลเก็บเงินจริง
│       └── type4-approval-card.tsx             # การ์ดสำหรับหน้าพิจารณาอนุมัติ
│
└── unplanned/                                  # Sub-slice กิจกรรมนอกแผน 2-in-1
    ├── types/
    │   ├── unplanned.types.ts                  # Type4UnplannedItem, Type4UnplannedPayload
    │   └── index.ts
    ├── application/
    │   ├── unplanned-validation.ts             # validateType4UnplannedForm, validateType4UnplannedItem, Schemas
    │   └── unplanned-mapper.ts                 # hydrateType4UnplannedData, mapType4UnplannedToPayload
    ├── hooks/
    │   └── use-type4-unplanned-form.ts         # Hook จัดการฟอร์มนอกแผน 2-in-1
    ├── infrastructure/
    │   └── type4-unplanned.strategy.ts         # Strategy สำหรับกิจกรรมนอกแผน บันทึกแผน + ผลงานใน 1 Transaction
    └── components/
        └── type4-unplanned-form.tsx            # ฟอร์มนอกแผน 2-in-1 สำหรับ Type 4
```

---

## 4. Database Schema & Data Mapping

### 4.1 ตารางฐานข้อมูลที่เกี่ยวข้อง
```prisma
// 1. เป้าหมายวางบิล/เก็บเงิน Type 4 (Dedicated Table)
model ActivityPlanType4Target {
  id              String   @id @default(uuid())
  activityPlanId  String
  storeId         String?
  collectType     String   @default("COLLECT") // "BILLING" หรือ "COLLECT"
  targetAmount    Decimal? @db.Decimal(12, 2)
  notes           String?
  ...
}

// 2. ผลการปฏิบัติงานจริง Type 4 (Dedicated Parent Table)
model ActivityResultType4 {
  id              String   @id @default(uuid())
  activityResultId String  @unique
  orderNo         String?
  receivedAmount  Decimal? @db.Decimal(12, 2)
  billingStatus   String?  // "วางบิลสำเร็จ", "เลื่อนวางบิล", "พบปัญหา"
  billingDetail   String?
  collectDetail   String?
  notes           String?
  items           ActivityResultType4Item[]
  ...
}

// 3. ผลการปฏิบัติงานจริงรายรายการ Type 4 (Dedicated Item Table)
model ActivityResultType4Item {
  id                    String   @id @default(uuid())
  activityResultType4Id String
  storeId               String?
  customerName          String?
  collectType           String   @default("COLLECT")
  targetAmount          Decimal? @db.Decimal(12, 2)
  receivedAmount        Decimal? @db.Decimal(12, 2)
  billingStatus         String?
  notes                 String?
  ...
}
```

### 4.2 Generic Tables Sync (Dual Persistence)
เมื่อผู้ใช้บันทึก Type 4 Strategy จะทำการ sync สำเนาข้อมูลลงตาราง generic:
- `ActivityPlanStore`: บันทึก `storeId`, `storeName`, `workTypeCode: "TYPE_4"`, `remarks: collectType`
- `ActivityResult`: บันทึกและอัปเดต `collect_result_amount = receivedAmount`
- `ActivityPlanAttachment`: จัดเก็บรูปภาพหลักฐานการชำระเงิน (`category = "PAYMENT"`, `workTypeCode = "TYPE_4"`)

---

## 5. Integration with Views & Orchestrators

| จุดเชื่อมต่อ (Integration Point) | ไฟล์เป้าหมาย (Target File) | สิ่งที่เชื่อมต่อ (Integration Content) |
|---|---|---|
| **Target Registry** | `modules/activity/domain/summary/plan-targets-registry.ts` | ลงทะเบียน `extractType4PlanTargets` ใน `TARGET_EXTRACTORS` และ fallback extraction |
| **Result Parser** | `modules/activity/domain/summary/result-summary-parser.ts` | แปลงผลงานจริง `ActivityResultType4` / `type4Result` สู่ `t4OrderNo`, `t4ReceivedAmount`, `t4BillingStatus`, `t4PaymentImages` |
| **Server Actions** | `modules/activity/server/actions.ts` | ผูก `type4PlannedStrategy` และ `type4UnplannedStrategy` ใน `createActivityPlanAction` และ `updateActivityPlanAction` |
| **Planned Form View** | `modules/activity/views/planned/components/planned-activity-form.tsx` | ผูก `useType4Form` และเรนเดอร์ `Type4PlanForm` |
| **Unplanned Form View** | `modules/activity/views/unplanned/components/unplanned-activity-form.tsx` | ผูก `useType4UnplannedForm` และเรนเดอร์ `Type4UnplannedForm` |
| **Actual View** | `modules/activity/views/actual/activity-plan-actual-view.tsx` & `actual-work-type-list.tsx` | ผูก `useType4Actual`, validate, hydrate, อัปโหลดสลิป และเรนเดอร์ `Type4ActualForm` |
| **Detail View** | `modules/activity/views/detail/components/detail-work-type-list.tsx` | เรนเดอร์ `Type4DetailView` พร้อมแสดงยอดเงินจริงและสลิปการชำระเงิน |
| **Approval View** | `modules/activity/views/approvals/components/approval-work-type-list.tsx` | เรนเดอร์ `Type4ApprovalCard` หรือ `Type4DetailView` ตามสถานะ |

---

## 6. Verification & Quality Assurance

- **TypeScript Compilation:** ผ่านการตรวจสอบด้วย `npx tsc --noEmit` โดยมี Error = 0
- **Boundary Check:** ทุก Import ภายใน `modules/activity/features/type-4/` เรียกใช้เฉพาะโค้ดภายใน Slice ตัวเอง หรือ `@/modules/activity/*`, `@/components/*`, `@/lib/*` โดยไม่มีการเรียกข้ามไปยัง `@/modules/activity-plans` โดยเด็ดขาด
- **Multi-target Validation:** รองรับการกำหนดเป้าหมายเก็บเงินหลายร้านค้า พร้อมตรวจเช็คความถูกต้องของยอดเงิน (`targetAmount > 0` เมื่อเลือกประเภท `COLLECT`)
- **Image Upload Integration:** รองรับการอัปโหลดไฟล์หลักฐานสลิปการชำระเงินหลายไฟล์พร้อมกัน แสดงพรีวิว และจัดเก็บถาวรใน Cloud Storage
