# Stock & Order Status Management System

## 📋 สรุปการเปลี่ยนแปลง

วันที่: 2026-01-13

### ความต้องการ

1. **อนุมัติรายการขาย → ตัดสต็อกเป็นสต็อกจอง**
2. **หน้าจัดการสถานะการขาย**:
   - 2.1: สต็อกคงเหลือถูกตัดเมื่อระบุวันที่จัดส่ง
   - 2.2.1: ไม่ระบุวันส่ง + เลย 3 วัน → สถานะ **EXPIRED**
   - 2.2.2: ระบุวันส่ง → สถานะ **รอจัดส่ง**
   - 2.2.3: อัปเดตวันส่งเกิน 3 ครั้ง → สถานะ **OVERDUE** + ล็อคแก้ไข

---

## 🔄 ไฟล์ที่ถูกแก้ไข/สร้างใหม่

### 1. Schema Changes (`prisma/schema.prisma`)

**สถานะใหม่:**

```prisma
enum SaleStatus {
  // ... existing
  OVERDUE  // เลยกำหนด (อัปเดตวันส่งเกิน 3 ครั้ง)
}
```

**Fields ใหม่ใน Sale model:**

```prisma
model Sale {
  // ... existing
  maxDeliveryUpdates    Int         @default(3)     // จำนวนครั้งสูงสุดที่อนุญาตให้แก้ไขวันส่ง
  isDeliveryLocked      Boolean     @default(false) // ล็อคการแก้ไขใบสั่งซื้อ
  orderExpiryDate       DateTime?                   // วันหมดอายุใบคำสั่งซื้อ (approvedAt + 3 วัน)
  lastDeliveryUpdate    DateTime?                   // วันที่อัปเดตวันส่งล่าสุด
}
```

### 2. New Files Created

| ไฟล์                                 | คำอธิบาย                                        |
| ------------------------------------ | ----------------------------------------------- |
| `lib/order-expiry-service.ts`        | Service สำหรับจัดการ EXPIRED และ OVERDUE orders |
| `app/api/cron/order-expiry/route.ts` | API สำหรับ Cron Job                             |

### 3. Modified Files

| ไฟล์                                      | การเปลี่ยนแปลง                                  |
| ----------------------------------------- | ----------------------------------------------- |
| `types/sales.ts`                          | เพิ่ม OVERDUE label และ color                   |
| `app/api/sales/[id]/approve/route.ts`     | เพิ่ม orderExpiryDate เมื่ออนุมัติ              |
| `app/api/sales/[id]/fulfillment/route.ts` | เพิ่มการนับ deliveryUpdateCount และตรวจสอบ lock |

---

## 🚀 ขั้นตอนการ Deploy

### Step 1: Generate Prisma Client

```bash
# หยุด dev server ก่อน (Ctrl+C)
npx prisma generate
```

### Step 2: Create Migration

```bash
npx prisma migrate dev --name add_order_expiry_tracking
```

### Step 3: Start Dev Server

```bash
pnpm dev
```

### Step 4: Setup Cron Job

ใน production, ต้องตั้ง cron job เรียก API นี้ทุกชั่วโมง:

