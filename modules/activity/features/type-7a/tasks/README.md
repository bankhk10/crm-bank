# Type 7A Actual Form Redesign — Task Directory

ไดเรกทอรีรวบรวม Task Specifications สำหรับการปรับปรุงหน้าบันทึกผลจัดทำแปลงสาธิตจริง (Type 7A Actual Form) และการเชื่อมต่อข้อมูลกับ Type 7B

## สารบัญ Task Files

1. [Task 1: Database Schema & Migration](./task-1-database-schema.md)
   - อัปเดต `prisma/schema.prisma` สำหรับ `DemoPlot` และ `DemoPlotProduct`
2. [Task 2: Shared UI Input Components](./task-2-shared-inputs.md)
   - สร้าง `activity-irrigation-checkbox.tsx` (ระบบน้ำ 8 ตัวเลือก)
   - สร้าง `activity-date-picker.tsx` (ตัวเลือกวันที่มาตรฐาน)
3. [Task 3: Type Definitions & State Hook](./task-3-types-and-hook.md)
   - อัปเดต `actual.types.ts` และ `use-type7a-actual.ts`
4. [Task 4: Form UI Redesign](./task-4-actual-form-redesign.md)
   - ออกแบบใหม่ทั้ง 7 Sections ใน `type7a-actual-form.tsx`
5. [Task 5: Repository, Strategy & DB Persistence](./task-5-strategy-repository.md)
   - จัดการบันทึกลง `DemoPlot`, `DemoPlotIrrigation`, `DemoPlotExternalProduct`, `DemoPlotProduct`, `DemoPlotVisit`
6. [Task 6: Validation, TypeScript Check & Type 7B Testing](./task-6-validation-and-type7b.md)
   - ตรวจสอบความถูกต้อง, รัน `tsc --noEmit` และทดสอบการดึงข้อมูลสู่ Type 7B

