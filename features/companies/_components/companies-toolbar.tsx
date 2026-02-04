import Link from "next/link";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { Search, PlusCircle, Calendar as CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import type { CompaniesTableProps } from "../_types/types";

type CompaniesToolbarProps = Pick<
    CompaniesTableProps,
    | "canCreate"
    | "searchValue"
    | "onSearchChange"
    | "onSearchSubmit"
    | "dateRange"
    | "onDateRangeChange"
>;

export function CompaniesToolbar({
    canCreate,
    searchValue,
    onSearchChange,
    onSearchSubmit,
    dateRange,
    onDateRangeChange,
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
