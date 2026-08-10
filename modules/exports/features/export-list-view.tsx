"use client";

import { useState } from "react";
import {
  format,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
} from "date-fns";
import { toast } from "sonner";
import {
  Download,
  FileSpreadsheet,
  Lock,
  CheckCircle2,
  Filter,
  Calendar,
  Building2,
  Loader2,
  ShieldAlert,
  Clock,
  Package,
  Sparkles,
  Info,
} from "lucide-react";
import { usePermission } from "@/hooks/use-permission";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  exportSalesAdminAction,
  exportPendingDeliveriesAction,
} from "../server/actions";

const SALE_STATUS_OPTIONS = [
  { value: "ALL", label: "ทั้งหมด" },
  { value: "FORECAST", label: "Forecast" },
  { value: "SALES_NOTE", label: "Sales Note" },
  { value: "INVOICE", label: "Invoice" },
];

const DATE_PRESET_OPTIONS = [
  { value: "THIS_MONTH", label: "เดือนนี้" },
  { value: "TODAY", label: "วันนี้" },
  { value: "LAST_MONTH", label: "เดือนที่แล้ว" },
  { value: "THIS_QUARTER", label: "ไตรมาสนี้" },
  { value: "THIS_YEAR", label: "ปีนี้" },
  { value: "CUSTOM", label: "กำหนดเอง" },
];

/**
 * Calculate start and end date based on preset choice
 */
function getPresetDateRange(
  preset: string,
): { start: string; end: string } | null {
  const now = new Date();
  switch (preset) {
    case "TODAY":
      return {
        start: format(startOfDay(now), "yyyy-MM-dd"),
        end: format(endOfDay(now), "yyyy-MM-dd"),
      };
    case "THIS_MONTH":
      return {
        start: format(startOfMonth(now), "yyyy-MM-dd"),
        end: format(endOfMonth(now), "yyyy-MM-dd"),
      };
    case "LAST_MONTH": {
      const lastMonth = subMonths(now, 1);
      return {
        start: format(startOfMonth(lastMonth), "yyyy-MM-dd"),
        end: format(endOfMonth(lastMonth), "yyyy-MM-dd"),
      };
    }
    case "THIS_QUARTER":
      return {
        start: format(startOfQuarter(now), "yyyy-MM-dd"),
        end: format(endOfQuarter(now), "yyyy-MM-dd"),
      };
    case "THIS_YEAR":
      return {
        start: format(startOfYear(now), "yyyy-MM-dd"),
        end: format(endOfYear(now), "yyyy-MM-dd"),
      };
    default:
      return null;
  }
}

/**
 * Trigger browser download from base64 string
 */
function triggerDownload(base64: string, filename: string) {
  try {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Failed to trigger download:", err);
    toast.error("เกิดข้อผิดพลาดในการดาวน์โหลดไฟล์");
  }
}

/**
 * Permission status badge shared across export cards
 */
