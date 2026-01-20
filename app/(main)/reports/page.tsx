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
    id: "time",
    title: "รายงานยอดขาย",
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
    title: "รายงานยอดขายสินค้า",
    description: "สินค้าขายดี / ขายช้า, ยอดขายต่อสินค้า, สต๊อกใกล้หมด",
    icon: Package,
    href: "/reports/product-sales",
    permissionKey: "report.product_sales",
    color: "from-emerald-500 to-green-500",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    features: [
      "สินค้าขายดี / ขายช้า",
      "ช่วงเวลาขายดีที่สุด",
      "ยอดขาย & จำนวนที่ขายได้ต่อสินค้า",
      "สินค้าใกล้หมด / ค้างสต๊อก",
    ],
  },
  {
    id: "product-group",
    title: "รายงานยอดขายตามกลุ่มสินค้า",
    description: "กลุ่มสินค้าขายดี / ขายช้า, ยอดขายต่อกลุ่ม",
    icon: Layers,
    href: "/reports/product-group-sales",
    permissionKey: "report.product_group_sales",
    color: "from-purple-500 to-violet-500",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
    features: [
      "กลุ่มสินค้าขายดี / ขายช้า",
      "ช่วงเวลาขายดีที่สุด",
      "ยอดขายกลุ่มสินค้าแต่ละกลุ่ม",
      "จำนวนออเดอร์ที่ขายได้แต่ละกลุ่ม",
    ],
  },
  {
    id: "customer",
    title: "รายงานยอดขายตามลูกค้า",
    description: "ลูกค้าซื้อสูงสุด, ความถี่ในการซื้อ, มูลค่าตลอดอายุลูกค้า",
    icon: Users,
    href: "/reports/customer-sales",
    permissionKey: "report.customer_sales",
    color: "from-amber-500 to-orange-500",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    features: [
      "ลูกค้าซื้อสูงสุด (Top Customers)",
      "จำนวนรายการสั่งซื้อ",
      "ความถี่ในการซื้อ",
      "มูลค่าตลอดอายุลูกค้า",
    ],
  },
  {
    id: "salesperson",
    title: "รายงานยอดขายตามพนักงานขาย",
    description: "ยอดขายต่อพนักงาน, จำนวนออเดอร์, สินค้าที่ขายได้",
    icon: UserCheck,
    href: "/reports/salesperson",
    permissionKey: "report.salesperson",
    color: "from-rose-500 to-pink-500",
    bgColor: "bg-rose-50 dark:bg-rose-950/30",
    features: [
      "ยอดขายต่อพนักงาน",
      "จำนวนออเดอร์ที่ปิดได้",
      "กลุ่มสินค้าที่ขายได้",
      "สินค้าที่ขายได้",
    ],
  },
];

export default function ReportsPage() {
  const { data: session, status } = useSession();

  // Filter report categories based on user permissions
  const filteredCategories = useMemo(() => {
    if (!session?.user?.permissions) {
      // If no permissions available, show all (for backward compatibility)
      return reportCategories;
    }

    return reportCategories.filter((category) => {
      // Check if user has permission for this report
      return session.user.permissions[category.permissionKey]?.allow !== false;
    });
  }, [session?.user?.permissions]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/5" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />

        <div className="relative px-6 py-12 max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/25">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                ศูนย์รายงาน
              </h1>
              <p className="text-muted-foreground">
                วิเคราะห์ข้อมูลการขายครบทุกมิติ
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Report Cards Grid */}
      <div className="px-6 pb-12 max-w-7xl mx-auto">
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
