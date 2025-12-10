# Flow การลบวงเงินชั่วคราวออกจากวงเงินเครดิตคงเหลือหลังหมดอายุ (Real-time)

## ภาพรวม

ระบบนี้จะตรวจสอบและลบวงเงินชั่วคราว (Temporary Credit Limit) ที่หมดอายุออกจากวงเงินเครดิตคงเหลือ (Available Credit) โดยอัตโนมัติแบบ real-time

## การทำงาน

### 1. เมื่อ Approve วงเงินชั่วคราว

เมื่อมีการ approve วงเงินชั่วคราว ระบบจะ:

1. เพิ่มวงเงินเข้าไปใน `CreditLimit` (limitAmount และ availableAmount)
2. บันทึกข้อมูลการติดตาม:
   - `temporaryCreditAmount`: จำนวนเงินที่เพิ่มเข้าไป
   - `temporaryCreditExpiryDate`: วันหมดอายุ
3. บันทึก `appliedToCreditLimitId` ใน `TemporaryCreditLimit` เพื่อเชื่อมโยงกับ CreditLimit

### 2. Background Service (Auto-run ทุก 5 นาที)

ระบบมี background service ที่จะทำงานอัตโนมัติทุก 5 นาที:

- **Service**: `TemporaryCreditExpiryService`
- **Location**: `lib/services/temporary-credit-expiry.service.ts`
- **เริ่มต้นอัตโนมัติ**: เมื่อ server start ผ่าน `instrumentation.ts`

**การทำงาน:**
1. ค้นหา `TemporaryCreditLimit` ที่:
   - `status = APPROVED`
   - `isReverted = false`
   - `expiryDate < ปัจจุบัน` (หมดอายุแล้ว)
   - `appliedToCreditLimitId != null`

2. สำหรับแต่ละรายการที่พบ:
   - ลดวงเงินใน `CreditLimit` (limitAmount และ availableAmount)
   - ตั้งค่า `temporaryCreditAmount = 0` และ `temporaryCreditExpiryDate = null`
   - อัพเดท `isReverted = true` และ `revertedAt = ปัจจุบัน`
   - เพิ่ม note ใน CreditLimit

3. ตรวจสอบว่า availableAmount ไม่ติดลบ (ถ้าติดลบจะไม่ revert และ log warning)

### 3. API Endpoints

#### 3.1 ดูรายการวงเงินที่หมดอายุ
```
GET /api/temporary-credit-limits/expire
```

**Response:**
```json
{
  "count": 2,
  "expiredCredits": [
    {
      "id": "xxx",
      "customerId": "xxx",
      "requestedAmount": 50000,
      "expiryDate": "2025-12-01T00:00:00.000Z",
      "status": "APPROVED",
      "isReverted": false,
      "appliedToCreditLimitId": "xxx",
      "customer": {
        "id": "xxx",
        "name": "ลูกค้า A",
        "customerCode": "C001"
      }
    }
  ]
}
```

#### 3.2 ลบวงเงินที่หมดอายุทันที (Manual)
```
POST /api/temporary-credit-limits/expire
```

**Response:**
```json
{
  "message": "Processed 2 expired temporary credits",
  "processed": 2,
  "success": 2,
  "failed": 0,
  "results": [
    {
      "success": true,
      "temporaryCreditId": "xxx",
      "customerId": "xxx",
      "customerName": "ลูกค้า A",
      "customerCode": "C001",
      "revertedAmount": "50000",
      "expiryDate": "2025-12-01T00:00:00.000Z",
      "creditLimitId": "xxx",
      "newLimitAmount": "100000",
      "newAvailableAmount": "80000"
    }
  ]
}
```

#### 3.3 Trigger การตรวจสอบทันที
```
POST /api/temporary-credit-limits/expire/trigger
```

**Response:**
```json
{
  "message": "Expiry process triggered successfully",
  "triggeredBy": "Admin User",
  "triggeredAt": "2025-12-10T10:00:00.000Z"
}
```

## Database Schema Changes

