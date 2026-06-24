"use client";

import React from "react";
import { ClipboardCheck } from "lucide-react";
import { usePermission } from "@/hooks/use-permission";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PageHeader } from "@/components/custom/page-header";
import { FulfillmentTable } from "./fulfillment-table";
import { useFulfillmentList } from "./use-fulfillment-list";

export default function FulfillmentPage() {
  const { allowed, isLoading } = usePermission("menu.fulfillment");
  const canView = !isLoading && allowed;
  const user = useCurrentUser();

  const {
    sales,
    loading,
    page,
    setPage,
    perPage,
    setPerPage,
    total,
    error,
    filterDraft,
    setFilterDraft,
    isTyping,
    handleSearchSubmit,
    dateRange,
    setDateRange,
    statusFilter,
    setStatusFilter,
    handleClear,
    handleExportPending,
  } = useFulfillmentList();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertDescription>คุณไม่มีสิทธิ์เข้าถึงหน้านี้</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <section className="space-y-6 pb-24 md:pb-8">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="bg-white shadow-sm sm:rounded-lg">
        <div className="p-6">
          <PageHeader
            icon={ClipboardCheck}
            iconClassName="text-blue-600"
            title="จัดการคำสั่งขาย"
          />

          <FulfillmentTable
            sales={sales}
            total={total}
            page={page}
            perPage={perPage}
            loading={loading}
            searchValue={filterDraft.query}
            onSearchChange={(value) => setFilterDraft({ query: value })}
            isTyping={isTyping}
            onSearchSubmit={handleSearchSubmit}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            onPageChange={setPage}
            onPerPageChange={setPerPage}
            onClear={handleClear}
            currentUserId={user?.id}
            statusFilter={statusFilter}
            onStatusFilterChange={(val) => {
              setStatusFilter(val);
              setPage(1);
            }}
            onExportPending={handleExportPending}
          />
        </div>
      </div>
    </section>
  );
}
