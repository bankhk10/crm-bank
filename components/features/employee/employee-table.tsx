"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import {
  Eye,
  Edit,
  Trash2,
  PlusCircle,
  Search,
  Mail,
  Phone,
  UserRound,
  Building,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import CustomTable from "@/components/custom/custom-table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { usePermission } from "@/hooks/use-permission";
import type { Employee } from "@/types/Employee";

// Constants
const statusStyle: Record<
  string,
  { label: string; className: string; dot: string }
> = {
  ACTIVE: {
    label: "ใช้งาน",
    className:
      "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-50",
    dot: "bg-emerald-500",
  },
  INACTIVE: {
    label: "ไม่ได้ใช้งาน",
    className:
      "bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-900/40 dark:text-slate-100",
    dot: "bg-slate-400",
  },
  SUSPENDED: {
    label: "ระงับ",
    className:
      "bg-orange-50 text-orange-700 ring-1 ring-orange-100 dark:bg-orange-900/30 dark:text-orange-50",
    dot: "bg-orange-500",
  },
};

const DEFAULT_BADGE_STYLE = {
  label: "ไม่ระบุ",
  className:
    "rounded-full bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-900/40 dark:text-slate-100",
  dot: "bg-slate-400",
};

// --- Badge Components ---

function EmployeeStatusBadge({
  status,
  className,
}: {
  status?: string;
  className?: string;
}) {
  const key = (status || "").toUpperCase();
  const info = statusStyle[key] ?? {
    ...DEFAULT_BADGE_STYLE,
    label: key || "ไม่ระบุ",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium",
        info.className,
        className
      )}
    >
      <span className={cn("h-2 w-2 rounded-full", info.dot)} aria-hidden />
      {info.label}
    </span>
  );
}

// --- Helper Components ---

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

// --- Columns Hook ---

