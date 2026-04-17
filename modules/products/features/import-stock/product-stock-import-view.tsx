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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";
import {
  importBulkStockAction,
  downloadBulkStockTemplateAction,
} from "../../server/import-actions";

type Step = "upload" | "result";

export default function ProductStockImportView() {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);

  // Result state
  const [result, setResult] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = useCallback(async () => {
    setDownloadingTemplate(true);
    try {
      const res = await downloadBulkStockTemplateAction();
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
        a.download = "template_stock_bulk.xlsx";
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
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
        setResult(null);
      } else {
        toast.error("กรุณาเลือกไฟล์ Excel (.xlsx หรือ .xls)");
      }
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("กรุณาเลือกไฟล์");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await importBulkStockAction(formData);
      setResult(res);
      setStep("result");

      if (res.success) {
        toast.success(res.message || "นำเข้าข้อมูลสำเร็จ");
      } else {
        toast.error(res.message || "เกิดข้อผิดพลาด");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการนำเข้า");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setStep("upload");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="bg-white shadow-sm sm:rounded-lg">
      <div className="p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/products">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20">
              <Upload className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
                นำเข้าสต็อกสินค้า (หลายรายการ)
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                อัปโหลดไฟล์ Excel เพื่อเพิ่มหรืออัปเดตสต็อกสินค้าด้วยรหัสสินค้า
              </p>
            </div>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {["อัปโหลดไฟล์", "ผลลัพธ์"].map((label, idx) => {
            const stepMap: Step[] = ["upload", "result"];
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
                      ดาวน์โหลดไฟล์ Template Excel พร้อมฟอร์แมตสำหรับการนำเข้าสต็อก
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

            <Card className="border-slate-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-slate-700">
                  <Info className="h-4 w-4 text-blue-500" />
                  หลักการนำเข้าข้อมูล
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-5">
                <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
                  <li>ระบบจะค้นหาสินค้าจาก <strong className="text-rose-600">รหัสสินค้า (Product Code)</strong> เท่านั้น</li>
                  <li>หากพบสินค้าในระบบ และ เลขที่ล็อต (Lot Number) ตรงกับในระบบสต็อก จะทำการ <strong className="text-emerald-600">อัปเดตจำนวนและข้อมูล</strong> ของล็อตนั้น</li>
                  <li>หากรหัสมีอยู่ แต่เลขที่ล็อตไม่ซ้ำ จะทำการ <strong className="text-blue-600">สร้างล็อตใหม่</strong> เข้าไปในสต็อก</li>
                  <li>เลขที่ล็อต (Lot Number) และ จำนวน (Quantity) เป็นฟิลด์ที่บังคับกรอก</li>
                </ul>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button
                onClick={handleImport}
                disabled={!file || loading}
                className="bg-blue-600 hover:bg-blue-700 text-white h-11 px-8"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    กำลังประมวลผล...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    ประมวลผลการนำเข้า
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* ─────────────────── STEP 2: RESULT ─────────────────── */}
        {step === "result" && result && (
          <div className="max-w-3xl mx-auto space-y-6">
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
                      ? "นำเข้าข้อมูลเสร็จสิ้น"
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

            {result.success && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border-slate-100">
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-slate-800">
                      {result.totalRows}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">จำนวนที่อ่านได้ทั้งหมด</p>
                  </CardContent>
                </Card>
                <Card className="border-blue-100">
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-blue-600">
                      {result.createdCount || 0}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">ล็อตใหม่</p>
                  </CardContent>
                </Card>
                <Card className="border-amber-100">
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-amber-600">
                      {result.updatedCount || 0}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">ล็อตที่ถูกอัปเดต</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {result.errors && result.errors.length > 0 && (
              <Card className="border-red-200 bg-red-50/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2 text-red-700">
                    <AlertTriangle className="h-4 w-4" />
                    รายการข้อผิดพลาด ({result.errors.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {result.errors.map((err: string, idx: number) => (
                      <p key={idx} className="text-sm text-red-800">
                        • {err}
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-between">
              <Button variant="outline" onClick={handleReset}>
                <RefreshCw className="h-4 w-4 mr-2" />
                นำเข้าไฟล์อื่นเพิ่มเติม
              </Button>
              <Link href="/products">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  ดูรายการสินค้า
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
