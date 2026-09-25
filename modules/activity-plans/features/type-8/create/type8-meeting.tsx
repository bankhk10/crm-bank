import React from "react";
import { Users, Plus, Trash2, X, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormCombobox } from "@/components/custom/form-components";
import type {
  Type8MeetingItem,
  Type8PromotionProductItem,
  Type8MeetingTarget,
  Type8FarmerChannel,
} from "@/modules/activity-plans/features/shared/form/types";

export interface CustomerOption {
  id: string;
  name: string;
  customerCode?: string | null;
  customerType?: string | null;
  phone?: string | null;
  province?: string | null;
  district?: string | null;
  subdistrict?: string | null;
  addressLine?: string | null;
  postalCode?: string | null;
  [key: string]: any;
}

export interface ProductOption {
  id: string;
  name: string;
  productCode?: string | null;
  price?: number | null;
  unit?: string | null;
}

interface Props {
  readonly?: boolean;
  type8Items: Type8MeetingItem[];
  addType8Row?: () => void;
  updateType8Row: (id: string, field: keyof Type8MeetingItem, val: any) => void;
  deleteType8Row?: (id: string) => void;
  addPromotionProduct?: (meetingId: string) => void;
  updatePromotionProduct?: (
    meetingId: string,
    promoId: string,
    field: keyof Type8PromotionProductItem,
    val: any,
  ) => void;
  deletePromotionProduct?: (meetingId: string, promoId: string) => void;
  customers?: CustomerOption[];
  products?: ProductOption[];
  onDealerSelect?: (dealer: CustomerOption | null) => void;
}

