# TYPE 2: ติดตามผลการใช้สินค้า (Work Type Module Guide)

> **Module Path**: `modules/activity-plans/features/type-2/`  
> **Work Type Code**: `TYPE_2`  
> **Thai Label**: `ติดตามผลการใช้สินค้า` (Product Follow-up)  
> **Architecture Pattern**: Self-Contained Feature Slice with Centralized Components, Mapper, Strategy & Types

---

## 📌 1. ภาพรวม (Overview)

ประเภทงาน **`TYPE_2` (ติดตามผลการใช้สินค้า)** ใช้สำหรับวางแผนและบันทึกผลการติดตามการใช้งานผลิตภัณฑ์เกษตรของลูกค้า ทั้งในรูปแบบ **ร้านค้าตัวแทนจำหน่าย (STORE)** และ **เกษตรกร (FARMER)** โดยรองรับความสัมพันธ์แบบ **Multi-Target (1 Plan : N ร้านค้า/เกษตรกร และในแต่ละเป้าหมายสามารถมี N รายการสินค้าที่ติดตาม)**

### วัตถุประสงค์หลักในการติดตาม:
1. **เข้าพบเกษตรกร (FARMER)**:
   - **เกษตรกรในระบบ**: เลือกลูกค้าจากตาราง `Customer` ที่มีประเภทเป็นเกษตรกร
   - **เกษตรกรนอกระบบ (ไม่ได้ลงทะเบียน)**: ติ๊กเลือกเกษตรกรนอกระบบ พร้อมระบุชื่อ-สกุล และเบอร์โทรศัพท์
2. **เข้าพบร้านค้า (STORE)**:
   - เลือกร้านค้าตัวแทนจำหน่าย/ผู้แทนจำหน่ายย่อยจากระบบ
3. **รายการสินค้าที่ติดตาม (Follow-up Products)**:
   - ในแต่ละเป้าหมาย สามารถเลือกสินค้าจาก Product Catalog ได้มากกว่า 1 รายการ
   - สามารถระบุบันทึกหรือข้อสังเกตเฉพาะแต่ละสินค้าได้
4. **บันทึกผลการปฏิบัติงานจริง (Actual Outcome)**:
   - ผลการใช้สินค้า: `"ลูกค้าพึงพอใจ"` หรือ `"พบปัญหา"`
   - รายละเอียดความพึงพอใจ หรือรายละเอียดปัญหาที่พบ
   - สามารถเพิ่มรายการสินค้าที่ติดตามเพิ่มเติมหน้างานได้ (`isAdditional = true`)
   - แนบรูปภาพผลการใช้สินค้า/สภาพแปลงพืช

---

## 📂 2. โครงสร้างโฟลเดอร์ (Directory Structure)

```text
modules/activity-plans/features/type-2/
├── application/                      # 🧠 Business Logic, Mappers, Validation & Strategy
│   ├── validation.ts                 # Validation Schemas (Zod)
│   ├── mapper.ts                     # Single Source of Truth สำหรับสกัดและแปลงข้อมูล Form State <-> DB
│   └── type2.strategy.ts             # WorkTypeStrategy Handler (Validation & Persistence)
│
├── components/                       # 🖥️ Feature UI Components (Vertical Slice)
│   ├── type2-plan-form.tsx           # แบบฟอร์มบันทึกแผนงาน (Create & Edit)
│   ├── type2-actual-form.tsx         # หน้าจอบันทึกผลการปฏิบัติงานจริงและแนบรูปภาพ
│   ├── type2-detail-view.tsx         # แสดงผลรายละเอียดเป้าหมายและผลการปฏิบัติงานจริง
│   ├── type2-approval-card.tsx       # แสดงผลเป้าหมายในหน้าพิจารณาอนุมัติ
│   └── type2-plan-card.tsx           # การ์ดแสดงข้อมูลเป้าหมายตามแผน (Auto-hides in unplanned mode)
│
├── hooks/                            # 🪝 Encapsulated Hooks
│   ├── use-type2-form.ts             # Form Hook สำหรับ Plan Stage
│   └── use-type2-actual.ts           # Hook จัดการ State ของผลจริง (Actual Stage)
│
├── types/                            # 📐 Type Definitions รวมศูนย์
│   └── index.ts                      # Domain Types ทั้งหมดของ Type 2
│
├── index.ts                          # 📦 Public Barrel Export (Backward Compatible)
└── README.md                         # 📖 เอกสารกำกับ Type 2 (ไฟล์นี้)
```

