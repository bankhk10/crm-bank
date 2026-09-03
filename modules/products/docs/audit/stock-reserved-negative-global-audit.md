# GLOBAL PRODUCT STOCK AUDIT REPORT
## รายงานการตรวจสอบสต็อกคงเหลือและยอดจองสินค้าทั้งระบบ

- **วันที่ตรวจสอบ:** 27 สิงหาคม 2569 (2026-08-27)
- **ขอบเขตการตรวจสอบ:** ตาราง `ProductStock` และ `ProductStockLot` ทั้งหมด 353 รายการในระบบ
- **สถานะภาพรวม:** 🟢 **RESOLVED & CLEAN (ไม่พบสินค้าที่มียอดจองติดลบ หรือ Available Quantity ไม่ตรงกับสูตร)**

---

## 1. ผลการสแกนความผิดปกติภาพรวม (Global Scan Summary)

| เกณฑ์การตรวจสอบ | จำนวนที่พบ | สถานะ |
| :--- | :---: | :---: |
| สินค้าที่ `reservedQuantity < 0` | **0** | ✅ PASS (เดิมพบ 1 รายการ: `91CHT-3000C500-CS1` ได้รับการแก้ไขแล้ว) |
| สินค้าที่ `availableQuantity !== physicalBalance - reservedQuantity` | **0** | ✅ PASS (ทุกรายการเป็นไปตามสูตร Invariant) |
| สินค้าที่มี Split Shipment ค้างส่ง | **17** | ✅ PASS (รองรับการคำนวณแบบ Progressive Deduction) |
| จำนวนสินค้าที่ผ่านการทดสอบ Invariant Guard | **353 / 353** | ✅ PASS |

---

## 2. รายละเอียดสินค้าที่เคยพบปัญหา (`91CHT-3000C500-CS1`)

| ข้อมูล | ก่อนการแก้ไข (Before) | หลังการแก้ไข (After) | สถานะ |
| :--- | :---: | :---: | :--- |
| **Product Code** | `91CHT-3000C500-CS1` | `91CHT-3000C500-CS1` | ฮังเกอร์ การ์ด : 12 x 500 มล. |
| **Physical Balance** | 193 | 193 | คงเดิมตาม LOT จริง |
| **Reserved Quantity** | **-7** ❌ | **0** ✅ | แก้ไขเรียบร้อยผ่าน Transaction |
| **Available Quantity** | **200** ❌ | **193** ✅ | คำนวณถูกต้องตาม `193 - 0 = 193` |
| **Audit Log Reference** | - | บันทึกในตาราง `AuditLog` | แอ็กชัน `UPDATE` โดย `script:repair_product_stock_91CHT` |

---

## 3. การตรวจสอบใบสั่งซื้อที่มีการส่งแบบแบ่งรอบ (Split Shipment Active Orders)

จากการตรวจสอบใบสั่งซื้อทั้งหมดในระบบที่ใช้งานฟังก์ชัน Partial Delivery / Split Shipment:
- มีการนำ State Guard ใหม่ไปบังคับใช้ ไม่ให้เกิดการปลดจองระดับบิล (`confirmStockDeductionUseCase`) ร่วมกับการปลดจองระดับรอบส่ง (`deductStockForShipmentUseCase`)
- มีการติดตั้ง Invariant Guard ใน `stock.repository.ts` เพื่อป้องกันไม่ให้ยอดจองติดลบได้อีกในทุกกรณี
- Script Reconciliation (`scripts/sync-missing-product-stocks.ts`) ได้รับการปรับปรุงให้คำนวณยอดค้างส่งของ Split Shipment อย่างแม่นยำ
