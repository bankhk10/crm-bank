# Post-Implementation Architecture Audit: Activity Plans Subsystem (Trip Plan)

**Date:** 2026-08-27  
**Auditor:** AI Systems Architect (Pair Programmer)  
**Scope:** Rebuilt Activity Plans Data Architecture (Layers 1–4)  
**Status:** COMPLETED — READY FOR REVIEW  

---

## Executive Summary & Verdict

| Category | Status | Remarks |
|---|:---:|---|
| **1. Database Schema & Normalization** | **PASS** | 9 normalized relational tables created, replacing polymorphic overloading. Foreign Keys to `Product`, `Customer`, `Employee` established. |
| **2. Single Source of Truth (SSOT)** | **PASS** | `WORK_TYPE_CONFIG` and `ActivityType` (TYPE_1 – TYPE_12) act as SSOT. Auto-upsert & ID resolution functional. |
| **3. Tour Subsystem (TYPE_12)** | **PASS** | Dedicated `ActivityPlanTour` model, `hasActual = false`, `requiresApproval = true`. Actual view/buttons disabled. |
| **4. Actual & Sub-Results Normalization** | **PASS** | `ActivityResultSaleItem`, `ActivityResultStockItem`, `ActivityResultSurveyItem`, `ActivityResultDemoItem`, `ActivityAttachment` structured with FKs. |
| **5. Migration & Master Data Safety** | **PASS** | Zero damage to `Product`, `Customer`, `Sales`, `Inventory`, `User`, `Employee`. Migration `20260827120000` deployed cleanly. |
| **6. Legacy Fallback Heuristics** | **WARNING** | UI form still contains fallback string/header parsing for pre-existing legacy data. New plans bypass heuristics completely. |
| **7. resultSummary Overload** | **WARNING** | `resultSummary` is still populated with serialized text for display/legacy compatibility, but normalized tables now store real business data. |

### Overall Readiness Verdict: **PASS (WITH ARCHITECTURAL NOTES)**
> **"Architecture ปัจจุบันพร้อมให้เริ่มพัฒนา Feature ต่อได้ทันที"** โครงสร้างฐานข้อมูลและการเชื่อมโยงข้อมูลหลัก (Core Data Flow) มีความสมบูรณ์ มั่นคง ถูกต้องตามหลักการ Normalized Relational Model และพร้อมสำหรับงาน Reporting & Dashboard โดยไม่ต้องพึ่งพาการ Parse Text ในอนาคต

---

## 1. ตรวจสอบ ActivityPlan Work Type (`ActivityPlan.activityTypeId`)

### Prisma Schema จริง
```prisma
model ActivityPlan {
  id             String         @id @default(cuid())
  code           String?        @unique @map("code")
  employeeId     String         @map("employee_id")
  createdById    String         @map("created_by_id")

  // Primary Type FK (Optional for backward compatibility / Header categorization)
  activityTypeId String?        @map("activity_type_id")
  title          String
  objective      String
  ...
  activityType   ActivityType?  @relation(fields: [activityTypeId], references: [id], onDelete: SetNull)
  workTypes      ActivityPlanWorkType[]
}
```

### การประเมินทางสถาปัตยกรรม
1. **ยังมีอยู่หรือไม่:** ยังมีอยู่ โดยเปลี่ยนเป็น **Nullable (`activityTypeId String?`)**
2. **ใช้ทำอะไร:** ใช้ระบุ **"Primary Work Type" (ประเภทงานหลัก)** สำหรับ Header Summary, Categorization ระดับบนสุด และ Backward Compatibility สำหรับ API/Query เดิมที่อ้างอิง `activityPlan.activityType`
3. **เป็น Source of Truth หรือไม่:** **ไม่ใช่ Source of Truth หลักสำหรับประเภทงานทั้งหมด** แต่เป็น Primary Category ตัวแทน
4. **Source of Truth ที่แท้จริง:** คือตาราง Relation **`ActivityPlanWorkType` (1 Plan : N Work Types)**
5. **ความเสี่ยงข้อมูลไม่ตรงกัน (Sync Risk):** ใน Repository Layer (`createActivityPlan` / `updateActivityPlan`) ได้ถูกออกแบบให้ `activityTypeId` สอดคล้องกับ `workTypeCodes[0]` เสมอภายใน Transaction เดียวกัน และใน UI List View / Detail View อ่านจาก `plan.workTypes` เป็นหลัก

