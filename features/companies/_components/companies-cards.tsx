import { format } from "date-fns";
import { th } from "date-fns/locale";
import {
    Building2,
    Calendar,
    Mail,
    Phone,
    MoreHorizontal,
    Eye,
    Edit,
    Trash2,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CompanyStatusBadge } from "./company-status-badge";
import type { CompaniesTableProps } from "../_types/types";

type CompaniesCardsProps = Pick<
    CompaniesTableProps,
    "data" | "loading" | "canDelete" | "onDeleteRequest" | "pagination"
>;

export function CompaniesCards({
    data,
    loading,
    canDelete,
    onDeleteRequest,
    pagination,
}: CompaniesCardsProps) {
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
                ไม่พบข้อมูลบริษัท
            </div>
        );
    }

    const totalPages = Math.ceil(pagination.total / pagination.perPage);

    return (
        <div className="space-y-4">
            {data.map((company) => (
                <Card key={company.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4 space-y-4">
                        <div className="flex justify-between items-start">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-blue-50 rounded-lg">
                                    <Building2 className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-900">{company.name}</h3>
                                    {company.shortName && (
                                        <div className="text-sm text-slate-500">
                                            ({company.shortName})
                                        </div>
                                    )}
                                    {company.taxId && (
                                        <div className="text-xs text-slate-400 mt-1">
                                            Tax ID: {company.taxId}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                        <span className="sr-only">Open menu</span>
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>การจัดการ</DropdownMenuLabel>
                                    <DropdownMenuItem asChild>
                                        <Link href={`/companies/${company.id}`} className="cursor-pointer">
                                            <Eye className="mr-2 h-4 w-4" /> รายละเอียด
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href={`/companies/${company.id}/edit`} className="cursor-pointer">
                                            <Edit className="mr-2 h-4 w-4" /> แก้ไขข้อมูล
                                        </Link>
                                    </DropdownMenuItem>
                                    {canDelete && (
                                        <>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                className="text-red-600 cursor-pointer"
                                                onClick={() => onDeleteRequest(company)}
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" /> ลบข้อมูล
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        <div className="grid gap-2 text-sm text-slate-600">
                            {company.email && (
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-slate-400" />
                                    <span className="truncate">{company.email}</span>
                                </div>
                            )}
                            {company.phone && (
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-slate-400" />
                                    <span>{company.phone}</span>
                                </div>
                            )}
                        </div>

                        <div className="pt-3 border-t flex items-center justify-between">
                            <CompanyStatusBadge status={company.status} />
                            <div className="text-xs text-slate-400 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {company.createdAt
                                    ? format(new Date(company.createdAt), "d MMM yy", {
                                        locale: th,
                                    })
                                    : "-"}
                            </div>
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
