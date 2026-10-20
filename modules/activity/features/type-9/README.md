# Type 9: จัดกิจกรรมส่งเสริมการขายหน้าร้าน (Store Event / Sales Promotion)

โครงสร้างสถาปัตยกรรมแบบ **Vertical Slice Architecture** รองรับ **Dual-Mode 100% (Planned + Unplanned)** ตามมาตรฐาน 24-Artifact และ Quality Gates ของโมดูล Activity

---

## 📁 โครงสร้างโฟลเดอร์ (24 Artifacts)

```
modules/activity/features/type-9/
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
│   │   ├── type9.repository.ts
│   │   └── type9-planned.strategy.ts
│   ├── hooks/
│   │   ├── use-type9-planned-form.ts
│   │   └── use-type9-actual.ts
│   └── components/
│       ├── type9-planned-form.tsx
│       ├── type9-plan-card.tsx
│       ├── type9-actual-form.tsx
│       ├── type9-detail-view.tsx
│       └── type9-approval-card.tsx
└── unplanned/                              # กิจกรรมนอกแผน (Unplanned)
    ├── types/
    │   └── unplanned.types.ts
    ├── application/
    │   ├── unplanned-validation.ts
    │   └── unplanned-mapper.ts
    ├── infrastructure/
    │   └── type9-unplanned.strategy.ts
    ├── hooks/
    │   └── use-type9-unplanned-form.ts
    └── components/
        └── type9-unplanned-form.tsx
```

---

## 🚀 คุณสมบัติเด่น (Features & Capabilities)

1. **Dual-Mode 100% (Planned & Unplanned):**
   - **Planned:** วางแผนจัดกิจกรรมส่งเสริมการขายหน้าร้านล่วงหน้า เลือกร้านค้า Sub Dealer (จาก Customer Master หรือระบุเอง พร้อมจังหวัด/อำเภอ และ Dealer ต้นสังกัด), กำหนดเป้ายอดขายรวม และรายการสินค้าโปรโมชัน
   - **Actual:** บันทึกผลการจัดกิจกรรมจริง ยอดขายรวมหน้าร้าน ยอดขายแยกตามรายการสินค้า จำนวนผู้เข้าร่วมกิจกรรม และรูปถ่ายบรรยากาศหน้าร้าน
   - **Unplanned:** บันทึกการจัดกิจกรรมนอกแผนแบบ 2-in-1 ในขั้นตอนเดียว ทั้งข้อมูลร้านค้า สินค้าโปรโมชัน ผลยอดขายจริง และรูปภาพหลักฐาน
2. **Unified Activity UI Standard:**
   - ใช้ Components จาก `@/modules/activity/ui`: `ActivityCustomerSelect`, `ActivityProductSelect`, `ActivityAddressSelect`, `ActivityInput`, `ActivityPhotoUpload`
3. **Zero Legacy Imports:**
   - ตัดขาดจาก `@/modules/activity-plans/` 100%
