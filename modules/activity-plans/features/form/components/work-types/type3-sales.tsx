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
  const totalAllSales = type3Items.reduce(
    (sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0),
    0,
  );

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

      {/* List of Sales Proposal Cards */}
      <div className="space-y-3">
        {type3Items.length === 0 ? (
          <div className="py-6 text-center text-slate-400 italic bg-white rounded-xl border border-slate-200 text-xs">
            ยังไม่มีรายการเสนอขาย กด "+ เพิ่มรายการ" เพื่อบันทึก
          </div>
        ) : (
          type3Items.map((item, index) => {
            const calculatedTotalPrice =
              (item.quantity || 0) * (item.unitPrice || 0);
            return (
              <div
                key={item.id}
                className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3 transition-all hover:border-emerald-300"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[11px] font-extrabold">
                      {index + 1}
                    </span>
                    รายการเสนอขายที่ {index + 1}
                  </span>
                  {!readonly && (
                    <button
                      type="button"
                      onClick={() => deleteType3Row(item.id)}
                      className="p-1 rounded-md text-red-500 hover:bg-red-50 text-xs font-medium flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>ลบรายการ</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      สินค้าที่จะเสนอขาย <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={item.productName}
                      onChange={(e) =>
                        updateType3Row(item.id, "productName", e.target.value)
                      }
                      disabled={readonly}
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium bg-white"
                    >
                      {DEMO_PRODUCTS.map((prod) => (
                        <option key={prod} value={prod}>
                          {prod}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      ชื่อร้านค้า / เกษตรกร <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={item.customerName}
                      onChange={(e) =>
                        updateType3Row(item.id, "customerName", e.target.value)
                      }
                      disabled={readonly}
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium bg-white"
                    >
                      <option value="">-- เลือกร้านค้า / เจ้าของแปลง --</option>
                      {DEMO_OWNERS.map((owner) => (
                        <option key={owner} value={owner}>
                          {owner}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      จำนวน <span className="text-red-500">*</span>
                    </label>
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
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs text-slate-800 text-center focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      ราคา/หน่วย (บาท) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-slate-400 text-xs font-semibold">
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
                        disabled={true}
                        placeholder="0"
                        className="w-full h-9 pl-7 pr-3 rounded-lg border border-slate-200 bg-slate-100 text-slate-500 text-xs text-right font-medium focus:outline-none cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="text-xs text-slate-600 font-medium">
                    รวมเป็นเงิน:{" "}
                    <span className="text-sm font-bold text-emerald-700 ml-1">
                      ฿ {calculatedTotalPrice.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    รายละเอียดเพิ่มเติม
                  </label>
                  <input
                    type="text"
                    value={item.detail}
                    onChange={(e) =>
                      updateType3Row(item.id, "detail", e.target.value)
                    }
                    disabled={readonly}
                    placeholder="ระบุรายละเอียดเพิ่มเติม..."
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      {type3Items.length > 0 && (
        <div className="flex justify-end p-3 rounded-xl bg-emerald-100/70 border border-emerald-200 text-xs font-bold text-emerald-900">
          <span>
            รวมราคาเสนอขายทั้งสิ้น:{" "}
            <span className="text-sm font-extrabold text-emerald-700 ml-1.5">
              ฿ {totalAllSales.toLocaleString()}
            </span>
          </span>
        </div>
      )}
    </div>
  );
}
