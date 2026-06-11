---
description: แนวทางการสร้างหรือ Refactor ฟอร์มที่มีความซับซ้อนและมีหลายประเภท (เช่น ลูกค้าหลายประเภท) ให้อยู่ในรูปแบบ Centralized Form (FormProvider)
---

# Centralized Form Architecture (Customer Form Pattern)

Workflow นี้อธิบายโครงสร้างและวิธีการสร้างฟอร์มที่มีความซับซ้อนสูง (Complex Forms) หรือมีหลายรูปแบบย่อย (Polymorphic Forms) โดยใช้รูปแบบเดียวกับ `modules/customers` 

## ปัญหาที่แก้ไข
- ฟอร์มที่มีข้อมูลซ้ำซ้อนเยอะมากในหลายหน้า (เช่น FormDealer, FormFarmer)
- การสืบทอด Props ลึกเกินไป (Prop Drilling)
- State บวมจากการใช้ `useState` ในหลายจุด

## โครงสร้างเป้าหมาย (Target Structure)

```text
modules/[MODULE_NAME]/features/form/
 ┣ [MODULE]-new-view.tsx        (Page View สำหรับสร้าง)
 ┣ [MODULE]-edit-view.tsx       (Page View สำหรับแก้ไข)
 ┣ [MODULE]Form.tsx             (Container หลักรวบศูนย์ - ตั้งค่า RHF)
 ┣ config/
 ┃ ┣ default-values.ts          (ค่าเริ่มต้นฟอร์ม)
 ┃ ┗ [module]-config.ts         (พวก options ต่างๆ)
 ┣ sections/                    (UI กลางที่ใช้ร่วมกันทุกประเภท)
 ┃ ┣ BasicInfoSection.tsx
 ┃ ┣ AddressSection.tsx
 ┃ ┗ SpecificSection.tsx        (Router สำหรับเลือก render Specific Fields)
 ┗ specific/                    (UI เฉพาะทางของแต่ละประเภท)
   ┣ TypeAFields.tsx
   ┗ TypeBFields.tsx
```

## กฎและหลักการสำคัญ (Core Principles)

### 1. Single Form Container (`[MODULE]Form.tsx`)
- ให้มีตัวหุ้มฟอร์มเพียงตัวเดียวเท่านั้น ห้ามสร้างฟอร์มแยกสำหรับแต่ละประเภทย่อย (เช่น ห้ามมี `FormA`, `FormB` 분리กันตั้งแต่ระดับบนสุด)
- ตั้งค่า `useForm` จาก `react-hook-form` และ `zodResolver` ที่นี่ที่เดียว
- ครอบทุก Component ลูกด้วย `<FormProvider {...methods}>`
- ฟอร์มเป็นคนจัดการ Side-effects อย่างการอัปโหลดรูปภาพ 

### 2. State Management & Prop Drilling
- ห้ามส่ง `form` ข้าม Component ผ่าน Props ลึกๆ
- Component ลูก (Sections) ทั้งหมดต้องดึง State ฟอร์มผ่าน `useFormContext()` หรือใช้ `<Controller>`

### 3. Separation of Sections (แยกส่วน UI)
- **`sections/`**: แกะส่วนข้อมูลพื้นฐานที่ใช้ร่วมกัน เช่น ชื่อ ที่อยู่ เบอร์โทร ออกมาเป็น Component อิสระ
- **`specific/`**: ส่วนที่ฟิลด์ข้อมูลต่างกันอย่างสิ้นเชิงตามประเภท ให้แยกเป็นไฟล์ของประเภทนั้นๆ 

### 4. Dynamic Routing (`SpecificSection.tsx`)
- ใช้ Component ทำหน้าที่เป็น Switch/Router เพื่อเช็คเงื่อนไข (เช่น `type === 'A'`) แล้ว Render component จากโฟลเดอร์ `specific/` ให้ถูกต้องตามประเภท

### 5. Application Layer Mapping (`customer-mapper.ts`)
- UI State ที่ได้จาก `react-hook-form` อาจจะไม่ตรงกับโครงสร้างที่ Database ต้องการ
- **ต้องสร้าง Mapper** (เช่น `customer-mapper.ts` ในโฟลเดอร์ `application/`) เพื่อแปลง UI Form Data ไปเป็น API Payload เสมอ

## ขั้นตอนทำงาน (Step-by-Step Refactoring)

### Step 1: วิเคราะห์และรวม Schema
- นำ Validation ทั้งหมดมารวมกันเป็น Base Schema (`validations.ts`)
- ใช้ `z.discriminatedUnion` หรือ `superRefine` ใน Zod สำหรับ Validation ข้ามฟิลด์ที่ขึ้นอยู่กับประเภท

### Step 2: สร้าง Default Values และ Config
- แยก `defaultValues` ไปไว้ในโฟลเดอร์ `config/` เพื่อไม่ให้ไฟล์ Form หลักรก

### Step 3: แตกส่วน UI เป็น Sections
- ทยอยดึง HTML Input เดิมที่ซ้ำซ้อนกันออกมาสร้างเป็น Section Components ย่อยๆ พร้อมปรับให้ใช้ `useFormContext`

### Step 4: สร้าง Container (FormProvider)
- สร้างไฟล์ Container หลัก (`CustomerForm.tsx`)
- ประกอบ Sections ต่างๆ เข้าด้วยกัน

### Step 5: สร้าง Mapper และแก้ Use Case
- เขียน Mapper function เพื่อแปลงข้อมูลให้อยู่ในรูปแบบที่พร้อมบันทึก
- อัปเดต `create-xxx.ts` และ `update-xxx.ts` ให้เรียกใช้งาน Mapper

### Step 6: ทดสอบและลบของเก่า
- สลับหน้า New/Edit View มาใช้งาน Container ตัวใหม่
- เทสการ Submit ข้อมูลแบบ End-to-End
- ลบไฟล์ฟอร์มแบบเก่าทิ้งทั้งหมด
