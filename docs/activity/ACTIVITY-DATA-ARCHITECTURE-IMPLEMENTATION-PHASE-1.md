# ACTIVITY PLAN — TARGET DATA ARCHITECTURE
## IMPLEMENTATION PHASE 1: DATABASE & PRISMA ARCHITECTURE REPORT

**สถานะ:** `COMPLETED (PHASE 1 ONLY)`  
**วันที่ดำเนินการ:** 10 กันยายน 2026  
**สภาพแวดล้อม:** Development 100% (Clean Slate)  
**ขอบเขตงาน:** ปรับปรุง Prisma Schema, ดำเนินการ Database Migration, และตรวจสอบความถูกต้องในระดับ Data Layer โดยไม่แตะต้อง Application Code ใดๆ

---

## 1. Schema Changes (การเปลี่ยนแปลงภาพรวมใน Prisma Schema)

ใน Phase 1 ได้ดำเนินการปรับปรุงไฟล์ `prisma/schema.prisma` ตาม Target Data Architecture ที่ได้รับการอนุมัติ โดยมีหลักการสำคัญคือ:
1. **Single Source of Truth & Normalized Relational Data:** ยกเลิกการใช้ Sparse Table 32 คอลัมน์ และแยกเก็บข้อมูลรายการย่อยลงตารางเฉพาะ
2. **Plan ≠ Actual Isolation:** แยกฟิลด์และตารางของแผนงาน (Plan) ออกจากผลการปฏิบัติงานจริง (Actual) อย่างเด็ดขาด
3. **Removal of Legacy Anti-patterns:** กำจัดความต้องการในการจัดเก็บ JSON ใน Text และการรวม Comma-separated strings ในระดับ Schema

---

## 2. Tables Created (ตารางที่สร้างขึ้นใหม่)

สร้างตารางใหม่ 2 ตารางที่รองรับ UI Budget Section ที่มีอยู่จริง:

### 2.1 `activity_plan_marketing_items` (ตารางสื่อส่งเสริมการขาย)
- **วัตถุประสงค์:** จัดเก็บรายการสื่อการตลาดที่ขอเบิก เช่น ป้ายไวนิล โบรชัวร์ ของพรีเมียม (1 แถวต่อ 1 รายการสื่อ)
- **โครงสร้างคอลัมน์:**
  - `id` (Text / CUID, PK)
  - `activity_plan_id` (Text, FK → `activity_plans.id` ON DELETE CASCADE)
  - `category` (Text) — เช่น "ไวนิล", "ป้าย", "ของแถม", "โบรชัวร์"
  - `material_name` (Text) — ชื่อรายการสื่อ
  - `unit` (Text, Nullable) — หน่วยนับ เช่น "ชิ้น", "ผืน", "ลัง"
  - `unit_price` (Decimal 15,2, Default 0) — ราคาต่อหน่วย
  - `quantity` (Integer, Default 1) — จำนวนที่ขอเบิก
  - `total_amount` (Decimal 15,2, Default 0) — รวมเงิน (`quantity * unit_price`)
  - `created_at` (DateTime)
  - `updated_at` (DateTime)

### 2.2 `activity_plan_promotion_items` (ตารางงบส่งเสริมการขาย)
- **วัตถุประสงค์:** จัดเก็บรายการงบประมาณที่ขอใช้ในการจัดกิจกรรม เช่น ค่างานเลี้ยง ค่าสถานที่ ค่าเดินทาง
- **โครงสร้างคอลัมน์:**
  - `id` (Text / CUID, PK)
  - `activity_plan_id` (Text, FK → `activity_plans.id` ON DELETE CASCADE)
  - `budget_type` (Text) — เช่น "MARKETING", "SALES_PROMOTION"
  - `detail` (Text) — รายละเอียดค่าใช้จ่าย
  - `amount` (Decimal 15,2, Default 0) — จำนวนเงินที่ขอ
  - `created_at` (DateTime)
  - `updated_at` (DateTime)

---

## 3. Tables Modified (ตารางที่ได้รับการปรับปรุง)

### 3.1 `activity_plans`
- **เพิ่มคอลัมน์:**
  - `target_attendees_count` (Integer, Nullable) — จำนวนผู้เข้าร่วมเป้าหมาย (สำหรับ TYPE_8 จัดประชุม และ TYPE_10 Field Day)
  - `target_booking_sales` (Decimal 15,2, Nullable) — เป้ายอดจองของ Field Day TYPE_10 โดยแยกเป็น Metric อิสระ **ไม่นำไปรวมใน `total_budget_requested` หรือ `totalTargetSales`**
- **ปรับปรุง Relations:**
  - เพิ่ม Relation `marketingItems ActivityPlanMarketingItem[]`
  - เพิ่ม Relation `promotionItems ActivityPlanPromotionItem[]`
  - นำ Relation `items ActivityPlanItem[]` ออก

