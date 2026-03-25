"use client";

/**
 * Customer Credit Info Component
 * Displays customer's credit limit information including temporary credit
 */

import React from "react";
import { FormInput } from "@/components/custom/form-components";
import type { SaleFormCustomer } from "../../../types";

interface CustomerCreditInfoProps {
    customer: SaleFormCustomer;
}

/**
 * Calculate active temporary credit amount
 * Returns the temp credit amount only if it hasn't expired
 */
function getActiveTempCredit(creditLimit: NonNullable<SaleFormCustomer["creditLimits"]>[0]): number {
    const tempAmount = Number(creditLimit.temporaryCreditAmount || 0);
    if (tempAmount <= 0) return 0;

    const tempExpiry = creditLimit.temporaryCreditExpiryDate;
    if (!tempExpiry) return 0;

    const expiryDate = new Date(tempExpiry);
    if (expiryDate < new Date()) return 0;

    return tempAmount;
}

export function CustomerCreditInfo({ customer }: CustomerCreditInfoProps) {
    const creditLimit = customer.creditLimits?.[0];
    const availableAmount = creditLimit?.availableAmount
        ? Number(creditLimit.availableAmount)
        : 0;

    // Add active temporary credit to available amount
    const activeTempCredit = creditLimit ? getActiveTempCredit(creditLimit) : 0;
    const totalAvailable = availableAmount + activeTempCredit;

    return (
        <div className="grid gap-x-4 gap-y-3 md:grid-cols-1">
            <FormInput
                label="วงเงินเครดิตคงเหลือ"
                type="number"
                value={String(totalAvailable)}
                onChange={() => { }}
                disabled
                readOnly
            />
            {activeTempCredit > 0 && (
                <p className="text-xs text-blue-600 -mt-2 ml-1">
                    (รวมวงเงินชั่วคราว {activeTempCredit.toLocaleString()} บาท)
                </p>
            )}
        </div>
    );
}

export default CustomerCreditInfo;
