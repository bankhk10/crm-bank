# AUDIT & ROOT CAUSE ANALYSIS REPORT
## ปัญหาสต็อกสินค้า "จอง (Reserved)" ติดลบ: รหัสสินค้า 91CHT-3000C500-CS1

- **วันที่ตรวจสอบ:** 27 สิงหาคม 2569 (2026-08-27)
- **สถานะการประเมิน:** 🔴 **BUG (พบข้อผิดพลาดเชิงโครงสร้างในระบบ Fulfillment & Split Shipment)**
- **ประเภทการดำเนินการ:** Audit / Root Cause Analysis (ไม่มีการแก้ไขโค้ดหรือฐานข้อมูลในขั้นตอนนี้)

---

## 1. Current Stock State (สถานะสต็อกปัจจุบันใน Database)

จากการตรวจสอบตาราง `ProductStock` ในฐานข้อมูลจริงของสินค้ารหัส `91CHT-3000C500-CS1`:

| Field | ค่าใน Database | สถานะ / ความถูกต้อง |
| :--- | :--- | :--- |
| `id` | `cmso3gtgx00je01p6xluwhi24` | Primary Key |
| `productId` | `cmse6x63p01of01p1l3hoyfij` | Foreign Key to Product |
| `physicalBalance` | **193** | ปกติ (ตรงตามยอดคงเหลือใน Lot จริง) |
| `reservedQuantity` | **-7** | ❌ **ผิดปกติ (ติดลบ ขัดต่อ Business Rule)** |
| `availableQuantity` | **200** | ❌ **ผิดปกติ (เกิดจาก 193 - (-7) = 200 สูงกว่า Physical จริง)** |
| `updatedAt` | `2026-08-27T02:59:18.072Z` | เวลาที่เกิดการตัดสต็อกล่าสุด |

- **จำนวน Record ProductStock:** มี **1 Record เท่านั้น** (ไม่มี Record ซ้ำซ้อน)

---

## 2. Product Information & Stock Lots (ข้อมูลสินค้าและ LOT ทั้งหมด)

### ข้อมูลสินค้า (Product)
- **Product ID:** `cmse6x63p01of01p1l3hoyfij`
- **Product Code:** `91CHT-3000C500-CS1`
- **Product Name:** `ฮังเกอร์ การ์ด : 12 x 500 มล.`
- **Unit:** `กล่อง` (12 x 500 มล.)
- **Created At:** `2026-08-04T05:01:07.235Z`

### ข้อมูล LOT คงคลัง (`ProductStockLot`)
| Lot Number | Initial Qty | Remaining Qty | Import Date | Storage | Status |
| :--- | :---: | :---: | :--- | :--- | :--- |
| `LOT-1` | 0 | 0 | 2026-08-11 | คลังบางเลน | หมดสต็อก |
| `32504MFG100826` | 100 | 0 | 2026-08-11 | MW | หมดสต็อก |
| `32555MFG210826` | 100 | 93 | 2026-08-25 | คลังบางเลน | ใช้งานอยู่ |
| `32556MFG250826` | 100 | 100 | 2026-08-26 | คลังบางเลน | ใช้งานอยู่ |
| **รวม Physical** | **300** | **193** | | | |

---

## 3. Sales History & Reservations Timeline (ประวัติการขายทั้งหมดของสินค้านี้)

มีรายการขายที่เกี่ยวข้องกับสินค้านี้ทั้งหมด **6 Sales (8 SaleItems)**:

