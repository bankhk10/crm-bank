# Type 12: พาลูกค้าศึกษาดูงาน (ทัวร์ - Tour)

โครงสร้างสถาปัตยกรรมแบบ **Vertical Slice Architecture** รองรับ **Dual-Mode 100% (Planned + Unplanned)** ตามมาตรฐาน 24-Artifact และ Quality Gates ของโมดูล Activity

---

## 📁 โครงสร้างโฟลเดอร์ (24 Artifacts)

```
modules/activity/features/type-12/
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
│   │   ├── type12.repository.ts
│   │   └── type12-planned.strategy.ts
│   ├── hooks/
│   │   ├── use-type12-planned-form.ts
│   │   └── use-type12-actual.ts
│   └── components/
│       ├── type12-planned-form.tsx
│       ├── type12-plan-card.tsx
│       ├── type12-actual-form.tsx
│       ├── type12-detail-view.tsx
│       └── type12-approval-card.tsx
└── unplanned/                              # กิจกรรมนอกแผน (Unplanned)
    ├── types/
    │   └── unplanned.types.ts
    ├── application/
    │   ├── unplanned-validation.ts
    │   └── unplanned-mapper.ts
    ├── infrastructure/
    │   └── type12-unplanned.strategy.ts
    ├── hooks/
    │   └── use-type12-unplanned-form.ts
    └── components/
        └── type12-unplanned-form.tsx
```

---

## 🚀 คุณสมบัติเด่น (Features & Capabilities)

1. **Dual-Mode 100% (Planned & Unplanned):**
   - **Planned:** วางแผนศึกษาดูงานล่วงหน้า โดยเลือกประเภททัวร์ (`ทัวร์กลาง` / `ทัวร์ร้านค้า`), ขนาดทัวร์ (`ทัวร์เล็ก` / `ทัวร์ใหญ่`), ประเทศปลายทาง หรือร้านค้าที่ร่วมเดินทาง
   - **Actual:** บันทึกผลการเดินทางจริง จำนวนผู้ร่วมเดินทางจริง (Actual Attendees), ไฮไลท์การศึกษาดูงาน, ข้อคิดเห็น/ปัญหาอุปสรรค, และรูปภาพกิจกรรมการเดินทางพร้อมพิกัด
   - **Unplanned:** บันทึกทัวร์หรือการศึกษาดูงานนอกแผนในขั้นตอนเดียว (2-in-1 Form) ครบทั้งข้อมูลเป้าหมายและผลลัพธ์จริง
2. **Unified Activity UI Standard:**
   - ใช้ `ActivityCustomerSelect`, `ActivityInput`, `ActivityTextarea`, `ActivityPhotoUpload` จาก `@/modules/activity/ui`
3. **Zero Legacy Imports:**
   - ตัดขาดจาก `@/modules/activity-plans/` 100%

---

## 🛡️ เกณฑ์มาตรฐานการตรวจรับงาน (Quality Gates Checklist)

- [x] โครงสร้าง 24 Artifacts ครบถ้วน (Planned, Unplanned, Shared)
- [x] Strict Naming Convention (`type12-planned-form.tsx`, `use-type12-planned-form.ts`, etc.)
- [x] Single Public Barrel (`index.ts`)
- [x] Boundary Isolation (Zero Imports from `@/modules/activity-plans/`)
- [x] Dual-Mode Planned + Unplanned Mandatory
- [x] Unified Activity UI Components Standard
- [x] Zero TypeScript Errors Gate (`npx tsc --noEmit` Exit code 0)