function useEmployeeColumns(
  onDeleteRequest: (employee: Employee) => void,
  canDelete: boolean,
  canEdit: boolean,
  canView: boolean
) {
  return React.useMemo<ColumnDef<Employee>[]>(
    () => [
      {
        accessorKey: "employeeCode",
        header: "รหัสพนักงาน",
        meta: {
          headerAlign: "left",
          minWidth: 100,
          width: 130,
          maxWidth: 130,
          align: "left",
        },
        cell: ({ row }) => {
          // Mock code generation if missing
          const code =
            (row.original as any).employeeCode ||
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
              (row.original as any).position?.name ??
              (row.original as any).positionId ??
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
          <EmployeeStatusBadge status={(row.original as any).status} />
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
    [canDelete, canEdit, canView, onDeleteRequest]
  );
}

// --- Toolbar Component ---

function EmployeeToolbar({
  canCreate,
  searchValue,
  onSearchChange,
  permissionHint,
}: {
  canCreate: boolean;
  searchValue: string;
  onSearchChange: (val: string) => void;
  permissionHint?: string;
}) {
  return (
    <div className="rounded-md border bg-background/60 p-4 grid gap-4 lg:flex lg:justify-between lg:items-center">
      <div className="relative w-full max-w-md">
        <label className="sr-only">ค้นหาพนักงาน</label>
        <Input
          placeholder="ค้นหาชื่อ, อีเมล, รหัสพนักงาน..."
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 w-full"
        />
        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
          <Search className="h-4 w-4 text-slate-400" />
        </span>
      </div>

      <div className="flex items-center gap-2">
        {canCreate ? (
          <Link href="/employee/new" className="w-full lg:w-auto">
            <Button className="w-full lg:w-auto bg-blue-600 hover:bg-blue-700">
              <span className="inline-flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                เพิ่มพนักงาน
              </span>
            </Button>
          </Link>
        ) : (
          <div className="w-full lg:w-auto" title={permissionHint}>
            <Button className="w-full" variant="outline" disabled>
              <span className="inline-flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                เพิ่มพนักงาน
              </span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Card View (Mobile) ---

function EmployeeCards({
  data,
  loading,
  canDelete,
  canEdit,
  canView,
  onDeleteRequest,
  pagination,
}: {
  data: Employee[];
  loading: boolean;
  canDelete: boolean;
  canEdit: boolean;
  canView: boolean;
  onDeleteRequest: (emp: Employee) => void;
  pagination: any;
}) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, idx) => (
          <Card
            key={`loading-${idx}`}
            className="h-full border border-slate-200/80 shadow-sm p-4 space-y-3"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-4 w-full" />
          </Card>
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="border-dashed border-slate-200 bg-slate-50/80 p-6 text-center">
        <div className="mb-2 text-base font-semibold text-slate-900">
          ไม่พบข้อมูลพนักงาน
        </div>
        <p className="text-sm text-slate-600">
          ลองปรับการค้นหาหรือเพิ่มพนักงานใหม่
        </p>
      </Card>
    );
  }

  const {
    page,
    perPage,
    total,
    onPageChange,
    onPerPageChange,
    perPageOptions,
  } = pagination;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const startDisplay = (page - 1) * perPage + 1;
  const endDisplay = Math.min((page - 1) * perPage + perPage, total);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((emp) => (
          <Card
            key={emp.id}
            className="group relative overflow-hidden border border-slate-200/80 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
            <div className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-600 ring-1 ring-slate-200">
                    <UserRound className="h-6 w-6" />
                  </span>
                  <div>
                    <div className="text-base font-semibold text-slate-900 line-clamp-1">
                      {emp.name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {(emp as any).position?.name ?? "ไม่ระบุตำแหน่ง"}
                    </div>
                  </div>
                </div>
                <EmployeeStatusBadge status={(emp as any).status} />
              </div>

              <div className="space-y-2 text-sm text-slate-700 pt-2">
                {emp.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <span className="truncate">{emp.email}</span>
                  </div>
                )}
                {emp.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <span>{emp.phone}</span>
                  </div>
                )}
                {(emp as any).company && (
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-slate-400" />
                    <span className="truncate">
                      {(emp as any).company?.name}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 pt-3 border-t mt-3">
                {canView && (
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="flex-1 border-blue-100 text-blue-700 hover:bg-blue-50"
                  >
                    <Link href={`/employee/${emp.id}`}>
                      <Eye className="mr-2 h-4 w-4" /> ดู
                    </Link>
                  </Button>
                )}
                {canEdit && (
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="flex-1 border-purple-100 text-purple-700 hover:bg-purple-50"
                  >
                    <Link href={`/employee/${emp.id}/edit`}>
                      <Edit className="mr-2 h-4 w-4" /> แก้ไข
                    </Link>
                  </Button>
                )}
                {canDelete && (
                  <Button
                    size="sm"
                    variant="destructive"
                    className="flex-none bg-red-50 text-red-700 hover:bg-red-100"
                    onClick={() => onDeleteRequest(emp)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white/80 p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs font-medium text-slate-600">
          แสดง {startDisplay}-{endDisplay} จาก {total}
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:justify-end">
          {perPageOptions && perPageOptions.length > 0 && (
            <Select
              value={String(perPage)}
              onValueChange={(v) => onPerPageChange(Number(v))}
            >
              <SelectTrigger className="h-9 w-[70px] text-sm">
                <SelectValue placeholder="ต่อหน้า" />
              </SelectTrigger>
              <SelectContent align="end">
                {perPageOptions.map((opt: number) => (
                  <SelectItem key={opt} value={String(opt)}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <div className="inline-flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="text-slate-700"
              disabled={page <= 1}
              onClick={() => onPageChange(Math.max(1, page - 1))}
            >
              ก่อนหน้า
            </Button>
            <span className="text-xs text-slate-500">
              หน้า {page} / {totalPages}
            </span>
            <Button
              size="sm"
              variant="ghost"
              className="text-slate-700"
              disabled={page >= totalPages}
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            >
              ถัดไป
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Main Component ---

type EmployeesGridProps = {
  employees?: Employee[];
};

export default function EmployeesGrid({ employees }: EmployeesGridProps) {
  const router = useRouter();
  const { allowed, isLoading, hasPermission } = usePermission("menu.employees");

  const permissionHint =
    "จำเป็นต้องมีสิทธิ์ employee.manage เพื่อเพิ่มพนักงานใหม่";
  const canCreate =
    !isLoading &&
    (hasPermission("employee.manage") || hasPermission("employee.create"));
  const canEdit =
    hasPermission("employee.manage") || hasPermission("employee.edit");
  const canDelete =
    hasPermission("employee.manage") || hasPermission("employee.delete");
  const canView =
    hasPermission("menu.employees") || hasPermission("employee.view");

  const [query, setQuery] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(10);
  const [deleteTarget, setDeleteTarget] = React.useState<Employee | null>(null);

  const [fetched, setFetched] = React.useState<Employee[] | null>(null);
  const [fetchLoading, setFetchLoading] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (employees && employees.length > 0) return;
      setFetchLoading(true);
      try {
        const res = await fetch(`/api/employee`, { method: "GET" });
        if (res.ok) {
          const json = await res.json();
          if (mounted) setFetched(json.employees ?? []);
        }
      } catch (err) {
        // ignore
      } finally {
        if (mounted) setFetchLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [employees]);

  const rawData: Employee[] =
    employees && employees.length > 0 ? employees : fetched ?? [];

  // Filter logic
  const filteredData = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rawData;
    return rawData.filter((e) =>
      [e.name, e.email, (e as any).employeeCode, (e as any).phone]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [rawData, query]);

  // Pagination logic
  const totalItems = filteredData.length;
  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredData.slice(start, start + perPage);
  }, [filteredData, currentPage, perPage]);

  // Handle Delete
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/employee/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDeleteTarget(null);
        router.refresh();
        // Force re-fetch if using client-side fetched data
        if (!employees) {
          const reloadRes = await fetch(`/api/employee`, { method: "GET" });
          if (reloadRes.ok) {
            const json = await reloadRes.json();
            setFetched(json.employees ?? []);
          }
        }
      }
    } catch (err) {
      console.error(err);
      setDeleteTarget(null);
    }
  };

  const paginationInfo = {
    page: currentPage,
    perPage: perPage,
    total: totalItems,
    onPageChange: setCurrentPage,
    onPerPageChange: (n: number) => {
      setPerPage(n);
      setCurrentPage(1);
    },
    perPageOptions: [5, 10, 20, 50],
  };

  const columns = useEmployeeColumns(
    (emp) => setDeleteTarget(emp),
    canDelete,
    canEdit,
    canView
  );

  if (isLoading)
    return (
      <div className="p-8 text-center text-slate-500">กรุณารอสักครู่...</div>
    );

  if (!allowed) {
    return (
      <Card className="p-8 text-center">
        <div className="text-red-600 font-semibold text-lg">
          คุณไม่มีสิทธิ์เข้าถึงหน้านี้
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mobile Layout */}
      <div className="xl:hidden space-y-4">
        <EmployeeToolbar
          canCreate={canCreate}
          searchValue={query}
          onSearchChange={(v) => {
            setQuery(v);
            setCurrentPage(1);
          }}
          permissionHint={permissionHint}
        />
        <EmployeeCards
          data={paginatedData}
          loading={fetchLoading}
          canDelete={canDelete}
          canEdit={canEdit}
          canView={canView}
          onDeleteRequest={(emp) => setDeleteTarget(emp)}
          pagination={paginationInfo}
        />
      </div>

      {/* Desktop Layout */}
      <div className="hidden xl:block">
        <CustomTable
          columns={columns}
          data={paginatedData}
          loading={fetchLoading}
          pagination={paginationInfo}
          toolbar={
            <EmployeeToolbar
              canCreate={canCreate}
              searchValue={query}
              onSearchChange={(v) => {
                setQuery(v);
                setCurrentPage(1);
              }}
              permissionHint={permissionHint}
            />
          }
          emptyState={{
            title: "ไม่พบข้อมูลพนักงาน",
            description: "ลองปรับคำค้นหา หรือเพิ่มพนักงานใหม่",
          }}
          className="w-full"
        />
      </div>

      {/* Delete Dialog */}
      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-[420px] rounded-lg border-0 shadow-2xl">
          <DialogTitle className="text-xl font-bold text-red-600 flex items-center gap-2">
            <Trash2 className="h-5 w-5" /> ลบพนักงาน
          </DialogTitle>
          <DialogDescription className="text-base text-slate-600">
            คุณต้องการลบพนักงาน <b>{deleteTarget?.name}</b> ใช่หรือไม่? <br />
            การกระทำนี้ไม่สามารถย้อนกลับได้
          </DialogDescription>
          <DialogFooter className="mt-6 gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              className="rounded-full"
            >
              ยกเลิก
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="rounded-full bg-red-600 hover:bg-red-700"
            >
              ยืนยันการลบ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
