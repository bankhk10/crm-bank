# Sales Forecast Feature - คู่มือการใช้งาน

## ภาพรวม
ฟีเจอร์ Sales Forecast (การพยากรณ์การขาย) ช่วยให้พนักงานขายสามารถสร้างและจัดการแผนการขายประจำปีได้ โดยสามารถระบุรายละเอียดการขายในแต่ละเดือน รวมถึงสินค้า ลูกค้า และยอดขายที่คาดการณ์

## โครงสร้างระบบ

### 1. Database Schema (Prisma)

#### SalesForecast Model
- `id`: รหัสอ้างอิง
- `year`: ปีที่ทำการพยากรณ์
- `employeeId`: รหัสพนักงานที่สร้างการพยากรณ์
- `status`: สถานะ (DRAFT, SUBMITTED, APPROVED, REJECTED)
- `totalAmount`: ยอดรวมทั้งหมด
- `notes`: หมายเหตุ
- `submittedAt`: วันที่ส่ง
- `approvedBy`: ผู้อนุมัติ
- `approvedAt`: วันที่อนุมัติ
- `rejectionReason`: เหตุผลที่ปฏิเสธ

#### SalesForecastMonthlyDetail Model
- `id`: รหัสอ้างอิง
- `forecastId`: รหัสการพยากรณ์
- `month`: เดือน (1-12)
- `productId`: รหัสสินค้า
- `customerId`: รหัสลูกค้า
- `quantity`: จำนวน
- `unitPrice`: ราคาต่อหน่วย
- `totalAmount`: ยอดรวม
- `notes`: หมายเหตุ

**Unique Constraint**: ไม่สามารถมีรายการซ้ำสำหรับ forecast, month, product, และ customer เดียวกัน

### 2. API Endpoints

#### GET /api/sales-forecasts
ดึงรายการ Sales Forecast ทั้งหมด
- Query Parameters:
  - `year`: กรองตามปี
  - `employeeId`: กรองตามพนักงาน
  - `status`: กรองตามสถานะ
  - `page`: หน้า
  - `limit`: จำนวนรายการต่อหน้า

#### POST /api/sales-forecasts
สร้าง Sales Forecast ใหม่
- Body:
  ```json
  {
    "year": 2024,
    "employeeId": "employee-id",
    "notes": "หมายเหตุ",
    "monthlyDetails": [
      {
        "month": 1,
        "productId": "product-id",
        "customerId": "customer-id",
        "quantity": 100,
        "unitPrice": 500,
        "notes": "หมายเหตุรายการ"
      }
    ]
  }
  ```

#### GET /api/sales-forecasts/[id]
ดึงข้อมูล Sales Forecast ตาม ID

#### PATCH /api/sales-forecasts/[id]
อัพเดท Sales Forecast
- สามารถอัพเดทได้เฉพาะเมื่อสถานะเป็น DRAFT
- Body: เหมือนกับ POST แต่ fields เป็น optional

#### DELETE /api/sales-forecasts/[id]
ลบ Sales Forecast (Soft Delete)

#### GET /api/sales-forecasts/[id]/summary
ดึงสรุปข้อมูล Sales Forecast
- สรุปยอดรวมแต่ละเดือน
- สรุปตามสินค้า
- สรุปตามลูกค้า

### 3. หน้าจอ (Pages)

#### `/sales-forecasts`
- แสดงรายการ Sales Forecast ทั้งหมด
- กรองตามปี และสถานะ
- ดู, แก้ไข, ลบ Forecast (เฉพาะสถานะ DRAFT)

#### `/sales-forecasts/new`
- สร้าง Sales Forecast ใหม่
- เลือกปี, พนักงาน
- เพิ่มรายละเอียดการขายรายเดือน

#### `/sales-forecasts/[id]`
- ดูรายละเอียด Sales Forecast
- แสดงข้อมูลแยกตามเดือน
- แสดงสถานะและข้อมูลการอนุมัติ

### 4. Components

#### `sales-forecast-form.tsx`
Form สำหรับสร้าง/แก้ไข Sales Forecast
- รองรับการเพิ่ม/ลบรายการรายเดือน
- คำนวณยอดรวมอัตโนมัติ
- Validation ด้วย Zod schema

#### `columns.tsx`
Column definitions สำหรับ DataTable
- แสดงข้อมูลสำคัญ
- สถานะแสดงเป็น Badge สีต่างกัน
- Actions (ดู, แก้ไข, ลบ)

## การติดตั้งและใช้งาน

### 1. Database Migration
```bash
# Generate Prisma Client
pnpm prisma generate

# Run migration
pnpm prisma migrate dev --name add_sales_forecast_tables
```

