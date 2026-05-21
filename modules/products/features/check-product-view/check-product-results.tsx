"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { syncProductDataAction } from "../../server/check-product-actions";

interface MismatchDiscrepancy {
  field: string;
  excelValue: any;
  dbValue: any;
}

interface MismatchedProduct {
  rowNum: number;
  productId: string;
  productCode: string;
  tradeName: string;
  discrepancies: MismatchDiscrepancy[];
  rawExcelData: any;
}

interface MissingProduct {
  rowNum: number;
  productCode: string;
  tradeName: string;
  reason: string;
}

interface MatchedProduct {
  rowNum: number;
  productCode: string;
  tradeName: string;
}

interface CheckProductResultsProps {
  results: {
    missingProducts: MissingProduct[];
    mismatchedProducts: MismatchedProduct[];
    matchedProducts: MatchedProduct[];
    totalChecked: number;
  };
}

export function CheckProductResults({ results }: CheckProductResultsProps) {
  const { missingProducts, mismatchedProducts, matchedProducts, totalChecked } = results;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncedIds, setSyncedIds] = useState<Set<string>>(new Set());

  const unsyncedMismatched = mismatchedProducts.filter(p => !syncedIds.has(p.productId));

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = unsyncedMismatched.map(p => p.productId).filter(Boolean);
      setSelectedIds(new Set(allIds));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelect = (productId: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) {
      newSet.add(productId);
    } else {
      newSet.delete(productId);
    }
    setSelectedIds(newSet);
  };

  const handleSync = async () => {
    if (selectedIds.size === 0) return;
    setIsSyncing(true);
    try {
      const itemsToSync = mismatchedProducts.filter(p => selectedIds.has(p.productId));
      const res = await syncProductDataAction(itemsToSync);
      if (res.success) {
        toast.success(res.message);
        const newSynced = new Set(syncedIds);
        selectedIds.forEach(id => newSynced.add(id));
        setSyncedIds(newSynced);
        setSelectedIds(new Set());
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      toast.error("เกิดข้อผิดพลาด: " + err.message);
    } finally {
      setIsSyncing(false);
    }
  };


  return (
    <div className="space-y-6 mt-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500 font-medium">ตรวจสอบทั้งหมด</p>
          <p className="text-2xl font-bold mt-1 text-gray-900">{totalChecked} รายการ</p>
        </div>
        <div className="bg-red-50 p-4 rounded-xl border border-red-100 shadow-sm">
          <p className="text-sm text-red-600 font-medium">ไม่มีในระบบ</p>
          <p className="text-2xl font-bold mt-1 text-red-700">{missingProducts.length} รายการ</p>
        </div>
        <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 shadow-sm">
          <p className="text-sm text-amber-600 font-medium">ข้อมูลไม่ตรงกัน</p>
          <p className="text-2xl font-bold mt-1 text-amber-700">{unsyncedMismatched.length} รายการ</p>
        </div>
        <div className="bg-green-50 p-4 rounded-xl border border-green-100 shadow-sm">
          <p className="text-sm text-green-600 font-medium">ข้อมูลตรงกัน</p>
          <p className="text-2xl font-bold mt-1 text-green-700">{matchedProducts.length} รายการ</p>
        </div>
      </div>

      <Tabs defaultValue="mismatch" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="mismatch" className="data-[state=active]:bg-amber-100 data-[state=active]:text-amber-800">
            <AlertCircle className="w-4 h-4 mr-2" />
            ไม่ตรงกัน ({unsyncedMismatched.length})
          </TabsTrigger>
          <TabsTrigger value="missing" className="data-[state=active]:bg-red-100 data-[state=active]:text-red-800">
            <XCircle className="w-4 h-4 mr-2" />
            ไม่มีในระบบ ({missingProducts.length})
          </TabsTrigger>
          <TabsTrigger value="matched" className="data-[state=active]:bg-green-100 data-[state=active]:text-green-800">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            ตรงกัน ({matchedProducts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mismatch" className="mt-6">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {unsyncedMismatched.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                {mismatchedProducts.length > 0 ? "อัปเดตข้อมูลที่เลือกเรียบร้อยแล้ว" : "ไม่มีรายการที่ไม่ตรงกัน"}
              </div>
            ) : (
              <div className="flex flex-col">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-700 border-b">
                      <tr>
                        <th className="px-4 py-3 font-medium whitespace-nowrap w-12 text-center">
                          <Checkbox 
                            checked={selectedIds.size === unsyncedMismatched.length && unsyncedMismatched.length > 0} 
                            onCheckedChange={handleSelectAll} 
                            aria-label="Select all"
                          />
                        </th>
                        <th className="px-4 py-3 font-medium whitespace-nowrap">แถวที่ (Excel)</th>
                        <th className="px-4 py-3 font-medium whitespace-nowrap">รหัสสินค้า</th>
                        <th className="px-4 py-3 font-medium whitespace-nowrap">ชื่อการค้า</th>
                        <th className="px-4 py-3 font-medium">ฟิลด์ที่ไม่ตรงกัน</th>
                        <th className="px-4 py-3 font-medium text-amber-700 bg-amber-50">ข้อมูลใน Excel (ที่จะใช้อัปเดต)</th>
                        <th className="px-4 py-3 font-medium text-blue-700 bg-blue-50">ข้อมูลในระบบ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {unsyncedMismatched.map((p, idx) => (
                        <tr key={idx} className={`hover:bg-gray-50 ${selectedIds.has(p.productId) ? 'bg-amber-50/30' : ''}`}>
                          <td className="px-4 py-3 text-center">
                            <Checkbox 
                              checked={selectedIds.has(p.productId)} 
                              onCheckedChange={(checked) => handleSelect(p.productId, checked as boolean)} 
                              aria-label={`Select row ${p.rowNum}`}
                            />
                          </td>
                          <td className="px-4 py-3 text-gray-500">{p.rowNum}</td>
                          <td className="px-4 py-3 font-medium">{p.productCode}</td>
                          <td className="px-4 py-3">{p.tradeName}</td>
                          <td className="px-4 py-3" colSpan={3} style={{ padding: 0 }}>
                            <table className="w-full">
                              <tbody>
                                {p.discrepancies.map((d, dIdx) => (
                                  <tr key={dIdx} className={dIdx !== p.discrepancies.length - 1 ? "border-b border-gray-100" : ""}>
                                    <td className="px-4 py-2 w-1/3 text-gray-600">{d.field}</td>
                                    <td className="px-4 py-2 w-1/3 bg-amber-50/50 text-amber-900 break-all font-medium">{String(d.excelValue || "-")}</td>
                                    <td className="px-4 py-2 w-1/3 bg-blue-50/50 text-blue-900 break-all line-through opacity-70">{String(d.dbValue || "-")}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 bg-gray-50 border-t flex justify-between items-center">
                   <span className="text-sm text-gray-600">
                     เลือก {selectedIds.size} จาก {unsyncedMismatched.length} รายการ
                   </span>
                   <Button onClick={handleSync} disabled={selectedIds.size === 0 || isSyncing}>
                     {isSyncing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                     อัปเดตข้อมูลที่เลือก
                   </Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="missing" className="mt-6">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
             {missingProducts.length === 0 ? (
              <div className="p-8 text-center text-gray-500">ไม่มีรายการที่สูญหาย</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-700 border-b">
                    <tr>
                      <th className="px-4 py-3 font-medium">แถวที่ (Excel)</th>
                      <th className="px-4 py-3 font-medium">รหัสสินค้า</th>
                      <th className="px-4 py-3 font-medium">ชื่อการค้า</th>
                      <th className="px-4 py-3 font-medium">หมายเหตุ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {missingProducts.map((p, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-500">{p.rowNum}</td>
                        <td className="px-4 py-3 font-medium text-red-600">{p.productCode || "-"}</td>
                        <td className="px-4 py-3">{p.tradeName || "-"}</td>
                        <td className="px-4 py-3 text-gray-500">{p.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="matched" className="mt-6">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
             {matchedProducts.length === 0 ? (
              <div className="p-8 text-center text-gray-500">ไม่มีรายการที่ตรงกัน</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-700 border-b">
                    <tr>
                      <th className="px-4 py-3 font-medium">แถวที่ (Excel)</th>
                      <th className="px-4 py-3 font-medium">รหัสสินค้า</th>
                      <th className="px-4 py-3 font-medium">ชื่อการค้า</th>
                      <th className="px-4 py-3 font-medium">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {matchedProducts.map((p, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-500">{p.rowNum}</td>
                        <td className="px-4 py-3 font-medium">{p.productCode}</td>
                        <td className="px-4 py-3">{p.tradeName}</td>
                        <td className="px-4 py-3 text-green-600 flex items-center">
                          <CheckCircle2 className="w-4 h-4 mr-1" /> ข้อมูลตรงกันทั้งหมด
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
