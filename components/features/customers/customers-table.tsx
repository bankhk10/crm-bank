"use client";

import * as React from "react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import type { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Eye, Edit, Trash2, PlusCircle, ChevronDown } from "lucide-react";
import Tooltip from "@/components/ui/tooltip";
import CustomTable from "@/components/custom/custom-table";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Input } from "@/components/ui/input";
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
          const hasChildren = !!data && data.some((d) => d.parentDealerId === orig.id);
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
                className={`h-4 w-4 transition-transform ${row.getIsExpanded() ? "rotate-180" : "rotate-0"}`}
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
          minWidth: 120,
          width: 150,
          maxWidth: 180,
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
          maxWidth: 400,
          align: "left",
        },
        cell: ({ row }) => row.original.name ?? "-",
      },
      {
        accessorKey: "customerType",
        header: "ประเภท",
        meta: {
          headerAlign: "center",
          minWidth: 140,
          width: 160,
          maxWidth: 200,
          align: "center",
        },
        cell: ({ row }) => {
          const type = row.original.customerType;
          return customerTypeMap[type] || type || "-";
        },
      },
      {
        accessorKey: "email",
        header: "อีเมล",
        meta: {
          headerAlign: "left",
          minWidth: 160,
          width: 220,
          maxWidth: 320,
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
          width: 140,
          maxWidth: 180,
          align: "left",
        },
        cell: ({ row }) => row.original.phone ?? "-",
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
          const map: Record<string, { label: string; className: string }> = {
            ACTIVE: {
              label: "ใช้งาน",
              className: "bg-emerald-100 text-emerald-800",
            },
            INACTIVE: {
              label: "ไม่ได้ใช้งาน",
              className: "bg-gray-100 text-gray-800",
            },
            SUSPENDED: {
              label: "ระงับ",
              className: "bg-orange-100 text-orange-800",
            },
          };
          const info = map[s] ?? {
            label: s || "-",
            className: "bg-gray-100 text-gray-800",
          };

          if (!s) return "-";

          return (
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${info.className}`}
            >
              {info.label}
            </span>
          );
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
              <Tooltip content={`ดู ${customer.name}`} side="top">
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
              </Tooltip>

              <Tooltip content={`แก้ไข ${customer.name}`} side="top">
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
              </Tooltip>

              {canDelete && (
                <Tooltip content={`ลบ ${customer.name}`} side="top">
                  <Button
                    variant="destructive"
                    size="icon-sm"
                    className="bg-red-50 text-red-600 hover:bg-red-100 rounded-md"
                    onClick={() => onDeleteRequest(customer)}
                    aria-label={`ลบ ${customer.name}`}
                  >
                    <Trash2 className="size-4 text-red-600" />
                  </Button>
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

function ParentDealerInfo({ parentDealerId, dealerId }: { parentDealerId?: string | null; dealerId?: string | null }) {
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
  if (error) return <div className="text-sm text-red-600">ไม่สามารถโหลดข้อมูล: {error}</div>;

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
              <div className="text-sm text-muted-foreground">{child.email ?? "-"}</div>
              <div className="text-sm text-muted-foreground">{child.phone ?? "-"}</div>
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
            className="h-11 w-full"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium mx-2">ประเภทลูกค้า</label>
          <select
            value={customerTypeFilter || ""}
            onChange={(e) => onCustomerTypeFilterChange?.(e.target.value)}
            className="h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">ทั้งหมด</option>
            <option value="DEALER">ตัวแทนจำหน่าย</option>
            <option value="SUBDEALER">ตัวแทนจำหน่ายย่อย</option>
            <option value="FARMER">เกษตรกร</option>
            <option value="BROKER">นายหน้า</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium mx-2">สถานะ</label>
          <select
            value={statusFilter || ""}
            onChange={(e) => onStatusFilterChange?.(e.target.value)}
            className="h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">ทั้งหมด</option>
            <option value="ACTIVE">ใช้งาน</option>
            <option value="INACTIVE">ไม่ได้ใช้งาน</option>
            <option value="SUSPENDED">ระงับ</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3 lg:items-end">
        <div className="space-y-2 lg:col-span-2">
          <label className="text-sm font-medium mx-2">กรองตามวันที่</label>
          <DateRangePicker
            value={dateRange}
            onChange={onDateRangeChange}
            placeholder="เลือกช่วงวันที่"
            className="w-full lg:w-[300px] block"
          />
        </div>

        <div className="flex items-end lg:justify-end">
          {canCreate ? (
            <Link href="/customers/new">
              <Button className="w-full lg:w-auto bg-blue-600 hover:bg-blue-700">
                <span className="inline-flex items-center gap-2">
                  <PlusCircle className="h-4 w-4" />
                  สร้างลูกค้า
                </span>
              </Button>
            </Link>
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
        action: canCreate ? (
          <Link href="/customers/new">
            <Button size="sm">สร้างลูกค้าใหม่</Button>
          </Link>
        ) : undefined,
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
  );
}
