import React from "react";
import { Store, Package, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Type9ProductItem } from "../../types";
import { STORES_LIST, DEMO_PRODUCTS } from "../../constants";

interface Props {
  readonly?: boolean;
  type9Store: string;
  setType9Store: (val: string) => void;
  type9Sales: number;
  setType9Sales: (val: number) => void;
  type9ProductItems: Type9ProductItem[];
  addType9ProductItem: () => void;
  updateType9ProductItem: (
    id: string,
    field: keyof Type9ProductItem,
    val: any,
  ) => void;
  deleteType9ProductItem: (id: string) => void;
}

export function Type9Store({
  readonly = false,
  type9Store,
  setType9Store,
  type9Sales,
  setType9Sales,
  type9ProductItems,
  addType9ProductItem,
  updateType9ProductItem,
  deleteType9ProductItem,
}: Props) {
  const calculatedSales = type9ProductItems.reduce(
    (sum, item) => sum + (item.quantityCases || 0) * (item.pricePerCase || 0),
    0,
  );

  return (
    <div className="bg-teal-50/40 border border-teal-200/80 rounded-xl p-4 md:p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-teal-200/60 pb-2.5">
        <div className="flex items-center gap-2 text-teal-800 font-bold text-sm">
          <Store className="h-4 w-4 text-teal-600" />
          <span>จัดกิจกรรมส่งเสริมการขายหน้าร้าน</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">
            ร้านค้าที่จะไปจัดงาน <span className="text-red-500">*</span>
          </label>
          <select
            value={type9Store}
            onChange={(e) => setType9Store(e.target.value)}
            disabled={readonly}
            className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {STORES_LIST.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">
            เป้ายอดขายรวมจากกิจกรรม (บาท) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-semibold">
              ฿
            </span>
            <input
              type="number"
              value={type9ProductItems.length > 0 ? calculatedSales : type9Sales}
              onChange={(e) => setType9Sales(parseFloat(e.target.value) || 0)}
              disabled={readonly || type9ProductItems.length > 0}
              className="w-full h-10 pl-7 pr-3 rounded-lg border border-slate-200 bg-white text-xs font-bold text-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>
      </div>

      {/* Table / List of Products */}
      <div className="space-y-3 pt-2 border-t border-teal-200/60">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Package className="h-4 w-4 text-teal-600" />
            รายการสินค้าที่เสนอขาย / โปรโมชันหน้าร้าน
          </span>

          {!readonly && (
            <Button
              type="button"
              size="sm"
              onClick={addType9ProductItem}
              className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium rounded-lg h-7 px-2.5 shadow-sm"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              เพิ่มสินค้า
            </Button>
          )}
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="py-2 px-3 text-center w-10">ลำดับ</th>
                <th className="py-2 px-3 min-w-[180px]">
                  เลือกสินค้า <span className="text-red-500">*</span>
                </th>
                <th className="py-2 px-3 w-28 text-center">
                  จำนวน (ลัง) <span className="text-red-500">*</span>
                </th>
                <th className="py-2 px-3 w-32 text-center">
                  ราคา (บาท/ลัง) <span className="text-red-500">*</span>
                </th>
                <th className="py-2 px-3 w-36 text-right">
                  รวมเป็นเงินทั้งหมด
                </th>
                {!readonly && (
                  <th className="py-2 px-3 text-center w-14">จัดการ</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {type9ProductItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-4 text-center text-slate-400 italic"
                  >
                    ยังไม่มีรายการสินค้า กด "+ เพิ่มสินค้า" เพื่อบันทึก
                  </td>
                </tr>
              ) : (
                type9ProductItems.map((item, index) => {
                  const totalItemPrice =
                    (item.quantityCases || 0) * (item.pricePerCase || 0);
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="py-2 px-3 text-center font-medium text-slate-500">
                        {index + 1}
                      </td>
                      <td className="py-1.5 px-3">
                        <select
                          value={item.productName}
                          onChange={(e) =>
                            updateType9ProductItem(
                              item.id,
                              "productName",
                              e.target.value,
                            )
                          }
                          disabled={readonly}
                          className="w-full h-8 px-2 rounded-md border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        >
                          {DEMO_PRODUCTS.map((prod) => (
                            <option key={prod} value={prod}>
                              {prod}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-1.5 px-3">
                        <input
                          type="number"
                          min={1}
                          value={item.quantityCases}
                          onChange={(e) =>
                            updateType9ProductItem(
                              item.id,
                              "quantityCases",
                              parseInt(e.target.value) || 0,
                            )
                          }
                          disabled={readonly}
                          className="w-full h-8 px-2 rounded-md border border-slate-200 text-xs text-slate-800 text-center focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </td>
                      <td className="py-1.5 px-3">
                        <div className="relative">
                          <span className="absolute left-2 top-2 text-slate-400 text-[11px]">
                            ฿
                          </span>
                          <input
                            type="number"
                            min={0}
                            value={item.pricePerCase}
                            onChange={(e) =>
                              updateType9ProductItem(
                                item.id,
                                "pricePerCase",
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            disabled={readonly}
                            className="w-full h-8 pl-5 pr-2 rounded-md border border-slate-200 text-xs text-slate-800 text-right focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                        </div>
                      </td>
                      <td className="py-1.5 px-3 text-right font-semibold text-teal-700">
                        ฿ {totalItemPrice.toLocaleString()}
                      </td>
                      {!readonly && (
                        <td className="py-1.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => deleteType9ProductItem(item.id)}
                            className="p-1 rounded-md text-red-500 hover:bg-red-50 transition-colors"
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
          </table>
        </div>
      </div>
    </div>
  );
}
