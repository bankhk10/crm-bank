"use client";

import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import CustomTable from "@/components/custom/custom-table";
import { TableToolbar } from "@/components/custom/table-toolbar";
import { useCompanyColumns } from "@/modules/companies/features/list-view/use-company-columns";
import type { CompaniesTableProps } from "@/modules/companies/types/types";

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
        pagination,
    } = props;

    const columns = useCompanyColumns(onDeleteRequest, canDelete, !!canEdit);

    const toolbar = (
        <div className="space-y-4 mb-6">
            <TableToolbar
                searchPlaceholder="ค้นหาชื่อบริษัท"
                searchValue={searchValue}
                onSearchChange={onSearchChange}
                onSearchSubmit={onSearchSubmit}
            />
            <div className="flex justify-end">
                {canCreate && (
                    <Button asChild className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium">
                        <Link href="/companies/new">
                            <PlusCircle className="h-5 w-5" />
                            เพิ่มบริษัท
                        </Link>
                    </Button>
                )}
            </div>
        </div>
    );

    return (
        <div className="space-y-4">
            {toolbar}
            <div className="w-full">
                <CustomTable
                    data={data}
                    columns={columns}
                    loading={loading}
                    pagination={pagination}
                    toolbar={<></>}
                    className="w-full"
                />
            </div>
        </div>
    );
}