### 3.2 `activity_plan_stores`
- **เพิ่มคอลัมน์:**
  - `target_amount` (Decimal 15,2, Nullable) — เป้ายอดเงินที่ต้องเก็บรอบบิล (สำหรับ TYPE_4)
  - `sub_dealer_store` (Text, Nullable) — ร้านค้าช่วง / Sub Dealer ที่เกี่ยวข้อง (สำหรับ TYPE_9)
  - `notes` (Text, Nullable) — บันทึกรายละเอียดเพิ่มเติมประจำร้านค้า
- **การใช้งาน:** รองรับการจัดเก็บร้านค้าแบบ 1 ร้านต่อ 1 แถว สำหรับทุกประเภทงาน (TYPE_1, 2, 3, 4, 5, 6, 9, 11) โดย TYPE_11 จะบันทึกเป็นหลายแถว ไม่รวม Comma-separated อีกต่อไป

### 3.3 `activity_plan_products`
- **เพิ่มคอลัมน์:**
  - `master_price` (Decimal 15,2, Nullable) — ราคาอ้างอิงจาก Master Product Catalog
  - `is_price_overridden` (Boolean, Default false) — แฟล็ก Audit บันทึกว่ามีการเสนอราคาแตกต่างจาก Master Catalog หรือไม่
- **การใช้งาน:** รองรับสินค้าเป้าหมายทุกประเภท (TYPE_2, 3, 5, 8, 9) โดยเฉพาะ TYPE_3 และ TYPE_9 ซึ่งคำนวณ `target_amount = target_quantity * unit_price`

---

## 4. Tables Removed (ตารางที่ถูกลบถาวร)

### ❌ `activity_plan_items` (DROPPED)
- **เหตุผล:** เป็น Sparse Table ขนาด 32 คอลัมน์ที่ข้อมูลส่วนใหญ่เป็น `NULL` และสร้างความซ้ำซ้อนกับ `activity_plan_stores`, `activity_plan_products`, `demo_plots`, และ `activity_helpers`
- **สถานะ:** ถูก DROP ออกจากฐานข้อมูลเรียบร้อยแล้วผ่าน Migration

---

## 5. Relations Changed (การเปลี่ยนแปลงความสัมพันธ์ระหว่างโมเดล)

| Model ต้นทาง | ความสัมพันธ์เดิม | ความสัมพันธ์ใหม่ | การจัดการ Cascade |
|:---|:---|:---|:---|
| `ActivityPlan` | `items ActivityPlanItem[]` | **ลบออก** | N/A |
| `ActivityPlan` | ไม่มี | `marketingItems ActivityPlanMarketingItem[]` | `onDelete: Cascade` |
| `ActivityPlan` | ไม่มี | `promotionItems ActivityPlanPromotionItem[]` | `onDelete: Cascade` |
| `ActivityPlanStore` | เฉพาะ TYPE_1/TYPE_11 | ขยายรองรับทุกประเภทงานที่มีร้านค้า | `onDelete: Cascade` จาก Plan / `Restrict` จาก Customer |
| `ActivityPlanProduct` | เฉพาะ TYPE_3/TYPE_9 | ขยายรองรับ TYPE_2, 3, 5, 8, 9 พร้อม Master Price | `onDelete: Cascade` จาก Plan / `Restrict` จาก Product |

---

## 6. Indexes Added (ดัชนีที่เพิ่มขึ้นและเหตุผลเชิงประสิทธิภาพ)

1. `activity_plan_marketing_items_activity_plan_id_idx` บน `(activity_plan_id)`
   - *เหตุผล:* ใช้สำหรับ Join ดึงรายการสื่อการตลาดตามรหัสแผนงาน
2. `activity_plan_marketing_items_category_idx` บน `(category)`
   - *เหตุผล:* ใช้สำหรับ Group by ทำรายงานสรุปประเภทสื่อการตลาดที่ใช้บ่อย
3. `activity_plan_promotion_items_activity_plan_id_idx` บน `(activity_plan_id)`
   - *เหตุผล:* ใช้สำหรับ Join ดึงรายการงบประมาณตามรหัสแผนงาน
4. `activity_plan_promotion_items_budget_type_idx` บน `(budget_type)`
   - *เหตุผล:* ใช้สำหรับ Group by สรุปยอดงบประมาณแยกตามหมวดหมู่ (Marketing vs Sales Promotion)

---

## 7. Constraints Added (ข้อกำหนดความถูกต้องของข้อมูล)

1. **Foreign Key Cascade:**
   - `activity_plan_marketing_items.activity_plan_id` ชี้ไปยัง `activity_plans.id` (`ON DELETE CASCADE ON UPDATE CASCADE`)
   - `activity_plan_promotion_items.activity_plan_id` ชี้ไปยัง `activity_plans.id` (`ON DELETE CASCADE ON UPDATE CASCADE`)
