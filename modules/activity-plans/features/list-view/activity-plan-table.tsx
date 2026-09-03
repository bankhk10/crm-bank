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
  CheckCircle2,
  ShieldCheck,
  Copy,
  Calendar as CalendarIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ActivityPlanWithRelations } from "../../types";
import { ActivityStatusBadge, ActivityStatusWithOperator } from "../../ui/activity-status-badge";
import { WORK_TYPE_CONFIG, getWorkTypeName } from "../../constants";
import CustomTable from "@/components/custom/custom-table";
import { TableToolbar } from "@/components/custom/table-toolbar";
import { ActionButton } from "@/components/custom/action-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  canApprove?: boolean;
  onDelete: (item: ActivityPlanWithRelations) => void;
  onSubmitApproval: (item: ActivityPlanWithRelations) => void;
  onDuplicate?: (item: ActivityPlanWithRelations) => void;
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
  canApprove = false,
  onDelete,
  onSubmitApproval,
  onDuplicate,
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
        cell: ({ row }) => {
          const item = row.original;
          if ((item as any).workTypes && (item as any).workTypes.length > 0) {
            const names = (item as any).workTypes
              .map(
                (wt: any) =>
                  wt.activityType?.name ||
                  getWorkTypeName(wt.activityTypeId || wt.workTypeCode),
              )
              .filter(Boolean);
            if (names.length > 0) {
              const str = names.join(", ");
              return (
                <div
                  className="truncate text-sm text-slate-700 max-w-[250px]"
                  title={str}
                >
                  {str}
                </div>
              );
            }
          }
          if ((item as any).tour) {
            return (
              <div
                className="truncate text-sm text-slate-700 max-w-[250px]"
                title="ทัวร์"
              >
                ทัวร์
              </div>
            );
          }
          const raw: any = item.activityType;
          let val = "-";
          if (raw && typeof raw === "object") {
            val = raw.name || raw.code || "-";
          } else if (typeof raw === "string") {
            val = raw;
          }

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
            <ActivityStatusWithOperator
              plan={item}
              resultStatus={resultStatus}
            />
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

          const isPending =
            item.status === "PENDING_LINE_APPROVAL" ||
            item.status === "PENDING_BUDGET_APPROVAL" ||
            item.status === "PENDING_HELPER_APPROVAL";

          const hasActualWorkType =
            (item as any).workTypes && (item as any).workTypes.length > 0
              ? (item as any).workTypes.some((wt: any) => {
                  const code = wt.workTypeCode || wt.activityType?.code;
                  return code
                    ? WORK_TYPE_CONFIG[code as keyof typeof WORK_TYPE_CONFIG]
                        ?.hasActual
                    : true;
                })
              : (item as any).tour
                ? false
                : item.activityType?.code !== "TYPE_12" &&
                  item.activityType?.name !== "ทัวร์";

          return (
            <div className="flex items-center justify-center gap-2">
              <ActionButton
                href={`/activity-plans/${item.id}`}
                icon={Eye}
                label="ดูรายละเอียด"
                colorClass="text-blue-600 border-blue-100 hover:bg-blue-50 rounded-md"
              />

              {hasActualWorkType && (
                <ActionButton
                  href={`/activity-plans/${item.id}/actual`}
                  icon={ClipboardList}
                  label="บันทึกผล"
                  colorClass="text-emerald-600 border-emerald-100 hover:bg-emerald-50 rounded-md"
                />
              )}

              {canApprove && isPending && (
                <ActionButton
                  href="/activity-plans/approvals"
                  icon={ShieldCheck}
                  label="อนุมัติแผนงาน"
                  colorClass="text-emerald-600 border-emerald-100 hover:bg-emerald-50 rounded-md"
                />
              )}

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

              {canCreate && onDuplicate && (
                <ActionButton
                  icon={Copy}
                  label="ทำสำเนา"
                  colorClass="text-amber-600 border-amber-100 hover:bg-amber-50 rounded-md"
                  onClick={() => onDuplicate(item)}
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
  }, [
    canCreate,
    canEdit,
    canDelete,
    canApprove,
    onSubmitApproval,
    onDuplicate,
    onDelete,
    submitLoadingId,
  ]);

  const toolbar = (
    <div className="space-y-4 mb-6">
      <TableToolbar
        searchPlaceholder="ค้นหาเลขที่แผน, ชื่อกิจกรรม..."
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        onSearchSubmit={onSearchSubmit}
        filters={
          <div className="space-y-1">
            <label className="mx-1 text-base font-medium block">สถานะ</label>
            <Select
              value={statusFilter || "ALL"}
              onValueChange={(value) =>
                onStatusFilterChange?.(value === "ALL" ? "" : value)
              }
            >
              <SelectTrigger className="w-full bg-white h-10 text-sm">
                <SelectValue placeholder="ทุกสถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">ทุกสถานะ</SelectItem>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />
      <div className="flex flex-wrap items-center justify-end gap-3">
        {canCreate ? (
          <Link href="/activity-plans/new" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 font-semibold shadow-xs">
              <PlusCircle className="h-4 w-4" />
              สร้างแผนงานใหม่
            </Button>
          </Link>
        ) : (
          <Button
            className="w-full sm:w-auto font-semibold"
            variant="outline"
            disabled
          >
            <PlusCircle className="h-4 w-4" />
            สร้างแผนงานใหม่
          </Button>
        )}
        <Link href="/activity-plans/calendar" className="w-full sm:w-auto">
          <Button
            variant="outline"
            className="w-full sm:w-auto border-blue-600 text-blue-700 hover:bg-blue-50 flex items-center gap-2 font-semibold shadow-xs"
          >
            <CalendarIcon className="h-4 w-4 text-blue-600" />
            ปฏิทินกิจกรรม
          </Button>
        </Link>
        {canApprove && (
          <Link href="/activity-plans/approvals" className="w-full sm:w-auto">
            <Button
              variant="outline"
              className="w-full sm:w-auto border-emerald-600 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 flex items-center gap-2 font-semibold shadow-xs"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              อนุมัติแผนงาน
            </Button>
          </Link>
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
