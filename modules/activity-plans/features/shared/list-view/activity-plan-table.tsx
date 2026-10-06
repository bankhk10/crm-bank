"use client";

import React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
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
  User,
  Tag,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ActivityPlanWithRelations } from "../../../types";
import { ActivityStatusWithOperator } from "../../../ui/activity-status-badge";
import {
  WORK_TYPE_CONFIG,
  getWorkTypeName,
  getWorkTypeCode,
  ACTIVITY_RESULT_STATUS_LABELS,
  STATUS_OPTIONS,
} from "../../../constants";
import CustomTable from "@/components/custom/custom-table";
import { TableToolbar } from "@/components/custom/table-toolbar";
import { ActionButton } from "@/components/custom/action-button";
import {
  MultiSelect,
  type MultiSelectOption,
} from "@/components/custom/multi-select";

interface ActivityPlanTableProps {
  data: ActivityPlanWithRelations[];
  loading: boolean;
  pagination: {
    page: number;
    perPage: number;
    total: number;
    onPageChange: (page: number) => void;
    onPerPageChange: (perPage: number) => void;
    perPageOptions?: number[];
  };
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  statusFilter: string[];
  onStatusFilterChange: (status: string[]) => void;
  workTypeFilter: string[];
  onWorkTypeFilterChange: (workTypes: string[]) => void;
  workTypeOptions: MultiSelectOption[];
  personFilter: string[];
  onPersonFilterChange: (persons: string[]) => void;
  personOptions: MultiSelectOption[];
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canApprove?: boolean;
  onDelete: (item: ActivityPlanWithRelations) => void;
  onSubmitApproval: (item: ActivityPlanWithRelations) => void;
  onDuplicate?: (item: ActivityPlanWithRelations) => void;
  submitLoadingId: string | null;
}

export { STATUS_OPTIONS };

