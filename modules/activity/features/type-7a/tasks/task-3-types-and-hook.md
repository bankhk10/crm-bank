# Task 3: Type Definitions & State Hook

> **Objective:** ปรับปรุง Types และ State Hook ใน `planned/types/actual.types.ts` และ `planned/hooks/use-type7a-actual.ts` เพื่อรองรับโครงสร้างข้อมูลฟอร์มใหม่ทั้งหมด

## 1. การปรับปรุง Types (`actual.types.ts`)

### เพิ่ม Type Items:
```typescript
// 1. สินค้าที่เบิกตามแผนพร้อมผลการใช้จริง
export interface Type7aPlannedProductActualItem {
  productId: string;
  productName: string;
  withdrawnQuantity: number; // จำนวนที่เบิกตามแผน (Read-only)
  actualQuantity: number | string; // จำนวนที่ใช้จริง (ขวด)
  extraQuantity: number | string; // ปริมาณที่ใช้เพิ่ม
  extraUnit: "ซีซี" | "กรัม"; // ซีซี (ขวด) หรือ กรัม (ซอง)
  applicationRate: string; // อัตราการใช้ (ผู้ใช้กรอกเอง)
}

// 2. สินค้าเพิ่มเติมหน้างาน
export interface Type7aAdditionalProductItem {
  productId: string;
  productName: string;
  actualQuantity: number | string;
  extraQuantity: number | string;
  extraUnit: "ซีซี" | "กรัม";
  applicationRate: string;
}

// 3. ยาภายนอกกรณีผสมถัง
export interface Type7aExternalChemicalItem {
  company: string;
  productName: string;
  activeIngredient: string;
  formula: "SL" | "SC" | "EC" | "อื่นๆ" | string;
  customFormula?: string;
  applicationRate: string;
}
```

### ปรับปรุง `Type7aActualRecord`:
- รองรับทุกฟิลด์จากข้อ 2 ถึงข้อ 7
- เพิ่ม `t7FarmerSubdistrict`, `t7PlannedProducts`, `t7AdditionalProducts`, `t7ExternalChemicals`

## 2. การปรับปรุง Hook (`use-type7a-actual.ts`)

- **State ใหม่:**
  - `t7SelectedProvince`: กรองรายชื่อเกษตรกรตามจังหวัด
  - `t7FarmerSubdistrict`: ตำบลของเกษตรกรนอกระบบ
  - `t7PlannedProducts`: รายการสินค้าที่เบิกมาตามแผน
  - `t7AdditionalProducts`: รายการสินค้าที่เพิ่มขึ้นมาหน้างาน
  - `t7ExternalProducts`: รายการยาภายนอก
- **ฟังก์ชัน `hydrate()`:**
  - ดึงข้อมูลเกษตรกรและเป้าหมายแปลงเดิม
  - กู้คืนรายการสินค้าที่ขอเบิกจากแผนเดิม (`plan.type7aPlots[0].products`) แปลงเข้าเป็น `t7PlannedProducts` เริ่มต้น
- **ฟังก์ชัน `buildPayload()`:**
  - รวม State ทั้งหมดให้พร้อมส่งไปยัง Server Action `recordActivityResultAction`

## 3. ขั้นตอนการดำเนินการ (Checklist)
- [x] 1. อัปเดต `modules/activity/features/type-7a/planned/types/actual.types.ts`
- [x] 2. ปรับปรุง `modules/activity/features/type-7a/planned/hooks/use-type7a-actual.ts`
- [x] 3. เพิ่ม helper functions สำหรับการเพิ่ม/ลบ/อัปเดตแถวสินค้าเพิ่มเติมและยาภายนอก
- [x] 4. ตรวจสอบการ Hydrate สินค้าเดิมจากแผนและการสร้าง Payload

