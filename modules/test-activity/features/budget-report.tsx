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
  X,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  MapPin,
  ClipboardList,
  AlertCircle,
  Users,
  Wallet,
  Coins,
  Percent,
} from "lucide-react";
import { mockTripPlans, TripPlanMock } from "../infrastructure/mock-data";

export function BudgetReport() {
  // กรองผ่าน React States
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [budgetType, setBudgetType] = useState("all");
  const [jobType, setJobType] = useState("all");
  const [responsible, setResponsible] = useState("all");
  const [approver, setApprover] = useState("all");
  const [province, setProvince] = useState("all");
  const [district, setDistrict] = useState("all");
  const [status, setStatus] = useState("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // หา Unique Options สำหรับ Selects จากข้อมูลจำลอง
  const uniqueOptions = useMemo(() => {
    const budgetTypes = Array.from(new Set(mockTripPlans.map((d) => d.budgetType)));
    const jobTypes = Array.from(new Set(mockTripPlans.map((d) => d.jobType)));
    const employees = Array.from(new Set(mockTripPlans.map((d) => d.responsible)));
    const approvers = Array.from(new Set(mockTripPlans.map((d) => d.approver)));
    const provinces = Array.from(new Set(mockTripPlans.map((d) => d.province)));
    const districts = Array.from(new Set(mockTripPlans.map((d) => d.district)));

    return { budgetTypes, jobTypes, employees, approvers, provinces, districts };
  }, []);

  // ล้างตัวกรอง
  const resetFilters = () => {
    setStartDate("");
    setEndDate("");
    setBudgetType("all");
    setJobType("all");
    setResponsible("all");
    setApprover("all");
    setProvince("all");
    setDistrict("all");
    setStatus("all");
    setCurrentPage(1);
  };

  // กรองข้อมูลตามที่กำหนดตัวกรองไว้
  const filteredData = useMemo(() => {
    return mockTripPlans.filter((item) => {
      if (startDate && item.activityDate < startDate) return false;
      if (endDate && item.activityDate > endDate) return false;
      if (budgetType !== "all" && item.budgetType !== budgetType) return false;
      if (jobType !== "all" && item.jobType !== jobType) return false;
      if (responsible !== "all" && item.responsible !== responsible) return false;
      if (approver !== "all" && item.approver !== approver) return false;
      if (province !== "all" && item.province !== province) return false;
      if (district !== "all" && item.district !== district) return false;
      if (status !== "all" && item.status !== status) return false;
      return true;
    });
  }, [
    startDate,
    endDate,
    budgetType,
    jobType,
    responsible,
    approver,
    province,
    district,
    status,
  ]);

  // 2. KPI Summary Calculation
  const kpiSummary = useMemo(() => {
    // งบประมาณทั้งหมด (ตามแผน/ได้รับอนุมัติ เฉพาะแผนที่ได้รับการอนุมัติ APPROVED หรือเสร็จสิ้น FINISHED)
    const activePlans = filteredData.filter(
      (item) => item.status === "APPROVED" || item.status === "FINISHED"
    );
    const totalBudget = activePlans.reduce((sum, curr) => sum + curr.budget, 0);

    // งบประมาณที่ใช้ไป (เฉพาะที่มีการใช้จริงในงาน FINISHED)
    const finishedPlans = filteredData.filter((item) => item.status === "FINISHED");
    const spentBudget = finishedPlans.reduce((sum, curr) => sum + curr.actualBudget, 0);

    // งบประมาณคงเหลือ
    const remainingBudget = totalBudget - spentBudget;

    // จำนวนแผนที่ใช้งบประมาณ (นับเฉพาะแผนที่มีการจัดสรรงบประมาณ > 0)
    const plansCount = filteredData.filter((item) => item.budget > 0).length;

    // ค่าใช้จ่ายอื่นรวม
    const totalOtherExpenses = finishedPlans.reduce((sum, curr) => sum + curr.otherExpenses, 0);

    return {
      totalBudget,
      spentBudget,
      remainingBudget,
      plansCount,
      totalOtherExpenses,
    };
  }, [filteredData]);

  // 3. วิเคราะห์ประเภทงบประมาณ
  const budgetTypeAnalytics = useMemo(() => {
    const groups: Record<
      string,
      { name: string; count: number; budgetAllocated: number; budgetSpent: number }
    > = {};

    filteredData.forEach((item) => {
      // คำนวณวิเคราะห์จากแผนที่ใช้งานงบจริง (APPROVED และ FINISHED)
      if (item.status === "APPROVED" || item.status === "FINISHED") {
        if (!groups[item.budgetType]) {
          groups[item.budgetType] = {
            name: item.budgetType,
            count: 0,
            budgetAllocated: 0,
            budgetSpent: 0,
          };
        }
        groups[item.budgetType].count += 1;
        groups[item.budgetType].budgetAllocated += item.budget;
        if (item.status === "FINISHED") {
          groups[item.budgetType].budgetSpent += item.actualBudget;
        }
      }
    });

    return Object.values(groups).map((item) => {
      const remaining = item.budgetAllocated - item.budgetSpent;
      return { ...item, remaining };
    });
  }, [filteredData]);

  // 4. วิเคราะห์ตามพนักงาน
  const employeeAnalytics = useMemo(() => {
    const groups: Record<
      string,
      { name: string; count: number; budgetSpent: number; otherExpenses: number }
    > = {};

    filteredData.forEach((item) => {
      if (item.status === "FINISHED") {
        if (!groups[item.responsible]) {
          groups[item.responsible] = {
            name: item.responsible,
            count: 0,
            budgetSpent: 0,
            otherExpenses: 0,
          };
        }
        groups[item.responsible].count += 1;
        groups[item.responsible].budgetSpent += item.actualBudget;
        groups[item.responsible].otherExpenses += item.otherExpenses;
      }
    });

    return Object.values(groups).map((item) => {
      const totalBudget = item.budgetSpent + item.otherExpenses;
      return { ...item, totalBudget };
    }).sort((a, b) => b.totalBudget - a.totalBudget);
  }, [filteredData]);

  // 5. วิเคราะห์ตามประเภทงาน
  const jobTypeAnalytics = useMemo(() => {
    const groups: Record<
      string,
      { name: string; count: number; budgetSpent: number; otherExpenses: number }
    > = {};

    filteredData.forEach((item) => {
      if (item.status === "FINISHED") {
        if (!groups[item.jobType]) {
          groups[item.jobType] = {
            name: item.jobType,
            count: 0,
            budgetSpent: 0,
            otherExpenses: 0,
          };
        }
        groups[item.jobType].count += 1;
        groups[item.jobType].budgetSpent += item.actualBudget;
        groups[item.jobType].otherExpenses += item.otherExpenses;
      }
    });

    return Object.values(groups);
  }, [filteredData]);

  // 6. วิเคราะห์ตามพื้นที่
  const areaAnalytics = useMemo(() => {
    const groups: Record<
      string,
      { name: string; count: number; totalBudget: number }
    > = {};

    filteredData.forEach((item) => {
      if (item.status === "FINISHED" || item.status === "APPROVED") {
        if (!groups[item.province]) {
          groups[item.province] = {
            name: item.province,
            count: 0,
            totalBudget: 0,
          };
        }
        groups[item.province].count += 1;
        if (item.status === "FINISHED") {
          groups[item.province].totalBudget += item.actualBudget + item.otherExpenses;
        } else {
          groups[item.province].totalBudget += item.budget;
        }
      }
    });

    return Object.values(groups).sort((a, b) => b.totalBudget - a.totalBudget);
  }, [filteredData]);

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
          รายงานงบประมาณ (Budget Report)
        </h1>
        <p className="text-muted-foreground text-sm">
          สรุปการใช้งบประมาณและวิเคราะห์ต้นทุนการจัดกิจกรรมส่งเสริมการตลาดและบริการ
        </p>
      </div>

      {/* 1. ตัวกรองข้อมูล (Filter) */}
      <Card className="rounded-2xl border bg-white/70 shadow-sm backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
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
              <label className="text-xs font-semibold text-muted-foreground">ประเภทงบประมาณ</label>
              <Select
                value={budgetType}
                onValueChange={(val) => {
                  setBudgetType(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full h-10 bg-white">
                  <SelectValue placeholder="ทั้งหมด" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  {uniqueOptions.budgetTypes.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <label className="text-xs font-semibold text-muted-foreground">ผู้อนุมัติ</label>
              <Select
                value={approver}
                onValueChange={(val) => {
                  setApprover(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full h-10 bg-white">
                  <SelectValue placeholder="ทั้งหมด" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  {uniqueOptions.approvers.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
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
              <label className="text-xs font-semibold text-muted-foreground">อำเภอ/เขต</label>
              <Select
                value={district}
                onValueChange={(val) => {
                  setDistrict(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full h-10 bg-white">
                  <SelectValue placeholder="ทั้งหมด" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  {uniqueOptions.districts.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground">สถานะ</label>
              <Select
                value={status}
                onValueChange={(val) => {
                  setStatus(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full h-10 bg-white">
                  <SelectValue placeholder="ทั้งหมด" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="PENDING">รออนุมัติ</SelectItem>
                  <SelectItem value="APPROVED">อนุมัติแล้ว</SelectItem>
                  <SelectItem value="REJECTED">ไม้อนุมัติ</SelectItem>
                  <SelectItem value="CANCELLED">ยกเลิก</SelectItem>
                  <SelectItem value="FINISHED">เสร็จสิ้น</SelectItem>
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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4 border shadow-sm rounded-2xl flex flex-col justify-between bg-blue-50/40">
          <div>
            <p className="text-xs font-semibold text-blue-900/60 uppercase">งบประมาณทั้งหมด</p>
            <h3 className="text-xl sm:text-2xl font-bold text-blue-900 mt-1">
              {new Intl.NumberFormat("th-TH").format(kpiSummary.totalBudget)}
            </h3>
          </div>
          <div className="text-[10px] text-blue-900/50 mt-2 flex items-center gap-1">
            <Wallet className="h-3.5 w-3.5" /> งบตามแผนที่อนุมัติ (บาท)
          </div>
        </Card>

        <Card className="p-4 border shadow-sm rounded-2xl flex flex-col justify-between bg-emerald-50/40">
          <div>
            <p className="text-xs font-semibold text-emerald-900/60 uppercase">งบประมาณที่ใช้ไป</p>
            <h3 className="text-xl sm:text-2xl font-bold text-emerald-900 mt-1">
              {new Intl.NumberFormat("th-TH").format(kpiSummary.spentBudget)}
            </h3>
          </div>
          <div className="text-[10px] text-emerald-900/50 mt-2 flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" /> จากงานที่เสร็จสิ้น (บาท)
          </div>
        </Card>

        <Card className="p-4 border shadow-sm rounded-2xl flex flex-col justify-between bg-teal-50/40">
          <div>
            <p className="text-xs font-semibold text-teal-900/60 uppercase">งบประมาณคงเหลือ</p>
            <h3 className="text-xl sm:text-2xl font-bold text-teal-900 mt-1">
              {new Intl.NumberFormat("th-TH").format(kpiSummary.remainingBudget)}
            </h3>
          </div>
          <div className="text-[10px] text-teal-900/50 mt-2 flex items-center gap-1">
            <Coins className="h-3.5 w-3.5" /> งบตามแผนที่เหลืออยู่ (บาท)
          </div>
        </Card>

        <Card className="p-4 border shadow-sm rounded-2xl flex flex-col justify-between bg-amber-50/40">
          <div>
            <p className="text-xs font-semibold text-amber-900/60 uppercase">แผนที่ใช้งบประมาณ</p>
            <h3 className="text-xl sm:text-2xl font-bold text-amber-900 mt-1">
              {kpiSummary.plansCount}
            </h3>
          </div>
          <div className="text-[10px] text-amber-900/50 mt-2 flex items-center gap-1">
            <ClipboardList className="h-3.5 w-3.5" /> แผนงานที่มีการตั้งงบ (แผน)
          </div>
        </Card>

        <Card className="p-4 border shadow-sm rounded-2xl flex flex-col justify-between bg-rose-50/40">
          <div>
            <p className="text-xs font-semibold text-rose-900/60 uppercase">ค่าใช้จ่ายอื่นรวม</p>
            <h3 className="text-xl sm:text-2xl font-bold text-rose-900 mt-1">
              {new Intl.NumberFormat("th-TH").format(kpiSummary.totalOtherExpenses)}
            </h3>
          </div>
          <div className="text-[10px] text-rose-900/50 mt-2 flex items-center gap-1">
            <DollarSign className="h-3.5 w-3.5" /> ยอดนอกงบหลักสะสม (บาท)
          </div>
        </Card>
      </div>

      {/* 3, 4, 5, 6. Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* 3. วิเคราะห์ประเภทงบประมาณ */}
        <Card className="rounded-2xl border shadow-sm bg-white overflow-hidden">
          <CardHeader className="p-4 pb-2 bg-slate-50/50">
            <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Coins className="h-4.5 w-4.5 text-blue-600" /> 3. วิเคราะห์ตามประเภทงบประมาณ
            </CardTitle>
            <CardDescription className="text-xs">
              การเปรียบเทียบงบประมาณแผนจริง งบประมาณที่เบิกจ่าย และงบประมาณคงเหลือรายหมวดงบ
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-100/30">
                    <TableHead className="text-xs font-bold px-4">ประเภทงบประมาณ</TableHead>
                    <TableHead className="text-xs font-bold text-center px-4 w-20">จำนวนแผน</TableHead>
                    <TableHead className="text-xs font-bold text-right px-4">งบประมาณได้รับ</TableHead>
                    <TableHead className="text-xs font-bold text-right px-4">งบประมาณใช้จริง</TableHead>
                    <TableHead className="text-xs font-bold text-right px-4">งบประมาณคงเหลือ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {budgetTypeAnalytics.length > 0 ? (
                    budgetTypeAnalytics.map((item) => (
                      <TableRow key={item.name}>
                        <TableCell className="text-xs font-semibold text-slate-700 px-4 py-3">
                          {item.name}
                        </TableCell>
                        <TableCell className="text-xs text-center px-4 py-3 font-bold text-slate-600">
                          {item.count}
                        </TableCell>
                        <TableCell className="text-xs text-right px-4 py-3 font-semibold text-slate-700">
                          {new Intl.NumberFormat("th-TH").format(item.budgetAllocated)}
                        </TableCell>
                        <TableCell className="text-xs text-right px-4 py-3 font-bold text-slate-900">
                          {new Intl.NumberFormat("th-TH").format(item.budgetSpent)}
                        </TableCell>
                        <TableCell className="text-xs text-right px-4 py-3 font-bold text-emerald-600">
                          {new Intl.NumberFormat("th-TH").format(item.remaining)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-xs text-center py-6 text-muted-foreground">
                        ไม่มีข้อมูลแผนที่มีการตั้งงบประมาณ
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* 4. วิเคราะห์ตามพนักงาน */}
        <Card className="rounded-2xl border shadow-sm bg-white overflow-hidden">
          <CardHeader className="p-4 pb-2 bg-slate-50/50">
            <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Users className="h-4.5 w-4.5 text-emerald-600" /> 4. วิเคราะห์งบประมาณและต้นทุนพนักงาน
            </CardTitle>
            <CardDescription className="text-xs">
              เปรียบเทียบงบประมาณที่ใช้เบิกและค่าใช้จ่ายอื่นรายบุคคลในการดำเนินงาน
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-100/30">
                    <TableHead className="text-xs font-bold px-4">ชื่อพนักงาน</TableHead>
                    <TableHead className="text-xs font-bold text-center px-4 w-20">จำนวนแผน</TableHead>
                    <TableHead className="text-xs font-bold text-right px-4">งบประมาณที่ใช้</TableHead>
                    <TableHead className="text-xs font-bold text-right px-4">ค่าใช้จ่ายอื่น</TableHead>
                    <TableHead className="text-xs font-bold text-right px-4">งบประมาณรวม</TableHead>
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
                        <TableCell className="text-xs text-right px-4 py-3 font-semibold text-slate-600">
                          {new Intl.NumberFormat("th-TH").format(emp.budgetSpent)}
                        </TableCell>
                        <TableCell className="text-xs text-right px-4 py-3 font-semibold text-slate-600">
                          {new Intl.NumberFormat("th-TH").format(emp.otherExpenses)}
                        </TableCell>
                        <TableCell className="text-xs text-right px-4 py-3 font-bold text-slate-900">
                          {new Intl.NumberFormat("th-TH").format(emp.totalBudget)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-xs text-center py-6 text-muted-foreground">
                        ไม่มีข้อมูลแผนงานที่ใช้จ่ายแล้วเสร็จ
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* 5. วิเคราะห์ตามประเภทงาน */}
        <Card className="rounded-2xl border shadow-sm bg-white overflow-hidden">
          <CardHeader className="p-4 pb-2 bg-slate-50/50">
            <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <ClipboardList className="h-4.5 w-4.5 text-indigo-600" /> 5. วิเคราะห์สัดส่วนงบประมาณรายประเภทงาน
            </CardTitle>
            <CardDescription className="text-xs">
              สรุปงบประมาณจริงและค่าใช้จ่ายอื่นรวมแยกจำแนกตามวัตถุประสงค์งาน
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-100/30">
                    <TableHead className="text-xs font-bold px-4">ประเภทงาน</TableHead>
                    <TableHead className="text-xs font-bold text-center px-4 w-20">จำนวนแผน</TableHead>
                    <TableHead className="text-xs font-bold text-right px-4">งบประมาณที่ใช้</TableHead>
                    <TableHead className="text-xs font-bold text-right px-4">ค่าใช้จ่ายอื่น</TableHead>
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
                        <TableCell className="text-xs text-right px-4 py-3 font-semibold text-slate-800">
                          {new Intl.NumberFormat("th-TH").format(item.budgetSpent)}
                        </TableCell>
                        <TableCell className="text-xs text-right px-4 py-3 font-semibold text-slate-800">
                          {new Intl.NumberFormat("th-TH").format(item.otherExpenses)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-xs text-center py-6 text-muted-foreground">
                        ไม่มีข้อมูลแผนงานที่ใช้จ่ายแล้วเสร็จ
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* 6. วิเคราะห์ตามพื้นที่ */}
        <Card className="rounded-2xl border shadow-sm bg-white overflow-hidden">
          <CardHeader className="p-4 pb-2 bg-slate-50/50">
            <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <MapPin className="h-4.5 w-4.5 text-amber-600" /> 6. วิเคราะห์การใช้งบประมาณรายจังหวัด
            </CardTitle>
            <CardDescription className="text-xs">
              สรุปงบประมาณรวมที่ได้รับจัดสรรตามพื้นที่ตั้งของพื้นที่จัดกิจกรรม
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-100/30">
                    <TableHead className="text-xs font-bold px-4">จังหวัด</TableHead>
                    <TableHead className="text-xs font-bold text-center px-4 w-20">จำนวนแผน</TableHead>
                    <TableHead className="text-xs font-bold text-right px-4">งบประมาณรวม</TableHead>
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
                        <TableCell className="text-xs text-right px-4 py-3 font-bold text-slate-900">
                          {new Intl.NumberFormat("th-TH").format(area.totalBudget)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-xs text-center py-6 text-muted-foreground">
                        ไม่มีข้อมูลแผนการจัดสรรงบประมาณในแต่ละจังหวัด
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 7. ตารางรายงาน */}
      <Card className="rounded-2xl border shadow-sm bg-white overflow-hidden">
        <CardHeader className="p-4 pb-2 bg-slate-50/50">
          <CardTitle className="text-sm font-bold text-slate-800">
            7. รายละเอียดตารางวิเคราะห์งบประมาณรายกิจกรรม
          </CardTitle>
          <CardDescription className="text-xs">
            สืบค้นและแสดงผลงบประมาณที่ตั้งไว้ งบที่ใช้ไปจริง และค่าใช้จ่ายเบ็ดเตล็ดรวมรายกิจกรรม
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-100/30">
                  <TableHead className="text-xs font-bold px-4 w-32">เลขที่แผน</TableHead>
                  <TableHead className="text-xs font-bold px-4 w-28">วันที่จัดกิจกรรม</TableHead>
                  <TableHead className="text-xs font-bold px-4">ผู้รับผิดชอบ</TableHead>
                  <TableHead className="text-xs font-bold px-4">ประเภทงาน</TableHead>
                  <TableHead className="text-xs font-bold px-4">ประเภทงบประมาณ</TableHead>
                  <TableHead className="text-xs font-bold text-right px-4">งบประมาณที่ตั้ง</TableHead>
                  <TableHead className="text-xs font-bold text-right px-4">ค่าใช้จ่ายอื่น</TableHead>
                  <TableHead className="text-xs font-bold text-right px-4">งบประมาณรวม</TableHead>
                  <TableHead className="text-xs font-bold text-center px-4 w-28">สถานะ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length > 0 ? (
                  paginatedData.map((item) => {
                    const totalCost =
                      item.status === "FINISHED"
                        ? item.actualBudget + item.otherExpenses
                        : item.budget + item.otherExpenses;
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="text-xs font-bold text-slate-600 px-4 py-3">
                          {item.id}
                        </TableCell>
                        <TableCell className="text-xs px-4 py-3">{item.activityDate}</TableCell>
                        <TableCell className="text-xs px-4 py-3 font-semibold text-slate-600">
                          {item.responsible}
                        </TableCell>
                        <TableCell className="text-xs px-4 py-3 text-slate-600">
                          {item.jobType}
                        </TableCell>
                        <TableCell className="text-xs px-4 py-3 text-slate-600">
                          {item.budgetType}
                        </TableCell>
                        <TableCell className="text-xs text-right px-4 py-3 font-bold text-slate-700">
                          {new Intl.NumberFormat("th-TH").format(item.budget)}
                        </TableCell>
                        <TableCell className="text-xs text-right px-4 py-3 font-semibold text-slate-600">
                          {item.status === "FINISHED"
                            ? new Intl.NumberFormat("th-TH").format(item.otherExpenses)
                            : "-"}
                        </TableCell>
                        <TableCell className="text-xs text-right px-4 py-3 font-bold text-slate-900">
                          {new Intl.NumberFormat("th-TH").format(totalCost)}
                        </TableCell>
                        <TableCell className="text-xs text-center px-4 py-3">
                          {getStatusBadge(item.status)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-xs text-center py-8 text-muted-foreground">
                      ไม่พบรายการข้อมูลการใช้งบประมาณตามตัวกรองที่เลือก
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
