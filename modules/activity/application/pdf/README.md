# Activity Plan PDF & Print Application Service (`modules/activity/application/pdf`)

โมดูลบริการระดับ Application สำหรับการสร้างเอกสาร HTML Preview และแปลงเป็นไฟล์ PDF ของระบบแผนงานกิจกรรม (Trip Activity Plans) เพื่อนำไปสั่งพิมพ์ผ่านหน้าเว็บ (Web Print) หรือดาวน์โหลดเป็นเอกสาร PDF สำหรับนำไปใช้งานหน้างาน และเสนอขออนุมัติผู้บังคับบัญชา

---

## 1. สถาปัตยกรรม (Architecture Design)

โมดูลนี้ถูกออกแบบตามหลัก **Clean Architecture** และ **Strategy Pattern (Open-Closed Principle)** ร่วมกับ **Vertical Slice Architecture** ของระบบ CRM เพื่อให้สามารถขยายและดูแลรักษาการจัดรูปแบบเอกสารของประเภทงานกิจกรรมทั้ง 15 ประเภทได้อย่างอิสระ ไม่เกิด Monolithic Code:

```text
modules/activity/application/pdf/
├── activity-pdf.service.ts         # Service กลาง ควบคุม Orchestration, Data Fetching & PDF Rendering
├── activity-pdf.types.ts           # Type Contracts, Interfaces, Option Flags
├── templates/                      # โครงร่างเอกสารและส่วนประกอบหลัก (Reusable HTML Sections)
│   ├── base-layout.template.ts     # HTML Shell, Thai Sarabun Font, Print CSS, Page Dimensions
│   ├── header-section.template.ts  # หัวกระดาษบริษัทและข้อมูลหัวแผนงาน (Single Plan Header)
│   ├── overview-section.template.ts# สรุปภาพรวมทริป (Overview, Team, Budget & KPI Summary)
│   ├── actual-result-section.template.ts # สรุปผลงานจริงและการแนบแกลเลอรีภาพถ่ายหน้างาน
│   ├── approval-boxes.template.ts  # กล่องลงนามสำหรับพิมพ์เอกสาร (Prepared / Verified / Approved By)
│   ├── monthly-summary.template.ts # ตารางสรุปแผนงานประจำเดือน (Monthly Field Activity Itinerary)
│   └── template-helpers.ts         # Helper ฟอร์แมตวันที่ไทย, ตัวเลข, สกุลเงิน, Base64 Logo, XSS Escape
└── type-renderers/                 # กลยุทธ์การ Render รายละเอียดแยกตามประเภทงาน (Strategy Registry)
    ├── base-type.renderer.ts       # Abstract Base Class สำหรับ Type Renderer
    ├── index.ts                    # Strategy Registry สำหรับค้นหา Renderer ตาม workTypeCode
    ├── type-1.renderer.ts          # [TYPE_1] งานเยี่ยมร้านค้า (Store Visits)
    ├── type-2.renderer.ts          # [TYPE_2] งานเยี่ยมเกษตรกร (Farmer Visits)
    ├── type-3.renderer.ts          # [TYPE_3] งานเจรจาหนี้ / ติดตามยอดเงิน (Debt Collection)
    ├── type-4.renderer.ts          # [TYPE_4] งานกิจกรรมร่วมกับทางราชการ (Gov Collaboration)
    ├── type-5.renderer.ts          # [TYPE_5] งานส่งเสริมการขายร่วมกับร้านค้า (Store Promotion)
    ├── type-6.renderer.ts          # [TYPE_6] งานจัดประชุม/อบรมเกษตรกร (Farmer Training/Seminar)
    ├── type-7a.renderer.ts         # [TYPE_7A] งานจัดทำแปลงสาธิต (Demo Plots)
    ├── type-7b.renderer.ts         # [TYPE_7B] งานจัดทำแปลงเปรียบเทียบ (Comparison Plots)
    ├── type-8.renderer.ts          # [TYPE_8] งานติดตามแปลงสาธิต (Demo Follow-up)
    ├── type-9.renderer.ts          # [TYPE_9] งานจัดกิจกรรมวันสาธิต / Field Day
    ├── type-10.renderer.ts         # [TYPE_10] งานจัดนิทรรศการ / บูธแสดงสินค้า (Exhibitions)
    ├── type-11.renderer.ts         # [TYPE_11] งานจัดกิจกรรมส่งเสริมพิเศษ (Special Campaigns)
    ├── type-12.renderer.ts         # [TYPE_12] งานสำรวจตลาดและคู่แข่ง (Market Survey)
    ├── type-13.renderer.ts         # [TYPE_13] งานสาธิตการฉีดพ่นสารเคมี (Spraying Demo)
    └── type-14.renderer.ts         # [TYPE_14] งานจัดงานเลี้ยงขอบคุณลูกค้า (Customer Appreciation)
```