function PermissionBadge({
  isLoading,
  hasAccess,
}: {
  isLoading: boolean;
  hasAccess: boolean;
}) {
  if (isLoading) {
    return (
      <Badge
        variant="outline"
        className="text-[10px] animate-pulse gap-1.5 px-2.5 py-1"
      >
        <Loader2 className="h-3 w-3 animate-spin" />
        ตรวจสอบสิทธิ์...
      </Badge>
    );
  }

  if (hasAccess) {
    return (
      <Badge
        variant="secondary"
        className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 gap-1.5 px-2.5 py-1 text-[10px]"
      >
        <CheckCircle2 className="h-3 w-3" />
        มีสิทธิ์ใช้งาน
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="bg-red-500/8 text-red-600 dark:text-red-400 border-red-500/20 gap-1.5 px-2.5 py-1 text-[10px]"
    >
      <Lock className="h-3 w-3" />
      ไม่มีสิทธิ์
    </Badge>
  );
}

/**
 * Reusable file column detail section
 */
function FileColumnDetails({ items }: { items: string[] }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
        <Info className="h-3.5 w-3.5 text-muted-foreground" />
        คอลัมน์ในไฟล์ Excel
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span
            key={item}
            className="inline-flex items-center rounded-md bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground ring-1 ring-inset ring-border/50"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * Sales Admin Export Component (with local filters & presets)
 */
function SalesAdminExportCard({
  canExport,
  isLoadingPermission,
}: {
  canExport: boolean;
  isLoadingPermission: boolean;
}) {
  const [datePreset, setDatePreset] = useState<string>("THIS_MONTH");
  const [startDate, setStartDate] = useState<string>(
    format(startOfMonth(new Date()), "yyyy-MM-dd"),
  );
  const [endDate, setEndDate] = useState<string>(
    format(endOfMonth(new Date()), "yyyy-MM-dd"),
  );
  const [status, setStatus] = useState<string>("ALL");
  const [isExporting, setIsExporting] = useState(false);

  const handlePresetChange = (preset: string) => {
    setDatePreset(preset);
    const range = getPresetDateRange(preset);
    if (range) {
      setStartDate(range.start);
      setEndDate(range.end);
    }
  };

  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    setDatePreset("CUSTOM");
  };

  const handleEndDateChange = (val: string) => {
    setEndDate(val);
    setDatePreset("CUSTOM");
  };

  const handleExport = async () => {
    if (!canExport) {
      toast.error("คุณไม่มีสิทธิ์ในการส่งออกข้อมูลการขาย");
      return;
    }

    setIsExporting(true);
    try {
      const res = await exportSalesAdminAction({
        startDate,
        endDate,
        status: status as any,
      });

      if (!res.success || !res.data) {
        toast.error(res.error || "เกิดข้อผิดพลาดในการส่งออกข้อมูล");
        return;
      }

      triggerDownload(res.data.base64, res.data.filename);
      toast.success("ส่งออกข้อมูลการขาย สำเร็จ");
    } catch (error: any) {
      toast.error(error.message || "เกิดข้อผิดพลาดไม่ทราบสาเหตุ");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card className="group relative flex flex-col justify-between overflow-hidden border-border/60 bg-card transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/5 hover:border-blue-500/30">
      {/* Accent top bar */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 opacity-80 transition-opacity duration-300 group-hover:opacity-100" />

      <CardHeader className="space-y-3 pb-4 pt-7">
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/15 to-indigo-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/10 transition-transform duration-300 group-hover:scale-105">
            <Building2 className="h-5 w-5" />
          </div>
          <PermissionBadge
            isLoading={isLoadingPermission}
            hasAccess={canExport}
          />
        </div>

        <div>
          <CardTitle className="text-base font-bold tracking-tight">
            ข้อมูลการขาย
          </CardTitle>
          <CardDescription className="mt-1 text-xs leading-relaxed">
            ส่งออกข้อมูลเอกสารการขาย
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        {/* Filter Section */}
        <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Filter className="h-3 w-3" />
            </div>
            <span>เงื่อนไขการค้นหา</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Quick Date Preset */}
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-[11px] font-medium flex items-center gap-1.5 text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>ช่วงเวลา</span>
              </Label>
              <Select value={datePreset} onValueChange={handlePresetChange}>
                <SelectTrigger className="h-9 text-xs w-full bg-background/80 border-border/60">
                  <SelectValue placeholder="เลือกช่วงเวลา" />
                </SelectTrigger>
                <SelectContent>
                  {DATE_PRESET_OPTIONS.map((opt) => (
                    <SelectItem
                      key={opt.value}
                      value={opt.value}
                      className="text-xs"
                    >
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Start Date */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-medium flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>วันที่เริ่มต้น</span>
              </Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="h-9 text-xs w-full bg-background/80 border-border/60"
              />
            </div>

            {/* End Date */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-medium flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>วันที่สิ้นสุด</span>
              </Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => handleEndDateChange(e.target.value)}
                className="h-9 text-xs w-full bg-background/80 border-border/60"
              />
            </div>

            {/* Status Select */}
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-[11px] font-medium text-muted-foreground">
                สถานะใบขาย
              </Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-9 text-xs w-full bg-background/80 border-border/60">
                  <SelectValue placeholder="เลือกสถานะ" />
                </SelectTrigger>
                <SelectContent>
                  {SALE_STATUS_OPTIONS.map((opt) => (
                    <SelectItem
                      key={opt.value}
                      value={opt.value}
                      className="text-xs"
                    >
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Column Details */}
        <FileColumnDetails
          items={[
            "เลขที่เอกสาร",
            "วันที่เอกสาร",
            "สถานะใบขาย",
            "ชื่อลูกค้า",
            "ประเภทลูกค้า",
            "เงื่อนไขชำระเงิน",
            "วันครบกำหนด",
            "วันส่งจริง",
            "วิธีจัดส่ง",
            "บริษัทขนส่ง",
            "ยอดรวมสินค้า",
            "ค่าจัดส่ง",
            "ค่าใช้จ่ายอื่นๆ",
            "ยอดรวมสุทธิ",
            "รายการสินค้า",
          ]}
        />
      </CardContent>

      <CardFooter className="pt-3 pb-5 px-6">
        <Button
          onClick={handleExport}
          disabled={isExporting || !canExport || isLoadingPermission}
          className="w-full gap-2.5 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm shadow-md shadow-blue-600/20 transition-all duration-200 hover:shadow-lg hover:shadow-blue-600/30 disabled:opacity-50 disabled:shadow-none"
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>กำลังสร้างไฟล์ Excel...</span>
            </>
          ) : !canExport ? (
            <>
              <Lock className="h-4 w-4" />
              <span>ไม่มีสิทธิ์ส่งออกข้อมูล</span>
            </>
          ) : (
            <>
              <FileSpreadsheet className="h-4 w-4" />
              <span>ส่งออกข้อมูลการขาย .xlsx</span>
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

/**
 * Pending Deliveries Export Component
 */
function PendingDeliveriesExportCard({
  canExport,
  isLoadingPermission,
}: {
  canExport: boolean;
  isLoadingPermission: boolean;
}) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!canExport) {
      toast.error("คุณไม่มีสิทธิ์ในการส่งออกข้อมูลสินค้าค้างส่ง");
      return;
    }

    setIsExporting(true);
    try {
      const res = await exportPendingDeliveriesAction();

      if (!res.success || !res.data) {
        toast.error(
          res.error || "เกิดข้อผิดพลาดในการส่งออกข้อมูลสินค้าค้างส่ง",
        );
        return;
      }

      triggerDownload(res.data.base64, res.data.filename);
      toast.success("ส่งออกข้อมูลสินค้าค้างส่งสำเร็จ");
    } catch (error: any) {
      toast.error(error.message || "เกิดข้อผิดพลาดไม่ทราบสาเหตุ");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card className="group relative flex flex-col justify-between overflow-hidden border-border/60 bg-card transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/5 hover:border-amber-500/30">
      {/* Accent top bar */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 opacity-80 transition-opacity duration-300 group-hover:opacity-100" />

      <CardHeader className="space-y-3 pb-4 pt-7">
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/15 to-orange-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/10 transition-transform duration-300 group-hover:scale-105">
            <Package className="h-5 w-5" />
          </div>
          <PermissionBadge
            isLoading={isLoadingPermission}
            hasAccess={canExport}
          />
        </div>

        <div>
          <CardTitle className="text-base font-bold tracking-tight">
            สินค้าค้างส่ง
          </CardTitle>
          <CardDescription className="mt-1 text-xs leading-relaxed">
            ส่งออกรายงานรายการสินค้าที่อยู่ระหว่างรอการจัดส่ง
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        {/* Info callout */}
        <div className="flex items-start gap-2.5 rounded-xl bg-amber-500/5 border border-amber-500/15 px-3.5 py-3 text-[11px] text-amber-800 dark:text-amber-300/80">
          <Sparkles className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
          <span>
            รายงานนี้จะดึงข้อมูลสินค้าค้างส่งทั้งหมดจากทุก Order
            โดยไม่ต้องกรองตามช่วงเวลา
          </span>
        </div>

        {/* Column Details */}
        <FileColumnDetails
          items={[
            "เลขที่ออเดอร์",
            "ชื่อลูกค้า",
            "รหัสสินค้า",
            "ชื่อสินค้า",
            "จำนวนค้างส่ง",
            "หน่วยนับ",
            "ราคาขาย",
            "ราคารวม",
          ]}
        />
      </CardContent>

      <CardFooter className="pt-3 pb-5 px-6">
        <Button
          onClick={handleExport}
          disabled={isExporting || !canExport || isLoadingPermission}
          className="w-full gap-2.5 h-10 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold text-sm shadow-md shadow-amber-600/20 transition-all duration-200 hover:shadow-lg hover:shadow-amber-600/30 disabled:opacity-50 disabled:shadow-none"
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>กำลังสร้างไฟล์ Excel...</span>
            </>
          ) : !canExport ? (
            <>
              <Lock className="h-4 w-4" />
              <span>ไม่มีสิทธิ์ส่งออกข้อมูล</span>
            </>
          ) : (
            <>
              <FileSpreadsheet className="h-4 w-4" />
              <span>ส่งออกสินค้าค้างส่ง .xlsx</span>
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

export function ExportListView() {
  const { hasPermission, isLoading: isPermissionLoading } = usePermission();

  const canExportSalesAdmin = hasPermission("export.sales_admin");
  const canExportPending =
    hasPermission("export.sales_admin") || hasPermission("menu.fulfillment");

  return (
    <TooltipProvider>
      <div className="container mx-auto space-y-6 p-4 md:p-6 lg:p-8 max-w-5xl">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-8 md:px-8 md:py-10 shadow-xl">
          {/* Background decorations */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-600/10 via-transparent to-amber-600/5" />
          <div className="absolute top-0 right-0 -mr-20 -mt-20 h-60 w-60 rounded-full bg-blue-500/5 blur-3xl" />
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-40 w-40 rounded-full bg-amber-500/5 blur-3xl" />

          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white backdrop-blur-sm ring-1 ring-white/10">
                <Download className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
                  ศูนย์ส่งออกข้อมูล
                </h1>
                <p className="text-sm text-white/50 mt-0.5">
                  เลือกและตั้งค่าเงื่อนไขการส่งออกข้อมูลเป็นไฟล์ Excel (.xlsx)
                </p>
              </div>
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="hidden md:flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-xs text-white/40 ring-1 ring-white/10">
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>
                    {
                      [canExportSalesAdmin, canExportPending].filter(Boolean)
                        .length
                    }{" "}
                    / 2 รายการพร้อมส่งออก
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>จำนวนรายงานที่คุณมีสิทธิ์ส่งออก</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Export Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
          <SalesAdminExportCard
            canExport={canExportSalesAdmin}
            isLoadingPermission={isPermissionLoading}
          />
          <PendingDeliveriesExportCard
            canExport={canExportPending}
            isLoadingPermission={isPermissionLoading}
          />
        </div>

        {/* Security Notice */}
        {(!canExportSalesAdmin || !canExportPending) &&
          !isPermissionLoading && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-500/15 bg-amber-500/5 p-4 text-amber-800 dark:text-amber-300/80 w-full">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 flex-shrink-0">
                <ShieldAlert className="h-4 w-4" />
              </div>
              <div className="text-xs sm:text-sm leading-relaxed">
                <span className="font-semibold">
                  หมายเหตุเรื่องสิทธิ์การใช้งาน:{" "}
                </span>
                หากปุ่มส่งออกถูกปิดการใช้งาน (Disabled)
                แสดงว่าบัญชีของคุณยังไม่ได้รับสิทธิ์การส่งออกข้อมูลสำหรับส่วนงานนั้นๆ
                กรุณาติดต่อผู้ดูแลระบบ (Administrator)
                เพื่อขอรับสิทธิ์ผ่านระบบจัดการสิทธิ์ (RBAC)
              </div>
            </div>
          )}
      </div>
    </TooltipProvider>
  );
}
