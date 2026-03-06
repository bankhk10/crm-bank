"use client";

import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import CustomTable from "@/components/custom/custom-table";
import { TableToolbar } from "@/components/custom/table-toolbar";
import { ResponsiveDataView } from "@/components/custom/responsive-data-view";
import { CompaniesCards } from "./companies-cards";
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
        <TableToolbar
            searchPlaceholder="ค้นหาชื่อบริษัท"
            searchValue={searchValue}
            onSearchChange={onSearchChange}
            onSearchSubmit={onSearchSubmit}
            actions={
                <div className="flex flex-col sm:flex-row gap-2 mt-4 lg:mt-0 xl:mt-0">
                    {canCreate && (
                        <Button asChild className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                            <Link href="/companies/new">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                เพิ่มบริษัท
                            </Link>
                        </Button>
                    )}
                </div>
            }
        />
    );

    return (
        <ResponsiveDataView
            breakpoint="md"
            toolbar={toolbar}
            cards={
                <CompaniesCards
                    data={data}
                    loading={loading}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    onDeleteRequest={onDeleteRequest}
                    pagination={pagination}
                />
            }
            table={
                <CustomTable
                    data={data}
                    columns={columns}
                    loading={loading}
                    pagination={pagination}
                    toolbar={<></>}
                />
            }
        />
    );
}