export function ActivityPlanTable({
  data,
  loading,
  pagination,
  searchValue,
  onSearchChange,
  onSearchSubmit,
  statusFilter,
  onStatusFilterChange,
  workTypeFilter,
  onWorkTypeFilterChange,
  workTypeOptions,
  personFilter,
  onPersonFilterChange,
  personOptions,
  canCreate,
  canEdit,
  canDelete,
  canApprove = false,
  onDelete,
  onSubmitApproval,
  onDuplicate,
  submitLoadingId,
}: ActivityPlanTableProps) {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  const currentUserEmployeeId = session?.user?.employeeId;

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
          const isUnplanned = item.planType === "UNPLANNED";
          return (
            <div className="flex flex-col items-start gap-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <ActivityStatusWithOperator
                  plan={item}
                  resultStatus={resultStatus}
                />
                {isUnplanned && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 shadow-2xs whitespace-nowrap self-start mt-0.5">
                    นอกแผน
                  </span>
                )}
              </div>
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "การจัดการ",
        cell: ({ row }) => {
          const item = row.original;
          const isUnplanned = item.planType === "UNPLANNED";
          const isDraft = item.status === "DRAFT";
          const isCorrection = item.status === "WAITING_FOR_CORRECTION";
          const isReturned = item.status === "RETURNED";
          const editable = isUnplanned
            ? isDraft || isReturned
            : isDraft || isCorrection;
          const deletable = editable || item.status === "CANCELLED";
          const isApproved = item.status === "APPROVED";

          const isPending =
            item.status === "PENDING_LINE_APPROVAL" ||
            item.status === "PENDING_BUDGET_APPROVAL" ||
            item.status === "PENDING_HELPER_APPROVAL";

          const hasActualWorkType =
            (item as any).workTypes && (item as any).workTypes.length > 0
              ? (item as any).workTypes.some((wt: any) => {
                  const raw =
                    wt.workTypeCode ||
                    wt.activityType?.code ||
                    wt.activityType?.name ||
                    "";
                  const code = getWorkTypeCode(raw);
                  return code
                    ? WORK_TYPE_CONFIG[code as keyof typeof WORK_TYPE_CONFIG]
                        ?.hasActual
                    : true;
                })
              : (item as any).tour
                ? false
                : item.activityType?.code !== "TYPE_12" &&
                  item.activityType?.name !== "ทัวร์";

          const isCreator = Boolean(
            (currentUserEmployeeId &&
              item.employeeId === currentUserEmployeeId) ||
            (currentUserId && item.createdById === currentUserId),
          );

          const editHref = isUnplanned
            ? `/activity-plans/unplanned/${item.id}/edit`
            : `/activity-plans/${item.id}/edit`;

          const detailHref = `/activity-plans/${item.id}`;

          return (
            <div className="flex items-center justify-center gap-2">
              <ActionButton
                href={detailHref}
                icon={Eye}
                label="ดูรายละเอียด"
                colorClass="text-blue-600 border-blue-100 hover:bg-blue-50 rounded-md"
              />

              {!isUnplanned && isApproved && hasActualWorkType && isCreator && (
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
                isCreator &&
                (submitLoadingId === item.id ? (
                  <span className="text-xs text-slate-400 animate-pulse font-medium px-2 py-1 select-none">
                    กำลังส่ง...
                  </span>
                ) : (
                  <ActionButton
                    icon={Send}
                    label={isUnplanned ? "ส่งตรวจสอบ" : "ส่งขออนุมัติ"}
                    colorClass="text-teal-600 border-teal-100 hover:bg-teal-50 rounded-md"
                    onClick={() => onSubmitApproval(item)}
                  />
                ))}

              {canEdit && editable && isCreator && (
                <ActionButton
                  href={editHref}
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

              {canDelete && deletable && isCreator && (
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
    currentUserId,
    currentUserEmployeeId,
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
            {/* 1. ประเภทงาน */}
            <div className="space-y-1">
              <label className="mx-1 text-sm font-medium text-slate-700 block">
                ประเภทงาน
              </label>
              <MultiSelect
                options={workTypeOptions}
                defaultValue={workTypeFilter}
                onValueChange={onWorkTypeFilterChange}
                placeholder="เลือกประเภทงาน"
                searchPlaceholder="ค้นหาประเภทงาน..."
                emptyIndicator="ไม่พบประเภทงาน"
                maxCount={1}
                className="bg-white h-11 text-xs"
              />
            </div>

            {/* 2. บุคคล */}
            <div className="space-y-1">
              <label className="mx-1 text-sm font-medium text-slate-700 block">
                บุคคล
              </label>
              <MultiSelect
                options={personOptions}
                defaultValue={personFilter}
                onValueChange={onPersonFilterChange}
                placeholder="เลือกบุคคล"
                searchPlaceholder="ค้นหาชื่อบุคคล..."
                emptyIndicator="ไม่พบบุคคล"
                maxCount={1}
                className="bg-white h-11 text-xs"
              />
            </div>

            {/* 3. สถานะ */}
            <div className="space-y-1">
              <label className="mx-1 text-sm font-medium text-slate-700 block">
                สถานะ
              </label>
              <MultiSelect
                options={STATUS_OPTIONS}
                defaultValue={statusFilter}
                onValueChange={onStatusFilterChange}
                placeholder="เลือกสถานะ"
                searchPlaceholder="ค้นหาสถานะ..."
                emptyIndicator="ไม่พบสถานะ"
                maxCount={1}
                className="bg-white h-11 text-xs"
              />
            </div>
          </div>
        }
      />
      <div className="flex flex-wrap items-center justify-end gap-3">
        {canCreate ? (
          <>
            <Link
              href="/activity-plans/unplanned/new"
              className="w-full sm:w-auto"
            >
              <Button className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-2 font-semibold shadow-xs">
                <PlusCircle className="h-4 w-4" />
                บันทึกกิจกรรมนอกแผน
              </Button>
            </Link>
            <Link href="/activity-plans/new" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 font-semibold shadow-xs">
                <PlusCircle className="h-4 w-4" />
                สร้างแผนงานใหม่
              </Button>
            </Link>
          </>
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

  // ─── Mobile Card renderer ────────────────────────────────────────────────
  const renderMobileCards = () => {
    if (loading) {
      return (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                  <div className="h-5 bg-slate-200 rounded w-3/4" />
                  <div className="h-4 bg-slate-200 rounded w-1/2" />
                </div>
                <div className="h-6 w-16 bg-slate-200 rounded-full" />
              </div>
              <div className="mt-4 flex gap-2">
                <div className="h-8 w-20 bg-slate-200 rounded-lg" />
                <div className="h-8 w-20 bg-slate-200 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (data.length === 0) {
      return (
        <div className="text-center py-14 text-slate-400">
          <CalendarIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">ไม่พบรายการ Trip Plan</p>
          <p className="text-xs mt-1">
            ลองปรับเงื่อนไขการค้นหา หรือสร้าง Trip Plan ใหม่
          </p>
        </div>
      );
    }

    const formatThaiDate = (date: Date) =>
      `${format(date, "dd MMM", { locale: th })} ${date.getFullYear() + 543} ${format(date, "HH:mm")}`;

    return (
      <div className="space-y-3">
        {data.map((item) => {
          const isUnplanned = item.planType === "UNPLANNED";
          const isDraft = item.status === "DRAFT";
          const isCorrection = item.status === "WAITING_FOR_CORRECTION";
          const isReturned = item.status === "RETURNED";
          const editable = isUnplanned
            ? isDraft || isReturned
            : isDraft || isCorrection;
          const deletable = editable || item.status === "CANCELLED";
          const isApproved = item.status === "APPROVED";
          const isPending =
            item.status === "PENDING_LINE_APPROVAL" ||
            item.status === "PENDING_BUDGET_APPROVAL" ||
            item.status === "PENDING_HELPER_APPROVAL";

          const hasActualWorkType =
            (item as any).workTypes && (item as any).workTypes.length > 0
              ? (item as any).workTypes.some((wt: any) => {
                  const raw =
                    wt.workTypeCode ||
                    wt.activityType?.code ||
                    wt.activityType?.name ||
                    "";
                  const code = getWorkTypeCode(raw);
                  return code
                    ? WORK_TYPE_CONFIG[code as keyof typeof WORK_TYPE_CONFIG]
                        ?.hasActual
                    : true;
                })
              : (item as any).tour
                ? false
                : item.activityType?.code !== "TYPE_12" &&
                  item.activityType?.name !== "ทัวร์";

          const isCreator = Boolean(
            (currentUserEmployeeId &&
              item.employeeId === currentUserEmployeeId) ||
            (currentUserId && item.createdById === currentUserId),
          );

          const editHref = isUnplanned
            ? `/activity-plans/unplanned/${item.id}/edit`
            : `/activity-plans/${item.id}/edit`;
          const detailHref = `/activity-plans/${item.id}`;

          const planNo =
            (item as any).code ||
            (item as any).planNo ||
            (item as any).planCode ||
            item.id.slice(0, 8);

          const workTypeNames: string[] = [];
          if ((item as any).workTypes?.length > 0) {
            (item as any).workTypes.forEach((wt: any) => {
              const name =
                wt.activityType?.name ||
                getWorkTypeName(wt.activityTypeId || wt.workTypeCode);
              if (name) workTypeNames.push(name);
            });
          } else if ((item as any).tour) {
            workTypeNames.push("ทัวร์");
          } else {
            const raw: any = item.activityType;
            if (raw && typeof raw === "object")
              workTypeNames.push(raw.name || raw.code || "-");
            else if (typeof raw === "string") workTypeNames.push(raw);
          }

          const startDate = new Date(item.startDate);
          const endDate = new Date(item.endDate);
          const resultStatus = (item as any).result?.resultStatus;

          return (
            <div
              key={item.id}
              className="relative rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden"
            >
              {/* Color accent bar */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-l-2xl" />

              <div className="pl-4 pr-4 pt-4 pb-3">
                {/* Header row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    {/* Plan number + unplanned badge */}
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      <span className="text-[11px] font-mono font-semibold text-blue-600 bg-blue-50 border border-blue-100 rounded px-1.5 py-0.5">
                        {planNo}
                      </span>
                      {isUnplanned && (
                        <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 border border-purple-200 rounded-full px-2 py-0.5">
                          นอกแผน
                        </span>
                      )}
                    </div>
                    {/* Title */}
                    <p className="text-sm font-semibold text-slate-800 leading-snug line-clamp-2">
                      {item.title || "-"}
                    </p>
                  </div>
                  {/* Status */}
                  <div className="shrink-0 mt-0.5">
                    <ActivityStatusWithOperator
                      plan={item}
                      resultStatus={resultStatus}
                    />
                  </div>
                </div>

                {/* Meta rows */}
                <div className="mt-2.5 space-y-1.5">
                  {workTypeNames.length > 0 && (
                    <div className="flex items-start gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="text-xs text-slate-500 line-clamp-2">
                        {workTypeNames.join(", ")}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <CalendarIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-xs text-slate-500">
                      {formatThaiDate(startDate)} — {formatThaiDate(endDate)}
                    </span>
                  </div>
                  {(item as any).employee?.name && (
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-xs text-slate-500">
                        {(item as any).employee.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action row */}
              <div className="flex items-center gap-1.5 px-4 pb-3 flex-wrap">
                <Link href={detailHref}>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-[11px] font-semibold text-blue-600 border-blue-100 hover:bg-blue-50 rounded-lg gap-1 px-2.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    ดูรายละเอียด
                  </Button>
                </Link>

                {!isUnplanned &&
                  isApproved &&
                  hasActualWorkType &&
                  isCreator && (
                    <Link href={`/activity-plans/${item.id}/actual`}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-[11px] font-semibold text-emerald-600 border-emerald-100 hover:bg-emerald-50 rounded-lg gap-1 px-2.5"
                      >
                        <ClipboardList className="w-3.5 h-3.5" />
                        บันทึกผล
                      </Button>
                    </Link>
                  )}

                {canApprove && isPending && (
                  <Link href="/activity-plans/approvals">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-[11px] font-semibold text-emerald-600 border-emerald-100 hover:bg-emerald-50 rounded-lg gap-1 px-2.5"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      อนุมัติ
                    </Button>
                  </Link>
                )}

                {editable &&
                  isCreator &&
                  (submitLoadingId === item.id ? (
                    <span className="text-[11px] text-slate-400 animate-pulse font-medium px-2 py-1 select-none">
                      กำลังส่ง...
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-[11px] font-semibold text-teal-600 border-teal-100 hover:bg-teal-50 rounded-lg gap-1 px-2.5"
                      onClick={() => onSubmitApproval(item)}
                    >
                      <Send className="w-3.5 h-3.5" />
                      {isUnplanned ? "ส่งตรวจสอบ" : "ส่งขออนุมัติ"}
                    </Button>
                  ))}

                {canEdit && editable && isCreator && (
                  <Link href={editHref}>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-[11px] font-semibold text-purple-600 border-purple-100 hover:bg-purple-50 rounded-lg gap-1 px-2.5"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      แก้ไข
                    </Button>
                  </Link>
                )}

                {canCreate && onDuplicate && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-[11px] font-semibold text-amber-600 border-amber-100 hover:bg-amber-50 rounded-lg gap-1 px-2.5"
                    onClick={() => onDuplicate(item)}
                  >
                    <Copy className="w-3.5 h-3.5" />
                    ทำสำเนา
                  </Button>
                )}

                {canDelete && deletable && isCreator && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-[11px] font-semibold text-red-600 border-red-100 hover:bg-red-50 bg-red-50 rounded-lg gap-1 px-2.5"
                    onClick={() => onDelete(item)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    ลบ
                  </Button>
                )}
              </div>
            </div>
          );
        })}

        {/* Mobile pagination */}
        {pagination.total > pagination.perPage && (
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8 rounded-lg"
              disabled={pagination.page <= 1}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
            >
              ก่อนหน้า
            </Button>
            <span className="text-xs text-slate-500">
              หน้า {pagination.page} /{" "}
              {Math.ceil(pagination.total / pagination.perPage)}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8 rounded-lg"
              disabled={
                pagination.page >=
                Math.ceil(pagination.total / pagination.perPage)
              }
              onClick={() => pagination.onPageChange(pagination.page + 1)}
            >
              ถัดไป
            </Button>
          </div>
        )}
      </div>
    );
  };
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {toolbar}
      {/* Mobile card view */}
      <div className="md:hidden">{renderMobileCards()}</div>
      {/* Desktop / tablet table view */}
      <div className="hidden md:block w-full">
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
