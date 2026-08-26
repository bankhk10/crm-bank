"use client";

import React from "react";
import Link from "next/link";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Eye,
  Edit,
  Trash2,
  Send,
  PlusCircle,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ActivityPlanWithRelations } from "../../types";
import { ActivityStatusBadge } from "../../ui/activity-status-badge";
import CustomTable from "@/components/custom/custom-table";
import { TableToolbar } from "@/components/custom/table-toolbar";
import { ActionButton } from "@/components/custom/action-button";

interface ActivityPlanTableProps {
  data: ActivityPlanWithRelations[];
  loading: boolean;
  pagination: {
    page: number;
    perPage: number;
    total: number;
    onPageChange: (page: number) => void;
    onPerPageChange: (perPage: number) => void;
  };
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onDelete: (item: ActivityPlanWithRelations) => void;
  onSubmitApproval: (item: ActivityPlanWithRelations) => void;
  submitLoadingId: string | null;
}

const STATUS_OPTIONS = [
  { value: "DRAFT", label: "ร่าง" },
  { value: "PENDING_LINE_APPROVAL", label: "รออนุมัติตามสายงาน" },
  { value: "PENDING_BUDGET_APPROVAL", label: "รออนุมัติงบประมาณ" },
  { value: "PENDING_HELPER_APPROVAL", label: "รออนุมัติคนช่วยงาน" },
  { value: "APPROVED", label: "อนุมัติสำเร็จ" },
  { value: "COMPLETED", label: "ผลกิจกรรม: สำเร็จ" },
  { value: "PARTIAL", label: "ผลกิจกรรม: สำเร็จบางส่วน" },
  { value: "POSTPONED", label: "ผลกิจกรรม: เลื่อน" },
  { value: "WAITING_FOR_CORRECTION", label: "รอแก้ไข/ข้อมูลเพิ่ม" },
  { value: "REJECTED", label: "ปฏิเสธ" },
  { value: "CANCELLED", label: "ยกเลิก" },
];

