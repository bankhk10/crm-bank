"use client";

import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import {
    ALL_FILTER_VALUE,
    ALL_STATUS_VALUE,
    CUSTOMER_TYPE_STYLE,
    STATUS_STYLE,
} from "../../constants";
import type { CustomersTableProps } from "../../types";

export function CustomersToolbar({
    canCreate,
    canCreateDealer,
    canCreateSubdealer,
    canCreateFarmer,
    canCreateBroker,
    searchValue,
    onSearchChange,
    onSearchSubmit,
    customerTypeFilter,
    onCustomerTypeFilterChange,
    statusFilter,
    onStatusFilterChange,
}: Pick<
    CustomersTableProps,
    | "canCreate"
    | "canCreateDealer"
    | "canCreateSubdealer"
    | "canCreateFarmer"
    | "canCreateBroker"
    | "searchValue"
    | "onSearchChange"
    | "onSearchSubmit"
    | "customerTypeFilter"
    | "onCustomerTypeFilterChange"
    | "statusFilter"
    | "onStatusFilterChange"
>) {
    const customerTypes = Object.keys(CUSTOMER_TYPE_STYLE) as Array<
        keyof typeof CUSTOMER_TYPE_STYLE
    >;

    // Map customer types to their permission flags
    const typePermissions: Record<string, boolean> = {
        DEALER: canCreateDealer ?? false,
        SUBDEALER: canCreateSubdealer ?? false,
        FARMER: canCreateFarmer ?? false,
        BROKER: canCreateBroker ?? false,
    };

    const allowedTypes = customerTypes.filter((type) => typePermissions[type]);

    return (
        <div className="rounded-md border bg-background/60 p-4 grid gap-4">
            <div className="grid gap-4 lg:grid-cols-3">
                {/* Search Input */}
                <div className="space-y-2">
                    <label className="text-base font-medium mx-2">ค้นหา</label>
                    <Input
                        value={searchValue}
                        onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && onSearchSubmit && onSearchSubmit()}
                        placeholder="รหัสลูกค้า, ชื่อ, อีเมล, โทรศัพท์"
                        className="mt-2 w-full"
                    />
                </div>

                {/* Customer Type Filter */}
                <div className="space-y-2">
                    <label className="text-base font-medium mx-2">ประเภทลูกค้า</label>
                    <Select
                        value={customerTypeFilter || ALL_FILTER_VALUE}
                        onValueChange={(v) =>
                            onCustomerTypeFilterChange?.(v === ALL_FILTER_VALUE ? "" : v)
                        }
                    >
                        <SelectTrigger className="mt-2 text-base w-full">
                            <SelectValue placeholder="ทั้งหมด" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL_FILTER_VALUE}>ทั้งหมด</SelectItem>
                            {customerTypes.map((type) => (
                                <SelectItem key={type} value={type}>
                                    {CUSTOMER_TYPE_STYLE[type].label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Status Filter */}
                <div className="space-y-2">
                    <label className="text-base font-medium mx-2">สถานะ</label>
                    <Select
                        value={statusFilter || ALL_STATUS_VALUE}
                        onValueChange={(v) =>
                            onStatusFilterChange?.(v === ALL_STATUS_VALUE ? "" : v)
                        }
                    >
                        <SelectTrigger className="mt-2 text-base w-full">
                            <SelectValue placeholder="ทั้งหมด" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL_STATUS_VALUE}>ทั้งหมด</SelectItem>
                            {Object.entries(STATUS_STYLE).map(([key, { label }]) => (
                                <SelectItem key={key} value={key}>
                                    {label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Create Buttons */}
            <div className="grid gap-4 lg:items-end mt-4">
                <div className="flex flex-wrap gap-2 items-center lg:justify-end">
                    {canCreate && allowedTypes.length > 0 ? (
                        <>
                            {allowedTypes.map((type) => (
                                <Link key={type} href={`/customers/new?type=${type}`}>
                                    <Button className={CUSTOMER_TYPE_STYLE[type].buttonColor}>
                                        <span className="inline-flex items-center gap-2">
                                            <PlusCircle className="h-4 w-4" />
                                            {CUSTOMER_TYPE_STYLE[type].label}
                                        </span>
                                    </Button>
                                </Link>
                            ))}
                        </>
                    ) : (
                        <Button className="w-full lg:w-auto" variant="outline" disabled>
                            <span className="inline-flex items-center gap-2">
                                <PlusCircle className="h-4 w-4" />
                                สร้างลูกค้า
                            </span>
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
