# Type 15: บูมทีม / คาราวาน (Boom Team / Caravan)

โมดูลแนวตั้ง (Vertical Feature Slice) สำหรับประเภทงาน **"บูมทีม / คาราวาน" (TYPE_15)** รองรับกระบวนการสร้างแผนงาน Trip Plan และบันทึกผลการปฏิบัติงานจริง Trip Plan Actual

## 1. ข้อมูลประเภทงาน
- **Code**: `TYPE_15`
- **Name**: บูมทีม / คาราวาน
- **ShortName**: `BoomTeamCaravan`
- **SortOrder**: 16
- **HasActual**: `true`
- **RequiresApproval**: `true`
- **Location & Team Required**: `true`

## 2. โครงสร้างไฟล์
```text
modules/activity/features/type-15/
├── planned/
│   ├── application/
│   │   ├── planned-validation.ts
│   │   ├── planned-mapper.ts
│   │   ├── actual-validation.ts
│   │   └── actual-mapper.ts
│   ├── components/
│   │   ├── type15-planned-form.tsx
│   │   ├── type15-actual-form.tsx
│   │   ├── type15-plan-card.tsx
│   │   ├── type15-detail-view.tsx
│   │   └── type15-approval-card.tsx
│   ├── hooks/
│   │   ├── use-type15-planned-form.ts
│   │   └── use-type15-actual.ts
│   ├── infrastructure/
│   │   └── type15-planned.strategy.ts
│   └── types/
│       ├── planned.types.ts
│       └── actual.types.ts
├── shared/
│   ├── constants.ts
│   └── types.ts
├── index.ts
└── README.md
```

## 3. หน้าจอและฟอร์ม
1. **Trip Plan**: เลือกลูกค้า Dealer / Subdealer (ตามเงื่อนไข Type 3), ระบุหมู่บ้าน, ระบุวัตถุประสงค์, ระบุรายละเอียดเพิ่มเติม, แสดงกล่องสถานที่และทีมงานอัตโนมัติ
2. **Trip Plan Actual**: แสดงข้อมูลเป้าหมายจากแผน, บันทึกรายละเอียดเพิ่มเติม, อัพโหลดรูปภาพการลงพื้นที่สูงสุด 10 รูป

