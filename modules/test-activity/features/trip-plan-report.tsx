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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { mockTripPlans, TripPlanMock } from "../infrastructure/mock-data";
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
  MapPin,
  Target as TargetIcon,
  Eye,
  ClipboardList,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
];

export function TripPlanReport() {
  // กรองผ่าน React States
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [jobType, setJobType] = useState("all");
  const [status, setStatus] = useState("all");
  const [responsible, setResponsible] = useState("all");
  const [approver, setApprover] = useState("all");
  const [province, setProvince] = useState("all");
  const [district, setDistrict] = useState("all");
  const [targetType, setTargetType] = useState("all");
  const [budgetType, setBudgetType] = useState("all");
  const [selectedPlan, setSelectedPlan] = useState<TripPlanMock | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // หา Unique Options สำหรับ Selects
  const uniqueOptions = useMemo(() => {
    const jobTypes = Array.from(new Set(mockTripPlans.map((d) => d.jobType)));
    const statuses = Array.from(new Set(mockTripPlans.map((d) => d.status)));
    const employees = Array.from(
      new Set(mockTripPlans.map((d) => d.responsible)),
    );
    const approvers = Array.from(new Set(mockTripPlans.map((d) => d.approver)));
    const provinces = Array.from(new Set(mockTripPlans.map((d) => d.province)));
    const districts = Array.from(new Set(mockTripPlans.map((d) => d.district)));
    const targetTypes = Array.from(
      new Set(mockTripPlans.map((d) => d.targetType)),
    );
    const budgetTypes = Array.from(
      new Set(mockTripPlans.map((d) => d.budgetType)),
    );

    return {
      jobTypes,
      statuses,
      employees,
      approvers,
      provinces,
      districts,
      targetTypes,
      budgetTypes,
    };
  }, []);

  // ล้างตัวกรอง
  const resetFilters = () => {
    setStartDate("");
    setEndDate("");
    setJobType("all");
    setStatus("all");
    setResponsible("all");
    setApprover("all");
    setProvince("all");
    setDistrict("all");
    setTargetType("all");
    setBudgetType("all");
    setCurrentPage(1);
  };

  // คำนวณกรองข้อมูล
  const filteredData = useMemo(() => {
    return mockTripPlans.filter((item) => {
      if (startDate && item.activityDate < startDate) return false;
      if (endDate && item.activityDate > endDate) return false;
      if (jobType !== "all" && item.jobType !== jobType) return false;
      if (status !== "all" && item.status !== status) return false;
      if (responsible !== "all" && item.responsible !== responsible)
        return false;
      if (approver !== "all" && item.approver !== approver) return false;
      if (province !== "all" && item.province !== province) return false;
      if (district !== "all" && item.district !== district) return false;
      if (targetType !== "all" && item.targetType !== targetType) return false;
      if (budgetType !== "all" && item.budgetType !== budgetType) return false;
      return true;
    });
  }, [
    startDate,
    endDate,
    jobType,
    status,
    responsible,
    approver,
    province,
    district,
    targetType,
    budgetType,
  ]);

  // KPI Summary calculations
  const kpiSummary = useMemo(() => {
    const total = filteredData.length;
    const pending = filteredData.filter((i) => i.status === "PENDING").length;
    const approved = filteredData.filter((i) => i.status === "APPROVED").length;
    const rejected = filteredData.filter((i) => i.status === "REJECTED").length;
    const cancelled = filteredData.filter(
      (i) => i.status === "CANCELLED",
    ).length;
    const finished = filteredData.filter((i) => i.status === "FINISHED").length;
    const totalBudget = filteredData.reduce(
      (acc, curr) => acc + curr.budget,
      0,
    );

    return {
      total,
      pending,
      approved,
      rejected,
      cancelled,
      finished,
      totalBudget,
    };
  }, [filteredData]);

  // Job Type Analytics Calculation
  const jobTypeAnalytics = useMemo(() => {
    const groups: Record<
      string,
      { name: string; count: number; budget: number }
    > = {};
    filteredData.forEach((item) => {
      if (!groups[item.jobType]) {
        groups[item.jobType] = { name: item.jobType, count: 0, budget: 0 };
      }
      groups[item.jobType].count += 1;
      groups[item.jobType].budget += item.budget;
    });
    return Object.values(groups);
  }, [filteredData]);

  // Budget Type Analytics Calculation
  const budgetTypeAnalytics = useMemo(() => {
    const groups: Record<
      string,
      { name: string; value: number; count: number }
    > = {};
    filteredData.forEach((item) => {
      if (!groups[item.budgetType]) {
        groups[item.budgetType] = { name: item.budgetType, value: 0, count: 0 };
      }
      groups[item.budgetType].value += item.budget;
      groups[item.budgetType].count += 1;
    });
    return Object.values(groups);
  }, [filteredData]);

  // Target Type Analytics Calculation
  const targetTypeAnalytics = useMemo(() => {
    const groups: Record<string, { name: string; count: number }> = {};
    filteredData.forEach((item) => {
      if (!groups[item.targetType]) {
        groups[item.targetType] = { name: item.targetType, count: 0 };
      }
      groups[item.targetType].count += 1;
    });
    return Object.values(groups);
  }, [filteredData]);

  // Employee Analytics Calculation
  const employeeAnalytics = useMemo(() => {
    const groups: Record<
      string,
      { name: string; count: number; budget: number }
    > = {};
    filteredData.forEach((item) => {
      if (!groups[item.responsible]) {
        groups[item.responsible] = {
          name: item.responsible,
          count: 0,
          budget: 0,
        };
      }
      groups[item.responsible].count += 1;
      groups[item.responsible].budget += item.budget;
    });
    return Object.values(groups).sort((a, b) => b.budget - a.budget);
  }, [filteredData]);

  // Area Analytics Calculation
  const areaAnalytics = useMemo(() => {
    const groups: Record<
      string,
      { name: string; count: number; budget: number }
    > = {};
    filteredData.forEach((item) => {
      if (!groups[item.province]) {
        groups[item.province] = { name: item.province, count: 0, budget: 0 };
      }
      groups[item.province].count += 1;
      groups[item.province].budget += item.budget;
    });
    return Object.values(groups).sort((a, b) => b.budget - a.budget);
  }, [filteredData]);

  // Pagination Calculation
  const paginatedPlans = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // สี Badge สถานะ
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
          รายงานแผนการออกปฏิบัติงาน (Trip Plan)
        </h1>
        <p className="text-muted-foreground text-sm">
          ข้อมูลสรุปและวิเคราะห์ผลการปฏิบัติงานของพนักงาน
        </p>
      </div>

      {/* 1. Filters Card */}
      <Card className="rounded-2xl border bg-white/70 shadow-sm backdrop-blur-sm">
        <CardHeader className="p-4 pb-0">
          <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Filter className="h-4 w-4" /> ตัวกรองรายงาน
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* ช่วงวันที่ */}
            <div className="grid gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                วันที่เริ่มต้น
              </label>
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
              <label className="text-xs font-semibold text-muted-foreground">
                วันที่สิ้นสุด
              </label>
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

            {/* ประเภทงาน */}
            <div className="grid gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                ประเภทงาน
              </label>
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

            {/* สถานะ */}
            <div className="grid gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                สถานะ
              </label>
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

            {/* ผู้รับผิดชอบ */}
            <div className="grid gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                ผู้รับผิดชอบ
              </label>
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

            {/* ผู้อนุมัติ */}
            <div className="grid gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                ผู้อนุมัติ
              </label>
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

            {/* จังหวัด */}
            <div className="grid gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                จังหวัด
              </label>
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

            {/* อำเภอ */}
            <div className="grid gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                อำเภอ
              </label>
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

            {/* ประเภทเป้าหมาย */}
            <div className="grid gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                ประเภทเป้าหมาย
              </label>
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

            {/* ประเภทงบประมาณ */}
            <div className="grid gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                ประเภทงบประมาณ
              </label>
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
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card className="p-4 border shadow-sm rounded-2xl flex flex-col justify-between bg-blue-50/50">
          <div>
            <p className="text-xs font-semibold text-blue-900/60 uppercase">
              แผนทั้งหมด
            </p>
            <h3 className="text-2xl font-bold text-blue-900 mt-1">
              {kpiSummary.total}
            </h3>
          </div>
          <div className="text-[10px] text-blue-900/50 mt-2 flex items-center gap-1">
            <Calendar className="h-3 w-3" /> แผนปฏิบัติงาน
          </div>
        </Card>

        <Card className="p-4 border shadow-sm rounded-2xl flex flex-col justify-between bg-amber-50/50">
          <div>
            <p className="text-xs font-semibold text-amber-900/60 uppercase">
              รออนุมัติ
            </p>
            <h3 className="text-2xl font-bold text-amber-900 mt-1">
              {kpiSummary.pending}
            </h3>
          </div>
          <div className="text-[10px] text-amber-900/50 mt-2 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> รอการยืนยัน
          </div>
        </Card>

        <Card className="p-4 border shadow-sm rounded-2xl flex flex-col justify-between bg-emerald-50/50">
          <div>
            <p className="text-xs font-semibold text-emerald-900/60 uppercase">
              อนุมัติแล้ว
            </p>
            <h3 className="text-2xl font-bold text-emerald-900 mt-1">
              {kpiSummary.approved}
            </h3>
          </div>
          <div className="text-[10px] text-emerald-900/50 mt-2 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> พร้อมดำเนินงาน
          </div>
        </Card>

        <Card className="p-4 border shadow-sm rounded-2xl flex flex-col justify-between bg-rose-50/50">
          <div>
            <p className="text-xs font-semibold text-rose-900/60 uppercase">
              ไม้อนุมัติ
            </p>
            <h3 className="text-2xl font-bold text-rose-900 mt-1">
              {kpiSummary.rejected}
            </h3>
          </div>
          <div className="text-[10px] text-rose-900/50 mt-2 flex items-center gap-1">
            <XCircle className="h-3 w-3" /> ไม่ผ่านเงื่อนไข
          </div>
        </Card>

        <Card className="p-4 border shadow-sm rounded-2xl flex flex-col justify-between bg-slate-100/50">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">
              ยกเลิก
            </p>
            <h3 className="text-2xl font-bold text-slate-700 mt-1">
              {kpiSummary.cancelled}
            </h3>
          </div>
          <div className="text-[10px] text-slate-500 mt-2 flex items-center gap-1">
            <X className="h-3 w-3" /> ยกเลิกรายการ
          </div>
        </Card>

        <Card className="p-4 border shadow-sm rounded-2xl flex flex-col justify-between bg-sky-50/50">
          <div>
            <p className="text-xs font-semibold text-sky-900/60 uppercase">
              เสร็จสิ้น
            </p>
            <h3 className="text-2xl font-bold text-sky-900 mt-1">
              {kpiSummary.finished}
            </h3>
          </div>
          <div className="text-[10px] text-sky-900/50 mt-2 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> งานเสร็จสมบูรณ์
          </div>
        </Card>

        <Card className="p-4 border shadow-sm rounded-2xl flex flex-col justify-between bg-indigo-50/50 col-span-2 sm:col-span-1">
          <div>
            <p className="text-xs font-semibold text-indigo-900/60 uppercase">
              งบประมาณรวม
            </p>
            <h3 className="text-lg sm:text-xl font-bold text-indigo-950 mt-1 truncate">
              {new Intl.NumberFormat("th-TH").format(kpiSummary.totalBudget)}
            </h3>
          </div>
          <div className="text-[10px] text-indigo-900/50 mt-2 flex items-center gap-1">
            <DollarSign className="h-3 w-3" /> บาท
          </div>
        </Card>
      </div>

      {/* 3, 5, 6. Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* วิเคราะห์ประเภทงาน (Bar Chart) */}
        <Card className="rounded-2xl border shadow-sm">
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-semibold text-slate-700">
              วิเคราะห์ตามประเภทงาน
            </CardTitle>
            <CardDescription className="text-xs">
              จำนวนแผนจำแนกตามลักษณะประเภทงาน
            </CardDescription>
          </CardHeader>
          <CardContent className="p-2 pt-0 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={jobTypeAnalytics}
                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar
                  dataKey="count"
                  name="จำนวนแผน"
                  fill="#0088FE"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* วิเคราะห์เป้าหมาย (Bar Chart) */}
        <Card className="rounded-2xl border shadow-sm">
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-semibold text-slate-700">
              วิเคราะห์ตามประเภทเป้าหมาย
            </CardTitle>
            <CardDescription className="text-xs">
              จำนวนแผนจำแนกตามประเภทของเป้าหมายหลัก
            </CardDescription>
          </CardHeader>
          <CardContent className="p-2 pt-0 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={targetTypeAnalytics}
                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar
                  dataKey="count"
                  name="จำนวนแผน"
                  fill="#FFBB28"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* วิเคราะห์งบประมาณ (Pie Chart) */}
        <Card className="rounded-2xl border shadow-sm">
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-semibold text-slate-700">
              วิเคราะห์ประเภทงบประมาณ
            </CardTitle>
            <CardDescription className="text-xs">
              สัดส่วนจำนวนงบประมาณตามประเภทงบ
            </CardDescription>
          </CardHeader>
          <CardContent className="p-2 pt-0 h-64 flex flex-col justify-center">
            {budgetTypeAnalytics.length > 0 ? (
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={budgetTypeAnalytics}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} (${(percent * 100).toFixed(0)}%)`
                      }
                      outerRadius={65}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {budgetTypeAnalytics.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) =>
                        `${new Intl.NumberFormat("th-TH").format(Number(value))} บาท`
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-xs text-center text-muted-foreground py-20">
                ไม่มีข้อมูลการใช้งบประมาณ
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 4, 7. Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* วิเคราะห์พนักงาน */}
        <Card className="rounded-2xl border shadow-sm bg-white">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <TargetIcon className="h-4 w-4 text-emerald-600" />{" "}
              วิเคราะห์ประสิทธิภาพพนักงาน
            </CardTitle>
            <CardDescription className="text-xs">
              แผนงานและงบประมาณสะสมรายบุคคล
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-semibold px-4">
                      ชื่อพนักงาน
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-center px-4 w-28">
                      จำนวนแผน
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-right px-4">
                      งบประมาณรวม (บาท)
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employeeAnalytics.length > 0 ? (
                    employeeAnalytics.map((emp) => (
                      <TableRow key={emp.name}>
                        <TableCell className="text-xs font-medium px-4 py-3">
                          {emp.name}
                        </TableCell>
                        <TableCell className="text-xs text-center px-4 py-3 font-semibold text-slate-600">
                          {emp.count}
                        </TableCell>
                        <TableCell className="text-xs text-right px-4 py-3 font-semibold text-slate-900">
                          {new Intl.NumberFormat("th-TH").format(emp.budget)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-xs text-center py-6 text-muted-foreground"
                      >
                        ไม่มีข้อมูล
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* วิเคราะห์พื้นที่ */}
        <Card className="rounded-2xl border shadow-sm bg-white">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-indigo-600" />{" "}
              วิเคราะห์ตามพื้นที่ปฏิบัติงาน
            </CardTitle>
            <CardDescription className="text-xs">
              สรุปข้อมูลความหนาแน่นรายจังหวัด
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-semibold px-4">
                      จังหวัด
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-center px-4 w-28">
                      จำนวนแผน
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-right px-4">
                      งบประมาณรวม (บาท)
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {areaAnalytics.length > 0 ? (
                    areaAnalytics.map((area) => (
                      <TableRow key={area.name}>
                        <TableCell className="text-xs font-medium px-4 py-3">
                          {area.name}
                        </TableCell>
                        <TableCell className="text-xs text-center px-4 py-3 font-semibold text-slate-600">
                          {area.count}
                        </TableCell>
                        <TableCell className="text-xs text-right px-4 py-3 font-semibold text-slate-900">
                          {new Intl.NumberFormat("th-TH").format(area.budget)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-xs text-center py-6 text-muted-foreground"
                      >
                        ไม่มีข้อมูล
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 8. Report Table */}
      <Card className="rounded-2xl border shadow-sm bg-white">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm font-semibold text-slate-700">
            ตารางรายงานแผนงานทั้งหมด
          </CardTitle>
          <CardDescription className="text-xs">
            แสดงผลข้อมูลดิบของแผนกิจกรรมทั้งหมดตามที่กำหนดตัวกรองไว้
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs font-semibold px-4 w-32">
                    เลขที่แผน
                  </TableHead>
                  <TableHead className="text-xs font-semibold px-4 w-28">
                    วันที่จัดกิจกรรม
                  </TableHead>
                  <TableHead className="text-xs font-semibold px-4">
                    ผู้รับผิดชอบ
                  </TableHead>
                  <TableHead className="text-xs font-semibold px-4">
                    ประเภทงาน
                  </TableHead>
                  <TableHead className="text-xs font-semibold px-4">
                    ชื่อกิจกรรม
                  </TableHead>
                  <TableHead className="text-xs font-semibold px-4">
                    สถานที่
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-right px-4">
                    งบประมาณ
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-center px-4 w-28">
                    สถานะ
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-center px-4 w-28">
                    ดูรายละเอียด
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedPlans.length > 0 ? (
                  paginatedPlans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell className="text-xs font-bold text-slate-600 px-4 py-3">
                        {plan.id}
                      </TableCell>
                      <TableCell className="text-xs px-4 py-3">
                        {plan.activityDate}
                      </TableCell>
                      <TableCell className="text-xs px-4 py-3 font-medium">
                        {plan.responsible}
                      </TableCell>
                      <TableCell className="text-xs px-4 py-3">
                        {plan.jobType}
                      </TableCell>
                      <TableCell
                        className="text-xs px-4 py-3 max-w-xs truncate"
                        title={plan.activityName}
                      >
                        {plan.activityName}
                      </TableCell>
                      <TableCell className="text-xs px-4 py-3">
                        {plan.targetType}
                      </TableCell>
                      <TableCell className="text-xs text-right px-4 py-3 font-semibold text-slate-900">
                        {new Intl.NumberFormat("th-TH").format(plan.budget)}
                      </TableCell>
                      <TableCell className="text-xs text-center px-4 py-3">
                        {getStatusBadge(plan.status)}
                      </TableCell>
                      <TableCell className="text-xs text-center px-4 py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 font-medium flex items-center gap-1.5 mx-auto"
                          onClick={() => setSelectedPlan(plan)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="text-xs text-center py-8 text-muted-foreground"
                    >
                      ไม่พบรายการข้อมูลตามตัวกรองที่เลือก
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
                แสดงหน้า {currentPage} จาก {totalPages} (ทั้งหมด{" "}
                {filteredData.length} รายการ)
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
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

      {/* Dialog รายละเอียดแผนงาน */}
      <Dialog
        open={!!selectedPlan}
        onOpenChange={(open) => !open && setSelectedPlan(null)}
      >
        <DialogContent className="sm:max-w-2xl rounded-2xl border shadow-lg bg-white overflow-hidden p-0">
          {selectedPlan && (
            <div>
              {/* Header */}
              <div className="bg-slate-50 border-b p-6 pb-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-slate-500 tracking-wider uppercase block mb-1">
                      รายละเอียดแผนปฏิบัติงาน
                    </span>
                    <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <ClipboardList className="h-5 w-5 text-indigo-600" />
                      {selectedPlan.id}
                    </DialogTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(selectedPlan.status)}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                {/* Activity Name */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <h4 className="text-xs font-bold text-slate-400 mb-1">
                    ชื่อกิจกรรม / โครงการ
                  </h4>
                  <p className="text-sm font-semibold text-slate-800 leading-relaxed">
                    {selectedPlan.activityName}
                  </p>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-6">
                  {/* ประเภทงาน */}
                  <div>
                    <span className="text-xs font-medium text-slate-400 block mb-1">
                      ประเภทงาน
                    </span>
                    <div>
                      <span className="text-sm font-semibold text-indigo-700 bg-indigo-50/50 px-2.5 py-1 rounded-md border border-indigo-100/50 inline-block">
                        {selectedPlan.jobType}
                      </span>
                    </div>
                  </div>

                  {/* วันที่ดำเนินงาน */}
                  <div>
                    <span className="text-xs font-medium text-slate-400 block mb-1">
                      วันที่จัดกิจกรรม
                    </span>
                    <span className="text-sm font-semibold text-slate-700 flex items-center gap-1.5 mt-1">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      {selectedPlan.activityDate}
                    </span>
                  </div>

                  {/* ผู้รับผิดชอบ */}
                  <div>
                    <span className="text-xs font-medium text-slate-400 block mb-1">
                      ผู้รับผิดชอบ
                    </span>
                    <span className="text-sm font-semibold text-slate-800">
                      {selectedPlan.responsible}
                    </span>
                  </div>

                  {/* ผู้อนุมัติ */}
                  <div>
                    <span className="text-xs font-medium text-slate-400 block mb-1">
                      ผู้อนุมัติ
                    </span>
                    <span className="text-sm font-semibold text-slate-800">
                      {selectedPlan.approver || "-"}
                    </span>
                  </div>

                  {/* พื้นที่ปฏิบัติงาน */}
                  <div>
                    <span className="text-xs font-medium text-slate-400 block mb-1">
                      พื้นที่ปฏิบัติงาน
                    </span>
                    <span className="text-sm font-semibold text-slate-800 flex items-center gap-1.5 mt-1">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      {selectedPlan.district}, {selectedPlan.province}
                    </span>
                  </div>

                  {/* กลุ่มเป้าหมาย */}
                  <div>
                    <span className="text-xs font-medium text-slate-400 block mb-1">
                      กลุ่มเป้าหมาย
                    </span>
                    <span className="text-sm font-semibold text-slate-800">
                      {selectedPlan.targetType}
                    </span>
                  </div>

                  {/* งบประมาณ */}
                  <div>
                    <span className="text-xs font-medium text-slate-400 block mb-1">
                      งบประมาณ
                    </span>
                    <span className="text-base font-bold text-emerald-600 flex items-center gap-1 mt-0.5">
                      <DollarSign className="h-4 w-4 text-emerald-500" />
                      {new Intl.NumberFormat("th-TH").format(
                        selectedPlan.budget,
                      )}{" "}
                      บาท
                    </span>
                  </div>

                  {/* ประเภทงบประมาณ */}
                  <div>
                    <span className="text-xs font-medium text-slate-400 block mb-1">
                      ประเภทงบประมาณ
                    </span>
                    <span className="text-sm font-semibold text-slate-800">
                      {selectedPlan.budgetType}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-slate-50 border-t p-4 flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setSelectedPlan(null)}
                  className="h-9 text-xs"
                >
                  ปิดหน้าต่าง
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
