# TYPE 1: เข้าพบร้านค้า / Key Farmer (Work Type Module Guide)

> **Module Path**: `modules/activity-plans/features/type-1/`  
> **Work Type Code**: `TYPE_1`  
> **Thai Label**: `เข้าพบร้านค้า / Key Farmer` (หรือ `เข้าพบเกษตรกร`)  
> **Architecture Pattern**: Self-Contained Feature Slice with Centralized Components, Mapper & Types

---

## 📌 1. ภาพรวม (Overview)

ประเภทงาน **`TYPE_1` (เข้าพบร้านค้า / Key Farmer)** ใช้สำหรับบันทึกแผนงานและผลการเข้าพบลูกค้าในรูปแบบ **Multi-Target (1 Plan : N ร้านค้า/เกษตรกร เช่น 1 แผน เข้าพบ 4 ร้านค้า)** โดยแต่ละเป้าหมายรองรับ 2 วัตถุประสงค์หลัก:

1. **เข้าพบเกษตรกร (FARMER)**:
   * **เกษตรกรในระบบ (Registered)**: เลือกจังหวัด $\rightarrow$ เลือกลูกค้าจากตาราง `Customer` ที่มี `customerType = 'FARMER'`
   * **เกษตรกรนอกระบบ (Unregistered)**: ติ๊ก "ไม่มีในระบบ" $\rightarrow$ ระบุชื่อ-สกุล และเบอร์โทรศัพท์ (9-10 หลัก)
2. **เข้าพบร้านค้า (STORE)**:
   * เลือกร้านค้าตัวแทนจำหน่ายจากตาราง `Customer` ที่มี `customerType` เป็น `'DEALER'` หรือ `'SUBDEALER'` เท่านั้น (ไม่อนุญาตให้เลือกลูกค้านอกระบบ)
3. **การเพิ่ม/ลบเป้าหมาย (Dynamic Targets)**:
   * สามารถกดปุ่ม **"+ เพิ่มร้านค้า / เกษตรกร"** เพื่อเพิ่มเป้าหมายได้ตามต้องการ (เช่น 4 ร้านค้าในวันเดียว) และมีปุ่มลบถังขยะสำหรับแต่ละรายการ (คงไว้อย่างน้อย 1 เป้าหมาย)

---

## 📂 2. โครงสร้างโฟลเดอร์ล่าสุด (Refactored Directory Structure)

โครงสร้างโฟลเดอร์ได้รับการจัดระเบียบตาม Module Architecture Contract:

```text
modules/activity-plans/features/type-1/
├── application/                      # 🧠 Business Logic, Validation, Mappers & Strategy
│   ├── validation.ts                 # Pure Validation functions & Zod Schemas
│   ├── mapper.ts                     # Single Source of Truth สำหรับแปลงข้อมูล Form State <-> DB
│   └── type1.strategy.ts             # WorkTypeStrategy Handler สำหรับ Core Orchestration & Persistence
│
├── components/                       # 🖥️ Feature UI Components (Vertical Slice)
│   ├── type1-plan-form.tsx           # ฟอร์มบันทึกแผนงาน (Planned & Unplanned Plan Section)
│   ├── type1-actual-form.tsx         # ฟอร์มบันทึกผลการปฏิบัติงานจริง (Planned & Unplanned Actual Section)
│   ├── type1-detail-view.tsx         # หน้าแสดงรายละเอียดผลการปฏิบัติงาน (Read-only Detail View)
│   ├── type1-approval-card.tsx       # การ์ดแสดงผลในหน้าอนุมัติ (Approval Card)
│   ├── type1-plan-card.tsx           # การ์ดสรุปเป้าหมายแผนงานเดิม (Auto-hides in Unplanned mode)
│   └── type1-visit-form.tsx          # Wrapper re-export (Backward-compatible alias)
│
├── hooks/                            # 🪝 Encapsulated Hooks
│   ├── use-type1-form.ts             # Form Hook สำหรับ Plan Stage
│   └── use-type1-actual.ts           # Hook สำหรับ Actual Stage (Hydration, Photos, GPS, Payload)
│
├── types/                            # 📐 Type Definitions รวมศูนย์
│   └── index.ts                      # Single Source of Truth สำหรับ Type 1 ทั้งหมด
│
├── index.ts                          # 📦 Public Barrel Export (Vertical Slice & Backward Compatible)
└── README.md                         # 📖 เอกสารกำกับ Type 1 (ไฟล์นี้)
```

