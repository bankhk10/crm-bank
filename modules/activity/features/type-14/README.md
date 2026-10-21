# Feature: Type 14 ติดตามแปลงแฮตแทค (Hattack Follow-up)

## ภาพรวม (Overview)

โมดูลย่อย **Type 14 (ติดตามแปลงแฮตแทค)** พัฒนาขึ้นตามสถาปัตยกรรม **Vertical Slice Architecture** รองรับระบบ Dual-Mode (ทั้งกิจกรรมตามแผนงาน Planned และกิจกรรมนอกแผนงาน Unplanned) ครอบคลุมการตรวจติดตามแปลงที่ผ่านการฉีดพ่นสารแฮทแทคแล้ว ทั้งการบันทึกรอบการติดตาม (Rounds), วันที่ตรวจติดตาม, ระยะเวลาหลังฉีดพ่น (Days After Spray), ผลการติดตามแปลง, การตอบสนองของพืช, รายการสินค้าที่ใช้จริงหรือฉีดพ่นซ้ำ และรูปถ่ายสภาพแปลงสูงสุด 20 รูปต่อหมู่บ้าน/รอบ

---

## สถาปัตยกรรมโฟลเดอร์ (Directory Structure)

```
modules/activity/features/type-14/
├── shared/
│   ├── constants.ts              # WORK_TYPE_CODE="TYPE_14", TRACKING_RESULT_OPTIONS, etc.
│   ├── types.ts                  # Type14PlotItem, Type14SprayRoundState, Type14ActualProductState
│   └── notes.ts                  # Notes & Summary formatters
├── planned/
│   ├── types/
│   │   ├── planned.types.ts      # Type14PlanInput, Type14PlanFormProps, Type14ValidationResult
│   │   └── actual.types.ts       # Type14ActualProps, Type14DetailProps, Type14ApprovalProps
│   ├── application/
│   │   ├── planned-mapper.ts     # extractType14PlanTargets, hydrateType14PlannedData
│   │   ├── planned-validation.ts # validateType14FormValues & Zod schemas
│   │   ├── actual-mapper.ts      # parseType14ActualResult
│   │   └── actual-validation.ts  # validateType14Actual & Zod schemas
│   ├── hooks/
│   │   ├── use-type14-planned-form.ts # Hook จัดการ State ฟอร์มแผนงาน Type 14
│   │   └── use-type14-actual.ts       # Hook จัดการ State ผลปฏิบัติงานจริง Type 14
│   ├── infrastructure/
│   │   ├── type14.repository.ts       # Data access layer (ActivityPlanType14, DemoPlot, DemoPlotVisit)
│   │   └── type14-planned.strategy.ts # Server WorkTypeStrategy สำหรับ TYPE_14 Planned
│   └── components/
│       ├── type14-planned-form.tsx    # Planned Form พร้อม Dual-Mode Plot Selection
│       ├── type14-plan-card.tsx       # Planned Overview Summary Card
│       ├── type14-actual-form.tsx     # Multi-round actual tracking execution form
│       ├── type14-detail-view.tsx     # Detail view with rounds breakdown & Lightbox
│       └── type14-approval-card.tsx   # Approval view card
├── unplanned/
│   ├── types/
│   │   └── unplanned.types.ts         # Type14UnplannedItem, Type14UnplannedFormProps
│   ├── application/
│   │   ├── unplanned-validation.ts    # validateType14UnplannedItem
│   │   └── unplanned-mapper.ts        # hydrateType14UnplannedData, mapType14UnplannedToPayload
│   ├── hooks/
│   │   └── use-type14-unplanned-form.ts # Hook สำหรับ 2-in-1 Unplanned form
│   ├── infrastructure/
│   │   └── type14-unplanned.strategy.ts # Server WorkTypeStrategy สำหรับ TYPE_14 Unplanned
│   └── components/
│       └── type14-unplanned-form.tsx  # Unplanned 2-in-1 Form พร้อม GPS & Photo Upload
├── index.ts                      # Client-Safe Public Barrel Export
└── README.md                     # Feature Documentation & Quality Gates
```

---

## การตรวจสอบคุณภาพ (Quality Gates Verification)

- [x] **QG 1: Zero Legacy Imports:** ไม่มีการ Import จาก `@/modules/activity-plans/` ทุกการเชื่อมโยงเรียกผ่าน `@/modules/activity/` หรือ Local Slices
- [x] **QG 2: Full 24-Artifact Standard:** ครอบคลุม Shared, Planned, Unplanned, Types, Application, Hooks, Components, Infrastructure และ Barrel
- [x] **QG 3: Client-Safe Barrel:** `index.ts` ไม่ทำการ Re-export Server Strategies (ป้องกัน Prisma Leaks สู่ Client Bundle)
- [x] **QG 4: Unified UI Inputs:** ใช้งาน `ActivityCustomerSelect`, `ActivityAddressSelect`, `ActivityInput`, `ActivityGpsPicker`, `ActivityProductSelect`, `ActivityPhotoUpload` ครบถ้วน
- [x] **QG 5: Dual-Mode Architecture:** รองรับทั้ง Planned Activity และ Unplanned 2-in-1 Instant Activity อย่างสมบูรณ์
- [x] **QG 6: Complete Orchestrator Integration:** เชื่อมต่อเข้ากับทั้ง 6 Orchestrator Views ใน `modules/activity/views/`
- [x] **QG 7: Zero TypeScript Errors:** ผ่านการตรวจสอบ `npx tsc --noEmit` โดยมี Error เท่ากับ 0
