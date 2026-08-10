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
      toast.error("คุณไม่มีสิทธิ์ในการส่งออกข้อมูลการขาย (ธุรการขาย)");
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
      toast.success("ส่งออกข้อมูลการขาย (ธุรการขาย) สำเร็จ");
    } catch (error: any) {
      toast.error(error.message || "เกิดข้อผิดพลาดไม่ทราบสาเหตุ");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card className="flex flex-col justify-between transition-all duration-200 hover:shadow-md border-border/80">
      <CardHeader className="space-y-3 pb-4 mt-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Building2 className="h-6 w-6" />
          </div>
          {isLoadingPermission ? (
            <Badge variant="outline" className="text-xs animate-pulse">
              กำลังตรวจสอบสิทธิ์...
            </Badge>
          ) : canExport ? (
            <Badge
              variant="secondary"
              className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 gap-1"
            >
              <CheckCircle2 className="h-3 w-3" />
              อนุญาตสิทธิ์การใช้งาน
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 gap-1"
            >
              <Lock className="h-3 w-3" />
              ไม่มีสิทธิ์การส่งออก
            </Badge>
          )}
        </div>

        <div>
          <CardTitle className="text-lg font-bold">ข้อมูลการขาย</CardTitle>
          <CardDescription className="mt-1 text-sm leading-relaxed">
            ส่งออกข้อมูลเอกสารการขาย
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        {/* Local Filter Options Box */}
        <div className="rounded-lg border border-border/70 bg-muted/30 p-3.5 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <Filter className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span>เงื่อนไขการค้นหารายงาน</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Quick Date Preset */}
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-[11px] font-medium flex items-center gap-1">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span>ช่วงเวลา (Quick Filter)</span>
              </Label>
              <Select value={datePreset} onValueChange={handlePresetChange}>
                <SelectTrigger className="h-8 text-xs w-full bg-background">
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
            <div className="space-y-1">
              <Label className="text-[11px] font-medium flex items-center gap-1">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <span>วันที่เริ่มต้น</span>
              </Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="h-8 text-xs w-full bg-background"
              />
            </div>

            {/* End Date */}
            <div className="space-y-1">
              <Label className="text-[11px] font-medium flex items-center gap-1">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <span>วันที่สิ้นสุด</span>
              </Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => handleEndDateChange(e.target.value)}
                className="h-8 text-xs w-full bg-background"
              />
            </div>

            {/* Status Select */}
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-[11px] font-medium">สถานะใบขาย</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-8 text-xs w-full bg-background">
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

        {/* File Detail Highlights */}
        <div className="text-xs text-muted-foreground space-y-1.5">
          <div className="font-medium text-foreground">
            รายละเอียดคอลัมน์ในไฟล์ Excel:
          </div>
          <ul className="list-disc list-inside space-y-0.5 pl-1 text-[11px]">
            <li>
              เลขที่เอกสาร, วันที่เอกสาร, สถานะใบขาย, ชื่อลูกค้า, ประเภทลูกค้า
            </li>
            <li>
              เงื่อนไขชำระเงิน, วันครบกำหนด, วันส่งจริง, วิธีจัดส่ง, บริษัทขนส่ง
            </li>
            <li>
              ยอดรวมสินค้า, ค่าจัดส่ง, ค่าใช้จ่ายอื่นๆ, ยอดรวมสุทธิ
              และรายการสินค้า
            </li>
          </ul>
        </div>
      </CardContent>

      <CardFooter className="pt-2 border-t border-border/40 mb-4">
        <Button
          onClick={handleExport}
          disabled={isExporting || !canExport || isLoadingPermission}
          className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium"
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>กำลังสร้างไฟล์ Excel...</span>
            </>
          ) : !canExport ? (
            <>
              <Lock className="h-4 w-4" />
              <span>ไม่มีสิทธิ์ส่งออกข้อมูล (export.sales_admin)</span>
            </>
          ) : (
            <>
              <FileSpreadsheet className="h-4 w-4" />
              <span>ส่งออกข้อมูลการขาย (ธุรการขาย) .xlsx</span>
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
        toast.error(res.error || "เกิดข้อผิดพลาดในการส่งออกข้อมูลสินค้าค้างส่ง");
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
    <Card className="flex flex-col justify-between transition-all duration-200 hover:shadow-md border-border/80">
      <CardHeader className="space-y-3 pb-4 mt-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Package className="h-6 w-6" />
          </div>
          {isLoadingPermission ? (
            <Badge variant="outline" className="text-xs animate-pulse">
              กำลังตรวจสอบสิทธิ์...
            </Badge>
          ) : canExport ? (
            <Badge
              variant="secondary"
              className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 gap-1"
            >
              <CheckCircle2 className="h-3 w-3" />
              อนุญาตสิทธิ์การใช้งาน
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 gap-1"
            >
              <Lock className="h-3 w-3" />
              ไม่มีสิทธิ์การส่งออก
            </Badge>
          )}
        </div>

        <div>
          <CardTitle className="text-lg font-bold">สินค้าค้างส่ง</CardTitle>
          <CardDescription className="mt-1 text-sm leading-relaxed">
            ส่งออก รายงานรายการสินค้าที่อยู่ระหว่างรอการจัดส่งทั้งหมด
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        {/* File Detail Highlights */}
        <div className="rounded-lg border border-border/70 bg-muted/30 p-3.5 space-y-2">
          <div className="font-medium text-xs text-foreground">
            รายละเอียดคอลัมน์ในไฟล์ Excel:
          </div>
          <ul className="list-disc list-inside space-y-1 text-[11px] text-muted-foreground">
            <li>เลขที่ออเดอร์ (Order Ref / Sale Number)</li>
            <li>ชื่อลูกค้า</li>
            <li>รหัสสินค้า และชื่อสินค้า</li>
            <li>จำนวนสินค้าที่ค้างส่ง (Pending Quantity)</li>
          </ul>
        </div>
      </CardContent>

      <CardFooter className="pt-2 border-t border-border/40 mb-4">
        <Button
          onClick={handleExport}
          disabled={isExporting || !canExport || isLoadingPermission}
          className="w-full gap-2 bg-amber-600 hover:bg-amber-700 text-white font-medium"
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
    <div className="container mx-auto space-y-6 p-4 md:p-6 lg:p-8 max-w-5xl">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                ศูนย์ส่งออกข้อมูล (Export Center)
              </h1>
              <p className="text-sm text-muted-foreground">
                เลือกและตั้งค่าเงื่อนไขการส่งออกข้อมูลเป็นไฟล์ Excel (.xlsx)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Export Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        <SalesAdminExportCard
          canExport={canExportSalesAdmin}
          isLoadingPermission={isPermissionLoading}
        />
        <PendingDeliveriesExportCard
          canExport={canExportPending}
          isLoadingPermission={isPermissionLoading}
        />
      </div>

      {/* Security Banner / Notice */}
      {(!canExportSalesAdmin || !canExportPending) && !isPermissionLoading && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 text-amber-800 dark:text-amber-300 w-full">
          <ShieldAlert className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm">
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
  );
}

