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
    Truck,
    Phone,
    MapPin,
    Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShippingCompanyStatusBadge } from "../_components/shipping-company-status-badge";
import type { ShippingCompanyRecord } from "../_types";
import { Badge } from "@/components/ui/badge";

export function useShippingCompanyColumns(
    onDeleteRequest: (shippingCompany: ShippingCompanyRecord) => void,
    canDelete: boolean
) {
    const columns = useMemo<ColumnDef<ShippingCompanyRecord>[]>(
        () => [
            {
                accessorKey: "name",
                header: "ชื่อบริษัทขนส่ง",
                cell: ({ row }) => {
                    const company = row.original;
                    return (
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-orange-50 rounded-lg hidden sm:block">
                                <Truck className="h-4 w-4 text-orange-600" />
                            </div>
                            <div>
                                <div className="font-medium text-slate-900">{company.name}</div>
                                {company.phone && (
                                    <div className="flex items-center gap-1 text-sm text-slate-500 mt-0.5">
                                        <Phone className="h-3 w-3" />
                                        {company.phone}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                },
            },
            {
                accessorKey: "address",
                header: "ที่อยู่",
                cell: ({ row }) => {
                    const address = row.original.address;
                    return (
                        <div className="text-sm max-w-[200px]">
                            {address ? (
                                <div className="flex items-start gap-2">
                                    <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0 text-slate-400" />
                                    <span className="line-clamp-2">{address}</span>
                                </div>
                            ) : (
                                <span className="text-slate-400 text-xs">- ไม่มีข้อมูล -</span>
                            )}
                        </div>
                    );
                },
            },
            {
                accessorKey: "customerList",
                header: "ลูกค้าที่ใช้บริการ",
                cell: ({ row }) => {
                    const customers = row.original.customerList || [];
                    return (
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-slate-400" />
                            <Badge variant="secondary" className="font-normal">
                                {customers.length} ราย
                            </Badge>
                            {customers.length > 0 && (
                                <div className="text-xs text-slate-500 max-w-[150px] truncate hidden lg:block">
                                    {customers.map((c) => c.name).join(", ")}
                                </div>
                            )}
                        </div>
                    );
                },
            },
            {
                accessorKey: "status",
                header: "สถานะ",
                cell: ({ row }) => <ShippingCompanyStatusBadge status={row.original.status} />,
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
                                <Link href={`/shipping-companies/${company.id}`}>
                                    <Eye className="h-4 w-4" />
                                </Link>
                            </Button>

                            <Button
                                asChild
                                variant="outline"
                                size="sm"
                                className="text-purple-600 border-purple-100 hover:bg-purple-50 rounded-md"
                            >
                                <Link href={`/shipping-companies/${company.id}/edit`}>
                                    <Edit className="h-4 w-4" />
                                </Link>
                            </Button>

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
        [canDelete, onDeleteRequest]
    );

    return columns;
}