---

## 🗄️ 3. รายละเอียดตารางฐานข้อมูลที่เกี่ยวข้อง (Database Tables Deep Dive)

ในสถาปัตยกรรมใหม่ Type 1 มี **Dedicated Relational Tables** ของตนเองโดยตรง เพื่อป้องกันปัญหาการแชร์ฟิลด์ปะปนกับ Type อื่น และทำงานควบคู่กับการ Sync ตาราง Legacy เพื่อรองรับ Backward Compatibility:

### 3.1 ตารางเฉพาะ `activity_plan_type_1_stores` (Dedicated Type 1 Plan Store)
ตารางเฉพาะสำหรับ Type 1 เก็บข้อมูลเข้าพบร้านค้า/เกษตรกรโดยตรง:

| คอลัมน์ (Column) | ชนิดข้อมูล (Type) | Nullable | ความหมายและรายละเอียด |
|---|---|---|---|
| `id` | `VARCHAR(30)` (cuid) | No | Primary Key |
| `activity_plan_id` | `VARCHAR(30)` | No | Foreign Key อ้างอิง `activity_plans.id` (Cascade Delete) |
| `visit_purpose` | `TEXT` | No | วัตถุประสงค์การเข้าพบ: `'FARMER'` (เกษตรกร) หรือ `'STORE'` (ร้านค้า) |
| `store_id` | `VARCHAR(30)` | Yes | Foreign Key อ้างอิง `Customer.id` (เป็น null หากเป็นเกษตรกรนอกระบบ) |
| `province` | `TEXT` | No | จังหวัดเป้าหมาย |
| `is_unregistered_farmer` | `BOOLEAN` | No (default: false) | แฟล็กระบุว่าเป็นเกษตรกรนอกระบบหรือไม่ |
| `unregistered_farmer_name` | `TEXT` | Yes | ชื่อ-สกุล ของเกษตรกรนอกระบบ |
| `unregistered_farmer_phone` | `TEXT` | Yes | เบอร์โทรศัพท์ของเกษตรกรนอกระบบ |
| `topic` | `TEXT` | Yes | หัวข้อหลักในการเข้าพบ (แทนที่การยืมคอลัมน์ `remarks`) |
| `notes` | `TEXT` | Yes | รายละเอียดเพิ่มเติมในการเข้าพบ |

### 3.2 ตารางเฉพาะ `activity_result_type_1` (Dedicated Type 1 Actual Outcome)
ตารางเฉพาะสำหรับ Type 1 เก็บผลการเข้าพบจริง สัมพันธ์แบบ **1:1** กับ `activity_plans`:

| คอลัมน์ (Column) | ชนิดข้อมูล (Type) | Nullable | ความหมายและรายละเอียด |
|---|---|---|---|
| `id` | `VARCHAR(30)` (cuid) | No | Primary Key |
| `activity_plan_id` | `VARCHAR(30)` | No | Foreign Key อ้างอิง `activity_plans.id` (Unique, 1:1) |
| `product_advice` | `TEXT` | Yes | รายชื่อสินค้าที่ให้คำแนะนำ |
| `discussionResult` | `TEXT` | Yes | สรุปผลการพูดคุยกับเกษตรกรหรือร้านค้า |
| `sales_opportunity` | `TEXT` | Yes | การประเมินโอกาสการขาย: `'สูง'` หรือ `'ต่ำ'` |
| `next_meeting_date` | `TIMESTAMP` | Yes | วันที่นัดหมายครั้งถัดไป |
| `farmer_home_address` | `TEXT` | Yes | ที่อยู่บ้านเกษตรกร |
| `plot_latitude` | `DECIMAL(10, 7)` | Yes | พิกัดละติจูดของแปลงเกษตรกร (-90 ถึง 90) |
| `plot_longitude` | `DECIMAL(10, 7)` | Yes | พิกัดลองจิจูดของแปลงเกษตรกร (-180 ถึง 180) |

### 3.3 ตารางส่วนกลางที่ Sync คู่ขนาน (Legacy Dual-Write Tables)
- `activity_plan_stores`: มีการบันทึกควบคู่เพื่อรองรับ View / Reports เดิมที่ยังอ่านจากตารางรวม
- `activity_results`: มีการบันทึกควบคู่เพื่อรองรับ View เดิม

