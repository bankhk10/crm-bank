"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Users,
  Target,
  TrendingUp,
  Package,
  Map,
  Loader2,
  BarChart3,
  User,
} from "lucide-react";
import Link from "next/link";
import { PRODUCT_GROUP_OPTIONS } from "@/types/product";

const MONTHS = [
  { value: 1, label: "มกราคม" },
  { value: 2, label: "กุมภาพันธ์" },
  { value: 3, label: "มีนาคม" },
  { value: 4, label: "เมษายน" },
  { value: 5, label: "พฤษภาคม" },
  { value: 6, label: "มิถุนายน" },
  { value: 7, label: "กรกฎาคม" },
  { value: 8, label: "สิงหาคม" },
  { value: 9, label: "กันยายน" },
  { value: 10, label: "ตุลาคม" },
  { value: 11, label: "พฤศจิกายน" },
  { value: 12, label: "ธันวาคม" },
];

const REGIONS = [
  "ภาคเหนือ",
  "ภาคตะวันออกเฉียงเหนือ",
  "ภาคตะวันออก",
  "ภาคตะวันตก",
  "ภาคกลาง",
  "ภาคใต้",
];

interface EmployeeSummary {
  employee: {
    id: string;
    name: string;
    employeeCode: string | null;
  };
  monthlyTargets: {
    month: number;
    totalAmount: number | { toNumber: () => number } | null;
    quantity: number | null;
  }[];
  yearlyTotal: number;
}

interface TargetItem {
  id: string;
  employeeId: string;
  year: number;
  month: number;
  customerId: string;
  customerRegion: string | null;
  productId: string;
  productGroup: string | null;
  quantity: number;
  unitPrice: string | number;
  totalAmount: string | number;
  employee: {
    id: string;
    name: string;
    employeeCode: string | null;
  };
  customer: {
    id: string;
    name: string;
    customerCode: string;
    region: string | null;
  };
  product: {
    id: string;
    name: string;
    productCode: string;
    productGroup: string | null;
  };
}

export default function AdminEmployeeSalesTargetsPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
  const [viewMode, setViewMode] = useState<
    "summary" | "by-region" | "by-product-group"
  >("summary");

  // Data states
  const [summary, setSummary] = useState<EmployeeSummary[]>([]);
  const [allTargets, setAllTargets] = useState<TargetItem[]>([]);

  // Fetch all targets for the year
  const fetchTargets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/employee-sales-targets?year=${year}`);
      if (!res.ok) throw new Error("Failed to fetch targets");

      const data = await res.json();
      setSummary(data.summary || []);
      setAllTargets(data.targets || []);
    } catch (error) {
      console.error("Error fetching targets:", error);
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    fetchTargets();
  }, [fetchTargets]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("th-TH").format(value);
  };

  const getProductGroupLabel = (value: string | null | undefined) => {
    if (!value) return "อื่นๆ";
    const group = PRODUCT_GROUP_OPTIONS.find((g) => g.value === value);
    return group?.label || value;
  };

  // Calculate totals
  const calculateYearlyTotal = () => {
    return summary.reduce((sum, emp) => sum + emp.yearlyTotal, 0);
  };

  const calculateMonthTotal = (month: number) => {
    return summary.reduce((sum, emp) => {
      const monthTarget = emp.monthlyTargets.find((t) => t.month === month);
      if (!monthTarget?.totalAmount) return sum;
      const amount =
        typeof monthTarget.totalAmount === "object" &&
        "toNumber" in monthTarget.totalAmount
          ? monthTarget.totalAmount.toNumber()
          : Number(monthTarget.totalAmount);
      return sum + amount;
    }, 0);
  };

  // Group targets by region
  const getByRegion = () => {
    const regionData: Record<
      string,
      { totalAmount: number; quantity: number; employees: Set<string> }
    > = {};

    REGIONS.forEach((region) => {
      regionData[region] = {
        totalAmount: 0,
        quantity: 0,
        employees: new Set(),
      };
    });

    allTargets.forEach((target) => {
      const region = target.customerRegion || "ไม่ระบุ";
      if (!regionData[region]) {
        regionData[region] = {
          totalAmount: 0,
          quantity: 0,
          employees: new Set(),
        };
      }
      regionData[region].totalAmount += Number(target.totalAmount);
      regionData[region].quantity += target.quantity;
      regionData[region].employees.add(target.employeeId);
    });

    return Object.entries(regionData).map(([region, data]) => ({
      region,
      totalAmount: data.totalAmount,
      quantity: data.quantity,
      employeeCount: data.employees.size,
    }));
  };

  // Group targets by product group
  const getByProductGroup = () => {
    const groupData: Record<
      string,
      { totalAmount: number; quantity: number; employees: Set<string> }
    > = {};

    PRODUCT_GROUP_OPTIONS.forEach((group) => {
      groupData[group.value] = {
        totalAmount: 0,
        quantity: 0,
        employees: new Set(),
      };
    });

    allTargets.forEach((target) => {
      const group = target.productGroup || "OTH";
      if (!groupData[group]) {
        groupData[group] = {
          totalAmount: 0,
          quantity: 0,
          employees: new Set(),
        };
      }
      groupData[group].totalAmount += Number(target.totalAmount);
      groupData[group].quantity += target.quantity;
      groupData[group].employees.add(target.employeeId);
    });

    return Object.entries(groupData).map(([group, data]) => ({
      group,
      label: getProductGroupLabel(group),
      totalAmount: data.totalAmount,
      quantity: data.quantity,
      employeeCount: data.employees.size,
    }));
  };

  // Filter targets by employee
  const getFilteredTargets = () => {
    if (selectedEmployee === "all") return allTargets;
    return allTargets.filter((t) => t.employeeId === selectedEmployee);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 p-4 sm:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link
              href="/dashboard/admin"
              className="p-2 rounded-xl bg-white/80 hover:bg-white shadow-sm border border-slate-200/60 transition-all"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </Link>
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
                ภาพรวมเป้าหมายพนักงาน
              </h1>
              <p className="text-slate-500 text-sm">
                ดูเป้าหมายยอดขายของพนักงานทุกคน แยกตามภาคและกลุ่มสินค้า
              </p>
            </div>
          </div>
        </div>

        {/* Year Selector */}
        <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-xl px-4 py-2 shadow-sm border border-slate-200/60">
          <button
            onClick={() => setYear((y) => y - 1)}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex items-center gap-2 px-3">
            <Calendar className="w-5 h-5 text-violet-600" />
            <span className="font-bold text-slate-800 text-lg">{year}</span>
          </div>
          <button
            onClick={() => setYear((y) => y + 1)}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Yearly Target */}
        <Card className="relative overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-white/5 pointer-events-none" />
          <CardContent className="relative p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-white/20">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-violet-100">เป้าหมายรวมทั้งปี</p>
                <p className="text-2xl font-bold">
                  ฿{formatCurrency(calculateYearlyTotal())}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Number of Employees */}
        <Card className="relative overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-white/5 pointer-events-none" />
          <CardContent className="relative p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-white/20">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-blue-100">พนักงานที่ตั้งเป้าหมาย</p>
                <p className="text-2xl font-bold">
                  {summary.filter((s) => s.yearlyTotal > 0).length} คน
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Items */}
        <Card className="relative overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-white/5 pointer-events-none" />
          <CardContent className="relative p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-white/20">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-emerald-100">จำนวนรายการเป้าหมาย</p>
                <p className="text-2xl font-bold">{allTargets.length} รายการ</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Mode Selector & Employee Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex gap-2">
          <Button
            onClick={() => setViewMode("summary")}
            variant={viewMode === "summary" ? "default" : "outline"}
            className={
              viewMode === "summary"
                ? "bg-gradient-to-r from-violet-500 to-purple-600 text-white"
                : "bg-white/80"
            }
          >
            <Users className="w-4 h-4 mr-2" />
            สรุปรายพนักงาน
          </Button>
          <Button
            onClick={() => setViewMode("by-region")}
            variant={viewMode === "by-region" ? "default" : "outline"}
            className={
              viewMode === "by-region"
                ? "bg-gradient-to-r from-orange-500 to-amber-600 text-white"
                : "bg-white/80"
            }
          >
            <Map className="w-4 h-4 mr-2" />
            ตามภาค
          </Button>
          <Button
            onClick={() => setViewMode("by-product-group")}
            variant={viewMode === "by-product-group" ? "default" : "outline"}
            className={
              viewMode === "by-product-group"
                ? "bg-gradient-to-r from-teal-500 to-cyan-600 text-white"
                : "bg-white/80"
            }
          >
            <Package className="w-4 h-4 mr-2" />
            ตามกลุ่มสินค้า
          </Button>
        </div>

        {viewMode === "summary" && (
          <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
            <SelectTrigger className="w-[250px] bg-white/80">
              <SelectValue placeholder="เลือกพนักงาน" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">พนักงานทั้งหมด</SelectItem>
              {summary.map((emp) => (
                <SelectItem key={emp.employee.id} value={emp.employee.id}>
                  {emp.employee.employeeCode} - {emp.employee.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Summary by Employee */}
      {viewMode === "summary" && (
        <Card className="overflow-hidden rounded-2xl border-0 bg-white/70 backdrop-blur-sm shadow-lg">
          <CardHeader className="border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-violet-100 to-purple-100">
                <Users className="w-5 h-5 text-violet-600" />
              </div>
              <CardTitle>สรุปเป้าหมายรายพนักงาน</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider sticky left-0 bg-slate-50">
                      พนักงาน
                    </th>
                    {MONTHS.map((month) => (
                      <th
                        key={month.value}
                        className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[100px]"
                      >
                        {month.label.slice(0, 3)}.
                      </th>
                    ))}
                    <th className="px-4 py-3 text-right text-xs font-semibold text-violet-700 uppercase tracking-wider sticky right-0 bg-slate-50 min-w-[120px]">
                      รวมทั้งปี
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {summary
                    .filter(
                      (emp) =>
                        selectedEmployee === "all" ||
                        emp.employee.id === selectedEmployee,
                    )
                    .map((emp) => (
                      <tr
                        key={emp.employee.id}
                        className="hover:bg-slate-50/50"
                      >
                        <td className="px-4 py-3 sticky left-0 bg-white">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-violet-100 to-purple-100">
                              <User className="w-4 h-4 text-violet-600" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-800">
                                {emp.employee.name}
                              </p>
                              <p className="text-xs text-slate-400">
                                {emp.employee.employeeCode}
                              </p>
                            </div>
                          </div>
                        </td>
                        {MONTHS.map((month) => {
                          const monthTarget = emp.monthlyTargets.find(
                            (t) => t.month === month.value,
                          );
                          const amount = monthTarget?.totalAmount
                            ? typeof monthTarget.totalAmount === "object" &&
                              "toNumber" in monthTarget.totalAmount
                              ? monthTarget.totalAmount.toNumber()
                              : Number(monthTarget.totalAmount)
                            : 0;
                          return (
                            <td
                              key={month.value}
                              className={`px-4 py-3 text-right text-sm ${
                                amount > 0 ? "text-slate-800" : "text-slate-300"
                              }`}
                            >
                              {amount > 0 ? `฿${formatCurrency(amount)}` : "-"}
                            </td>
                          );
                        })}
                        <td className="px-4 py-3 text-right sticky right-0 bg-white">
                          <span className="font-bold text-violet-600">
                            ฿{formatCurrency(emp.yearlyTotal)}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
                <tfoot className="bg-gradient-to-r from-violet-50 to-purple-50">
                  <tr>
                    <td className="px-4 py-4 font-semibold text-slate-700 sticky left-0 bg-gradient-to-r from-violet-50 to-purple-50">
                      รวมทั้งหมด
                    </td>
                    {MONTHS.map((month) => (
                      <td
                        key={month.value}
                        className="px-4 py-4 text-right font-semibold text-slate-700"
                      >
                        ฿{formatCurrency(calculateMonthTotal(month.value))}
                      </td>
                    ))}
                    <td className="px-4 py-4 text-right sticky right-0 bg-gradient-to-r from-violet-50 to-purple-50">
                      <span className="text-xl font-bold text-violet-700">
                        ฿{formatCurrency(calculateYearlyTotal())}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* By Region */}
      {viewMode === "by-region" && (
        <Card className="overflow-hidden rounded-2xl border-0 bg-white/70 backdrop-blur-sm shadow-lg">
          <CardHeader className="border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-orange-100 to-amber-100">
                <Map className="w-5 h-5 text-orange-600" />
              </div>
              <CardTitle>สรุปเป้าหมายตามภาค</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getByRegion().map((item) => (
                <div
                  key={item.region}
                  className="p-4 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-slate-800">
                      {item.region}
                    </h3>
                    <span className="text-xs text-slate-500">
                      {item.employeeCount} พนักงาน
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">ยอดเป้า</span>
                      <span className="font-bold text-orange-600">
                        ฿{formatCurrency(item.totalAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">จำนวนลัง</span>
                      <span className="font-medium text-slate-700">
                        {formatCurrency(item.quantity)} ลัง
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* By Product Group */}
      {viewMode === "by-product-group" && (
        <Card className="overflow-hidden rounded-2xl border-0 bg-white/70 backdrop-blur-sm shadow-lg">
          <CardHeader className="border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-teal-100 to-cyan-100">
                <Package className="w-5 h-5 text-teal-600" />
              </div>
              <CardTitle>สรุปเป้าหมายตามกลุ่มสินค้า</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getByProductGroup().map((item) => (
                <div
                  key={item.group}
                  className="p-4 rounded-xl bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-100"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-slate-800">
                      {item.label}
                    </h3>
                    <span className="text-xs text-slate-500">
                      {item.employeeCount} พนักงาน
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">ยอดเป้า</span>
                      <span className="font-bold text-teal-600">
                        ฿{formatCurrency(item.totalAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">จำนวนลัง</span>
                      <span className="font-medium text-slate-700">
                        {formatCurrency(item.quantity)} ลัง
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Table */}
      {getFilteredTargets().length > 0 && (
        <Card className="overflow-hidden rounded-2xl border-0 bg-white/70 backdrop-blur-sm shadow-lg">
          <CardHeader className="border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-slate-100 to-gray-100">
                <Target className="w-5 h-5 text-slate-600" />
              </div>
              <CardTitle>รายละเอียดเป้าหมาย</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      พนักงาน
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      เดือน
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      ร้านค้า
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      ภาค
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      สินค้า
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      กลุ่ม
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      จำนวน
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      รวม
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {getFilteredTargets()
                    .slice(0, 100)
                    .map((target) => (
                      <tr key={target.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-slate-800">
                            {target.employee.name}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-slate-600">
                            {MONTHS[target.month - 1]?.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-slate-800">
                              {target.customer.name}
                            </p>
                            <p className="text-xs text-slate-400">
                              {target.customer.customerCode}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-slate-600">
                            {target.customerRegion || "-"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-slate-800">
                              {target.product.name}
                            </p>
                            <p className="text-xs text-slate-400">
                              {target.product.productCode}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700">
                            {getProductGroupLabel(target.productGroup)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-sm font-medium text-slate-700">
                            {target.quantity} ลัง
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-semibold text-emerald-600">
                            ฿{formatCurrency(Number(target.totalAmount))}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            {getFilteredTargets().length > 100 && (
              <div className="p-4 text-center text-sm text-slate-500 border-t border-slate-100">
                แสดง 100 จาก {getFilteredTargets().length} รายการ
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
