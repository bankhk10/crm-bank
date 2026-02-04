"use client";

import { useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import type { ColumnDef } from "@tanstack/react-table";
import {
    MoreHorizontal,
    Eye,
    Edit,
    Trash2,
    Building2,
    Phone,
    Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CompanyStatusBadge } from "../_components/company-status-badge";
import type { CompanyRecord } from "../_types/types";

export function useCompanyColumns(
    onDeleteRequest: (company: CompanyRecord) => void,
    canDelete: boolean
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
                    <div className="font-mono text-sm text-slate-600">
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
                                <div className="flex items-center gap-2 text-slate-600">
                                    <Mail className="h-3 w-3" />
                                    <span className="truncate max-w-[150px]">{company.email}</span>
                                </div>
                            )}
                            {company.phone && (
                                <div className="flex items-center gap-2 text-slate-600">
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
                        ? format(new Date(row.original.createdAt), "d MMM yy", {
                            locale: th,
                        })
                        : "-",
            },
            {
                id: "actions",
                enableHiding: false,
                cell: ({ row }) => {
                    const company = row.original;

                    return (
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
                                    <Link
                                        href={`/companies/${company.id}`}
                                        className="cursor-pointer"
                                    >
                                        <Eye className="mr-2 h-4 w-4" /> รายละเอียด
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link
                                        href={`/companies/${company.id}/edit`}
                                        className="cursor-pointer"
                                    >
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
                    );
                },
            },
        ],
        [canDelete, onDeleteRequest]
    );

    return columns;
}