---

## 🔄 3. การไหลของข้อมูล (Data Flow & Strategy Integration)

```mermaid
flowchart TD
    subgraph UI_Layer [User Interface]
        CreateForm[Type2Followup / Create]
        ActualForm[ActualType2Followup / Actual]
        DetailView[DetailType2Followup / Detail]
        ApproveView[ApprovalType2Followup / Approval]
    end

    subgraph Feature_Slice [modules/activity-plans/features/type-2]
        Mapper[mapper.ts: extract / parse / map]
        Strategy[type2.strategy.ts: WorkTypeStrategy]
        Types[types/index.ts: Domain Types]
    end

    subgraph Central_Core [Application & Host Layer]
        Registry[type-registry.ts: registerStrategy]
        PlanExtractor[plan-extractor.ts]
        SummaryParser[summary-parser.ts]
        DetailUtils[detail-view/utils.ts]
    end

    subgraph Database [Database Layer]
        DedicatedTargets[ActivityPlanType2Target]
        DedicatedProducts[ActivityPlanType2Product]
        FollowupResults[ActivityResultFollowupItem]
        LegacyStores[ActivityPlanStore - Synced]
        LegacyProducts[ActivityPlanProduct - Synced]
    end

    CreateForm --> Types
    ActualForm --> Types
    CreateForm --> Strategy
    Strategy --> DedicatedTargets
    Strategy --> DedicatedProducts
    Strategy --> LegacyStores
    Strategy --> LegacyProducts
    ActualForm --> Strategy
    Strategy --> FollowupResults

    PlanExtractor -->|Delegate| Mapper
    SummaryParser -->|Delegate| Mapper
    DetailUtils -->|Delegate| Mapper
    Registry --> Strategy
```

---

## 🗄️ 4. รายละเอียดตารางฐานข้อมูลที่เกี่ยวข้อง (Database Tables Deep Dive)

ในสถาปัตยกรรมใหม่ Type 2 มี **Dedicated Relational Tables** ของตนเองโดยตรง เพื่อแยกความเป็นเจ้าของข้อมูล (Data Ownership) ให้ชัดเจน ป้องกันการปะปนกับ Type อื่น และทำงานควบคู่กับการ Dual-Write Sync ไปยังตาราง Generic เพื่อรองรับ Backward Compatibility:

### 4.1 ตารางเฉพาะ `activity_plan_type_2_targets` (Dedicated Type 2 Plan Targets)
ตารางระดับเป้าหมาย (1 แผน : N เป้าหมาย) เก็บข้อมูลร้านค้า หรือเกษตรกรที่จะเข้าพบเพื่อติดตามผล:

| คอลัมน์ (Column) | ชนิดข้อมูล (Type) | Nullable | ความหมายและรายละเอียด |
|---|---|---|---|
| `id` | `VARCHAR(30)` (cuid) | No | Primary Key |
| `activity_plan_id` | `VARCHAR(30)` | No | Foreign Key อ้างอิง `activity_plans.id` (Cascade Delete) |
| `visit_purpose` | `TEXT` | No | วัตถุประสงค์การเข้าพบ: `'FARMER'` (เกษตรกร) หรือ `'STORE'` (ร้านค้า) |
| `store_id` | `VARCHAR(30)` | Yes | Foreign Key อ้างอิง `customers.id` (เป็น null หากเป็นเกษตรกรนอกระบบ) |
| `province` | `TEXT` | No | จังหวัดเป้าหมาย |
| `is_unregistered_farmer` | `BOOLEAN` | No (default: false) | แฟล็กระบุว่าเป็นเกษตรกรนอกระบบหรือไม่ |
| `unregistered_farmer_name` | `TEXT` | Yes | ชื่อ-สกุล ของเกษตรกรนอกระบบ |
| `unregistered_farmer_phone` | `TEXT` | Yes | เบอร์โทรศัพท์ของเกษตรกรนอกระบบ |
| `notes` | `TEXT` | Yes | รายละเอียดหรือข้อสังเกตเพิ่มเติมของเป้าหมาย |
| `created_at` / `updated_at` | `TIMESTAMP` | No | วันที่และเวลาสร้าง/แก้ไขล่าสุด |

---

### 4.2 ตารางเฉพาะ `activity_plan_type_2_products` (Dedicated Type 2 Plan Products)
ตารางรายการสินค้าที่ติดตามของแต่ละเป้าหมาย (1 เป้าหมาย : N สินค้า):

