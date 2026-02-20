import Link from "next/link";
import { Search, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DateRange } from "react-day-picker";

interface ShippingCompaniesToolbarProps {
    canCreate: boolean;
    searchValue: string;
    onSearchChange: (value: string) => void;
    onSearchSubmit?: () => void;
    dateRange?: DateRange;
    onDateRangeChange: (range: DateRange | undefined) => void;
}

export function ShippingCompaniesToolbar({
    canCreate,
    searchValue,
    onSearchChange,
    onSearchSubmit,
}: ShippingCompaniesToolbarProps) {
    return (
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative w-full sm:max-w-xl">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                    placeholder="ค้นหาชื่อบริษัทขนส่ง, เบอร์โทร, ที่อยู่"
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
                    <Button asChild className="bg-orange-600 hover:bg-orange-700">
                        <Link href="/shipping-companies/new">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            เพิ่มบริษัทขนส่ง
                        </Link>
                    </Button>
                )}
            </div>
        </div>
    );
}
