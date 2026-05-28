import React from "react";
import { Eye, Edit, Trash2, Moon } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { TruncatedCell } from "@/components/custom/truncated-cell";
import { ActionButton } from "@/components/custom/action-button";
import { Employee } from "../../types";
import { EmployeeStatusBadge } from "../../ui/employee-status-badge";
import { formatDistanceToNow, differenceInDays } from "date-fns";
import { th } from "date-fns/locale";

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
                accessorKey: "nickname",
                header: "ชื่อเล่น",
                meta: {
                    headerAlign: "left",
                    minWidth: 100,
                    width: 120,
                    maxWidth: 120,
                    align: "left",
                },
                cell: ({ row }) => <TruncatedCell value={row.original.nickname ?? "-"} />,
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
                accessorKey: "lastLogin",
                header: "เข้าใช้งานล่าสุด",
                meta: {
                    headerAlign: "left",
                    minWidth: 160,
                    width: 180,
                    maxWidth: 200,
                    align: "left",
                },
                cell: ({ row }) => {
                    const lastLoginAt = row.original.user?.lastLoginAt;
                    if (!lastLoginAt) return <span className="text-gray-400">-</span>;

                    const loginDate = new Date(lastLoginAt);
                    const daysSinceLogin = differenceInDays(new Date(), loginDate);
                    const isInactive = daysSinceLogin >= 7;

                    return (
                        <div className="flex flex-col gap-1.5 py-1">
                             <span className="text-sm">
                                 {formatDistanceToNow(loginDate, { addSuffix: true, locale: th })}
                             </span>
                             {isInactive && (
                                 <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full w-fit border border-amber-200 shadow-sm transition-all hover:bg-amber-100">
                                     <Moon className="w-3 h-3 fill-amber-600/20" />
                                     <span className="text-xs font-medium">ไม่ออนไลน์ {daysSinceLogin} วัน</span>
                                 </div>
                             )}
                        </div>
                    );
                },
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
