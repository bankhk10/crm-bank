"use client";

import { useSession } from "next-auth/react";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar,
  Package,
  Layers,
  Users,
  UserCheck,
  TrendingUp,
  ArrowRight,
  Loader2,
} from "lucide-react";
import Link from "next/link";

const reportCategories = [
  {
    id: "executive",
    title: "Executive Dashboard",
    description: "ภาพรวม KPI ที่สำคัญ ยอดขายรายเดือน และอันดับสูงสุด",
    icon: TrendingUp,
    href: "/reports/dashboard",
    permissionKey: "report.executive_dashboard",
    color: "from-indigo-500 to-purple-500",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/30",
    features: ["KPI รวม (ยอดขาย, ออเดอร์)", "กราฟแนวโน้มยอดขายรายเดือน", "อันดับสินค้า/ลูกค้า/พนักงานสูงสุด"],
  },
  {
    id: "time",
    title: "รายงานยอดขายตามเวลา",
    description: "ยอดขายรายวัน / รายเดือน / รายปี / ไตรมาส / ตามภูมิภาค",
    icon: Calendar,
    href: "/reports/time-sales",
    permissionKey: "report.time_sales",
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    features: [
      "ยอดขายรายวัน / รายเดือน / รายปี ...",
      "จำนวนออเดอร์ที่ขายได้ทั้งหมด",
    ],
  },
  {
    id: "product",
    title: "รายงานสินค้าและกลุ่มชื่อการค้า",
    description: "สินค้า/กลุ่มสินค้าขายดี, ยอดขายรายสินค้า, สต๊อกค้าง",
    icon: Package,
    href: "/reports/product-sales",
    permissionKey: "report.product_sales",
    color: "from-emerald-500 to-green-500",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    features: [
      "ผลงานรายสินค้า และ รายกลุ่มสินค้า",
      "สินค้าขายดี / ขายช้า / ค้างสต๊อก",
      "การแปลงปริมาณ (ลิตร) อัตโนมัติ",
    ],
  },
  {
    id: "customer-salesperson",
    title: "รายงานลูกค้าและพนักงานขาย",
    description: "ลูกค้าซื้อสูงสุด, ผลงานพนักงานขาย, มูลค่าลูกค้า",
    icon: Users,
    href: "/reports/customer-sales",
    permissionKey: "report.customer_sales",
    color: "from-amber-500 to-rose-500",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    features: [
      "รายชื่อลูกค้าซื้อสูงสุด (Top Customers)",
      "ผลงานพนักงานขายรายบุคคล (Performance)",
      "ความถี่ในการซื้อ และ มูลค่าลูกค้า",
    ],
  },
];

export default function ReportListView() {
  const { data: session, status } = useSession();

  // Filter report categories based on user permissions
  const permissionKeys = session?.user?.permissionKeys;

  const filteredCategories = useMemo(() => {
    if (!permissionKeys) {
      return [];
    }

    return reportCategories.filter((category) => {
      // Check if user has permission for this report
      return permissionKeys.includes(category.permissionKey);
    });
  }, [permissionKeys]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen ">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/50 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl mb-8">
        {/* Background effects */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-blue-500/10" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl" />

        {/* Content */}
        <div className="relative px-8 py-14 max-w-7xl mx-auto">
          <div className="flex items-center gap-5">
            {/* Icon */}
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/30">
              <TrendingUp className="h-7 w-7 text-white" />
            </div>

            {/* Title */}
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
                หมวดรายงาน
              </h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                วิเคราะห์ข้อมูลการขาย
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Report Cards Grid */}
      <div className="px-6 pb-12 mx-auto">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              คุณไม่มีสิทธิ์เข้าถึงรายงานใดๆ กรุณาติดต่อผู้ดูแลระบบ
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCategories.map((category) => {
              const Icon = category.icon;
              return (
                <Link key={category.id} href={category.href} className="group">
                  <Card
                    className={`relative h-full overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-500 ${category.bgColor} group-hover:scale-[1.02] cursor-pointer`}
                  >
                    {/* Gradient overlay */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
                    />

                    {/* Animated border */}
                    <div
                      className={`absolute inset-0 rounded-lg bg-gradient-to-r ${category.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500 p-[2px]`}
                    >
                      <div
                        className={`h-full w-full ${category.bgColor} rounded-lg`}
                      />
                    </div>

                    <CardHeader className="relative pb-2">
                      <div className="flex items-start justify-between">
                        <div
                          className={`p-3 rounded-xl bg-gradient-to-br ${category.color} shadow-lg transform group-hover:scale-110 transition-transform duration-300`}
                        >
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
                      </div>
                      <CardTitle className="mt-4 text-xl font-semibold text-slate-800 dark:text-slate-100">
                        {category.title}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {category.description}
                      </p>
                    </CardHeader>

                    <CardContent className="relative pt-0">
                      <ul className="space-y-2">
                        {category.features.map((feature, idx) => (
                          <li
                            key={idx}
                            className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400"
                          >
                            <div
                              className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${category.color}`}
                            />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
