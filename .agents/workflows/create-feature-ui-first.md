---
description: Create a new feature or module using the project's standard architecture with a UI-First (Mock Data) approach.
---

# Create Feature / Module — UI-First Workflow

ใช้ Workflow นี้เมื่อสร้าง **Feature ใหม่** หรือ **Module ใหม่** ในโปรเจกต์

เป้าหมายคือ:

- ใช้ UI-First เพื่อให้ผู้ใช้เห็นและยืนยัน UX/UI ก่อน
- ใช้ Mock Data ก่อนเชื่อม Database
- ปฏิบัติตาม Module Architecture Contract
- Reuse Existing Pattern ก่อนสร้างสิ่งใหม่
- แยก UI, Application, Server และ Infrastructure อย่างถูกต้อง
- ไม่สร้าง Architecture ใหม่โดยไม่จำเป็น
- ตรวจสอบงานก่อนถือว่าเสร็จ

---

# ขั้นตอนการทำงาน

## Step 0: Understand the Requirement

ก่อนเริ่มเขียน Code ให้ AI วิเคราะห์ Requirement ก่อน

ต้องระบุให้ชัดเจน:

- Module หรือ Feature ที่กำลังสร้าง
- เป้าหมายของ Feature
- User Flow
- Screen ที่ต้องมี
- ข้อมูลที่ UI ต้องแสดง
- ข้อมูลที่ User ต้องกรอก
- Action ที่ User สามารถทำได้
- Business Rules ที่ทราบแล้ว
- ขอบเขตของงาน

ห้ามเริ่มสร้าง Database หรือ Backend ทันที หากยังไม่เข้าใจ Requirement และ UI Flow

---

# Step 1: Inspect Existing Project Patterns

ก่อนสร้างไฟล์ใด ๆ MUST ตรวจสอบ Existing Pattern

ให้ตรวจสอบ:

1. `crm-coding-standards` Skill
2. `docs/ARCHITECTURE.md`
3. `docs/MODULE_ARCHITECTURE.md` ถ้ามี
4. โครงสร้างของ Target Module
5. Similar Modules
6. Similar Features
7. Shared Components
8. Existing Hooks
9. Existing Server Actions
10. Existing Application Logic
11. Existing Repository Patterns

ค้นหา implementation ที่มีพฤติกรรมใกล้เคียงกับ Requirement

หลักการ:

> Reuse Existing Pattern First

ห้ามสร้าง Pattern ใหม่ หาก Pattern ที่มีอยู่สามารถรองรับ Requirement ได้

ห้ามเลือก Pattern จากโปรเจกต์อื่นมาใช้เพียงเพราะเป็น Pattern ที่นิยม

หาก Existing Pattern ไม่สามารถรองรับ Requirement ได้ ให้ระบุเหตุผลก่อนสร้าง Pattern ใหม่

---

# Step 2: Define Module Structure

ถ้าเป็นการสร้าง Module ใหม่ ให้ใช้:

`Module Architecture Contract`

เป็นมาตรฐานหลัก

โครงสร้างมาตรฐาน:

```text
modules/<module-name>/
├── application/
├── features/
├── infrastructure/
├── server/
├── types/
├── ui/
├── constants.ts
├── index.ts
└── README.md
```