2. **Precision & Scale:**
   - คอลัมน์ยอดเงินทุกตัว (`unit_price`, `total_amount`, `amount`, `target_booking_sales`, `master_price`, `target_amount`) กำหนดเป็น `Decimal(15, 2)` ตามมาตรฐานการเงิน ป้องกันปัญหา Rounding Error ของ Floating Point

---

## 8. JSON Removed (การยกเลิกการใช้ JSON ใน Data Layer)

- ในโมเดลหลัก `ActivityPlan`, `ActivityPlanStore`, `ActivityPlanProduct`, `ActivityPlanMarketingItem`, `ActivityPlanPromotionItem` **ไม่มีการใช้คอลัมน์ประเภท `Json`**
- ในส่วนของ `ActivityResult.resultSummary` ยังคงเป็นคอลัมน์ `String?` แบบ Text ปกติ แต่ใน Phase 2 จะปรับให้เก็บเฉพาะข้อความบรรยาย ไม่มีการทำ `JSON.stringify` ฝังข้อมูลยอดขาย ผลสต็อก หรือผลสำรวจอีกต่อไป

---

## 9. Legacy Removed (สิ่งที่ถูกปลดระวาง)

1. ยกเลิก Model `ActivityPlanItem` ทั้งหมดใน Prisma Schema
2. ลบ Foreign Key Constraint `activity_plan_items_activity_plan_id_fkey`
3. ลบ Table `activity_plan_items` ออกจาก PostgreSQL

---

## 10. Migration File (ไฟล์ Migration ที่ถูกสร้างและรันจริง)

**Migration Folder:** `prisma/migrations/20260910075117_target_activity_plan_phase1`  
**Migration File:** `prisma/migrations/20260910075117_target_activity_plan_phase1/migration.sql`