```bash
# ทุกชั่วโมง
curl -X POST https://your-domain.com/api/cron/order-expiry \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

หรือใช้ **Vercel Cron Jobs** ใน `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/order-expiry",
      "schedule": "0 * * * *"
    }
  ]
}
```

---

## 📊 Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SALE FLOW & STOCK MANAGEMENT                        │
└─────────────────────────────────────────────────────────────────────────────┘

                              ┌─────────────┐
                              │   PENDING   │
                              │ (รอดำเนินการ)│
                              └──────┬──────┘
                                     │ อนุมัติ
                         ┌───────────┼───────────┐
                         ▼                       ▼
               ┌─────────────────┐     ┌─────────────────┐
               │    APPROVED     │     │    REJECTED     │
               │  (อนุมัติแล้ว)   │     │  (ไม่อนุมัติ)   │
               │                 │     └─────────────────┘
               │ ⚡ ตัดสต็อกจอง   │
               │ ⏰ ตั้งเวลา 3 วัน │
               └────────┬────────┘
                        │
         ┌──────────────┼──────────────┐
         │              │              │
         ▼              ▼              ▼
┌─────────────┐ ┌─────────────────┐ ┌──────────────────┐
│   EXPIRED   │ │ AWAITING_DELIVERY│ │ AWAITING_PAYMENT │
│  (หมดอายุ)  │ │   (รอจัดส่ง)     │ │  (รอชำระเงิน)    │
│             │ │                  │ │                  │
│ 📦 คืนสต็อก │ │ ระบุวันที่ส่งแล้ว│ │   (กรณี CASH_7)  │
│ 💳 คืนเครดิต│ │ ⚡ ตัดสต็อกจริง  │ └────────┬─────────┘
└─────────────┘ │                  │          │
                │ อัปเดตวันส่ง ≤ 3 │          ▼
                └────────┬─────────┘ ┌─────────────────┐
                         │           │      PAID       │
         ┌───────────────┼──────────┐│ (ชำระเงินแล้ว)  │
         │               │          │└────────┬────────┘
         ▼               ▼          │         │
┌─────────────────┐ ┌──────────────┐│         │
│     OVERDUE     │ │  DELIVERED   ││         │
│   (เลยกำหนด)   │ │ (จัดส่งแล้ว) ││         │
│                 │ └───────┬──────┘│         │
│ อัปเดต > 3 ครั้ง│         │       │         │
│ 🔒 ปิดการแก้ไข │         ▼       │         │
│ 📦 คืนสต็อก    │ ┌──────────────┐│         │
│ 💳 คืนเครดิต  │ │  COMPLETED   │◄─────────┘
└─────────────────┘ │  (เสร็จสิ้น) │
                    └──────────────┘
```

---

## 📝 Business Rules

### Rule 1: EXPIRED (หมดอายุ)

- **เงื่อนไข**: สถานะ APPROVED + ไม่ระบุวันส่ง + เลย 3 วันนับจากอนุมัติ
- **ผลลัพธ์**:
  - สถานะ → EXPIRED
  - คืนสต็อกจอง
  - คืนวงเงินเครดิต
  - ล็อคการแก้ไข

### Rule 2: OVERDUE (เลยกำหนด)

- **เงื่อนไข**: อัปเดตวันที่จัดส่ง > 3 ครั้ง
- **ผลลัพธ์**:
  - สถานะ → OVERDUE
  - คืนสต็อก
  - คืนวงเงินเครดิต
  - ล็อคการแก้ไข

### Rule 3: การนับ Update Count

- **ไม่นับ**: การระบุวันส่งครั้งแรก
- **นับ**: การเปลี่ยนแปลงวันส่งหลังจากระบุแล้ว
- **ลิมิต**: 3 ครั้ง (configurable via `maxDeliveryUpdates`)

---

## 🧪 Test Scenarios

### Scenario 1: Happy Path - Normal Sale

1. สร้างใบขาย → PENDING
2. อนุมัติ → APPROVED (สต็อกจอง, ตั้ง orderExpiryDate)
3. ระบุวันส่ง → AWAITING_DELIVERY (ตัดสต็อกจริง)
4. จัดส่ง → DELIVERED
5. เสร็จสิ้น → COMPLETED

### Scenario 2: Order Expires

1. สร้างใบขาย → PENDING
2. อนุมัติ → APPROVED
3. ไม่ระบุวันส่ง 3 วัน
4. Cron ทำงาน → EXPIRED (คืนสต็อก + เครดิต)

### Scenario 3: Overdue from Too Many Updates

1. สร้างใบขาย → อนุมัติ → ระบุวันส่งวันที่ 1
2. เปลี่ยนเป็นวันที่ 2 (count = 1)
3. เปลี่ยนเป็นวันที่ 3 (count = 2)
4. เปลี่ยนเป็นวันที่ 4 (count = 3)
5. พยายามเปลี่ยนอีก → **Error: ครบ 3 ครั้งแล้ว**

### Scenario 4: Exceeds Delivery Date After Max Updates

1. อัปเดตวันส่ง 3 ครั้ง
2. วันส่งที่ระบุผ่านไปแล้วไม่ได้ส่ง
3. Cron ทำงาน → OVERDUE (ล็อค + คืนสต็อก + เครดิต)

---

## 🔧 Configuration

### Environment Variables

```env
# Optional: Secret for cron API protection
CRON_SECRET=your-secret-here
```

### Constants

| Constant             | Default | คำอธิบาย                           |
| -------------------- | ------- | ---------------------------------- |
| `ORDER_EXPIRY_DAYS`  | 3       | จำนวนวันก่อนหมดอายุ                |
| `maxDeliveryUpdates` | 3       | จำนวนครั้งสูงสุดที่อัปเดตวันส่งได้ |
