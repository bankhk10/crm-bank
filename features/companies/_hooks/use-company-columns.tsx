"use client";

import { useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import type { ColumnDef } from "@tanstack/react-table";
import {
    Eye,
    Edit,
    Trash2,
    Building2,
    Phone,
    Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CompanyStatusBadge } from "../_components/company-status-badge";
import type { CompanyRecord } from "../_types/types";

export function useCompanyColumns(
    onDeleteRequest: (company: CompanyRecord) => void,
    canDelete: boolean,
    canEdit: boolean
) {
    const columns = useMemo<ColumnDef<CompanyRecord>[]>(
        () => [
            {
                accessorKey: "name",
                header: "ชื่อบริษัท",
                cell: ({ row }) => {
                    const company = row.original;
                    return (
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-50 rounded-lg hidden sm:block">
                                <Building2 className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                                <div className="font-medium text-slate-900">{company.name}</div>
                                {company.shortName && (
                                    <div className="text-sm text-slate-500">
                                        ({company.shortName})
                                    </div>
                                )}
                                {company.taxId && (
                                    <div className="text-xs text-slate-400 mt-0.5 sm:hidden">
                                        Tax: {company.taxId}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                },
            },
            {
                accessorKey: "taxId",
                header: "เลขผู้เสียภาษี",
                cell: ({ row }) => (
                    <div className="text-sm">
                        {row.original.taxId || "-"}
                    </div>
                ),
            },
            {
                accessorKey: "contact",
                header: "ข้อมูลติดต่อ",
                cell: ({ row }) => {
                    const company = row.original;
                    return (
                        <div className="space-y-1 text-sm">
                            {company.email && (
                                <div className="flex items-center gap-2">
                                    <Mail className="h-3 w-3" />
                                    <span className="truncate max-w-[150px]">{company.email}</span>
                                </div>
                            )}
                            {company.phone && (
                                <div className="flex items-center gap-2">
                                    <Phone className="h-3 w-3" />
                                    <span>{company.phone}</span>
                                </div>
                            )}
                            {!company.email && !company.phone && (
                                <span className="text-slate-400 text-xs">- ไม่มีข้อมูล -</span>
                            )}
                        </div>
                    );
                },
            },
            {
                accessorKey: "status",
                header: "สถานะ",
                cell: ({ row }) => <CompanyStatusBadge status={row.original.status} />,
            },
            {
                accessorKey: "createdAt",
                header: "วันที่สร้าง",
                cell: ({ row }) =>
                    row.original.createdAt
                        ? format(new Date(row.original.createdAt), "d MMM yyyy", {
                            locale: th,
                        })
                        : "-",
            },
            {
                id: "actions",
                header: "จัดการ",
                enableHiding: false,
                cell: ({ row }) => {
                    const company = row.original;

                    return (
                        <div className="flex items-center gap-2">

                            <Button
                                asChild
                                variant="outline"
                                size="sm"
                                className="text-blue-600 hover:bg-blue-50 border border-blue-100 rounded-md"
                            >
                                <Link href={`/companies/${company.id}`}>
                                    <Eye className="h-4 w-4" />
                                </Link>
                            </Button>

                            {canEdit && (
                                <Button
                                    asChild
                                    variant="outline"
                                    size="sm"
                                    className="text-purple-600 border-purple-100 hover:bg-purple-50 rounded-md"
                                >
                                    <Link href={`/companies/${company.id}/edit`}>
                                        <Edit className="h-4 w-4" />
                                    </Link>
                                </Button>
                            )}

                            {canDelete && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-100 rounded-md"
                                    onClick={() => onDeleteRequest(company)}
                                    aria-label="ลบข้อมูล"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    );
                },
            },
        ],
        [canDelete, onDeleteRequest, canEdit]
    );

    return columns;
}