### 3.4 ตาราง `activity_plan_stores` (Legacy Plan Store Reference)
| คอลัมน์ (Column) | ชนิดข้อมูล (Type) | Nullable | ความหมายและรายละเอียด |
|---|---|---|---|
| `id` | `VARCHAR(30)` (cuid) | No | Primary Key ของแถวข้อมูล |
| `activity_plan_id` | `VARCHAR(30)` | No | Foreign Key อ้างอิงไปยัง `activity_plans.id` (Cascade Delete) |
| `work_type_code` | `VARCHAR(50)` | No | รหัสประเภทงาน ระบุเป็น `'TYPE_1'` เสมอ |
| `visit_purpose` | `TEXT` | Yes | วัตถุประสงค์การเข้าพบ: `'FARMER'` (เกษตรกร) หรือ `'STORE'` (ร้านค้า) |
| `store_id` | `VARCHAR(30)` | Yes | Foreign Key อ้างอิง `Customer.id` (เป็น null หากเป็นเกษตรกรนอกระบบ) |
| `store_name` | `TEXT` | Yes | ชื่อร้านค้า หรือชื่อเกษตรกร (Denormalized เพื่อความเร็วในการแสดงผล) |
| `province` | `TEXT` | Yes | จังหวัดเป้าหมาย (สำหรับกรณีเข้าพบเกษตรกร) |
| `is_unregistered_farmer` | `BOOLEAN` | No (default: false) | แฟล็กระบุว่าเป็นเกษตรกรนอกระบบที่ยังไม่มีในฐานข้อมูลหรือไม่ |
| `unregistered_farmer_name` | `TEXT` | Yes | ชื่อ-สกุล ของเกษตรกรนอกระบบ |
| `unregistered_farmer_phone` | `TEXT` | Yes | เบอร์โทรศัพท์ของเกษตรกรนอกระบบ |
| `remarks` | `TEXT` | Yes | ประเด็นหลักในการเข้าพบ (Topic) เช่น "แจ้งข่าวสาร", "ให้คำแนะนำการใช้สินค้า" |
| `notes` | `TEXT` | Yes | รายละเอียดเพิ่มเติมในการเข้าพบ (Detail) |

### 3.2 ตาราง `activity_results` (ผลการปฏิบัติงานจริง)
ตารางเก็บผลการดำเนินงานจริง สัมพันธ์แบบ **1:1** กับ `activity_plans`:

| คอลัมน์ (Column) | ชนิดข้อมูล (Type) | Nullable | ความหมายและรายละเอียดสำหรับ Type 1 |
|---|---|---|---|
| `id` | `VARCHAR(30)` (cuid) | No | Primary Key |
| `activity_plan_id` | `VARCHAR(30)` | No | Foreign Key อ้างอิง `activity_plans.id` (Unique, 1:1) |
| `discussion_result` | `TEXT` | Yes | สรุปผลการพูดคุยกับเกษตรกรหรือร้านค้า (บังคับกรอกเมื่อสถานะ COMPLETED) |
| `product_advice` | `TEXT` | Yes | รายชื่อสินค้าที่ให้คำแนะนำ (คั่นด้วยจุลภาค เช่น "แฮตแทค, ปุ๋ยเกล็ด") |
| `sales_opportunity` | `TEXT` | Yes | การประเมินโอกาสการขาย: `'สูง'` หรือ `'ต่ำ'` |
| `next_action` | `TEXT` | Yes | สิ่งที่ต้องดำเนินการต่อ เช่น "ส่งตัวอย่างสินค้า", "นัดตรวจแปลง" |
| `next_meeting_date` | `TIMESTAMP` | Yes | วันที่นัดหมายครั้งถัดไป |
| `farmer_home_address` | `TEXT` | Yes | ที่อยู่บ้านเกษตรกร (แสดงเฉพาะโหมด FARMER) |
| `plot_latitude` | `DECIMAL(10, 7)` | Yes | พิกัดละติจูดของแปลงเกษตรกร (-90 ถึง 90) |
| `plot_longitude` | `DECIMAL(10, 7)` | Yes | พิกัดลองจิจูดของแปลงเกษตรกร (-180 ถึง 180) |
| `result_status` | `ENUM` | No | สถานะผลการทำกิจกรรม (`COMPLETED`, `PARTIAL`, `CANCELLED`, `POSTPONED`) |
| `result_summary` | `TEXT` | Yes | ข้อความสรุปผลกิจกรรมโดยรวม (สร้างอัตโนมัติจาก Summary Builder) |

