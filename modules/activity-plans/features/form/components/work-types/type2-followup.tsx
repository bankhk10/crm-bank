import React from "react";
import { CheckSquare, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormCombobox } from "@/components/custom/form-components";
import type { Type2ProductFollowupItem } from "../../types";
import { DEMO_PRODUCTS, DEMO_OWNERS } from "../../constants";

export interface CustomerOption {
  id: string;
  name: string;
  customerCode?: string | null;
  responsibleEmployeeId?: string | null;
}

export interface ProductOption {
  id: string;
  name: string;
  productCode?: string | null;
}

interface Props {
  readonly?: boolean;
  type2Items: Type2ProductFollowupItem[];
  addType2Row: () => void;
  updateType2Row: (
    id: string,
    field: keyof Type2ProductFollowupItem,
    val: any,
  ) => void;
  deleteType2Row: (id: string) => void;
  customers?: CustomerOption[];
  products?: ProductOption[];
}

export function Type2Followup({
  readonly = false,
  type2Items,
  addType2Row,
  updateType2Row,
  deleteType2Row,
  customers = [],
  products = [],
}: Props) {
  const customerOptions = (
    customers && customers.length > 0
      ? customers
      : DEMO_OWNERS.map((owner) => ({
          id: owner,
          name: owner,
          customerCode: null,
        }))
  ).map((c) => ({
    value: c.name,
    label: c.name,
  }));

  const productOptions = (
    products && products.length > 0
      ? products
      : DEMO_PRODUCTS.map((prod) => ({
          id: prod,
          name: prod,
          productCode: null,
        }))
  ).map((p) => ({
    value: p.name,
    label: p.name,
    subLabel: p.productCode || undefined,
  }));

  return (
    <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 md:p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
          <CheckSquare className="h-4 w-4 text-slate-600" />
          <span>ติดตามผลการใช้สินค้า</span>
        </div>

        {!readonly && (
          <Button
            type="button"
            size="sm"
            onClick={addType2Row}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg h-7 px-2.5 shadow-sm"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            เพิ่มรายการ
          </Button>
        )}
      </div>

      {/* List of Follow-up Cards */}
      <div className="space-y-3">
        {type2Items.length === 0 ? (
          <div className="py-6 text-center text-slate-400 bg-white rounded-xl border border-slate-200 text-xs">
            ยังไม่มีรายการติดตามผล
          </div>
        ) : (
          type2Items.map((item, index) => (
            <div
              key={item.id}
              className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3 transition-all hover:border-indigo-300"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-indigo-800 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[11px] font-extrabold">
                    {index + 1}
                  </span>
                  รายการติดตามผลที่ {index + 1}
                </span>
                {!readonly && (
                  <button
                    type="button"
                    onClick={() => deleteType2Row(item.id)}
                    className="p-1 rounded-md text-red-500 hover:bg-red-50 text-xs font-medium flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>ลบรายการ</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormCombobox
                  id={`product-combobox-${item.id}`}
                  label="สินค้าที่ต้องการติดตามผล"
                  labelClassName="block text-xs font-medium text-slate-700 mb-1 mx-0"
                  triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500"
                  value={item.productName}
                  onChange={(val) =>
                    updateType2Row(item.id, "productName", val)
                  }
                  options={productOptions}
                  placeholder="เลือกสินค้า..."
                  searchPlaceholder="ค้นหาสินค้า..."
                  emptyText="ไม่พบสินค้า"
                  disabled={readonly}
                  required
                />

                <FormCombobox
                  id={`customer-combobox-${item.id}`}
                  label="ชื่อร้านค้า / Key Farmer"
                  labelClassName="block text-xs font-medium text-slate-700 mb-1 mx-0"
                  triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500"
                  value={item.customerName}
                  onChange={(val) =>
                    updateType2Row(item.id, "customerName", val)
                  }
                  options={customerOptions}
                  placeholder="เลือกร้านค้า / Key Farmer..."
                  searchPlaceholder="ค้นหาร้านค้า / Key Farmer..."
                  emptyText="ไม่พบลูกค้า"
                  disabled={readonly}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  รายละเอียดเพิ่มเติม
                </label>
                <input
                  type="text"
                  value={item.detail}
                  onChange={(e) =>
                    updateType2Row(item.id, "detail", e.target.value)
                  }
                  disabled={readonly}
                  placeholder="ระบุรายละเอียดการติดตาม..."
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
