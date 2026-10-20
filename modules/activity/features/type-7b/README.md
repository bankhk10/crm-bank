# Type 7B: ติดตามแปลงสาธิต (Demo Plot Follow-up)

โครงสร้างสถาปัตยกรรมแบบ **Vertical Slice Architecture** รองรับ **Dual-Mode 100% (Planned + Unplanned)** ตามมาตรฐานของโมดูล Activity

---

## 📁 โครงสร้างโฟลเดอร์ (24 Artifacts)

```
modules/activity/features/type-7b/
├── index.ts                                # Vertical Slice Public Contract
├── README.md                               # เอกสารและคู่มือการใช้งาน
├── shared/                                 # ค่าคงที่และประเภทข้อมูลที่ใช้ร่วมกัน
│   ├── constants.ts
│   └── types.ts
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
│   │   ├── type7b.repository.ts
│   │   └── type7b-planned.strategy.ts
│   ├── hooks/
│   │   ├── use-type7b-planned-form.ts
│   │   └── use-type7b-actual.ts
│   └── components/
│       ├── type7b-planned-form.tsx
│       ├── type7b-plan-card.tsx
│       ├── type7b-actual-form.tsx
│       ├── type7b-detail-view.tsx
│       └── type7b-approval-card.tsx
└── unplanned/                              # กิจกรรมนอกแผน (Unplanned)
    ├── types/
    │   └── unplanned.types.ts
    ├── application/
    │   ├── unplanned-validation.ts
    │   └── unplanned-mapper.ts
    ├── infrastructure/
    │   └── type7b-unplanned.strategy.ts
    ├── hooks/
    │   └── use-type7b-unplanned-form.ts
    └── components/
        └── type7b-unplanned-form.tsx
```

---

## 🚀 คุณสมบัติเด่น (Features & Capabilities)

1. **Dual-Mode 100% (Planned & Unplanned):**
   - **Planned:** วางแผนเข้าติดตามแปลงสาธิตจากแผนจัดทำแปลงสาธิต (Type 7A) ที่เสร็จสิ้นแล้ว เลือกแปลงย่อย พร้อมขอเบิกสินค้าเพิ่มเติมสำหรับการพ่นสาร
   - **Unplanned:** เจ้าหน้าที่ลงพื้นที่ติดตามแปลงหน้างานโดยตรง บันทึกผลการเจริญเติบโต การตอบสนองต่อสารเคมี และอัปโหลดรูปถ่ายหน้างานได้ทันที
2. **Unified Activity UI Standard:**
   - ใช้ Activity UI inputs จาก `@/modules/activity/ui` ทั้งหมด (`ActivityInput`, `ActivityTextarea`, `ActivityCombobox`, `ActivityProductSelect`, `ActivityPhotoUpload`)
3. **Decoupled Architecture (Zero Legacy Imports):**
   - ไม่มีการอ้างอิงกลับไปยัง `modules/activity-plans/` 100%
   - จัดการ Database โดยตรงผ่าน `type7b.repository.ts` ด้วย Prisma transactions