### 3.3 ตาราง `activity_attachments` (รูปภาพแนบผลงานจริง)
ตารางจัดเก็บ URL รูปถ่ายแปลงเกษตรกรจากการเข้าพบจริง:

| คอลัมน์ (Column) | ชนิดข้อมูล (Type) | Nullable | ความหมายและรายละเอียดสำหรับ Type 1 |
|---|---|---|---|
| `id` | `VARCHAR(30)` (cuid) | No | Primary Key |
| `activity_plan_id` | `VARCHAR(30)` | No | Foreign Key อ้างอิง `activity_plans.id` |
| `activity_result_id`| `VARCHAR(30)` | Yes | Foreign Key อ้างอิง `activity_results.id` |
| `work_type_code` | `VARCHAR(50)` | Yes | ระบุเป็น `'TYPE_1'` |
| `category` | `ENUM` | No | กำหนดเป็น `'GENERAL'` |
| `file_url` | `TEXT` | No | URL รูปภาพแปลงเกษตรกรที่อัปโหลดขึ้น Cloud Storage (สูงสุด 5 รูป) |
| `file_name` | `TEXT` | No | ชื่อไฟล์รูปภาพต้นฉบับ |

### 3.4 ตาราง `Customer` (Master Data ลูกค้าสำหรับอ้างอิง)
ตารางหลักของลูกค้าที่ `activity_plan_stores.store_id` ชี้ไป:
- `customerType = 'FARMER'`: ใช้สำหรับโหมดเกษตรกรในระบบ
- `customerType IN ('DEALER', 'SUBDEALER')`: ใช้สำหรับโหมดเข้าพบร้านค้า

---

## 🖥️ 4. Data Mapping & Field Specification แยกตามหน้าจอ

