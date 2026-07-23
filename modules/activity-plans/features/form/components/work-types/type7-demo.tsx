import React from "react";
import { Sprout, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Type7DemoPlotItem } from "../../types";
import { DEMO_PRODUCTS, DEMO_OWNERS } from "../../constants";

interface Props {
  readonly?: boolean;
  type7Items: Type7DemoPlotItem[];
  addType7Row: () => void;
  updateType7Row: (id: string, field: keyof Type7DemoPlotItem, val: any) => void;
  deleteType7Row: (id: string) => void;
}

export function Type7Demo({
  readonly = false,
  type7Items,
  addType7Row,
  updateType7Row,
  deleteType7Row,
}: Props) {
  return (
    <div className="bg-emerald-50/40 border border-emerald-200/80 rounded-xl p-4 md:p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2.5">
        <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
          <Sprout className="h-4 w-4 text-emerald-600" />
          <span>ติดตามแปลงสาธิต / พืชเป้าหมาย</span>
        </div>

        {!readonly && (
          <Button
            type="button"
            size="sm"
            onClick={addType7Row}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg h-7 px-2.5 shadow-sm"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            เพิ่มรายการ
          </Button>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
            <tr>
              <th className="py-2.5 px-3 text-center w-12">ลำดับ</th>
              <th className="py-2.5 px-3 min-w-[160px]">
                เจ้าของแปลง <span className="text-red-500">*</span>
              </th>
              <th className="py-2.5 px-3 min-w-[160px]">
                สินค้าที่จะสาธิต <span className="text-red-500">*</span>
              </th>
              <th className="py-2.5 px-3 min-w-[120px]">หมวดพืช</th>
              <th className="py-2.5 px-3 min-w-[120px]">ชื่อพืช</th>
              <th className="py-2.5 px-3 w-28 text-center">
                แปลง/ต้น <span className="text-red-500">*</span>
              </th>
              <th className="py-2.5 px-3 min-w-[160px]">รายละเอียดเพิ่มเติม</th>
              {!readonly && (
                <th className="py-2.5 px-3 text-center w-16">จัดการ</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {type7Items.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="py-4 text-center text-slate-400 italic"
                >
                  ยังไม่มีรายการแปลงสาธิต กด "เพิ่มรายการ" เพื่อบันทึก
                </td>
              </tr>
            ) : (
              type7Items.map((item, index) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="py-2.5 px-3 text-center font-medium text-slate-500">
                    {index + 1}
                  </td>
                  <td className="py-2 px-3">
                    <select
                      value={item.ownerName}
                      onChange={(e) =>
                        updateType7Row(item.id, "ownerName", e.target.value)
                      }
                      disabled={readonly}
                      className="w-full h-8 px-2 rounded-md border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                    >
                      <option value="">-- เลือกเจ้าของแปลง --</option>
                      {DEMO_OWNERS.map((owner) => (
                        <option key={owner} value={owner}>
                          {owner}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2 px-3">
                    <select
                      value={item.productName}
                      onChange={(e) =>
                        updateType7Row(item.id, "productName", e.target.value)
                      }
                      disabled={readonly}
                      className="w-full h-8 px-2 rounded-md border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                    >
                      <option value="">-- เลือกสินค้า --</option>
                      {DEMO_PRODUCTS.map((prod) => (
                        <option key={prod} value={prod}>
                          {prod}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2 px-3">
                    <select
                      value={item.cropCategory}
                      onChange={(e) =>
                        updateType7Row(item.id, "cropCategory", e.target.value)
                      }
                      disabled={readonly}
                      className="w-full h-8 px-2 rounded-md border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">-- เลือกหมวด --</option>
                      <option value="นาข้าว">นาข้าว</option>
                      <option value="พืชไร่">พืชไร่</option>
                      <option value="ไม้ผล">ไม้ผล</option>
                      <option value="พืชผัก">พืชผัก</option>
                    </select>
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={item.cropName}
                      onChange={(e) =>
                        updateType7Row(item.id, "cropName", e.target.value)
                      }
                      disabled={readonly}
                      placeholder="เช่น ข้าวนาปี"
                      className="w-full h-8 px-2.5 rounded-md border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      min={1}
                      value={item.plotsCount}
                      onChange={(e) =>
                        updateType7Row(
                          item.id,
                          "plotsCount",
                          parseInt(e.target.value) || 0,
                        )
                      }
                      disabled={readonly}
                      className="w-full h-8 px-2 rounded-md border border-slate-200 text-xs text-slate-800 text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={item.detail}
                      onChange={(e) =>
                        updateType7Row(item.id, "detail", e.target.value)
                      }
                      disabled={readonly}
                      placeholder="ระบุรายละเอียด..."
                      className="w-full h-8 px-2.5 rounded-md border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </td>
                  {!readonly && (
                    <td className="py-2 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => deleteType7Row(item.id)}
                        className="p-1.5 rounded-md text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