### 2. การเพิ่มเมนูในระบบ
เพิ่มลิงก์ไปยัง `/sales-forecasts` ในเมนูหลักของระบบ

### 3. การกำหนดสิทธิ์ (RBAC)
ควรสร้าง Permissions สำหรับ:
- `sales-forecast:view` - ดูการพยากรณ์
- `sales-forecast:create` - สร้างการพยากรณ์
- `sales-forecast:edit` - แก้ไขการพยากรณ์
- `sales-forecast:delete` - ลบการพยากรณ์
- `sales-forecast:approve` - อนุมัติการพยากรณ์

## วิธีการใช้งาน

### สร้าง Sales Forecast ใหม่
1. ไปที่หน้า Sales Forecasts
2. คลิก "สร้างการพยากรณ์ใหม่"
3. เลือกปี และพนักงาน
4. คลิก "เพิ่มรายการ" เพื่อเพิ่มรายละเอียดการขายรายเดือน
5. กรอกข้อมูล: เดือน, สินค้า, ลูกค้า, จำนวน, ราคาต่อหน่วย
6. ระบบจะคำนวณยอดรวมอัตโนมัติ
7. คลิก "บันทึก"

### แก้ไข Sales Forecast
1. สามารถแก้ไขได้เฉพาะเมื่อสถานะเป็น "ร่าง" (DRAFT)
2. คลิกปุ่มแก้ไขในรายการ
3. ทำการแก้ไขข้อมูล
4. บันทึก

### ส่งการพยากรณ์เพื่ออนุมัติ
1. อัพเดทสถานะเป็น "SUBMITTED" ผ่าน PATCH API
2. ระบบจะบันทึก `submittedAt`

### อนุมัติ/ปฏิเสธการพยากรณ์
1. ผู้มีสิทธิ์อนุมัติ PATCH สถานะเป็น "APPROVED" หรือ "REJECTED"
2. กรณีปฏิเสธ ให้ระบุ `rejectionReason`

## ฟีเจอร์เพิ่มเติมที่แนะนำ

### 1. Dashboard สรุปผล
- สรุปยอดพยากรณ์ทั้งปี
- เปรียบเทียบกับยอดขายจริง
- กราฟแสดงแนวโน้ม

### 2. Export/Import
- Export เป็น Excel
- Import จาก Excel Template

### 3. Notification
- แจ้งเตือนเมื่อมีการส่งพยากรณ์
- แจ้งเตือนผลการอนุมัติ

### 4. History Tracking
- บันทึกประวัติการแก้ไข
- เปรียบเทียบเวอร์ชันต่างๆ

### 5. Analytics
- วิเคราะห์ความแม่นยำของการพยากรณ์
- ติดตามผลการบรรลุเป้าหมาย

## ข้อควรระวัง

1. **Unique Constraint**: ไม่สามารถมีรายการซ้ำสำหรับ forecast, month, product, customer เดียวกัน
2. **Data Validation**: ตรวจสอบข้อมูลก่อนบันทึก
3. **Permission Check**: ตรวจสอบสิทธิ์ก่อนอนุมัติ/แก้ไข
4. **Decimal Handling**: ใช้ Prisma Decimal สำหรับการคำนวณยอดเงิน

## ไฟล์ที่สร้าง

### Schema & Types
- `prisma/schema.prisma` - เพิ่ม SalesForecast และ SalesForecastMonthlyDetail models
- `types/sales-forecast.ts` - Type definitions

### API Routes
- `app/api/sales-forecasts/route.ts` - GET, POST
- `app/api/sales-forecasts/[id]/route.ts` - GET, PATCH, DELETE
- `app/api/sales-forecasts/[id]/summary/route.ts` - GET summary

### Components
- `components/features/sales-forecasts/columns.tsx` - DataTable columns
- `components/features/sales-forecasts/sales-forecast-form.tsx` - Form component

### Pages
- `app/(main)/sales-forecasts/page.tsx` - List page
- `app/(main)/sales-forecasts/new/page.tsx` - Create page
- `app/(main)/sales-forecasts/[id]/page.tsx` - Detail page

## สรุป

ระบบ Sales Forecast ที่สร้างขึ้นนี้ครอบคลุม:
✅ Database schema ที่สมบูรณ์
✅ API endpoints ครบถ้วน
✅ UI components ที่ใช้งานง่าย
✅ Form validation
✅ Status management (DRAFT → SUBMITTED → APPROVED/REJECTED)
✅ Monthly detail management
✅ Auto calculation

พร้อมสำหรับการพัฒนาต่อยอดและปรับแต่งตามความต้องการของธุรกิจ
