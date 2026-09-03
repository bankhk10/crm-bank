import React from "react";
import { ClipboardList, X } from "lucide-react";
import { FormCombobox } from "@/components/custom/form-components";
import { STORES_LIST } from "../../../../constants";

export interface CustomerOption {
  id: string;
  name: string;
  customerCode?: string | null;
  responsibleEmployeeId?: string | null;
}

interface Props {
  readonly?: boolean;
  type11Stores: string;
  setType11Stores: (val: string) => void;
  customers?: CustomerOption[];
}

export function Type11Stock({
  readonly = false,
  type11Stores,
  setType11Stores,
  customers = [],
}: Props) {
  const selectedStores = type11Stores
    ? type11Stores.split(", ").filter(Boolean)
    : [];

  const customerOptions = (
    customers && customers.length > 0
      ? customers
      : STORES_LIST.map((store) => ({
          id: store,
          name: store,
          customerCode: null,
        }))
  ).map((c) => ({
    value: c.name,
    label: `${c.customerCode ? `${c.customerCode} - ` : ""}${c.name}`,
  }));

  const availableCustomerOptions = customerOptions.filter(
    (c) => !selectedStores.includes(c.value),
  );

  return (
    <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-4 md:p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
          <ClipboardList className="h-4 w-4 text-slate-600" />
          <span>ตรวจเช็กสต็อกหน้าร้าน</span>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-medium text-slate-700">
          รายชื่อร้านค้า <span className="text-red-500">*</span>
        </label>

        {/* Selected Store Badges */}
        {selectedStores.length > 0 && (
          <div className="flex flex-wrap gap-1.5 p-2.5 rounded-lg border border-slate-200 bg-white">
            {selectedStores.map((store) => (
              <span
                key={store}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 text-xs font-medium border border-slate-200"
              >
                {store}
                {!readonly && (
                  <button
                    type="button"
                    onClick={() => {
                      const updated = selectedStores.filter((s) => s !== store);
                      setType11Stores(updated.join(", "));
                    }}
                    className="text-slate-400 hover:text-red-500 font-bold transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </span>
            ))}
          </div>
        )}

        {/* Store Selection Dropdown */}
        {!readonly && (
          <FormCombobox
            id="type11-stores-combobox"
            label=""
            labelClassName="hidden"
            triggerClassName="h-10 min-h-[40px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-slate-500"
            value=""
            onChange={(val) => {
              if (!val) return;
              if (!selectedStores.includes(val)) {
                const updated = [...selectedStores, val];
                setType11Stores(updated.join(", "));
              }
            }}
            options={availableCustomerOptions}
            placeholder={
              selectedStores.length > 0
                ? "+ เพิ่มร้านค้าที่จะตรวจเช็กสต็อก..."
                : "เลือกร้านค้าที่ต้องการตรวจเช็กสต็อก..."
            }
            searchPlaceholder="ค้นหาร้านค้า..."
            emptyText="ไม่พบร้านค้า"
            disabled={readonly}
          />
        )}
      </div>
    </div>
  );
}
