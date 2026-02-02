import React from "react";
import Link from "next/link";
import { Eye, Edit, Trash2 } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
} from "@/components/ui/tooltip";
import { Employee } from "../_types/types";
import { EmployeeStatusBadge } from "../_components/employee-status-badge";

function TruncatedCell({ value }: { value: string }) {
    return (
        <div className="truncate" title={value}>
            {value}
        </div>
    );
}

function ActionButton({
    href,
    icon: Icon,
    label,
    colorClass,
    onClick,
}: {
    href?: string;
    icon: React.ElementType;
    label: string;
    colorClass: string;
    onClick?: () => void;
}) {
    const button = (
        <Button
            asChild={!!href}
            size="icon-sm"
            variant={onClick ? "destructive" : "outline"}
            className={colorClass}
            onClick={onClick}
            aria-label={label}
        >
            {href ? (
                <Link href={href}>
                    <Icon className="size-4" />
                </Link>
            ) : (
                <Icon className="size-4" />
            )}
        </Button>
    );

    return (
        <Tooltip>
            <TooltipTrigger asChild>{button}</TooltipTrigger>
            <TooltipContent side="top">{label}</TooltipContent>
        </Tooltip>
    );
}

export function useEmployeeColumns(
    onDeleteRequest: (employee: Employee) => void,
    canDelete: boolean,
    canEdit: boolean,
    canView: boolean,
) {
    return React.useMemo<ColumnDef<Employee>[]>(
        () => [
            {
                accessorKey: "employeeCode",
                header: "รหัสพนักงาน",
                meta: {
                    headerAlign: "left",
                    minWidth: 140,
                    width: 140,
                    maxWidth: 140,
                    align: "left",
                },
                cell: ({ row }) => {
                    // Mock code generation if missing
                    const code =
                        row.original.employeeCode ||
                        `EMP-${row.original.id.substring(0, 5).toUpperCase()}`;
                    return <TruncatedCell value={code} />;
                },
            },
            {
                accessorKey: "name",
                header: "ชื่อ-นามสกุล",
                meta: {
                    headerAlign: "left",
                    minWidth: 180,
                    width: 250,
                    maxWidth: 250,
                    align: "left",
                },
                cell: ({ row }) => <TruncatedCell value={row.original.name ?? "-"} />,
            },
            {
                accessorKey: "email",
                header: "อีเมล",
                meta: {
                    headerAlign: "left",
                    minWidth: 160,
                    width: 200,
                    maxWidth: 200,
                    align: "left",
                },
                cell: ({ row }) => <TruncatedCell value={row.original.email ?? "-"} />,
            },
            {
                accessorKey: "phone",
                header: "เบอร์โทรศัพท์",
                meta: {
                    headerAlign: "left",
                    minWidth: 120,
                    width: 140,
                    maxWidth: 140,
                    align: "left",
                },
                cell: ({ row }) => <TruncatedCell value={row.original.phone ?? "-"} />,
            },
            {
                accessorKey: "position",
                header: "ตำแหน่ง",
                meta: {
                    headerAlign: "left",
                    minWidth: 140,
                    width: 160,
                    maxWidth: 160,
                    align: "left",
                },
                cell: ({ row }) => (
                    <TruncatedCell
                        value={
                            row.original.position?.name ??
                            row.original.positionId ??
                            "-"
                        }
                    />
                ),
            },
            {
                accessorKey: "status",
                header: "สถานะ",
                meta: {
                    headerAlign: "left",
                    minWidth: 120,
                    width: 120,
                    maxWidth: 120,
                    align: "left",
                },
                cell: ({ row }) => (
                    <EmployeeStatusBadge status={row.original.status} />
                ),
            },
            {
                id: "actions",
                header: "จัดการ",
                meta: {
                    headerAlign: "center",
                    minWidth: 120,
                    width: 140,
                    maxWidth: 180,
                    align: "center",
                },
                cell: ({ row }) => {
                    const emp = row.original;
                    return (
                        <div className="flex items-center justify-center gap-2">
                            {canView && (
                                <ActionButton
                                    href={`/employee/${emp.id}`}
                                    icon={Eye}
                                    label="ดู"
                                    colorClass="text-blue-600 border-blue-100 hover:bg-blue-50 rounded-md"
                                />
                            )}
                            {canEdit && (
                                <ActionButton
                                    href={`/employee/${emp.id}/edit`}
                                    icon={Edit}
                                    label="แก้ไข"
                                    colorClass="text-purple-600 border-purple-100 hover:bg-purple-50 rounded-md"
                                />
                            )}
                            {canDelete && (
                                <ActionButton
                                    icon={Trash2}
                                    label="ลบ"
                                    colorClass="bg-red-50 text-red-600 hover:bg-red-100 rounded-md"
                                    onClick={() => onDeleteRequest(emp)}
                                />
                            )}
                        </div>
                    );
                },
            },
        ],
        [canDelete, canEdit, canView, onDeleteRequest],
    );
}
