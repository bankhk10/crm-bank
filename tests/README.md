Workflow สำหรับทดสอบ Trip Plan

ขั้นที่ 1 — เปิดเว็บ CRM
ตรวจสอบว่า Next.js ทำงานอยู่ที่ http://localhost:3000 ก่อน

ขั้นที่ 2 — บันทึกขั้นตอนกรอกฟอร์ม
pnpm exec playwright codegen http://localhost:3000

ขั้นที่ 3 — บันทึกโค้ดลงไฟล์
นำโค้ดที่ได้มาปรับใน
tests/activity-plans/Type-.spec.ts
และเพิ่ม await page.pause() ก่อนจุดที่ต้องการหยุดตรวจสอบ

ขั้นที่ 4 — รันทดสอบซ้ำ
pnpm exec playwright test tests/activity-plans/Type-... --headed --workers=1

ใช้ --workers=1 เพื่อให้ทดสอบทีละชุด ลดปัญหาหลาย Browser เปิดพร้อมกัน

ขั้นที่ 5 — ตรวจสอบผล
pnpm exec playwright show-report