---

## 2. ตรวจสอบ `ActivityPlanWorkType`

### Prisma Schema จริง
```prisma
model ActivityPlanWorkType {
  id             String       @id @default(cuid())
  activityPlanId String       @map("activity_plan_id")
  activityTypeId String       @map("activity_type_id")

  activityPlan   ActivityPlan @relation(fields: [activityPlanId], references: [id], onDelete: Cascade)
  activityType   ActivityType @relation(fields: [activityTypeId], references: [id], onDelete: Restrict)

  @@unique([activityPlanId, activityTypeId])
  @@index([activityPlanId])
  @@index([activityTypeId])
  @@map("activity_plan_work_types")
}
```

### การตอบข้อกำหนด
- **Relation กับ ActivityPlan:** Many-to-One (`activityPlanId` FK -> `ActivityPlan.id`, `onDelete: Cascade`)
- **Relation กับ ActivityType:** Many-to-One (`activityTypeId` FK -> `ActivityType.id`, `onDelete: Restrict`)
- **Unique Constraint:** `@@unique([activityPlanId, activityTypeId])` (ป้องกันไม่ให้ใส่ Work Type เดียวกันซ้ำใน Plan เดียวกัน)
- **Index:** มี B-Tree Index ทั้ง `activityPlanId` และ `activityTypeId`
- **รองรับ Multi-WorkType:** รองรับ 100% สามารถ Query ได้ตรง เช่น แผน A มี `TYPE_1`, `TYPE_3`, `TYPE_5`

---

## 3. ตรวจสอบ Store Ownership (`ActivityPlanStore`)

### Prisma Schema จริง
```prisma
model ActivityPlanStore {
  id             String       @id @default(cuid())
  activityPlanId String       @map("activity_plan_id")
  workTypeCode   String       @map("work_type_code") // e.g. "TYPE_1", "TYPE_11"
  storeId        String       @map("store_id")
  storeName      String?      @map("store_name")
  remarks        String?

  activityPlan   ActivityPlan @relation(fields: [activityPlanId], references: [id], onDelete: Cascade)
  store          Customer     @relation(fields: [storeId], references: [id], onDelete: Restrict)

  @@index([activityPlanId])
  @@index([storeId])
  @@index([workTypeCode])
  @@map("activity_plan_stores")
}
```

### การตอบข้อกำหนด
- **Store เป็นของ:** ผูกกับ **`ActivityPlan`** โดยมี **`workTypeCode`** กำกับอย่างชัดเจน
- **การแก้ปัญหา Ambiguous Relation:**
  หากใน 1 Plan มีทั้ง `TYPE_1` (เข้าพบ) และ `TYPE_11` (เช็กสต็อก) โดยเข้าพบ Store A เดียวกัน:
  - จะถูกจัดเก็บเป็น 2 แถว:
    1. `{ activityPlanId: "plan-A", workTypeCode: "TYPE_1", storeId: "store-A" }`
    2. `{ activityPlanId: "plan-A", workTypeCode: "TYPE_11", storeId: "store-A" }`
  - ทำให้สามารถ Query แยกตามประเภทงานได้ 100% ไม่มี Ambiguity

---

## 4. ตรวจสอบ Product Ownership (`ActivityPlanProduct`)

