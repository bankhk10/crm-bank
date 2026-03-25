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
    if (!tempExpiry) return tempAmount; // If no expiry, assume it's valid

    const expiryDate = new Date(tempExpiry);
    const now = new Date();
    // Set now to start of day for comparison if we want to include the expiry day
    now.setHours(0, 0, 0, 0);

    if (expiryDate < now) return 0;

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
        </div>
    );
}

export default CustomerCreditInfo;
