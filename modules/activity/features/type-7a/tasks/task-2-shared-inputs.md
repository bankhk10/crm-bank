# Task 2: Shared UI Input Components

> **Objective:** สร้างคอมโพเนนต์ Input ส่วนกลางสำหรับระบบน้ำและตัวเลือกวันที่ เก็บไว้ที่ `modules/activity/ui/inputs/`

## 1. ไฟล์ที่จะสร้าง

### 1.1 `modules/activity/ui/inputs/activity-irrigation-checkbox.tsx`
- **วัตถุประสงค์:** รองรับการเลือกระบบน้ำได้มากกว่า 1 ข้อ (Checkbox Group)
- **ตัวเลือก 8 รายการ:**
  1. น้ำหยด
  2. สายยาง
  3. สปิงเกอร์
  4. ให้ตามร่อง
  5. ปล่อยท่วม(flooding)
  6. รอน้ำฝน
  7. นาหว่านน้ำตม
  8. นาดำ
- **Interface Props:**
  ```typescript
  export interface ActivityIrrigationCheckboxProps {
    value?: string[];
    onChange?: (values: string[]) => void;
    label?: string;
    labelClassName?: string;
    disabled?: boolean;
    readonly?: boolean;
    error?: string;
    required?: boolean;
    className?: string;
  }
  ```
- **UI Design:** Grid Responsive (2 คอลัมน์บนมือถือ, 4 คอลัมน์บนจอใหญ่) พร้อม Checkbox สไตล์โมเดิร์น

### 1.2 `modules/activity/ui/inputs/activity-date-picker.tsx`
- **วัตถุประสงค์:** คอมโพเนนต์เลือกวันที่มาตรฐานสำหรับฟอร์มในโมดูล Activity
- **Interface Props:**
  ```typescript
  export interface ActivityDatePickerProps {
    id?: string;
    label?: string;
    labelClassName?: string;
    value?: string; // YYYY-MM-DD
    onChange?: (dateStr: string) => void;
    placeholder?: string;
    disabled?: boolean;
    readonly?: boolean;
    required?: boolean;
    error?: string;
    min?: string;
    max?: string;
    className?: string;
  }
  ```
- **UI Design:** มี Label, ช่องแสดงวันที่, ไอคอนปฏิทิน Calendar, ปุ่ม Reset/Clear

### 1.3 `modules/activity/ui/inputs/index.ts`
- ส่งออก `ActivityIrrigationCheckbox` และ `ActivityDatePicker`
- Re-export ต่อไปยัง `modules/activity/ui/index.ts`

## 2. ขั้นตอนการดำเนินการ (Checklist)
- [x] 1. สร้าง `activity-irrigation-checkbox.tsx`
- [x] 2. สร้าง `activity-date-picker.tsx`
- [x] 3. อัปเดต `modules/activity/ui/inputs/index.ts`
- [x] 4. อัปเดต `modules/activity/ui/index.ts` (ผ่าน wildcard export)
- [x] 5. ตรวจสอบ `tsc --noEmit` ผ่าน Zero-error เรียบร้อย

## 3. เกณฑ์การยอมรับ (Acceptance Criteria)
- เลือกและยกเลิกการเลือกระบบน้ำหลายข้อได้ถูกต้อง State ส่งออกเป็น Array of string
- เลือกวันที่และ Clear วันที่ได้ พร้อมแสดงผลลัพธ์ในรูปแบบ `YYYY-MM-DD`
- รองรับ Responsive และใช้งานร่วมกับ Props `readonly` ได้สมบูรณ์