| คอลัมน์ (Column) | ชนิดข้อมูล (Type) | Nullable | ความหมายและรายละเอียด |
|---|---|---|---|
| `id` | `VARCHAR(30)` (cuid) | No | Primary Key |
| `target_id` | `VARCHAR(30)` | No | Foreign Key อ้างอิง `activity_plan_type_2_targets.id` (Cascade Delete) |
| `activity_plan_id` | `VARCHAR(30)` | No | Foreign Key อ้างอิง `activity_plans.id` (Cascade Delete) |
| `product_id` | `VARCHAR(30)` | No | Foreign Key อ้างอิง `products.id` (Restrict Delete) |
| `notes` | `TEXT` | Yes | บันทึกเฉพาะเกี่ยวกับสินค้านี้ เช่น จุดที่ต้องการสังเกต |
| `created_at` / `updated_at` | `TIMESTAMP` | No | วันที่และเวลาสร้าง/แก้ไขล่าสุด |

---

### 4.3 ตารางเฉพาะ `activity_result_followup_items` (Dedicated Type 2 Actual Follow-up Outcomes)
ตารางเก็บผลการติดตามสินค้าตามการปฏิบัติงานจริง สัมพันธ์กับ `activity_results`:

| คอลัมน์ (Column) | ชนิดข้อมูล (Type) | Nullable | ความหมายและรายละเอียด |
|---|---|---|---|
| `id` | `VARCHAR(30)` (cuid) | No | Primary Key |
| `activity_result_id` | `VARCHAR(30)` | No | Foreign Key อ้างอิง `activity_results.id` (Cascade Delete) |
| `store_id` | `VARCHAR(30)` | Yes | Foreign Key อ้างอิง `customers.id` (ร้านค้า/เกษตรกร) |
| `product_id` | `VARCHAR(30)` | No | Foreign Key อ้างอิง `products.id` |
| `product_name` | `TEXT` | Yes | ชื่อสินค้า (Denormalized Snapshot เพื่อความเร็ว) |
| `usage_result` | `TEXT` | Yes | ผลการใช้งาน: `'ลูกค้าพึงพอใจ'` หรือ `'พบปัญหา'` |
| `followup_detail` | `TEXT` | Yes | รายละเอียดการติดตามผล (บันทึกเมื่อลูกค้าพึงพอใจ) |
| `problem_detail` | `TEXT` | Yes | รายละเอียดปัญหาที่พบ (บันทึกเมื่อพบปัญหา) |
| `is_additional` | `BOOLEAN` | No (default: false) | `false` = สินค้าตามแผนงานเดิม, `true` = สินค้าที่ติดตามเพิ่มเติมหน้างาน |

---

### 4.4 ตาราง `activity_attachments` (รูปภาพประกอบผลงานจริง)
จัดเก็บรูปภาพสภาพพืช ผลผลิต หรือแปลงทดลองจากการติดตามผล:

| คอลัมน์ (Column) | ชนิดข้อมูล (Type) | Nullable | ความหมายและรายละเอียดสำหรับ Type 2 |
|---|---|---|---|
| `id` | `VARCHAR(30)` (cuid) | No | Primary Key |
| `activity_plan_id` | `VARCHAR(30)` | No | Foreign Key อ้างอิง `activity_plans.id` |
| `activity_result_id` | `VARCHAR(30)` | Yes | Foreign Key อ้างอิง `activity_results.id` |
| `work_type_code` | `VARCHAR(50)` | Yes | ระบุเป็น `'TYPE_2'` |
| `category` | `ENUM` | No | กำหนดเป็น `'GENERAL'` |
| `file_url` | `TEXT` | No | URL ที่เก็บไฟล์รูปภาพ |

---

### 4.5 ตารางส่วนกลางที่ Sync คู่ขนาน (Dual-Write Legacy Compatibility)
ระบบของ `type2Strategy.savePlan` จะบันทึกข้อมูลคู่ขนานไปยังตารางส่วนกลางเดิมเสมอ เพื่อให้ Report เก่าและระบบภายนอกยังคงทำงานได้:
- **`activity_plan_stores`**: บันทึกเป้าหมายโดยระบุ `work_type_code = 'TYPE_2'`
- **`activity_plan_products`**: บันทึกสินค้าโดยระบุ `work_type_code = 'TYPE_2'` และผูก `store_id`

---

## 🛡️ 5. สัญญาการใช้งานร่วมกับภายนอก (Public API Contract)