| ลำดับ | เลขที่ใบขาย (Sale Number) | ลูกค้า | จำนวน (กล่อง) | สถานะปัจจุบัน | `isStockDeducted` | การจัดส่ง (Shipments) |
| :---: | :--- | :--- | :---: | :--- | :---: | :--- |
| 1 | `2026080030` | หจก. สร้อยทอง รุ่งเรืองการเกษตร | 5 | `DELIVERY_COMPLETED` | `true` | ส่งรอบเดียว (ไม่มี Split Shipment) |
| 2 | `2026080047` | นนท์เพื่อนเกษตร | 2 | `DELIVERY_COMPLETED` | `true` | ส่งรอบเดียว (ไม่มี Split Shipment) |
| 3 | **`2026080064`** | **บริษัท กำแพงเพชรจั้วเจริญ 1999 จำกัด** | **100** | **`DELIVERY_COMPLETED`** | **`true`** | **มี 2 Shipments (#1: 93, #2: 7)** 🚨 |
| 4 | `2026080102` | บริษัท เอส เค แกรนด์อโกรเทค จำกัด | 33 (30+3) | `AWAITING_DELIVERY` | `true` | ส่งรอบเดียว |
| 5 | `2026080111` | เงินสด | 11 (1+10) | `AWAITING_DELIVERY` | `true` | ส่งรอบเดียว |
| 6 | `2026080112` | หจก. เกษตรไทย หนองตม | 10 | `AWAITING_DELIVERY` | `true` | ส่งรอบเดียว |

---

## 4. Audit Log Timeline & Exact Transaction Trace (ลำดับเหตุการณ์จริงจาก Audit Log)

ตารางแสดงการเปลี่ยนแปลงของ `reservedQuantity` ตามลำดับเวลาจริง:

```
[2026-08-10 14:44:47] APPROVE Sale 2026080030 (Qty: 5)
                      Reserve Change: +5           --> Reserved = 5

[2026-08-11 03:32:30] FULFILLMENT Sale 2026080030 (ระบุวันส่ง)
                      Reserve Change: -5           --> Reserved = 0 (isStockDeducted: true)

[2026-08-13 04:40:15] APPROVE Sale 2026080047 (Qty: 2)
                      Reserve Change: +2           --> Reserved = 2

[2026-08-13 05:12:19] FULFILLMENT Sale 2026080047 (ระบุวันส่ง)
                      Reserve Change: -2           --> Reserved = 0 (isStockDeducted: true)

[2026-08-17 02:44:12] APPROVE Sale 2026080064 (Qty: 100)
                      Reserve Change: +100         --> Reserved = 100

[2026-08-19 03:27:38] FULFILLMENT Sale 2026080064 (ระบุวันส่งระดับ Sale) ⚠️ [จุดเริ่มปัญหาที่ 1]
                      ระบบเรียก confirmStockDeductionUseCase ทั้ง Sale (100 ชิ้น)
                      Reserve Change: -100         --> Reserved = 0 (isStockDeducted: true)

[2026-08-21 02:14:00] DELIVER Shipment #1 ของ Sale 2026080064 (Qty: 93) ⚠️ [จุดเริ่มปัญหาที่ 2]
                      ระบบเรียก deductStockForShipmentUseCase สำหรับ Shipment #1
                      Reserve Change: -93          --> Reserved = -93 (เกิด Double Deduction ครั้งแรก!)

[2026-08-24 07:22:19] APPROVE Sale 2026080102 (Qty: 33)
                      Reserve Change: +33          --> Reserved = -60

[2026-08-25 04:07:10] FULFILLMENT Sale 2026080102 (ระบุวันส่ง)
                      Reserve Change: -33          --> Reserved = -93 (isStockDeducted: true)

[2026-08-26 03:02:07] APPROVE Sale 2026080111 (Qty: 11)
                      Reserve Change: +11          --> Reserved = -82

[2026-08-26 03:02:53] APPROVE Sale 2026080112 (Qty: 10)
                      Reserve Change: +10          --> Reserved = -72

[2026-08-26 03:24:21] FULFILLMENT Sale 2026080112 (ระบุวันส่ง)
                      Reserve Change: -10          --> Reserved = -82 (isStockDeducted: true)

[2026-08-26 03:55:47] FULFILLMENT Sale 2026080111 (ระบุวันส่ง)
                      Reserve Change: -11          --> Reserved = -93 (isStockDeducted: true)

[2026-08-27 01:09:47] STOCK IMPORT / SYNC (syncProductStocks) ⚠️
                      Sync ทำงาน: คำนวณเฉพาะ Sale ที่ isStockDeducted: false (ซึ่งเป็น 0 ทุกบิล)
                      Reset Reserved เป็น 0        --> Reserved = 0

[2026-08-27 02:59:18] DELIVER Shipment #2 ของ Sale 2026080064 (Qty: 7) 🚨 [จุดเกิด Reserved = -7]
                      ระบบเรียก deductStockForShipmentUseCase สำหรับ Shipment #2
                      Reserve Change: -7           --> Reserved = 0 - 7 = -7 !
```

---

## 5. จุดที่ลด Reserved ใน Codebase ทั้งหมด

| ไฟล์ | ฟังก์ชัน | เหตุการณ์ที่เรียก | จำนวนที่ลด |
| :--- | :--- | :--- | :--- |
| `modules/products/application/stock-management.ts:228` | `confirmStockDeductionUseCase` | เมื่อ Sale ระบุ `deliveryDate` หรือเข้าสถานะ `AWAITING_DELIVERY`/`DELIVERY_COMPLETED` (Flow ปกติ) | `-item.quantity` (ทั้งออเดอร์) |
| `modules/products/application/stock-management.ts:355` | `confirmStockDeductionWithLotsUseCase` | เมื่อระบุ LOT และยืนยันตัดสต็อกระดับ Sale | `-item.quantity` (ทั้งออเดอร์) |
| `modules/products/application/stock-management.ts:498` | `deductStockForShipmentUseCase` | เมื่อ Shipment (Split Delivery) เปลี่ยนสถานะเป็น `IN_TRANSIT` หรือ `DELIVERED` | `-shipmentItem.quantity` (ตามรอบส่ง) |
| `modules/products/application/stock-management.ts:134` | `releaseStockUseCase` | เมื่อ Sale ถูก `CANCELLED` หรือแก้ไขออเดอร์ | `-item.quantity` (ถ้ายังไม่ได้ตัดสต็อก) |

---

## 6. State Transition Matrix ของระบบสต็อก

| Event / Transition | Reserve | Release Reserve | Deduct Physical | หมายเหตุ |
| :--- | :---: | :---: | :---: | :--- |
| **สร้าง Order (Draft/Pending)** | 0 | 0 | 0 | ยังไม่จองสต็อก |
| **Approve Sale (`PENDING` → `APPROVED`)** | `+Qty` | 0 | 0 | จองสต็อกตามจำนวนสั่งซื้อ |
| **Reject Sale (`PENDING` → `REJECTED`)** | 0 | 0 | 0 | ไม่มีการจองอยู่แล้ว |
| **Cancel Sale (`APPROVED` → `CANCELLED`)** | 0 | `-Qty` | 0 | คืนยอดจอง (ถ้า `isStockDeducted` เป็น `false`) |
| **Set Delivery Date (`AWAITING_DELIVERY`)** | 0 | `-Qty` | 0 | ปลดการจอง (`confirmStockDeduction`) เพื่อเข้าสู่กระบวนการจัดส่ง |
| **Delivery Completed (บิลเดี่ยว)** | 0 | 0 | 0 | ปลดจองไปแล้วตอน AWAITING_DELIVERY |
| **Split Shipment (`PENDING` → `IN_TRANSIT`/`DELIVERED`)** | 0 | `-ShipmentQty` | 0 | ปลดการจองตามยอดส่งจริงใน Shipment |

---

## 7. ROOT CAUSE ANALYSIS (สรุปสาเหตุที่แท้จริง)

### 📌 ทำไม Reserved ของ `91CHT-3000C500-CS1` ถึงติดลบ `-7`?

สาเหตุเกิดจาก **"Double Un-reservation Conflict" ระหว่าง Flow การส่งแบบบิลเดี่ยว (Single Delivery) และการส่งแบบแบ่งรอบ (Split Shipment)** บนใบขาย **`2026080064`** ร่วมกับการคำนวณของ Stock Sync:

1. **การปลดจองซ้ำซ้อน (Double Deduction):**
   - ในใบขาย **`2026080064`** มีจำนวนสั่งซื้อ **100 กล่อง**
   - เมื่อ Approve: ระบบทำการจอง `Reserved = +100`
   - เมื่อผู้ใช้งานเปิดหน้า Fulfillment และบันทึกวันส่งของใบขายหลัก: ระบบใน `updateFulfillmentUseCase` ได้เรียก `confirmStockDeductionUseCase` ปลดจองไปแล้ว **-100** (Reserved เหลือ 0) และตั้งค่า `isStockDeducted = true`
   - ต่อมา มีการสร้าง Split Shipment เป็น 2 รอบ:
     - Shipment #1: 93 กล่อง
     - Shipment #2: 7 กล่อง
   - เมื่อ Shipment #1 ถูกส่ง: `updateShipmentUseCase` เรียก `deductStockForShipmentUseCase` ทำการปลดจองซ้ำอีก **-93**
2. **Stock Sync รีเซ็ตเป็น 0:**
   - เมื่อวันที่ 2026-08-27 เวลา 01:09 น. มีการรัน Sync สต็อก (`syncProductStocks`) ซึ่งคำนวณ Reserved จาก Sale ที่ `isStockDeducted == false` (ไม่มี) ทำให้ Reserved ถูกตั้งเป็น `0`
3. **Trigger สุดท้ายที่ทำให้ติดลบ:**
   - เมื่อวันที่ 2026-08-27 เวลา 02:59 น. ผู้ใช้งานกดยืนยันจัดส่ง **Shipment #2 (7 กล่อง)**
   - `updateShipmentUseCase` เรียก `deductStockForShipmentUseCase` ปลดจองอีก **-7**
   - **`0 - 7 = -7`** ทำให้ Reserved กลายเป็น **-7** และ Available กลายเป็น **200** ทันที

---

## 8. ผลกระทบ (Impact Analysis)

1. **Available Stock เพี้ยน (200 กล่อง แทนที่จะเป็น 193 กล่อง):**
   - เนื่องจาก `Available = Physical (193) - Reserved (-7) = 200`
   - ส่งผลให้ระบบแสดงยอดพร้อมขายเกินจริง 7 กล่อง
2. **ความเสี่ยงต่อการขายเกินสต็อก (Overselling):**
   - เซลส์อาจเห็นยอดพร้อมขายมากกว่าสต็อกจริงในคลัง E-Con
3. **ส่งผลกระทบต่อทุกสินค้าที่มีการทำ Split Shipment:**
   - สินค้าใดก็ตามที่มี Order ที่เคยถูกกดยืนยันวันส่งระดับ Sale แล้วมาทำ Split Shipment ทีหลัง จะเกิด Double Un-reservation ในลักษณะเดียวกัน

---

## 9. ข้อบกพร่องเชิงโครงสร้างที่พบ (Systemic Vulnerabilities)

1. **ไม่มี Invariant Guard ป้องกัน `reservedQuantity < 0`:**
   - ทั้งใน Prisma Schema, Database Constraint และ Repository (`stock.repository.ts`) ไม่มีการตรวจสอบว่า `reservedQuantity` ห้ามติดลบ
2. **ไม่มี State Guard แยกระหว่าง Single Delivery กับ Split Shipment:**
   - เมื่อ Sale มี `hasPartialDelivery: true` หรือมี `Shipment` อยู่ ระบบควรปลดจองผ่าน Shipment เท่านั้น ห้ามเรียก `confirmStockDeduction` ซ้ำที่ระดับ Sale
3. **Stock Sync ไม่ครอบคลุม Split Shipment:**
   - `scripts/sync-missing-product-stocks.ts` ตรวจสอบเฉพาะ `isStockDeducted: false` แต่ไม่ได้คำนวณยอดคงเหลือของ Shipment ที่ยังค้างส่ง (`PENDING`)

---

## 10. การดำเนินการแก้ไข (Action Items Completed)

### 1. Code Fixes
- **Repository Invariant Guard:** เพิ่ม `InsufficientReservedStockError` ใน `stock.repository.ts` เพื่อป้องกันไม่ให้ `reservedQuantity < 0` ในระดับ Transaction
- **State Flow Separation:** ปรับ `updateFulfillmentUseCase` ไม่ให้เรียก `confirmStockDeduction` บนบิลที่มี Split Shipment
- **Handover Transition:** ปรับ `createShipmentUseCase` ให้ Revert Sale-level deduction คืนยอดจองก่อนสร้าง Split Shipment เพื่อป้องกัน Double Un-reservation
- **Idempotency Guards:** ติดตั้ง Guard ใน `stock-management.ts` และ `update-shipment.ts`
- **Reconciliation Update:** ปรับปรุง `scripts/sync-missing-product-stocks.ts` ให้คำนวณยอดค้างส่งของ Split Shipment อย่างถูกต้อง

### 2. Data Repair Execution
- **วันเวลาที่ดำเนินการ:** 2026-08-27
- **ผลการปรับปรุง:**
  - `physicalBalance`: 193
  - `reservedQuantity`: 0 (เดิม: -7)
  - `availableQuantity`: 193 (เดิม: 200)
- **บันทึก Audit Log:** บันทึกเรียบร้อยในตาราง `AuditLog` ภายใต้ Transaction

### 3. Automated Verification
- ผ่านการทดสอบ Automated Tests ครบ 10 กรณี (10/10 PASS) ใน `scripts/test_stock_reservation.ts`
- ดูรายละเอียดเพิ่มเติมใน [docs/stock-reservation-business-rules.md](file:///d:/code/crm-bank/docs/stock-reservation-business-rules.md) และ [docs/stock-reserved-negative-global-audit.md](file:///d:/code/crm-bank/docs/stock-reserved-negative-global-audit.md)
