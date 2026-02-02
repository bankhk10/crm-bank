"use client";

/**
 * Customer Credit Info Component
 * Displays customer's credit limit information
 */

import React from "react";
import { FormInput } from "@/components/custom/form-components";
import type { SaleFormCustomer } from "../../_types/types";

interface CustomerCreditInfoProps {
    customer: SaleFormCustomer;
}

export function CustomerCreditInfo({ customer }: CustomerCreditInfoProps) {
    const creditLimit = customer.creditLimits?.[0];
    const availableAmount = creditLimit?.availableAmount
        ? Number(creditLimit.availableAmount)
        : 0;

    return (
        <div className="grid gap-x-4 gap-y-3 md:grid-cols-1">
            <FormInput
                label="วงเงินเครดิตคงเหลือ"
                type="number"
                value={String(availableAmount)}
                onChange={() => { }}
                disabled
                readOnly
            />
        </div>
    );
}

export default CustomerCreditInfo;
