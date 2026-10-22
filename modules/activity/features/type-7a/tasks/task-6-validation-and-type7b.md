# Task 6: Validation, TypeScript Check & Type 7B Testing

> **Objective:** ตรวจสอบความถูกต้องของ Validation, ตรวจสอบ TypeScript Zero-error และทดสอบการส่งต่อข้อมูลไปยังโมดูล Type 7B

## 1. การปรับปรุง Validation (`actual-validation.ts`)
- ตรวจสอบเงื่อนไขบังคับ:
  - หากไม่ได้ติ๊กเกษตรกรนอกระบบ: ต้องมี `farmerCustomerId` หรือชื่อเกษตรกร
  - หากติ๊กเกษตรกรนอกระบบ: ต้องระบุชื่อ-สกุล, เบอร์โทรศัพท์ และจังหวัด/ตำบล
  - ข้อมูลพืชประธานห้ามว่าง
  - รายการสินค้าที่ใช้จริงต้องระบุตัวเลขอย่างถูกต้อง

## 2. การตรวจสอบ TypeScript Compile
- รันคำสั่งตรวจสอบ Type ทั้งโปรเจกต์:
  ```bash
  npx tsc --noEmit
  ```
- ต้องไม่มี Error ในโมดูล `modules/activity/features/type-7a/` และ `modules/activity/ui/inputs/`

## 3. การทดสอบการเชื่อมต่อกับ Type 7B
- ตรวจสอบฟังก์ชัน `findMasterDemoPlots()` ใน `modules/activity/infrastructure/demo-plot.repository.ts`:
  - แปลงที่บันทึกจาก Type 7A Actual ต้องแสดงครบทั้งระบบน้ำ, ยาภายนอก, ยาที่ใช้จริง และรูปถ่าย
- ทดสอบเปิดหน้าสร้างแผน Type 7B (`Type7bPlannedForm`):
  - สามารถค้นหาและเลือกแปลงสาธิตที่จัดทำจาก Type 7A ได้
  - แสดงข้อมูลสภาพแปลงตั้งต้นถูกต้อง

## 4. ขั้นตอนการดำเนินการ (Checklist)
- [x] 1. อัปเดต `actual-validation.ts` ให้ตรวจเงื่อนไขเกษตรกร พืชประธาน และวิธีการทดลอง
- [x] 2. รัน `npx tsc --noEmit` ได้ผลลัพธ์ผ่านฉลุย Zero Error
- [x] 3. ทดสอบการเชื่อมต่อ Schema และ Repository รองรับการส่งต่อข้อมูลสู่ Type 7B
- [x] 4. อัปเดต public barrel export ใน `modules/activity/features/type-7a/index.ts`

