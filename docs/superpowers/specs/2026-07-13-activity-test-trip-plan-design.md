# Spec: รายงานแผนการออกปฏิบัติงาน (Trip Plan) - เมนูทดสอบกิจกรรม

การออกแบบหน้าจอและระบบรายงานสำหรับ "รายงานแผนการออกปฏิบัติงาน (Trip Plan)" ภายใต้เมนูใหม่ชื่อ "ทดสอบกิจกรรม" โดยใช้ข้อมูลจำลอง (Mockup Data) และระบบจัดการสิทธิ์การเข้าถึง (RBAC) ของโครงการ

---

## 1. จุดประสงค์ (Goal & Requirements)

สร้างหน้าจอรายงานและระบบวิเคราะห์ผลแผนการปฏิบัติงาน (Trip Plan) เพื่อแสดงผลแดชบอร์ดสรุปกิจกรรม, การวิเคราะห์ในมิติต่าง ๆ และตารางแสดงข้อมูลดิบ โดยมีส่วนประกอบหลักดังนี้:
1. **เมนูนำทาง (Sidebar Nav)**: เพิ่มเมนูหลัก "ทดสอบกิจกรรม" และเมนูย่อย "รายงานแผนการออกปฏิบัติงาน (Trip Plan)"
2. **ระบบจัดการสิทธิ์ (RBAC)**: กำหนดสิทธิ์ `menu.test_activity` และ `menu.test_activity.trip_plan`
3. **ตัวกรองข้อมูล (Filters)**: ช่วงวันที่, ประเภทงาน, สถานะ, ผู้รับผิดชอบ, ผู้อนุมัติ, จังหวัด, อำเภอ, ประเภทเป้าหมาย, ประเภทงบประมาณ
4. **สรุปผลราย KPI (KPI Summary Cards)**: จำนวนแผนทั้งหมด, รออนุมัติ, อนุมัติแล้ว, ไม้อนุมัติ, ยกเลิก, เสร็จสิ้น, งบประมาณรวม
5. **การวิเคราะห์ทางสถิติ (Analytics Charts & Tables)**:
   - ประเภทงาน (Chart)
   - พนักงาน (Table)
   - ประเภทงบประมาณ (Chart)
   - ประเภทเป้าหมาย (Chart)
   - พื้นที่ (Table)
6. **ตารางรายละเอียด (Report Table)**: ตารางแสดงข้อมูลของ Trip Plan ทั้งหมดตามที่ฟิลเตอร์กรองไว้

---

## 2. โครงสร้างระบบสิทธิ์ (RBAC Permission Schema)

### Permission Keys ที่กำหนดใหม่
* `menu.test_activity`: สำหรับเมนูหลัก "ทดสอบกิจกรรม"
* `menu.test_activity.trip_plan`: สำหรับหน้าย่อย "รายงานแผนการออกปฏิบัติงาน (Trip Plan)"

### การเพิ่มข้อมูลใน Seed (`prisma/seed/rbac.ts`)
```typescript
testActivity: {
  menu: {
    key: "menu.test_activity",
    name: "เมนูทดสอบกิจกรรม",
    resource: "test_activity",
    menuPath: "/test-activity",
  },
  subMenus: [
    {
      key: "menu.test_activity.trip_plan",
      name: "รายงานแผนการออกปฏิบัติงาน (Trip Plan)",
      resource: "test_activity",
      menuPath: "/test-activity/trip-plan",
    },
  ],
}
```

และกำหนดให้สิทธิ์เหล่านี้ให้กับ Role ในไฟล์:
* `adminConfig` (Admin)
* `salesManagerConfig` (ผู้จัดการฝ่ายขาย)
* `ceoConfig` (ผู้บริหาร)
* `salesRepConfig` (พนักงานฝ่ายขาย)
* `salesAdminConfig` (ธุรการขาย)
*(หมายเหตุ: Administrator ได้รับสิทธิ์ทั้งหมดโดยอัตโนมัติจากกระบวนการ flatten)*

---

## 3. โครงสร้างไฟล์ (File Structure)

