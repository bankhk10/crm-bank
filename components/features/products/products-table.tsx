"use client";

import * as React from "react";
import CustomTable from "@/components/custom/custom-table";
import { ProductsTableProps } from "./types";
import { useProductColumns } from "./hooks/use-product-columns";
import { ProductsToolbar } from "./components/products-toolbar";
import { ProductsCards } from "./components/products-cards";

// Main Table Component
export function ProductsTable(props: ProductsTableProps) {
  const {
    data,
    loading,
    canCreate,
    canView = true,
    canUpdate = false,
    canDelete,
    canManage = false,
    onDeleteRequest,
    searchValue,
    onSearchChange,
    onSearchSubmit,
    statusFilter,
    onStatusFilterChange,
    pagination,
  } = props;

  const columns = useProductColumns(
    onDeleteRequest,
    canView,
    canUpdate,
    canDelete,
    canManage
  );

  const toolbarProps = {
    canCreate,
    searchValue,
    onSearchChange,
    onSearchSubmit,
    statusFilter,
    onStatusFilterChange,
  };

  return (
    <div className="space-y-6">
      {/* Mobile & Tablet: card layout */}
      <div className="xl:hidden space-y-4">
        <ProductsToolbar {...toolbarProps} />
        <ProductsCards
          data={data}
          loading={loading}
          canView={canView}
          canUpdate={canUpdate}
          canManage={canManage}
          canDelete={canDelete}
          onDeleteRequest={onDeleteRequest}
          pagination={pagination}
        />
      </div>

      {/* Desktop & up: table layout */}
      <div className="hidden xl:block">
        <CustomTable
          columns={columns}
          data={data}
          loading={loading}
          pagination={pagination}
          toolbar={<ProductsToolbar {...toolbarProps} />}
          emptyState={{
            title: "ยังไม่มีสินค้า",
            description: "ลองปรับเงื่อนไขการค้นหา หรือสร้างสินค้าใหม่",
          }}
          className="w-full"
        />
      </div>
    </div>
  );
}

export default ProductsTable;
