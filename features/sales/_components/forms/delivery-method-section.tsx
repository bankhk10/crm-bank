"use client";

/**
 * Delivery Method Section Component
 * Radio button group for selecting delivery method with address selector
 */

import React from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { MapPin } from "lucide-react";
import {
    FormCombobox,
    FormTextarea,
} from "@/components/custom/form-components";
import DatePicker from "@/components/custom/DatePicker";
import type { DeliveryMethodSectionProps, DeliveryMethodType } from "../../_types/types";
import { AddressSelector } from "./address-selector";
import { buildCompanyAddress } from "../../_lib";

const DELIVERY_METHODS = [
    {
        value: "SALES_DELIVERY" as const,
        label: "พนักงานขายจัดส่งสินค้า",
        icon: "🚚",
    },
    {
        value: "CUSTOMER_PICKUP" as const,
        label: "ลูกค้ามารับสินค้าเอง",
        icon: "🏬",
    },
    {
        value: "COURIER" as const,
        label: "ส่งผ่านบริษัทขนส่ง",
        icon: "📦",
    },
];

export function DeliveryMethodSection({
    value,
    onChange,
    customer,
    selectedAddressId,
    onAddressSelect,
    onUseCustomAddress,
    companies = [],
    pickupCompanyId = "",
    onPickupCompanyChange,
    shippingCompanyId = "",
    onShippingCompanyChange,
    requestedDeliveryDate = "",
    onRequestedDeliveryDateChange,
    shippingAddress = "",
    customShippingAddress = "",
    useCustomShippingAddress = false,
    onCustomShippingAddressChange,
    onUseCustomShippingAddressChange,
    fieldErrors = {},
    onFieldErrorClear,
}: DeliveryMethodSectionProps) {

    return (
        <div className="mt-6">
            <Label className="text-base font-semibold mx-2 mb-4 block">
                วิธีการจัดส่ง <span className="text-red-500">*</span>
            </Label>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {DELIVERY_METHODS.map((method) => (
                    <div
                        key={method.value}
                        onClick={() => onChange(method.value)}
                        className={`group relative cursor-pointer rounded-2xl border-2 p-5 transition-all
              ${value === method.value
                                ? "border-blue-500 bg-blue-50 shadow-md"
                                : "border-gray-200 hover:border-blue-300 hover:shadow-sm"
                            }`}
                    >
                        <div className="flex items-center gap-4">
                            <input
                                type="radio"
                                name="deliveryMethod"
                                value={method.value}
                                checked={value === method.value}
                                onChange={(e) => onChange(e.target.value as DeliveryMethodType)}
                                className="h-4 w-4 text-blue-600"
                            />

                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{method.icon}</span>
                                <span className="text-base font-medium text-gray-900">
                                    {method.label}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Shipping Address based on delivery method */}
            <div className="mt-6">
                {value === "CUSTOMER_PICKUP" ? (
                    <div className="space-y-4 border rounded-xl p-4">
                        <h4 className="font-medium text-gray-900">
                            รายละเอียดการรับสินค้า
                        </h4>
                        <div className="grid gap-x-4 gap-y-3 md:grid-cols-2">
                            <DatePicker
                                label="วันที่มารับสินค้า"
                                value={requestedDeliveryDate}
                                onChange={(val) => onRequestedDeliveryDateChange?.(val || "")}
                                placeholder="เลือกวันที่มารับสินค้า"
                                required
                            />

                            <FormCombobox
                                label="สถานที่รับสินค้า (บริษัท/สาขา)"
                                value={pickupCompanyId}
                                onChange={(val) => {
                                    onPickupCompanyChange?.(val);
                                    onFieldErrorClear?.("pickupCompanyId");
                                }}
                                options={companies.map((c) => ({
                                    value: c.id,
                                    label: c.name,
                                }))}
                                placeholder="เลือกสถานที่รับสินค้า"
                                searchPlaceholder="ค้นหาสถานที่..."
                                emptyText="ไม่พบสถานที่"
                                required
                                error={fieldErrors.pickupCompanyId}
                            />

                            <div className="md:col-span-2">
                                <Label className="text-base font-medium mx-2 mb-2 block">
                                    ที่อยู่สถานที่รับสินค้า
                                </Label>
                                <div className="p-3 bg-white border rounded-md min-h-[60px] text-gray-700">
                                    {shippingAddress || "-"}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : value === "COURIER" ? (
                    <div className="space-y-4 border rounded-xl p-4">
                        <h4 className="font-medium text-gray-900">
                            รายละเอียดการจัดส่งผ่านบริษัทขนส่ง
                        </h4>

                        <div className="grid gap-x-4 gap-y-3 md:grid-cols-1">
                            <div className="space-y-1">
                                <DatePicker
                                    label="วันที่ต้องการให้ส่งของ"
                                    value={requestedDeliveryDate}
                                    onChange={(val) => onRequestedDeliveryDateChange?.(val || "")}
                                    placeholder="เลือกวันที่ต้องการส่งของ"
                                />
                                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-2 py-1">
                                    ⏰ หมายเหตุ สร้างรายการหลัง 12:00 น. → จัดส่งวันถัดไป
                                </p>
                            </div>

                            {customer?.shippingCompanies &&
                                customer.shippingCompanies.length > 0 && (
                                    <FormCombobox
                                        label="เลือกบริษัทขนส่ง"
                                        value={shippingCompanyId}
                                        onChange={(val) => {
                                            onShippingCompanyChange?.(val);
                                            const selected = customer.shippingCompanies?.find(
                                                (sc) => sc.shippingCompany.id === val
                                            );
                                            const sc = selected?.shippingCompany;
                                            if (sc) {
                                                const structuredAddr = buildCompanyAddress({
                                                    addressLine: sc.addressLine || undefined,
                                                    subdistrict: sc.subdistrict || undefined,
                                                    district: sc.district || undefined,
                                                    province: sc.province || undefined,
                                                    postalCode: sc.postalCode || undefined,
                                                });
                                                const fullAddress = structuredAddr || sc.address || "";
                                                if (fullAddress) {
                                                    onCustomShippingAddressChange?.(fullAddress);
                                                }
                                            }
                                        }}
                                        options={customer.shippingCompanies.map((sc) => ({
                                            value: sc.shippingCompany.id,
                                            label: sc.shippingCompany.name,
                                        }))}
                                        placeholder="เลือกบริษัทขนส่ง"
                                        searchPlaceholder="ค้นหาบริษัทขนส่ง..."
                                        emptyText="ไม่พบข้อมูลบริษัทขนส่ง"
                                    />
                                )}

                            <FormTextarea
                                label="ที่อยู่สำหรับส่งให้บริษัทขนส่ง"
                                value={customShippingAddress}
                                onChange={(e) => {
                                    onCustomShippingAddressChange?.(e.target.value);
                                    onFieldErrorClear?.("customShippingAddress");
                                }}
                                placeholder="ระบุรายละเอียดที่อยู่..."
                                rows={4}
                                required
                                error={fieldErrors.customShippingAddress}
                            />
                        </div>
                    </div>
                ) : customer ? (
                    <>
                        {/* Address Selector Section */}
                        {!useCustomShippingAddress && (
                            <div className="space-y-4">
                                <AddressSelector
                                    customer={customer}
                                    selectedAddressId={selectedAddressId}
                                    onAddressSelect={onAddressSelect || (() => { })}
                                    onUseCustomAddress={onUseCustomAddress || (() => { })}
                                />
                            </div>
                        )}

                        {/* Custom Address Section */}
                        <div className="mt-6">
                            <div className="flex items-start gap-3">
                                {/* 1. วาง Checkbox ไว้หน้าสุด */}
                                <div className="pt-1.5"> {/* ปรับ pt เพื่อให้ Checkbox ตรงกับบรรทัดแรกของ Label/Textarea */}
                                    <Checkbox
                                        id="customShippingAddress"
                                        checked={useCustomShippingAddress}
                                        onCheckedChange={(checked) =>
                                            onUseCustomShippingAddressChange?.(checked as boolean)
                                        }
                                    />
                                </div>

                                {/* 2. ส่วนของเนื้อหา (Label และ Textarea) */}
                                <div className="flex-1 space-y-3">
                                    <label
                                        htmlFor="customShippingAddress"
                                        className="text-base font-medium cursor-pointer select-none"
                                    >
                                        ระบุที่อยู่จัดส่งสำหรับรายการขายนี้เท่านั้น
                                    </label>

                                    {useCustomShippingAddress && (
                                        <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                                            <FormTextarea
                                                label="" // ส่งค่าว่างไปที่ label เพราะเราใช้ label ด้านบนแล้ว
                                                value={customShippingAddress}
                                                onChange={(e) => onCustomShippingAddressChange?.(e.target.value)}
                                                rows={4}
                                                placeholder="กรอกที่อยู่จัดส่งสำหรับรายการขายนี้..."
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-200">
                            <MapPin className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-base font-medium text-gray-600">
                            กรุณาเลือกลูกค้า
                        </p>
                        <p className="mt-2 text-sm text-gray-500">
                            เลือกลูกค้าเพื่อแสดงข้อมูลที่อยู่จัดส่ง
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default DeliveryMethodSection;