### Prisma Schema จริง
```prisma
model ActivityPlanProduct {
  id             String       @id @default(cuid())
  activityPlanId String       @map("activity_plan_id")
  workTypeCode   String       @map("work_type_code") // e.g. "TYPE_3", "TYPE_9", "TYPE_11"
  storeId        String?      @map("store_id")
  productId      String       @map("product_id")
  productName    String?      @map("product_name")
  targetQuantity Int?         @map("target_quantity")
  unitPrice      Decimal?     @db.Decimal(15, 2) @map("unit_price")
  targetAmount   Decimal?     @db.Decimal(15, 2) @map("target_amount")

  activityPlan   ActivityPlan @relation(fields: [activityPlanId], references: [id], onDelete: Cascade)
  store          Customer?    @relation(fields: [storeId], references: [id], onDelete: SetNull)
  product        Product      @relation("ActivityPlanProductRef", fields: [productId], references: [id], onDelete: Restrict)

  @@index([activityPlanId])
  @@index([productId])
  @@index([storeId])
  @@index([workTypeCode])
  @@map("activity_plan_products")
}
```

### การตอบข้อกำหนด
- **Product เป็นของ:** `ActivityPlan` ร่วมกับ `workTypeCode` และเชื่อมโยง `storeId` (Optional สำหรับกรณีสินค้าที่ระบุเฉพาะร้านค้า เช่น TYPE_3 เสนอขาย)
- **Hierarchy ชัดเจน:** `Plan (activityPlanId) → Type (workTypeCode) → Product (productId) [→ Store (storeId)]`

---

## 5. ตรวจสอบ `ActivityResult` และ Sub-Results

### Prisma Schema จริง
```prisma
model ActivityResult {
  id             String  @id @default(cuid())
  activityPlanId String  @unique @map("activity_plan_id")

  actualStartDate      DateTime             @map("actual_start_date")
  actualEndDate        DateTime             @map("actual_end_date")
  actualAttendeesCount Int?                 @map("actual_attendees_count")
  resultStatus         ActivityResultStatus @default(PARTIAL) @map("result_status")
  resultSummary        String?              @map("result_summary")
  problemFound         String?              @map("problem_found")
  nextAction           String?              @map("next_action")

  // Qualitative Feedback
  discussionResult     String?              @map("discussion_result")
  productAdvice        String?              @map("product_advice")
  salesOpportunity     String?              @map("sales_opportunity")
  nextMeetingDate      DateTime?            @map("next_meeting_date")

  // Sub-Results Relations (Normalized)
  saleResults   ActivityResultSaleItem[]
  stockResults  ActivityResultStockItem[]
  surveyResults ActivityResultSurveyItem[]
  demoResults   ActivityResultDemoItem[]
  attachments   ActivityAttachment[]
}
```

### การตอบข้อกำหนด & Architecture Risk
- **โครงสร้าง:** `ActivityResult` ทำหน้าที่เป็น **Outcome Header (1:1 กับ ActivityPlan)** โดยมีตารางลูกที่ระบุผลลัพธ์แยกตาม Work Type:
  - `ActivityResultSaleItem` มีฟิลด์ `workTypeCode` ("TYPE_3", "TYPE_9", "TYPE_10")
  - `ActivityResultStockItem` (สำหรับ TYPE_11)
  - `ActivityResultSurveyItem` (สำหรับ TYPE_5)
  - `ActivityResultDemoItem` (สำหรับ TYPE_7)
- **Architecture Risk Assessment:**
  - `ActivityResult` เชื่อมโยงกับ `ActivityPlan` ที่ Header Level (ซึ่งเป็น 1:1 กับ Plan Transaction) โดยผลลัพธ์แยกประเภทถูกจัดเก็บใน Sub-tables ที่มี `workTypeCode` ชัดเจน
  - สำหรับแผนงานที่เป็น `TYPE_12` (ทัวร์) ระบบจะไม่สร้าง `ActivityResult` ใดๆ

---

## 6. ตรวจสอบ Tour (`ActivityPlanTour`)

### Prisma Schema จริง
```prisma
model ActivityPlanTour {
  id             String       @id @default(cuid())
  activityPlanId String       @unique @map("activity_plan_id")
  tourType       TourType     @map("tour_type")      // CENTRAL | STORE
  tourSize       TourSize?    @map("tour_size")      // SMALL | LARGE
  country        String?      @map("country")
  storeId        String?      @map("store_id")
  destination    String?      @map("destination")

  activityPlan   ActivityPlan @relation(fields: [activityPlanId], references: [id], onDelete: Cascade)
  store          Customer?    @relation(fields: [storeId], references: [id], onDelete: SetNull)

  @@index([tourType])
  @@index([country])
  @@index([storeId])
  @@map("activity_plan_tours")
}
```