ไฟล์ภายนอกโฟลเดอร์ `modules/activity-plans/features/type-2/` ต้องเรียกใช้งานผ่าน `index.ts` เท่านั้น:

```typescript
import {
  Type2Followup,               // Form สร้าง/แก้ไขแผน
  DetailType2Followup,         // View รายละเอียด
  ApprovalType2Followup,       // View หน้าอนุมัติ
  ActualType2Followup,         // Form บันทึกผลจริง
  Type2PlanCard,               // การ์ดแสดงเป้าหมาย
  extractType2PlanTargets,     // ดึงข้อมูลเป้าหมาย Multi-Target
  parseType2ActualResult,      // แกะผลลัพธ์จาก DB
  mapType2ToSectionItems,      // แปลงข้อมูลสำหรับ Section Card
  type Type2TargetItem,        // ประเภทข้อมูลเป้าหมายหลัก
  type FollowupProductItem,    // รายการสินค้าติดตาม
} from "@/modules/activity-plans/features/type-2";
```

## 🔗 ความเชื่อมโยงกับระบบส่วนกลาง (Dependencies & External Functions Mapping)

### 1. ฟังก์ชันและโมดูลที่ Slice นี้เรียกใช้งาน (Inbound Dependencies)
| หมวดหมู่ | ฟังก์ชัน / โมดูลที่เรียกใช้ | ที่อยู่ไฟล์ (File Path) | วัตถุประสงค์การใช้งาน |
|---|---|---|---|
| **Infrastructure** | `db (PrismaClient)` | [`lib/db.ts`](file:///lib/db.ts) | ประมวลผล Transaction บันทึกข้อมูล activity_plan_type_2_targets และ products |
| **Application** | `WorkTypeStrategy, PrismaTransaction, StrategyValidationResult` | [`modules/activity-plans/application/strategies/work-type-strategy.interface.ts`](file:///modules/activity-plans/application/strategies/work-type-strategy.interface.ts) | สัญญากลางสำหรับ Strategy Pattern |
| **Application** | `getWorkTypeCode` | [`modules/activity-plans/constants/index.ts`](file:///modules/activity-plans/constants/index.ts) | Normalize รหัส Work Type |
| **Shared UI / Utils** | `uploadActivityPlanImageGroup, collectPermanentUrls` | [`modules/activity-plans/features/shared/actual-view/utils/index.ts`](file:///modules/activity-plans/features/shared/actual-view/utils/index.ts) | อัปโหลดรูปภาพการติดตามผล |
| **External Module** | `listProductsAction` | [`modules/products/server/actions.ts`](file:///modules/products/server/actions.ts) | ค้นหารายการสินค้าที่ติดตามผล |

### 2. จุดที่ระบบส่วนกลางเรียกใช้งาน Slice นี้ (Outbound Integration Points)
| ส่วนกลางที่เรียกใช้ | ไฟล์ที่เรียกใช้ (Caller Path) | สิ่งที่นำไปใช้ (Export / Function) | วัตถุประสงค์ |
|---|---|---|---|
| **Strategy Registry** | [`modules/activity-plans/application/strategies/type-registry.ts`](file:///modules/activity-plans/application/strategies/type-registry.ts) | `Type2Strategy` | ลงทะเบียน Handler เพื่อบันทึกเป้าหมายและผลติดตาม |
| **Repository Query** | [`modules/activity-plans/infrastructure/activity-plan-include.ts`](file:///modules/activity-plans/infrastructure/activity-plan-include.ts) | `type2Targets` | Eager load ข้อมูลเป้าหมายและสินค้าใน findActivityPlanById |
| **Detail Mapper** | [`modules/activity-plans/features/shared/detail-view/utils.ts`](file:///modules/activity-plans/features/shared/detail-view/utils.ts) | `mapType2ToSectionItems` | แปลงข้อมูลสินค้าที่ติดตามผลเพื่อแสดงใน Detail View |
| **Approval Queue** | [`modules/activity-plans/features/shared/approve-view/components/work-types/index.ts`](file:///modules/activity-plans/features/shared/approve-view/components/work-types/index.ts) | `Type2ApprovalCard` | แสดงการ์ดสรุปรายการติดตามผลในหน้าอนุมัติ |
| **Actual Form** | [`modules/activity-plans/features/shared/actual-view/components/work-types/index.ts`](file:///modules/activity-plans/features/shared/actual-view/components/work-types/index.ts) | `Type2ActualForm` | ฟอร์มบันทึกผลการติดตามสินค้า |

