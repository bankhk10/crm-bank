# Type 8: จัดประชุม (Meeting)

โครงสร้างสถาปัตยกรรมแบบ **Vertical Slice Architecture** รองรับ **Dual-Mode 100% (Planned + Unplanned)** ตามมาตรฐานของโมดูล Activity

---

## 📁 โครงสร้างโฟลเดอร์ (24 Artifacts)

```
modules/activity/features/type-8/
├── index.ts                                # Vertical Slice Public Contract
├── README.md                               # เอกสารและคู่มือการใช้งาน
├── shared/                                 # ค่าคงที่และประเภทข้อมูลที่ใช้ร่วมกัน
│   ├── constants.ts
│   ├── types.ts
│   └── notes.ts
├── planned/                                # กิจกรรมตามแผน (Planned)
│   ├── types/
│   │   ├── planned.types.ts
│   │   └── actual.types.ts
│   ├── application/
│   │   ├── planned-validation.ts
│   │   ├── planned-mapper.ts
│   │   ├── actual-validation.ts
│   │   └── actual-mapper.ts
│   ├── infrastructure/
│   │   ├── type8.repository.ts
│   │   └── type8-planned.strategy.ts
│   ├── hooks/
│   │   ├── use-type8-planned-form.ts
│   │   └── use-type8-actual.ts
│   └── components/
│       ├── type8-planned-form.tsx
│       ├── type8-plan-card.tsx
│       ├── type8-actual-form.tsx
│       ├── type8-detail-view.tsx
│       └── type8-approval-card.tsx
└── unplanned/                              # กิจกรรมนอกแผน (Unplanned)
    ├── types/
    │   └── unplanned.types.ts
    ├── application/
    │   ├── unplanned-validation.ts
    │   └── unplanned-mapper.ts
    ├── infrastructure/
    │   └── type8-unplanned.strategy.ts
    ├── hooks/
    │   └── use-type8-unplanned-form.ts
    └── components/
        └── type8-unplanned-form.tsx
```

---

## 🚀 คุณสมบัติเด่น (Features & Capabilities)

1. **Dual-Mode 100% (Planned & Unplanned):**
   - **Planned:** วางแผนจัดประชุมล่วงหน้า ระบุกลุ่มเป้าหมาย (เกษตรกร Farmer, ผู้แทนจำหน่าย Dealer, หรือร้านค้ารายย่อย Subdealer), รายการโปรโมชัน, สินค้าเป้าหมาย และสถานที่จัดงาน
   - **Actual:** บันทึกผลการจัดประชุมจริง ยอดขายสินค้าเป้าหมาย (ตามแผน) และสินค้านอกแผน พร้อมข้อเสนอแนะ/Q&A, แนบรูปใบลงทะเบียนผู้เข้าร่วมงาน (จำเป็นอย่างน้อย 1 รูป) และรูปถ่ายบรรยากาศการประชุม
   - **Unplanned:** บันทึกการจัดประชุมนอกแผนแบบ 2-in-1 ในขั้นตอนเดียว ทั้งรายละเอียดการประชุม โปรโมชัน ยอดขายสินค้า และรูปภาพหลักฐาน
2. **Unified Activity UI Standard:**
   - ใช้ Activity UI inputs จาก `@/modules/activity/ui` ทั้งหมด (`ActivityInput`, `ActivityTextarea`, `ActivityProductSelect`, `ActivityCustomerSelect`, `ActivityPhotoUpload`)
3. **Decoupled Architecture (Zero Legacy Imports):**
   - ไม่มีการอ้างอิงกลับไปยัง `modules/activity-plans/` 100%
   - จัดการ Database โดยตรงผ่าน `type8.repository.ts` ด้วย Prisma transactions