export function Type8Meeting({
  readonly = false,
  type8Items,
  addType8Row,
  updateType8Row,
  deleteType8Row,
  addPromotionProduct,
  updatePromotionProduct,
  deletePromotionProduct,
  customers = [],
  products = [],
  onDealerSelect,
}: Props) {
  // Filter Subdealer customer master options
  const subdealerCustomers = (customers || []).filter(
    (c) =>
      c.customerType === "SUBDEALER" ||
      c.customerType === "Subdealer",
  );

  const subdealerOptions = subdealerCustomers.map((c) => ({
    value: c.name,
    label: c.name,
    subLabel: c.customerCode || undefined,
  }));

  // Filter Dealer customer master options
  const dealerCustomers = (customers || []).filter(
    (c) =>
      c.customerType === "DEALER" ||
      c.customerType === "Dealer" ||
      !c.customerType,
  );

  const dealerOptions = (
    dealerCustomers.length > 0 ? dealerCustomers : customers || []
  ).map((c) => ({
    value: c.name,
    label: c.name,
    subLabel: c.customerCode || undefined,
  }));

  const productOptions = (products || []).map((p) => ({
    value: p.name,
    label: p.name,
    subLabel: p.productCode || undefined,
  }));

  return (
    <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 md:p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
          <Users className="h-4 w-4 text-slate-600" />
          <span>จัดประชุม</span>
        </div>

        {!readonly && addType8Row && (
          <Button
            type="button"
            size="sm"
            onClick={addType8Row}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg h-7 px-2.5 shadow-sm"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            เพิ่มรายการ
          </Button>
        )}
      </div>

      {/* List of Meeting Cards */}
      <div className="space-y-4">
        {type8Items.length === 0 ? (
          <div className="py-6 text-center text-slate-400 italic bg-white rounded-xl border border-slate-200 text-xs">
            ยังไม่มีรายการประชุม
          </div>
        ) : (
          type8Items.map((item, index) => {
            const meetingTarget: Type8MeetingTarget =
              item.meetingTarget || "FARMER";
            const farmerChannel: Type8FarmerChannel =
              item.farmerChannel || "DEALER";

            const selectedProducts = item.targetProducts || [];
            const availableTargetProductOptions = productOptions.filter(
              (p) => !selectedProducts.includes(p.value),
            );

            const promoItems = item.promotionProducts || [];

            return (
              <div
                key={item.id}
                className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4 transition-all hover:border-blue-300"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <span className="text-xs font-bold text-blue-800 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[11px] font-extrabold">
                      {index + 1}
                    </span>
                    รายการจัดประชุมที่ {index + 1}
                  </span>
                  {!readonly && deleteType8Row && type8Items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => deleteType8Row(item.id)}
                      className="p-1 rounded-md text-red-500 hover:bg-red-50 text-xs font-medium flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>ลบรายการ</span>
                    </button>
                  )}
                </div>

                {/* 1. จัดประชุมให้ใคร (Target Audience) */}
                <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      จัดประชุมให้ใคร <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-wrap items-center gap-5">
                      <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name={`meeting-target-${item.id}`}
                          value="FARMER"
                          checked={meetingTarget === "FARMER"}
                          onChange={() => {
                            updateType8Row(item.id, "meetingTarget", "FARMER");
                          }}
                          disabled={readonly}
                          className="text-blue-600 focus:ring-blue-500 h-4 w-4"
                        />
                        <span>ฟาร์มเมอร์</span>
                      </label>

                      <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name={`meeting-target-${item.id}`}
                          value="DEALER"
                          checked={meetingTarget === "DEALER"}
                          onChange={() => {
                            updateType8Row(item.id, "meetingTarget", "DEALER");
                            updateType8Row(item.id, "subDealerStore", "");
                            updateType8Row(item.id, "subdealerId", "");
                            updateType8Row(item.id, "isUnregisteredSubdealer", false);
                          }}
                          disabled={readonly}
                          className="text-blue-600 focus:ring-blue-500 h-4 w-4"
                        />
                        <span>ดีลเลอร์</span>
                      </label>

                      <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name={`meeting-target-${item.id}`}
                          value="SUBDEALER"
                          checked={meetingTarget === "SUBDEALER"}
                          onChange={() => {
                            updateType8Row(item.id, "meetingTarget", "SUBDEALER");
                          }}
                          disabled={readonly}
                          className="text-blue-600 focus:ring-blue-500 h-4 w-4"
                        />
                        <span>ซับดีลเลอร์</span>
                      </label>
                    </div>
                  </div>

                  {/* Case 1: ฟาร์มเมอร์ (เลือกช่องทาง ดีลเลอร์ vs ซับดีลเลอร์) */}
                  {meetingTarget === "FARMER" && (
                    <div className="pt-2 border-t border-slate-200/60 space-y-3">
                      <div className="flex items-center gap-4">
                        <span className="text-[11px] font-bold text-slate-600">
                          ช่องทางจัดประชุม:
                        </span>
                        <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                          <input
                            type="radio"
                            name={`farmer-channel-${item.id}`}
                            value="DEALER"
                            checked={farmerChannel === "DEALER"}
                            onChange={() => {
                              updateType8Row(item.id, "farmerChannel", "DEALER");
                              updateType8Row(item.id, "subDealerStore", "");
                              updateType8Row(item.id, "subdealerId", "");
                              updateType8Row(item.id, "isUnregisteredSubdealer", false);
                            }}
                            disabled={readonly}
                            className="text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                          />
                          <span>ดีลเลอร์</span>
                        </label>
                        <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                          <input
                            type="radio"
                            name={`farmer-channel-${item.id}`}
                            value="SUBDEALER"
                            checked={farmerChannel === "SUBDEALER"}
                            onChange={() => {
                              updateType8Row(item.id, "farmerChannel", "SUBDEALER");
                            }}
                            disabled={readonly}
                            className="text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                          />
                          <span>ซับดีลเลอร์</span>
                        </label>
                      </div>

                      {farmerChannel === "DEALER" ? (
                        <div>
                          <FormCombobox
                            id={`dealer-combobox-${item.id}`}
                            label="เลือกร้านค้า Dealer จาก Customer Master"
                            labelClassName="block text-xs font-medium text-slate-700 mb-1"
                            triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-blue-500"
                            value={item.dealerName || ""}
                            onChange={(val) => {
                              const found = customers.find(
                                (c) => c.name === val || c.id === val,
                              );
                              updateType8Row(item.id, "dealerName", found?.name || val);
                              updateType8Row(item.id, "dealerId", found?.id || "");
                              if (onDealerSelect) onDealerSelect(found || null);
                            }}
                            options={dealerOptions}
                            placeholder="เลือกร้านค้า Dealer..."
                            searchPlaceholder="ค้นหาร้านค้า Dealer..."
                            emptyText="ไม่พบร้านค้า Dealer ในระบบ"
                            disabled={readonly}
                            required
                          />
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="block text-xs font-medium text-slate-700">
                                {item.isUnregisteredSubdealer
                                  ? "ชื่อร้านค้า Subdealer"
                                  : "เลือกร้านค้า Subdealer จาก Customer Master"}{" "}
                                <span className="text-red-500">*</span>
                              </label>
                              <label className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={Boolean(item.isUnregisteredSubdealer)}
                                  onChange={(e) => {
                                    const isChecked = e.target.checked;
                                    updateType8Row(
                                      item.id,
                                      "isUnregisteredSubdealer",
                                      isChecked,
                                    );
                                    if (isChecked) {
                                      updateType8Row(item.id, "subdealerId", "");
                                    } else {
                                      updateType8Row(item.id, "subDealerStore", "");
                                    }
                                  }}
                                  disabled={readonly}
                                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                                />
                                <span>ไม่มีในระบบ</span>
                              </label>
                            </div>
                            {item.isUnregisteredSubdealer ? (
                              <input
                                type="text"
                                value={item.subDealerStore || ""}
                                onChange={(e) =>
                                  updateType8Row(item.id, "subDealerStore", e.target.value)
                                }
                                disabled={readonly}
                                placeholder="ระบุชื่อร้านค้า Subdealer..."
                                className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
                              />
                            ) : (
                              <FormCombobox
                                id={`farmer-subdealer-combobox-${item.id}`}
                                label=""
                                labelClassName="hidden"
                                triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-blue-500"
                                value={
                                  subdealerCustomers.find(
                                    (c) => c.id === item.subdealerId,
                                  )?.name || ""
                                }
                                onChange={(val) => {
                                  const foundSub = subdealerCustomers.find(
                                    (c) => c.name === val || c.id === val,
                                  );
                                  if (foundSub) {
                                    updateType8Row(item.id, "subdealerId", foundSub.id);
                                    if (foundSub.parentDealerId) {
                                      const parent = customers.find(
                                        (c) => c.id === foundSub.parentDealerId,
                                      );
                                      if (parent) {
                                        updateType8Row(item.id, "dealerId", parent.id);
                                        updateType8Row(item.id, "dealerName", parent.name);
                                        if (onDealerSelect) onDealerSelect(parent);
                                      }
                                    }
                                  } else {
                                    updateType8Row(item.id, "subdealerId", "");
                                  }
                                }}
                                options={subdealerOptions}
                                placeholder="เลือกร้านค้า Subdealer..."
                                searchPlaceholder="ค้นหาร้านค้า Subdealer..."
                                emptyText="ไม่พบร้านค้า Subdealer ในระบบ"
                                disabled={readonly}
                                required
                              />
                            )}
                          </div>
                          <div>
                            <FormCombobox
                              id={`parent-dealer-combobox-${item.id}`}
                              label="เลือก Dealer ต้นสังกัด จาก Customer Master"
                              labelClassName="block text-xs font-medium text-slate-700 mb-1"
                              triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-blue-500"
                              value={item.dealerName || ""}
                              onChange={(val) => {
                                const found = customers.find(
                                  (c) => c.name === val || c.id === val,
                                );
                                updateType8Row(item.id, "dealerName", found?.name || val);
                                updateType8Row(item.id, "dealerId", found?.id || "");
                                if (onDealerSelect) onDealerSelect(found || null);
                              }}
                              options={dealerOptions}
                              placeholder="เลือกร้านค้า Dealer ต้นสังกัด..."
                              searchPlaceholder="ค้นหา Dealer..."
                              emptyText="ไม่พบร้านค้า Dealer ในระบบ"
                              disabled={readonly}
                              required
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Case 2: ดีลเลอร์ */}
                  {meetingTarget === "DEALER" && (
                    <div className="pt-2 border-t border-slate-200/60">
                      <FormCombobox
                        id={`dealer-only-combobox-${item.id}`}
                        label="เลือกร้านค้า Dealer จาก Customer Master"
                        labelClassName="block text-xs font-medium text-slate-700 mb-1"
                        triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-blue-500"
                        value={item.dealerName || ""}
                        onChange={(val) => {
                          const found = customers.find(
                            (c) => c.name === val || c.id === val,
                          );
                          updateType8Row(item.id, "dealerName", found?.name || val);
                          updateType8Row(item.id, "dealerId", found?.id || "");
                          if (onDealerSelect) onDealerSelect(found || null);
                        }}
                        options={dealerOptions}
                        placeholder="เลือกร้านค้า Dealer..."
                        searchPlaceholder="ค้นหาร้านค้า Dealer..."
                        emptyText="ไม่พบร้านค้า Dealer ในระบบ"
                        disabled={readonly}
                        required
                      />
                    </div>
                  )}

                  {/* Case 3: ซับดีลเลอร์ */}
                  {meetingTarget === "SUBDEALER" && (
                    <div className="pt-2 border-t border-slate-200/60 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-medium text-slate-700">
                            {item.isUnregisteredSubdealer
                              ? "ชื่อร้านค้า Subdealer"
                              : "เลือกร้านค้า Subdealer จาก Customer Master"}{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <label className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={Boolean(item.isUnregisteredSubdealer)}
                              onChange={(e) => {
                                const isChecked = e.target.checked;
                                updateType8Row(
                                  item.id,
                                  "isUnregisteredSubdealer",
                                  isChecked,
                                );
                                if (isChecked) {
                                  updateType8Row(item.id, "subdealerId", "");
                                } else {
                                  updateType8Row(item.id, "subDealerStore", "");
                                }
                              }}
                              disabled={readonly}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                            />
                            <span>ไม่มีในระบบ</span>
                          </label>
                        </div>
                        {item.isUnregisteredSubdealer ? (
                          <input
                            type="text"
                            value={item.subDealerStore || ""}
                            onChange={(e) =>
                              updateType8Row(item.id, "subDealerStore", e.target.value)
                            }
                            disabled={readonly}
                            placeholder="ระบุชื่อร้านค้า Subdealer..."
                            className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
                          />
                        ) : (
                          <FormCombobox
                            id={`subdealer-target-combobox-${item.id}`}
                            label=""
                            labelClassName="hidden"
                            triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-blue-500"
                            value={
                              subdealerCustomers.find(
                                (c) => c.id === item.subdealerId,
                              )?.name || ""
                            }
                            onChange={(val) => {
                              const foundSub = subdealerCustomers.find(
                                (c) => c.name === val || c.id === val,
                              );
                              if (foundSub) {
                                updateType8Row(item.id, "subdealerId", foundSub.id);
                                if (foundSub.parentDealerId) {
                                  const parent = customers.find(
                                    (c) => c.id === foundSub.parentDealerId,
                                  );
                                  if (parent) {
                                    updateType8Row(item.id, "dealerId", parent.id);
                                    updateType8Row(item.id, "dealerName", parent.name);
                                    if (onDealerSelect) onDealerSelect(parent);
                                  }
                                }
                              } else {
                                updateType8Row(item.id, "subdealerId", "");
                              }
                            }}
                            options={subdealerOptions}
                            placeholder="เลือกร้านค้า Subdealer..."
                            searchPlaceholder="ค้นหาร้านค้า Subdealer..."
                            emptyText="ไม่พบร้านค้า Subdealer ในระบบ"
                            disabled={readonly}
                            required
                          />
                        )}
                      </div>
                      <div>
                        <FormCombobox
                          id={`subdealer-parent-dealer-combobox-${item.id}`}
                          label="เลือก Dealer ต้นสังกัด จาก Customer Master"
                          labelClassName="block text-xs font-medium text-slate-700 mb-1"
                          triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-blue-500"
                          value={item.dealerName || ""}
                          onChange={(val) => {
                            const found = customers.find(
                              (c) => c.name === val || c.id === val,
                            );
                            updateType8Row(item.id, "dealerName", found?.name || val);
                            updateType8Row(item.id, "dealerId", found?.id || "");
                            if (onDealerSelect) onDealerSelect(found || null);
                          }}
                          options={dealerOptions}
                          placeholder="เลือกร้านค้า Dealer ต้นสังกัด..."
                          searchPlaceholder="ค้นหา Dealer..."
                          emptyText="ไม่พบร้านค้า Dealer ในระบบ"
                          disabled={readonly}
                          required
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. หัวข้อการประชุม & เป้าหมายผู้เข้าร่วม */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  <div className="md:col-span-8">
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      หัวข้อที่จะประชุม <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={item.topic}
                      onChange={(e) =>
                        updateType8Row(item.id, "topic", e.target.value)
                      }
                      disabled={readonly}
                      placeholder="เช่น ประชุมวางแผนฤดูกาลเพาะปลูก แนะนำปุ๋ยสูตรใหม่..."
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium bg-white"
                    />
                  </div>

                  <div className="md:col-span-4">
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      เป้าหมายผู้เข้าร่วม (คน) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={item.attendeesCount}
                      onChange={(e) =>
                        updateType8Row(
                          item.id,
                          "attendeesCount",
                          parseInt(e.target.value) || 0,
                        )
                      }
                      disabled={readonly}
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs text-slate-800 text-center focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium bg-white"
                    />
                  </div>
                </div>

                {/* 3. สินค้าเป้าหมาย (สูงสุด 5 รายการ) */}
                <div className="space-y-1.5 p-3 rounded-xl border border-slate-200/80 bg-slate-50/40">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      สินค้าเป้าหมาย (สูงสุด 5 รายการ)
                    </label>
                    <span className="text-[11px] font-semibold text-blue-700">
                      {selectedProducts.length}/5 รายการ
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {selectedProducts.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {selectedProducts.map((prod) => (
                          <span
                            key={prod}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-100 text-blue-800 text-xs font-medium border border-blue-200 shadow-2xs"
                          >
                            {prod}
                            {!readonly && (
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = selectedProducts.filter(
                                    (p) => p !== prod,
                                  );
                                  const prodObj = (products || []).find(
                                    (p) => p.name === prod || p.id === prod,
                                  );
                                  const updatedIds = (
                                    item.targetProductIds || []
                                  ).filter(
                                    (id) => id !== prodObj?.id && id !== prod,
                                  );
                                  updateType8Row(
                                    item.id,
                                    "targetProducts",
                                    updated,
                                  );
                                  updateType8Row(
                                    item.id,
                                    "targetProductIds",
                                    updatedIds,
                                  );
                                }}
                                className="text-blue-500 hover:text-blue-700 font-bold ml-0.5"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            )}
                          </span>
                        ))}
                      </div>
                    )}

                    {!readonly && selectedProducts.length < 5 && (
                      <FormCombobox
                        id={`target-product-combobox-${item.id}`}
                        label=""
                        labelClassName="hidden"
                        triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-blue-500"
                        value=""
                        onChange={(val) => {
                          if (!val) return;
                          if (
                            selectedProducts.length < 5 &&
                            !selectedProducts.includes(val)
                          ) {
                            const foundProd = (products || []).find(
                              (p) => p.name === val || p.id === val,
                            );
                            const newProdName = foundProd?.name || val;
                            const newProdId = foundProd?.id || val;
                            updateType8Row(item.id, "targetProducts", [
                              ...selectedProducts,
                              newProdName,
                            ]);
                            updateType8Row(item.id, "targetProductIds", [
                              ...(item.targetProductIds || []),
                              newProdId,
                            ]);
                          }
                        }}
                        options={availableTargetProductOptions}
                        placeholder={`+ เพิ่มสินค้าเป้าหมาย (${selectedProducts.length}/5)`}
                        searchPlaceholder="ค้นหาสินค้าเป้าหมาย..."
                        emptyText="ไม่พบสินค้า"
                        disabled={readonly}
                      />
                    )}

                    {selectedProducts.length === 5 && (
                      <span className="text-[11px] text-amber-600 font-medium block">
                        เลือกครบ 5 รายการแล้ว
                      </span>
                    )}
                  </div>
                </div>

                {/* 4. รายการสินค้าที่เสนอขาย / โปรโมชันหน้าร้าน (ตารางแบบ TYPE_9 + รายละเอียด) */}
                <div className="p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-teal-800 flex items-center gap-1.5">
                      <ShoppingBag className="h-4 w-4 text-teal-600" />
                      รายการสินค้าที่เสนอขาย / โปรโมชันหน้าร้าน
                    </span>

                    {!readonly && addPromotionProduct && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => addPromotionProduct(item.id)}
                        className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium rounded-lg h-7 px-2.5 shadow-sm"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        เพิ่มสินค้าเสนอขาย
                      </Button>
                    )}
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                        <tr>
                          <th className="py-2 px-2.5 text-center w-8">ลำดับ</th>
                          <th className="py-2 px-2.5 min-w-[170px]">
                            เลือกสินค้า <span className="text-red-500">*</span>
                          </th>
                          <th className="py-2 px-2.5 w-24 text-center">
                            จำนวน (ลัง)
                          </th>
                          <th className="py-2 px-2.5 w-28 text-center">
                            ราคาต่อลัง (บาท)
                          </th>
                          <th className="py-2 px-2.5 w-28 text-right">รวม (บาท)</th>
                          <th className="py-2 px-2.5 min-w-[160px]">
                            รายละเอียด <span className="text-slate-400 font-normal">(โปรโมชัน)</span>
                          </th>
                          {!readonly && (
                            <th className="py-2 px-2 text-center w-10">ลบ</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {promoItems.length === 0 ? (
                          <tr>
                            <td
                              colSpan={readonly ? 6 : 7}
                              className="py-4 text-center text-slate-400 italic"
                            >
                              ยังไม่มีรายการสินค้าเสนอขาย / โปรโมชัน
                            </td>
                          </tr>
                        ) : (
                          promoItems.map((promo, pIdx) => {
                            const totalAmount =
                              (promo.quantityCases || 0) * (promo.pricePerCase || 0);

                            return (
                              <tr
                                key={promo.id}
                                className="hover:bg-slate-50/60 transition-colors"
                              >
                                <td className="py-2 px-2.5 text-center font-medium text-slate-500">
                                  {pIdx + 1}
                                </td>
                                <td className="py-1.5 px-2.5">
                                  <FormCombobox
                                    id={`t8-promo-product-${item.id}-${promo.id}`}
                                    label=""
                                    labelClassName="hidden"
                                    triggerClassName="h-8 min-h-[32px] py-0.5 text-xs bg-white border-slate-200 rounded-md text-slate-800 focus:ring-2 focus:ring-teal-500"
                                    value={promo.productName}
                                    onChange={(val) => {
                                      if (updatePromotionProduct) {
                                        updatePromotionProduct(
                                          item.id,
                                          promo.id,
                                          "productName",
                                          val,
                                        );
                                      }
                                    }}
                                    options={productOptions}
                                    placeholder="เลือกสินค้า..."
                                    searchPlaceholder="ค้นหาสินค้า..."
                                    emptyText="ไม่พบสินค้า"
                                    disabled={readonly}
                                  />
                                </td>
                                <td className="py-1.5 px-2.5">
                                  <input
                                    type="number"
                                    min={0}
                                    value={promo.quantityCases}
                                    onChange={(e) => {
                                      if (updatePromotionProduct) {
                                        updatePromotionProduct(
                                          item.id,
                                          promo.id,
                                          "quantityCases",
                                          parseInt(e.target.value) || 0,
                                        );
                                      }
                                    }}
                                    disabled={readonly}
                                    className="w-full h-8 px-2 rounded-md border border-slate-200 text-xs text-slate-800 text-center focus:outline-none focus:ring-2 focus:ring-teal-500"
                                  />
                                </td>
                                <td className="py-1.5 px-2.5">
                                  <input
                                    type="number"
                                    min={0}
                                    step="any"
                                    value={promo.pricePerCase ?? 0}
                                    onChange={(e) => {
                                      if (updatePromotionProduct) {
                                        updatePromotionProduct(
                                          item.id,
                                          promo.id,
                                          "pricePerCase",
                                          parseFloat(e.target.value) || 0,
                                        );
                                      }
                                    }}
                                    disabled={readonly}
                                    className="w-full h-8 px-2 rounded-md border border-slate-200 text-xs text-slate-800 text-right focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                                  />
                                </td>
                                <td className="py-1.5 px-2.5 text-right font-bold text-teal-700">
                                  ฿{totalAmount.toLocaleString()}
                                </td>
                                <td className="py-1.5 px-2.5">
                                  <input
                                    type="text"
                                    value={promo.notes || ""}
                                    onChange={(e) => {
                                      if (updatePromotionProduct) {
                                        updatePromotionProduct(
                                          item.id,
                                          promo.id,
                                          "notes",
                                          e.target.value,
                                        );
                                      }
                                    }}
                                    disabled={readonly}
                                    placeholder="ระบุรายละเอียด เช่น โปรโมชัน 10 แถม 1..."
                                    className="w-full h-8 px-2.5 rounded-md border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder:text-slate-400 bg-white"
                                  />
                                </td>
                                {!readonly && deletePromotionProduct && (
                                  <td className="py-1.5 px-2 text-center">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        deletePromotionProduct(item.id, promo.id)
                                      }
                                      className="p-1 rounded-md text-red-500 hover:bg-red-50 transition-colors"
                                      title="ลบรายการสินค้า"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
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

                {/* 5. รายละเอียดเพิ่มเติม */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    รายละเอียดเพิ่มเติม
                  </label>
                  <input
                    type="text"
                    value={item.detail}
                    onChange={(e) =>
                      updateType8Row(item.id, "detail", e.target.value)
                    }
                    disabled={readonly}
                    placeholder="ระบุรายละเอียดเพิ่มเติมการจัดประชุม..."
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
