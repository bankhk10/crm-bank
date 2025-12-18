"use client";

import * as React from "react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
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
  onSearchSubmit?: () => void;
  customerTypeFilter?: string;
  onCustomerTypeFilterChange?: (type: string) => void;
  statusFilter?: string;
  onStatusFilterChange?: (status: string) => void;
  pagination: CustomersPagination;
}

// Constants
const ALL_FILTER_VALUE = "__ALL__";
const ALL_STATUS_VALUE = "__ALL_STATUS__";

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

const customerTypeStyle: Record<
  string,
  { label: string; className: string; buttonColor: string }
> = {
  DEALER: {
    label: "ตัวแทนจำหน่าย",
    className:
      "rounded-full bg-blue-100 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-50",
    buttonColor: "bg-blue-600 hover:bg-blue-700",
  },
  SUBDEALER: {
    label: "ตัวแทนจำหน่ายย่อย",
    className:
      "rounded-full bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-50",
    buttonColor: "bg-emerald-600 hover:bg-emerald-700",
  },
  FARMER: {
    label: "เกษตรกร",
    className:
      "rounded-full bg-amber-100 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-50",
    buttonColor: "bg-amber-600 hover:bg-amber-700",
  },
  BROKER: {
    label: "นายหน้า",
    className:
      "rounded-full bg-purple-100 text-purple-700 ring-1 ring-purple-200 dark:bg-purple-900/30 dark:text-purple-50",
    buttonColor: "bg-purple-600 hover:bg-purple-700",
  },
};

const DEFAULT_BADGE_STYLE = {
  label: "ไม่ระบุ",
  className:
    "rounded-full bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-900/40 dark:text-slate-100",
};

// Badge Components
function CustomerStatusBadge({
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
  const key = (type || "").toUpperCase();
  const info = customerTypeStyle[key] ?? DEFAULT_BADGE_STYLE;

  return (
    <Badge variant="outline" className={cn("border-0", info.className)}>
      {info.label}
    </Badge>
  );
}

// Helper Components
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

// Table Columns Hook
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
          const orig = row.original;
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
                className={cn(
                  "h-4 w-4 transition-transform",
                  row.getIsExpanded() ? "rotate-180" : "rotate-0"
                )}
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
        cell: ({ row }) => (
          <TruncatedCell value={row.original.customerCode ?? "-"} />
        ),
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
        cell: ({ row }) => <TruncatedCell value={row.original.name ?? "-"} />,
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
        cell: ({ row }) => <TruncatedCell value={row.original.email ?? "-"} />,
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
        cell: ({ row }) => <TruncatedCell value={row.original.phone ?? "-"} />,
      },
      {
        accessorKey: "customerType",
        header: "ประเภท",
        meta: {
          headerAlign: "left",
          minWidth: 150,
          width: 150,
          maxWidth: 150,
          align: "left",
        },
        cell: ({ row }) => (
          <CustomerTypeBadge type={row.original.customerType} />
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
        cell: ({ row }) => {
          const status = row.original.status?.toUpperCase();
          return status ? (
            <CustomerStatusBadge status={status} className="text-sm" />
          ) : (
            "-"
          );
        },
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
          const customer = row.original;
          return (
            <div className="flex items-center justify-center gap-2">
              <ActionButton
                href={`/customers/${customer.id}`}
                icon={Eye}
                label="ดู"
                colorClass="text-blue-600 border-blue-100 hover:bg-blue-50 rounded-md"
              />
              <ActionButton
                href={`/customers/${customer.id}/edit`}
                icon={Edit}
                label="แก้ไข"
                colorClass="text-purple-600 border-purple-100 hover:bg-purple-50 rounded-md"
              />
              {canDelete && (
                <ActionButton
                  icon={Trash2}
                  label="ลบ"
                  colorClass="bg-red-50 text-red-600 hover:bg-red-100 rounded-md"
                  onClick={() => onDeleteRequest(customer)}
                />
              )}
            </div>
          );
        },
      },
    ],
    [canDelete, onDeleteRequest, data]
  );
}

