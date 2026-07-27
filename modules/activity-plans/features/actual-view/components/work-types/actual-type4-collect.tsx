"use client";

import React from "react";
import { Receipt, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ActualTargetCard } from "../actual-target-card";
import { ImageFile } from "../../types";

interface ActualType4CollectProps {
  isVisible: boolean;
  target: {
    customer: string;
    orderNo: string;
    targetCollect: string;
  };
  orderNo: string;
  setOrderNo: (v: string) => void;
  receivedAmount: string;
  setReceivedAmount: (v: string) => void;
  paymentImages: ImageFile[];
  onUploadImages: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (id: string) => void;
}

export function ActualType4Collect({
  isVisible,
  target,
  orderNo,
  setOrderNo,
  receivedAmount,
  setReceivedAmount,
  paymentImages,
  onUploadImages,
  onRemoveImage,
}: ActualType4CollectProps) {
  if (!isVisible) return null;

  return (
    <div className="border-2 border-indigo-500 rounded-2xl p-4 md:p-6 bg-white space-y-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-sm shadow-2xs">
            4
          </span>
          <h2 className="font-bold text-indigo-900 text-base md:text-lg">
            วางบิล / เก็บเงิน
          </h2>
        </div>
      </div>

      <ActualTargetCard
        iconColorClass="text-indigo-600"
        badgeColorClass="bg-indigo-100 text-indigo-800"
        items={[
          { label: "ลูกค้า/ร้านค้า:", value: target.customer },
          { label: "เลขที่ออเดอร์:", value: target.orderNo },
          { label: "เป้ายอดเก็บเงิน:", value: target.targetCollect, highlight: true },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-800">
            เลขที่ออเดอร์ / ใบแจ้งหนี้ <span className="text-rose-500">*</span>
          </label>
          <Input
            value={orderNo}
            onChange={(e) => setOrderNo(e.target.value)}
            placeholder="เช่น INV-2026-0789"
            className="bg-white border-slate-300"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-800">
            จำนวนเงินที่รับชำระจริง (บาท) <span className="text-rose-500">*</span>
          </label>
          <div className="relative flex items-center">
            <Input
              type="number"
              min="0"
              value={receivedAmount}
              onChange={(e) => setReceivedAmount(e.target.value)}
              placeholder="0.00"
              className="bg-white border-slate-300 pr-12"
            />
            <span className="absolute right-3 text-xs font-semibold text-slate-500">
              บาท
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-800">
          รูปภาพหลักฐานการรับชำระเงิน <span className="text-rose-500">*</span>
        </label>
        <div className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/20 hover:bg-indigo-50/40 rounded-2xl p-5 text-center transition-colors cursor-pointer relative group">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={onUploadImages}
            className="absolute inset-0 opacity-0 cursor-pointer z-10"
          />
          <div className="flex flex-col items-center justify-center gap-1.5">
            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-indigo-900">
              คลิกเพื่ออัปโหลด สลิปโอนเงิน / ใบเสร็จรับเงิน
            </p>
          </div>
        </div>
        {paymentImages.length > 0 && (
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 pt-1">
            {paymentImages.map((img) => (
              <div
                key={img.id}
                className="relative aspect-square rounded-lg overflow-hidden border border-slate-200"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.name}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => onRemoveImage(img.id)}
                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
