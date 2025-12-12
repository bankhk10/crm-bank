"use client";

import * as React from "react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import type { DateRange } from "react-day-picker";
import {
  Eye,
  Edit,
  Trash2,
  PlusCircle,
  ChevronDown,
  Mail,
  Phone,
  UserRound,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
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

export type CustomerRecord = {
  id: string;
  customerCode: string;
  customerType: "DEALER" | "SUBDEALER" | "FARMER" | "BROKER";
  name: string;
  email?: string;
  phone?: string;
  status?: string;
  createdAt?: string;
  parentDealerId?: string | null;
};

export type CustomersPagination = {
  page: number;
  perPage: number;
  total: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  perPageOptions?: number[];
};

export interface CustomersTableProps {
  data: CustomerRecord[];
  loading?: boolean;
  canCreate: boolean;
  canDelete: boolean;
  onDeleteRequest: (customer: CustomerRecord) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  isTyping?: boolean;
  onSearchSubmit?: () => void;
  dateRange?: DateRange;
  onDateRangeChange: (range: DateRange | undefined) => void;
  customerTypeFilter?: string;
  onCustomerTypeFilterChange?: (type: string) => void;
  statusFilter?: string;
  onStatusFilterChange?: (status: string) => void;
  pagination: CustomersPagination;
}

const customerTypeMap: Record<string, string> = {
  DEALER: "ตัวแทนจำหน่าย",
  SUBDEALER: "ตัวแทนจำหน่ายย่อย",
  FARMER: "เกษตรกร",
  BROKER: "นายหน้า",
};

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

function CustomerStatusBadge({
  status,
  className,
}: {
  status?: string;
  className?: string;
}) {
  const key = (status || "").toUpperCase();
  const info = statusStyle[key] ?? {
    label: key || "ไม่ระบุ",
    className:
      "bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-900/40 dark:text-slate-100",
    dot: "bg-slate-400",
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

function CustomerTypeBadge({ type }: { type?: string }) {
  const label = customerTypeMap[type ?? ""] || "ไม่ระบุ";
  return (
    <Badge
      variant="outline"
      className="rounded-full border-slate-200 bg-slate-50 text-slate-700"
    >
      {label}
    </Badge>
  );
}

function useCustomerColumns(
  onDeleteRequest: (customer: CustomerRecord) => void,
  canDelete: boolean,
  data: CustomerRecord[] | undefined
) {
  return React.useMemo<ColumnDef<CustomerRecord>[]>(
    () => [
      {
        id: "expander",
        header: "",
        meta: {
          width: 36,
          minWidth: 36,
          maxWidth: 36,
          align: "center",
          headerAlign: "center",
        },
        cell: ({ row }) => {
          const orig = row.original as CustomerRecord;
          const hasChildren =
            !!data && data.some((d) => d.parentDealerId === orig.id);
          const showExpander = hasChildren || !!orig.parentDealerId;

          if (!showExpander) return <div className="p-1" />;

          return (
            <button
              type="button"
              onClick={() => row.toggleExpanded?.()}
              aria-label={row.getIsExpanded() ? "ย่อ" : "ขยาย"}
              className="p-1 rounded hover:bg-slate-100"
            >
              <ChevronDown
                className={`h-4 w-4 transition-transform ${row.getIsExpanded() ? "rotate-180" : "rotate-0"
                  }`}
              />
            </button>
          );
        },
      },
      {
        accessorKey: "customerCode",
        header: "รหัสลูกค้า",
        meta: {
          headerAlign: "left",
          minWidth: 100,
          width: 130,
          maxWidth: 130,
          align: "left",
        },
        cell: ({ row }) => row.original.customerCode ?? "-",
      },
      {
        accessorKey: "name",
        header: "ชื่อลูกค้า",
        meta: {
          headerAlign: "left",
          minWidth: 180,
          width: 250,
          maxWidth: 250,
          align: "left",
        },
        cell: ({ row }) => row.original.name ?? "-",
      },

      {
        accessorKey: "email",
        header: "อีเมล",
        meta: {
          headerAlign: "left",
          minWidth: 160,
          width: 160,
          maxWidth: 160,
          align: "left",
        },
        cell: ({ row }) => row.original.email ?? "-",
      },
      {
        accessorKey: "phone",
        header: "โทรศัพท์",
        meta: {
          headerAlign: "left",
          minWidth: 120,
          width: 120,
          maxWidth: 120,
          align: "left",
        },
        cell: ({ row }) => row.original.phone ?? "-",
      },
      {
        accessorKey: "customerType",
        header: "ประเภท",
        meta: {
          headerAlign: "center",
          minWidth: 130,
          width: 130,
          maxWidth: 130,
          align: "center",
        },
        cell: ({ row }) => row.original.customerType ?? "-",
      },
      {
        accessorKey: "status",
        header: "สถานะ",
        meta: {
          headerAlign: "center",
          minWidth: 120,
          width: 120,
          maxWidth: 120,
          align: "center",
        },
        cell: ({ row }) => {
          const s = (row.original.status || "").toString().toUpperCase();
          if (!s) return "-";

          return <CustomerStatusBadge status={s} className="text-sm" />;
        },
      },

      {
        id: "actions",
        header: "",
        meta: {
          headerAlign: "right",
          minWidth: 120,
          width: 140,
          maxWidth: 180,
          align: "right",
        },
        cell: ({ row }) => {
          const customer = row.original;
          return (
            <div className="flex items-center justify-end gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    asChild
                    size="icon-sm"
                    variant="outline"
                    className="text-blue-600 border-blue-100 hover:bg-blue-50 rounded-md"
                    aria-label={`ดู ${customer.name}`}
                  >
                    <Link href={`/customers/${customer.id}`}>
                      <Eye className="size-4 text-blue-600" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  ดู {customer.name}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    asChild
                    size="icon-sm"
                    variant="outline"
                    className="text-purple-600 border-purple-100 hover:bg-purple-50 rounded-md"
                    aria-label={`แก้ไข ${customer.name}`}
                  >
                    <Link href={`/customers/${customer.id}/edit`}>
                      <Edit className="size-4 text-purple-600" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  แก้ไข {customer.name}
                </TooltipContent>
              </Tooltip>

              {canDelete && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="destructive"
                      size="icon-sm"
                      className="bg-red-50 text-red-600 hover:bg-red-100 rounded-md"
                      onClick={() => onDeleteRequest(customer)}
                      aria-label={`ลบ ${customer.name}`}
                    >
                      <Trash2 className="size-4 text-red-600" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    ลบ {customer.name}
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          );
        },
      },
    ],
    [canDelete, onDeleteRequest]
  );
}

function ParentDealerInfo({
  parentDealerId,
  dealerId,
}: {
  parentDealerId?: string | null;
  dealerId?: string | null;
}) {
  const [parent, setParent] = React.useState<CustomerRecord | null>(null);
  const [children, setChildren] = React.useState<CustomerRecord[] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    setError(null);
    // If dealerId is provided (meaning this row is a main dealer), fetch its sub-dealers (children)
    if (dealerId) {
      setLoading(true);
      fetch(`/api/customers?parentDealerId=${encodeURIComponent(dealerId)}`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch sub-dealers");
          return res.json();
        })
        .then((json) => {
          if (!mounted) return;
          // API returns { customers: [...] } or directly an array
          const list = Array.isArray(json)
            ? json
            : json?.customers ?? json?.data ?? json?.items ?? [];
          setChildren(list as CustomerRecord[]);
        })
        .catch((err) => {
          if (!mounted) return;
          setError(err?.message || "Error fetching sub-dealers");
        })
        .finally(() => {
          if (!mounted) return;
          setLoading(false);
        });
      return () => {
        mounted = false;
      };
    }

    // Otherwise, if there is a parentDealerId, fetch the parent dealer
    if (parentDealerId) {
      setLoading(true);
      fetch(`/api/customers/${parentDealerId}`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch parent dealer");
          return res.json();
        })
        .then((json) => {
          if (!mounted) return;
          // API returns { customer: {...} }
          const p = json?.customer ?? (json as any);
          setParent(p as CustomerRecord);
        })
        .catch((err) => {
          if (!mounted) return;
          setError(err?.message || "Error fetching parent dealer");
        })
        .finally(() => {
          if (!mounted) return;
          setLoading(false);
        });
    }

    return () => {
      mounted = false;
    };
  }, [parentDealerId, dealerId]);

  if (loading) return <div className="text-sm">กำลังโหลดข้อมูล...</div>;
  if (error)
    return (
      <div className="text-sm text-red-600">ไม่สามารถโหลดข้อมูล: {error}</div>
    );

  // Show children when dealerId present (main dealer)
  if (dealerId) {
    if (!children || children.length === 0) {
      return <div className="text-sm">ยังไม่มีร้านรองภายใต้ร้านหลักนี้</div>;
    }

    return (
      <div className="space-y-3">
        {children.map((child) => (
          <div
            key={child.id}
            className="flex items-center justify-between rounded-md border p-3 bg-white"
          >
            <div className="flex items-center gap-4">
              <div className="font-medium">{child.name ?? "-"}</div>
              <div className="text-sm text-muted-foreground">
                {child.email ?? "-"}
              </div>
              <div className="text-sm text-muted-foreground">
                {child.phone ?? "-"}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/customers/${child.id}`}>
                <Button size="icon-sm" variant="outline">
                  <Eye className="size-4" />
                </Button>
              </Link>
              <Link href={`/customers/${child.id}/edit`}>
                <Button size="icon-sm" variant="outline">
                  <Edit className="size-4" />
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Otherwise show parent dealer info
  if (!parentDealerId) {
    return <div className="text-sm">ไม่มีข้อมูลร้านหลัก</div>;
  }
  if (!parent) return <div className="text-sm">ไม่พบข้อมูลร้านหลัก</div>;

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      <div>
        <div className="text-xs text-muted-foreground">ร้านหลัก</div>
        <div className="font-medium">{parent.name ?? "-"}</div>
      </div>
      <div>
        <div className="text-xs text-muted-foreground">อีเมล</div>
        <div className="font-medium">{parent.email ?? "-"}</div>
      </div>
      <div>
        <div className="text-xs text-muted-foreground">โทร</div>
        <div className="font-medium">{parent.phone ?? "-"}</div>
      </div>
    </div>
  );
}

function CustomersToolbar(
  props: Pick<
    CustomersTableProps,
    | "canCreate"
    | "searchValue"
    | "onSearchChange"
    | "isTyping"
    | "onSearchSubmit"
    | "dateRange"
    | "onDateRangeChange"
    | "customerTypeFilter"
    | "onCustomerTypeFilterChange"
    | "statusFilter"
    | "onStatusFilterChange"
  >
) {
  const {
    canCreate,
    searchValue,
    onSearchChange,
    isTyping,
    onSearchSubmit,
    dateRange,
    onDateRangeChange,
    customerTypeFilter,
    onCustomerTypeFilterChange,
    statusFilter,
    onStatusFilterChange,
  } = props;

  return (
    <div className="rounded-md border bg-background/60 p-4 grid gap-4">
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-2">
          <label className="text-sm font-medium mx-2">ค้นหาลูกค้า</label>
          <Input
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") onSearchSubmit?.();
            }}
            placeholder="ค้นหารหัส, ชื่อ, อีเมล, โทรศัพท์"
            className="mt-1 text-base h-11 w-full"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium mx-2">ประเภทลูกค้า</label>
          {(() => {
            const ALL_VALUE = "__ALL__";
            return (
              <Select
                value={customerTypeFilter ? customerTypeFilter : ALL_VALUE}
                onValueChange={(v) =>
                  onCustomerTypeFilterChange?.(v === ALL_VALUE ? "" : v)
                }
              >
                <SelectTrigger className="mt-1 text-base w-full">
                  <SelectValue placeholder="ทั้งหมด" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>ทั้งหมด</SelectItem>
                  <SelectItem value="DEALER">DEALER</SelectItem>
                  <SelectItem value="SUBDEALER">SUBDEALER</SelectItem>
                  <SelectItem value="FARMER">FARMER</SelectItem>
                  <SelectItem value="BROKER">BROKER</SelectItem>
                </SelectContent>
              </Select>
            );
          })()}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium mx-2">สถานะ</label>
          {(() => {
            const ALL_STATUS = "__ALL_STATUS__";
            return (
              <Select
                value={statusFilter ? statusFilter : ALL_STATUS}
                onValueChange={(v) =>
                  onStatusFilterChange?.(v === ALL_STATUS ? "" : v)
                }
              >
                <SelectTrigger className="mt-1 text-base !h-11 w-full">
                  <SelectValue placeholder="ทั้งหมด" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_STATUS}>ทั้งหมด</SelectItem>
                  <SelectItem value="ACTIVE">ใช้งาน</SelectItem>
                  <SelectItem value="INACTIVE">ไม่ได้ใช้งาน</SelectItem>
                  <SelectItem value="SUSPENDED">ระงับ</SelectItem>
                </SelectContent>
              </Select>
            );
          })()}
        </div>
      </div>

      <div className="grid gap-4 lg:items-end mt-4">
        <div className="flex flex-wrap gap-2 items-center lg:justify-end">
          {canCreate ? (
            <>
              <Link href="/customers/new?type=DEALER">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <span className="inline-flex items-center gap-2">
                    <PlusCircle className="h-4 w-4" />
                    เพิ่ม DEALER
                  </span>
                </Button>
              </Link>

              <Link href="/customers/new?type=SUBDEALER">
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  <span className="inline-flex items-center gap-2">
                    <PlusCircle className="h-4 w-4" />
                    เพิ่ม SUBDEALER
                  </span>
                </Button>
              </Link>

              <Link href="/customers/new?type=FARMER">
                <Button className="bg-amber-600 hover:bg-amber-700">
                  <span className="inline-flex items-center gap-2">
                    <PlusCircle className="h-4 w-4" />
                    เพิ่ม FARMER
                  </span>
                </Button>
              </Link>

              <Link href="/customers/new?type=BROKER">
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <span className="inline-flex items-center gap-2">
                    <PlusCircle className="h-4 w-4" />
                    เพิ่ม BROKER
                  </span>
                </Button>
              </Link>
            </>
          ) : (
            <Button className="w-full lg:w-auto" variant="outline" disabled>
              <span className="inline-flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                สร้างลูกค้า
              </span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function CustomersCards(
  props: Pick<
    CustomersTableProps,
    | "data"
    | "loading"
    | "canDelete"
    | "onDeleteRequest"
    | "canCreate"
    | "pagination"
  >
) {
  const { data, loading, canDelete, onDeleteRequest, canCreate, pagination } =
    props;

  const skeleton = (
    <div className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: 4 }).map((_, idx) => (
        <Card
          key={`loading-${idx}`}
          className="h-full border border-slate-200/80 shadow-sm"
        >
          <div className="h-1 w-full bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100" />
          <div className="space-y-3 p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );

  if (loading) return skeleton;

  const hasData = data && data.length > 0;
  if (!hasData) {
    return (
      <Card className="border-dashed border-slate-200 bg-slate-50/80 p-6 text-center text-sm text-slate-600">
        <div className="mb-2 text-base font-semibold text-slate-900">
          ยังไม่มีลูกค้าในหน้านี้
        </div>
        <p className="mb-4 text-sm text-slate-600">
          ลองปรับการค้นหาหรือเพิ่มลูกค้าใหม่
        </p>
        {canCreate ? (
          <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700">
            <Link href="/customers/new">สร้างลูกค้าใหม่</Link>
          </Button>
        ) : null}
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
  const totalPages = Math.max(1, Math.ceil((total || 0) / perPage));
  const startDisplay = (page - 1) * perPage + 1;
  const endDisplay = (page - 1) * perPage + data.length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {data.map((customer) => (
          <Card
            key={customer.id}
            className="group relative overflow-hidden border border-slate-200/80 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-500 via-gray-500 to-gray-400" />
            <div className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                    <UserRound className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="text-base font-semibold text-slate-900 line-clamp-1">
                      {customer.name || "-"}
                    </div>
                    <div className="text-xs text-slate-500">
                      {customer.customerCode || "-"}
                    </div>
                  </div>
                </div>
                <CustomerStatusBadge status={customer.status} />
              </div>

              <div className="flex flex-wrap gap-2">
                <CustomerTypeBadge type={customer.customerType} />
                {customer.parentDealerId ? (
                  <Badge className="rounded-full bg-purple-50 text-purple-700 ring-1 ring-purple-100">
                    ร้านรอง
                  </Badge>
                ) : (
                  <Badge className="rounded-full bg-amber-50 text-amber-700 ring-1 ring-amber-100">
                    ร้านหลัก
                  </Badge>
                )}
              </div>

              <div className="space-y-2 text-sm text-slate-700">
                <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span className="line-clamp-1">{customer.email || "-"}</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <span className="line-clamp-1">{customer.phone || "-"}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="border-blue-100 text-blue-700 hover:bg-blue-50"
                >
                  <Link href={`/customers/${customer.id}`}>
                    <Eye className="mr-2 h-4 w-4" /> ดูรายละเอียด
                  </Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="border-indigo-100 text-indigo-700 hover:bg-indigo-50"
                >
                  <Link href={`/customers/${customer.id}/edit`}>
                    <Edit className="mr-2 h-4 w-4" /> แก้ไข
                  </Link>
                </Button>
                {canDelete ? (
                  <Button
                    size="sm"
                    variant="destructive"
                    className="bg-red-50 text-red-700 hover:bg-red-100"
                    onClick={() => onDeleteRequest(customer)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> ลบ
                  </Button>
                ) : null}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white/80 p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs font-medium text-slate-600">
          แสดง {startDisplay}-{endDisplay} จาก {total}
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:justify-end">
          {perPageOptions && perPageOptions.length ? (
            <Select
              value={String(perPage)}
              onValueChange={(v) => {
                onPerPageChange(Number(v));
              }}
            >
              <SelectTrigger className="h-9 w-[70px] text-sm">
                <SelectValue placeholder="ต่อหน้า" />
              </SelectTrigger>
              <SelectContent align="end">
                {perPageOptions.map((opt) => (
                  <SelectItem key={opt} value={String(opt)}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}

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

export function CustomersTable(props: CustomersTableProps) {
  const {
    data,
    loading,
    canCreate,
    canDelete,
    onDeleteRequest,
    searchValue,
    onSearchChange,
    dateRange,
    onDateRangeChange,
    customerTypeFilter,
    onCustomerTypeFilterChange,
    statusFilter,
    onStatusFilterChange,
    pagination,
  } = props;

  const columns = useCustomerColumns(onDeleteRequest, canDelete, data);
  return (
    <div className="space-y-6">
      {/* Mobile & Tablet: card layout */}
      <div className="xl:hidden space-y-4">
        <CustomersToolbar
          canCreate={canCreate}
          searchValue={searchValue}
          onSearchChange={onSearchChange}
          dateRange={dateRange}
          onDateRangeChange={onDateRangeChange}
          customerTypeFilter={customerTypeFilter}
          onCustomerTypeFilterChange={onCustomerTypeFilterChange}
          statusFilter={statusFilter}
          onStatusFilterChange={onStatusFilterChange}
        />

        <CustomersCards
          data={data}
          loading={loading}
          canCreate={canCreate}
          canDelete={canDelete}
          onDeleteRequest={onDeleteRequest}
          pagination={pagination}
        />
      </div>

      {/* Desktop & up: original table */}
      <div className="hidden xl:block">
        <CustomTable
          columns={columns}
          data={data}
          loading={loading}
          pagination={pagination}
          toolbar={
            <CustomersToolbar
              canCreate={canCreate}
              searchValue={searchValue}
              onSearchChange={onSearchChange}
              dateRange={dateRange}
              onDateRangeChange={onDateRangeChange}
              customerTypeFilter={customerTypeFilter}
              onCustomerTypeFilterChange={onCustomerTypeFilterChange}
              statusFilter={statusFilter}
              onStatusFilterChange={onStatusFilterChange}
            />
          }
          emptyState={{
            title: "ยังไม่มีลูกค้า",
            description: "ลองปรับเงื่อนไขการค้นหา หรือสร้างลูกค้าใหม่",
          }}
          className="w-full"
          renderSubComponent={({ row }) => {
            const c = row.original as CustomerRecord;
            return (
              <div className="p-4 bg-slate-50">
                <ParentDealerInfo
                  parentDealerId={c.parentDealerId}
                  dealerId={c.parentDealerId ? undefined : c.id}
                />
              </div>
            );
          }}
        />
      </div>
    </div>
  );
}
