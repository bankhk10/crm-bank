"use client";

import * as React from "react";
import Link from "next/link";
import { Eye, Edit, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import CustomTable from "@/components/custom/custom-table";
import { TableToolbar } from "@/components/custom/table-toolbar";
import { ResponsiveDataView } from "@/components/custom/responsive-data-view";
import { useCustomerColumns } from "./use-customer-columns";
import type { CustomersTableProps } from "../../types";
import { CustomersCards } from "./customers-cards";
import { CustomerTypeBadge } from "../../ui/customer-type-badge";
import { CustomerStatusBadge } from "../../ui/customer-status-badge";
import { ActionButton } from "@/components/custom/action-button";
import {
  ALL_FILTER_VALUE,
  ALL_STATUS_VALUE,
  CUSTOMER_TYPE_STYLE,
  STATUS_STYLE,
} from "../../constants";

export default function CustomersTable({
  data,
  loading,
  canCreate,
  canCreateDealer,
  canCreateSubdealer,
  canCreateFarmer,
  canCreateBroker,
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
}: CustomersTableProps) {
  const columns = useCustomerColumns(onDeleteRequest, canDelete, data);

  const customerTypes = Object.keys(CUSTOMER_TYPE_STYLE) as Array<
    keyof typeof CUSTOMER_TYPE_STYLE
  >;

  // Map customer types to their permission flags
  const typePermissions: Record<string, boolean> = {
    DEALER: canCreateDealer ?? false,
    SUBDEALER: canCreateSubdealer ?? false,
    FARMER: canCreateFarmer ?? false,
    BROKER: canCreateBroker ?? false,
  };

  const allowedTypes = customerTypes.filter((type) => typePermissions[type]);

  const toolbar = (
    <TableToolbar
      searchPlaceholder="รหัสลูกค้า, ชื่อ, อีเมล, โทรศัพท์"
      searchValue={searchValue}
      onSearchChange={(val) => onSearchChange && onSearchChange(val)}
      onSearchSubmit={onSearchSubmit}
      actionPosition="bottom"
      filters={
        <div className="grid grid-cols-2 gap-2">
          {/* Customer Type Filter */}
          <div className="space-y-2">
            <label className="text-base font-medium leading-none mx-1">ประเภท</label>
            <div className="mt-1">
              <Select
                value={customerTypeFilter || ALL_FILTER_VALUE}
                onValueChange={(v) =>
                  onCustomerTypeFilterChange?.(v === ALL_FILTER_VALUE ? "" : v)
                }
              >
                <SelectTrigger className="text-base w-full bg-white">
                  <SelectValue placeholder="ประเภท" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_FILTER_VALUE}>ทุกประเภท</SelectItem>
                  {customerTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {CUSTOMER_TYPE_STYLE[type].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <label className="text-base font-medium leading-none mx-1">สถานะ</label>
            <div className="mt-1">
              <Select
                value={statusFilter || ALL_STATUS_VALUE}
                onValueChange={(v) =>
                  onStatusFilterChange?.(v === ALL_STATUS_VALUE ? "" : v)
                }
              >
                <SelectTrigger className="text-base w-full bg-white">
                  <SelectValue placeholder="สถานะ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_STATUS_VALUE}>ทุกสถานะ</SelectItem>
                  {Object.entries(STATUS_STYLE).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      }
      actions={
        <div className="flex flex-wrap gap-2 items-center lg:justify-end w-full">
          {canCreate && allowedTypes.length > 0 ? (
            <>
              {allowedTypes.map((type) => (
                <Link key={type} href={`/customers/new?type=${type}`}>
                  <Button className={CUSTOMER_TYPE_STYLE[type].buttonColor}>
                    <span className="inline-flex items-center gap-2">
                      <PlusCircle className="h-4 w-4" />
                      {CUSTOMER_TYPE_STYLE[type].label}
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
      }
    />
  );

  return (
    <ResponsiveDataView
      breakpoint="lg"
      toolbar={toolbar}
      cards={
        <div className="space-y-4">
          <CustomersCards
            data={data}
            loading={loading}
            canDelete={canDelete}
            onDeleteRequest={onDeleteRequest}
            pagination={pagination}
          />
          {!loading && pagination.total > 0 && (
            <div className="mt-4 flex justify-center">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => pagination.onPageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                >
                  ก่อนหน้า
                </Button>
                <span className="text-sm">
                  หน้า {pagination.page} /{" "}
                  {Math.max(1, Math.ceil(pagination.total / pagination.perPage))}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => pagination.onPageChange(pagination.page + 1)}
                  disabled={
                    pagination.page >=
                    Math.ceil(pagination.total / pagination.perPage)
                  }
                >
                  ถัดไป
                </Button>
              </div>
            </div>
          )}
        </div>
      }
      table={
        <div className="relative rounded-lg border shadow-sm bg-white overflow-hidden">
          <CustomTable
            columns={columns}
            data={data}
            loading={loading}
            pagination={pagination}
            toolbar={<></>}
            renderSubComponent={({ row }) => {
              const customer = row.original;
              const subDealers = (customer as any).subDealers || [];

              if (!subDealers || subDealers.length === 0) {
                return (
                  <div className="px-8 py-4 text-sm text-gray-500 bg-gray-50/50 border-t italic">
                    — ไม่มีข้อมูลร้านค้าลูกภายใต้ร้านนี้ —
                  </div>
                );
              }

              return (
                <div className="bg-gray-50/50 border-t">
                  {/* Header ของตารางย่อย - แยก ชื่อ และ รหัส ออกจากกัน */}
                  <div className="px-8 py-2 bg-gray-100/80 border-b flex items-center text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    <div className="flex-1 px-2">ชื่อร้านค้า</div>
                    <div className="w-32 px-2 text-center">รหัสลูกค้า</div>
                    <div className="w-40 px-2 text-center">เบอร์โทรศัพท์</div>
                    <div className="w-32 px-2 text-center">ประเภท</div>
                    <div className="w-32 px-2 text-center">สถานะ</div>
                    <div className="w-24 px-2 text-right">จัดการ</div>
                  </div>

                  {/* รายการร้านค้าลูก */}
                  <div className="divide-y divide-gray-200">
                    {subDealers.map((subDealer: any) => (
                      <div
                        key={subDealer.id}
                        className="px-8 py-3 flex items-center hover:bg-white transition-colors group"
                      >
                        {/* 1. ชื่อร้านค้า */}
                        <div className="flex-1 px-2 flex items-center gap-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 group-hover:scale-125 transition-transform" />
                          <div className="text-sm font-semibold text-gray-900 truncate">
                            {subDealer.name}
                          </div>
                        </div>

                        {/* 2. รหัสลูกค้า (แยกออกมา) */}
                        <div className="w-32 px-2 text-center">
                          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600 border border-gray-200">
                            {subDealer.customerCode}
                          </span>
                        </div>

                        {/* 3. เบอร์โทรศัพท์ */}
                        <div className="w-40 px-2 text-center text-sm text-gray-600">
                          {subDealer.phone || "-"}
                        </div>

                        {/* 4. ประเภท */}
                        <div className="w-32 px-2 flex justify-center">
                          <CustomerTypeBadge type={subDealer.customerType} />
                        </div>

                        {/* 5. สถานะ */}
                        <div className="w-32 px-2 flex justify-center">
                          <CustomerStatusBadge
                            status={subDealer.status}
                            className="text-[11px] px-2 py-0.5"
                          />
                        </div>

                        {/* 6. ปุ่มจัดการ */}
                        <div className="w-24 px-2 flex justify-end items-center gap-1">
                          <ActionButton
                            href={`/customers/${subDealer.id}`}
                            icon={Eye}
                            label="ดู"
                            colorClass="text-gray-400 text-blue-600 bg-blue-50 border-transparent shadow-none p-1.5"
                          />
                          <ActionButton
                            href={`/customers/${subDealer.id}/edit`}
                            icon={Edit}
                            label="แก้ไข"
                            colorClass="text-gray-400 text-purple-600 bg-purple-50 border-transparent shadow-none p-1.5"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }}
            getRowCanExpand={(row) => {
              const customer = row.original;
              const hasChildren =
                data && data.some((d) => d.parentDealerId === customer.id);
              return hasChildren && customer.customerType === "DEALER";
            }}
          />
        </div>
      }
    />
  );
}

export { ParentDealerInfo } from "../detail-view/parent-dealer-info";
