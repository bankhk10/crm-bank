"use client";

import { useState } from "react";
import { format, startOfMonth } from "date-fns";
import { toast } from "sonner";
import {
  Download,
  FileSpreadsheet,
  Lock,
  CheckCircle2,
  Filter,
  Calendar,
  Building2,
  Megaphone,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { usePermission } from "@/hooks/use-permission";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { exportSalesAdminAction, exportSalesMarketingAction } from "../server/actions";

const SALE_STATUS_OPTIONS = [
  { value: "ALL", label: "สถานะทั้งหมด" },
  { value: "APPROVED", label: "อนุมัติแล้ว" },
  { value: "DELIVERY_COMPLETED", label: "จัดส่งสำเร็จ" },
  { value: "PAID", label: "ชำระเงินแล้ว" },
  { value: "PENDING_APPROVAL", label: "รออนุมัติ" },
  { value: "AWAITING_DELIVERY", label: "รอดำเนินการจัดส่ง" },
  { value: "COMPLETED", label: "เสร็จสิ้น" },
  { value: "CANCELLED", label: "ยกเลิก" },
];

export function ExportListView() {
  const { hasPermission, isLoading: isPermissionLoading } = usePermission();

  const canExportSalesAdmin = hasPermission("export.sales_admin");
  const canExportSalesMarketing = hasPermission("export.sales_marketing");

  // Default filters: start of current month to today
  const [startDate, setStartDate] = useState<string>(
    format(startOfMonth(new Date()), "yyyy-MM-dd")
  );
  const [endDate, setEndDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd")
  );
  const [status, setStatus] = useState<string>("ALL");

  const [isExportingAdmin, setIsExportingAdmin] = useState(false);
  const [isExportingMarketing, setIsExportingMarketing] = useState(false);

  // Helper to trigger browser download from base64
  const triggerDownload = (base64: string, filename: string) => {
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
  };

  const handleExportAdmin = async () => {
    if (!canExportSalesAdmin) {
      toast.error("คุณไม่มีสิทธิ์ในการส่งออกข้อมูลการขาย (ธุรการขาย)");
      return;
    }

    setIsExportingAdmin(true);
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
      setIsExportingAdmin(false);
    }
  };

  const handleExportMarketing = async () => {
    if (!canExportSalesMarketing) {
      toast.error("คุณไม่มีสิทธิ์ในการส่งออกข้อมูลการขาย (การตลาด)");
      return;
    }

    setIsExportingMarketing(true);
    try {
      const res = await exportSalesMarketingAction({
        startDate,
        endDate,
        status: status as any,
      });

      if (!res.success || !res.data) {
        toast.error(res.error || "เกิดข้อผิดพลาดในการส่งออกข้อมูล");
        return;
      }

      triggerDownload(res.data.base64, res.data.filename);
      toast.success("ส่งออกข้อมูลการขาย (การตลาด) สำเร็จ");
    } catch (error: any) {
      toast.error(error.message || "เกิดข้อผิดพลาดไม่ทราบสาเหตุ");
    } finally {
      setIsExportingMarketing(false);
    }
  };

  return (
    <div className="container mx-auto space-y-6 p-4 md:p-6 lg:p-8 max-w-7xl">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">ศูนย์ส่งออกข้อมูล (Export Center)</h1>
              <p className="text-sm text-muted-foreground">
                เลือกเงื่อนไขข้อมูลและส่งออกไฟล์ Excel (.xlsx) ตามสิทธิ์การใช้งานของคุณ
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <Card className="shadow-sm border-border/80 bg-card/60 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 text-base font-semibold">
            <Filter className="h-4 w-4 text-primary" />
            <span>เงื่อนไขการส่งออกข้อมูล (Filter Options)</span>
          </div>
          <CardDescription>
            กำหนดช่วงวันที่เอกสารและสถานะเพื่อกรองข้อมูลสำหรับการส่งออก
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Start Date */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <span>วันที่เริ่มต้น (Start Date)</span>
              </Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full"
              />
            </div>

            {/* End Date */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <span>วันที่สิ้นสุด (End Date)</span>
              </Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Status Select */}
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
              <Label className="text-xs font-medium">สถานะใบขาย (Sale Status)</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="เลือกสถานะ" />
                </SelectTrigger>
                <SelectContent>
                  {SALE_STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Sales Admin Export */}
        <Card className="flex flex-col justify-between transition-all duration-200 hover:shadow-md border-border/80">
          <CardHeader className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Building2 className="h-6 w-6" />
              </div>
              {isPermissionLoading ? (
                <Badge variant="outline" className="text-xs animate-pulse">
                  กำลังตรวจสอบสิทธิ์...
                </Badge>
              ) : canExportSalesAdmin ? (
                <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  อนุญาตสิทธิ์การใช้งาน
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 gap-1">
                  <Lock className="h-3 w-3" />
                  ไม่มีสิทธิ์การส่งออก
                </Badge>
              )}
            </div>

            <div>
              <CardTitle className="text-lg font-bold">
                ข้อมูลการขาย (ธุรการขาย)
              </CardTitle>
              <CardDescription className="mt-1 text-sm leading-relaxed">
                ส่งออกข้อมูลรายการขายฉบับเต็ม เน้นการติดตามงานธุรการ การจัดส่งสินค้า ข้อมูลลูกค้า บริษัทขนส่ง เงื่อนไขการชำระเงิน และวันครบกำหนดชำระ
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="text-xs text-muted-foreground space-y-2 border-t border-border/40 pt-4">
            <div className="font-semibold text-foreground">รายละเอียดข้อมูลในไฟล์ Excel:</div>
            <ul className="list-disc list-inside space-y-1 pl-1">
              <li>เลขที่เอกสาร, วันที่เอกสาร, สถานะใบขาย</li>
              <li>ข้อมูลลูกค้า, ประเภทลูกค้า, จังหวัด, พนักงานขาย</li>
              <li>เงื่อนไขชำระเงิน, วันครบกำหนด, ผู้สร้าง & ผู้อนุมัติ</li>
              <li>ยอดรวมสินค้า, ค่าจัดส่ง, ค่าใช้จ่ายอื่นๆ, ยอดรวมสุทธิ</li>
              <li>วิธีจัดส่ง, บริษัทขนส่ง, รายการสินค้า และราคารวม</li>
            </ul>
          </CardContent>

          <CardFooter className="pt-4 border-t border-border/40">
            <Button
              onClick={handleExportAdmin}
              disabled={isExportingAdmin || !canExportSalesAdmin || isPermissionLoading}
              className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium"
            >
              {isExportingAdmin ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>กำลังสร้างไฟล์ Excel...</span>
                </>
              ) : !canExportSalesAdmin ? (
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

        {/* Card 2: Sales Marketing Export */}
        <Card className="flex flex-col justify-between transition-all duration-200 hover:shadow-md border-border/80">
          <CardHeader className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <Megaphone className="h-6 w-6" />
              </div>
              {isPermissionLoading ? (
                <Badge variant="outline" className="text-xs animate-pulse">
                  กำลังตรวจสอบสิทธิ์...
                </Badge>
              ) : canExportSalesMarketing ? (
                <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  อนุญาตสิทธิ์การใช้งาน
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 gap-1">
                  <Lock className="h-3 w-3" />
                  ไม่มีสิทธิ์การส่งออก
                </Badge>
              )}
            </div>

            <div>
              <CardTitle className="text-lg font-bold">
                ข้อมูลการขาย (การตลาด)
              </CardTitle>
              <CardDescription className="mt-1 text-sm leading-relaxed">
                ส่งออกข้อมูลวิเคราะห์เชิงลึกทางการตลาด ประสิทธิภาพของรายสินค้า หมวดหมู่ กลุ่มชื่อการค้า พืชที่ใช้จำแนกตามภูมิภาค และการใช้งานงบโปรโมชั่น
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="text-xs text-muted-foreground space-y-2 border-t border-border/40 pt-4">
            <div className="font-semibold text-foreground">รายละเอียดข้อมูลในไฟล์ Excel:</div>
            <ul className="list-disc list-inside space-y-1 pl-1">
              <li>เลขที่เอกสาร, วันที่ทำรายการ, สถานะ</li>
              <li>ภูมิภาค, จังหวัด, ชื่อลูกค้า, พนักงานขาย</li>
              <li>หมวดหมู่สินค้า, กลุ่มชื่อการค้า, กลุ่มสินค้า, ประเภท ABC</li>
              <li>แบรนด์สินค้า, รายชื่อพืชที่ใช้ (Plants), จำนวนและหน่วยนับ</li>
              <li>ราคาปกติ, ราคาขายจริง, ราคารวมยอดขาย และงบโปรโมชั่น</li>
            </ul>
          </CardContent>

          <CardFooter className="pt-4 border-t border-border/40">
            <Button
              onClick={handleExportMarketing}
              disabled={isExportingMarketing || !canExportSalesMarketing || isPermissionLoading}
              className="w-full gap-2 bg-purple-600 hover:bg-purple-700 text-white font-medium"
            >
              {isExportingMarketing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>กำลังสร้างไฟล์ Excel...</span>
                </>
              ) : !canExportSalesMarketing ? (
                <>
                  <Lock className="h-4 w-4" />
                  <span>ไม่มีสิทธิ์ส่งออกข้อมูล (export.sales_marketing)</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>ส่งออกข้อมูลการขาย (การตลาด) .xlsx</span>
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Security Banner / Notice */}
      {(!canExportSalesAdmin || !canExportSalesMarketing) && !isPermissionLoading && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 text-amber-800 dark:text-amber-300">
          <ShieldAlert className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm">
            <span className="font-semibold">หมายเหตุเรื่องสิทธิ์การใช้งาน: </span>
            หากปุ่มส่งออกถูกปิดการใช้งาน (Disabled) แสดงว่าบัญชีของคุณยังไม่ได้รับสิทธิ์การส่งออกข้อมูลสำหรับส่วนงานนั้นๆ กรุณาติดต่อผู้ดูแลระบบ (Administrator) เพื่อขอรับสิทธิ์ผ่านระบบจัดการสิทธิ์ (RBAC)
          </div>
        </div>
      )}
    </div>
  );
}
