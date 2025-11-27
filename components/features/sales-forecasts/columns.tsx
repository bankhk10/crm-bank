"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { SalesForecast, SalesForecastStatus } from "@/types/sales-forecast";

const statusConfig: Record<SalesForecastStatus, { label: string; variant: "default" | "secondary" | "outline" | "success" | "warning" }> = {
  DRAFT: { label: "ร่าง", variant: "secondary" },
  SUBMITTED: { label: "ส่งแล้ว", variant: "default" },
  APPROVED: { label: "อนุมัติแล้ว", variant: "success" },
  REJECTED: { label: "ปฏิเสธ", variant: "warning" },
};

interface SalesForecastColumnsProps {
  onDelete?: (id: string) => void;
}

export function getSalesForecastColumns({
  onDelete,
}: SalesForecastColumnsProps = {}): ColumnDef<SalesForecast>[] {
  return [
    {
      accessorKey: "year",
      header: "ปี",
      cell: ({ row }) => <div className="font-medium">{row.getValue("year")}</div>,
    },
    {
      accessorKey: "employee.name",
      header: "พนักงานขาย",
      cell: ({ row }) => {
        const employee = row.original.employee;
        return (
          <div>
            <div className="font-medium">{employee?.name}</div>
            {employee?.employeeCode && (
              <div className="text-sm text-muted-foreground">
                {employee.employeeCode}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "totalAmount",
      header: "ยอดรวม (บาท)",
      cell: ({ row }) => {
        const amount = Number(row.getValue("totalAmount"));
        return (
          <div className="font-medium">
            {amount.toLocaleString("th-TH", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "สถานะ",
      cell: ({ row }) => {
        const status = row.getValue("status") as SalesForecastStatus;
        const config = statusConfig[status];
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      accessorKey: "submittedAt",
      header: "วันที่ส่ง",
      cell: ({ row }) => {
        const date = row.getValue("submittedAt") as Date | null;
        if (!date) return <span className="text-muted-foreground">-</span>;
        return new Date(date).toLocaleDateString("th-TH");
      },
    },
    {
      accessorKey: "approvedAt",
      header: "วันที่อนุมัติ",
      cell: ({ row }) => {
        const date = row.getValue("approvedAt") as Date | null;
        if (!date) return <span className="text-muted-foreground">-</span>;
        return new Date(date).toLocaleDateString("th-TH");
      },
    },
    {
      id: "actions",
      header: "จัดการ",
      cell: ({ row }) => {
        const forecast = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/sales-forecasts/${forecast.id}`}>
                <Eye className="h-4 w-4" />
              </Link>
            </Button>
            {forecast.status === "DRAFT" && (
              <>
                <Button variant="ghost" size="icon" asChild>
                  <Link href={`/sales-forecasts/${forecast.id}/edit`}>
                    <Pencil className="h-4 w-4" />
                  </Link>
                </Button>
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(forecast.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </>
            )}
          </div>
        );
      },
    },
  ];
}