// Parent Dealer Info Component
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

    const fetchData = async () => {
      setLoading(true);
      try {
        if (dealerId) {
          // Fetch sub-dealers (children)
          const res = await fetch(
            `/api/customers?parentDealerId=${encodeURIComponent(dealerId)}`
          );
          if (!res.ok) throw new Error("Failed to fetch sub-dealers");
          const json = await res.json();
          const list = Array.isArray(json)
            ? json
            : json?.customers ?? json?.data ?? json?.items ?? [];
          if (mounted) setChildren(list);
        } else if (parentDealerId) {
          // Fetch parent dealer
          const res = await fetch(`/api/customers/${parentDealerId}`);
          if (!res.ok) throw new Error("Failed to fetch parent dealer");
          const json = await res.json();
          const p = json?.customer ?? json;
          if (mounted) setParent(p);
        }
      } catch (err: any) {
        if (mounted) setError(err?.message || "Error fetching data");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (dealerId || parentDealerId) {
      fetchData();
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

  // Show parent dealer info
  if (!parentDealerId)
    return <div className="text-sm">ไม่มีข้อมูลร้านหลัก</div>;
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

// Toolbar Component
function CustomersToolbar({
  canCreate,
  searchValue,
  onSearchChange,
  onSearchSubmit,
  customerTypeFilter,
  onCustomerTypeFilterChange,
  statusFilter,
  onStatusFilterChange,
}: Pick<
  CustomersTableProps,
  | "canCreate"
  | "searchValue"
  | "onSearchChange"
  | "onSearchSubmit"
  | "customerTypeFilter"
  | "onCustomerTypeFilterChange"
  | "statusFilter"
  | "onStatusFilterChange"
>) {
  const customerTypes = Object.keys(customerTypeStyle) as Array<
    keyof typeof customerTypeStyle
  >;

  return (
    <div className="rounded-md border bg-background/60 p-4 grid gap-4">
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Search Input */}
        <div className="space-y-2">
          <label className="text-base font-medium mx-2">ค้นหา</label>
          <Input
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearchSubmit?.()}
            placeholder="รหัสลูกค้า, ชื่อ, อีเมล, โทรศัพท์"
            className="mt-2 w-full"
          />
        </div>

        {/* Customer Type Filter */}
        <div className="space-y-2">
          <label className="text-base font-medium mx-2">ประเภทลูกค้า</label>
          <Select
            value={customerTypeFilter || ALL_FILTER_VALUE}
            onValueChange={(v) =>
              onCustomerTypeFilterChange?.(v === ALL_FILTER_VALUE ? "" : v)
            }
          >
            <SelectTrigger className="mt-2 text-base w-full">
              <SelectValue placeholder="ทั้งหมด" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_FILTER_VALUE}>ทั้งหมด</SelectItem>
              {customerTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {customerTypeStyle[type].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div className="space-y-2">
          <label className="text-base font-medium mx-2">สถานะ</label>
          <Select
            value={statusFilter || ALL_STATUS_VALUE}
            onValueChange={(v) =>
              onStatusFilterChange?.(v === ALL_STATUS_VALUE ? "" : v)
            }
          >
            <SelectTrigger className="mt-2 text-base w-full">
              <SelectValue placeholder="ทั้งหมด" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_STATUS_VALUE}>ทั้งหมด</SelectItem>
              {Object.entries(statusStyle).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Create Buttons */}
      <div className="grid gap-4 lg:items-end mt-4">
        <div className="flex flex-wrap gap-2 items-center lg:justify-end">
          {canCreate ? (
            <>
              {customerTypes.map((type) => (
                <Link key={type} href={`/customers/new?type=${type}`}>
                  <Button className={customerTypeStyle[type].buttonColor}>
                    <span className="inline-flex items-center gap-2">
                      <PlusCircle className="h-4 w-4" />
                      {customerTypeStyle[type].label}
                    </span>
                  </Button>
                </Link>
              ))}
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

// Cards Component (Mobile View)
function CustomersCards({
  data,
  loading,
  canDelete,
  onDeleteRequest,
  pagination,
}: Pick<
  CustomersTableProps,
  "data" | "loading" | "canDelete" | "onDeleteRequest" | "pagination"
>) {
  if (loading) {
    return (
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
  }

  if (!data || data.length === 0) {
    return (
      <Card className="border-dashed border-slate-200 bg-slate-50/80 p-6 text-center">
        <div className="mb-2 text-base font-semibold text-slate-900">
          ยังไม่มีลูกค้าในหน้านี้
        </div>
        <p className="text-sm text-slate-600">
          ลองปรับการค้นหาหรือเพิ่มลูกค้าใหม่
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
                {canDelete && (
                  <Button
                    size="sm"
                    variant="destructive"
                    className="bg-red-50 text-red-700 hover:bg-red-100"
                    onClick={() => onDeleteRequest(customer)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> ลบ
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Pagination */}
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
                {perPageOptions.map((opt) => (
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

// Main Table Component
export function CustomersTable(props: CustomersTableProps) {
  const {
    data,
    loading,
    canCreate,
    canDelete,
    onDeleteRequest,
    searchValue,
    onSearchChange,
    onSearchSubmit,
    customerTypeFilter,
    onCustomerTypeFilterChange,
    statusFilter,
    onStatusFilterChange,
    pagination,
  } = props;

  const columns = useCustomerColumns(onDeleteRequest, canDelete, data);

  const toolbarProps = {
    canCreate,
    searchValue,
    onSearchChange,
    onSearchSubmit,
    customerTypeFilter,
    onCustomerTypeFilterChange,
    statusFilter,
    onStatusFilterChange,
  };

  return (
    <div className="space-y-6">
      {/* Mobile & Tablet: card layout */}
      <div className="xl:hidden space-y-4">
        <CustomersToolbar {...toolbarProps} />
        <CustomersCards
          data={data}
          loading={loading}
          canDelete={canDelete}
          onDeleteRequest={onDeleteRequest}
          pagination={pagination}
        />
      </div>

      {/* Desktop & up: table layout */}
      <div className="hidden xl:block">
        <CustomTable
          columns={columns}
          data={data}
          loading={loading}
          pagination={pagination}
          toolbar={<CustomersToolbar {...toolbarProps} />}
          emptyState={{
            title: "ยังไม่มีลูกค้า",
            description: "ลองปรับเงื่อนไขการค้นหา หรือสร้างลูกค้าใหม่",
          }}
          className="w-full"
          renderSubComponent={({ row }) => {
            const customer = row.original;
            return (
              <div className="p-4 bg-slate-50">
                <ParentDealerInfo
                  parentDealerId={customer.parentDealerId}
                  dealerId={customer.parentDealerId ? undefined : customer.id}
                />
              </div>
            );
          }}
        />
      </div>
    </div>
  );
}
