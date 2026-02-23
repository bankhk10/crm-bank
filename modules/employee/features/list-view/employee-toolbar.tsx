import React from "react";
import Link from "next/link";
import { Search, PlusCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function EmployeeToolbar({
    canCreate,
    searchValue,
    onSearchChange,
}: {
    canCreate: boolean;
    searchValue: string;
    onSearchChange: (val: string) => void;
}) {
    return (
        <div className="rounded-md border bg-background/60 p-4 grid gap-4 lg:flex lg:justify-between lg:items-center">
            <div className="relative w-full max-w-md">
                <label className="text-base font-medium mx-2">ค้นหา</label>
                <div className="relative mt-1">
                    <Search className="absolute left-2.5 top-3.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="รหัสพนักงาน, ชื่อ-นามสกุล, อีเมล, เบอร์โทรศัพท์"
                        value={searchValue}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-10 w-full"
                    />
                </div>
            </div>
            <div className="flex items-center gap-2 mt-6">
                {canCreate ? (
                    <Link href="/employee/new" className="w-full lg:w-auto">
                        <Button className="w-full lg:w-auto bg-blue-600 hover:bg-blue-700">
                            <span className="inline-flex items-center gap-2">
                                <PlusCircle className="h-4 w-4" />
                                เพิ่มพนักงาน
                            </span>
                        </Button>
                    </Link>
                ) : (
                    <div className="w-full lg:w-auto">
                        <Button className="w-full" variant="outline" disabled>
                            <span className="inline-flex items-center gap-2">
                                <PlusCircle className="h-4 w-4" />
                                เพิ่มพนักงาน
                            </span>
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
