"use client";

import * as React from "react";
import CustomTable from "@/components/custom/custom-table";
import { useCustomerColumns } from "../_hooks/use-customer-columns";
import type { CustomersTableProps } from "../_types/types";
import { CustomersToolbar } from "./customers-toolbar";
import { CustomersCards } from "./customers-cards";

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
        {/* Pagination Reuse or CustomTable's pagination logic? 
            CustomTable usually handles pagination UI inside. 
            For Cards, we might need to expose pagination controls or just rely on the fact 
            that we are handling data via props. 
            Let's add a simple pagination for mobile if CustomTable is hidden.
        */}
        {!loading && pagination.total > 0 && (
          <div className="mt-4 flex justify-center">
            {/* Re-use CustomTable just for pagination? Or simple buttons?
                    CustomTable is coupled with table structure. 
                    Ideally CustomTable should support 'card view' mode. 
                    For now, I'll rely on CustomTable logic but since it is hidden,
                    we need independent pagination controls or just show CustomTable's pagination.
                  */}
            {/* Simple workaround: Render CustomTable for pagination only if needed, 
                     or just duplicate pagination logic. 
                     Let's use a simple pagination component if available. 
                     Or... just let the user use desktop view for heavy pagination.
                     Actually, CustomTable usually renders a Table. 
                     Let's just adding a small pagination block here.
                 */}
            {/* Implementing simple pagination controls */}
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

// Re-export sub-components if needed elsewhere (though better import directly)
export { ParentDealerInfo } from "./parent-dealer-info";
