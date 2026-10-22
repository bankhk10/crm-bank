# Task 1: Database Schema & Migration

> **Objective:** อัปเดตโครงสร้าง Database ใน `prisma/schema.prisma` เพื่อรองรับข้อมูลสภาพแปลงเริ่มต้นและสินค้าที่ใช้จริงอย่างสมบูรณ์ และส่งต่อให้ Type 7B

## 1. ฟิลด์ที่ต้องเพิ่มใน `prisma/schema.prisma`

### 1.1 Model `DemoPlot`
เพิ่มฟิลด์ที่เกี่ยวข้องกับเกษตรกรนอกระบบและอุปกรณ์ฉีดพ่น:
```prisma
model DemoPlot {
  // ... existing fields ...
  ownerSubdistrict String?  @map("owner_subdistrict") // ตำบลของเกษตรกรนอกระบบ
  sprayEquipment   String?  @map("spray_equipment")   // อุปกรณ์ที่ใช้ฉีดพ่นเริ่มต้น
  otherEquipment   String?  @map("other_equipment")   // กรณีเลือกอุปกรณ์ อื่นๆ
  // ... existing fields ...
}
```

### 1.2 Model `DemoPlotProduct`
เพิ่มฟิลด์สำหรับปริมาณที่ใช้เพิ่มและสินค้าเพิ่มเติม:
```prisma
model DemoPlotProduct {
  // ... existing fields ...
  extraQuantity     Decimal? @map("extra_quantity") @db.Decimal(10, 2) // ปริมาณที่ใช้เพิ่ม (เช่น 500 ซีซี หรือ 100 กรัม)
  extraUnit         String?  @map("extra_unit")                        // หน่วยปริมาณที่ใช้เพิ่ม ("ซีซี", "กรัม")
  isAdditional      Boolean  @default(false) @map("is_additional")     // สินค้าเพิ่มเติมหน้างาน (ไม่ได้อยู่ในแผนที่เบิก)
  withdrawnQuantity Decimal? @map("withdrawn_quantity") @db.Decimal(10, 2) // จำนวนที่ขอเบิกตามแผนเดิม (เพื่อแสดงเปรียบเทียบ)
  // ... existing fields ...
}
```

## 2. ขั้นตอนการดำเนินการ (Checklist)
- [x] 1. แก้ไขไฟล์ `prisma/schema.prisma` เพิ่มฟิลด์ข้างต้น
- [x] 2. ซิงค์ Database Schema เข้าสู่ PostgreSQL:
  ```bash
  npx prisma db push
  ```
- [x] 3. รัน Prisma Generate:
  ```bash
  npx prisma generate
  ```
- [x] 4. ตรวจสอบความถูกต้องของ TypeScript Types ที่ Generate ออกมาใน `node_modules/.prisma/client/index.d.ts`

## 3. เกณฑ์การยอมรับ (Acceptance Criteria)
- Schema คอมไพล์ผ่าน ไม่มี Foreign Key ขัดแย้ง
- มีคอลัมน์ใหม่ในฐานข้อมูล PostgreSQL ครบถ้วน
- Type 7B สามารถเข้าถึงฟิลด์เหล่านี้ได้ผ่าน `DemoPlot` และ `DemoPlotProduct`