---

## 2. รูปแบบการส่งออกเอกสาร (Export Modes)

ระบบรองรับการพิมพ์และส่งออกเอกสาร 2 รูปแบบหลัก:

### 1) โหมด `ALL`: พิมพ์รวมทุกแผนงาน (Monthly Field Activity Itinerary)
- **ทิศทางหน้ากระดาษ:** แนวนอน (A4 Landscape)
- **วัตถุประสงค์:** สรุปภาพรวมกำหนดการเดินทางและแผนงานทั้งหมดของผู้แทนฝ่ายขายตลอดเดือน เพื่อเสนอให้ผู้จัดการเขตและผู้อำนวยการสายงานตรวจทานและลงนามอนุมัติ
- **เนื้อหาในรายงาน:**
  - **ตารางกำหนดการลงพื้นที่ (Monthly Schedule & Itinerary):**
    - วันที่ลงพื้นที่ (วันที่เริ่ม - สิ้นสุด พร้อมคำนวณจำนวนวัน)
    - ชื่อแผนงาน / เลขที่แผนงาน / รายชื่อผู้ร่วมเดินทาง
    - พื้นที่เป้าหมาย (อำเภอ, จังหวัด)
    - ร้านค้า / เกษตรกรเป้าหมาย (ดึงข้อมูลอัตโนมัติจากทุก Target Type ในระบบ)
    - ประเภทงาน (Badge แสดงรหัสและชื่องาน)
    - สถานะของแผนงาน (อนุมัติแล้ว, รออนุมัติ, แบบร่าง)
  - **แถบ KPI ภาพรวมประจำเดือน:** จำนวนแผนงานรวม, จำนวนวันลงพื้นที่รวม, ร้านค้า/แปลงเป้าหมายรวม และงบประมาณรวมที่ขออนุมัติ
  - **ช่องลงนาม 3 ระดับ:** ผู้จัดทำแผนงาน (ผู้แทนขาย) → ผู้ตรวจสอบ (ผู้จัดการเขต) → ผู้อนุมัติ (ผู้อำนวยการสายงาน)

### 2) โหมด `SINGLE`: พิมพ์แยกเฉพาะแผนงาน (Job Sheet / Full Breakdown)
- **ทิศทางหน้ากระดาษ:** แนวตั้ง (A4 Portrait)
- **วัตถุประสงค์:** สร้างเป็นใบงานเฉพาะเรื่อง (Job Sheet) สำหรับนำไปใช้หน้างาน หรือพิมพ์รายงานรายละเอียดแผนงานฉบับเต็ม
- **ขอบเขตเนื้อหาที่เลือกได้:**
  - **เลือกเฉพาะประเภทงาน:** เช่น เลือกเฉพาะ `[TYPE_7A] แปลงสาธิต` เพื่อออกเป็น Job Action Sheet พิมพ์เฉพาะตารางเกษตรกรและรายการสารเคมีที่ใช้สาธิต
  - **รวมทุกงานในแผน (Master Sheet):** แสดงภาพรวมทริป ตารางเวลารวม และรายละเอียดของแต่ละประเภทงานเรียงตามลำดับ
  - **ตัวเลือกเสริม:** แนบผลการปฏิบัติงานจริง (Actual Results) และ แกลเลอรีรูปถ่ายหน้างาน (Photo Gallery)

---

## 3. มาตรฐานการจัดรูปแบบและการพิมพ์ (Print & Typography Standards)

1. **ฟอนต์ภาษาไทยมาตรฐาน:**
   - ใช้ฟอนต์ **TH Sarabun New** ในรูปแบบ Base64 WOFF ฝังในตัว CSS เพื่อให้ระบบสามารถ Render ภาษาไทยได้ถูกต้อง 100% ทั้งบนเซิร์ฟเวอร์ (Puppeteer Headless Linux/Windows) และบนเบราว์เซอร์ของผู้ใช้
