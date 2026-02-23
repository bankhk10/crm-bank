"use client";

import Link from "next/link";
import { Search, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CustomTable from "@/components/custom/custom-table";
import { CompaniesCards } from "./companies-cards";
import { useCompanyColumns } from "@/modules/companies/features/list-view/use-company-columns";
import type { CompaniesTableProps } from "@/modules/companies/types/types";

type CompaniesToolbarProps = Pick<
    CompaniesTableProps,
    | "canCreate"
    | "searchValue"
    | "onSearchChange"
    | "onSearchSubmit"
    | "dateRange"
    | "onDateRangeChange"
>;

function CompaniesToolbar({
    canCreate,
    searchValue,
    onSearchChange,
    onSearchSubmit,
}: CompaniesToolbarProps) {
    return (
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative w-full sm:max-w-xl">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                    placeholder="ค้นหาชื่อบริษัท"
                    value={searchValue}
                    onChange={(e) => onSearchChange(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            onSearchSubmit?.();
                        }
                    }}
                    className="pl-9 bg-white"
                />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 ml-auto">
                {canCreate && (
                    <Button asChild className="bg-blue-600 hover:bg-blue-700">
                        <Link href="/companies/new">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            เพิ่มบริษัท
                        </Link>
                    </Button>
                )}
            </div>
        </div>
    );
}

export function CompaniesTable(props: CompaniesTableProps) {
    const {
        data,
        loading,
        canCreate,
        canEdit,
        canDelete,
        onDeleteRequest,
        searchValue,
        onSearchChange,
        onSearchSubmit,
        dateRange,
        onDateRangeChange,
        pagination,
    } = props;

    const columns = useCompanyColumns(onDeleteRequest, canDelete, !!canEdit);

    return (
        <div className="space-y-4">
            <CompaniesToolbar
                canCreate={canCreate}
                searchValue={searchValue}
                onSearchChange={onSearchChange}
                onSearchSubmit={onSearchSubmit}
                dateRange={dateRange}
                onDateRangeChange={onDateRangeChange}
            />

            {/* Mobile View */}
            <div className="block md:hidden">
                <CompaniesCards
                    data={data}
                    loading={loading}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    onDeleteRequest={onDeleteRequest}
                    pagination={pagination}
                />
            </div>

            {/* Desktop View */}
            <div className="hidden md:block">
                <CustomTable
                    data={data}
                    columns={columns}
                    loading={loading}
                    pagination={pagination}
                    toolbar={<></>}
                />
            </div>
        </div>
    );
}