### 4.1 หน้าสร้างและแก้ไขแผนงาน (Plan Stage: Create / Edit Form)
**ไฟล์ UI**: [components/type1-visit-form.tsx](file:///d:/code/crm-bank/modules/activity-plans/features/type-1/components/type1-visit-form.tsx)  
**Hook**: [hooks/use-type1-form.ts](file:///d:/code/crm-bank/modules/activity-plans/features/type-1/hooks/use-type1-form.ts)  
**Mapper**: [application/mapper.ts](file:///d:/code/crm-bank/modules/activity-plans/features/type-1/application/mapper.ts) $\rightarrow$ `mapType1FormToPlanStore()`

| UI Control / Field | Form State Key | Validation Rule | บันทึกลงตาราง (DB Table) | คอลัมน์ (DB Column) | เงื่อนไข / พฤติกรรม |
|---|---|---|---|---|---|
| **วัตถุประสงค์ของประเภทงาน (Radio)** | `item.visitPurpose` | บังคับเลือก `'FARMER'` หรือ `'STORE'` | `activity_plan_stores` | `visit_purpose` | สลับโหมดจะล้างฟิลด์เฉพาะทางของอีกโหมดทันที |
| **จังหวัด (Dropdown)** | `item.province` | บังคับเลือกจังหวัด (เฉพาะโหมด FARMER) | `activity_plan_stores` | `province` | เปลี่ยนจังหวัดจะล้างเกษตรกรเดิมที่เลือกไว้ |
| **เช็กบ็อกซ์ "ไม่มีในระบบ"** | `item.isUnregisteredFarmer` | `boolean` (เฉพาะโหมด FARMER) | `activity_plan_stores` | `is_unregistered_farmer` | ติ๊กถูกจะสลับเป็นช่องกรอกชื่อ/เบอร์โทร |
| **เกษตรกรในระบบ (Combobox)** | `item.storeId` & `item.customerName` | บังคับเลือกจากฐานข้อมูล `Customer` (type: FARMER) | `activity_plan_stores` | `store_id` (FK), `store_name` | บันทึก `store_id` เป็น ID ลูกค้า |
| **ชื่อ-สกุล เกษตรกรนอกระบบ (Input)** | `item.unregisteredFarmerName` | บังคับกรอกหากเลือกไม่มีในระบบ | `activity_plan_stores` | `unregistered_farmer_name`, `store_name` | บันทึก `store_id` เป็น `null` |
| **เบอร์โทรศัพท์เกษตรกร (Input)** | `item.unregisteredFarmerPhone` | ตัวเลข 9-10 หลัก (ถ้ากรอก) | `activity_plan_stores` | `unregistered_farmer_phone` | กรองขีดและช่องว่างออกก่อนบันทึก |
| **ร้านค้า (Combobox)** | `item.storeId` & `item.customerName` | บังคับเลือกจาก `Customer` (type: DEALER/SUBDEALER) | `activity_plan_stores` | `store_id` (FK), `store_name` | มีเฉพาะในโหมด STORE |
| **ประเด็นหลัก (Combobox)** | `item.topic` | บังคับเลือก (default: "แจ้งข่าวสาร") | `activity_plan_stores` | `remarks` | นำค่า topic ไปเก็บที่คอลัมน์ `remarks` |
| **รายละเอียดเพิ่มเติม (Input/Textarea)** | `item.detail` | Optional string | `activity_plan_stores` | `notes` | นำค่า detail ไปเก็บที่คอลัมน์ `notes` |

---

### 4.2 หน้าบันทึกผลการปฏิบัติงานจริง (Actual Outcome Stage Form)
**ไฟล์ UI**: [actual/actual-type1-visit.tsx](file:///d:/code/crm-bank/modules/activity-plans/features/type-1/actual/actual-type1-visit.tsx)  
**Hook**: [actual/use-type1-actual.ts](file:///d:/code/crm-bank/modules/activity-plans/features/type-1/actual/use-type1-actual.ts)  
**Summary Builder**: `summary-builder.ts` $\rightarrow$ `buildResultSummary()`

| UI Control / Field | Form State Key | Validation Rule | บันทึกลงตาราง (DB Table) | คอลัมน์ (DB Column) | เงื่อนไข / พฤติกรรม |
|---|---|---|---|---|---|
| **ที่อยู่บ้านเกษตรกร (Textarea)** | `t1FarmerHomeAddress` | Optional string | `activity_results` | `farmer_home_address` | แสดงเฉพาะเมื่อแผนเป็นโหมด FARMER |
| **พิกัดแปลง: Latitude (Input/GPS)** | `t1PlotLatitude` | Decimal string (-90 ถึง 90) | `activity_results` | `plot_latitude` | กดปุ่ม "ใช้ตำแหน่งปัจจุบัน" ดึง GPS จาก Browser ได้ |
| **พิกัดแปลง: Longitude (Input/GPS)**| `t1PlotLongitude` | Decimal string (-180 ถึง 180) | `activity_results` | `plot_longitude` | กดปุ่ม "ใช้ตำแหน่งปัจจุบัน" ดึง GPS จาก Browser ได้ |
| **รูปแปลงเกษตรกร (Gallery Upload)** | `t1PlotImages` | สูงสุด 5 รูป, รูปละไม่เกิน 20MB | `activity_attachments` | `file_url`, `file_name`, `work_type_code='TYPE_1'` | อัปโหลดเข้า Cloud Storage ก่อนบันทึก |
| **สินค้าที่ให้คำแนะนำ (Multi Combobox)**| `t1ProductAdvice` | Comma-separated product names | `activity_results` | `product_advice` | แสดงเมื่อเลือกหัวข้อ "ให้คำแนะนำการใช้สินค้า" |
| **ประเมินโอกาสการขาย (Button Group)**| `t1SalesOpportunity` | บังคับเลือก `'สูง'` หรือ `'ต่ำ'` | `activity_results` | `sales_opportunity` | แสดงเมื่อเลือกหัวข้อ "ให้คำแนะนำการใช้สินค้า" |
| **ผลการพูดคุย (Textarea)** | `t1DiscussionResult` | บังคับกรอกเมื่อสถานะ COMPLETED | `activity_results` | `discussion_result` | สรุปประเด็นสำคัญที่ได้จากการพูดคุย |
| **สิ่งที่ต้องดำเนินการต่อ (Input)** | `t1NextAction` | Optional string | `activity_results` | `next_action` | Action plan หลังการเข้าพบ |
| **วันที่นัดหมายครั้งถัดไป (Date Picker)**| `t1NextMeetingDate` | Valid date string / Date | `activity_results` | `next_meeting_date` | บันทึกเป็น Timestamp |

---

### 4.3 หน้าแสดงรายละเอียด (Detail View)
**ไฟล์ UI**: [detail/detail-type1-visit.tsx](file:///d:/code/crm-bank/modules/activity-plans/features/type-1/detail/detail-type1-visit.tsx)  
**Component แผนเดิม**: [components/type1-plan-card.tsx](file:///d:/code/crm-bank/modules/activity-plans/features/type-1/components/type1-plan-card.tsx)  
**Data Extractor**: `plan-extractor.ts` $\rightarrow$ `extractPlanData()`

- **ส่วนข้อมูลแผนงาน (PLAN)**:
  - รองรับ Multi-Store ($N$ เป้าหมาย): ดึงข้อมูลจาก `targets.t1List` และแสดงผลผ่าน `<Type1PlanCard targets={targets} />`
  - มี Badge แสดงจำนวนเป้าหมายรวม เช่น `4 เป้าหมาย` และแต่ละเป้าหมายแยกการ์ดย่อยชัดเจน (เป้าหมายที่ 1, 2, ..., N) พร้อมวัตถุประสงค์ (ร้านค้า / เกษตรกร)
  - แสดง: วัตถุประสงค์ (`visit_purpose`), ร้านค้า/เกษตรกร (`store_name` หรือ `unregistered_farmer_name`), ประเภทลูกค้า (`Customer.customerType`), จังหวัด (`province`), เบอร์โทรศัพท์ (`unregistered_farmer_phone`), ประเด็นหลัก (`remarks` / `topic`), รายละเอียด (`notes`)
- **ส่วนผลการปฏิบัติงานจริง (ACTUAL)**:
  - อ่านจาก `activity_result_type_1` (หรือ fallback `activity_results`) และ `activity_attachments`
  - มีกล่องสรุปเป้าหมายที่เข้าพบตามแผนงานทั้งหมด พร้อมสถานะร้านค้า/เกษตรกร
  - แสดง: ที่อยู่บ้านเกษตรกร (`farmer_home_address`), พิกัดแปลง (`plot_latitude`, `plot_longitude`) พร้อมปุ่มลิงก์เปิด Google Maps อัตโนมัติ, รูปถ่ายแปลงเกษตรกร (`activity_attachments`) พร้อม Lightbox คลิกดูภาพขยาย, สินค้าที่แนะนำ (`product_advice`), โอกาสการขาย (`sales_opportunity`), ผลการพูดคุย (`discussion_result`), สิ่งที่ต้องทำต่อ (`next_action`), วันนัดหมายถัดไป (`next_meeting_date`)

---

### 4.4 หน้าคิวอนุมัติ (Approval Queue View)
**ไฟล์ UI**: [approval/approval-type1-visit.tsx](file:///d:/code/crm-bank/modules/activity-plans/features/type-1/approval/approval-type1-visit.tsx)

- แสดงผลแบบ Read-only สำหรับผู้มีอำนาจอนุมัติ (Manager / Approver)
- รองรับ Multi-Store ($N$ เป้าหมาย): รับ `targets={targets.t1List}` และส่งต่อให้ `<Type1PlanCard />`
- ผู้อนุมัติสามารถตรวจสอบเป้าหมายทั้งหมดในแผนเดียวได้อย่างครบถ้วน ก่อนตัดสินใจ Approve / Reject / Request Correction

---

## 🔄 5. กฎ Data Flow & Work Type Switching

1. **การสลับวัตถุประสงค์ FARMER $\leftrightarrow$ STORE ในหน้าจอ**:
   - เมื่อผู้ใช้เลือก **STORE**: ฟังก์ชัน `handlePurposeChange("STORE")` จะสั่งล้างค่า `province`, `isUnregisteredFarmer`, `unregisteredFarmerName`, `unregisteredFarmerPhone` ทิ้งทันที ป้องกันไม่ให้มีข้อมูลเกษตรกรนอกระบบติดเข้าไปในร้านค้า
   - เมื่อผู้ใช้เลือก **FARMER**: ฟังก์ชันจะล้างร้านค้าเดิมที่เลือกไว้ เพื่อให้เลือกจังหวัดและเกษตรกรใหม่
2. **การสลับ Work Type (Uncheck Type 1)**:
   - ฟังก์ชัน `useType1Form.mapType1Payload()` ตรวจสอบว่ามี `'TYPE_1'` หรือ `'เข้าพบร้านค้า / Key Farmer'` อยู่ใน `selectedWorkTypes` หรือไม่ผ่าน `getWorkTypeCode()`
   - หาก **ไม่ได้เลือก Type 1**: จะคืนค่า `{ planStores: [] }` ทันที ทำให้ **ไม่มีข้อมูล Type 1 หลุดเข้าไปใน Payload หรือ Transaction บันทึกของแผนงานอื่น**
3. **การทำสำเนาแผนงาน (Duplication)**:
   - `duplicateActivityPlanUseCase` สกัดเฉพาะค่าฟิลด์ข้อมูลจากแผนเดิม และสร้างเรคอร์ดใหม่ใน `activity_plan_stores` โดยผูกกับ `activityPlanId` ใหม่ และสร้าง Primary Key `id` ใหม่ทั้งหมด จึงไม่มีปัญหาข้อมูลสองแผนปะปนกัน

---

## 🛠️ 6. คู่มือ: วิธีเพิ่มฟิลด์ใหม่ใน TYPE 1 ใน 6 ขั้นตอน

ตัวอย่าง: ต้องการเพิ่มฟิลด์ `"หัวข้อการนัดหมายครั้งถัดไป"` (`nextMeetingTopic`) ใน `TYPE_1`

### ขั้นตอนที่ 1: ตรวจสอบและอัปเดต Schema ฐานข้อมูล (`prisma/schema.prisma`)
1. กำหนดว่าฟิลด์นี้อยู่ในส่วน **Plan** หรือ **Actual Result**:
   * หากอยู่ใน Plan $\rightarrow$ เพิ่มคอลัมน์ในโมเดล `ActivityPlanStore`
   * หากอยู่ใน Actual $\rightarrow$ เพิ่มคอลัมน์ `next_meeting_topic` ในโมเดล `ActivityResult`
2. สร้าง Prisma Migration:
   ```bash
   npx prisma migrate dev --create-only --name add_next_meeting_topic_to_activity_result
   ```

### ขั้นตอนที่ 2: เพิ่ม Type (`types/index.ts`)
เพิ่มฟิลด์ใน Interface:
```typescript
export interface Type1ActualData {
  // ...ฟิลด์เดิม
  nextMeetingTopic?: string | null;
}
```

### ขั้นตอนที่ 3: เพิ่ม Validation (`application/validation.ts`)
อัปเดต Zod Schema:
```typescript
export const type1ActualResultSchema = z.object({
  // ...ฟิลด์เดิม
  nextMeetingTopic: z.string().optional().nullable(),
});
```

### ขั้นตอนที่ 4: เพิ่ม Mapper (`application/mapper.ts`)
แมปค่าส่งต่อไปยัง Payload:
```typescript
// in mapper.ts -> mapType1ActualFormToDb:
nextMeetingTopic: actual.nextMeetingTopic?.trim() || null,
```

### ขั้นตอนที่ 5: เพิ่มช่องกรอกใน UI (`components/` หรือ `actual/`)
เพิ่ม Component เช่น `<Input label="หัวข้อนัดหมายถัดไป" ... />` ใน [actual/actual-type1-visit.tsx](file:///d:/code/crm-bank/modules/activity-plans/features/type-1/actual/actual-type1-visit.tsx)

### ขั้นตอนที่ 6: แสดงผลในหน้าอ่านอย่างเดียว (`detail/` และ `approval/`)
เพิ่มการแสดงผลใน [detail/detail-type1-visit.tsx](file:///d:/code/crm-bank/modules/activity-plans/features/type-1/detail/detail-type1-visit.tsx) และ [approval/approval-type1-visit.tsx](file:///d:/code/crm-bank/modules/activity-plans/features/type-1/approval/approval-type1-visit.tsx)

---

## 📦 7. Public Export (`index.ts`)

ภายนอกโมดูลสามารถเรียกใช้ Component, Hook, Mapper, Validation และ Types ของ Type 1 ผ่าน `@/modules/activity-plans/features/type-1` โดยตรง