```text
d:\code\crm-bank\
├── app/
│   └── (main)/
│       └── test-activity/
│           └── trip-plan/
│               └── page.tsx                 # หน้า Route ของรายงาน Trip Plan
├── modules/
│   ├── test-activity/
│   │   ├── index.ts                         # Export Components
│   │   ├── features/
│   │   │   └── trip-plan-report.tsx         # ส่วนแสดงผล UI หน้าจอรายงานทั้งหมด
│   │   └── infrastructure/
│   │       └── mock-data.ts                 # ข้อมูลจำลอง (Mockup Data) ของ Trip Plan
│   └── layout/
│       └── constants.tsx                    # เพิ่มเมนูนำทางใน Sidebar
```

---

## 4. โครงสร้างข้อมูลจำลอง (Mockup Data Schema)

ไฟล์ `modules/test-activity/infrastructure/mock-data.ts` จะมีข้อมูลจำลองของ `TripPlan` ประมาณ 20-30 รายการ:

```typescript
export interface TripPlanMock {
  id: string;              // เลขที่แผน (เช่น TP-2026-001)
  activityDate: string;    // วันที่จัดกิจกรรม (YYYY-MM-DD)
  responsible: string;     // ผู้รับผิดชอบ (ชื่อพนักงาน)
  approver: string;        // ผู้อนุมัติ
  jobType: string;         // ประเภทงาน
  activityName: string;    // ชื่อกิจกรรม
  province: string;        // จังหวัด
  district: string;        // อำเภอ
  targetType: string;      // ประเภทเป้าหมาย
  budgetType: string;      // ประเภทงบประมาณ
  budget: number;          // งบประมาณ (บาท)
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'FINISHED'; // สถานะ
}
```

---

## 5. การแสดงผล UI (User Interface Design)

1. **ส่วนกรองข้อมูล (Filters Section)**:
   - ใช้ `Card` เป็น Container
   - มี Date Inputs สำหรับช่วงวันที่
   - มี `Select` สำหรับฟิลด์ต่าง ๆ
   - ปุ่มล้างตัวกรอง (Clear Filters) เพื่อรีเซ็ตค่าทั้งหมด
2. **การ์ดสรุป KPI (KPI Cards Grid)**:
   - แสดงผลในรูปแบบ Grid 7 คอลัมน์ (หรือปรับตามขนาดหน้าจอ)
   - การ์ดสถานะต่าง ๆ จะใช้สีตามประเภทสถานะ:
     - แผนทั้งหมด: สีน้ำเงินเข้ม
     - รออนุมัติ: สีเหลือง/ส้ม (Yellow)
     - ออนุมัติแล้ว: สีเขียว (Green)
     - ไม้อนุมัติ: สีแดง (Red)
     - ยกเลิก: สีเทา (Gray)
     - เสร็จสิ้น: สีฟ้า (Sky Blue)
     - งบประมาณรวม: สีม่วง (Indigo)
3. **การวิเคราะห์ทางสถิติ (Analytics Dashboard)**:
   - แสดงแผนภูมิแท่ง (Bar Chart) และแผนภูมิวงกลม (Pie Chart) ด้วยไลบรารี `recharts`
   - ตารางสรุปข้อมูลตามพนักงานและจังหวัด
4. **ตารางแสดงข้อมูลดิบ (Report Table)**:
   - ตารางแสดงผลที่รองรับการแบ่งหน้า (Pagination)

---

## 6. แผนการตรวจสอบ (Verification Plan)

### การทำงานระบบ
1. ตรวจสอบหน้า Sidebar ว่ามีเมนู "ทดสอบกิจกรรม" -> "รายงานแผนการออกปฏิบัติงาน (Trip Plan)" แสดงขึ้นมาหลังจากการ Seed ข้อมูลสิทธิ์
2. ตรวจสอบการจำกัดสิทธิ์ (Permission Gates) ลองใช้บัญชีที่ไม่มีสิทธิ์เพื่อเข้าตรงผ่าน URL `/test-activity/trip-plan` จะต้องขึ้นหน้า "Access Denied"
3. ทดลองใช้ตัวกรองต่าง ๆ (เช่น กรองเฉพาะจังหวัดเชียงใหม่ หรือ สถานะเสร็จสิ้น) ว่าตัวเลข KPI, แผนภูมิ และตารางเปลี่ยนแปลงอย่างถูกต้องและสอดคล้องกันหรือไม่

### คำสั่งสำหรับ Seed
* `pnpm seed`
