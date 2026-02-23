import { format } from "date-fns";
import { th } from "date-fns/locale";
import {
    Calendar,
    User,
    ClipboardList,
    Eye,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "./status-badge";
import { ActionButton } from "@/components/custom/action-button";
import type { SaleRecord } from "../_types/types";

interface FulfillmentCardsProps {
    data: SaleRecord[];
    loading?: boolean;
    pagination: {
        page: number;
        perPage: number;
        total: number;
        onPageChange: (p: number) => void;
        onPerPageChange: (n: number) => void;
    };
}

export function FulfillmentCards({
    data,
    loading,
    pagination,
}: FulfillmentCardsProps) {
    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <Card key={i} className="animate-pulse">
                        <CardContent className="h-40" />
                    </Card>
                ))}
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground bg-white rounded-lg border border-dashed">
                ไม่พบข้อมูล
            </div>
        );
    }

    const totalPages = Math.ceil(pagination.total / pagination.perPage);

    return (
        <div className="space-y-4">
            {data.map((sale) => (
                <Card key={sale.id} className="overflow-hidden border-l-4 border-l-primary/50 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4 space-y-4">
                        {/* Header */}
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-lg text-primary">
                                        {sale.saleNumber}
                                    </span>
                                    <StatusBadge status={sale.status} />
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <Calendar className="h-3.5 w-3.5" />
                                    {format(new Date(sale.saleDate), "d MMM yy", { locale: th })}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="font-bold text-lg">
                                    ฿{Number(sale.totalAmount).toLocaleString()}
                                </div>
                                <Badge variant="outline" className="text-xs font-normal">
                                    {sale.items.length} รายการ
                                </Badge>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="space-y-1">
                                <div className="flex items-center gap-1.5 text-slate-500 text-xs uppercase tracking-wider">
                                    <User className="h-3.5 w-3.5" /> ลูกค้า
                                </div>
                                <div className="font-medium truncate">{sale.customer.name}</div>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-1.5 text-slate-500 text-xs uppercase tracking-wider">
                                    <User className="h-3.5 w-3.5" /> พนักงานขาย
                                </div>
                                <div className="font-medium truncate">{sale.employee.name}</div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-3 border-t flex gap-2 justify-end">
                            <ActionButton
                                href={`/sales/${sale.id}`}
                                icon={Eye}
                                label="ดูรายละเอียด"
                                colorClass="text-slate-600 hover:text-slate-800 border-slate-200 hover:bg-slate-50"
                            />
                            <ActionButton
                                href={`/fulfillment/${sale.id}`}
                                icon={ClipboardList}
                                label="จัดการสินค้า"
                                colorClass="text-blue-600 hover:text-blue-700 border-blue-200 hover:bg-blue-50"
                            />
                        </div>
                    </CardContent>
                </Card>
            ))}

            {/* Pagination */}
            <div className="flex items-center justify-between pt-4">
                <div className="text-sm text-muted-foreground">
                    หน้าที่ {pagination.page} จาก {totalPages}
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => pagination.onPageChange(Math.max(1, pagination.page - 1))}
                        disabled={pagination.page <= 1}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => pagination.onPageChange(Math.min(totalPages, pagination.page + 1))}
                        disabled={pagination.page >= totalPages}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
