import Link from "next/link"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export default function ActivitiesTestMenuPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Activity Flow Test Menu</h1>
      <p className="text-gray-500">เลือกเมนูที่ต้องการทดสอบการทำงานของระบบ Activity แบบแยกหน้า</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/activities/test/roles">
          <Card className="hover:border-primary transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle>1. กำหนดสิทธิ์</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">กำหนดว่าพนักงานคนไหนอยู่ตำแหน่งอะไร ในเขตไหน</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/activities/test/create">
          <Card className="hover:border-primary transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle>2. สร้างกิจกรรม</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">จำลองการสร้างกิจกรรม เลือกว่าใครงบ และมีคนช่วยงานหรือไม่</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/activities/test/approvals">
          <Card className="hover:border-primary transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle>3. กระดานอนุมัติ</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">ดูสถานะและ Flow ว่าต้องส่งไปให้ตำแหน่งไหนอนุมัติต่อ</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/activities/test/status">
          <Card className="hover:border-primary transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle>4. สถานะของฉัน</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">ตรวจสอบว่ากิจกรรมไหนผ่านแล้ว (ลงปฏิทิน) หรือถูกตีกลับให้แก้ไข</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
