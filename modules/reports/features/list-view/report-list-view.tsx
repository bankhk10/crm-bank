"use client";

import { useSession } from "next-auth/react";
import { useMemo } from "react";
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
import { DetailHero } from "@/components/custom/detail-hero";
import { SectionHeader } from "@/components/custom/section-header";

const categoryToHex: Record<string, string> = {
  executive: "#6366f1",
  time: "#3b82f6",
  product: "#10b981",
  "customer-salesperson": "#f59e0b",
};

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
    <div className="min-h-screen from-slate-50 to-blue-50 bg-slate-50/50 pb-12">
      {/* Hero Header Section */}
      <div className="mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <DetailHero
          backUrl="/"
          backLabel="หน้าแรก"
          title="หมวดรายงาน"
          icon={<TrendingUp className="h-8 w-8 text-white" />}
          backgroundColor="#1e293b" // Slate 800
          accentColor="#3b82f6"     // Blue 500
          badges={
            <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-medium text-blue-100 bg-blue-500/20 border border-blue-400/30 px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm backdrop-blur-md">
              <TrendingUp className="h-4 w-4 text-blue-300" />
              วิเคราะห์ข้อมูลการขาย
            </div>
          }
        />
      </div>

      {/* Report Cards Grid */}
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              คุณไม่มีสิทธิ์เข้าถึงรายงานใดๆ กรุณาติดต่อผู้ดูแลระบบ
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
            {filteredCategories.map((category) => {
              const Icon = category.icon;
              return (
                <Link key={category.id} href={category.href} className="group">
                  <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 h-full group-hover:scale-[1.01]">
                    <SectionHeader
                      title={category.title}
                      icon={<Icon className="h-6 w-6" />}
                      accentColor={categoryToHex[category.id] || "#3b82f6"}
                      variant={category.id === "executive" ? "dark" : "primary"}
                    />
                    <div className="p-8">
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-6 flex items-center gap-2">
                        <ArrowRight className="h-4 w-4 text-primary opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                        {category.description}
                      </p>
                      
                      <div className="grid grid-cols-1 gap-4">
                        {category.features.map((feature, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100/50 hover:bg-white hover:border-slate-200 transition-all duration-200"
                          >
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: categoryToHex[category.id] || "#3b82f6" }}
                            />
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                              {feature}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
