"use client";

import * as React from "react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { Eye, Edit, Trash2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import type { CustomerRecord } from "../types";
import { CustomerStatusBadge } from "../components/customer-status-badge";
import { CustomerTypeBadge } from "../components/customer-type-badge";

/**
 * Truncated Cell Component
 * Displays text with ellipsis for overflow
 */
function TruncatedCell({ value }: { value: string }) {
  return (
    <div className="truncate" title={value}>
      {value}
    </div>
  );
}

/**
 * Action Button Component
 * Renders a button with tooltip for table actions
 */
function ActionButton({
  href,
  icon: Icon,
  label,
  colorClass,
  onClickHandler,
}: {
  href?: string;
  icon: React.ElementType;
  label: string;
  colorClass: string;
  onClickHandler?: () => void;
}) {
  const button = href ? (
    <Button
      asChild
      size="icon-sm"
      variant="outline"
      className={colorClass}
      aria-label={label}
    >
      <Link href={href}>
        <Icon className="size-4" />
      </Link>
    </Button>
  ) : (
    <Button
      size="icon-sm"
      variant="destructive"
      className={colorClass}
      onClick={onClickHandler}
      aria-label={label}
    >
      <Icon className="size-4" />
    </Button>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
}

/**
 * useCustomerColumns Hook
 * Returns column definitions for the customers table
 */
export function useCustomerColumns(
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
                  onClickHandler={() => onDeleteRequest(customer)}
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
