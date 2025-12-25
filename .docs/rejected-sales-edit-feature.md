# การแก้ไขระบบให้รองรับการแก้ไขข้อมูลการขายที่ไม่อนุมัติ (REJECTED)

## วัตถุประสงค์

ให้ผู้สร้างข้อมูลหรือแอดมินสามารถแก้ไขข้อมูลการขายที่มีสถานะ "ไม่อนุมัติ" (REJECTED) และส่งไปอนุมัติใหม่ได้

## การเปลี่ยนแปลง

### 1. หน้า Sales Detail (`app/(main)/sales/[id]/page.tsx`)

#### เพิ่มการตรวจสอบสิทธิ์

```typescript
// เพิ่ม state สำหรับเก็บ user ID ปัจจุบัน
const [currentUserId, setCurrentUserId] = useState<string | null>(null);

// ดึงข้อมูล session
useEffect(() => {
  fetch("/api/auth/session")
    .then((res) => res.json())
    .then((session) => {
      if (session?.user?.id) {
        setCurrentUserId(session.user.id);
      }
    })
    .catch((err) => console.error("Failed to fetch session:", err));

  // ... fetch sale data
}, [id]);

// ตรวจสอบสิทธิ์
const isCreator = currentUserId === sale.createdById;
const isAdmin = hasPermission("sale.admin");

// อนุญาตให้แก้ไขได้สำหรับ PENDING หรือ REJECTED (ถ้าเป็นผู้สร้างหรือแอดมิน)
const canEditThis =
  canEdit &&
  (sale.status === "PENDING" ||
    (sale.status === "REJECTED" && (isCreator || isAdmin)));
```

#### เพิ่มปุ่มแก้ไขในส่วน Header

```typescript
{
  /* Action Buttons */
}
{
  canEditThis && (
    <div className="flex gap-3">
      <Link href={`/sales/${id}/edit`}>
        <Button
          variant="secondary"
          className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
        >
          <Edit className="h-4 w-4 mr-2" />
          แก้ไขข้อมูล
        </Button>
      </Link>
    </div>
  );
}
```

### 2. API Route (`app/api/sales/[id]/route.ts`)

#### เพิ่มการตรวจสอบสิทธิ์สำหรับ REJECTED Sales

```typescript
// Check if user has permission to edit this sale
// For REJECTED sales, only creator or admin can edit
if (existingSale.status === "REJECTED") {
  const isCreator = session.user.id === existingSale.createdById;
  // TODO: Check if user is admin - you may need to implement this check based on your permission system
  // For now, we'll allow creator to edit
  if (!isCreator) {
    return NextResponse.json(
      { error: "Only the creator or admin can edit rejected sales" },
      { status: 403 }
    );
  }
}
```

#### อัปเดต Logic การส่งอนุมัติใหม่

```typescript
// If sale is approved or rejected, reset to PENDING for re-approval
const needsReapproval =
  existingSale.status === "APPROVED" ||
  existingSale.status === "AWAITING_PAYMENT" ||
  existingSale.status === "AWAITING_DELIVERY" ||
  existingSale.status === "REJECTED"; // เพิ่มสถานะ REJECTED
```

### 3. Sales Table (`components/features/sales/sales-table.tsx`)

#### เพิ่มการแสดงไอคอนแก้ไขสำหรับ REJECTED Sales

```typescript
// ในส่วน Mobile Card View และ Table View
const isPending = item.status === "PENDING";
const isRejected = item.status === "REJECTED";
const isCreator = currentUserId && item.createdById === currentUserId;
const canEditThis = (canEdit || isCreator) && (isPending || isRejected);

// แสดงปุ่มแก้ไข
{
  canEditThis && (
    <Button asChild size="sm" variant="outline">
      <Link href={`/sales/${item.id}/edit`}>
        <Edit className="mr-2 h-4 w-4" /> แก้ไข
      </Link>
    </Button>
  );
}
```

## การทำงาน

1. **เมื่อข้อมูลการขายถูกปฏิเสธ (REJECTED)**

   - ผู้สร้างข้อมูลหรือแอดมินจะเห็นปุ่ม "แก้ไขข้อมูล" ในหน้ารายละเอียด
   - ผู้ใช้ทั่วไปที่ไม่ใช่ผู้สร้างจะไม่เห็นปุ่มนี้

2. **เมื่อคลิกปุ่มแก้ไข**

   - ระบบจะนำไปยังหน้าแก้ไข (`/sales/[id]/edit`)
   - แสดงฟอร์มพร้อมข้อมูลเดิม

3. **เมื่อบันทึกการแก้ไข**

   - API จะตรวจสอบว่าผู้ใช้เป็นผู้สร้างหรือไม่
   - ถ้าไม่ใช่ผู้สร้าง จะแสดง error 403
   - ถ้าเป็นผู้สร้าง:
     - บันทึกข้อมูลที่แก้ไข
     - เปลี่ยนสถานะเป็น `PENDING` อัตโนมัติ
     - เพิ่ม status history: "Sale updated - requires re-approval"
     - คืนวงเงินเครดิต (ถ้ามี)
     - คืนสต็อกสินค้า (ถ้ามี)

4. **หลังจากบันทึก**
   - ระบบจะ redirect กลับไปยังหน้ารายละเอียด
   - ข้อมูลจะอยู่ในสถานะ `PENDING` รอการอนุมัติใหม่

## หมายเหตุ

- ปัจจุบันระบบตรวจสอบเฉพาะว่าผู้ใช้เป็นผู้สร้างหรือไม่
- การตรวจสอบสิทธิ์ Admin (`sale.admin`) อาจต้องเพิ่มเติมในระบบ permission
- เมื่อแก้ไขข้อมูล REJECTED แล้ว จะต้องผ่านกระบวนการอนุมัติใหม่ทั้งหมด

## การทดสอบ

1. สร้างข้อมูลการขายใหม่
2. ส่งอนุมัติ
3. ปฏิเสธข้อมูล (REJECTED)
4. ตรวจสอบว่าผู้สร้างเห็นปุ่ม "แก้ไขข้อมูล"
5. คลิกแก้ไขและบันทึก
6. ตรวจสอบว่าสถานะเปลี่ยนเป็น PENDING
7. ส่งอนุมัติใหม่