export function ActivityPlanTable({
  data,
  loading,
  pagination,
  searchValue,
  onSearchChange,
  onSearchSubmit,
  statusFilter,
  onStatusFilterChange,
  canCreate,
  canEdit,
  canDelete,
  onDelete,
  onSubmitApproval,
  submitLoadingId,
}: ActivityPlanTableProps) {
  const columns = React.useMemo<ColumnDef<ActivityPlanWithRelations>[]>(() => {
    return [
      {
        id: "planNo",
        header: "เลขที่แผน",
        cell: ({ row }) => {
          const planNo =
            (row.original as any).code ||
            (row.original as any).planNo ||
            (row.original as any).planCode ||
            row.original.id;
          return (
            <div
              className="truncate text-sm text-slate-700 max-w-[130px]"
              title={planNo || "-"}
            >
              {planNo || "-"}
            </div>
          );
        },
      },
      {
        accessorKey: "title",
        header: "ชื่อกิจกรรม",
        cell: (info) => {
          const val = (info.getValue() as string) || "-";
          return (
            <div
              className="truncate text-sm text-slate-700 max-w-[200px]"
              title={val}
            >
              {val}
            </div>
          );
        },
      },
      {
        accessorKey: "activityType",
        header: "ประเภทงาน",
        cell: (info) => {
          const raw = info.getValue();
          const val =
            typeof raw === "object" && raw !== null
              ? (raw as any).name || (raw as any).code || "-"
              : (raw as string) || "-";
          console.log(info);
          return (
            <div
              className="truncate text-sm text-slate-700 max-w-[250px]"
              title={val}
            >
              {val}
            </div>
          );
        },
      },
      {
        accessorKey: "startDate",
        header: "ช่วงเวลาจัดกิจกรรม",
        cell: ({ row }) => {
          const start = new Date(row.original.startDate);
          const end = new Date(row.original.endDate);

          const formatThaiDateTime = (date: Date) => {
            return `${format(date, "dd MMM", { locale: th })} ${
              date.getFullYear() + 543
            } ${format(date, "HH:mm")}`;
          };

          const startFormatted = formatThaiDateTime(start);
          const endFormatted = formatThaiDateTime(end);

          return (
            <div
              className="text-sm text-slate-700"
              title={`${startFormatted} - ${endFormatted}`}
            >
              <div>{startFormatted} ถึง</div>
              <div>{endFormatted}</div>
            </div>
          );
        },
      },
      {
        accessorKey: "employee.name",
        header: "ผู้จัดทำแผน",
        cell: (info) => {
          const val = (info.getValue() as string) || "-";
          return (
            <div
              className="truncate text-sm text-slate-700 max-w-[130px]"
              title={val}
            >
              {val}
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: "สถานะ",
        cell: ({ row }) => {
          const item = row.original;
          const resultStatus = (item as any).result?.resultStatus;
          return (
            <div className="whitespace-nowrap">
              <ActivityStatusBadge
                status={item.status}
                resultStatus={resultStatus}
              />
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "การจัดการ",
        cell: ({ row }) => {
          const item = row.original;
          const isDraft = item.status === "DRAFT";
          const isCorrection = item.status === "WAITING_FOR_CORRECTION";
          const editable = isDraft || isCorrection;
          const deletable = editable || item.status === "CANCELLED";

          return (
            <div className="flex items-center justify-center gap-2">
              <ActionButton
                href={`/activity-plans/${item.id}`}
                icon={Eye}
                label="ดูรายละเอียด"
                colorClass="text-blue-600 border-blue-100 hover:bg-blue-50 rounded-md"
              />

              <ActionButton
                href={`/activity-plans/${item.id}/actual`}
                icon={ClipboardList}
                label="บันทึกผล"
                colorClass="text-emerald-600 border-emerald-100 hover:bg-emerald-50 rounded-md"
              />

              {editable &&
                (submitLoadingId === item.id ? (
                  <span className="text-xs text-slate-400 animate-pulse font-medium px-2 py-1 select-none">
                    กำลังส่ง...
                  </span>
                ) : (
                  <ActionButton
                    icon={Send}
                    label="ส่งขออนุมัติ"
                    colorClass="text-teal-600 border-teal-100 hover:bg-teal-50 rounded-md"
                    onClick={() => onSubmitApproval(item)}
                  />
                ))}

              {canEdit && editable && (
                <ActionButton
                  href={`/activity-plans/${item.id}/edit`}
                  icon={Edit}
                  label="แก้ไข"
                  colorClass="text-purple-600 border-purple-100 hover:bg-purple-50 rounded-md"
                />
              )}

              {canDelete && deletable && (
                <ActionButton
                  icon={Trash2}
                  label="ลบ"
                  colorClass="bg-red-50 text-red-600 hover:bg-red-100 rounded-md"
                  onClick={() => onDelete(item)}
                />
              )}
            </div>
          );
        },
      },
    ];
  }, [canEdit, canDelete, onSubmitApproval, onDelete, submitLoadingId]);

  const toolbar = (
    <div className="space-y-4 mb-6">
      <TableToolbar
        searchPlaceholder="ค้นหาเลขที่แผน, ชื่อกิจกรรม..."
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        onSearchSubmit={onSearchSubmit}
        filters={
          <div className="flex items-center gap-2 min-w-[200px]">
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="h-11 w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">ทุกสถานะ</option>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        }
      />
      <div className="flex flex-wrap items-center justify-end gap-3">
        {/* <Link href="/activity-plans/approvals" className="w-full sm:w-auto">
          <Button
            variant="outline"
            className="w-full lg:w-auto border-amber-500 text-amber-800 hover:bg-amber-50 flex items-center gap-2 font-semibold"
          >
            <ShieldCheck className="h-4 w-4 text-amber-600" />
            คิวงานอนุมัติ
          </Button>
        </Link> */}
        {/* <Link href="/activity-plans/actual" className="w-full sm:w-auto">
          <Button
            variant="outline"
            className="w-full lg:w-auto border-emerald-600 text-emerald-700 hover:bg-emerald-50 flex items-center gap-2 font-semibold"
          >
            <ClipboardList className="h-4 w-4 text-emerald-600" />
            บันทึกผลปฏิบัติงาน (Actual)
          </Button>
        </Link> */}
        {canCreate ? (
          <Link href="/activity-plans/new" className="w-full sm:w-auto">
            <Button className="w-full lg:w-auto bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 font-semibold">
              <PlusCircle className="h-5 w-5" />
              สร้างแผนงานใหม่
            </Button>
          </Link>
        ) : (
          <Button
            className="w-full sm:w-auto font-semibold"
            variant="outline"
            disabled
          >
            <PlusCircle className="h-5 w-5" />
            สร้างแผนงานใหม่
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {toolbar}
      <div className="w-full">
        <CustomTable
          columns={columns}
          data={data}
          loading={loading}
          pagination={pagination}
          toolbar={<></>}
          emptyState={{
            title: "ไม่พบรายการ Trip Plan",
            description: "ลองปรับเงื่อนไขการค้นหา หรือสร้าง Trip Plan ใหม่",
          }}
          className="w-full"
        />
      </div>
    </div>
  );
}
