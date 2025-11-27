# Product Management System - Setup Guide

## ✅ สิ่งที่สร้างเสร็จแล้ว

### 1. Custom Components
- ✅ `components/custom/multi-select.tsx` - Multi-selection dropdown สำหรับเลือกพืชที่ใช้
- ✅ `components/custom/Textarea.tsx` - Textarea แบบ Floating Label
- ✅ `components/custom/file-upload.tsx` - อัพโหลดรูปภาพพร้อม preview (รองรับ .jpg, .png, ไม่เกิน 2MB, สูงสุด 5 ไฟล์)

### 2. Database Schema
- ✅ `Product` - ข้อมูลสินค้าหลัก
- ✅ `ProductImage` - รูปภาพสินค้า (แกลเลอรี)
- ✅ `ProductFreeItem` - รายการของแถม
- ✅ `ProductPromotionItem` - รายการส่งเสริมการขาย
- ✅ `ProductStockLot` - สต็อกสินค้า (เลขล็อตสร้างอัตโนมัติ Lot.1, Lot.2, ...)

### 3. TypeScript Types (`types/product.ts`)
- ✅ Product, ProductImage, ProductFreeItem, ProductPromotionItem, ProductStockLot
- ✅ ProductFormData, ProductManagementFormData
- ✅ ตัวเลือก dropdowns ทั้งหมด (UNIT_OPTIONS, PRODUCT_GROUP_OPTIONS, BRAND_OPTIONS, STATUS_OPTIONS, PLANT_OPTIONS, STORAGE_LOCATION_OPTIONS)

### 4. API Routes
- ✅ `GET /api/products` - ดึงรายการสินค้า (มี pagination, search, date filter)
- ✅ `POST /api/products` - สร้างสินค้าใหม่
- ✅ `GET /api/products/[productId]` - ดูรายละเอียดสินค้า
- ✅ `PATCH /api/products/[productId]` - แก้ไขสินค้า
- ✅ `DELETE /api/products/[productId]` - ลบสินค้า (soft delete)
- ✅ `PATCH /api/products/[productId]/manage` - จัดการราคา, ของแถม, โปรโมชั่น, และสต็อก

### 5. Frontend Pages & Components
- ✅ `products/page.tsx` - หน้ารายการสินค้า (ตาราง + ค้นหา + กรองวันที่)
- ✅ `products/new/page.tsx` - หน้าเพิ่มสินค้าใหม่
- ✅ `products/[productId]/page.tsx` - หน้าดูรายละเอียดสินค้า (แสดงแกลเลอรี)
- ✅ `products/[productId]/edit/page.tsx` - หน้าแก้ไขสินค้า
- ✅ `products/[productId]/manage/page.tsx` - หน้าจัดการสินค้า (ราคา, ของแถม, โปรโมชั่น, สต็อก)
- ✅ `components/features/products/product-form.tsx` - ฟอร์มสินค้า (ใช้ร่วมกันระหว่าง create/edit)
- ✅ `components/features/products/products-table.tsx` - ตารางแสดงรายการสินค้า

### 6. RBAC Permissions (อัพเดทใน `prisma/seed.ts`)
- ✅ `menu.products` - มองเห็นเมนูสินค้า
- ✅ `product.create` - สร้างสินค้า
- ✅ `product.update` - แก้ไขสินค้า
- ✅ `product.delete` - ลบสินค้า
- ✅ `product.view` - ดูรายละเอียดสินค้า
- ✅ `product.manage` - จัดการสินค้า (ราคา, สต็อก, โปรโมชั่น)

---

## 🔧 ขั้นตอนการติดตั้ง

### 1. ปิด Development Server ก่อน (ถ้ากำลังรันอยู่)
กด `Ctrl+C` ใน terminal ที่กำลังรัน `pnpm dev`

### 2. Generate Prisma Client และสร้าง Database Migration

```powershell
# Generate Prisma Client
pnpm prisma generate

# สร้าง migration สำหรับ Product models
pnpm prisma migrate dev --name add_products_module

# (Optional) รัน seed เพื่อเพิ่ม permissions
pnpm prisma db seed
```

### 3. เริ่ม Development Server อีกครั้ง

```powershell
pnpm dev
```

