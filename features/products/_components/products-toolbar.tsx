import React from "react";
import Link from "next/link";
import { PlusCircle } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";

import { ProductsTableProps } from "../_types/types";
import { STATUS_STYLE, ALL_STATUS_VALUE } from "../_lib/constants";

export function ProductsToolbar({
    canCreate,
    searchValue,
    onSearchChange,
    onSearchSubmit,
    statusFilter,
    onStatusFilterChange,
}: Pick<
    ProductsTableProps,
    | "canCreate"
    | "searchValue"
    | "onSearchChange"
    | "onSearchSubmit"
    | "statusFilter"
    | "onStatusFilterChange"
>) {
    return (
        <div className="rounded-md border bg-background/60 p-4 grid gap-4">
            <div className="grid gap-4 lg:grid-cols-3">
                {/* Search Input */}
                <div className="space-y-2">
                    <label className="text-base font-medium mx-2">ค้นหา</label>
                    <Input
                        value={searchValue}
                        onChange={(e) => onSearchChange(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && onSearchSubmit?.()}
                        placeholder="รหัสสินค้า, ชื่อสินค้า"
                        className="mt-2 w-full"
                    />
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

                {/* Create Button */}
                <div className="grid gap-4 lg:items-end mt-4">
                    <div className="flex flex-wrap gap-2 items-center lg:justify-end">
                        {canCreate ? (
                            <Link href="/products/new">
                                <Button className="bg-blue-600 hover:bg-blue-700">
                                    <span className="inline-flex items-center gap-2">
                                        <PlusCircle className="h-4 w-4" />
                                        สร้างสินค้าใหม่
                                    </span>
                                </Button>
                            </Link>
                        ) : (
                            <Button className="w-full lg:w-auto" variant="outline" disabled>
                                <span className="inline-flex items-center gap-2">
                                    <PlusCircle className="h-4 w-4" />
                                    สร้างสินค้าใหม่
                                </span>
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