2. **การควบคุมการขึ้นหน้าใหม่ (Page Break Control):**
   - คลาส `.avoid-break`: ป้องกันการตัดแบ่งหน้ากลางตารางหรือกล่องข้อมูลสำคัญ (`break-inside: avoid; page-break-inside: avoid;`)
   - คลาส `.page-break`: บังคับขึ้นหน้ากระดาษใหม่เมื่อเริ่มหัวข้อหรือใบงานประเภทถัดไป (`page-break-before: always;`)
3. **การป้องกัน XSS และ Data Sanitization:**
   - ข้อความที่ดึงมาจากฐานข้อมูลและ Input ของผู้ใช้ จะต้องผ่านฟังก์ชัน `safeHtml()` ใน `template-helpers.ts` ก่อนนำไปประกอบใน HTML เสมอ
4. **ความแม่นยำของขนาดเอกสาร A4:**
   - ขนาดหน้ากระดาษถูกกำหนดแบบตายตัวผ่าน `@page { size: A4 portrait; margin: 8mm 10mm; }` สำหรับโหมดแนวตั้ง และ `@page { size: A4 landscape; margin: 8mm 10mm; }` สำหรับโหมดแนวนอน

---

## 4. API Endpoints ที่เกี่ยวข้อง

| Endpoint | Method | คำอธิบาย | พารามิเตอร์ Query |
|---|---|---|---|
| `/api/activity-plans/[id]/pdf-html` | `GET` | คืนค่า HTML สำหรับ Live Preview ในหน้าต่าง Studio | `mode`, `type`, `month`, `year`, `includeActual`, `includePhotos` |
| `/api/activity-plans/[id]/pdf` | `GET` | ส่งกลับไฟล์ Stream Binary PDF จาก Puppeteer | `mode`, `type`, `month`, `year`, `disposition` (`inline` / `attachment`) |
| `/api/activity-plans/pdf-html` | `GET` | Live Preview สำหรับหน้ารวม (ไม่ต้องระบุ planId) | `mode=ALL`, `month`, `year` |
| `/api/activity-plans/pdf` | `GET` | ดาวน์โหลดไฟล์ PDF สรุปประจำเดือนโดยตรง | `mode=ALL`, `month`, `year`, `disposition=attachment` |

---

## 5. การเพิ่มหรือแก้ไข Type Renderer (Extensibility Guide)

เมื่อมีการเพิ่ม Activity Type ใหม่ หรือต้องการปรับปรุงฟอร์แมตการแสดงผลของประเภทงานเดิม:

1. **สืบทอดคลาสจาก `BaseTypeRenderer`:**
   ```typescript
   // modules/activity/application/pdf/type-renderers/type-xx.renderer.ts
   import { BaseTypeRenderer } from "./base-type.renderer";
   import type { TypeRenderContext, TypeRenderResult } from "../activity-pdf.types";
   import { safeHtml, formatMoney } from "../templates/template-helpers";

   export class TypeXXRenderer extends BaseTypeRenderer {
     readonly workTypeCode = "TYPE_XX";

     async render(context: TypeRenderContext): Promise<TypeRenderResult> {
       const { plan, targets, parsedResults } = context;

       // 1. Render แผนงาน (Planned HTML)
       const planHtml = `
         <div class="section-box avoid-break">
           <div class="section-header">รายละเอียดงาน TYPE_XX</div>
           <div class="section-body">...</div>
         </div>
       `;

       // 2. Render ผลงานจริง (Actual HTML - Optional)
       const actualHtml = `...`;

       return {
         workTypeCode: this.workTypeCode,
         title: "งานประเภท XX",
         planHtml,
         actualHtml,
       };
     }
   }
   ```

2. **ลงทะเบียนใน `typeRendererRegistry`:**
   นำ Renderer ที่สร้างขึ้นไปลงทะเบียนใน `modules/activity/application/pdf/type-renderers/index.ts`:
   ```typescript
   this.register(new TypeXXRenderer());
   ```

3. **ตรวจสอบความถูกต้อง:**
   รันคำสั่งตรวจสอบ Type และ Build ก่อนบันทึกการเปลี่ยนแปลง:
   ```bash
   pnpm tsc --noEmit
   pnpm build
   ```

