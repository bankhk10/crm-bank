"use client";

import { Package, Store, UserCheck, MapPin, Phone, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Type2PlanCardTargetItem {
  id?: string;
  productId?: string;
  productName: string;
  customer?: string;
  storeId?: string;
  detail?: string;
  notes?: string;
  expectedResult?: string;
  isAdditional?: boolean;
}

export interface Type2PlanCardTarget {
  product?: string;
  customer?: string;
  storeName?: string;
  keyFarmer?: string;
  province?: string;
  visitPurpose?: "FARMER" | "STORE";
  isUnregisteredFarmer?: boolean;
  unregisteredFarmerName?: string;
  unregisteredFarmerPhone?: string;
  detail?: string;
  expectedResult?: string;
  items?: Type2PlanCardTargetItem[];
}

export interface Type2PlanCardProps {
  planType?: string;
  target?: Type2PlanCardTarget;
  className?: string;
}

export function Type2PlanCard({
  planType,
  target,
  className,
}: Type2PlanCardProps) {
  if (planType === "UNPLANNED" || !target) return null;

  // Normalize product items (supports multi-product or fallback to single legacy product)
  const productItems: Type2PlanCardTargetItem[] =
    target.items && target.items.length > 0
      ? target.items
      : target.product
        ? [
            {
              id: "p-0",
              productName: target.product,
              customer: target.customer,
              detail: target.detail,
            },
          ]
        : [];

  const customerName =
    target.customer ||
    target.storeName ||
    target.keyFarmer ||
    productItems[0]?.customer ||
    "-";

  const isStore =
    target.visitPurpose === "STORE" ||
    customerName.startsWith("ร้าน") ||
    customerName.startsWith("บจก.") ||
    customerName.startsWith("บริษัท");

  // Avoid duplicate detail rendering if there's only 1 item with identical text
  const isDetailDuplicate =
    productItems.length === 1 &&
    Boolean(target.detail) &&
    (productItems[0].detail === target.detail ||
      productItems[0].notes === target.detail);

  const phone =
    target.unregisteredFarmerPhone || (target as any)?.phone || undefined;

  const farmerDisplayName = target.isUnregisteredFarmer
    ? target.unregisteredFarmerName || customerName
    : customerName;

  return (
    <div
      className={cn(
        "bg-white border border-indigo-200/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs",
        className,
      )}
    >
      {/* ───────────────────────────────────────────────────────────── */}
      {/* HEADER: Item Title & Plan Badge */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-extrabold shrink-0">
            1
          </span>
          <h4 className="font-bold text-indigo-950 text-sm sm:text-base">
            รายการติดตามผลการใช้สินค้า
          </h4>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
            ข้อมูลตามแผนงาน (PLAN)
          </span>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* SECTION: วัตถุประสงค์ & ข้อมูลลูกค้า / ร้านค้า */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
          {/* วัตถุประสงค์ของประเภทงาน */}
          <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/70 space-y-1">
            <span className="text-slate-400 font-medium block text-[11px]">
              วัตถุประสงค์ของประเภทงาน
            </span>
            <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs sm:text-sm">
              {isStore ? (
                <>
                  <Store className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>ติดตามจากร้านค้า</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>ติดตามจากเกษตรกร</span>
                </>
              )}
            </div>
          </div>

          {/* ชื่อร้านค้า / เกษตรกร */}
          <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/70 space-y-1">
            <span className="text-slate-400 font-medium block text-[11px]">
              {isStore
                ? "ร้านค้า / ลูกค้า"
                : target.isUnregisteredFarmer
                  ? "ชื่อ - สกุล เกษตรกร"
                  : "เกษตรกร / ลูกค้า"}
            </span>
            <span
              className="font-bold text-slate-800 text-xs sm:text-sm block truncate"
              title={farmerDisplayName}
            >
              {farmerDisplayName}
            </span>
          </div>

          {/* จังหวัด (ถ้ามี) */}
          {target.province ? (
            <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/70 space-y-1">
              <span className="text-slate-400 font-medium block text-[11px]">
                จังหวัด
              </span>
              <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs sm:text-sm">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{target.province}</span>
              </div>
            </div>
          ) : null}

          {/* เบอร์โทรศัพท์ (ถ้ามี) */}
          {phone ? (
            <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/70 space-y-1">
              <span className="text-slate-400 font-medium block text-[11px]">
                เบอร์โทรศัพท์
              </span>
              <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs sm:text-sm">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{phone}</span>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* SECTION: รายการสินค้าที่จะติดตามผล */}
      {/* ───────────────────────────────────────────────────────────── */}
      {productItems.length > 0 && (
        <div className="border border-slate-200/90 rounded-xl p-3.5 sm:p-4 bg-slate-50/40 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-indigo-600" />
              รายการสินค้าที่จะติดตามผล
            </span>
            <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-md">
              {productItems.length} รายการ
            </span>
          </div>

          <div className="space-y-2.5">
            {productItems.map((item, idx) => {
              const itemNotes = item.detail || item.notes;

              return (
                <div
                  key={item.id || idx}
                  className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs space-y-2"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                    {/* ชื่อสินค้า */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                          {idx + 1}
                        </span>
                        สินค้า
                      </span>
                      <div
                        className="bg-slate-50/80 px-3 py-2 rounded-lg border border-slate-200/70 text-xs font-bold text-slate-800 truncate"
                        title={item.productName}
                      >
                        {item.productName || "ไม่ระบุสินค้า"}
                      </div>
                    </div>

                    {/* รายละเอียดของสินค้า */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-medium text-slate-400 block">
                        รายละเอียด
                      </span>
                      <div className="bg-slate-50/80 px-3 py-2 rounded-lg border border-slate-200/70 text-xs text-slate-700 min-h-[36px] flex items-center whitespace-pre-wrap">
                        {itemNotes || "-"}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* SECTION: รายละเอียดเพิ่มเติม (ภาพรวมการติดตาม) */}
      {/* ───────────────────────────────────────────────────────────── */}
      {target.detail && !isDetailDuplicate && (
        <div className="space-y-1.5 text-xs">
          <span className="text-slate-500 font-semibold block text-[11px]">
            รายละเอียดเพิ่มเติม (ภาพรวมการติดตาม)
          </span>
          <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/80 text-slate-700 whitespace-pre-wrap">
            {target.detail}
          </div>
        </div>
      )}
    </div>
  );
}
