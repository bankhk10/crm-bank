"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { Edit } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import type { CustomerRecord } from "../../types";

export function useCreditLimitColumns() {
    return useMemo<ColumnDef<CustomerRecord>[]>(() => {
        return [
            {
                accessorKey: "customerCode",
                header: "รหัสลูกค้า",
                cell: (info) => info.getValue() || "-",
                meta: { minWidth: 120, width: 140, align: "left" },
            },
            {
                accessorKey: "name",
                header: "ชื่อลูกค้า",
                cell: (info) => info.getValue() || "-",
                meta: { minWidth: 200, width: 200, align: "left" },
            },
            {
                id: "creditLimit",
                header: "วงเงินเครดิตคงเหลือ",
                cell: ({ row }) => {
                    const r = row.original;
                    const cl = r.creditLimits && r.creditLimits[0];

                    if (!cl) return "-";

                    // Base credit remaining (without temporary credit)
                    const baseAmount =
                        cl.availableAmount !== undefined
                            ? Number(cl.availableAmount)
                            : Number(cl.limitAmount) - (Number(cl.usedAmount) || 0);

                    return new Intl.NumberFormat("th-TH", {
                        style: "currency",
                        currency: "THB",
                    }).format(baseAmount);
                },
                meta: { minWidth: 170, width: 170, align: "center" },
            },
            {
                id: "promoAmount",
                header: "วงเงินส่งเสริมการขาย",
                cell: ({ row }) => {
                    const r = row.original;
                    const cl = r.creditLimits && r.creditLimits[0];
                    if (!cl || cl.promoAmount === undefined || cl.promoAmount === null)
                        return "-";
                    const v = Number(cl.promoAmount);
                    return Number.isFinite(v)
                        ? new Intl.NumberFormat("th-TH", {
                            style: "currency",
                            currency: "THB",
                        }).format(v)
                        : "-";
                },
                meta: { minWidth: 180, width: 180, align: "center" },
            },
            {
                id: "temporaryCreditLimits",
                header: "วงเงินเครดิตชั่วคราว",
                cell: ({ row }) => {
                    const r = row.original;
                    const cl = r.creditLimits && r.creditLimits[0];

                    if (!cl) {
                        return new Intl.NumberFormat("th-TH", {
                            style: "currency",
                            currency: "THB",
                        }).format(0);
                    }

                    const tempAmount = Number(cl.temporaryCreditAmount || 0);
                    const tempExpiry = cl.temporaryCreditExpiryDate
                        ? new Date(cl.temporaryCreditExpiryDate)
                        : null;

                    if (tempAmount <= 0) {
                        return new Intl.NumberFormat("th-TH", {
                            style: "currency",
                            currency: "THB",
                        }).format(0);
                    }

                    const now = new Date();
                    if (tempExpiry && tempExpiry < now) {
                        return (
                            <div className="text-sm">
                                <span className="font-medium text-gray-400">
                                    {new Intl.NumberFormat("th-TH", {
                                        style: "currency",
                                        currency: "THB",
                                    }).format(0)}
                                </span>
                            </div>
                        );
                    }

                    return (
                        <div className="text-sm">
                            <span className="font-medium text-green-600">
                                {new Intl.NumberFormat("th-TH", {
                                    style: "currency",
                                    currency: "THB",
                                }).format(tempAmount)}
                            </span>
                            {tempExpiry && (
                                <div className="text-xs text-gray-500 mt-1">
                                    หมดอายุ: {tempExpiry.toLocaleDateString("th-TH")}
                                </div>
                            )}
                        </div>
                    );
                },
                meta: { minWidth: 170, width: 170, align: "center" },
            },
            {
                id: "actions",
                header: "",
                cell: ({ row }) => {
                    const r = row.original;
                    const cl = r.creditLimits && r.creditLimits[0];
                    const href = cl
                        ? `/credit-limits/${cl.id}/edit`
                        : `/credit-limits/new?customerId=${r.id}`;
                    return (
                        <div className="flex items-center justify-end gap-2">
                            <Link href={href}>
                                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                    <span className="inline-flex items-center gap-2">
                                        <Edit className="h-4 w-4" />
                                        แก้ไขวงเงิน
                                    </span>
                                </Button>
                            </Link>
                        </div>
                    );
                },
                meta: { minWidth: 130, width: 130, align: "right" },
            },
        ];
    }, []);
}
