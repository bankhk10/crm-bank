"use client";

import React from "react";
import { ClipboardList, X } from "lucide-react";
import { ActivityCustomerSelect } from "@/modules/activity/ui";
import type {
  Type11StoreItem,
  CustomerOption,
  Type11StockProps,
} from "../types";

export type {
  CustomerOption,
  Type11StockProps,
  Type11StockProps as Type11PlanFormProps,
};

export function Type11PlanForm({
  readonly = false,
  type11Stores,
  setType11Stores,
  customers = [],
}: Type11StockProps) {
  // Normalize incoming stores: array of Type11StoreItem is primary
  const selectedStores: Type11StoreItem[] = React.useMemo(() => {
    if (Array.isArray(type11Stores)) {
      return type11Stores;
    }
    return [];
  }, [type11Stores]);

  const selectedStoreIds = React.useMemo(
    () => new Set(selectedStores.map((s) => s.storeId)),
    [selectedStores],
  );

  const availableCustomers = React.useMemo(() => {
    return (customers || []).filter((c) => !selectedStoreIds.has(c.id));
  }, [customers, selectedStoreIds]);

  return (
    <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-4 md:p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
          <ClipboardList className="h-4 w-4 text-slate-600" />
          <span>ตรวจเช็คสต๊อกหน้าร้าน</span>
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
                key={store.storeId}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 text-xs font-medium border border-slate-200"
              >
                {store.storeName}
                {!readonly && (
                  <button
                    type="button"
                    onClick={() => {
                      const updated = selectedStores.filter(
                        (s) => s.storeId !== store.storeId,
                      );
                      setType11Stores(updated);
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
          <ActivityCustomerSelect
            id="type11-stores-combobox"
            type="STORE"
            triggerClassName="h-10 min-h-[40px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-slate-500"
            value=""
            valueKey="id"
            onChange={(selectedId, foundCustomer) => {
              if (!selectedId) return;
              const customerName =
                foundCustomer?.name ||
                customers.find((c) => c.id === selectedId)?.name;
              if (customerName && !selectedStoreIds.has(selectedId)) {
                const updated: Type11StoreItem[] = [
                  ...selectedStores,
                  {
                    storeId: selectedId,
                    storeName: customerName,
                  },
                ];
                setType11Stores(updated);
              }
            }}
            customers={availableCustomers as any}
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

export { Type11PlanForm as Type11Stock, Type11PlanForm as EditType11Stock };
