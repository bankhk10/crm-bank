"use client";

import * as React from "react";
import Link from "next/link";
import { PlusCircle, Upload } from "lucide-react";

import CustomTable from "@/components/custom/custom-table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ResponsiveDataView } from "@/components/custom/responsive-data-view";
import { DeleteDialog } from "@/components/custom/delete-dialog";
import { FormCombobox } from "@/components/custom/FormCombobox";
import { ClearSearchButton } from "@/components/custom/ClearSearchButton";
import { usePermission } from "@/hooks/use-permission";
import { TableToolbar } from "@/components/custom/table-toolbar";
import { DetailedTarget } from "../../types";
import { useSalesTargetColumns } from "./use-sales-target-columns";
import { SalesTargetCards } from "./sales-target-cards";
import { MONTHS } from "../../constants";

// ---------------------------------------------------------------------------
// Props & Component
// ---------------------------------------------------------------------------
interface SalesTargetTableProps {
  targets: DetailedTarget[];
  onView: (target: DetailedTarget) => void;
  onDelete: (id: string) => void;
  onCopy: (target: DetailedTarget) => void;
  loading?: boolean;

  // Filters
  year: number;
  month: number | "all";
  employeeId: string;
  shopId: string;
  years: number[];
  employees: any[];
  customers: any[];
  onChangeYear: (year: number) => void;
  onChangeMonth: (month: number | "all") => void;
  onChangeEmployee: (id: string) => void;
  onChangeShop: (id: string) => void;
  onClear: () => void;

  // Permissions
  canCreate?: boolean;
  canView?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  canEditItem?: (item: DetailedTarget) => boolean;
  canDeleteItem?: (item: DetailedTarget) => boolean;
}

