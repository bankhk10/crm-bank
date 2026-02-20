"use client";

import React from "react";
import Link from "next/link";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import {
    CreditCard,
    Edit,
    User,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { calculateCreditInfo, formatCurrency } from "../_lib/utils";
import type { CustomersCreditTableProps } from "../_types/types";

type Props = Pick<CustomersCreditTableProps, "data" | "loading" | "pagination">;

export function CreditLimitCards({ data, loading, pagination }: Props) {
    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <Card key={i} className="animate-pulse">
                        <CardContent className="h-32" />
                    </Card>
                ))}
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground bg-white rounded-lg border border-dashed">
                ไม่พบข้อมูลลูกค้า
            </div>
        );
    }

    const totalPages = pagination
        ? Math.ceil(pagination.total / pagination.perPage)
        : 1;

    return (
        <div className="space-y-4">
            {data.map((customer) => {
                const info = calculateCreditInfo(customer);
                const editHref = info.creditLimitId
                    ? `/credit-limits/${info.creditLimitId}/edit`
                    : `/credit-limits/new?customerId=${customer.id}`;

                return (
                    <Card key={customer.id} className="overflow-hidden shadow-sm">
                        <CardContent className="p-4 space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-blue-50 rounded-lg">
                                        <User className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-900">
                                            {customer.name}
                                        </h3>
                                        <div className="text-sm text-slate-500">
                                            {customer.customerCode}
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    asChild
                                    size="sm"
                                    variant="outline"
                                    className="h-8 w-8 p-0"
                                >
                                    <Link href={editHref}>
                                        <Edit className="h-4 w-4 text-slate-600" />
                                    </Link>
                                </Button>
                            </div>

                            <div className="grid gap-3 pt-2">
                                <div className="p-3 bg-slate-50 rounded-lg space-y-1">
                                    <span className="text-xs text-slate-500 font-medium uppercase">
                                        วงเงินคงเหลือ
                                    </span>
                                    <div className="text-xl font-bold text-slate-900">
                                        {info.hasCreditLimit
                                            ? formatCurrency(info.totalRemaining)
                                            : "-"}
                                    </div>
                                </div>

                                {info.hasCreditLimit && (
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <span className="text-slate-500">Promotion</span>
                                            <div className="font-medium">
                                                {info.promoAmount > 0
                                                    ? formatCurrency(info.promoAmount)
                                                    : "-"}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-slate-500">วงเงินชั่วคราว</span>
                                            {info.tempLimitAmount > 0 ? (
                                                <div>
                                                    <div className="font-medium text-green-600">
                                                        {formatCurrency(info.tempLimitAmount)}
                                                    </div>
                                                    {info.latestTempExpiry && (
                                                        <div className="text-xs text-slate-400">
                                                            Exp:{" "}
                                                            {format(info.latestTempExpiry, "d MMM yy", {
                                                                locale: th,
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : info.isTempExpired ? (
                                                <div className="text-slate-400 flex items-center gap-1">
                                                    0 <span className="text-[10px] text-red-500">(Expired)</span>
                                                </div>
                                            ) : (
                                                <div className="font-medium">-</div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                );
            })}

            {pagination && (
                <div className="flex items-center justify-between pt-4">
                    <div className="text-sm text-muted-foreground">
                        หน้าที่ {pagination.page} จาก {totalPages}
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                pagination.onPageChange(Math.max(1, pagination.page - 1))
                            }
                            disabled={pagination.page <= 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                pagination.onPageChange(
                                    Math.min(totalPages, pagination.page + 1)
                                )
                            }
                            disabled={pagination.page >= totalPages}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
