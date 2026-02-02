"use client";

/**
 * Delivery Method Section Component
 * Radio button group for selecting delivery method
 */

import React from "react";
import { Label } from "@/components/ui/label";
import type { DeliveryMethodSectionProps, DeliveryMethodType } from "../../_types/types";

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
        </div>
    );
}

export default DeliveryMethodSection;
