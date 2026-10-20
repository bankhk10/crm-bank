# Type 10: จัดงาน Field Day (Field Day Event)

โครงสร้างสถาปัตยกรรมแบบ **Vertical Slice Architecture** รองรับ **Dual-Mode 100% (Planned + Unplanned)** ตามมาตรฐาน 24-Artifact และ Quality Gates ของโมดูล Activity

---

## 📁 โครงสร้างโฟลเดอร์ (24 Artifacts)

```
modules/activity/features/type-10/
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
│   │   ├── type10.repository.ts
│   │   └── type10-planned.strategy.ts
│   ├── hooks/
│   │   ├── use-type10-planned-form.ts
│   │   └── use-type10-actual.ts
│   └── components/
│       ├── type10-planned-form.tsx
│       ├── type10-plan-card.tsx
│       ├── type10-actual-form.tsx
│       ├── type10-detail-view.tsx
│       └── type10-approval-card.tsx
└── unplanned/                              # กิจกรรมนอกแผน (Unplanned)
    ├── types/
    │   └── unplanned.types.ts
    ├── application/
    │   ├── unplanned-validation.ts
    │   └── unplanned-mapper.ts
    ├── infrastructure/
    │   └── type10-unplanned.strategy.ts
    ├── hooks/
    │   └── use-type10-unplanned-form.ts
    └── components/
        └── type10-unplanned-form.tsx
```

---

## 🚀 คุณสมบัติเด่น (Features & Capabilities)

1. **Dual-Mode 100% (Planned & Unplanned):**
   - **Planned:** วางแผนจัดงาน Field Day ล่วงหน้า เลือกว่าจะจัด ณ แปลงสาธิต (Demo Plot) ที่มีอยู่ หรือระบุสถานที่จัดงานเอง พร้อมระบุเป้าหมายจำนวนผู้เข้าร่วมงาน (Target Attendees) และเป้ายอดขาย/จอง (Target Booking Sales)
   - **Actual:** บันทึกผลการจัดงานจริง จำนวนผู้เข้าร่วมงานจริง (Actual Attendees), ยอดขาย/สั่งจองจริง (Actual Sales / Booking), ความคิดเห็นของเกษตรกร (Farmer Feedback: สนใจมาก / สนใจ / เฉยๆ / ไม่สนใจ), รายการสินค้าที่ขาย/จองได้ (Sold Products), และรูปภาพบรรยากาศงาน (Atmosphere Photos)
   - **Unplanned:** บันทึกการจัดงานนอกแผนในขั้นตอนเดียว ทั้งข้อมูลสถานที่จัดงาน/แปลงสาธิต, เป้าหมาย, ผลลัพธ์จริง, รายการสินค้าที่ขายได้ และรูปภาพหลักฐาน
2. **Unified Activity UI Standard:**
   - ใช้ Components จาก `@/modules/activity/ui`: `ActivityCombobox`, `ActivityInput`, `ActivityProductSelect`, `ActivityPhotoUpload`
3. **Zero Legacy Imports:**
   - ตัดขาดจาก `@/modules/activity-plans/` 100%
