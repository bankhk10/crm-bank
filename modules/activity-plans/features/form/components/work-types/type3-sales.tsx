import React from "react";
import { ShoppingCart, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Type3SalesItem } from "../../types";
import { DEMO_PRODUCTS, DEMO_OWNERS } from "../../constants";

interface Props {
  readonly?: boolean;
  type3Items: Type3SalesItem[];
  addType3Row: () => void;
  updateType3Row: (id: string, field: keyof Type3SalesItem, val: any) => void;
  deleteType3Row: (id: string) => void;
}

export function Type3Sales({
  readonly = false,
  type3Items,
  addType3Row,
  updateType3Row,
  deleteType3Row,
}: Props) {
  return (
    <div className="bg-emerald-50/40 border border-emerald-200/80 rounded-xl p-4 md:p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2.5">
        <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
          <ShoppingCart className="h-4 w-4 text-emerald-600" />
          <span>เสนอขายสินค้า</span>
        </div>

        {!readonly && (
          <Button
            type="button"
            size="sm"
            onClick={addType3Row}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg h-7 px-2.5 shadow-sm"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            เพิ่มรายการ
          </Button>
        )}
      </div>

      {/* Dynamic Sales Proposal Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
            <tr>
              <th className="py-2.5 px-3 text-center w-12">ลำดับ</th>
              <th className="py-2.5 px-3 min-w-[160px]">
                สินค้าที่จะเสนอขาย <span className="text-red-500">*</span>
              </th>
              <th className="py-2.5 px-3 min-w-[160px]">
                รายชื่อลูกค้า / ร้านค้า / เจ้าของแปลง{" "}
                <span className="text-red-500">*</span>
              </th>
              <th className="py-2.5 px-3 w-20 text-center">
                จำนวน <span className="text-red-500">*</span>
              </th>
              <th className="py-2.5 px-3 w-28 text-center">
                ราคา/หน่วย (บาท) <span className="text-red-500">*</span>
              </th>
              <th className="py-2.5 px-3 w-32 text-right">ราคา (บาท)</th>
              <th className="py-2.5 px-3 min-w-[160px]">รายละเอียดเพิ่มเติม</th>
              {!readonly && (
                <th className="py-2.5 px-3 text-center w-16">จัดการ</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {type3Items.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="py-4 text-center text-slate-400 italic"
                >
                  ยังไม่มีรายการเสนอขาย กด "เพิ่มรายการ" เพื่อบันทึก
                </td>
              </tr>
            ) : (
              type3Items.map((item, index) => {
                const calculatedTotalPrice =
                  (item.quantity || 0) * (item.unitPrice || 0);
                return (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="py-2.5 px-3 text-center font-medium text-slate-500">
                      {index + 1}
                    </td>
                    <td className="py-2 px-3">
                      <select
                        value={item.productName}
                        onChange={(e) =>
                          updateType3Row(item.id, "productName", e.target.value)
                        }
                        disabled={readonly}
                        className="w-full h-8 px-2 rounded-md border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                      >
                        {DEMO_PRODUCTS.map((prod) => (
                          <option key={prod} value={prod}>
                            {prod}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 px-3">
                      <select
                        value={item.customerName}
                        onChange={(e) =>
                          updateType3Row(
                            item.id,
                            "customerName",
                            e.target.value,
                          )
                        }
                        disabled={readonly}
                        className="w-full h-8 px-2 rounded-md border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                      >
                        <option value="">
                          -- เลือกร้านค้า / เจ้าของแปลง --
                        </option>
                        {DEMO_OWNERS.map((owner) => (
                          <option key={owner} value={owner}>
                            {owner}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) =>
                          updateType3Row(
                            item.id,
                            "quantity",
                            parseInt(e.target.value) || 0,
                          )
                        }
                        disabled={readonly}
                        className="w-full h-8 px-2 rounded-md border border-slate-200 text-xs text-slate-800 text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <div className="relative">
                        <span className="absolute left-2.5 top-2 text-slate-400 text-[11px]">
                          ฿
                        </span>
                        <input
                          type="number"
                          min={0}
                          value={item.unitPrice}
                          onChange={(e) =>
                            updateType3Row(
                              item.id,
                              "unitPrice",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          disabled={readonly}
                          placeholder="0"
                          className="w-full h-8 pl-6 pr-2 rounded-md border border-slate-200 text-xs text-slate-800 text-right font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-emerald-700">
                      ฿ {calculatedTotalPrice.toLocaleString()}
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={item.detail}
                        onChange={(e) =>
                          updateType3Row(item.id, "detail", e.target.value)
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
                          onClick={() => deleteType3Row(item.id)}
                          className="p-1.5 rounded-md text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
          {type3Items.length > 0 && (
            <tfoot className="bg-emerald-50/80 border-t-2 border-emerald-200 text-xs font-bold text-emerald-900">
              <tr>
                <td colSpan={5} className="py-2.5 px-3 text-left">
                  รวมราคาเสนอขายทั้งสิ้น:
                </td>
                <td className="py-2.5 px-3 text-right text-emerald-700 font-extrabold">
                  ฿{" "}
                  {type3Items
                    .reduce(
                      (sum, item) =>
                        sum + (item.quantity || 0) * (item.unitPrice || 0),
                      0,
                    )
                    .toLocaleString()}
                </td>
                <td colSpan={readonly ? 2 : 1}></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
