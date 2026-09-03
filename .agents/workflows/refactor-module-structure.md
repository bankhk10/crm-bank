---
description: Refactor an existing module to comply with the project's standard Module Architecture Contract while preserving existing behavior.
---

# Refactor Module Structure

ใช้ Workflow นี้เมื่อปรับโครงสร้าง Module ที่มีอยู่แล้ว
ให้เป็นไปตาม **Module Architecture Contract** ของโปรเจกต์

เป้าหมาย:

- ทำให้ทุก Module ใช้ Architecture เดียวกัน
- รักษา Business Logic และ Behavior เดิม
- แยก Layer ให้ถูกต้อง
- ลด Layer Bypass
- Reuse Existing Pattern
- ไม่สร้าง Architecture ใหม่โดยไม่จำเป็น
- ไม่ผูกมาตรฐานกับ Module ใด Module หนึ่ง
- ตรวจสอบผลกระทบก่อนและหลัง Refactor
- ห้ามทำลายการทำงานเดิม

มาตรฐานหลักที่ต้องปฏิบัติตาม:

- `.agents/skills/crm-coding-standards/SKILL.md`
- `docs/ARCHITECTURE.md`
- `docs/MODULE_ARCHITECTURE.md` หากมี

---

# 1. Core Rules

ระหว่างการ Refactor MUST ปฏิบัติตามกฎต่อไปนี้:

1. ห้ามเปลี่ยน Business Behavior โดยไม่จำเป็น
2. ห้ามสร้าง Architecture ใหม่หาก Architecture ปัจจุบันรองรับได้
3. ต้องตรวจสอบ Existing Pattern ก่อนย้ายหรือสร้างไฟล์
4. ต้องรักษา Dependency Direction
5. ต้องไม่สร้าง Layer ใหม่โดยพลการ
6. ต้องไม่แก้ไข Code นอก Scope
7. ต้องตรวจสอบทุก Import ที่ได้รับผลกระทบ
8. ต้องตรวจสอบ Runtime Behavior หลัง Refactor
9. ต้อง Update Documentation เมื่อโครงสร้างเปลี่ยน
10. ต้องทำ Final Validation ก่อนถือว่างานเสร็จ

---

# 2. Target Module Architecture

Module ทุกตัวภายใต้:

```text
modules/<module-name>/
```
