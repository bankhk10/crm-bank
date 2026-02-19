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
import { ActionButton } from "./action-button";

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
                <div className="px-4 py-3 text-sm text-gray-500 bg-gray-50 border-t">
                  ไม่มีร้านค้าลูกภายใต้ร้านนี้
                </div>
              );
            }

            return (
              <div className="bg-blue-50 border-t">
                <div className="px-4 py-2 text-sm font-medium text-blue-900 bg-blue-100">
                  ร้านค้าลูก ({subDealers.length} ร้าน)
                </div>
                {subDealers.map((subDealer: any) => (
                  <div key={subDealer.id} className="px-4 py-3 border-l-4 border-blue-300 hover:bg-blue-100 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        <div>
                          <div className="font-medium text-blue-900">
                            {subDealer.customerCode} - {subDealer.name}
                          </div>
                          <div className="text-sm text-gray-600">
                            {subDealer.phone} {subDealer.email && `• ${subDealer.email}`}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <CustomerTypeBadge type={subDealer.customerType} />
                        <CustomerStatusBadge status={subDealer.status} className="text-sm" />
                        <div className="flex items-center gap-1">
                          <ActionButton
                            href={`/customers/${subDealer.id}`}
                            icon={Eye}
                            label="ดู"
                            colorClass="text-blue-600 border-blue-100 hover:bg-blue-50 rounded-md"
                          />
                          <ActionButton
                            href={`/customers/${subDealer.id}/edit`}
                            icon={Edit}
                            label="แก้ไข"
                            colorClass="text-purple-600 border-purple-100 hover:bg-purple-50 rounded-md"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
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
