# STOCK RESERVATION BUSINESS RULES & ARCHITECTURE
## กฎทางธุรกิจและสถาปัตยกรรมการจัดการสต็อกสินค้า (CS One CRM)

เอกสารนี้ระบุมาตรฐาน กฎทางธุรกิจ (Business Rules) และ State Transitions ของระบบสต็อกสินค้าใน CS One CRM เพื่อเป็น Single Source of Truth สำหรับนักพัฒนาและระบบงานที่เกี่ยวข้อง

---

## 1. องค์ประกอบของสต็อกสินค้า (Stock Elements)

สต็อกสินค้ามี 3 ค่าหลัก ซึ่งต้องสอดคล้องกับ Invariant Equation เสมอ:

$$\text{Available Quantity} = \text{Physical Balance} - \text{Reserved Quantity}$$

| องค์ประกอบ | นิยามทางธุรกิจ | แหล่งที่มา (Source of Truth) | กฎ Invariant |
| :--- | :--- | :--- | :--- |
| **Physical Balance** | จำนวนสินค้าจริงที่อยู่ในคลังสินค้า | ระบบ E-Con / การนำเข้าสต็อก (Stock Import) | $\ge 0$ |
| **Reserved Quantity** | จำนวนสินค้าที่ถูกจองไว้สำหรับใบสั่งซื้อที่อนุมัติแล้วและยังไม่ได้จัดส่ง | การคำนวณจากสถานะคำสั่งซื้อและการจัดส่ง | **$\ge 0$ เสมอ (ห้ามติดลบเด็ดขาด)** |
| **Available Quantity** | จำนวนสินค้าที่พร้อมขายได้ทันที | คำนวณจาก `Physical - Reserved` | อาจติดลบได้กรณีขายเกิน (Oversold) แต่ Reserved ห้ามติดลบ |

---

## 2. การจองสต็อก (Stock Reservation Flow)

### 2.1 การจองเมื่ออนุมัติการขาย (Sale Approval)
- **เมื่อ:** ใบสั่งซื้อเปลี่ยนสถานะจาก `PENDING_APPROVAL` $\rightarrow$ `APPROVED`
- **การทำงาน:** ระบบจะเพิ่มยอดจองตามจำนวนสินค้าในใบสั่งซื้อ (`reservedQuantity += item.quantity`)
- **ไฟล์รับผิดชอบ:** `modules/sales/application/approve-sale.ts` (`approveSaleUseCase`)

---

## 3. การปลดการจองและการตัดสต็อก (Stock Deduction & Un-reservation)

ระบบแบ่งการส่งสินค้าออกเป็น **2 รูปแบบอย่างชัดเจน (Strict Separation)**:

```
                          ┌───────────────────────────┐
                          │   Sale Approved (+Qty)    │
                          └─────────────┬─────────────┘
                                        │
                    ┌───────────────────┴───────────────────┐
                    ▼                                       ▼
        [ Single Delivery Flow ]                [ Split Shipment Flow ]
        (ไม่มี Split Shipment)                  (มี Shipment / hasPartialDelivery)
                    │                                       │
        • ระบุวันส่ง / Awaiting Delivery        • สร้าง Shipment #1, #2 (PENDING)
        • ปลดจองทั้งบิล:                          • เมื่อเริ่มส่ง Shipment #i:
          confirmStockDeduction(-SaleQty)         deductStockForShipment(-ShipmentQty)
        • isStockDeducted = true                • เมื่อส่งครบทุก Shipment:
                                                  isStockDeducted = true
```

### 3.1 รูปแบบที่ 1: การส่งแบบบิลเดี่ยว (Single Delivery Flow)
* **เงื่อนไข:** ใบสั่งซื้อไม่มีการแบ่งรอบส่ง (`hasPartialDelivery = false` และไม่มี `Shipment`)
* **การปลดจอง:** 
  * เมื่อระบุวันที่จัดส่ง หรือสถานะเปลี่ยนเป็น `AWAITING_DELIVERY`, `DELIVERY_COMPLETED`, `PAID`, `COMPLETED`
  * ระบบเรียก `confirmStockDeductionUseCase(saleId)` หรือ `confirmStockDeductionWithLotsUseCase`
  * ปลดจองทั้งบิล: `reservedQuantity -= item.quantity`
  * บันทึกสถานะ `isStockDeducted = true` บนใบขาย

