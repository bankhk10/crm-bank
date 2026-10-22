# Task 5: Repository, Strategy & DB Persistence

> **Objective:** ปรับปรุง `type7a.repository.ts` และ `type7a-planned.strategy.ts` เพื่อบันทึกข้อมูลผลจัดตั้งแปลงจริงลง `DemoPlot`, `DemoPlotIrrigation`, `DemoPlotExternalProduct`, `DemoPlotProduct` และ `DemoPlotVisit` ภายใน `$transaction`

## 1. จุดที่ต้องแก้ไขใน Repository (`type7a.repository.ts`)

### 1.1 สร้างฟังก์ชัน `syncType7aActualData`:
- อัปเดตระเบียนหลักในตาราง `DemoPlot`:
  - `farmerCustomerId`, `ownerName`, `ownerPhone`, `ownerProvince`, `ownerDistrict`, `ownerSubdistrict`, `isUnregisteredFarmer`
  - `latitude`, `longitude`
  - `mainCropInfo`, `experimentDetail`
  - `plantingDate`, `initialSprayDate`, `nextSprayDate`
  - `sprayMethod`, `sprayEquipment`, `otherEquipment`, `hasExternalChemicals`, `notes`
- จัดการตารางลูก `DemoPlotIrrigation`:
  - ลบรายการเดิมของแปลงนี้ และ `createMany` ตามระบบน้ำที่เลือกใหม่
- จัดการตารางลูก `DemoPlotExternalProduct`:
  - ลบรายการเดิม และ `createMany` ยาภายนอกที่บันทึก
- จัดการตารางลูก `DemoPlotProduct`:
  - บันทึกทั้งสินค้าตามแผน (พร้อมจำนวนจริง, ปริมาณเพิ่ม, อัตราการใช้) และสินค้าเพิ่มเติมหน้างาน
- จัดการประวัติการลงพื้นที่ `DemoPlotVisit` (Visit #1):
  - สร้างหรืออัปเดต Visit #1 กำหนด `workTypeCode = "TYPE_7A"`, `cropAgeValue`, `cropAgeUnit`, `growthStage`, `sprayMethod`, `sprayEquipment`, `plotImageUrls`

## 2. จุดที่ต้องแก้ไขใน Strategy (`type7a-planned.strategy.ts`)
- ในฟังก์ชัน `saveActual(tx, activityPlanId, actualData)`:
  - เรียกใช้ `syncType7aActualData` เพื่อบันทึกข้อมูลทุกตารางใน `$transaction` เดียวกัน
  - บันทึกลง `activityResultDemoItem` เพื่อรักษาความเข้ากันได้กับรายงานภาพรวมระบบเดิม

## 3. ขั้นตอนการดำเนินการ (Checklist)
- [x] 1. เพิ่มฟังก์ชัน `syncType7aActualData` ใน `type7a.repository.ts` เพื่อบันทึก DemoPlot, DemoPlotIrrigation, DemoPlotExternalProduct, DemoPlotProduct และ DemoPlotVisit (Visit #1)
- [x] 2. เชื่อมโยงใน `type7aPlannedStrategy.saveActual` ทำงานร่วมกันใน `$transaction` เดียวกัน
- [x] 3. ตรวจสอบ Transaction Isolation และ Backward Compatibility กับ ActivityResultDemoItem

