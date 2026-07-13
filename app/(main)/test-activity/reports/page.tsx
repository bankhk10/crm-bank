import { auth } from "@/modules/auth/infrastructure/next-auth";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CalendarRange, ClipboardCheck, ArrowRight, Coins, Users } from "lucide-react";

export default async function TestActivityReportsPage() {
  const session = await auth();
  const perms = session?.user?.permissionKeys ?? [];

  if (!perms.includes("menu.test_activity")) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          <h3 className="font-bold">Access Denied</h3>
          <p>คุณไม่มีสิทธิ์เข้าถึงหน้าจอนี้</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          รายงานทดสอบกิจกรรม
        </h1>
        <p className="text-muted-foreground text-sm">
          เลือกรายงานเพื่อเข้าดูสถิติและข้อมูลการดำเนินงานของทีมขายภาคสนาม
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Trip Plan */}
        <Link href="/test-activity/trip-plan" className="group">
          <Card className="h-full border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all duration-300 rounded-2xl overflow-hidden bg-white/50 backdrop-blur-sm group-hover:-translate-y-1">
            <CardHeader className="p-6 pb-2 flex flex-row items-center gap-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                <CalendarRange className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-slate-800">
                  รายงานแผนการออกปฏิบัติงาน (Trip Plan)
                </CardTitle>
                <CardDescription className="text-xs">
                  แผนงานรายสัปดาห์ / รายเดือน
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-2 flex flex-col justify-between h-[120px]">
              <p className="text-xs text-muted-foreground leading-relaxed">
                ข้อมูลภาพรวมการวางแผนกิจกรรมก่อนการออกพื้นที่ เช่น รายจังหวัด อำเภอ ประเภทเป้าหมาย รวมถึงงบประมาณที่คาดว่าจะใช้
              </p>
              <div className="flex items-center text-xs font-bold text-indigo-600 mt-4 group-hover:translate-x-1 transition-transform duration-300">
                เข้าชมรายงาน <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Card 2: Activity Report */}
        <Link href="/test-activity/activity-report" className="group">
          <Card className="h-full border border-slate-100 hover:border-emerald-200 hover:shadow-md transition-all duration-300 rounded-2xl overflow-hidden bg-white/50 backdrop-blur-sm group-hover:-translate-y-1">
            <CardHeader className="p-6 pb-2 flex flex-row items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                <ClipboardCheck className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-slate-800">
                  รายงานผลการดำเนินกิจกรรม (Activity Report)
                </CardTitle>
                <CardDescription className="text-xs">
                  สรุปผลลัพธ์และยอดจำหน่ายจริง
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-2 flex flex-col justify-between h-[120px]">
              <p className="text-xs text-muted-foreground leading-relaxed">
                สรุปยอดสถิติผู้เข้าร่วมจริง ยอดจำหน่ายสินค้า ยอดลูกค้าใหม่ การเจริญเติบโตของแปลงสาธิต และอัตราบรรลุความสำเร็จรายพนักงาน
              </p>
              <div className="flex items-center text-xs font-bold text-emerald-600 mt-4 group-hover:translate-x-1 transition-transform duration-300">
                เข้าชมรายงาน <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Card 3: Budget Report */}
        <Link href="/test-activity/budget-report" className="group">
          <Card className="h-full border border-slate-100 hover:border-amber-200 hover:shadow-md transition-all duration-300 rounded-2xl overflow-hidden bg-white/50 backdrop-blur-sm group-hover:-translate-y-1">
            <CardHeader className="p-6 pb-2 flex flex-row items-center gap-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-600 group-hover:text-white transition-colors duration-300">
                <Coins className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-slate-800">
                  รายงานงบประมาณ (Budget Report)
                </CardTitle>
                <CardDescription className="text-xs">
                  วิเคราะห์ต้นทุนการจัดกิจกรรม
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-2 flex flex-col justify-between h-[120px]">
              <p className="text-xs text-muted-foreground leading-relaxed">
                วิเคราะห์การใช้งบประมาณรายกิจกรรม เปรียบเทียบงบจริงและงบตามแผนพร้อมรายงานค่าใช้จ่ายเบ็ดเตล็ดอื่นรายบุคคลและพื้นที่
              </p>
              <div className="flex items-center text-xs font-bold text-amber-600 mt-4 group-hover:translate-x-1 transition-transform duration-300">
                เข้าชมรายงาน <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Card 4: Customer Report */}
        <Link href="/test-activity/customer-report" className="group">
          <Card className="h-full border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all duration-300 rounded-2xl overflow-hidden bg-white/50 backdrop-blur-sm group-hover:-translate-y-1">
            <CardHeader className="p-6 pb-2 flex flex-row items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-slate-800">
                  รายงานลูกค้า (Customer Report)
                </CardTitle>
                <CardDescription className="text-xs">
                  วิเคราะห์ข้อมูลเกษตรกรและคู่ค้า
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-2 flex flex-col justify-between h-[120px]">
              <p className="text-xs text-muted-foreground leading-relaxed">
                วิเคราะห์ประเภทลูกค้าจำแนกพื้นที่ ชนิดพืชหลักที่ปลูก สถิติการเข้าเยี่ยมของทีมขาย และประเมินสถานะลูกค้าไม่เคลื่อนไหว/มีปัญหา
              </p>
              <div className="flex items-center text-xs font-bold text-blue-600 mt-4 group-hover:translate-x-1 transition-transform duration-300">
                เข้าชมรายงาน <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