export function SalesTargetTable({
  targets,
  onView,
  onDelete,
  onCopy,
  loading = false,
  year,
  month,
  employeeId,
  shopId,
  years,
  employees,
  customers,
  onChangeYear,
  onChangeMonth,
  onChangeEmployee,
  onChangeShop,
  onClear,
  canCreate = false,
  canView = false,
  canEdit = false,
  canDelete = false,
  canEditItem,
  canDeleteItem,
}: SalesTargetTableProps) {
  // -------------------------------------------------------------------------
  // Local state
  // -------------------------------------------------------------------------
  const [currentPage, setCurrentPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(10);
  const [deleteTargetId, setDeleteTargetId] = React.useState<string | null>(
    null,
  );

  // Filter
  const filteredData = React.useMemo(() => {
    // Here we just use targets directly, as the actual filtering is done server-side
    // using year, month, employeeId, shopId. We previously had a local search box,
    // but now the filters handle it all.
    return targets;
  }, [targets]);

  // Pagination
  const totalItems = filteredData.length;
  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredData.slice(start, start + perPage);
  }, [filteredData, currentPage, perPage]);

  // Reset page when targets change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [targets]);

  const paginationInfo = {
    page: currentPage,
    perPage,
    total: totalItems,
    onPageChange: setCurrentPage,
    onPerPageChange: (n: number) => {
      setPerPage(n);
      setCurrentPage(1);
    },
    perPageOptions: [5, 10, 20],
  };

  const columns = useSalesTargetColumns(
    onView,
    onCopy,
    (id) => setDeleteTargetId(id),
    canDelete,
    canEdit,
    canView,
    undefined, // currentUserId not used in columns yet, but can be added if needed
    canEditItem,
    canDeleteItem,
  );

  const toolbar = (
    <div className="space-y-4 mb-6">
      <TableToolbar
        showSearch={false}
        actionPosition="bottom"
        className="p-3 sm:p-4"
        filters={
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-row gap-3 sm:gap-4 items-end w-full">
            <div className="w-full lg:w-[120px]">
              <FormCombobox
                label="ปี"
                value={year.toString()}
                onChange={(val) => onChangeYear(Number(val))}
                options={years.map((y) => ({
                  value: y.toString(),
                  label: (y + 543).toString(),
                }))}
                placeholder="เลือกปี"
                searchPlaceholder="ค้นหาปี..."
                emptyText="ไม่พบปี"
              />
            </div>
            <div className="w-full lg:w-[160px]">
              <FormCombobox
                label="เดือน"
                value={month === "all" ? "all" : month.toString()}
                onChange={(val) =>
                  onChangeMonth(val === "all" ? "all" : Number(val))
                }
                options={[
                  { value: "all", label: "ทั้งหมด" },
                  ...MONTHS.map((m) => ({
                    value: m.value.toString(),
                    label: m.label,
                  })),
                ]}
                placeholder="เดือนทั้งหมด"
                searchPlaceholder="ค้นหาเดือน..."
                emptyText="ไม่พบเดือน"
              />
            </div>
            <div className="w-full sm:col-span-2 lg:w-[340px]">
              <FormCombobox
                label="พนักงาน"
                value={employeeId}
                onChange={(val) => onChangeEmployee(val)}
                options={employees.map((emp) => ({
                  value: emp.id,
                  label: `${emp.name}`,
                }))}
                placeholder="พนักงานทั้งหมด"
                searchPlaceholder="ค้นหาพนักงาน..."
                emptyText="ไม่พบพนักงาน"
              />
            </div>
            <div className="w-full sm:col-span-2 lg:w-[380px]">
              <FormCombobox
                label="ร้านค้า"
                value={shopId}
                onChange={(val) => onChangeShop(val)}
                options={customers.map((customer) => ({
                  value: customer.id,
                  label: `${customer.name}`,
                }))}
                placeholder="ร้านค้าทั้งหมด"
                searchPlaceholder="ค้นหาร้านค้า..."
                emptyText="ไม่พบร้านค้า"
              />
            </div>
            {(month !== "all" || employeeId || shopId) && (
              <ClearSearchButton
                onClick={onClear}
                containerClassName="sm:col-span-2 lg:w-auto"
              />
            )}
          </div>
        }
      />
      {canCreate && (
        <div className="flex justify-end gap-2">
          {/* <Link href="/sales-targets/import" className="w-full sm:w-auto">
                        <Button variant="outline" className="w-full lg:w-auto border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                            <Upload className="h-5 w-5" />
                            นำเข้าข้อมูล
                        </Button>
                    </Link> */}
          <Link href="/sales-targets/create" className="w-full sm:w-auto">
            <Button className="w-full lg:w-auto bg-blue-600 hover:bg-blue-700 text-white">
              <PlusCircle className="h-5 w-5" />
              เพิ่มเป้าหมาย
            </Button>
          </Link>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <ResponsiveDataView
        breakpoint="lg"
        toolbar={toolbar}
        cards={
          <SalesTargetCards
            data={paginatedData}
            loading={loading}
            canDelete={canDelete}
            canEdit={canEdit}
            canView={canView}
            canEditItem={canEditItem}
            canDeleteItem={canDeleteItem}
            onView={onView}
            onCopy={onCopy}
            onDelete={(id) => setDeleteTargetId(id)}
            pagination={paginationInfo}
          />
        }
        table={
          <CustomTable
            columns={columns}
            data={paginatedData}
            loading={loading}
            pagination={paginationInfo}
            toolbar={<></>}
            emptyState={{
              title: "ไม่พบข้อมูลเป้าหมาย",
              description: "ลองปรับตัวกรอง หรือเพิ่มเป้าหมายใหม่",
            }}
            className="w-full"
          />
        }
      />

      {/* Delete Confirm Dialog */}
      <DeleteDialog
        open={Boolean(deleteTargetId)}
        onOpenChange={(open) => {
          if (!open) setDeleteTargetId(null);
        }}
        onConfirm={() => {
          if (deleteTargetId) {
            onDelete(deleteTargetId);
            setDeleteTargetId(null);
          }
        }}
        title="ลบเป้าหมาย"
        description="คุณต้องการลบเป้าหมายรายการนี้ใช่หรือไม่ ?"
      />
    </div>
  );
}
