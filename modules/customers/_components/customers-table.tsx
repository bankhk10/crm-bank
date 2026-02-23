"use client";

import * as React from "react";
import { Eye, Edit } from "lucide-react";
import CustomTable from "@/components/custom/custom-table";
import { useCustomerColumns } from "../_hooks/use-customer-columns";
import type { CustomersTableProps } from "../_types/types";
import { CustomersToolbar } from "./customers-toolbar";
import { CustomersCards } from "./customers-cards";
import { CustomerTypeBadge } from "./customer-type-badge";
import { CustomerStatusBadge } from "./customer-status-badge";
import { ActionButton } from "@/components/custom/action-button";

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

  return (
    <div className="space-y-6">
      <CustomersToolbar
        canCreate={canCreate}
        canCreateDealer={canCreateDealer}
        canCreateSubdealer={canCreateSubdealer}
        canCreateFarmer={canCreateFarmer}
        canCreateBroker={canCreateBroker}
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        onSearchSubmit={onSearchSubmit}
        customerTypeFilter={customerTypeFilter}
        onCustomerTypeFilterChange={onCustomerTypeFilterChange}
        statusFilter={statusFilter}
        onStatusFilterChange={onStatusFilterChange}
      />

      {/* Desktop Table View */}
      <div className="hidden lg:block relative rounded-lg border shadow-sm bg-white overflow-hidden">
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
            const hasChildren = data && data.some((d) => d.parentDealerId === customer.id);
            return hasChildren && customer.customerType === "DEALER";
          }}
        />
      </div>

      {/* Mobile/Tablet Card View */}
      <div className="lg:hidden">
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
              <button
                className="px-3 py-1 border rounded bg-white disabled:opacity-50"
                onClick={() => pagination.onPageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
              >
                ก่อนหน้า
              </button>
              <span className="text-sm">
                หน้า {pagination.page} / {Math.max(1, Math.ceil(pagination.total / pagination.perPage))}
              </span>
              <button
                className="px-3 py-1 border rounded bg-white disabled:opacity-50"
                onClick={() => pagination.onPageChange(pagination.page + 1)}
                disabled={pagination.page >= Math.ceil(pagination.total / pagination.perPage)}
              >
                ถัดไป
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export { ParentDealerInfo } from "./parent-dealer-info";
