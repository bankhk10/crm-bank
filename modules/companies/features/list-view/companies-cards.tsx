import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import CompanyCard from "@/modules/companies/ui/company-card";
import type { CompaniesTableProps } from "@/modules/companies/types/types";

type CompaniesCardsProps = Pick<
    CompaniesTableProps,
    "data" | "loading" | "canDelete" | "onDeleteRequest" | "pagination" | "canEdit"
>;

export function CompaniesCards({
    data,
    loading,
    canDelete,
    onDeleteRequest,
    pagination,
    canEdit,
}: CompaniesCardsProps) {
    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <Card key={i} className="animate-pulse">
                        <CardContent className="h-32" />
                    </Card>
                ))}
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground bg-white rounded-lg border border-dashed">
                ไม่พบข้อมูลบริษัท
            </div>
        );
    }

    const totalPages = Math.ceil(pagination.total / pagination.perPage);

    return (
        <div className="space-y-4">
            {data.map((company) => (
                <CompanyCard
                    key={company.id}
                    id={company.id}
                    name={company.name}
                    shortName={company.shortName}
                    email={company.email}
                    phone={company.phone}
                    taxId={company.taxId}
                    status={company.status}
                    canEdit={canEdit}
                    onDelete={canDelete ? () => onDeleteRequest(company) : undefined}
                />
            ))}

            {/* Pagination */}
            <div className="flex items-center justify-between pt-4">
                <div className="text-sm text-muted-foreground">
                    หน้าที่ {pagination.page} จาก {totalPages}
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                            pagination.onPageChange(Math.max(1, pagination.page - 1))
                        }
                        disabled={pagination.page <= 1}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                            pagination.onPageChange(
                                Math.min(totalPages, pagination.page + 1)
                            )
                        }
                        disabled={pagination.page >= totalPages}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
