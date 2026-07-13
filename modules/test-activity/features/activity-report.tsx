"use client";

import React, { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Calendar,
  DollarSign,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight,
  Users,
  UserPlus,
  ShoppingBag,
  TrendingUp,
  MapPin,
  Leaf,
  Target,
  ClipboardList,
} from "lucide-react";
import { mockTripPlans, TripPlanMock } from "../infrastructure/mock-data";

export function ActivityReport() {
  // กรองผ่าน React States
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [jobType, setJobType] = useState("all");
  const [responsible, setResponsible] = useState("all");
  const [province, setProvince] = useState("all");
  const [targetType, setTargetType] = useState("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // หา Unique Options สำหรับ Selects จากข้อมูลจำลอง
  const uniqueOptions = useMemo(() => {
    const jobTypes = Array.from(new Set(mockTripPlans.map((d) => d.jobType)));
    const employees = Array.from(new Set(mockTripPlans.map((d) => d.responsible)));
    const provinces = Array.from(new Set(mockTripPlans.map((d) => d.province)));
    const targetTypes = Array.from(new Set(mockTripPlans.map((d) => d.targetType)));

    return { jobTypes, employees, provinces, targetTypes };
  }, []);

  // ล้างตัวกรอง
  const resetFilters = () => {
    setStartDate("");
    setEndDate("");
    setJobType("all");
    setResponsible("all");
    setProvince("all");
    setTargetType("all");
    setCurrentPage(1);
  };

  // กรองข้อมูลกิจกรรม (เน้นที่ดำเนินงานแล้วเสร็จ FINISHED หรือเลือกแสดงสถานะอื่นด้วยในตาราง แต่ KPI และ Analytics จะคำนวณจากกิจกรรมที่ทำจริง)
  const filteredData = useMemo(() => {
    return mockTripPlans.filter((item) => {
      if (startDate && item.activityDate < startDate) return false;
      if (endDate && item.activityDate > endDate) return false;
      if (jobType !== "all" && item.jobType !== jobType) return false;
      if (responsible !== "all" && item.responsible !== responsible) return false;
      if (province !== "all" && item.province !== province) return false;
      if (targetType !== "all" && item.targetType !== targetType) return false;
      return true;
    });
  }, [startDate, endDate, jobType, responsible, province, targetType]);

  // แยกเฉพาะกิจกรรมที่ดำเนินงานแล้วเสร็จ (FINISHED) สำหรับหัวข้อ KPI และ Analytics 2-7
  const finishedActivities = useMemo(() => {
    return filteredData.filter((item) => item.status === "FINISHED");
  }, [filteredData]);

  // 2. KPI Summary Calculation
  const kpiSummary = useMemo(() => {
    const totalActivities = finishedActivities.length;
    const totalParticipants = finishedActivities.reduce((sum, curr) => sum + curr.actualParticipants, 0);
    const totalNewCustomers = finishedActivities.reduce((sum, curr) => sum + curr.actualNewCustomers, 0);
    const totalOrders = finishedActivities.reduce((sum, curr) => sum + curr.actualOrders, 0);
    const totalSales = finishedActivities.reduce((sum, curr) => sum + curr.actualSales, 0);
    
    // คำนวณเป้าหมายสะสมเพื่อหาอัตราการบรรลุเป้าหมาย
    const targetSalesTotal = finishedActivities.reduce((sum, curr) => sum + curr.targetSales, 0);
    const achievementRate = targetSalesTotal > 0 ? (totalSales / targetSalesTotal) * 100 : 0;

    return {
      totalActivities,
      totalParticipants,
      totalNewCustomers,
      totalOrders,
      totalSales,
      achievementRate,
    };
  }, [finishedActivities]);

  // 3. วิเคราะห์ประเภทงาน
  const jobTypeAnalytics = useMemo(() => {
    const groups: Record<
      string,
      { name: string; count: number; participants: number; sales: number; targetSales: number }
    > = {};

    finishedActivities.forEach((item) => {
      if (!groups[item.jobType]) {
        groups[item.jobType] = { name: item.jobType, count: 0, participants: 0, sales: 0, targetSales: 0 };
      }
      groups[item.jobType].count += 1;
      groups[item.jobType].participants += item.actualParticipants;
      groups[item.jobType].sales += item.actualSales;
      groups[item.jobType].targetSales += item.targetSales;
    });

    return Object.values(groups);
  }, [finishedActivities]);

  // 4. วิเคราะห์พนักงาน
  const employeeAnalytics = useMemo(() => {
    const groups: Record<
      string,
      { name: string; count: number; newCustomers: number; sales: number; targetSales: number }
    > = {};

    finishedActivities.forEach((item) => {
      if (!groups[item.responsible]) {
        groups[item.responsible] = { name: item.responsible, count: 0, newCustomers: 0, sales: 0, targetSales: 0 };
      }
      groups[item.responsible].count += 1;
      groups[item.responsible].newCustomers += item.actualNewCustomers;
      groups[item.responsible].sales += item.actualSales;
      groups[item.responsible].targetSales += item.targetSales;
    });

    return Object.values(groups).map((item) => {
      const rate = item.targetSales > 0 ? (item.sales / item.targetSales) * 100 : 0;
      return { ...item, rate };
    }).sort((a, b) => b.sales - a.sales);
  }, [finishedActivities]);

  // 5. วิเคราะห์พื้นที่
  const areaAnalytics = useMemo(() => {
    const groups: Record<
      string,
      { name: string; count: number; participants: number; sales: number }
    > = {};

    finishedActivities.forEach((item) => {
      if (!groups[item.province]) {
        groups[item.province] = { name: item.province, count: 0, participants: 0, sales: 0 };
      }
      groups[item.province].count += 1;
      groups[item.province].participants += item.actualParticipants;
      groups[item.province].sales += item.actualSales;
    });

    return Object.values(groups).sort((a, b) => b.sales - a.sales);
  }, [finishedActivities]);

  // 6. วิเคราะห์เป้าหมาย
  const targetAnalytics = useMemo(() => {
    const groups: Record<
      string,
      { name: string; count: number; target: number; actual: number }
    > = {};

    finishedActivities.forEach((item) => {
      if (!groups[item.targetType]) {
        groups[item.targetType] = { name: item.targetType, count: 0, target: 0, actual: 0 };
      }
      groups[item.targetType].count += 1;
      
      // เลือกประเภทเป้าหมายหลักในการคำนวณเปรียบเทียบเป้าหมาย (หากเป็นการขายจะเน้นที่เงิน หรือคนเข้าร่วมตามประเภทเป้าหมาย)
      if (item.targetType === "ขายสินค้า" || item.targetType === "เก็บเงิน") {
        groups[item.targetType].target += item.targetSales;
        groups[item.targetType].actual += item.actualSales;
      } else {
        groups[item.targetType].target += item.targetParticipants;
        groups[item.targetType].actual += item.actualParticipants;
      }
    });

    return Object.values(groups).map((item) => {
      const rate = item.target > 0 ? (item.actual / item.target) * 100 : 0;
      const suffix = item.name === "ขายสินค้า" || item.name === "เก็บเงิน" ? "บาท" : "ราย/คน";
      return { ...item, rate, suffix };
    });
  }, [finishedActivities]);

  // 7. วิเคราะห์พืชเป้าหมาย
  const plantAnalytics = useMemo(() => {
    const groups: Record<
      string,
      { name: string; plots: number; growthStages: Set<string>; problems: Set<string> }
    > = {};

    finishedActivities.forEach((item) => {
      if (item.plantType && item.plantType !== "ไม่มี" && item.plantType !== "พืชไร่") {
        if (!groups[item.plantType]) {
          groups[item.plantType] = {
            name: item.plantType,
            plots: 0,
            growthStages: new Set(),
            problems: new Set(),
          };
        }
        groups[item.plantType].plots += item.plotsCount || 1;
        if (item.growthStage) groups[item.plantType].growthStages.add(item.growthStage);
        if (item.problemsFound && item.problemsFound !== "ไม่มี" && item.problemsFound !== "ไม่พบปัญหา") {
          groups[item.plantType].problems.add(item.problemsFound);
        }
      }
    });

    return Object.values(groups);
  }, [finishedActivities]);

  // Pagination for Report Table
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const getStatusBadge = (status: TripPlanMock["status"]) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            รออนุมัติ
          </span>
        );
      case "APPROVED":
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            อนุมัติแล้ว
          </span>
        );
      case "REJECTED":
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            ไม้อนุมัติ
          </span>
        );
      case "CANCELLED":
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-50 text-slate-500 border border-slate-200">
            ยกเลิก
          </span>
        );
      case "FINISHED":
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            เสร็จสิ้น
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          รายงานผลการดำเนินกิจกรรม (Activity Report)
        </h1>
        <p className="text-muted-foreground text-sm">
          การวิเคราะห์และสรุปผลสัมฤทธิ์การปฏิบัติงานจริงในภาคสนามของพนักงานขาย
        </p>
      </div>

      {/* 1. ตัวกรองข้อมูล (Filter) */}
      <Card className="rounded-2xl border bg-white/70 shadow-sm backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
            <div className="grid gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground">วันที่เริ่มต้น</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-10 px-3 py-2 border rounded-md text-sm bg-white"
              />
            </div>

            <div className="grid gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground">วันที่สิ้นสุด</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-10 px-3 py-2 border rounded-md text-sm bg-white"
              />
            </div>

            <div className="grid gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground">ประเภทงาน</label>
              <Select
                value={jobType}
                onValueChange={(val) => {
                  setJobType(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full h-10 bg-white">
                  <SelectValue placeholder="ทั้งหมด" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  {uniqueOptions.jobTypes.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground">ผู้รับผิดชอบ</label>
              <Select
                value={responsible}
                onValueChange={(val) => {
                  setResponsible(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full h-10 bg-white">
                  <SelectValue placeholder="ทั้งหมด" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  {uniqueOptions.employees.map((e) => (
                    <SelectItem key={e} value={e}>
                      {e}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground">จังหวัด</label>
              <Select
                value={province}
                onValueChange={(val) => {
                  setProvince(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full h-10 bg-white">
                  <SelectValue placeholder="ทั้งหมด" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  {uniqueOptions.provinces.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground">ประเภทเป้าหมาย</label>
              <Select
                value={targetType}
                onValueChange={(val) => {
                  setTargetType(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full h-10 bg-white">
                  <SelectValue placeholder="ทั้งหมด" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  {uniqueOptions.targetTypes.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="text-xs font-medium h-9 px-3"
            >
              <X className="h-4 w-4 mr-2" /> ล้างตัวกรอง
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 2. KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-4 border shadow-sm rounded-2xl flex flex-col justify-between bg-blue-50/40">
          <div>
            <p className="text-xs font-semibold text-blue-900/60 uppercase">จำนวนกิจกรรม</p>
            <h3 className="text-2xl font-bold text-blue-900 mt-1">
              {kpiSummary.totalActivities}
            </h3>
          </div>
          <div className="text-[10px] text-blue-900/50 mt-2 flex items-center gap-1">
            <ClipboardList className="h-3.5 w-3.5" /> งานที่เสร็จสิ้นจริง
          </div>
        </Card>

        <Card className="p-4 border shadow-sm rounded-2xl flex flex-col justify-between bg-emerald-50/40">
          <div>
            <p className="text-xs font-semibold text-emerald-900/60 uppercase">จำนวนผู้เข้าร่วม</p>
            <h3 className="text-2xl font-bold text-emerald-900 mt-1">
              {new Intl.NumberFormat("th-TH").format(kpiSummary.totalParticipants)}
            </h3>
          </div>
          <div className="text-[10px] text-emerald-900/50 mt-2 flex items-center gap-1">
            <Users className="h-3.5 w-3.5" /> ราย/คน สะสม
          </div>
        </Card>

        <Card className="p-4 border shadow-sm rounded-2xl flex flex-col justify-between bg-indigo-50/40">
          <div>
            <p className="text-xs font-semibold text-indigo-900/60 uppercase">จำนวนลูกค้าใหม่</p>
            <h3 className="text-2xl font-bold text-indigo-900 mt-1">
              {kpiSummary.totalNewCustomers}
            </h3>
          </div>
          <div className="text-[10px] text-indigo-900/50 mt-2 flex items-center gap-1">
            <UserPlus className="h-3.5 w-3.5" /> รายการขึ้นทะเบียนใหม่
          </div>
        </Card>

        <Card className="p-4 border shadow-sm rounded-2xl flex flex-col justify-between bg-amber-50/40">
          <div>
            <p className="text-xs font-semibold text-amber-900/60 uppercase">จำนวนคำสั่งซื้อ</p>
            <h3 className="text-2xl font-bold text-amber-900 mt-1">
              {kpiSummary.totalOrders}
            </h3>
          </div>
          <div className="text-[10px] text-amber-900/50 mt-2 flex items-center gap-1">
            <ShoppingBag className="h-3.5 w-3.5" /> บิลจำหน่ายสินค้า
          </div>
        </Card>

        <Card className="p-4 border shadow-sm rounded-2xl flex flex-col justify-between bg-teal-50/40 col-span-1">
          <div>
            <p className="text-xs font-semibold text-teal-900/60 uppercase">ยอดขายจากกิจกรรม</p>
            <h3 className="text-xl font-bold text-teal-950 mt-1.5 truncate">
              {new Intl.NumberFormat("th-TH").format(kpiSummary.totalSales)}
            </h3>
          </div>
          <div className="text-[10px] text-teal-900/50 mt-2 flex items-center gap-1">
            <DollarSign className="h-3.5 w-3.5" /> บาท
          </div>
        </Card>

        <Card className="p-4 border shadow-sm rounded-2xl flex flex-col justify-between bg-rose-50/40 col-span-1">
          <div>
            <p className="text-xs font-semibold text-rose-900/60 uppercase">อัตราการบรรลุเป้า</p>
            <h3 className="text-2xl font-bold text-rose-900 mt-1">
              {kpiSummary.achievementRate.toFixed(1)}%
            </h3>
          </div>
          <div className="text-[10px] text-rose-900/50 mt-2 flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5" /> เทียบเป้าหมายยอดขาย
          </div>
        </Card>
      </div>

      {/* 3, 4, 5, 6, 7. Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 3. วิเคราะห์ประเภทงาน */}
        <Card className="rounded-2xl border shadow-sm bg-white overflow-hidden">
          <CardHeader className="p-4 pb-2 bg-slate-50/50">
            <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <ClipboardList className="h-4.5 w-4.5 text-blue-600" /> 3. วิเคราะห์ผลงานรายประเภทงาน
            </CardTitle>
            <CardDescription className="text-xs">
              สรุปจำนวนกิจกรรม ผู้เข้าร่วม ยอดขาย และเป้าหมายจำแนกตามประเภทงาน
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-100/30">
                    <TableHead className="text-xs font-bold px-4">ประเภทงาน</TableHead>
                    <TableHead className="text-xs font-bold text-center px-4 w-20">จำนวนงาน</TableHead>
                    <TableHead className="text-xs font-bold text-center px-4">ผู้เข้าร่วม (คน)</TableHead>
                    <TableHead className="text-xs font-bold text-right px-4">ยอดขาย (บาท)</TableHead>
                    <TableHead className="text-xs font-bold text-right px-4">Target vs Actual</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobTypeAnalytics.length > 0 ? (
                    jobTypeAnalytics.map((item) => (
                      <TableRow key={item.name}>
                        <TableCell className="text-xs font-semibold text-slate-700 px-4 py-3">
                          {item.name}
                        </TableCell>
                        <TableCell className="text-xs text-center px-4 py-3 font-bold text-slate-600">
                          {item.count}
                        </TableCell>
                        <TableCell className="text-xs text-center px-4 py-3 font-semibold text-slate-600">
                          {new Intl.NumberFormat("th-TH").format(item.participants)}
                        </TableCell>
                        <TableCell className="text-xs text-right px-4 py-3 font-bold text-slate-900">
                          {new Intl.NumberFormat("th-TH").format(item.sales)}
                        </TableCell>
                        <TableCell className="text-[10px] text-right px-4 py-3 font-semibold text-slate-500">
                          {new Intl.NumberFormat("th-TH").format(item.targetSales)} / {new Intl.NumberFormat("th-TH").format(item.sales)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-xs text-center py-6 text-muted-foreground">
                        ไม่มีข้อมูลกิจกรรมที่สำเร็จ
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* 4. วิเคราะห์พนักงาน */}
        <Card className="rounded-2xl border shadow-sm bg-white overflow-hidden">
          <CardHeader className="p-4 pb-2 bg-slate-50/50">
            <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Users className="h-4.5 w-4.5 text-emerald-600" /> 4. วิเคราะห์ผลงานรายบุคคล (พนักงาน)
            </CardTitle>
            <CardDescription className="text-xs">
              เปรียบเทียบผลงานการจัดกิจกรรม จำนวนลูกค้าใหม่ ยอดขาย และอัตราการบรรลุเป้าหมาย
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-100/30">
                    <TableHead className="text-xs font-bold px-4">ชื่อพนักงาน</TableHead>
                    <TableHead className="text-xs font-bold text-center px-4 w-20">จำนวนงาน</TableHead>
                    <TableHead className="text-xs font-bold text-center px-4">ลูกค้าใหม่ (ราย)</TableHead>
                    <TableHead className="text-xs font-bold text-right px-4">ยอดขาย (บาท)</TableHead>
                    <TableHead className="text-xs font-bold text-right px-4">บรรลุเป้า (%)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employeeAnalytics.length > 0 ? (
                    employeeAnalytics.map((emp) => (
                      <TableRow key={emp.name}>
                        <TableCell className="text-xs font-semibold text-slate-700 px-4 py-3">
                          {emp.name}
                        </TableCell>
                        <TableCell className="text-xs text-center px-4 py-3 font-bold text-slate-600">
                          {emp.count}
                        </TableCell>
                        <TableCell className="text-xs text-center px-4 py-3 font-semibold text-slate-600">
                          {emp.newCustomers}
                        </TableCell>
                        <TableCell className="text-xs text-right px-4 py-3 font-bold text-slate-900">
                          {new Intl.NumberFormat("th-TH").format(emp.sales)}
                        </TableCell>
                        <TableCell className="text-xs text-right px-4 py-3 font-bold text-rose-600">
                          {emp.rate.toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-xs text-center py-6 text-muted-foreground">
                        ไม่มีข้อมูลกิจกรรมที่สำเร็จ
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* 5. วิเคราะห์พื้นที่ */}
        <Card className="rounded-2xl border shadow-sm bg-white overflow-hidden">
          <CardHeader className="p-4 pb-2 bg-slate-50/50">
            <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <MapPin className="h-4.5 w-4.5 text-indigo-600" /> 5. วิเคราะห์สถิติตามพื้นที่ (จังหวัด)
            </CardTitle>
            <CardDescription className="text-xs">
              การกระจายตัวของกิจกรรม จำนวนผู้เข้าร่วม และยอดขายรวมสะสมตามจังหวัด
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-100/30">
                    <TableHead className="text-xs font-bold px-4">จังหวัด</TableHead>
                    <TableHead className="text-xs font-bold text-center px-4 w-20">จำนวนงาน</TableHead>
                    <TableHead className="text-xs font-bold text-center px-4">ผู้เข้าร่วม (คน)</TableHead>
                    <TableHead className="text-xs font-bold text-right px-4">ยอดขาย (บาท)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {areaAnalytics.length > 0 ? (
                    areaAnalytics.map((area) => (
                      <TableRow key={area.name}>
                        <TableCell className="text-xs font-semibold text-slate-700 px-4 py-3">
                          {area.name}
                        </TableCell>
                        <TableCell className="text-xs text-center px-4 py-3 font-bold text-slate-600">
                          {area.count}
                        </TableCell>
                        <TableCell className="text-xs text-center px-4 py-3 font-semibold text-slate-600">
                          {new Intl.NumberFormat("th-TH").format(area.participants)}
                        </TableCell>
                        <TableCell className="text-xs text-right px-4 py-3 font-bold text-slate-900">
                          {new Intl.NumberFormat("th-TH").format(area.sales)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-xs text-center py-6 text-muted-foreground">
                        ไม่มีข้อมูลกิจกรรมที่สำเร็จ
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* 6. วิเคราะห์เป้าหมาย */}
        <Card className="rounded-2xl border shadow-sm bg-white overflow-hidden">
          <CardHeader className="p-4 pb-2 bg-slate-50/50">
            <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Target className="h-4.5 w-4.5 text-amber-600" /> 6. วิเคราะห์สัดส่วนอัตราบรรลุตามเป้าหมาย
            </CardTitle>
            <CardDescription className="text-xs">
              วิเคราะห์ผลลัพธ์เปรียบเทียบกับตัวเป้าหมายของแต่ละประเภทกิจกรรม
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-100/30">
                    <TableHead className="text-xs font-bold px-4">ประเภทเป้าหมาย</TableHead>
                    <TableHead className="text-xs font-bold text-center px-4 w-20">จำนวนงาน</TableHead>
                    <TableHead className="text-xs font-bold text-right px-4">Target</TableHead>
                    <TableHead className="text-xs font-bold text-right px-4">Actual</TableHead>
                    <TableHead className="text-xs font-bold text-right px-4">บรรลุเป้า (%)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {targetAnalytics.length > 0 ? (
                    targetAnalytics.map((item) => (
                      <TableRow key={item.name}>
                        <TableCell className="text-xs font-semibold text-slate-700 px-4 py-3">
                          {item.name}
                        </TableCell>
                        <TableCell className="text-xs text-center px-4 py-3 font-bold text-slate-600">
                          {item.count}
                        </TableCell>
                        <TableCell className="text-xs text-right px-4 py-3 font-semibold text-slate-600">
                          {new Intl.NumberFormat("th-TH").format(item.target)} <span className="text-[10px] text-muted-foreground">{item.suffix}</span>
                        </TableCell>
                        <TableCell className="text-xs text-right px-4 py-3 font-bold text-slate-800">
                          {new Intl.NumberFormat("th-TH").format(item.actual)} <span className="text-[10px] text-muted-foreground">{item.suffix}</span>
                        </TableCell>
                        <TableCell className="text-xs text-right px-4 py-3 font-bold text-blue-600">
                          {item.rate.toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-xs text-center py-6 text-muted-foreground">
                        ไม่มีข้อมูลกิจกรรมที่สำเร็จ
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* 7. วิเคราะห์พืชเป้าหมาย (Full width on large screens) */}
        <Card className="rounded-2xl border shadow-sm bg-white overflow-hidden lg:col-span-2">
          <CardHeader className="p-4 pb-2 bg-slate-50/50">
            <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Leaf className="h-4.5 w-4.5 text-teal-600" /> 7. วิเคราะห์พืชเป้าหมายและปัญหาแปลงเพาะปลูก
            </CardTitle>
            <CardDescription className="text-xs">
              สรุปจำนวนแปลงทดลอง ปัญหาในพื้นที่เพาะปลูกที่ตรวจพบ และช่วงระยะพัฒนาการพืชตามชนิดพืช
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-100/30">
                    <TableHead className="text-xs font-bold px-4 w-32">ชนิดพืช</TableHead>
                    <TableHead className="text-xs font-bold text-center px-4 w-28">จำนวนแปลงสะสม</TableHead>
                    <TableHead className="text-xs font-bold px-4">ระยะการเจริญเติบโตที่พบ</TableHead>
                    <TableHead className="text-xs font-bold px-4">ปัญหาที่รายงานในพื้นที่</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plantAnalytics.length > 0 ? (
                    plantAnalytics.map((item) => (
                      <TableRow key={item.name}>
                        <TableCell className="text-xs font-semibold text-slate-800 px-4 py-3 flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-teal-500" />
                          {item.name}
                        </TableCell>
                        <TableCell className="text-xs text-center px-4 py-3 font-bold text-slate-600">
                          {item.plots} แปลง
                        </TableCell>
                        <TableCell className="text-xs px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {Array.from(item.growthStages).map((stage) => (
                              <span key={stage} className="px-2 py-0.5 text-[10px] rounded bg-slate-100 text-slate-600 font-semibold">
                                {stage}
                              </span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs px-4 py-3 text-rose-600 font-medium">
                          {item.problems.size > 0 ? (
                            <ul className="list-disc pl-4 space-y-0.5">
                              {Array.from(item.problems).map((prob, idx) => (
                                <li key={idx}>{prob}</li>
                              ))}
                            </ul>
                          ) : (
                            <span className="text-emerald-600 text-[11px] font-semibold">✓ ไม่พบปัญหาในแปลง</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-xs text-center py-6 text-muted-foreground">
                        ไม่มีข้อมูลรายงานพืชเป้าหมายในกิจกรรมที่สำเร็จ
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 8. ตารางรายงาน */}
      <Card className="rounded-2xl border shadow-sm bg-white overflow-hidden">
        <CardHeader className="p-4 pb-2 bg-slate-50/50">
          <CardTitle className="text-sm font-bold text-slate-800">
            8. ตารางรายงานผลการดำเนินกิจกรรมทั้งหมด
          </CardTitle>
          <CardDescription className="text-xs">
            แสดงผลรายการกิจกรรมและข้อมูลดำเนินงานจริงตามตัวกรองที่เลือก
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-100/30">
                  <TableHead className="text-xs font-bold px-4 w-32">เลขที่แผน</TableHead>
                  <TableHead className="text-xs font-bold px-4 w-28">วันที่จัดกิจกรรม</TableHead>
                  <TableHead className="text-xs font-bold px-4">ประเภทงาน</TableHead>
                  <TableHead className="text-xs font-bold px-4">ชื่อกิจกรรม</TableHead>
                  <TableHead className="text-xs font-bold px-4">ผู้รับผิดชอบ</TableHead>
                  <TableHead className="text-xs font-bold px-4">จังหวัด</TableHead>
                  <TableHead className="text-xs font-bold text-center px-4 w-28">ผู้เข้าร่วม</TableHead>
                  <TableHead className="text-xs font-bold text-right px-4">ยอดขาย (บาท)</TableHead>
                  <TableHead className="text-xs font-bold px-4 max-w-xs">ผลการดำเนินงาน</TableHead>
                  <TableHead className="text-xs font-bold text-center px-4 w-28">สถานะ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length > 0 ? (
                  paginatedData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-xs font-bold text-slate-600 px-4 py-3">
                        {item.id}
                      </TableCell>
                      <TableCell className="text-xs px-4 py-3">{item.activityDate}</TableCell>
                      <TableCell className="text-xs px-4 py-3 font-semibold text-slate-700">{item.jobType}</TableCell>
                      <TableCell
                        className="text-xs px-4 py-3 max-w-xs truncate font-medium text-slate-900"
                        title={item.activityName}
                      >
                        {item.activityName}
                      </TableCell>
                      <TableCell className="text-xs px-4 py-3 font-medium text-slate-600">{item.responsible}</TableCell>
                      <TableCell className="text-xs px-4 py-3 text-slate-600">{item.province}</TableCell>
                      <TableCell className="text-xs text-center px-4 py-3 font-semibold text-slate-800">
                        {item.status === "FINISHED" ? `${item.actualParticipants} คน` : "-"}
                      </TableCell>
                      <TableCell className="text-xs text-right px-4 py-3 font-bold text-slate-900">
                        {item.status === "FINISHED" ? new Intl.NumberFormat("th-TH").format(item.actualSales) : "-"}
                      </TableCell>
                      <TableCell className="text-xs px-4 py-3 max-w-xs truncate text-slate-600" title={item.performanceResult}>
                        {item.status === "FINISHED" ? item.performanceResult : "รอการเสร็จสิ้นแผนงาน"}
                      </TableCell>
                      <TableCell className="text-xs text-center px-4 py-3">
                        {getStatusBadge(item.status)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={10} className="text-xs text-center py-8 text-muted-foreground">
                      ไม่พบรายการข้อมูลการดำเนินงานตามตัวกรองที่เลือก
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t">
              <span className="text-xs text-muted-foreground">
                แสดงหน้า {currentPage} จาก {totalPages} (ทั้งหมด {filteredData.length} รายการ)
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