### 4. ตรวจสอบว่าระบบทำงาน

1. เข้าสู่ระบบด้วย admin account: `b@b.com` / `b@b.com`
2. ไปที่เมนู **Products** (ถ้ายังไม่มีเมนู ให้ไปที่ RBAC Console เพิ่มสิทธิ์ก่อน)
3. ทดสอบสร้างสินค้าใหม่
4. ทดสอบแก้ไขสินค้า
5. ทดสอบดูรายละเอียดสินค้า
6. ทดสอบจัดการสินค้า (ราคา, ของแถม, โปรโมชั่น, สต็อก)

---

## 📋 Features ที่ใช้งานได้

### หน้ารายการสินค้า (`/products`)
- ✅ แสดงตารางสินค้า พร้อม pagination
- ✅ ค้นหาสินค้า (รหัสสินค้า, ชื่อสินค้า, ชื่อสามัญ)
- ✅ กรองตามช่วงวันที่
- ✅ ปุ่มเพิ่มสินค้า, ดูรายละเอียด, แก้ไข, ลบ, จัดการสินค้า
- ✅ ตรวจสอบสิทธิ์ RBAC สำหรับแต่ละปุ่ม

### หน้าเพิ่มสินค้า (`/products/new`)
- ✅ รหัสสินค้า * (required)
- ✅ ชื่อสินค้า * (required)
- ✅ ชื่อสามัญ
- ✅ หน่วยนับ (dropdown: ชิ้น, อัน, ถุง)
- ✅ กลุ่มสินค้า (dropdown: กลุ่ม A, B, C)
- ✅ แบรนด์สินค้า (dropdown: แบรนด์ X, Y, Z)
- ✅ ขนาดบรรจุ
- ✅ ขนาดบรรจุต่อลัง
- ✅ สถานะสินค้า (dropdown: ใช้งาน, ไม่ใช้งาน)
- ✅ ใช้กับพืช (multi-select: ข้าว, อ้อย, มันสำปะหลัง, ปาล์มน้ำมัน)
- ✅ จุดขายสินค้า (textarea)
- ✅ คุณสมบัติ (textarea)
- ✅ อัพโหลดรูปภาพสินค้า (รองรับ .jpg, .png, ไม่เกิน 2MB, สูงสุด 5 รูป)
- ✅ Validation ข้อมูล
- ✅ แสดงข้อความ success/error

### หน้าแก้ไขสินค้า (`/products/[id]/edit`)
- ✅ โหลดข้อมูลสินค้าเดิมมาแสดง
- ✅ ฟิลด์เหมือนหน้าเพิ่มสินค้า
- ✅ Validation ข้อมูล
- ✅ อัพเดทข้อมูลผ่าน API

### หน้าดูรายละเอียดสินค้า (`/products/[id]`)
- ✅ แสดงข้อมูลสินค้าทั้งหมด
- ✅ แสดงรูปภาพเป็นแกลเลอรี (grid layout)
- ✅ แสดงราคาและงบโปรโมชั่น (ถ้ามี)
- ✅ ปุ่มแก้ไข, ลบ, จัดการสินค้า (ตามสิทธิ์)
- ✅ Dialog ยืนยันการลบ

### หน้าจัดการสินค้า (`/products/[id]/manage`)

#### 1. จัดการราคาสินค้า
- ✅ ราคาสินค้า (input number)
- ✅ งบส่งเสริมการขาย (input number)

#### 2. รายการของแถม
- ✅ ปุ่มเพิ่มรายการของแถม
- ✅ จำนวนที่ซื้อ (input number)
- ✅ จำนวนของแถม (input number)
- ✅ ราคาสุทธิ (input number)
- ✅ หมายเหตุ (input text)
- ✅ ปุ่มลบรายการ

#### 3. รายการส่งเสริมการขาย
- ✅ ปุ่มเพิ่มรายการส่งเสริมการขาย
- ✅ ชื่อสินค้า (input text)
- ✅ จำนวนคงเหลือ (input number)
- ✅ ราคา (input number)
- ✅ หมายเหตุ (input text)
- ✅ ปุ่มลบรายการ

