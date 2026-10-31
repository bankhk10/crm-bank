"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import {
  Search,
  Package,
  Sparkles,
  Users,
  CalendarDays,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  RotateCcw,
  RefreshCw,
  Layers,
  Store,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { ActivityStatusBadge } from "@/modules/activity/ui/activity-status-badge";
import { STATUS_OPTIONS } from "@/modules/activity/constants";
import { getActivityWithdrawalsByEmployeeAction } from "@/modules/activity/server/promotional.actions";
import { getAllEmployeesAction } from "@/modules/employee/server/actions";
import type {
  EmployeeWithdrawalGroup,
  UnifiedWithdrawalItem,
  ActivityWithdrawalSummary,
} from "@/modules/activity/infrastructure/activity-withdrawal.repository";
import { cn } from "@/lib/utils";

function formatThaiDateRange(
  startDate?: string | Date,
  endDate?: string | Date
): string {
  if (!startDate) return "-";
  try {
    const s = new Date(startDate);
    const e = endDate ? new Date(endDate) : s;
    if (isNaN(s.getTime())) return "-";
    const sStr = `${format(s, "dd MMM", { locale: th })} ${s.getFullYear() + 543}`;
    const eStr = `${format(e, "dd MMM", { locale: th })} ${e.getFullYear() + 543}`;
    return sStr === eStr ? sStr : `${sStr} - ${eStr}`;
  } catch {
    return "-";
  }
}