```sql
/*
  Warnings:

  - You are about to drop the `activity_plan_items` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "activity_plan_items" DROP CONSTRAINT "activity_plan_items_activity_plan_id_fkey";

-- AlterTable
ALTER TABLE "activity_plan_products" ADD COLUMN     "is_price_overridden" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "master_price" DECIMAL(15,2);

-- AlterTable
ALTER TABLE "activity_plan_stores" ADD COLUMN     "notes" TEXT,
ADD COLUMN     "sub_dealer_store" TEXT,
ADD COLUMN     "target_amount" DECIMAL(15,2);

-- AlterTable
ALTER TABLE "activity_plans" ADD COLUMN     "target_attendees_count" INTEGER,
ADD COLUMN     "target_booking_sales" DECIMAL(15,2);

-- DropTable
DROP TABLE "activity_plan_items";

-- CreateTable
CREATE TABLE "activity_plan_marketing_items" (
    "id" TEXT NOT NULL,
    "activity_plan_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "material_name" TEXT NOT NULL,
    "unit" TEXT,
    "unit_price" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "total_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_plan_marketing_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_plan_promotion_items" (
    "id" TEXT NOT NULL,
    "activity_plan_id" TEXT NOT NULL,
    "budget_type" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_plan_promotion_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "activity_plan_marketing_items_activity_plan_id_idx" ON "activity_plan_marketing_items"("activity_plan_id");

-- CreateIndex
CREATE INDEX "activity_plan_marketing_items_category_idx" ON "activity_plan_marketing_items"("category");

-- CreateIndex
CREATE INDEX "activity_plan_promotion_items_activity_plan_id_idx" ON "activity_plan_promotion_items"("activity_plan_id");

-- CreateIndex
CREATE INDEX "activity_plan_promotion_items_budget_type_idx" ON "activity_plan_promotion_items"("budget_type");

-- AddForeignKey
ALTER TABLE "activity_plan_marketing_items" ADD CONSTRAINT "activity_plan_marketing_items_activity_plan_id_fkey" FOREIGN KEY ("activity_plan_id") REFERENCES "activity_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_plan_promotion_items" ADD CONSTRAINT "activity_plan_promotion_items_activity_plan_id_fkey" FOREIGN KEY ("activity_plan_id") REFERENCES "activity_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

---

## 11. Validation Result (ผลการตรวจสอบระดับฐานข้อมูลและ Prisma)

1. `prisma format`: **SUCCESS** (จัดรูปแบบ schema.prisma เรียบร้อย)
2. `prisma validate`: **SUCCESS** (The schema at prisma\schema.prisma is valid 🚀)
3. `prisma migrate deploy`: **SUCCESS** (Migration `20260910075117_target_activity_plan_phase1` applied successfully)
4. `prisma generate`: **SUCCESS** (Prisma Client v7.2.0 generated to `node_modules/.prisma/client`)

---

## 12. Typecheck Result (ผลการรัน `pnpm tsc --noEmit`)

คำสั่ง `pnpm exec tsc --noEmit` ทำงานเสร็จสิ้นและพบ Error ตามที่คาดหมายไว้ เนื่องจากโมเดล `ActivityPlanItem` ถูกถอดออกจาก Prisma Client แล้ว ทำให้โค้ดใน Application Layer ที่ยังคงอ้างอิงฟิลด์ `items` หรือ `activityPlanItem` แจ้งข้อผิดพลาด TypeScript

> [!NOTE]
> **ตามกฎ STRICT RULE ของคำสั่ง Phase 1:**  
> AI **ห้ามแก้ Application Code ใน Phase 1** จึงได้รวบรวมรายการไฟล์และจุดที่ต้อง Refactor ทั้งหมดไว้ในหัวข้อที่ 13 ด้านล่างนี้เพื่อใช้ในการดำเนินการ Phase 2 ต่อไป

---

## 13. Remaining Application Dependencies (รายการจุดที่ต้อง Refactor ใน Phase 2)

### 13.1 Repository Layer
- `modules/activity-plans/infrastructure/activity-plan.repository.ts`:
  - บรรทัดที่ 155, 328, 1680, 1698: ลบ `items` ออกจาก Prisma `include`
  - บรรทัดที่ 587, 828, 831, 1899, 1983, 2024: ปรับปรุงคำสั่ง `tx.activityPlanItem.createMany / deleteMany` ให้เปลี่ยนเป็นบันทึก `tx.activityPlanStore`, `tx.activityPlanProduct`, `tx.activityPlanMarketingItem`, และ `tx.activityPlanPromotionItem`
- `modules/activity-plans/infrastructure/promotional-material.repository.ts`:
  - บรรทัดที่ 279: ปรับการ Query จาก `activityPlanItem` ไปยัง `activityPlanMarketingItem`

### 13.2 Application & Extraction Layer
- `modules/activity-plans/application/index.ts`:
  - ปรับปรุง Mapping DTO ที่ยังคงอ้างอิง `plan.items`
- `modules/activity-plans/features/actual-view/utils/plan-extractor.ts`:
  - ปรับการดึงข้อมูลตาม Work Type ให้ดึงจาก `stores`, `products`, `marketingItems`, `promotionItems` แทน `items`

### 13.3 UI View & Components (Phase 2 & 3)
- `modules/activity-plans/features/form/activity-plan-edit-view.tsx`
- `modules/activity-plans/features/list-view/activity-plan-table.tsx`
- `modules/activity-plans/features/approve-view/activity-plan-approval-detail-view.tsx`
- `modules/activity-plans/features/approve-view/activity-plan-approval-list-view.tsx`
- `modules/activity-plans/features/approve-view/components/approval-action-dialog.tsx`
- `modules/activity-plans/features/approve-view/components/approval-detail-drawer.tsx`

### 13.4 Seeds & Test Scripts
- `prisma/seed/activity/seed-helpers.ts`: ปรับ Seed ให้สร้าง Record ลงตารางใหม่แทน `activityPlanItem`
- `scripts/seed-activity-uat.ts`: ปรับปรุงสคริปต์จำลองข้อมูล UAT

---

## 14. Risks & Considerations (ความเสี่ยงและข้อพิจารณา)

1. **Master Data Integrity:** ข้อมูล Master Data เช่น `Customer`, `Product`, `Employee`, `User`, `RBAC` ปลอดภัย 100% ไม่มีการถูกแก้ไขหรือลบ
2. **Dev Environment State:** ระบบปัจจุบันอยู่ในสถานะ Schema ล่าสุด แต่ Application Code ยังไม่ได้รับการปรับให้ตรงกับ Type ใหม่ ทำให้หน้าเว็บ Trip Plan จะยังรันไม่ผ่านจนกว่าจะดำเนินการ Refactor ใน Phase 2
3. **Layer Boundary:** ใน Phase 2 ควรแยก Business Logic ไปไว้ที่ `modules/activity-plans/domain/` เพื่อแก้ปัญหา Client Component ดึง Prisma Runtime เข้ามาด้วยพร้อมกัน

---

## 15. สรุปผลการปฏิบัติการ Phase 1

การดำเนินงาน Database & Prisma Architecture ใน **IMPLEMENTATION PHASE 1 สำเร็จลุล่วง 100%**  
โครงสร้างฐานข้อมูลเป้าหมายตรงตาม Target Data Architecture สมบูรณ์ทุกประการ

🛑 **STRICT STOP:** หยุดการทำงานและรอคำสั่งอนุมัติจากผู้ใช้เพื่อเข้าสู่ **PHASE 2 (Domain, Repository & Use Case Implementation)** ต่อไปครับ
