# ขั้นตอนการติดตั้งและใช้งาน Sales Forecast

## 1. รัน Database Migration

เนื่องจากมีการเพิ่ม tables ใหม่ใน schema ต้องทำการ migrate database:

```bash
# ตรวจสอบสถานะ migration
pnpm prisma migrate status

# สร้าง migration ใหม่
pnpm prisma migrate dev --name add_sales_forecast_tables

# หรือถ้าต้องการ reset database (ใช้เฉพาะ development)
# pnpm prisma migrate reset
```

## 2. ตรวจสอบว่า Prisma Client ถูก Generate แล้ว

```bash
pnpm prisma generate
```

## 3. เพิ่มเมนู Sales Forecast ในระบบ

เพิ่มลิงก์ในเมนูหลัก เช่น:

```tsx
// ใน layout หรือ navigation component
<NavItem href="/sales-forecasts" icon={TrendingUp}>
  การพยากรณ์การขาย
</NavItem>
```

## 4. กำหนดสิทธิ์การใช้งาน (RBAC)

สร้าง Permissions ใหม่ในระบบ:

```sql
-- ตัวอย่าง SQL สำหรับสร้าง permissions
INSERT INTO "Permission" (id, key, name, description, category) VALUES
  ('perm-forecast-view', 'sales-forecast:view', 'ดูการพยากรณ์การขาย', 'สามารถดูรายการการพยากรณ์การขาย', 'MENU'),
  ('perm-forecast-create', 'sales-forecast:create', 'สร้างการพยากรณ์การขาย', 'สามารถสร้างการพยากรณ์การขายใหม่', 'ACTION'),
  ('perm-forecast-edit', 'sales-forecast:edit', 'แก้ไขการพยากรณ์การขาย', 'สามารถแก้ไขการพยากรณ์การขาย', 'ACTION'),
  ('perm-forecast-delete', 'sales-forecast:delete', 'ลบการพยากรณ์การขาย', 'สามารถลบการพยากรณ์การขาย', 'ACTION'),
  ('perm-forecast-approve', 'sales-forecast:approve', 'อนุมัติการพยากรณ์การขาย', 'สามารถอนุมัติหรือปฏิเสธการพยากรณ์การขาย', 'ACTION');
```

หรือสร้างผ่าน UI ของระบบ RBAC

## 5. เพิ่ม Permission Guards ใน API

อัพเดท API routes เพื่อตรวจสอบสิทธิ์:

```typescript
// ตัวอย่างใน route.ts
import { checkPermission } from "@/lib/rbac";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ตรวจสอบสิทธิ์
  if (!checkPermission(session.user, "sales-forecast:view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ... rest of code
}
```

## 6. ทดสอบการทำงาน

### 6.1 ทดสอบสร้าง Sales Forecast
1. เข้าสู่หน้า `/sales-forecasts`
2. คลิก "สร้างการพยากรณ์ใหม่"
3. กรอกข้อมูล:
   - เลือกปี
   - เลือกพนักงาน
   - เพิ่มรายละเอียดการขายรายเดือน
4. บันทึก

### 6.2 ทดสอบดูรายละเอียด
1. คลิกที่รายการที่สร้างไว้
2. ตรวจสอบข้อมูลที่แสดง

### 6.3 ทดสอบแก้ไข (เฉพาะสถานะ DRAFT)
1. คลิกปุ่มแก้ไข
2. แก้ไขข้อมูล
3. บันทึก

### 6.4 ทดสอบลบ
1. คลิกปุ่มลบในรายการที่สถานะ DRAFT
2. ยืนยันการลบ

## 7. ฟีเจอร์เพิ่มเติมที่แนะนำ

### 7.1 เพิ่มฟังก์ชันส่งเพื่ออนุมัติ
สร้างปุ่มใน detail page สำหรับเปลี่ยนสถานะเป็น SUBMITTED:

```typescript
const handleSubmit = async () => {
  await fetch(`/api/sales-forecasts/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "SUBMITTED" }),
  });
};
```

### 7.2 เพิ่มฟังก์ชันอนุมัติ/ปฏิเสธ
สร้างปุ่มสำหรับผู้มีสิทธิ์อนุมัติ:

```typescript
const handleApprove = async () => {
  await fetch(`/api/sales-forecasts/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "APPROVED" }),
  });
};

const handleReject = async (reason: string) => {
  await fetch(`/api/sales-forecasts/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      status: "REJECTED",
      rejectionReason: reason 
    }),
  });
};
```

### 7.3 สร้าง Dashboard
สร้างหน้า dashboard แสดงสรุปข้อมูล:
- ยอดพยากรณ์ทั้งปี
- เปรียบเทียบกับยอดขายจริง
- กราฟแสดงแนวโน้ม

### 7.4 Export เป็น Excel
เพิ่มฟังก์ชัน export ข้อมูลเป็นไฟล์ Excel

### 7.5 Notification
- แจ้งเตือนเมื่อมีการส่งพยากรณ์ใหม่
- แจ้งเตือนผลการอนุมัติ

## 8. Troubleshooting

### ปัญหา: Cannot find module '@prisma/client'
**แก้ไข:** รัน `pnpm install` และ `pnpm prisma generate`

### ปัญหา: Prisma migration failed
**แก้ไข:** 
- ตรวจสอบ DATABASE_URL ใน .env
- ตรวจสอบ connection กับ database
- ลอง `pnpm prisma migrate reset` (development only)

### ปัญหา: Type errors ใน TypeScript
**แก้ไข:** รัน `pnpm prisma generate` ใหม่เพื่ออัพเดท types

### ปัญหา: Unauthorized error
**แก้ไข:** 
- ตรวจสอบว่า login แล้ว
- ตรวจสอบว่ามี permissions ที่จำเป็น

## 9. การบำรุงรักษา

### การ Backup ข้อมูล
```bash
# Backup database
pg_dump -U username -d database_name > backup.sql

# Restore database
psql -U username -d database_name < backup.sql
```

### การตรวจสอบข้อมูล
```sql
-- ตรวจสอบจำนวน forecasts
SELECT COUNT(*) FROM "SalesForecast";

-- ตรวจสอบสถานะ
SELECT status, COUNT(*) 
FROM "SalesForecast" 
GROUP BY status;

-- ตรวจสอบยอดรวม
SELECT 
  year,
  SUM("totalAmount") as total
FROM "SalesForecast"
WHERE status = 'APPROVED'
GROUP BY year;
```

## 10. เอกสารเพิ่มเติม

- [SALES_FORECAST_GUIDE.md](./SALES_FORECAST_GUIDE.md) - คู่มือการใช้งานฉบับสมบูรณ์
- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js Documentation](https://nextjs.org/docs)

## สรุป

ระบบ Sales Forecast พร้อมใช้งานแล้ว! 🎉

ขั้นตอนที่สำคัญ:
1. ✅ Migrate database
2. ✅ Generate Prisma Client
3. ✅ เพิ่มเมนูในระบบ
4. ✅ กำหนดสิทธิ์
5. ✅ ทดสอบการทำงาน

หากมีคำถามหรือพบปัญหา สามารถตรวจสอบได้ที่:
- ไฟล์ SALES_FORECAST_GUIDE.md
- Console logs
- Database logs