### 3.2 รูปแบบที่ 2: การส่งแบบแบ่งรอบ (Split Shipment / Partial Delivery Flow)
* **เงื่อนไข:** ใบสั่งซื้อมีการสร้าง Shipment (`hasPartialDelivery = true` หรือมี `Shipment`)
* **กฎสำคัญ:** **ห้ามเรียก `confirmStockDeductionUseCase` ระดับ Sale เด็ดขาด!**
* **การปลดจอง:**
  * เมื่อสร้าง Shipment: สถานะเริ่มต้นเป็น `PENDING` (ยังไม่มีการปลดจอง)
  * เมื่อ Shipment เริ่มจัดส่ง (`PENDING` $\rightarrow$ `IN_TRANSIT` หรือ `DELIVERED`):
    * ระบบเรียก `deductStockForShipmentUseCase(shipmentId)`
    * ปลดจองเฉพาะจำนวนในรอบนั้น: `reservedQuantity -= shipmentItem.quantity`
  * เมื่อส่งครบทุก Shipment: ระบบจะเปลี่ยนสถานะ Sale เป็น `DELIVERY_COMPLETED` และตั้งค่า `isStockDeducted = true`

### 3.3 กรณีเปลี่ยนจาก Single Delivery เป็น Split Shipment (Handover Transition)
* หากใบสั่งซื้อเคยระบุวันส่งแบบบิลเดี่ยวมาก่อน (`sale.isStockDeducted = true`) แล้วผู้ใช้ต้องการเปลี่ยนมาแบ่งรอบส่ง (Split Shipment):
* ใน `createShipmentUseCase`: ระบบจะทำการ **Revert Sale-level deduction** คืนยอดจองกลับมาเป็น Reserved (`revertStockDeductionFromLotsUseCase`) และรีเซ็ต `isStockDeducted = false`, `hasPartialDelivery = true` ทันที
* เพื่อให้ Split Shipments ที่กำลังสร้างสามารถทยอยปลดจองตามยอดส่งจริงได้โดยไม่เกิดปัญหา Double Deduction

---

## 4. การคืนยอดจอง (Stock Release / Reversal Flow)

### 4.1 การยกเลิกใบขาย (Sale Cancellation / Revert)
- **ฟังก์ชัน:** `releaseStockUseCase(saleId)`
- **ตรรกะการคืน:**
  - **Single Delivery:** คืนยอดจอง `item.quantity` เฉพาะกรณีที่บิลยังไม่ได้ถูกตัดสต็อก (`!sale.isStockDeducted`)
  - **Split Shipment:** คำนวณยอดค้างส่งที่แท้จริง:
    $$\text{Release Quantity} = \max(0, \text{Ordered Quantity} - \text{Shipped Quantity})$$
    และคืนเฉพาะยอดจองส่วนที่ยังไม่ได้จัดส่ง

### 4.2 การยกเลิกการจัดส่ง (Shipment Cancellation)
- **ฟังก์ชัน:** `revertStockForShipmentUseCase(shipmentId)`
- **ตรรกะการคืน:** คืนยอดจองตามจำนวนสินค้าใน Shipment นั้นกลับเข้าสู่ `reservedQuantity` (`reservedQuantity += shipmentItem.quantity`)

---

## 5. การป้องกันข้อผิดพลาดเชิงโครงสร้าง (Safety Guards & Idempotency)

### 5.1 Invariant Guard ใน Repository Layer (`stock.repository.ts`)
* **กฎเหล็ก:** **ห้ามใช้ `Math.max(0, ...)` เพื่อซ่อนข้อผิดพลาดทางตรรกะ**
* ใน `upsertProductStock` และ `updateProductStock`:
  * หากการเปลี่ยนแปลงทำให้ `reservedQuantity < 0`:
  * ระบบจะ `throw new InsufficientReservedStockError(...)` ทันที และทำการ Rollback Transaction ทั้งหมด

### 5.2 Idempotency Guards
* `confirmStockDeductionUseCase`: จะไม่ทำงานซ้ำหาก `sale.isStockDeducted === true` หรือมี Split Shipment
* `deductStockForShipmentUseCase`: จะถูกเรียกเฉพาะการเปลี่ยนสถานะจาก `PENDING` $\rightarrow$ `IN_TRANSIT` / `DELIVERED` เท่านั้น
* `updateShipmentUseCase`: ตรวจสอบ State Transition ที่ถูกต้อง ป้องกันการเรียกซ้ำ

---

## 6. การกระทบยอดสต็อก (Stock Sync & Reconciliation)

Script `scripts/sync-missing-product-stocks.ts` ทำหน้าที่กระทบยอด (Reconciliation) โดยคำนวณ Expected Reserved จากความเป็นจริงของระบบ:

$$\text{Expected Reserved} = \sum_{\text{Single Sales}} \text{Pending Qty} + \sum_{\text{Split Sales}} (\text{Ordered Qty} - \text{Shipped Qty})$$

* **Single Delivery Sales:** รวมจำนวนจากบิลที่ `status IN ['APPROVED']` และ `isStockDeducted === false`
* **Split Shipment Sales:** รวมจำนวนจากบิลที่ `status IN ['APPROVED', 'AWAITING_DELIVERY', 'PARTIALLY_DELIVERED']` โดยหักลบด้วยจำนวนสินค้าที่จัดส่งแล้ว (`IN_TRANSIT`, `DELIVERED`, `COMPLETED`) ในแต่ละรอบ
