import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RequisitionItem } from "../types";
import { REQUISITION_UNITS } from "../constants";

interface Props {
  requisitionItems: RequisitionItem[];
  addRequisitionRow: () => void;
  updateRequisitionRow: (id: string, field: keyof RequisitionItem, val: any) => void;
  deleteRequisitionRow: (id: string) => void;
  readonly?: boolean;
  selectedWorkTypes: string[];
}

export function RequisitionSection({
  requisitionItems,
  addRequisitionRow,
  updateRequisitionRow,
  deleteRequisitionRow,
  readonly = false,
  selectedWorkTypes,
}: Props) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden p-5 md:p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
            {selectedWorkTypes.some((t) =>
              [
                "จัดประชุมการเกษตร / ดีลเลอร์ / ซับดีลเลอร์",
                "จัดกิจกรรมส่งเสริมการขายหน้าร้าน",
                "จัดงาน Field Day",
              ].includes(t),
            )
              ? 6
              : 5}
          </span>
          <h2 className="font-bold text-slate-800 text-base md:text-lg">
            รายการขอเบิกสินค้าจัดกิจกรรม (Material Requisition)
          </h2>
        </div>

        {!readonly && (
          <Button
            type="button"
            size="sm"
            onClick={addRequisitionRow}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg h-8 px-3 shadow-sm"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            เพิ่มรายการเบิก
          </Button>
        )}
      </div>

      {/* Requisition Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
            <tr>
              <th className="py-2.5 px-3 text-center w-12">ลำดับ</th>
              <th className="py-2.5 px-3 min-w-[200px]">
                รายการสินค้า <span className="text-red-500">*</span>
              </th>
              <th className="py-2.5 px-3 w-24">
                จำนวน <span className="text-red-500">*</span>
              </th>
              <th className="py-2.5 px-3 w-28">หน่วยนับ</th>
              <th className="py-2.5 px-3 min-w-[200px]">รายละเอียด</th>
              {!readonly && (
                <th className="py-2.5 px-3 text-center w-16">จัดการ</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {requisitionItems.map((item, index) => (
              <tr
                key={item.id}
                className="hover:bg-slate-50/50 transition-colors"
              >
                <td className="py-2.5 px-3 text-center font-medium text-slate-500">
                  {index + 1}
                </td>
                <td className="py-2 px-3">
                  <input
                    type="text"
                    value={item.productName}
                    onChange={(e) =>
                      updateRequisitionRow(
                        item.id,
                        "productName",
                        e.target.value,
                      )
                    }
                    disabled={readonly}
                    placeholder="ชื่อสินค้า..."
                    className="w-full h-8 px-2.5 rounded-md border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </td>
                <td className="py-2 px-3">
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) =>
                      updateRequisitionRow(
                        item.id,
                        "quantity",
                        parseInt(e.target.value) || 0,
                      )
                    }
                    disabled={readonly}
                    className="w-full h-8 px-2 rounded-md border border-slate-200 text-xs text-slate-800 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </td>
                <td className="py-2 px-3">
                  <select
                    value={item.unit}
                    onChange={(e) =>
                      updateRequisitionRow(item.id, "unit", e.target.value)
                    }
                    disabled={readonly}
                    className="w-full h-8 px-2 rounded-md border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {REQUISITION_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-2 px-3">
                  <input
                    type="text"
                    value={item.detail}
                    onChange={(e) =>
                      updateRequisitionRow(item.id, "detail", e.target.value)
                    }
                    disabled={readonly}
                    placeholder="วัตถุประสงค์การใช้..."
                    className="w-full h-8 px-2.5 rounded-md border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </td>
                {!readonly && (
                  <td className="py-2 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => deleteRequisitionRow(item.id)}
                      className="p-1.5 rounded-md text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