### CreditLimit
เพิ่มฟิลด์:
- `temporaryCreditAmount`: Decimal (จำนวนเงินชั่วคราวที่เพิ่มเข้าไป)
- `temporaryCreditExpiryDate`: DateTime (วันหมดอายุของวงเงินชั่วคราว)

### TemporaryCreditLimit
เพิ่มฟิลด์:
- `appliedToCreditLimitId`: String (ID ของ CreditLimit ที่ถูกเพิ่มวงเงินเข้าไป)
- `isReverted`: Boolean (สถานะว่าถูก revert แล้วหรือยัง)
- `revertedAt`: DateTime (วันเวลาที่ revert)

## การทดสอบ

### 1. ทดสอบการ Approve และ Auto-Revert

```bash
# 1. สร้าง temporary credit ที่หมดอายุในอดีต
# ผ่าน UI หรือ API

# 2. Approve temporary credit

# 3. รอ 5 นาที หรือ trigger ด้วยตนเอง:
curl -X POST http://localhost:3000/api/temporary-credit-limits/expire/trigger

# 4. ตรวจสอบผลลัพธ์
curl http://localhost:3000/api/temporary-credit-limits/expire
```

### 2. ทดสอบ Manual Trigger

```bash
# ดูรายการที่หมดอายุ
curl http://localhost:3000/api/temporary-credit-limits/expire

# ลบวงเงินที่หมดอายุทันที
curl -X POST http://localhost:3000/api/temporary-credit-limits/expire
```

## Logs

Background service จะ log ข้อมูลดังนี้:

```
[2025-12-10T10:00:00.000Z] Processing expired temporary credits...
Found 2 expired temporary credits to process
✓ Reverted temporary credit xxx for customer C001 (ลูกค้า A): -50000
✓ Reverted temporary credit yyy for customer C002 (ลูกค้า B): -30000
[2025-12-10T10:00:01.234Z] Completed processing expired temporary credits in 1234ms
  Success: 2, Failed: 0
```

## การตั้งค่า Interval

ปัจจุบันตั้งให้รันทุก 5 นาที สามารถแก้ไขได้ที่:

**File**: `lib/services/temporary-credit-expiry.service.ts`

```typescript
// เปลี่ยนจาก 5 นาที เป็น 1 นาที
private readonly INTERVAL_MS = 1 * 60 * 1000;

// หรือ 10 นาที
private readonly INTERVAL_MS = 10 * 60 * 1000;
```

## สถานะและการจัดการ Error

### กรณีที่ไม่สามารถ Revert ได้

1. **availableAmount ติดลบ**: 
   - ระบบจะไม่ revert และ log warning
   - ต้องตรวจสอบและแก้ไขด้วยตนเอง

2. **CreditLimit ถูกลบ**:
   - ระบบจะ skip และ log error
   - TemporaryCreditLimit จะยังคงเป็น `isReverted = false`

3. **Database Error**:
   - Transaction จะ rollback
   - ระบบจะลองใหม่ในรอบถัดไป (5 นาทีถัดไป)

## Permission

API endpoints ต้องการ permission:
- `temporary_creditlimit.approve` (สำหรับ trigger endpoint)
- Access ถึง `/api/temporary-credit-limits` (สำหรับ GET และ POST expire)

## คำสั่ง Prisma

```bash
# Push schema changes
npx prisma db push

# Seed database
npm run seed

# Generate Prisma Client (ถ้าจำเป็น)
npx prisma generate
```

## ไฟล์ที่เกี่ยวข้อง

1. **Schema**: `prisma/schema.prisma`
2. **Approval Logic**: `app/api/temporary-credit-limits/[temporaryCreditLimitId]/approve/route.ts`
3. **Expire API**: `app/api/temporary-credit-limits/expire/route.ts`
4. **Trigger API**: `app/api/temporary-credit-limits/expire/trigger/route.ts`
5. **Background Service**: `lib/services/temporary-credit-expiry.service.ts`
6. **Service Initialization**: `lib/init-services.ts`
7. **Instrumentation**: `instrumentation.ts`
8. **Next.js Config**: `next.config.ts`
