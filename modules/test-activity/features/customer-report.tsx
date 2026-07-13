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
  Users,
  MapPin,
  Leaf,
  Filter,
  CheckCircle2,
  X,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  ClipboardList,
  AlertTriangle,
  FileSpreadsheet,
  Calendar,
  ShoppingBag,
} from "lucide-react";
import { mockCustomers, CustomerMock } from "../infrastructure/mock-data";

export function CustomerReport() {
  // กรองผ่าน React States
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [province, setProvince] = useState("all");
  const [district, setDistrict] = useState("all");
  const [customerType, setCustomerType] = useState("all");
  const [responsible, setResponsible] = useState("all");
  const [cropType, setCropType] = useState("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // หา Unique Options สำหรับ Selects จากข้อมูลจำลอง
  const uniqueOptions = useMemo(() => {
    const provinces = Array.from(new Set(mockCustomers.map((d) => d.province)));
    const districts = Array.from(new Set(mockCustomers.map((d) => d.district)));
    const customerTypes = Array.from(new Set(mockCustomers.map((d) => d.customerType)));
    const employees = Array.from(new Set(mockCustomers.map((d) => d.responsible)));
    const cropTypes = Array.from(new Set(mockCustomers.map((d) => d.cropType)));

    return { provinces, districts, customerTypes, employees, cropTypes };
  }, []);

  // ล้างตัวกรอง
  const resetFilters = () => {
    setStartDate("");
    setEndDate("");
    setProvince("all");
    setDistrict("all");
    setCustomerType("all");
    setResponsible("all");
    setCropType("all");
    setCurrentPage(1);
  };

  // กรองข้อมูลตามที่กำหนดตัวกรองไว้
  const filteredData = useMemo(() => {
    return mockCustomers.filter((item) => {
      if (startDate && item.lastVisitedDate < startDate) return false;
      if (endDate && item.lastVisitedDate > endDate) return false;
      if (province !== "all" && item.province !== province) return false;
      if (district !== "all" && item.district !== district) return false;
      if (customerType !== "all" && item.customerType !== customerType) return false;
      if (responsible !== "all" && item.responsible !== responsible) return false;
      if (cropType !== "all" && item.cropType !== cropType) return false;
      return true;
    });
  }, [startDate, endDate, province, district, customerType, responsible, cropType]);

  // 2. KPI Summary Calculation
  const kpiSummary = useMemo(() => {
    const totalCustomers = filteredData.length;
    const newCustomers = filteredData.filter((item) => item.status === "ลูกค้าใหม่").length;
    const existingCustomers = totalCustomers - newCustomers;
    const visitedCustomers = filteredData.filter((item) => item.visitedCount > 0).length;
    const orderedCustomers = filteredData.filter((item) => item.hasOrder).length;
    const problemCustomers = filteredData.filter(
      (item) => item.status === "ลูกค้าที่มีปัญหา" || item.hasProblem
    ).length;

    return {
      totalCustomers,
      newCustomers,
      existingCustomers,
      visitedCustomers,
      orderedCustomers,
      problemCustomers,
    };
  }, [filteredData]);

  // 3. วิเคราะห์ประเภทลูกค้า
  const customerTypeAnalytics = useMemo(() => {
    const groups: Record<string, { name: string; count: number }> = {};

    filteredData.forEach((item) => {
      if (!groups[item.customerType]) {
        groups[item.customerType] = { name: item.customerType, count: 0 };
      }
      groups[item.customerType].count += 1;
    });

    return Object.values(groups).sort((a, b) => b.count - a.count);
  }, [filteredData]);

  // 4. วิเคราะห์พื้นที่
  const areaAnalytics = useMemo(() => {
    const groups: Record<string, { name: string; count: number; newCount: number }> = {};

    filteredData.forEach((item) => {
      if (!groups[item.province]) {
        groups[item.province] = { name: item.province, count: 0, newCount: 0 };
      }
      groups[item.province].count += 1;
      if (item.status === "ลูกค้าใหม่") {
        groups[item.province].newCount += 1;
      }
    });

    return Object.values(groups).sort((a, b) => b.count - a.count);
  }, [filteredData]);

  // 5. วิเคราะห์ชนิดพืช
  const cropAnalytics = useMemo(() => {
    const groups: Record<string, { name: string; count: number }> = {};

    filteredData.forEach((item) => {
      if (!groups[item.cropType]) {
        groups[item.cropType] = { name: item.cropType, count: 0 };
      }
      groups[item.cropType].count += 1;
    });

    return Object.values(groups).sort((a, b) => b.count - a.count);
  }, [filteredData]);

  // 6. วิเคราะห์พนักงาน
  const employeeAnalytics = useMemo(() => {
    const groups: Record<
      string,
      { name: string; totalHandled: number; newCount: number; visitCount: number }
    > = {};

    filteredData.forEach((item) => {
      if (!groups[item.responsible]) {
        groups[item.responsible] = {
          name: item.responsible,
          totalHandled: 0,
          newCount: 0,
          visitCount: 0,
        };
      }
      groups[item.responsible].totalHandled += 1;
      if (item.status === "ลูกค้าใหม่") {
        groups[item.responsible].newCount += 1;
      }
      groups[item.responsible].visitCount += item.visitedCount;
    });

    return Object.values(groups).sort((a, b) => b.totalHandled - a.totalHandled);
  }, [filteredData]);

  // 7. วิเคราะห์สถานะลูกค้า
  const statusAnalytics = useMemo(() => {
    const groups = {
      "ลูกค้าใหม่": 0,
      "ลูกค้าปัจจุบัน": 0,
      "ลูกค้าไม่เคลื่อนไหว": 0,
      "ลูกค้าที่มีปัญหา": 0,
    };

    filteredData.forEach((item) => {
      if (groups[item.status] !== undefined) {
        groups[item.status] += 1;
      }
    });

    return Object.entries(groups).map(([name, count]) => ({ name, count }));
  }, [filteredData]);

  // Pagination for Customer Table
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const getStatusBadge = (status: CustomerMock["status"]) => {
    switch (status) {
      case "ลูกค้าใหม่":
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            ลูกค้าใหม่
          </span>
        );
      case "ลูกค้าปัจจุบัน":
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            ลูกค้าปัจจุบัน
          </span>
        );
      case "ลูกค้าไม่เคลื่อนไหว":
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-50 text-slate-500 border border-slate-200">
            ไม่เคลื่อนไหว
          </span>
        );
      case "ลูกค้าที่มีปัญหา":
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
            มีปัญหา
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          รายงานลูกค้า (Customer Report)
        </h1>
        <p className="text-muted-foreground text-sm">
          การวิเคราะห์ประเภทลูกค้า สถิติการเข้าเยี่ยม และการกระจายตัวของกลุ่มเป้าหมายในเขตพื้นที่ต่าง ๆ
        </p>
      </div>

      {/* 1. ตัวกรองข้อมูล (Filter) */}
      <Card className="rounded-2xl border bg-white/70 shadow-sm backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
            <div className="grid gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground">วันที่เข้าพบล่าสุด (เริ่ม)</label>
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
              <label className="text-xs font-semibold text-muted-foreground">วันที่เข้าพบล่าสุด (สิ้นสุด)</label>
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
              <label className="text-xs font-semibold text-muted-foreground">ประเภทลูกค้า</label>
              <Select
                value={customerType}
                onValueChange={(val) => {
                  setCustomerType(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full h-10 bg-white">
                  <SelectValue placeholder="ทั้งหมด" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  {uniqueOptions.customerTypes.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
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

            <div className="grid gap-1.5 lg:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground">ชนิดพืช</label>
              <Select
                value={cropType}
                onValueChange={(val) => {
                  setCropType(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full h-10 bg-white">
                  <SelectValue placeholder="ทั้งหมด" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  {uniqueOptions.cropTypes.map((cr) => (
                    <SelectItem key={cr} value={cr}>
                      {cr}
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
            <p className="text-xs font-semibold text-blue-900/60 uppercase">ลูกค้าทั้งหมด</p>
            <h3 className="text-2xl font-bold text-blue-900 mt-1">
              {kpiSummary.totalCustomers}
            </h3>
          </div>
          <div className="text-[10px] text-blue-900/50 mt-2 flex items-center gap-1">
            <Users className="h-3.5 w-3.5" /> รายการขึ้นทะเบียน
          </div>
        </Card>

        <Card className="p-4 border shadow-sm rounded-2xl flex flex-col justify-between bg-emerald-50/40">
          <div>
            <p className="text-xs font-semibold text-emerald-900/60 uppercase">ลูกค้าใหม่</p>
            <h3 className="text-2xl font-bold text-emerald-900 mt-1">
              {kpiSummary.newCustomers}
            </h3>
          </div>
          <div className="text-[10px] text-emerald-900/50 mt-2 flex items-center gap-1">
            <UserPlus className="h-3.5 w-3.5" /> ลูกค้ารายใหม่สะสม
          </div>
        </Card>

        <Card className="p-4 border shadow-sm rounded-2xl flex flex-col justify-between bg-indigo-50/40">
          <div>
            <p className="text-xs font-semibold text-indigo-900/60 uppercase">ลูกค้าเดิม</p>
            <h3 className="text-2xl font-bold text-indigo-900 mt-1">
              {kpiSummary.existingCustomers}
            </h3>
          </div>
          <div className="text-[10px] text-indigo-900/50 mt-2 flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" /> ฐานข้อมูลลูกค้าเก่า
          </div>
        </Card>

        <Card className="p-4 border shadow-sm rounded-2xl flex flex-col justify-between bg-amber-50/40">
          <div>
            <p className="text-xs font-semibold text-amber-900/60 uppercase">ลูกค้าที่เข้าพบ</p>
            <h3 className="text-2xl font-bold text-amber-900 mt-1">
              {kpiSummary.visitedCustomers}
            </h3>
          </div>
          <div className="text-[10px] text-amber-900/50 mt-2 flex items-center gap-1">
            <ClipboardList className="h-3.5 w-3.5" /> มีการลงบันทึกเข้าเยี่ยม
          </div>
        </Card>

        <Card className="p-4 border shadow-sm rounded-2xl flex flex-col justify-between bg-teal-50/40">
          <div>
            <p className="text-xs font-semibold text-teal-900/60 uppercase">ลูกค้าที่มีสั่งซื้อ</p>
            <h3 className="text-2xl font-bold text-teal-900 mt-1">
              {kpiSummary.orderedCustomers}
            </h3>
          </div>
          <div className="text-[10px] text-teal-900/50 mt-2 flex items-center gap-1">
            <ShoppingBag className="h-3.5 w-3.5" /> มีบิลหรือคำสั่งซื้อจริง
          </div>
        </Card>

        <Card className="p-4 border shadow-sm rounded-2xl flex flex-col justify-between bg-rose-50/40">
          <div>
            <p className="text-xs font-semibold text-rose-900/60 uppercase">ลูกค้าที่มีปัญหา</p>
            <h3 className="text-2xl font-bold text-rose-900 mt-1">
              {kpiSummary.problemCustomers}
            </h3>
          </div>
          <div className="text-[10px] text-rose-900/50 mt-2 flex items-center gap-1">
            <AlertTriangle className="h-3.5 w-3.5 animate-bounce" /> รอการช่วยเหลือ (ราย)
          </div>
        </Card>
      </div>

      {/* Analytics Grid: 3, 4, 5, 6, 7 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* 3. วิเคราะห์ประเภทลูกค้า */}
        <Card className="rounded-2xl border shadow-sm bg-white overflow-hidden">
          <CardHeader className="p-4 pb-2 bg-slate-50/50">
            <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Users className="h-4.5 w-4.5 text-blue-600" /> 3. วิเคราะห์ตามประเภทลูกค้า
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-100/30">
                  <TableHead className="text-xs font-bold px-4">ประเภทลูกค้า</TableHead>
                  <TableHead className="text-xs font-bold text-center px-4 w-28">จำนวนลูกค้า</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customerTypeAnalytics.map((item) => (
                  <TableRow key={item.name}>
                    <TableCell className="text-xs font-semibold text-slate-700 px-4 py-2.5">
                      {item.name}
                    </TableCell>
                    <TableCell className="text-xs text-center px-4 py-2.5 font-bold text-slate-900">
                      {item.count} ราย
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* 4. วิเคราะห์พื้นที่ */}
        <Card className="rounded-2xl border shadow-sm bg-white overflow-hidden">
          <CardHeader className="p-4 pb-2 bg-slate-50/50">
            <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <MapPin className="h-4.5 w-4.5 text-indigo-600" /> 4. วิเคราะห์สัดส่วนพื้นที่ (จังหวัด)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-100/30">
                  <TableHead className="text-xs font-bold px-4">จังหวัด</TableHead>
                  <TableHead className="text-xs font-bold text-center px-4">จำนวนลูกค้า</TableHead>
                  <TableHead className="text-xs font-bold text-center px-4">ลูกค้าใหม่</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {areaAnalytics.map((item) => (
                  <TableRow key={item.name}>
                    <TableCell className="text-xs font-semibold text-slate-700 px-4 py-2.5">
                      {item.name}
                    </TableCell>
                    <TableCell className="text-xs text-center px-4 py-2.5 font-bold text-slate-700">
                      {item.count} ราย
                    </TableCell>
                    <TableCell className="text-xs text-center px-4 py-2.5 font-bold text-emerald-600">
                      {item.newCount} ราย
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* 5. วิเคราะห์ชนิดพืช */}
        <Card className="rounded-2xl border shadow-sm bg-white overflow-hidden">
          <CardHeader className="p-4 pb-2 bg-slate-50/50">
            <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Leaf className="h-4.5 w-4.5 text-teal-600" /> 5. วิเคราะห์สถิติจำแนกชนิดพืชหลัก
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-100/30">
                  <TableHead className="text-xs font-bold px-4">ชนิดพืช</TableHead>
                  <TableHead className="text-xs font-bold text-center px-4 w-28">จำนวนลูกค้า</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cropAnalytics.map((item) => (
                  <TableRow key={item.name}>
                    <TableCell className="text-xs font-semibold text-slate-700 px-4 py-2.5">
                      {item.name}
                    </TableCell>
                    <TableCell className="text-xs text-center px-4 py-2.5 font-bold text-slate-900">
                      {item.count} ราย
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* 6. วิเคราะห์พนักงาน */}
        <Card className="rounded-2xl border shadow-sm bg-white overflow-hidden lg:col-span-2">
          <CardHeader className="p-4 pb-2 bg-slate-50/50">
            <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Users className="h-4.5 w-4.5 text-emerald-600" /> 6. วิเคราะห์ผลงานการดูแลลูกค้าของพนักงาน
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-100/30">
                  <TableHead className="text-xs font-bold px-4">ชื่อพนักงาน</TableHead>
                  <TableHead className="text-xs font-bold text-center px-4">ลูกค้าที่ดูแล</TableHead>
                  <TableHead className="text-xs font-bold text-center px-4">ลูกค้าใหม่</TableHead>
                  <TableHead className="text-xs font-bold text-center px-4">จำนวนครั้งที่เข้าพบ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employeeAnalytics.map((emp) => (
                  <TableRow key={emp.name}>
                    <TableCell className="text-xs font-semibold text-slate-700 px-4 py-3">
                      {emp.name}
                    </TableCell>
                    <TableCell className="text-xs text-center px-4 py-3 font-bold text-slate-700">
                      {emp.totalHandled} ราย
                    </TableCell>
                    <TableCell className="text-xs text-center px-4 py-3 font-bold text-blue-600">
                      {emp.newCount} ราย
                    </TableCell>
                    <TableCell className="text-xs text-center px-4 py-3 font-bold text-amber-600">
                      {emp.visitCount} ครั้ง
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* 7. วิเคราะห์สถานะลูกค้า */}
        <Card className="rounded-2xl border shadow-sm bg-white overflow-hidden col-span-1">
          <CardHeader className="p-4 pb-2 bg-slate-50/50">
            <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <ClipboardList className="h-4.5 w-4.5 text-amber-600" /> 7. วิเคราะห์แยกสถานะลูกค้า
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-100/30">
                  <TableHead className="text-xs font-bold px-4">สถานะลูกค้า</TableHead>
                  <TableHead className="text-xs font-bold text-center px-4 w-28">จำนวนลูกค้า</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statusAnalytics.map((item) => (
                  <TableRow key={item.name}>
                    <TableCell className="text-xs font-semibold text-slate-700 px-4 py-2.5">
                      {item.name}
                    </TableCell>
                    <TableCell className="text-xs text-center px-4 py-2.5 font-bold text-slate-900">
                      {item.count} ราย
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* 8. ตารางรายงาน */}
      <Card className="rounded-2xl border shadow-sm bg-white overflow-hidden">
        <CardHeader className="p-4 pb-2 bg-slate-50/50">
          <CardTitle className="text-sm font-bold text-slate-800">
            8. ตารางสรุปรายละเอียดรายงานข้อมูลลูกค้า
          </CardTitle>
          <CardDescription className="text-xs">
            สืบค้นข้อมูลพิกัด จังหวัด พืชเป้าหมาย ผู้ดูแล และความเคลื่อนไหวล่าสุดของกลุ่มเป้าหมาย
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-100/30">
                  <TableHead className="text-xs font-bold px-4 w-32">รหัสลูกค้า</TableHead>
                  <TableHead className="text-xs font-bold px-4">ชื่อลูกค้า</TableHead>
                  <TableHead className="text-xs font-bold px-4">ประเภทลูกค้า</TableHead>
                  <TableHead className="text-xs font-bold px-4">จังหวัด</TableHead>
                  <TableHead className="text-xs font-bold px-4">ชนิดพืช</TableHead>
                  <TableHead className="text-xs font-bold px-4">ผู้รับผิดชอบ</TableHead>
                  <TableHead className="text-xs font-bold px-4 w-36">วันที่เข้าพบล่าสุด</TableHead>
                  <TableHead className="text-xs font-bold text-center px-4 w-32">สถานะลูกค้า</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length > 0 ? (
                  paginatedData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-xs font-bold text-slate-600 px-4 py-3">
                        {item.id}
                      </TableCell>
                      <TableCell className="text-xs px-4 py-3 font-semibold text-slate-900">
                        {item.name}
                      </TableCell>
                      <TableCell className="text-xs px-4 py-3 text-slate-600">
                        {item.customerType}
                      </TableCell>
                      <TableCell className="text-xs px-4 py-3 text-slate-600">{item.province}</TableCell>
                      <TableCell className="text-xs px-4 py-3 font-medium text-teal-650">{item.cropType}</TableCell>
                      <TableCell className="text-xs px-4 py-3 font-medium text-slate-600">{item.responsible}</TableCell>
                      <TableCell className="text-xs px-4 py-3 text-slate-500 font-semibold">{item.lastVisitedDate}</TableCell>
                      <TableCell className="text-xs text-center px-4 py-3">
                        {getStatusBadge(item.status)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-xs text-center py-8 text-muted-foreground">
                      ไม่พบรายการข้อมูลลูกค้าตามตัวกรองที่เลือก
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
