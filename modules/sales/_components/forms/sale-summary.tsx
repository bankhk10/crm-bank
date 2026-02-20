"use client";

/**
 * Sale Summary Component
 * Displays the sale totals (subtotal, discounts, final total)
 */

import React from "react";
import type { SaleSummaryProps } from "../../_types/types";

/**
 * Format number as Thai currency without symbol
 */
function formatNumber(value: number): string {
    return value.toLocaleString("th-TH", { minimumFractionDigits: 2 });
}

export function SaleSummary({
    subtotal,
    shippingCost,
    otherCosts,
    total,
}: SaleSummaryProps) {
    return (
        <div className="space-y-2 mt-6">
            <div className="flex justify-between">
                <span>รวมเป็นเงิน:</span>
                <span className="font-medium">฿{formatNumber(subtotal)}</span>
            </div>

            {shippingCost > 0 && (
                <div className="flex justify-between text-red-600">
                    <span>ส่วนลดค่าขนส่ง:</span>
                    <span>-฿{formatNumber(shippingCost)}</span>
                </div>
            )}

            {otherCosts > 0 && (
                <div className="flex justify-between text-red-600">
                    <span>ส่วนลดหน้าบิล:</span>
                    <span>-฿{formatNumber(otherCosts)}</span>
                </div>
            )}

            <div className="border-t pt-2 flex justify-between text-xl font-bold">
                <span>ยอดเงินสุทธิ:</span>
                <span className="text-blue-600">฿{formatNumber(total)}</span>
            </div>
        </div>
    );
}

export default SaleSummary;