#### 4. จัดการสต็อกสินค้า
- ✅ ปุ่มเพิ่มสต็อกสินค้า
- ✅ เลขล็อต (สร้างอัตโนมัติ: Lot.1, Lot.2, ...)
- ✅ จำนวนที่เพิ่ม (input number)
- ✅ วันที่นำเข้า (date picker)
- ✅ วันหมดอายุ (date picker, optional)
- ✅ สถานที่จัดเก็บ (dropdown: คลังสินค้า A, B, C)
- ✅ หมายเหตุ (input text)
- ✅ แสดงผลรวมจำนวนคงเหลือ (คำนวณอัตโนมัติ)
- ✅ ปุ่มลบรายการ (ลบได้เฉพาะรายการที่ยังไม่ถูกใช้งาน)

---

## ⚠️ หมายเหตุสำคัญ

### 1. การอัพโหลดรูปภาพ
ปัจจุบันระบบ **ยังไม่ได้เชื่อมต่อกับ file storage จริง** คุณต้อง:
- สร้าง API endpoint สำหรับอัพโหลดไฟล์ (เช่น `/api/uploads`)
- ใช้ service เช่น AWS S3, Cloudinary, หรือเก็บใน local storage
- แก้ไขฟังก์ชัน `handleSubmit` ใน `product-form.tsx` เพื่ออัพโหลดรูปภาพ

### 2. การ Validate รูปภาพ
Component `file-upload.tsx` มี validation:
- รองรับเฉพาะ `.jpg`, `.png`
- ขนาดไม่เกิน 2MB ต่อไฟล์
- อัพโหลดได้สูงสุด 5 ไฟล์

### 3. Soft Delete
การลบสินค้าเป็น **soft delete** (ตั้งค่า `deletedAt`) ไม่ใช่การลบออกจากฐานข้อมูล

### 4. Transaction Safety
หน้า Manage ใช้ Prisma Transaction เพื่อความปลอดภัยของข้อมูล - ถ้าส่วนใดส่วนหนึ่งผิดพลาด จะ rollback ทั้งหมด

---

## 🎯 การเพิ่ม Menu ในระบบ

หากเมนู Products ยังไม่ปรากฏ ให้เพิ่มใน navigation:

1. ไปที่ไฟล์ `components/features/layout/sidebar.tsx` (หรือไฟล์ที่กำหนด menu)
2. เพิ่ม menu item สำหรับ Products:

```tsx
{
  title: "สินค้า",
  href: "/products",
  icon: Package, // import { Package } from "lucide-react"
  permission: "menu.products"
}
```

---

## 🔍 การ Debug

ถ้าเจอปัญหา ให้ตรวจสอบ:

1. **Prisma Client ถูก generate แล้วหรือยัง?**
   ```powershell
   pnpm prisma generate
   ```

2. **Migration ทำงานสำเร็จหรือยัง?**
   ```powershell
   pnpm prisma migrate status
   ```

3. **ตรวจสอบ console errors** ใน Browser DevTools (F12)

4. **ตรวจสอบ API errors** ใน Network tab

5. **ตรวจสอบสิทธิ์ใน database**:
   ```sql
   SELECT p.key, rp.allow 
   FROM "Permission" p
   LEFT JOIN "RolePermission" rp ON p.id = rp."permissionId"
   WHERE p.key LIKE 'product.%' OR p.key = 'menu.products';
   ```

---

## 📚 ไฟล์ที่สร้างทั้งหมด

### Components
- `components/custom/multi-select.tsx`
- `components/custom/Textarea.tsx`
- `components/custom/file-upload.tsx`
- `components/features/products/product-form.tsx`
- `components/features/products/products-table.tsx`

### Pages
- `app/(main)/products/page.tsx`
- `app/(main)/products/new/page.tsx`
- `app/(main)/products/[productId]/page.tsx`
- `app/(main)/products/[productId]/edit/page.tsx`
- `app/(main)/products/[productId]/manage/page.tsx`

### API Routes
- `app/api/products/route.ts`
- `app/api/products/[productId]/route.ts`
- `app/api/products/[productId]/manage/route.ts`

### Types
- `types/product.ts`

### Database
- `prisma/schema.prisma` (อัพเดท)
- `prisma/seed.ts` (อัพเดท)

---

สำเร็จแล้ว! 🎉 ระบบจัดการสินค้าพร้อมใช้งาน