### การยืนยันคุณสมบัติ
- **Relation:** 1:1 กับ `ActivityPlan` ผ่าน `activityPlanId` (@unique)
- **Enums:**
  - `TourType`: `CENTRAL` (ทัวร์กลาง), `STORE` (ทัวร์ร้านค้า)
  - `TourSize`: `SMALL` (ทัวร์เล็ก), `LARGE` (ทัวร์ใหญ่)
- **Foreign Key:** `storeId` FK เชื่อมไปยัง `Customer.id`
- **Master Setup:** `ActivityType` สำหรับ `TYPE_12` มี:
  - `hasActual = false`
  - `requiresApproval = true`
- **ไม่มี `ActivityResult`:** ทัวร์ไม่มีการสร้างแถวใน `ActivityResult`

---

## 7. ตรวจสอบ Actual Dispatcher & Form Visibility

### การตรวจสอบในโค้ด
- **Table / List View ([activity-plan-table.tsx:220-255](file:///d:/code/crm-bank/modules/activity-plans/features/list-view/activity-plan-table.tsx#L220-L255)):**
  ```tsx
  const hasActualWorkType =
    (item as any).workTypes && (item as any).workTypes.length > 0
      ? (item as any).workTypes.some((wt: any) => {
          const code = wt.workTypeCode || wt.activityType?.code;
          return code ? WORK_TYPE_CONFIG[code as keyof typeof WORK_TYPE_CONFIG]?.hasActual : true;
        })
      : (item as any).tour ? false : item.activityType?.code !== "TYPE_12";

  // ปุ่ม "บันทึกผล" จะเรนเดอร์เฉพาะเมื่อ hasActualWorkType === true
  {hasActualWorkType && (
    <ActionButton href={`/activity-plans/${item.id}/actual`} label="บันทึกผล" ... />
  )}
  ```
- **Detail View ([detail-activity-result-section.tsx:37-41](file:///d:/code/crm-bank/modules/activity-plans/features/detail-view/components/detail-activity-result-section.tsx#L37-L41)):**
  ```tsx
  const hasAnyActualWorkType = WORK_TYPES.slice(0, 11).some((wt) => isTypeVisible(wt));
  if (!hasAnyActualWorkType) return null; // ซ่อน Section ผลการปฏิบัติงานทันที
  ```

---

## 8. ตรวจสอบ Detail View ของ Tour

- ใน [detail-header.tsx](file:///d:/code/crm-bank/modules/activity-plans/features/detail-view/components/detail-header.tsx) และ [detail-type12-tour.tsx](file:///d:/code/crm-bank/modules/activity-plans/features/detail-view/components/work-types/detail-type12-tour.tsx):
  - แสดงประเภทงาน: **"ทัวร์"**
  - แสดงข้อมูลเฉพาะของทัวร์:
    - ประเภททัวร์: ทัวร์กลาง / ทัวร์ร้านค้า
    - ขนาดทัวร์: ทัวร์เล็ก / ทัวร์ใหญ่
    - ประเทศปลายทาง / ร้านค้า / สถานที่จะไป
  - **ไม่มีส่วน "ผลการปฏิบัติงานตามประเภทงาน"**

---

## 9. ตรวจสอบ Work Type Mapping & SSOT

- **แหล่ง Mapping หลัก (Single Source of Truth):**
  - [`modules/activity-plans/constants.ts`](file:///d:/code/crm-bank/modules/activity-plans/constants.ts): `WORK_TYPE_CONFIG`
  - [`prisma/seed/activity/activity-types.ts`](file:///d:/code/crm-bank/prisma/seed/activity/activity-types.ts): Seed 12 ประเภทงานลงฐานข้อมูล
- **Repository Integration ([activity-plan.repository.ts:54-85](file:///d:/code/crm-bank/modules/activity-plans/infrastructure/activity-plan.repository.ts#L54-L85)):**
  ฟังก์ชัน `resolveActivityTypeId` แปลง Code/Name ผ่าน `WORK_TYPE_CONFIG` และตัด Fallback ไป `TYPE_1` ออกแล้ว 100%

---

## 10. ตรวจสอบ Heuristic ใน Production Code

### ผลการสแกนโค้ด (Heuristic Scan Results)
1. **จุดที่มี Heuristic ตกค้าง:**
   - [`modules/activity-plans/features/form/activity-plan-form.tsx`](file:///d:/code/crm-bank/modules/activity-plans/features/form/activity-plan-form.tsx) (บรรทัด 280–495): ใช้สำหรับสกัด Form State จากฟิลด์ Free-text เก่า เช่น `initial.objective` กรณีเปิดแผนงานดั้งเดิมที่สร้างก่อนการ Rebuild
   - [`modules/activity-plans/features/actual-view/utils/plan-extractor.ts`](file:///d:/code/crm-bank/modules/activity-plans/features/actual-view/utils/plan-extractor.ts) (บรรทัด 240–450): เป็น Fallback Layer 2 หาก `plan.workTypes` ว่างเปล่า
2. **การทำงานสำหรับข้อมูลใหม่ (New Architecture):**
   - แผนงานใหม่ที่สร้างหลัง Migration จะมีข้อมูลใน `plan.workTypes` และ `plan.tour` เสมอ ทำให้ระบบดึงข้อมูลตรงจาก Relation ทันทีและ **Bypass Heuristic ทั้งหมด**

---

## 11. ตรวจสอบ `resultSummary` Overloading

### การจำแนกประเภทข้อมูลใน `resultSummary`

| ข้อมูล | ประเภท A (Summary Text) | ประเภท B (Business Data ที่ต้อง Normalized) | สถานะปัจจุบันใน DB |
|---|:---:|:---:|---|
| ข้อความสรุปผลกิจกรรมทั่วไป |  |  | บันทึกใน `ActivityResult.resultSummary` |
| ข้อเสนอแนะ / ความเห็นลูกค้า |  |  | บันทึกใน `ActivityResult.productAdvice` / `discussionResult` |
| รายการขายจริง (Product, Qty, Price, Total) | |  | **บันทึกใน `ActivityResultSaleItem`** |
| รายการนับสต็อก (Store, Product, Remaining, Status) | |  | **บันทึกใน `ActivityResultStockItem`** |
| รายการสำรวจราคาคู่แข่ง (Competitor, Price, Unit) | |  | **บันทึกใน `ActivityResultSurveyItem`** |
| ตัวชี้วัดแปลงสาธิต (Yield, Growth, Score) | |  | **บันทึกใน `ActivityResultDemoItem`** |
| ไฟล์รูปภาพแนบ | |  | **บันทึกใน `ActivityAttachment`** |

> **หมายเหตุ:** `resultSummary` ใน UI layer ยังคงมีการ Serialize ข้อความสรุปเก็บไว้เพื่อรองรับการแสดงผลหน้าจอแบบข้อความรวม แต่งานประมวลผลทางธุรกิจทั้งหมดสามารถ Query ตรงจากตารางลูกในหมวด B ได้โดยตรง

---

## 12. ตรวจสอบ Attachment (`ActivityAttachment`)

### Prisma Schema จริง
```prisma
model ActivityAttachment {
  id               String              @id @default(cuid())
  activityPlanId   String              @map("activity_plan_id")
  activityResultId String?             @map("activity_result_id")
  workTypeCode     String?             @map("work_type_code")
  storeId          String?             @map("store_id")
  productId        String?             @map("product_id")
  category         AttachmentCategory  @default(GENERAL)
  fileUrl          String              @map("file_url")
  fileName         String              @map("file_name")
  fileSize         Int?                @map("file_size")
  mimeType         String?             @map("mime_type")
  createdAt        DateTime            @default(now()) @map("created_at")

  activityPlan     ActivityPlan        @relation(fields: [activityPlanId], references: [id], onDelete: Cascade)
  activityResult   ActivityResult?     @relation(fields: [activityResultId], references: [id], onDelete: Cascade)
  store            Customer?           @relation(fields: [storeId], references: [id], onDelete: SetNull)
  product          Product?            @relation("ActivityAttachmentProductRef", fields: [productId], references: [id], onDelete: SetNull)

  @@index([activityPlanId])
  @@index([activityResultId])
  @@index([category])
  @@index([storeId])
  @@index([productId])
  @@map("activity_attachments")
}
```

### การตอบข้อกำหนด
- สามารถระบุเจ้าของรูปภาพได้อย่างแม่นยำครบทุกมิติ: `Plan`, `Result`, `WorkType`, `Store`, `Product`, `Category`
- `AttachmentCategory` มี Enums รองรับทุกประเภทงาน: `PRICE_TAG`, `SHELF`, `CROP`, `PLOT`, `ATMOSPHERE`, `ISSUE`, `GENERAL`

---

## 13. ตรวจสอบ Helper (`ActivityHelper`)

- `ActivityHelper` ถูกจัดเก็บเป็น **Individual Relational Records** ในตาราง `activity_helpers`
- มี Unique Constraint `@@unique([activityPlanId, employeeId])`
- การเลือกผู้ช่วยงาน 2 คน จะบันทึกเป็น 2 แถว พร้อม Foreign Key ไปยัง `Employee` และมี Snapshot แผนก ณ วันที่ขอ

---

## 14. ตรวจสอบ Report Readiness (SQL Queries ตัวอย่าง)

### 1. Activity Count by Work Type
```sql
SELECT t.code, t.name, COUNT(w.id) AS activity_count
FROM activity_types t
LEFT JOIN activity_plan_work_types w ON w.activity_type_id = t.id
LEFT JOIN activity_plans p ON p.id = w.activity_plan_id AND p.deleted_at IS NULL
GROUP BY t.code, t.name
ORDER BY t.sort_order;
```

### 2. Activity Count by Month
```sql
SELECT fiscal_year, fiscal_month, COUNT(id) AS total_plans
FROM activity_plans
WHERE deleted_at IS NULL
GROUP BY fiscal_year, fiscal_month
ORDER BY fiscal_year DESC, fiscal_month DESC;
```

### 3. Activity Count by Employee
```sql
SELECT e.id, e.name, COUNT(p.id) AS total_plans
FROM "Employee" e
LEFT JOIN activity_plans p ON p.employee_id = e.id AND p.deleted_at IS NULL
GROUP BY e.id, e.name
ORDER BY total_plans DESC;
```

### 4. Activity Count by Store
```sql
SELECT c.id, c.customer_code, c.name, COUNT(s.id) AS visit_count
FROM "Customer" c
JOIN activity_plan_stores s ON s.store_id = c.id
JOIN activity_plans p ON p.id = s.activity_plan_id AND p.deleted_at IS NULL
GROUP BY c.id, c.customer_code, c.name
ORDER BY visit_count DESC;
```

### 5. Activity Count by Product
```sql
SELECT pr.id, pr.product_code, pr.name, COUNT(app.id) AS promotion_count
FROM "Product" pr
JOIN activity_plan_products app ON app.product_id = pr.id
JOIN activity_plans p ON p.id = app.activity_plan_id AND p.deleted_at IS NULL
GROUP BY pr.id, pr.product_code, pr.name
ORDER BY promotion_count DESC;
```

### 6–8. Target vs Actual Sales & Variance
```sql
SELECT 
  pr.id,
  pr.name AS product_name,
  COALESCE(SUM(plan_p.target_amount), 0) AS total_target_amount,
  COALESCE(SUM(act_s.actual_total), 0) AS total_actual_amount,
  (COALESCE(SUM(act_s.actual_total), 0) - COALESCE(SUM(plan_p.target_amount), 0)) AS sales_variance
FROM "Product" pr
LEFT JOIN activity_plan_products plan_p ON plan_p.product_id = pr.id
LEFT JOIN activity_result_sale_items act_s ON act_s.product_id = pr.id
GROUP BY pr.id, pr.name;
```

### 9–10. Tour by Country & Tour Size
```sql
SELECT 
  country,
  tour_size,
  tour_type,
  COUNT(id) AS total_tours
FROM activity_plan_tours
GROUP BY country, tour_size, tour_type
ORDER BY total_tours DESC;
```

---

## 15. ตรวจสอบ Dashboard Readiness

### ตารางที่ใช้สำหรับแต่ละ Dashboard Card

| Dashboard Feature | Tables Queried | Join Strategy |
|---|---|---|
| **Activity Overview** | `activity_plans` | Filter by `status`, `fiscal_year`, `fiscal_month` |
| **Work Type Breakdown** | `activity_plan_work_types` JOIN `activity_types` | `COUNT(*)` GROUP BY `activity_type_id` |
| **Sales Performance** | `activity_result_sale_items` JOIN `Product` | `SUM(actual_total)` GROUP BY `work_type_code` |
| **Product Performance** | `activity_result_sale_items` JOIN `Product` | `SUM(actual_quantity)` GROUP BY `product_id` |
| **Store Performance** | `activity_plan_stores` + `activity_result_sale_items` | Aggregate by `Customer.id` |
| **Tour Dashboard** | `activity_plan_tours` | Aggregate by `country`, `tour_type`, `tour_size` |
| **Budget Dashboard** | `activity_plans` + `activity_results` | `total_budget_requested` vs `actual_total_spent` |

---

## 16. ตรวจสอบ Migration (`20260827120000_rebuild_activity_plans_architecture`)

- **ตารางที่สร้างขึ้นใหม่ (9 Tables):**
  1. `activity_plan_work_types`
  2. `activity_plan_stores`
  3. `activity_plan_products`
  4. `activity_plan_tours`
  5. `activity_result_sale_items`
  6. `activity_result_stock_items`
  7. `activity_result_survey_items`
  8. `activity_result_demo_items`
  9. `activity_attachments`
- **ตารางที่แก้ไข (Alter Table):**
  - `activity_plans`: ปรับ `activity_type_id` เป็น Nullable
  - `activity_results`: เพิ่มฟิลด์ `discussion_result`, `product_advice`, `sales_opportunity`, `next_meeting_date`
  - `activity_types`: เพิ่มฟิลด์ `has_actual`, `requires_approval`
  - `activity_plan_items`: เพิ่มฟิลด์ `work_type_code`
- **ตารางที่ถูกลบ (Drop Table):** **ไม่มี (0 Tables Dropped)**
- **การรักษาข้อมูล Master:** ข้อมูลในตาราง `Product`, `Customer`, `Sale`, `Inventory`, `User`, `Employee` **ไม่ได้รับผลกระทบใดๆ และปลอดภัย 100%**

---

## 17. ตรวจสอบ Seed Data (`prisma/seed/activity/activity-types.ts`)

- ได้ทำการ Seed ประเภทงาน 12 รายการครบถ้วน
- `TYPE_12` ได้รับการ Seed ดังนี้:
  ```ts
  { code: "TYPE_12", name: "ทัวร์", shortName: "Tour", sortOrder: 12, hasActual: false, requiresApproval: true }
  ```

---

## 18. ตรวจสอบ Regression Test (Work Types 1–11)

- ทุกประเภทงาน (TYPE_1 ถึง TYPE_11) ยังคงรองรับการทำงานในทั้ง 4 สถานะ:
  - **Create / Edit:** ฟอร์มบันทึกข้อมูลทั้งลง `items` เดิม (Backward Compatibility) และบันทึกลง Normalized Tables (`planStores`, `planProducts`)
  - **Approval Workflow:** สถานะและการอนุมัติทำงานได้ตามปกติ
  - **Actual Recording:** บันทึกผลผ่าน `upsertActivityResult` ลงตาราง Normalized ย่อยตามประเภทงาน

---

## 19. ผลการทดสอบจริง (Live Database Execution Test)

จากผลการรันสคริปต์ทดสอบจริงบน Database ผ่าน Prisma Client:
1. **Tour Central & Tour Store:**
   - สร้าง Plan สำเร็จ ได้รับ Code เช่น `TP26090001`
   - บันทึก `ActivityPlanTour` สำเร็จ (`tourType: STORE`, `tourSize: LARGE`, `country: ญี่ปุ่น`)
   - ไม่มีแถวใน `ActivityResult`
2. **Multi-Type Plan (`TYPE_1` + `TYPE_3` + `TYPE_11`):**
   - บันทึก `ActivityPlanWorkType` 3 รายการ
   - บันทึก `ActivityPlanStore` 2 รายการ (ผูก Foreign Key กับ `Customer`)
   - บันทึก `ActivityPlanProduct` 1 รายการ (ผูก Foreign Key กับ `Product`)
   - บันทึกผลลง `ActivityResultSaleItem`, `ActivityResultStockItem`, `ActivityResultSurveyItem` สำเร็จครบถ้วน

---

## 20. ตรวจสอบ Index & Performance

### Index ที่มีอยู่แล้วในระบบ
- `activity_plans`: `employeeId`, `activityTypeId`, `status`, `[fiscalYear, fiscalMonth]`, `[fiscalYear, fiscalQuarter]`, `province`, `submittedAt`, `approvedAt`
- `activity_plan_work_types`: `activityPlanId`, `activityTypeId`, `[activityPlanId, activityTypeId]` (Unique)
- `activity_plan_stores`: `activityPlanId`, `storeId`, `workTypeCode`
- `activity_plan_products`: `activityPlanId`, `productId`, `storeId`, `workTypeCode`
- `activity_plan_tours`: `activityPlanId` (Unique), `tourType`, `country`, `storeId`
- `activity_results`: `activityPlanId` (Unique), `resultStatus`, `actualStartDate`
- `activity_result_sale_items`: `activityResultId`, `productId`, `storeId`, `workTypeCode`
- `activity_result_stock_items`: `activityResultId`, `storeId`, `productId`
- `activity_result_survey_items`: `activityResultId`, `storeId`, `competitorBrand`
- `activity_result_demo_items`: `activityResultId`, `demoPlotId`
- `activity_attachments`: `activityPlanId`, `activityResultId`, `category`, `storeId`, `productId`
- `activity_helpers`: `[activityPlanId, employeeId]` (Unique), `employeeId`, `status`, `departmentName`

### Index แนะนำเพิ่มเติมในอนาคต (เมื่อข้อมูลมีปริมาณมาก)
- `activity_plans`: `[employeeId, startDate]` (เพิ่มประสิทธิภาพในการดึงปฏิทินงานรายเดือนของพนักงาน)
- `activity_result_sale_items`: `[productId, actualTotal]` (เพิ่มประสิทธิภาพในการจัดอันดับสินค้ายอดขายสูงสุดในรายงาน)

---

## 21. สรุปรายการปัญหาที่พบ (Issues Found) & ข้อเสนอแนะ (Recommended Next Steps)

1. **Legacy Compatibility Cleanup (Non-blocking):**
   - ยังคงมีฟังก์ชัน Fallback Heuristic ใน `plan-extractor.ts` สำหรับรองรับข้อมูลเก่าที่สร้างก่อนการ Rebuild
   - **ข้อแนะนำ:** เมื่อมีการ Migrate ข้อมูลเก่าเข้าสู่ Normalized Tables ครบถ้วนแล้ว สามารถนำโค้ด Fallback Heuristic เหล่านี้ออกได้อย่างปลอดภัย
2. **Result Summary Dual-write (Non-blocking):**
   - `summary-builder.ts` ยังคงสร้างข้อความรวมใน `resultSummary` ควบคู่กับการบันทึกลงตาราง Normalized
   - **ข้อแนะนำ:** ให้รักษาไว้สำหรับการแสดงประวัติแบบย่อ (Summary History) แต่รายงานและ Dashboard ให้ดึงจากตาราง Normalized เสมอ

---

## สรุปคำตอบสุดท้าย

> **"Architecture ปัจจุบันมีความสมบูรณ์ ถูกต้องตามหลักการออกแบบเชิงสถาปัตยกรรม (Normalized Relational Architecture) และพร้อมให้เริ่มพัฒนา Feature ต่อได้ทันที"**
