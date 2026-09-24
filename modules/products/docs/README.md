# Products & Stock Documentation

> **Module**: `modules/products/`  
> **Domain**: การจัดการสินค้า, กลุ่มสินค้า, ราคา และระบบสต็อกสินค้า (Stock & Inventory)  
> **Status**: Active Standard

---

## 📚 Document Index

| เอกสาร | หมวดหมู่ | คำอธิบาย |
|---|:---:|---|
| [stock-reservation-business-rules.md](./stock-reservation-business-rules.md) | **Business Rules** | กฎทางธุรกิจและสถาปัตยกรรมการจัดการสต็อกสินค้า (Single Delivery vs Split Shipment, Invariant Formula) |
| [audit/stock-reserved-negative-global-audit.md](./audit/stock-reserved-negative-global-audit.md) | **Audit** | รายงานการสแกนและตรวจสอบยอดจองสินค้าทั้งระบบ (Global Product Stock Scan) |
| [audit/stock-reserved-negative-audit-91CHT-3000C500-CS1.md](./audit/stock-reserved-negative-audit-91CHT-3000C500-CS1.md) | **Audit** | รายงานการตรวจสอบและแก้ไขปัญหายอดจองสินค้าติดลบเฉพาะเคส `91CHT-3000C500-CS1` |

---

## 🎯 Stock Invariant Equation

$$\text{Available Quantity} = \text{Physical Balance} - \text{Reserved Quantity}$$

- **Physical Balance ($\ge 0$):** จำนวนสินค้าจริงในคลังสินค้า
- **Reserved Quantity ($\ge 0$ เสมอ):** จำนวนสินค้าที่ถูกจองไว้สำหรับใบสั่งซื้อที่อนุมัติแล้วและยังไม่ได้จัดส่ง
- **Available Quantity:** จำนวนสินค้าที่พร้อมขายได้ทันที

---

## 🔗 Related References
- Global Architecture: [docs/ARCHITECTURE.md](../../../docs/ARCHITECTURE.md)
- Global Data Model: [docs/DATA_MODEL.md](../../../docs/DATA_MODEL.md)
- Global Coding Standards: [docs/CODING_STANDARDS.md](../../../docs/CODING_STANDARDS.md)