export function ActivityWithdrawalsTab() {
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [itemType, setItemType] = useState<"ALL" | "PRODUCT" | "MEDIA">("ALL");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  // Options
  const [employees, setEmployees] = useState<
    { id: string; name: string; employeeCode?: string | null }[]
  >([]);

  // Data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ActivityWithdrawalSummary>({
    totalEmployees: 0,
    totalPlans: 0,
    totalProductItems: 0,
    totalMediaItems: 0,
    totalMediaAmount: 0,
  });
  const [employeeGroups, setEmployeeGroups] = useState<EmployeeWithdrawalGroup[]>([]);
  const [totalItems, setTotalItems] = useState(0);

  // Accordion state: map employeeId -> boolean (expanded)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load employees for filter dropdown
  useEffect(() => {
    let mounted = true;
    getAllEmployeesAction()
      .then((res) => {
        if (!mounted) return;
        if (res.success && Array.isArray(res.employees)) {
          const valid = res.employees
            .filter((e: any) => e.name)
            .map((e: any) => ({
              id: e.id,
              name: e.name,
              employeeCode: e.employeeCode || null,
            }));
          setEmployees(valid);
        }
      })
      .catch((err) => {
        console.error("Failed to load employees for filter:", err);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Fetch withdrawals data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getActivityWithdrawalsByEmployeeAction({
        itemType,
        employeeId: selectedEmployeeId !== "ALL" ? selectedEmployeeId : undefined,
        status: selectedStatus !== "ALL" ? selectedStatus : undefined,
        q: debouncedQuery || undefined,
      });

      if (res.success) {
        const groups: EmployeeWithdrawalGroup[] = res.employeeGroups || [];
        setEmployeeGroups(groups);
        setSummary(
          res.summary || {
            totalEmployees: 0,
            totalPlans: 0,
            totalProductItems: 0,
            totalMediaItems: 0,
            totalMediaAmount: 0,
          }
        );
        setTotalItems(res.totalItems || 0);

        // Auto-expand all loaded groups by default
        const initExpanded: Record<string, boolean> = {};
        groups.forEach((g) => {
          initExpanded[g.employeeId] = true;
        });
        setExpandedGroups(initExpanded);
      } else {
        setError((res as any).error || "ไม่สามารถโหลดข้อมูลรายการเบิกสินค้าและสื่อได้");
      }
    } catch (err: any) {
      console.error("Error loading activity withdrawals:", err);
      setError("เกิดข้อผิดพลาดในการโหลดข้อมูล กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  }, [itemType, selectedEmployeeId, selectedStatus, debouncedQuery]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleGroup = (employeeId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [employeeId]: !prev[employeeId],
    }));
  };

  const isAllExpanded = useMemo(() => {
    if (employeeGroups.length === 0) return false;
    return employeeGroups.every((g) => expandedGroups[g.employeeId]);
  }, [employeeGroups, expandedGroups]);

  const toggleAllGroups = () => {
    const nextState = !isAllExpanded;
    const updated: Record<string, boolean> = {};
    employeeGroups.forEach((g) => {
      updated[g.employeeId] = nextState;
    });
    setExpandedGroups(updated);
  };

  const resetFilters = () => {
    setSearchQuery("");
    setDebouncedQuery("");
    setItemType("ALL");
    setSelectedEmployeeId("ALL");
    setSelectedStatus("ALL");
  };

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    itemType !== "ALL" ||
    selectedEmployeeId !== "ALL" ||
    selectedStatus !== "ALL";

  return (
    <div className="space-y-5">
      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Card 1: Total Employees */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1.5 transition-shadow hover:shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              ผู้ขอเบิกทั้งหมด
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {summary.totalEmployees.toLocaleString()}{" "}
            <span className="text-xs font-normal text-slate-500">คน</span>
          </div>
          <p className="text-[11px] text-slate-500 truncate">
            รวม {summary.totalPlans.toLocaleString()} แผนงาน
          </p>
        </div>

        {/* Card 2: Total Plans */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1.5 transition-shadow hover:shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              แผนงานที่เบิก
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <CalendarDays className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-indigo-700">
            {summary.totalPlans.toLocaleString()}{" "}
            <span className="text-xs font-normal text-slate-500">แผน</span>
          </div>
          <p className="text-[11px] text-slate-500 truncate">
            รวม {totalItems.toLocaleString()} รายการ
          </p>
        </div>

        {/* Card 3: Total Product Items */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1.5 transition-shadow hover:shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              รายการเบิกสินค้า
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-700">
            {summary.totalProductItems.toLocaleString()}{" "}
            <span className="text-xs font-normal text-slate-500">รายการ</span>
          </div>
          <p className="text-[11px] text-slate-500 truncate">
            สินค้าตัวอย่าง / สาธิต / ส่งเสริม
          </p>
        </div>

        {/* Card 4: Total Media Items & Amount */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1.5 transition-shadow hover:shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              รายการเบิกสื่อส่งเสริมฯ
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-700">
            {summary.totalMediaItems.toLocaleString()}{" "}
            <span className="text-xs font-normal text-slate-500">รายการ</span>
          </div>
          <p className="text-[11px] font-semibold text-purple-900 truncate">
            มูลค่า ฿{summary.totalMediaAmount.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Left: Type Segmented Switcher */}
          <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setItemType("ALL")}
              className={cn(
                "flex-1 sm:flex-initial px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all",
                itemType === "ALL"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              ทั้งหมด ({totalItems})
            </button>
            <button
              type="button"
              onClick={() => setItemType("PRODUCT")}
              className={cn(
                "flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all",
                itemType === "PRODUCT"
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Package className="h-3.5 w-3.5" />
              เฉพาะสินค้า ({summary.totalProductItems})
            </button>
            <button
              type="button"
              onClick={() => setItemType("MEDIA")}
              className={cn(
                "flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all",
                itemType === "MEDIA"
                  ? "bg-purple-600 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Sparkles className="h-3.5 w-3.5" />
              เฉพาะสื่อส่งเสริมฯ ({summary.totalMediaItems})
            </button>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 self-end lg:self-auto">
            {hasActiveFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="text-xs text-slate-600 hover:text-slate-900 h-9"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                ล้างตัวกรอง
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={fetchData}
              disabled={loading}
              className="text-xs h-9 border-slate-200"
            >
              <RefreshCw
                className={cn("h-3.5 w-3.5 mr-1.5", loading && "animate-spin")}
              />
              รีเฟรช
            </Button>
          </div>
        </div>

        {/* Second Row: Detailed Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100">
          {/* Search Query */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <Input
              type="text"
              placeholder="ค้นหาชื่อสินค้า/สื่อ, รหัสแผน, พนักงาน..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs h-9 bg-slate-50/50 border-slate-200"
            />
          </div>

          {/* Employee Dropdown */}
          <div>
            <NativeSelect
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="w-full text-xs h-9 bg-slate-50/50 border-slate-200"
            >
              <NativeSelectOption value="ALL">
                ผู้ขอเบิกทั้งหมด ({employees.length} คน)
              </NativeSelectOption>
              {employees.map((emp) => (
                <NativeSelectOption key={emp.id} value={emp.id}>
                  {emp.name} {emp.employeeCode ? `(${emp.employeeCode})` : ""}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>

          {/* Plan Status Dropdown */}
          <div>
            <NativeSelect
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full text-xs h-9 bg-slate-50/50 border-slate-200"
            >
              <NativeSelectOption value="ALL">สถานะแผนงานทั้งหมด</NativeSelectOption>
              {STATUS_OPTIONS.map((opt) => (
                <NativeSelectOption key={opt.value} value={opt.value}>
                  {opt.label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
          <span>{error}</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={fetchData}
            className="text-xs bg-white text-red-700 border-red-200 hover:bg-red-50"
          >
            ลองใหม่
          </Button>
        </div>
      )}

      {/* Section Header: Expand/Collapse All + Stats info */}
      <div className="flex items-center justify-between px-1">
        <div className="text-xs font-semibold text-slate-600">
          แสดงรายการเบิกจัดกลุ่มรายบุคคล (
          <span className="text-slate-900 font-bold">
            {employeeGroups.length} คน / {totalItems} รายการ
          </span>
          )
        </div>
        {employeeGroups.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={toggleAllGroups}
            className="text-xs text-slate-600 hover:text-slate-900 h-8 gap-1.5"
          >
            <ChevronsUpDown className="h-3.5 w-3.5" />
            {isAllExpanded ? "ย่อทั้งหมด" : "ขยายทั้งหมด"}
          </Button>
        )}
      </div>

      {/* Loading State */}
      {loading && employeeGroups.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 shadow-2xs">
          <RefreshCw className="h-8 w-8 text-emerald-600 animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-700">
            กำลังโหลดข้อมูลรายการเบิกสินค้าและสื่อส่งเสริมการขาย...
          </p>
        </div>
      )}

      {/* Empty State */}
      {!loading && employeeGroups.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 shadow-2xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Package className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            ไม่พบรายการเบิกสินค้าหรือสื่อส่งเสริมการขาย
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {hasActiveFilters
              ? "ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหาหรือตัวกรองที่เลือก ลองปรับเปลี่ยนเงื่อนไขใหม่"
              : "ยังไม่มีประวัติการเบิกสินค้าหรือสื่อส่งเสริมการขายในระบบ Activity Plan"}
          </p>
          {hasActiveFilters && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="text-xs mt-2"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              ล้างตัวกรองทั้งหมด
            </Button>
          )}
        </div>
      )}

      {/* Grouped Accordion List */}
      <div className="space-y-4">
        {employeeGroups.map((group) => {
          const isExpanded = Boolean(expandedGroups[group.employeeId]);

          return (
            <div
              key={group.employeeId}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all duration-200"
            >
              {/* Accordion Header */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => toggleGroup(group.employeeId)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleGroup(group.employeeId);
                  }
                }}
                className={cn(
                  "p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer select-none transition-colors",
                  isExpanded ? "bg-slate-50/70 border-b border-slate-200/80" : "hover:bg-slate-50/50"
                )}
              >
                {/* Employee info */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold text-base flex items-center justify-center shrink-0 shadow-2xs">
                    {group.employeeName ? group.employeeName.charAt(0) : "U"}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm sm:text-base font-bold text-slate-900">
                        {group.employeeName}
                      </span>
                      {group.employeeCode && (
                        <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-md bg-slate-200/80 text-slate-700">
                          {group.employeeCode}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {[group.departmentName, group.positionTitle]
                        .filter(Boolean)
                        .join(" · ") || "ไม่ระบุตำแหน่ง"}
                    </p>
                  </div>
                </div>

                {/* Metrics badges & Chevron */}
                <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
                  <Badge
                    variant="outline"
                    className="bg-white border-slate-200 text-slate-700 text-xs font-semibold px-2.5 py-1"
                  >
                    รวม {group.totalItemCount} รายการ
                  </Badge>

                  {group.productItemCount > 0 && (
                    <Badge
                      variant="outline"
                      className="bg-blue-50 border-blue-200 text-blue-700 text-xs font-medium px-2.5 py-1 gap-1"
                    >
                      <Package className="h-3 w-3" />
                      สินค้า {group.productItemCount}
                    </Badge>
                  )}

                  {group.mediaItemCount > 0 && (
                    <Badge
                      variant="outline"
                      className="bg-purple-50 border-purple-200 text-purple-700 text-xs font-medium px-2.5 py-1 gap-1"
                    >
                      <Sparkles className="h-3 w-3" />
                      สื่อฯ {group.mediaItemCount}
                      {group.totalMediaAmount > 0 && (
                        <span className="font-semibold text-purple-900">
                          (฿{group.totalMediaAmount.toLocaleString()})
                        </span>
                      )}
                    </Badge>
                  )}

                  <Badge
                    variant="outline"
                    className="bg-slate-100 border-slate-200 text-slate-600 text-xs px-2.5 py-1"
                  >
                    {group.planCount} แผนงาน
                  </Badge>

                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 ml-1">
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </div>
              </div>

              {/* Accordion Body */}
              {isExpanded && (
                <div className="p-0">
                  {/* Desktop Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-slate-50/80">
                        <TableRow className="border-b border-slate-200 text-[11px] font-semibold text-slate-600">
                          <TableHead className="w-12 text-center">#</TableHead>
                          <TableHead className="w-32">ประเภท</TableHead>
                          <TableHead className="w-32">รหัส / หมวดหมู่</TableHead>
                          <TableHead className="min-w-[180px]">รายการที่เบิก</TableHead>
                          <TableHead className="min-w-[160px]">
                            รายละเอียด / แปลง / ร้านค้า
                          </TableHead>
                          <TableHead className="w-28 text-right">จำนวน</TableHead>
                          <TableHead className="w-32 text-right">
                            มูลค่ารวม (บาท)
                          </TableHead>
                          <TableHead className="min-w-[170px]">
                            แผนงานที่เบิกไปใช้
                          </TableHead>
                          <TableHead className="w-36">วันที่ใช้งาน</TableHead>
                          <TableHead className="w-40 text-center">สถานะ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="divide-y divide-slate-100">
                        {group.items.map((item, idx) => (
                          <TableRow
                            key={`${item.id}-${idx}`}
                            className="hover:bg-slate-50/60 transition-colors text-xs"
                          >
                            <TableCell className="text-center text-slate-400 font-mono text-[11px]">
                              {idx + 1}
                            </TableCell>

                            {/* Item Type Badge */}
                            <TableCell>
                              {item.itemType === "PRODUCT" ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                  <Package className="w-3 h-3" />
                                  สินค้า
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                                  <Sparkles className="w-3 h-3" />
                                  สื่อส่งเสริม
                                </span>
                              )}
                            </TableCell>

                            {/* Code or Category */}
                            <TableCell className="font-mono text-slate-600 text-[11px]">
                              {item.codeOrCategory || "-"}
                            </TableCell>

                            {/* Item Name */}
                            <TableCell className="font-semibold text-slate-900">
                              {item.name}
                            </TableCell>

                            {/* Detail / Target Store / Plot */}
                            <TableCell className="text-slate-600">
                              {item.detail ? (
                                <span className="inline-flex items-center gap-1">
                                  <Store className="h-3 w-3 text-slate-400 shrink-0" />
                                  <span>{item.detail}</span>
                                </span>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </TableCell>

                            {/* Quantity + Unit */}
                            <TableCell className="text-right font-bold text-slate-900">
                              {item.quantity.toLocaleString()}{" "}
                              <span className="text-slate-500 font-normal text-[11px]">
                                {item.unit}
                              </span>
                            </TableCell>

                            {/* Total Amount (for media) */}
                            <TableCell className="text-right">
                              {item.itemType === "MEDIA" &&
                              typeof item.totalAmount === "number" ? (
                                <span className="font-semibold text-purple-900">
                                  ฿{item.totalAmount.toLocaleString()}
                                </span>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </TableCell>

                            {/* Plan Link & Title */}
                            <TableCell>
                              <Link
                                href={`/activity-plans/${item.planId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 hover:underline font-medium group"
                              >
                                <span className="font-mono">{item.planCode}</span>
                                <ExternalLink className="h-3 w-3 opacity-60 group-hover:opacity-100" />
                              </Link>
                              <p className="text-[11px] text-slate-500 line-clamp-1 max-w-[200px]">
                                {item.planTitle}
                              </p>
                            </TableCell>

                            {/* Dates */}
                            <TableCell className="text-slate-600 text-[11px]">
                              {formatThaiDateRange(item.startDate, item.endDate)}
                            </TableCell>

                            {/* Status */}
                            <TableCell className="text-center space-y-1">
                              <ActivityStatusBadge status={item.planStatus} />
                              {item.itemType === "PRODUCT" && (
                                <div className="mt-1">
                                  {item.productWithdrawalApproved === true ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                                      <CheckCircle2 className="w-2.5 h-2.5" />
                                      อนุมัติเบิกแล้ว
                                    </span>
                                  ) : item.productWithdrawalApproved === false ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                                      <XCircle className="w-2.5 h-2.5" />
                                      ไม่อนุมัติเบิก
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                                      <Clock className="w-2.5 h-2.5" />
                                      รออนุมัติเบิก
                                    </span>
                                  )}
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile Stacked Card View */}
                  <div className="block md:hidden divide-y divide-slate-100">
                    {group.items.map((item, idx) => (
                      <div key={`m-${item.id}-${idx}`} className="p-4 space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              {item.itemType === "PRODUCT" ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                  <Package className="w-2.5 h-2.5" />
                                  สินค้า
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                                  <Sparkles className="w-2.5 h-2.5" />
                                  สื่อส่งเสริม
                                </span>
                              )}
                              <span className="text-[11px] font-mono text-slate-500">
                                {item.codeOrCategory}
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-slate-900">
                              {item.name}
                            </h4>
                          </div>

                          <div className="text-right">
                            <div className="text-sm font-bold text-slate-900">
                              {item.quantity.toLocaleString()} {item.unit}
                            </div>
                            {item.itemType === "MEDIA" &&
                              typeof item.totalAmount === "number" && (
                                <div className="text-xs font-semibold text-purple-700">
                                  ฿{item.totalAmount.toLocaleString()}
                                </div>
                              )}
                          </div>
                        </div>

                        {item.detail && (
                          <div className="text-xs text-slate-600 flex items-center gap-1.5 bg-slate-50 p-2 rounded-lg">
                            <Store className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span>{item.detail}</span>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                          <div>
                            <Link
                              href={`/activity-plans/${item.planId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-emerald-600 hover:underline font-mono font-medium"
                            >
                              <span>{item.planCode}</span>
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                            <span className="text-slate-400 mx-1.5">·</span>
                            <span className="text-[11px] text-slate-500">
                              {formatThaiDateRange(item.startDate, item.endDate)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <ActivityStatusBadge status={item.planStatus} />
                            {item.itemType === "PRODUCT" &&
                              item.productWithdrawalApproved !== undefined && (
                                <span
                                  className={cn(
                                    "text-[10px] px-1.5 py-0.5 rounded border font-medium",
                                    item.productWithdrawalApproved === true
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : item.productWithdrawalApproved === false
                                      ? "bg-red-50 text-red-700 border-red-200"
                                      : "bg-amber-50 text-amber-700 border-amber-200"
                                  )}
                                >
                                  {item.productWithdrawalApproved === true
                                    ? "อนุมัติเบิก"
                                    : item.productWithdrawalApproved === false
                                    ? "ไม่อนุมัติ"
                                    : "รออนุมัติ"}
                                </span>
                              )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
