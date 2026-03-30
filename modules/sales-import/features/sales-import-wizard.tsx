"use client";

import { useState } from "react";
import { Upload, File, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { importLegacySalesAction } from "../server/actions";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function SalesImportWizard() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("กรุณาเลือกไฟล์ Excel");
      return;
    }

    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    const res = await importLegacySalesAction(formData);
    
    setLoading(false);
    setResult(res);

    if (res.success) {
      toast.success(res.message);
    } else {
      toast.error(res.message);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Upload className="w-6 h-6" /> นำเข้าข้อมูลการขายแบบ Legacy
          </CardTitle>
          <CardDescription>
            อัปโหลดไฟล์ Excel (.xlsx) ที่มีคอลัมน์: ปี, เดือน, รหัสสินค้า, พนักงานขาย, ร้านค้า, จำนวนที่ขายรวม, ขนาดบรรจุรวมที่ขายได้, ราคาขายรวม
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!result ? (
            <div className="flex flex-col gap-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-10 flex flex-col items-center justify-center bg-gray-50/50">
                <File className="w-12 h-12 text-gray-400 mb-4" />
                <label className="cursor-pointer">
                  <span className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">
                    คลิกเพื่อเลือกไฟล์
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".xlsx, .xls"
                    onChange={handleFileChange}
                  />
                </label>
                {file && (
                  <p className="mt-4 text-sm text-gray-600 font-medium">
                    ไฟล์ที่เลือก: {file.name}
                  </p>
                )}
              </div>
              
              <Button
                onClick={handleUpload}
                disabled={!file || loading}
                className="w-full h-12 text-lg"
              >
                {loading ? (
                  <><RefreshCw className="mr-2 h-5 w-5 animate-spin" /> กำลังประมวลผลไฟล์...</>
                ) : (
                  "เริ่มการนำเข้าข้อมูล"
                )}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div
                className={`p-6 rounded-lg flex items-start gap-4 ${
                  result.success ? "bg-green-50 text-green-900 border border-green-200" : "bg-red-50 text-red-900 border border-red-200"
                }`}
              >
                {result.success ? (
                  <CheckCircle className="w-8 h-8 text-green-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-8 h-8 text-red-600 shrink-0" />
                )}
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-1">{result.success ? "ทำรายการสำเร็จ" : "เกิดข้อผิดพลาด"}</h3>
                  <p>{result.message}</p>
                </div>
              </div>

              {result.errors && result.errors.length > 0 && (
                <div className="mt-4 bg-gray-50 p-4 rounded-lg border">
                  <h4 className="font-semibold mb-2 text-red-600">ข้อผิดพลาดที่พบระหว่างอัปโหลด:</h4>
                  <ul className="list-disc pl-5 text-sm space-y-1 text-gray-700 max-h-60 overflow-y-auto">
                    {result.errors.map((err: string, idx: number) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setResult(null);
                  setFile(null);
                }}
              >
                เพิ่มไฟล์ใหม่
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
