"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UploadCloud, FileDown, Loader2, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { downloadProductCheckTemplateAction, checkProductDataAction } from "../../server/check-product-actions";
import { CheckProductResults } from "./check-product-results";

export function CheckProductView() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleDownloadTemplate = async () => {
    try {
      setIsDownloading(true);
      const res = await downloadProductCheckTemplateAction();
      if (res.success && res.data) {
        const byteCharacters = atob(res.data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `product-check-template-${new Date().toISOString().split("T")[0]}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        toast.error(res.message || "เกิดข้อผิดพลาดในการดาวน์โหลด");
      }
    } catch (err: any) {
      toast.error("เกิดข้อผิดพลาดในการดาวน์โหลด: " + err.message);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      toast.error("กรุณาอัปโหลดไฟล์ Excel (.xlsx, .xls) เท่านั้น");
      return;
    }

    try {
      setIsChecking(true);
      setResults(null);
      const formData = new FormData();
      formData.append("file", file);

      const res = await checkProductDataAction(formData);

      if (res.success) {
        setResults(res);
        toast.success(`ตรวจสอบสำเร็จ ${res.totalChecked} รายการ`);
      } else {
        toast.error(res.message || "เกิดข้อผิดพลาดในการตรวจสอบ");
      }
    } catch (err: any) {
      toast.error("เกิดข้อผิดพลาดในการตรวจสอบ: " + err.message);
    } finally {
      setIsChecking(false);
      // Reset input so the same file can be uploaded again if needed
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">ตรวจสอบข้อมูลสินค้า (Excel)</h1>
          <p className="text-sm text-gray-500 mt-1">อัปโหลดไฟล์ Excel เพื่อเปรียบเทียบข้อมูลสินค้าในระบบกับข้อมูลจากไฟล์</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleDownloadTemplate} 
            disabled={isDownloading}
            className="bg-white"
          >
            {isDownloading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileDown className="w-4 h-4 mr-2" />}
            ดาวน์โหลด Template
          </Button>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
          <FileSpreadsheet className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900">อัปโหลดไฟล์ Excel เพื่อตรวจสอบ</h2>
        <p className="text-sm text-gray-500 mt-1 mb-6 text-center max-w-md">
          ใช้ Template ที่ดาวน์โหลดจากระบบ เพื่อความแม่นยำในการตรวจสอบข้อมูล <br/>รองรับเฉพาะไฟล์ .xlsx และ .xls
        </p>
        
        <div className="relative">
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileUpload}
            disabled={isChecking}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />
          <Button disabled={isChecking} className="px-8" size="lg">
            {isChecking ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                กำลังตรวจสอบข้อมูล...
              </>
            ) : (
              <>
                <UploadCloud className="w-5 h-5 mr-2" />
                เลือกไฟล์อัปโหลด
              </>
            )}
          </Button>
        </div>
      </div>

      {results && <CheckProductResults results={results} />}
    </div>
  );
}
