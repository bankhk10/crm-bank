"use client";

import { useState, useRef, useCallback } from "react";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Download,
  RefreshCw,
  ArrowLeft,
  ArrowRight,
  Eye,
  Play,
  X,
  AlertTriangle,
  Info,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Link from "next/link";
import {
  importSalesNotesAction,
  previewSalesNotesAction,
  downloadSalesNoteTemplateAction,
} from "../server/actions";
import type { ImportPreviewRow } from "../application/import-sales-notes";

// ─────────────────────────────────────────────
// Steps
// ─────────────────────────────────────────────

type Step = "upload" | "preview" | "result";

export default function SalesNoteImportView() {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);

  // Preview state
  const [previewData, setPreviewData] = useState<ImportPreviewRow[]>([]);
  const [previewErrors, setPreviewErrors] = useState<string[]>([]);
  const [totalPreviewRows, setTotalPreviewRows] = useState(0);

  // Result state
  const [result, setResult] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─────────────────────────────────────────
  // Template Download
  // ─────────────────────────────────────────
  const handleDownloadTemplate = useCallback(async () => {
    setDownloadingTemplate(true);
    try {
      const res = await downloadSalesNoteTemplateAction();
      if (res.success && res.data) {
        const binary = atob(res.data);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([bytes], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "template_sales_note.xlsx";
        a.click();
        URL.revokeObjectURL(url);
        toast.success("ดาวน์โหลด Template สำเร็จ");
      } else {
        toast.error(res.message || "ไม่สามารถดาวน์โหลดได้");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการดาวน์โหลด");
    } finally {
      setDownloadingTemplate(false);
    }
  }, []);

  // ─────────────────────────────────────────
  // File Selection
  // ─────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setPreviewData([]);
      setPreviewErrors([]);
      setResult(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (
        droppedFile.name.endsWith(".xlsx") ||
        droppedFile.name.endsWith(".xls")
      ) {
        setFile(droppedFile);
        setPreviewData([]);
        setPreviewErrors([]);
        setResult(null);
      } else {
        toast.error("กรุณาเลือกไฟล์ Excel (.xlsx หรือ .xls)");
      }
    }
  };

  // ─────────────────────────────────────────
  // Preview
  // ─────────────────────────────────────────
  const handlePreview = async () => {
    if (!file) {
      toast.error("กรุณาเลือกไฟล์");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await previewSalesNotesAction(formData);

      if (res.success) {
        setPreviewData(res.preview || []);
        setPreviewErrors(res.errors || []);
        setTotalPreviewRows(res.totalRows || 0);
        setStep("preview");
      } else {
        toast.error(res.message || "ไม่สามารถตรวจสอบไฟล์ได้");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการตรวจสอบ");
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────
  // Import
  // ─────────────────────────────────────────
  const handleImport = async () => {
    if (!file) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await importSalesNotesAction(formData);
      setResult(res);
      setStep("result");

      if (res.success) {
        toast.success(res.message || "นำเข้าข้อมูลสำเร็จ");
      } else {
        toast.error(res.message || "เกิดข้อผิดพลาด");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการนำเข้าข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────
  // Reset
  // ─────────────────────────────────────────
  const handleReset = () => {
    setFile(null);
    setPreviewData([]);
    setPreviewErrors([]);
    setResult(null);
    setStep("upload");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const validRowCount = previewData.filter((r) => r.status === "valid").length;
  const errorRowCount = previewData.filter((r) => r.status === "error").length;

  return (
    <div className="bg-white shadow-sm sm:rounded-lg">
      <div className="p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/sales">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
                นำเข้าบันทึกการขาย
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                อัปโหลดไฟล์ Excel เพื่อสร้างบันทึกการขายเป็นกลุ่ม
              </p>
            </div>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {["อัปโหลดไฟล์", "ตรวจสอบข้อมูล", "ผลลัพธ์"].map((label, idx) => {
            const stepMap: Step[] = ["upload", "preview", "result"];
            const isActive = stepMap[idx] === step;
            const isPast = stepMap.indexOf(step) > idx;
            return (
              <div key={label} className="flex items-center gap-2">
                {idx > 0 && (
                  <div
                    className={`hidden sm:block w-8 h-0.5 ${isPast ? "bg-blue-500" : "bg-slate-200"}`}
                  />
                )}
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                      isActive
                        ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                        : isPast
                          ? "bg-blue-100 text-blue-700"
                          : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {isPast ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      idx + 1
                    )}
                  </div>
                  <span
                    className={`hidden sm:inline text-sm font-medium ${
                      isActive
                        ? "text-blue-700"
                        : isPast
                          ? "text-slate-600"
                          : "text-slate-400"
                    }`}
                  >
                    {label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ─────────────────── STEP 1: UPLOAD ─────────────────── */}
        {step === "upload" && (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Template Download */}
            <Card className="border-dashed border-blue-200 bg-gradient-to-br from-blue-50/50 to-indigo-50/50">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="p-3 rounded-xl bg-blue-100">
                    <FileSpreadsheet className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-800">
                      ดาวน์โหลด Template
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                      ดาวน์โหลดไฟล์ Template Excel พร้อมตัวอย่างข้อมูลและคำแนะนำ
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleDownloadTemplate}
                    disabled={downloadingTemplate}
                    className="border-blue-300 text-blue-700 hover:bg-blue-50 shrink-0"
                  >
                    {downloadingTemplate ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    ดาวน์โหลด Template
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* File Upload Zone */}
            <Card>
              <CardContent className="p-6">
                <div
                  className={`border-2 border-dashed rounded-xl p-8 sm:p-12 flex flex-col items-center justify-center transition-all cursor-pointer ${
                    file
                      ? "border-blue-300 bg-blue-50/30"
                      : "border-slate-200 bg-slate-50/50 hover:border-blue-300 hover:bg-blue-50/20"
                  }`}
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {file ? (
                    <div className="text-center">
                      <div className="inline-flex p-3 rounded-full bg-blue-100 mb-4">
                        <FileSpreadsheet className="h-8 w-8 text-blue-600" />
                      </div>
                      <p className="font-semibold text-slate-800">
                        {file.name}
                      </p>
                      <p className="text-sm text-slate-500 mt-1">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-3 text-slate-500 hover:text-red-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReset();
                        }}
                      >
                        <X className="h-4 w-4 mr-1" />
                        เปลี่ยนไฟล์
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="inline-flex p-3 rounded-full bg-slate-100 mb-4">
                        <Upload className="h-8 w-8 text-slate-400" />
                      </div>
                      <p className="font-semibold text-slate-600">
                        ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์
                      </p>
                      <p className="text-sm text-slate-400 mt-1">
                        รองรับไฟล์ .xlsx และ .xls
                      </p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Column Info */}
            <Card className="border-slate-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-slate-700">
                  <Info className="h-4 w-4 text-blue-500" />
                  คอลัมน์ที่จำเป็น
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { name: "วันที่ขาย", desc: "DD/MM/YYYY" },
                    { name: "รหัสพนักงาน", desc: "Employee Code" },
                    { name: "รหัสร้านค้า", desc: "Customer Code" },
                    { name: "รหัสสินค้า", desc: "Product Code" },
                    { name: "จำนวน", desc: "จำนวนเต็ม" },
                    { name: "ราคาต่อหน่วย", desc: "บาท" },
                    { name: "ยอดรวม", desc: "จำนวน × ราคา" },
                  ].map((col) => (
                    <div
                      key={col.name}
                      className="px-3 py-2 bg-slate-50 rounded-lg border border-slate-100"
                    >
                      <p className="text-xs font-medium text-slate-700">
                        {col.name}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {col.desc}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-3">
                  <p className="text-xs text-slate-500">
                    <span className="font-medium">คอลัมน์เสริม:</span>{" "}
                    เงื่อนไขการชำระเงิน (ค่าเริ่มต้น: เครดิต 90 วัน), หมายเหตุ,
                    ประเภท (ABC Code), วันที่ชำระเงิน, ราคาลัง, เลขที่ออเดอร์
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Grouping Info */}
            <Card className="border-slate-100">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-amber-50">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700">
                      หลักการจัดกลุ่ม
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      ถ้าระบุ <strong>เลขที่ออเดอร์</strong> เดียวกัน จะรวมเป็น 1 ใบขาย
                      ถ้าไม่ระบุ จะจัดกลุ่มจาก <strong>วันที่ + พนักงาน + ร้านค้า + เงื่อนไขชำระเงิน</strong>
                      พร้อมตั้งสถานะ &quot;เสร็จสิ้น&quot; อัตโนมัติ
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action */}
            <div className="flex justify-end">
              <Button
                onClick={handlePreview}
                disabled={!file || loading}
                className="bg-blue-600 hover:bg-blue-700 text-white h-11 px-8"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    กำลังตรวจสอบ...
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    ตรวจสอบข้อมูล
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* ─────────────────── STEP 2: PREVIEW ─────────────────── */}
        {step === "preview" && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="border-slate-100">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-50">
                    <FileSpreadsheet className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800">
                      {totalPreviewRows}
                    </p>
                    <p className="text-xs text-slate-500">แถวทั้งหมด</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-emerald-100">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-50">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-emerald-600">
                      {validRowCount}
                    </p>
                    <p className="text-xs text-slate-500">ข้อมูลถูกต้อง</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-red-100">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-50">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-600">
                      {errorRowCount}
                    </p>
                    <p className="text-xs text-slate-500">ข้อผิดพลาด</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Error List */}
            {previewErrors.length > 0 && (
              <Card className="border-amber-200 bg-amber-50/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2 text-amber-700">
                    <AlertTriangle className="h-4 w-4" />
                    รายการข้อผิดพลาด ({previewErrors.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {previewErrors.map((err, idx) => (
                      <p key={idx} className="text-sm text-amber-800">
                        • {err}
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Preview Table */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-slate-700">
                  ตัวอย่างข้อมูล
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-y border-slate-100">
                        <th className="px-3 py-2.5 text-left font-medium text-slate-600">
                          แถว
                        </th>
                        <th className="px-3 py-2.5 text-left font-medium text-slate-600">
                          สถานะ
                        </th>
                        <th className="px-3 py-2.5 text-left font-medium text-slate-600">
                          เลขออเดอร์
                        </th>
                        <th className="px-3 py-2.5 text-left font-medium text-slate-600">
                          วันที่ขาย
                        </th>
                        <th className="px-3 py-2.5 text-left font-medium text-slate-600">
                          พนักงาน
                        </th>
                        <th className="px-3 py-2.5 text-left font-medium text-slate-600">
                          ร้านค้า
                        </th>
                        <th className="px-3 py-2.5 text-left font-medium text-slate-600">
                          สินค้า
                        </th>
                        <th className="px-3 py-2.5 text-left font-medium text-slate-600">
                          ABC Code
                        </th>
                        <th className="px-3 py-2.5 text-right font-medium text-slate-600">
                          จำนวน
                        </th>
                        <th className="px-3 py-2.5 text-right font-medium text-slate-600">
                          ราคา/หน่วย
                        </th>
                        <th className="px-3 py-2.5 text-right font-medium text-slate-600">
                          ราคาลัง
                        </th>
                        <th className="px-3 py-2.5 text-right font-medium text-slate-600">
                          ยอดรวม
                        </th>
                        <th className="px-3 py-2.5 text-left font-medium text-slate-600">
                          ชำระเงิน
                        </th>
                        <th className="px-3 py-2.5 text-left font-medium text-slate-600">
                          วันที่ชำระ
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.slice(0, 50).map((row, idx) => (
                        <tr
                          key={idx}
                          className={`border-b border-slate-50 ${
                            row.status === "error"
                              ? "bg-red-50/50"
                              : "hover:bg-slate-50/50"
                          }`}
                        >
                          <td className="px-3 py-2 text-slate-500 text-xs">
                            {row.row}
                          </td>
                          <td className="px-3 py-2">
                            {row.status === "valid" ? (
                              <Badge
                                variant="outline"
                                className="text-emerald-700 border-emerald-200 bg-emerald-50 text-[11px]"
                              >
                                ✓ ถูกต้อง
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="text-red-700 border-red-200 bg-red-50 text-[11px]"
                              >
                                ✗ ผิดพลาด
                              </Badge>
                            )}
                          </td>
                          <td className="px-3 py-2 text-slate-700 text-xs whitespace-nowrap">
                            {row.orderNumber}
                          </td>
                          <td className="px-3 py-2 text-slate-700 whitespace-nowrap">
                            {row.saleDate}
                          </td>
                          <td className="px-3 py-2 text-slate-700 max-w-[120px] truncate">
                            {row.employeeName}
                          </td>
                          <td className="px-3 py-2 text-slate-700 max-w-[120px] truncate">
                            {row.customerName}
                          </td>
                          <td className="px-3 py-2">
                            <div>
                              <span className="text-xs text-slate-400">
                                {row.productCode}
                              </span>
                              <p className="text-slate-700 text-xs truncate max-w-[140px]">
                                {row.productName}
                              </p>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-slate-600 text-xs">
                            {row.abcCode}
                          </td>
                          <td className="px-3 py-2 text-right text-slate-700 tabular-nums">
                            {row.quantity.toLocaleString()}
                          </td>
                          <td className="px-3 py-2 text-right text-slate-700 tabular-nums">
                            {row.unitPrice.toLocaleString("th-TH", {
                              minimumFractionDigits: 2,
                            })}
                          </td>
                          <td className="px-3 py-2 text-right text-slate-700 tabular-nums">
                            {row.cartonPrice != null
                              ? row.cartonPrice.toLocaleString("th-TH", {
                                  minimumFractionDigits: 2,
                                })
                              : "-"}
                          </td>
                          <td className="px-3 py-2 text-right font-medium text-slate-800 tabular-nums">
                            {row.totalPrice.toLocaleString("th-TH", {
                              minimumFractionDigits: 2,
                            })}
                          </td>
                          <td className="px-3 py-2 text-slate-600 text-xs whitespace-nowrap">
                            {row.paymentTerm}
                          </td>
                          <td className="px-3 py-2 text-slate-600 text-xs whitespace-nowrap">
                            {row.paymentDate}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {previewData.length > 50 && (
                    <div className="px-4 py-3 text-center text-sm text-slate-500 bg-slate-50 border-t">
                      แสดง 50 จาก {previewData.length} แถว
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between">
              <Button
                variant="outline"
                onClick={() => setStep("upload")}
                className="order-2 sm:order-1"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                กลับ
              </Button>
              <div className="flex gap-3 order-1 sm:order-2 items-center">
                {errorRowCount > 0 && (
                  <div className="flex items-center gap-2 text-sm text-amber-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span>
                      แถวที่ผิดพลาด {errorRowCount} แถว จะถูกข้ามไป
                    </span>
                  </div>
                )}
                <Button
                  onClick={handleImport}
                  disabled={loading || validRowCount === 0}
                  className="bg-blue-600 hover:bg-blue-700 text-white h-11 px-8"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      กำลังนำเข้า...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      นำเข้าข้อมูล ({validRowCount} แถว)
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────── STEP 3: RESULT ─────────────────── */}
        {step === "result" && result && (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Result Banner */}
            <Card
              className={`${
                result.success
                  ? "border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50"
                  : "border-red-200 bg-gradient-to-br from-red-50 to-rose-50"
              }`}
            >
              <CardContent className="p-6 flex items-start gap-4">
                {result.success ? (
                  <div className="p-3 rounded-full bg-emerald-100 shrink-0">
                    <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                  </div>
                ) : (
                  <div className="p-3 rounded-full bg-red-100 shrink-0">
                    <AlertCircle className="h-8 w-8 text-red-600" />
                  </div>
                )}
                <div className="flex-1">
                  <h3
                    className={`font-bold text-lg ${result.success ? "text-emerald-800" : "text-red-800"}`}
                  >
                    {result.success
                      ? "นำเข้าข้อมูลสำเร็จ"
                      : "เกิดข้อผิดพลาด"}
                  </h3>
                  <p
                    className={`mt-1 ${result.success ? "text-emerald-700" : "text-red-700"}`}
                  >
                    {result.message}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            {result.success && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border-slate-100">
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-slate-800">
                      {result.totalRows}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">แถวทั้งหมด</p>
                  </CardContent>
                </Card>
                <Card className="border-emerald-100">
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-emerald-600">
                      {result.importedOrders || 0}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">ใบบันทึกที่สร้าง</p>
                  </CardContent>
                </Card>
                <Card className="border-amber-100">
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-amber-600">
                      {result.skippedRows || 0}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">แถวที่ข้ามไป</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Errors */}
            {result.errors && result.errors.length > 0 && (
              <Card className="border-amber-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2 text-amber-700">
                    <AlertTriangle className="h-4 w-4" />
                    แถวที่ถูกข้ามไป ({result.errors.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {result.errors.map((err: string, idx: number) => (
                      <p key={idx} className="text-sm text-amber-800">
                        • {err}
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between">
              <Button variant="outline" onClick={handleReset}>
                <RefreshCw className="h-4 w-4 mr-2" />
                นำเข้าไฟล์ใหม่
              </Button>
              <Link href="/sales">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  ดูบันทึกการขายทั้งหมด
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
